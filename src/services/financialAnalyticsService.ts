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
            const { data, error } = await supabase
                .rpc('get_doctor_financial_report', {
                    p_doctor_id: (await supabase.auth.getUser()).data.user?.id,
                    p_start_date: getStartDate(period),
                    p_end_date: new Date().toISOString()
                });

            if (error) throw error;

            const stats = (data || []).reduce((acc: any, curr: any) => ({
                totalRevenue: acc.totalRevenue + (curr.total_billed || 0),
                totalExpenses: 0,
                outstandingDebt: acc.outstandingDebt + (curr.outstanding || 0),
                collected: acc.collected + (curr.total_collected || 0)
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
     * Get revenue breakdown by service category
     */
    getRevenueByCategory: async (doctorId: string, startDate: string, endDate: string) => {
        try {
            // Simplified query without complex joins for now
            const { data: invoices, error } = await supabase
                .from('invoices')
                .select('id, total, created_at')
                .eq('clinic_id', doctorId)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (error) throw error;

            // For now, return mock data structured correctly
            // TODO: Join with services table to get actual categories
            return [
                { category: 'IVF Services', value: 45000, color: '#8B5CF6' },
                { category: 'Obstetrics', value: 32000, color: '#F59E0B' },
                { category: 'Gynecology', value: 18000, color: '#EF4444' },
                { category: 'Lab Tests', value: 12000, color: '#10B981' },
                { category: 'Procedures', value: 8000, color: '#3B82F6' },
            ];
        } catch (error) {
            console.error('Error fetching revenue by category:', error);
            return [];
        }
    },

    /**
     * Get payment methods distribution
     */
    getPaymentMethodsDistribution: async (doctorId: string, startDate: string, endDate: string) => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('payment_method, total')
                .eq('clinic_id', doctorId)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (error) throw error;

            const methodTotals: Record<string, number> = {};
            data?.forEach((invoice: any) => {
                const method = invoice.payment_method || 'cash';
                methodTotals[method] = (methodTotals[method] || 0) + (invoice.total || 0);
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
     * Get top 10 services by revenue
     */
    getTopServices: async (doctorId: string, startDate: string, endDate: string, limit: number = 10) => {
        try {
            // First get invoices, then get items separately
            const { data: invoices, error: invError } = await supabase
                .from('invoices')
                .select('id')
                .eq('clinic_id', doctorId)
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (invError) throw invError;
            if (!invoices || invoices.length === 0) return [];

            const invoiceIds = invoices.map(inv => inv.id);

            const { data, error } = await supabase
                .from('invoice_items')
                .select('service_name, total')
                .in('invoice_id', invoiceIds);

            if (error) throw error;

            // Aggregate by service name
            const serviceTotals: Record<string, number> = {};
            data?.forEach((item: any) => {
                const serviceName = item.service_name || 'غير محدد';
                serviceTotals[serviceName] = (serviceTotals[serviceName] || 0) + (item.total || 0);
            });

            // Convert to array and sort
            return Object.entries(serviceTotals)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching top services:', error);
            return [];
        }
    },

    /**
     * Get growth comparison with previous period
     */
    getGrowthComparison: async (doctorId: string) => {
        try {
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const [thisMonth, lastMonth] = await Promise.all([
                supabase
                    .from('invoices')
                    .select('total')
                    .eq('clinic_id', doctorId)
                    .gte('created_at', thisMonthStart.toISOString()),
                supabase
                    .from('invoices')
                    .select('total')
                    .eq('clinic_id', doctorId)
                    .gte('created_at', lastMonthStart.toISOString())
                    .lte('created_at', lastMonthEnd.toISOString())
            ]);

            const thisMonthTotal = thisMonth.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
            const lastMonthTotal = lastMonth.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

            const growthRate = lastMonthTotal > 0
                ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                : 0;

            return {
                thisMonth: thisMonthTotal,
                lastMonth: lastMonthTotal,
                growth: growthRate,
                isPositive: growthRate >= 0
            };
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
