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

        // Fetch doctor info to get the clinic_id and the doctor record ID
        let targetClinicId = doctorId;
        let actualDoctorId = doctorId;

        if (doctorId) {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('id, clinic_id')
            .or(`user_id.eq.${doctorId},id.eq.${doctorId}`)
            .single();

          if (doctorData) {
            targetClinicId = doctorData.clinic_id;
            actualDoctorId = doctorData.id;
          }
        }

        // Fetch standard invoices
        let invQuery = supabase
          .from('invoices')
          .select('*')
          .gte('created_at', from.toISOString())
          .lte('created_at', to.toISOString());

        if (actualDoctorId || targetClinicId) {
          invQuery = invQuery.or(`clinic_id.eq.${targetClinicId},doctor_id.eq.${actualDoctorId},clinic_id.eq.${actualDoctorId}`);
        }

        const { data: invData, error: invErr } = await invQuery;
        if (invErr) throw invErr;

        // Fetch POS invoices
        let posQuery = supabase
          .from('pos_invoices')
          .select('*')
          .gte('created_at', from.toISOString())
          .lte('created_at', to.toISOString());

        if (actualDoctorId || targetClinicId) {
          posQuery = posQuery.or(`clinic_id.eq.${targetClinicId},clinic_id.eq.${actualDoctorId}`);
        }

        const { data: posData, error: posErr } = await posQuery;
        if (posErr) {
          console.warn('POS invoices table not found or error:', posErr.message);
        }

        const mergedInvoices = [
          ...(invData || []),
          ...(posData || []).map(p => ({ ...p, is_pos: true }))
        ];

        // Fetch expenses
        let expensesQuery = supabase
          .from('expenses')
          .select('*')
          .gte('created_at', from.toISOString())
          .lte('created_at', to.toISOString());

        if (actualDoctorId || targetClinicId) {
          expensesQuery = expensesQuery.or(`clinic_id.eq.${targetClinicId},clinic_id.eq.${actualDoctorId}`);
        }

        const { data: expensesData, error: expErr } = await expensesQuery;
        if (expErr) throw expErr;

        if (isMounted) {
          setInvoices(mergedInvoices);
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
      .channel('financial-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_invoices' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchData)
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
