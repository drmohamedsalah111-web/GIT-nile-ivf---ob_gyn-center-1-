// Finance related TypeScript types

export interface Patient {
  id: string;
  full_name: string;
  phone?: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string; // ISO
  status: string;
}

export interface Service {
  id: string;
  name: string;
  price: string; // numeric as string
}

export interface Payment {
  id: string;
  patient_id: string;
  appointment_id?: string | null;
  amount: string; // numeric as string
  payment_method: string;
  created_by: string;
  created_at: string; // timestamptz
}

export interface ServiceCharge {
  id: string;
  service_id: string;
  appointment_id: string;
  doctor_id: string;
  price_at_time: string; // numeric as string
  created_at: string;
}

export interface DailyClosure {
  id: string;
  closure_date: string; // date
  total_cash: string; // numeric as string
  closed_by: string;
  closed_at: string;
}

export interface FinanceSummary {
  totalPaymentsToday: number;
  countPaymentsToday: number;
  countServicesToday: number;
}

export interface DoctorReportItem {
  service_id: string;
  count: number;
  total: number;
}

export interface DoctorReport {
  totalRevenue: number;
  serviceCount: number;
  breakdown: DoctorReportItem[];
}
