import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { startOfToday, subDays, startOfMonth, startOfYear, formatISO, format } from 'date-fns';

export type DateRange = 'today' | 'week' | 'month' | 'year';

type Invoice = {
  id: string;
  total_amount: number;
  paid_amount: number;
  payment_method?: string | null;
  discount_amount?: number | null;
  profit_share?: number | null;
  created_at: string;
  status?: string | null;
  service_name?: string | null;
  patient_name?: string | null;
  created_by?: string | null;
};

type Expense = {
  id: string;
  amount: number;
  created_at: string;
  description?: string | null;
};

export function useFinancialStats(dateRange: DateRange = 'month', _optionalUserId?: string | null) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // small counter to force refetch on realtime events
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const getRangeStart = (r: DateRange) => {
    const now = new Date();
    if (r === 'today') return startOfToday();
    if (r === 'week') return subDays(startOfToday(), 6); // last 7 days
    if (r === 'month') return startOfMonth(now);
    return startOfYear(now);
  };

  const startDate = getRangeStart(dateRange);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const fromIso = formatISO(startDate);

        const { data: invData, error: invErr } = await supabase
          .from<Invoice>('invoices')
          .select('*')
          .gte('created_at', fromIso)
          .order('created_at', { ascending: false });

        if (invErr) throw invErr;

        const { data: expData, error: expErr } = await supabase
          .from<Expense>('expenses')
          .select('*')
          .gte('created_at', fromIso)
          .order('created_at', { ascending: false });

        if (expErr) throw expErr;

        if (!mounted) return;
        setInvoices(invData || []);
        setExpenses(expData || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || String(e));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [dateRange, refreshKey]);

  // realtime subscription to invoices changes
  useEffect(() => {
    // Supabase v2 realtime channel subscribe for postgres changes
    const channel = supabase
      .channel('public:invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        // trigger a refetch
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

    return () => {
      // unsubscribe safely
      try {
        // @ts-ignore - unsubscribe may exist on the channel
        channel.unsubscribe();
      } catch (e) {
        // fallback: remove channel by name (no-op if not supported)
        try {
          // @ts-ignore
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  const stats = useMemo(() => {
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    const totalRevenue = sum(invoices.map((i) => Number(i.paid_amount || 0)));
    const totalExpenses = sum(expenses.map((e) => Number(e.amount || 0)));

    const outstandingDebt = invoices
      .filter((i) => {
        const s = (i.status || '').toLowerCase();
        return s === 'pending' || s === 'partial' || s === 'unpaid' || !s;
      })
      .reduce((acc, i) => acc + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

    const cashInHand = invoices.reduce<Record<string, number>>((acc, i) => {
      const method = (i.payment_method || 'unknown').toLowerCase();
      const paid = Number(i.paid_amount || 0);
      acc[method] = (acc[method] || 0) + paid;
      return acc;
    }, {});

    // revenue trend grouped by day
    const byDay = invoices.reduce<Record<string, number>>((acc, i) => {
      const day = format(new Date(i.created_at), 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + Number(i.paid_amount || 0);
      return acc;
    }, {});

    const revenueTrend = Object.keys(byDay)
      .sort()
      .map((d) => ({ date: d, revenue: byDay[d] }));

    // payment mix
    const paymentMix = Object.entries(cashInHand).map(([method, value]) => ({ method, value }));

    // top services
    const services = invoices.reduce<Record<string, number>>((acc, i) => {
      const svc = i.service_name || 'غير محدد';
      acc[svc] = (acc[svc] || 0) + Number(i.paid_amount || 0);
      return acc;
    }, {});

    const topServices = Object.entries(services)
      .map(([service, value]) => ({ service, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const recentTransactions = invoices
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        patient_name: t.patient_name,
        service_name: t.service_name,
        amount: Number(t.total_amount || 0),
        paid_amount: Number(t.paid_amount || 0),
        status: t.status,
        payment_method: t.payment_method,
        created_at: t.created_at,
        created_by: t.created_by,
      }));

    const netIncome = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      outstandingDebt,
      cashInHand,
      revenueTrend,
      paymentMix,
      topServices,
      recentTransactions,
    };
  }, [invoices, expenses]);

  return {
    ...stats,
    invoices,
    expenses,
    loading,
    error,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}

export default useFinancialStats;
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
