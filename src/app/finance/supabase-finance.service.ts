import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Appointment,
  DailyClosure,
  DoctorReport,
  DoctorReportItem,
  FinanceSummary,
  Payment,
  Patient,
  Service,
  ServiceCharge,
} from './types';

@Injectable({ providedIn: 'root' })
export class SupabaseFinanceService {
  private supabase: SupabaseClient;

  constructor() {
    // Read config from environment. Adjust if you use a different env system.
    const url = (window as any)?.['VITE_SUPABASE_URL'] || (window as any)?.['SUPABASE_URL'] || (process as any)?.env?.VITE_SUPABASE_URL;
    const key = (window as any)?.['VITE_SUPABASE_ANON_KEY'] || (window as any)?.['SUPABASE_ANON_KEY'] || (process as any)?.env?.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase config not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    this.supabase = createClient(url, key);
  }

  // Get Cairo date string YYYY-MM-DD using Intl timezone support
  private getCairoDateString(date?: Date): string {
    const d = date ? new Date(date) : new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
    return fmt.format(d); // en-CA gives YYYY-MM-DD
  }

  // Return ISO range with Cairo timezone offset
  private getTodayRange(): { start: string; end: string; date: string } {
    const date = this.getCairoDateString();
    // Egypt is typically +02:00; using explicit offset in ISO to match Cairo local time boundaries
    const start = `${date}T00:00:00+02:00`;
    const end = `${date}T23:59:59.999+02:00`;
    return { start, end, date };
  }

  // Returns finance summary for today
  public async getTodayFinanceSummary(): Promise<FinanceSummary> {
    const { start, end } = this.getTodayRange();

    // payments
    const paymentsRes = await this.supabase
      .from<Payment>('payments')
      .select('amount', { count: 'exact' })
      .gte('created_at', start)
      .lte('created_at', end);

    if (paymentsRes.error) throw paymentsRes.error;

    const payments = paymentsRes.data || [];
    const countPaymentsToday = payments.length;
    const totalPaymentsToday = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // services
    const servicesRes = await this.supabase
      .from<ServiceCharge>('service_charges')
      .select('id', { count: 'exact' })
      .gte('created_at', start)
      .lte('created_at', end);
    if (servicesRes.error) throw servicesRes.error;
    const countServicesToday = servicesRes.data?.length || 0;

    return {
      totalPaymentsToday: Number(totalPaymentsToday),
      countPaymentsToday: Number(countPaymentsToday),
      countServicesToday: Number(countServicesToday),
    };
  }

  // Ledger: fetch payments and enrich with patient/service names in client
  public async getTodayLedger(): Promise<Array<{ payment: Payment; patient?: Patient; serviceName?: string }>> {
    const { start, end } = this.getTodayRange();

    const paymentsRes = await this.supabase
      .from<Payment>('payments')
      .select('id,patient_id,appointment_id,amount,created_at,created_by')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });
    if (paymentsRes.error) throw paymentsRes.error;
    const payments = paymentsRes.data || [];

    const patientIds = Array.from(new Set(payments.map((p) => p.patient_id).filter(Boolean)));
    const appointmentIds = Array.from(new Set(payments.map((p) => p.appointment_id).filter(Boolean)));

    // batch fetch patients
    const patientsMap: Record<string, Patient> = {};
    if (patientIds.length) {
      const patRes = await this.supabase.from<Patient>('patients').select('id,full_name,phone').in('id', patientIds);
      if (patRes.error) throw patRes.error;
      (patRes.data || []).forEach((p) => (patientsMap[p.id] = p));
    }

    // fetch service_charges for these appointments
    const serviceChargesMapByAppointment: Record<string, ServiceCharge[]> = {};
    if (appointmentIds.length) {
      const scRes = await this.supabase
        .from<ServiceCharge>('service_charges')
        .select('id,service_id,appointment_id,doctor_id,price_at_time,created_at')
        .in('appointment_id', appointmentIds)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });
      if (scRes.error) throw scRes.error;
      (scRes.data || []).forEach((s) => {
        serviceChargesMapByAppointment[s.appointment_id] = serviceChargesMapByAppointment[s.appointment_id] || [];
        serviceChargesMapByAppointment[s.appointment_id].push(s);
      });
    }

    // get all service ids
    const serviceIds = Array.from(
      new Set(
        Object.values(serviceChargesMapByAppointment)
          .flat()
          .map((s) => s.service_id)
          .filter(Boolean)
      )
    );

    const serviceMap: Record<string, Service> = {};
    if (serviceIds.length) {
      const svcRes = await this.supabase.from<Service>('services').select('id,name,price').in('id', serviceIds);
      if (svcRes.error) throw svcRes.error;
      (svcRes.data || []).forEach((s) => (serviceMap[s.id] = s));
    }

    const rows = payments.map((payment) => {
      const patient = patientsMap[payment.patient_id];
      const appointmentId = payment.appointment_id;
      const scs = appointmentId ? serviceChargesMapByAppointment[appointmentId] || [] : [];
      const serviceName = scs.length ? serviceMap[scs[0].service_id]?.name : undefined;
      return { payment, patient, serviceName };
    });

    return rows;
  }

  public async isTodayClosed(): Promise<boolean> {
    const { date } = this.getTodayRange();
    const res = await this.supabase.from<DailyClosure>('daily_closure').select('id').eq('closure_date', date).limit(1).maybeSingle();
    if (res.error) throw res.error;
    return !!res.data?.id;
  }

  // Create service charge and then payment. Blocks if day closed
  public async createChargeAndPayment(payload: {
    patient_id: string;
    appointment_id: string | null;
    service_id: string;
    price_at_time: string | number;
  }): Promise<{ serviceCharge: ServiceCharge; payment: Payment } | null> {
    const closed = await this.isTodayClosed();
    if (closed) throw new Error('Today is closed');

    // fetch appointment to get doctor_id if needed
    let doctorId: string | null = null;
    if (payload.appointment_id) {
      const ap = await this.supabase.from<Appointment>('appointments').select('id,doctor_id').eq('id', payload.appointment_id).maybeSingle();
      if (ap.error) throw ap.error;
      doctorId = ap.data?.doctor_id || null;
    }

    // insert service charge
    const scInsert = await this.supabase.from<ServiceCharge>('service_charges').insert({
      service_id: payload.service_id,
      appointment_id: payload.appointment_id,
      doctor_id: doctorId,
      price_at_time: String(payload.price_at_time),
    }).select().single();
    if (scInsert.error) throw scInsert.error;

    // who is creating
    const userRes = await this.supabase.auth.getUser();
    const createdBy = userRes.data?.user?.id || null;

    // insert payment
    const payInsert = await this.supabase.from<Payment>('payments').insert({
      patient_id: payload.patient_id,
      appointment_id: payload.appointment_id,
      amount: String(payload.price_at_time),
      payment_method: 'cash',
      created_by: createdBy,
    }).select().single();
    if (payInsert.error) throw payInsert.error;

    return { serviceCharge: scInsert.data as ServiceCharge, payment: payInsert.data as Payment };
  }

  public async closeDay(countedCash: number): Promise<DailyClosure> {
    const closed = await this.isTodayClosed();
    if (closed) throw new Error('Today is already closed');
    const { date } = this.getTodayRange();

    const userRes = await this.supabase.auth.getUser();
    const closedBy = userRes.data?.user?.id || null;

    const insertRes = await this.supabase.from<DailyClosure>('daily_closure').insert({
      closure_date: date,
      total_cash: String(countedCash),
      closed_by: closedBy,
    }).select().single();
    if (insertRes.error) throw insertRes.error;
    return insertRes.data as DailyClosure;
  }

  // Doctor report between start and end ISO strings
  public async getDoctorReport(range: { startISO: string; endISO: string }): Promise<DoctorReport> {
    const userRes = await this.supabase.auth.getUser();
    const doctorId = userRes.data?.user?.id;
    if (!doctorId) throw new Error('Not authenticated');

    const scRes = await this.supabase
      .from<ServiceCharge>('service_charges')
      .select('price_at_time')
      .eq('doctor_id', doctorId)
      .gte('created_at', range.startISO)
      .lte('created_at', range.endISO);
    if (scRes.error) throw scRes.error;
    const items = scRes.data || [];
    const totalRevenue = items.reduce((s, it) => s + Number(it.price_at_time || 0), 0);
    const serviceCount = items.length;

    const breakdown = await this.getDoctorBreakdownByService(range);

    return { totalRevenue, serviceCount, breakdown };
  }

  public async getDoctorBreakdownByService(range: { startISO: string; endISO: string }): Promise<DoctorReportItem[]> {
    const userRes = await this.supabase.auth.getUser();
    const doctorId = userRes.data?.user?.id;
    if (!doctorId) throw new Error('Not authenticated');

    const scRes = await this.supabase
      .from<ServiceCharge>('service_charges')
      .select('service_id,price_at_time')
      .eq('doctor_id', doctorId)
      .gte('created_at', range.startISO)
      .lte('created_at', range.endISO);

    if (scRes.error) throw scRes.error;
    const rows = scRes.data || [];

    const grouped: Record<string, { count: number; total: number }> = {};
    rows.forEach((r) => {
      const k = r.service_id;
      if (!grouped[k]) grouped[k] = { count: 0, total: 0 };
      grouped[k].count += 1;
      grouped[k].total += Number(r.price_at_time || 0);
    });

    const items: DoctorReportItem[] = Object.entries(grouped).map(([service_id, v]) => ({ service_id, count: v.count, total: v.total }));

    // fetch service names if needed by caller; return id-based breakdown
    return items;
  }

  // Helper: search patients by name or phone
  public async searchPatients(term: string): Promise<Patient[]> {
    if (!term || term.trim().length < 1) return [];
    const q = `%${term.trim()}%`;
    const res = await this.supabase.from<Patient>('patients').select('id,full_name,phone').or(`full_name.ilike.${q},phone.ilike.${q}`);
    if (res.error) throw res.error;
    return res.data || [];
  }

  // Helper: list appointments for a patient (upcoming or same day, not canceled)
  public async getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    if (!patientId) return [];
    // Use Cairo day boundaries and also allow future appointments
    const { start, end } = this.getTodayRange();
    const res = await this.supabase
      .from<Appointment>('appointments')
      .select('id,patient_id,doctor_id,start_at,status')
      .eq('patient_id', patientId)
      .not('status', 'eq', 'canceled')
      .or(`and(start_at.gte.${start},start_at.lte.${end}),start_at.gte.${new Date().toISOString()}`)
      .order('start_at', { ascending: true });

    if (res.error) throw res.error;
    return res.data || [];
  }

  // Helper: list services
  public async listServices(): Promise<Service[]> {
    const res = await this.supabase.from<Service>('services').select('id,name,price').order('name', { ascending: true });
    if (res.error) throw res.error;
    return res.data || [];
  }
}

