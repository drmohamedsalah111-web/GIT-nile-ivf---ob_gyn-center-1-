import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import type {
  Patient,
  Appointment,
  Service,
  Payment,
  ServiceCharge,
  FinanceSummary,
  LedgerRow,
  DoctorReport,
  DoctorBreakdownRow,
} from './finance.types';
import { getCairoTodayRangeISO } from './finance-date.util';

@Injectable({ providedIn: 'root' })
export class SupabaseFinanceService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  private async getUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw new Error(`Auth error: ${error.message}`);
    const id = data.user?.id;
    if (!id) throw new Error('No authenticated user');
    return id;
  }

  async isTodayClosed(): Promise<boolean> {
    const { fromISO, toISO } = getCairoTodayRangeISO();
    const { data, error } = await this.supabase
      .from('daily_closures')
      .select('id')
      .gte('closure_date', fromISO)
      .lt('closure_date', toISO)
      .limit(1);
    if (error) throw new Error(`Unable to check closure: ${error.message}`);
    return Array.isArray(data) && data.length > 0;
  }

  async getTodaySummary(): Promise<FinanceSummary> {
    const { fromISO, toISO } = getCairoTodayRangeISO();

    const paymentsRes = await this.supabase
      .from<Payment>('payments')
      .select('amount')
      .gte('created_at', fromISO)
      .lt('created_at', toISO);
    if (paymentsRes.error) throw new Error(`Failed to fetch payments: ${paymentsRes.error.message}`);
    const payments = paymentsRes.data ?? [];
    const todayTotal = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

    const servicesRes = await this.supabase
      .from<ServiceCharge>('service_charges')
      .select('id')
      .gte('created_at', fromISO)
      .lt('created_at', toISO);
    if (servicesRes.error) throw new Error(`Failed to fetch service charges: ${servicesRes.error.message}`);
    const servicesCount = servicesRes.data ? servicesRes.data.length : 0;

    const paymentsCount = payments.length;
    const isClosed = await this.isTodayClosed();

    return { todayTotal, paymentsCount, servicesCount, isClosed };
  }

  async getTodayLedger(): Promise<LedgerRow[]> {
    const { fromISO, toISO } = getCairoTodayRangeISO();

    const payRes = await this.supabase
      .from<Payment>('payments')
      .select('*')
      .gte('created_at', fromISO)
      .lt('created_at', toISO)
      .order('created_at', { ascending: false });
    if (payRes.error) throw new Error(`Failed to fetch payments: ${payRes.error.message}`);
    const payments = payRes.data ?? [];

    const patientIds = Array.from(new Set(payments.map((p) => p.patient_id).filter(Boolean)));
    const appointmentIds = Array.from(new Set(payments.map((p) => p.appointment_id).filter(Boolean) as string[]));

    let serviceCharges: ServiceCharge[] = [];
    if (appointmentIds.length > 0) {
      const scRes = await this.supabase
        .from<ServiceCharge>('service_charges')
        .select('*')
        .in('appointment_id', appointmentIds);
      if (scRes.error) throw new Error(`Failed to fetch service charges: ${scRes.error.message}`);
      serviceCharges = scRes.data ?? [];
    }

    const serviceIds = Array.from(new Set(serviceCharges.map((s) => s.service_id).filter(Boolean)));

    const [patientsRes, servicesRes] = await Promise.all([
      this.supabase.from<Patient>('patients').select('*').in('id', patientIds),
      this.supabase.from<Service>('services').select('*').in('id', serviceIds),
    ]);
    if (patientsRes.error) throw new Error(`Failed to fetch patients: ${patientsRes.error.message}`);
    if (servicesRes.error) throw new Error(`Failed to fetch services: ${servicesRes.error.message}`);

    const patientsMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
    const servicesMap = new Map((servicesRes.data ?? []).map((s) => [s.id, s]));

    const ledger: LedgerRow[] = payments.map((p) => {
      const sc = serviceCharges.find((s) => s.appointment_id === p.appointment_id);
      const serviceName = sc ? (servicesMap.get(sc.service_id)?.name ?? 'Unknown') : 'Unknown';
      const patientName = patientsMap.get(p.patient_id)?.full_name ?? 'Unknown';
      const time = p.created_at;
      return { time, patientName, serviceName, amount: p.amount } as LedgerRow;
    });

    return ledger;
  }

  async searchPatients(term: string): Promise<Patient[]> {
    if (!term || term.trim() === '') return [];
    const q = `%${term.trim()}%`;
    const { data, error } = await this.supabase
      .from<Patient>('patients')
      .select('*')
      .or(`full_name.ilike.${q},phone.ilike.${q}`)
      .limit(20);
    if (error) throw new Error(`Failed to search patients: ${error.message}`);
    return data ?? [];
  }

  async getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from<Appointment>('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('start_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(`Failed to fetch appointments: ${error.message}`);
    return data ?? [];
  }

  async getServices(): Promise<Service[]> {
    const { data, error } = await this.supabase.from<Service>('services').select('*').order('name');
    if (error) throw new Error(`Failed to fetch services: ${error.message}`);
    return data ?? [];
  }

  async createChargeAndPayment(input: {
    patientId: string;
    appointmentId: string;
    serviceId: string;
  }): Promise<void> {
    const closed = await this.isTodayClosed();
    if (closed) throw new Error('Cannot create charge: day is already closed');

    const apptRes = await this.supabase
      .from<Appointment>('appointments')
      .select('*')
      .eq('id', input.appointmentId)
      .single();
    if (apptRes.error) throw new Error(`Failed to fetch appointment: ${apptRes.error.message}`);
    const appointment = apptRes.data;
    if (!appointment) throw new Error('Appointment not found');
    const doctorId = appointment.doctor_id;

    const svcRes = await this.supabase.from<Service>('services').select('*').eq('id', input.serviceId).single();
    if (svcRes.error) throw new Error(`Failed to fetch service: ${svcRes.error.message}`);
    const service = svcRes.data;
    if (!service) throw new Error('Service not found');
    const price = service.price;

    const now = new Date().toISOString();
    const scInsert = await this.supabase.from('service_charges').insert({
      service_id: input.serviceId,
      appointment_id: input.appointmentId,
      doctor_id: doctorId,
      price_at_time: price,
      created_at: now,
    });
    if (scInsert.error) throw new Error(`Failed to insert service charge: ${scInsert.error.message}`);

    const userId = await this.getUserId();
    const payInsert = await this.supabase.from('payments').insert({
      patient_id: input.patientId,
      appointment_id: input.appointmentId,
      amount: price,
      payment_method: 'cash',
      created_by: userId,
      created_at: now,
    });
    if (payInsert.error) throw new Error(`Failed to insert payment: ${payInsert.error.message}`);
  }

  async closeDay(countedCash: number): Promise<{ systemTotal: number; difference: number }> {
    const { fromISO, toISO } = getCairoTodayRangeISO();

    const payRes = await this.supabase
      .from<Payment>('payments')
      .select('amount')
      .gte('created_at', fromISO)
      .lt('created_at', toISO);
    if (payRes.error) throw new Error(`Failed to fetch payments: ${payRes.error.message}`);
    const payments = payRes.data ?? [];
    const systemTotal = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

    const userId = await this.getUserId();
    const now = new Date().toISOString();

    const insertRes = await this.supabase.from('daily_closures').insert({
      closure_date: fromISO,
      total_cash: countedCash,
      closed_by: userId,
      closed_at: now,
    });
    if (insertRes.error) throw new Error(`Failed to insert daily closure: ${insertRes.error.message}`);

    return { systemTotal, difference: countedCash - systemTotal };
  }

  async getDoctorReport(rangeISO: { fromISO: string; toISO: string }): Promise<DoctorReport> {
    const userId = await this.getUserId();
    const res = await this.supabase
      .from<ServiceCharge>('service_charges')
      .select('*')
      .gte('created_at', rangeISO.fromISO)
      .lt('created_at', rangeISO.toISO)
      .eq('doctor_id', userId);
    if (res.error) throw new Error(`Failed to fetch service charges: ${res.error.message}`);
    const charges = res.data ?? [];
    const totalRevenue = charges.reduce((s, c) => s + (c.price_at_time ?? 0), 0);
    const servicesCount = charges.length;
    return { totalRevenue, servicesCount };
  }

  async getDoctorBreakdownByService(rangeISO: { fromISO: string; toISO: string }): Promise<DoctorBreakdownRow[]> {
    const userId = await this.getUserId();
    const res = await this.supabase
      .from<ServiceCharge>('service_charges')
      .select('*')
      .gte('created_at', rangeISO.fromISO)
      .lt('created_at', rangeISO.toISO)
      .eq('doctor_id', userId);
    if (res.error) throw new Error(`Failed to fetch service charges: ${res.error.message}`);
    const charges = res.data ?? [];

    const agg = new Map<string, { count: number; total: number }>();
    for (const c of charges) {
      const cur = agg.get(c.service_id) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += c.price_at_time ?? 0;
      agg.set(c.service_id, cur);
    }

    const serviceIds = Array.from(agg.keys());
    const servicesRes = await this.supabase.from<Service>('services').select('*').in('id', serviceIds);
    if (servicesRes.error) throw new Error(`Failed to fetch services: ${servicesRes.error.message}`);
    const servicesMap = new Map((servicesRes.data ?? []).map((s) => [s.id, s]));

    const rows: DoctorBreakdownRow[] = [];
    for (const [serviceId, { count, total }] of agg.entries()) {
      rows.push({ serviceId, serviceName: servicesMap.get(serviceId)?.name ?? 'Unknown', count, total });
    }
    return rows;
  }
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

