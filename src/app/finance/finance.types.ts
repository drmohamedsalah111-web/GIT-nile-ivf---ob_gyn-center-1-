export interface Patient {
  id: string;
  full_name: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string; // ISO timestamp
  status: string; // e.g. "scheduled", "completed", "cancelled"
}

export interface Service {
  id: string;
  name: string;
  price: number; // in clinic currency units
}

export interface Payment {
  id: string;
  patient_id: string;
  appointment_id?: string | null;
  amount: number;
  payment_method: string;
  created_by: string;
  created_at: string; // ISO timestamp
}

export interface ServiceCharge {
  id: string;
  service_id: string;
  appointment_id: string;
  doctor_id: string;
  price_at_time: number;
  created_at: string; // ISO timestamp
}

export interface DailyClosure {
  id: string;
  closure_date: string; // ISO date or timestamp representing the day closed
  total_cash: number;
  closed_by: string;
  closed_at: string; // ISO timestamp
}

export interface FinanceSummary {
  todayTotal: number;
  paymentsCount: number;
  servicesCount: number;
  isClosed: boolean;
}

export interface LedgerRow {
  time: string; // ISO timestamp or short time string
  patientName: string;
  serviceName: string;
  amount: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DoctorReport {
  totalRevenue: number;
  servicesCount: number;
}

export interface DoctorBreakdownRow {
  serviceId: string;
  serviceName: string;
  count: number;
  total: number;
}
