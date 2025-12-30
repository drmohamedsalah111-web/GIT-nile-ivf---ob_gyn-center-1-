import { supabase } from '../../services/supabaseClient';

export interface FinancialStats {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    outstandingDebt: number;
    collectionRate: number;
}

export interface RevenueTrend {
    date: string;
    amount: number;
}

export interface ServiceRevenue {
    serviceName: string;
    amount: number;
    percentage: number;
}

export const financialAnalyticsService = {
    /**
     * Get core financial KPIs for a given date range
     */
    getDashboardStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<FinancialStats> => {
        try {
            const user = await supabase.auth.getUser();
            const userId = user.data.user?.id;

            if (!userId) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .rpc('get_doctor_financial_report', {
                    p_doctor_id: userId,
                    p_start_date: getStartDate(period),
                    p_end_date: new Date().toISOString().split('T')[0]
                });

            if (error) throw error;

            const stats = (data || []).reduce((acc: any, curr: any) => ({
                totalRevenue: acc.totalRevenue + (Number(curr.total_billed) || 0),
                outstandingDebt: acc.outstandingDebt + (Number(curr.outstanding) || 0),
                collected: acc.collected + (Number(curr.total_collected) || 0)
            }), { totalRevenue: 0, outstandingDebt: 0, collected: 0 });

            return {
                totalRevenue: stats.totalRevenue,
                totalExpenses: 0,
                netProfit: stats.collected,
                outstandingDebt: stats.outstandingDebt,
                collectionRate: stats.totalRevenue > 0 ? (stats.collected / stats.totalRevenue) * 100 : 0
            };
        } catch (error) {
            console.error('Error fetching financial stats:', error);
            return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, outstandingDebt: 0, collectionRate: 0 };
        }
    },

    /**
     * Helper to resolve IDs
     */
    resolveDoctorInfo: async (id: string) => {
        const { data: doctorData } = await supabase
            .from('doctors')
            .select('id, clinic_id')
            .or(`user_id.eq.${id},id.eq.${id}`)
            .single();
        return doctorData || { id, clinic_id: id };
    },

    /**
     * Get revenue breakdown by service category
     */
    async getRevenueByCategory(doctorId: string, startDate: string, endDate: string) {
        try {
            const info = await financialAnalyticsService.resolveDoctorInfo(doctorId);
            const targetClinicId = info.clinic_id;
            const actualDoctorId = info.id;

            // Fetch from unified view
            const { data: allInvoices, error: invError } = await supabase
                .from('unified_invoices_view')
                .select('id, total_amount, source_type')
                .or(`clinic_id.eq.${targetClinicId},doctor_id.eq.${actualDoctorId}`)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (invError || !allInvoices || allInvoices.length === 0) return [];

            const standardIds = allInvoices.filter(i => i.source_type === 'standard').map(i => i.id);
            const posIds = allInvoices.filter(i => i.source_type === 'pos').map(i => i.id);

            // Fetch items
            const [items, posItems] = await Promise.all([
                standardIds.length > 0 ? supabase.from('invoice_items').select('service_name, total_price, total').in('invoice_id', standardIds) : { data: [] },
                posIds.length > 0 ? supabase.from('pos_invoice_items').select('service_name, description, total_price').in('invoice_id', posIds) : { data: [] }
            ]);

            // Get services for mapping
            const { data: services } = await supabase.from('services').select('name, category').eq('clinic_id', targetClinicId);
            const serviceMap = new Map<string, string>();
            services?.forEach(s => serviceMap.set(s.name.toLowerCase(), s.category));

            const categoryTotals: Record<string, number> = {};
            const processItems = (itemList: any[]) => {
                itemList.forEach(item => {
                    const name = (item.service_name || item.description || '').toLowerCase();
                    const category = serviceMap.get(name) || 'Other';
                    const amount = Number(item.total_price || item.total || 0);
                    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                });
            };

            processItems(items.data || []);
            processItems(posItems.data || []);

            const categoryColors: Record<string, string> = {
                'IVF': '#8B5CF6', 'Outpatient': '#3B82F6', 'Procedure': '#10B981', 'Lab': '#F59E0B', 'Antenatal': '#EC4899', 'Pharmacy': '#6366F1', 'Other': '#9CA3AF'
            };

            return Object.entries(categoryTotals)
                .map(([category, value]) => ({ category, value, color: categoryColors[category] || '#9CA3AF' }))
                .sort((a, b) => b.value - a.value);
        } catch (error) {
            console.error('Error fetching revenue by category:', error);
            return [];
        }
    },

    /**
     * Get payment methods distribution
     */
    async getPaymentMethodsDistribution(doctorId: string, startDate: string, endDate: string) {
        try {
            const info = await financialAnalyticsService.resolveDoctorInfo(doctorId);
            const { data: allInvoices, error } = await supabase
                .from('unified_invoices_view')
                .select('payment_method, total_amount')
                .or(`clinic_id.eq.${info.clinic_id},doctor_id.eq.${info.id}`)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (error || !allInvoices) return [];

            const methodTotals: Record<string, number> = {};
            allInvoices.forEach(inv => {
                const m = (inv.payment_method || 'cash').toLowerCase();
                methodTotals[m] = (methodTotals[m] || 0) + Number(inv.total_amount || 0);
            });

            return Object.entries(methodTotals).map(([name, value]) => ({
                name: name === 'cash' ? 'نقدي' : name === 'visa' ? 'فيزا' : name,
                value,
                color: name === 'cash' ? '#10B981' : '#3B82F6'
            }));
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            return [];
        }
    },

    /**
     * Get top services by revenue
     */
    async getTopServices(doctorId: string, startDate: string, endDate: string, limit: number = 10) {
        try {
            const info = await financialAnalyticsService.resolveDoctorInfo(doctorId);
            const { data: allInvoices, error } = await supabase
                .from('unified_invoices_view')
                .select('id, source_type')
                .or(`clinic_id.eq.${info.clinic_id},doctor_id.eq.${info.id}`)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (error || !allInvoices) return [];

            const stdIds = allInvoices.filter(i => i.source_type === 'standard').map(i => i.id);
            const posIds = allInvoices.filter(i => i.source_type === 'pos').map(i => i.id);

            const [items, posItems] = await Promise.all([
                stdIds.length > 0 ? supabase.from('invoice_items').select('service_name, total_price, total').in('invoice_id', stdIds) : { data: [] },
                posIds.length > 0 ? supabase.from('pos_invoice_items').select('service_name, description, total_price').in('invoice_id', posIds) : { data: [] }
            ]);

            const totals: Record<string, number> = {};
            const process = (list: any[]) => {
                list.forEach(item => {
                    const name = item.service_name || item.description || 'غير محدد';
                    const amount = Number(item.total_price || item.total || 0);
                    totals[name] = (totals[name] || 0) + amount;
                });
            };
            process(items.data || []);
            process(posItems.data || []);

            return Object.entries(totals)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching top services:', error);
            return [];
        }
    },

    /**
     * Get growth comparison
     */
    async getGrowthComparison(doctorId: string) {
        try {
            const info = await financialAnalyticsService.resolveDoctorInfo(doctorId);
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

            const fetchRevenue = async (start: string, end?: string) => {
                let q = supabase.from('unified_invoices_view')
                    .select('total_amount')
                    .or(`clinic_id.eq.${info.clinic_id},doctor_id.eq.${info.id}`)
                    .gte('created_at', start);

                if (end) {
                    q = q.lte('created_at', end);
                }

                const { data } = await q;
                return (data || []).reduce((s, i) => s + Number(i.total_amount || 0), 0);
            };

            const [thisMonthTotal, lastMonthTotal] = await Promise.all([
                fetchRevenue(thisMonthStart),
                fetchRevenue(lastMonthStart, lastMonthEnd)
            ]);

            const growthRate = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
            return { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, growth: growthRate, isPositive: growthRate >= 0 };
        } catch (error) {
            console.error('Error fetching growth comparison:', error);
            return { thisMonth: 0, lastMonth: 0, growth: 0, isPositive: true };
        }
    }
};

function getStartDate(period: string): string {
    const date = new Date();
    switch (period) {
        case 'day': date.setDate(date.getDate() - 1); break;
        case 'week': date.setDate(date.getDate() - 7); break;
        case 'month': date.setMonth(date.getMonth() - 1); break;
        case 'year': date.setFullYear(date.getFullYear() - 1); break;
    }
    return date.toISOString().split('T')[0];
}
