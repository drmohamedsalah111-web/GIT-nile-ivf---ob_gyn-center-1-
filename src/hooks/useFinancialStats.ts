import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { startOfToday, subDays, startOfMonth, startOfYear, formatISO, format } from 'date-fns';

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
      try {
        const { from, to } = getDateRange(dateRange);

        // Fetch doctor info to get the clinic_id if doctorId is a user_id
        let targetClinicId = doctorId;
        if (doctorId) {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('clinic_id')
            .or(`user_id.eq.${doctorId},id.eq.${doctorId}`)
            .single();

          if (doctorData?.clinic_id) {
            targetClinicId = doctorData.clinic_id;
          }
        }

        // Fetch invoices
        let invoicesQuery = supabase
          .from('invoices')
          .select('*')
          .gte('created_at', from.toISOString())
          .lte('created_at', to.toISOString());

        if (targetClinicId) {
          invoicesQuery = invoicesQuery.eq('clinic_id', targetClinicId);
        }

        const { data: invoicesData, error: invErr } = await invoicesQuery;
        if (invErr) throw invErr;

        // Fetch expenses
        let expensesQuery = supabase
          .from('expenses')
          .select('*')
          .gte('created_at', from.toISOString())
          .lte('created_at', to.toISOString());

        if (targetClinicId) {
          expensesQuery = expensesQuery.eq('clinic_id', targetClinicId);
        }

        const { data: expensesData, error: expErr } = await expensesQuery;
        if (expErr) throw expErr;

        if (isMounted) {
          setInvoices(invoicesData || []);
          setExpenses(expensesData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching financial stats:', err);
        if (isMounted) setLoading(false);
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
      // Handle both total_amount (old) and total (new)
      const total = Number(inv.total || inv.total_amount || 0);
      const paid = Number(inv.paid_amount || 0);

      totalRevenue += paid;
      outstandingDebt += Math.max(0, total - paid);

      const method = (inv.payment_method || 'cash').toLowerCase();
      if (method === 'cash') cash += paid;
      else if (method === 'visa') visa += paid;
      else if (method === 'insurance') insurance += paid;
      else cash += paid; // fallback
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
