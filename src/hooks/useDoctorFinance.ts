import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { subDays, startOfToday, formatISO, format } from 'date-fns';

export type DateRange = 'today' | 'week' | 'month' | 'year';

type InvoiceRow = {
  id: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  patient_id?: string | null;
  service_name?: string | null;
  created_by?: string | null;
  payment_method?: string | null;
  status?: string | null;
  patient_name?: string | null;
  created_by_name?: string | null;
};

function getRangeStart(range: DateRange) {
  const now = new Date();
  if (range === 'today') return startOfToday();
  if (range === 'week') return subDays(startOfToday(), 6);
  if (range === 'month') return subDays(startOfToday(), 29);
  return subDays(startOfToday(), 364);
}

export function useDoctorFinance(range: DateRange = 'month') {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchInvoices = async () => {
      try {
        const from = formatISO(getRangeStart(range));
        const { data, error: err } = await supabase
          .from<InvoiceRow>('invoices')
          .select('id,total_amount,paid_amount,created_at,patient_id,service_name,created_by,payment_method,status')
          .gte('created_at', from)
          .order('created_at', { ascending: true });

        if (err) throw err;
        if (!mounted) return;
        const rows = data || [];

        // Fetch patient names and creator names for display
        try {
          const patientIds = Array.from(new Set(rows.map(r => r.patient_id).filter(Boolean)));
          const creatorIds = Array.from(new Set(rows.map(r => r.created_by).filter(Boolean)));

          const [patientsRes, creatorsRes] = await Promise.all([
            patientIds.length ? supabase.from('patients').select('id,name').in('id', patientIds) : Promise.resolve({ data: [] }),
            creatorIds.length ? supabase.from('profiles').select('id,full_name,name,email').in('id', creatorIds) : Promise.resolve({ data: [] }),
          ] as any);

          const patients = patientsRes?.data || [];
          const creators = creatorsRes?.data || [];

          const patientMap: Record<string, string> = {};
          patients.forEach((p: any) => { patientMap[p.id] = p.name || p.full_name || p.email || p.id; });

          const creatorMap: Record<string, string> = {};
          creators.forEach((c: any) => { creatorMap[c.id] = c.full_name || c.name || c.email || c.id; });

          const enriched = rows.map((r: InvoiceRow) => ({
            ...r,
            patient_name: r.patient_id ? patientMap[r.patient_id] || null : null,
            created_by_name: r.created_by ? creatorMap[r.created_by] || null : null,
          }));

          setInvoices(enriched as any);
        } catch (e) {
          // if enrichment fails, still set base rows
          setInvoices(rows);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || String(e));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchInvoices();

    return () => {
      mounted = false;
    };
  }, [range, refreshKey]);

  useEffect(() => {
    const channel = supabase
      .channel('public:invoices:doctor-finance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

    return () => {
      try {
        // @ts-ignore
        channel.unsubscribe();
      } catch {
        try {
          // @ts-ignore
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  const computed = useMemo(() => {
    let total_revenue = 0;
    let pending_debt = 0;
    const byDay: Record<string, number> = {};
    const patients = new Set<string>();

    invoices.forEach((inv) => {
      const paid = Number(inv.paid_amount || 0);
      const total = Number(inv.total_amount || 0);
      total_revenue += paid;
      pending_debt += Math.max(0, total - paid);

      const day = format(new Date(inv.created_at), 'yyyy-MM-dd');
      byDay[day] = (byDay[day] || 0) + paid;

      if (inv.patient_id) patients.add(inv.patient_id);
    });

    // Build series for last N days (based on range)
    const days = [] as { date: string; amount: number }[];
    const start = getRangeStart(range);
    const now = startOfToday();
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const key = format(new Date(d), 'yyyy-MM-dd');
      days.push({ date: key, amount: byDay[key] || 0 });
    }

    const daily_series = days.map((d) => ({ date: d.date, amount: d.amount }));

    const recent = invoices.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return {
      total_revenue,
      pending_debt,
      daily_series,
      patient_count: patients.size,
      recent,
    };
  }, [invoices, range]);

  return {
    invoices,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
    ...computed,
  };
}

export default useDoctorFinance;
