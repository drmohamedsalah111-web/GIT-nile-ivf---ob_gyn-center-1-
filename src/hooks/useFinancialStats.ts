import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// You should replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type DateRange = 'today' | 'week' | 'month' | 'year';

interface FinancialStats {
  totalRevenue: number;
  netIncome: number;
  outstandingDebt: number;
  cashInHand: {
    cash: number;
    visa: number;
    insurance: number;
  };
  invoices: any[];
  expenses: any[];
  loading: boolean;
}

function getDateRange(range: DateRange): { from: Date; to: Date } {
  const now = new Date();
  let from = new Date();
  switch (range) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from.setHours(0, 0, 0, 0);
  }
  return { from, to: now };
}

export function useFinancialStats(dateRange: DateRange = 'today', doctorId?: string | null) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      const { from, to } = getDateRange(dateRange);
      // Fetch invoices
      let invoicesQuery = supabase
        .from('invoices')
        .select('*')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());
      if (doctorId) invoicesQuery = invoicesQuery.eq('doctor_id', doctorId).or(`clinic_id.eq.${doctorId}`);
      const { data: invoicesData } = await invoicesQuery;
      // Fetch expenses
      let expensesQuery = supabase
        .from('expenses')
        .select('*')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());
      if (doctorId) expensesQuery = expensesQuery.eq('doctor_id', doctorId).or(`clinic_id.eq.${doctorId}`);
      const { data: expensesData } = await expensesQuery;
      if (isMounted) {
        setInvoices(invoicesData || []);
        setExpenses(expensesData || []);
        setLoading(false);
      }
    };
    fetchData();
    // Real-time subscription
    const subInvoices = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData)
      .subscribe();
    return () => {
      isMounted = false;
      supabase.removeChannel(subInvoices);
    };
  }, [dateRange, doctorId]);

  const stats = useMemo<FinancialStats>(() => {
    let totalRevenue = 0;
    let outstandingDebt = 0;
    let cash = 0, visa = 0, insurance = 0;
    invoices.forEach(inv => {
      totalRevenue += Number(inv.paid_amount || 0);
      outstandingDebt += Number((inv.total || 0) - (inv.paid_amount || 0));
      if (inv.payment_method === 'cash') cash += Number(inv.paid_amount || 0);
      if (inv.payment_method === 'visa') visa += Number(inv.paid_amount || 0);
      if (inv.payment_method === 'insurance') insurance += Number(inv.paid_amount || 0);
    });
    let totalExpenses = 0;
    expenses.forEach(exp => {
      totalExpenses += Number(exp.amount || 0);
    });
    return {
      totalRevenue,
      netIncome: totalRevenue - totalExpenses,
      outstandingDebt,
      cashInHand: { cash, visa, insurance },
      invoices,
      expenses,
      loading,
    };
  }, [invoices, expenses, loading]);

  return stats;
}
