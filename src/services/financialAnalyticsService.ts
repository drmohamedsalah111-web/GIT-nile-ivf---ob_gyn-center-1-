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
     * Get core financial Kpis for a given date range
     */
    getDashboardStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<FinancialStats> => {
        try {
            // For now, we fetch from the summary view or calculate from invoices
            // Using the view created in migration script
            const { data, error } = await supabase
                .rpc('get_doctor_financial_report', {
                    p_doctor_id: (await supabase.auth.getUser()).data.user?.id, // This might need mapping to doctor id
                    p_start_date: getStartDate(period),
                    p_end_date: new Date().toISOString()
                });

            if (error) throw error;

            // Aggregating the result
            const stats = (data || []).reduce((acc: any, curr: any) => ({
                totalRevenue: acc.totalRevenue + (curr.total_billed || 0),
                totalExpenses: 0, // Placeholder as expense tracking is future scope
                outstandingDebt: acc.outstandingDebt + (curr.outstanding || 0),
                collected: acc.collected + (curr.total_collected || 0)
            }), { totalRevenue: 0, outstandingDebt: 0, collected: 0 });

            return {
                totalRevenue: stats.totalRevenue,
                totalExpenses: 0,
                netProfit: stats.collected, // Simplified for now
                outstandingDebt: stats.outstandingDebt,
                collectionRate: stats.totalRevenue > 0 ? (stats.collected / stats.totalRevenue) * 100 : 0
            };
        } catch (error) {
            console.error('Error fetching financial stats:', error);
            return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, outstandingDebt: 0, collectionRate: 0 };
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
