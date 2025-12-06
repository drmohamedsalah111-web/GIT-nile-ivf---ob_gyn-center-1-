export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  husbandName: string;
  history: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  department?: string; // 'GYNA', 'OBS', 'IVF_STIM', 'IVF_LAB'
  diagnosis: string;
  prescription: PrescriptionItem[];
  notes: string;
  clinical_data?: any; // JSONB for structured clinical data
  vitals?: {
    weight?: number;
    height?: number;
    bmi?: number;
  };
}

export interface PrescriptionItem {
  category: string;
  drug: string;
  dose: string;
}

export interface IvfCycle {
  id: string;
  patientId: string;
  protocol: 'Long' | 'Antagonist' | 'Flare-up';
  startDate: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  logs: StimulationLog[];
  lab?: OpuLabData;
}

export interface StimulationLog {
  id: string;
  date: string;
  cycleDay: number;
  fsh: string;
  hmg: string;
  e2: string;
  lh: string;
  rtFollicles: string;
  ltFollicles: string;
}

export interface OpuLabData {
  oocytesRetrieved: number;
  mii: number;
  fertilized2PN: number;
  embryoGrades: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  email: string;
  name: string;
  specialization?: string;
  phone?: string;
  created_at?: string;
  doctor_image?: string;
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  clinic_image?: string;
  clinic_latitude?: string;
  clinic_longitude?: string;
}

export interface Pregnancy {
  id: string;
  patient_id: string;
  lmp_date?: string;
  edd_date?: string;
  edd_by_scan?: string;
  ga_at_booking?: number;
  risk_level: 'low' | 'moderate' | 'high';
  risk_factors: string[];
  aspirin_prescribed: boolean;
  thromboprophylaxis_needed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AntenatalVisit {
  id: string;
  pregnancy_id: string;
  visit_date: string;
  gestational_age_weeks: number;
  gestational_age_days: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  weight_kg?: number;
  urine_albuminuria?: string;
  urine_glycosuria?: string;
  fetal_heart_sound?: boolean;
  fundal_height_cm?: number;
  edema?: boolean;
  edema_grade?: string;
  notes?: string;
  next_visit_date?: string;
  created_at?: string;
}

export interface BiometryScan {
  id: string;
  pregnancy_id: string;
  scan_date: string;
  gestational_age_weeks: number;
  gestational_age_days: number;
  bpd_mm?: number;
  hc_mm?: number;
  ac_mm?: number;
  fl_mm?: number;
  efw_grams?: number;
  percentile?: number;
  notes?: string;
  created_at?: string;
}

export enum Page {
  HOME = 'home',
  RECEPTION = 'reception',
  CLINICAL = 'clinical',
  GYNECOLOGY = 'gynecology',
  IVF = 'ivf',
  PATIENT_RECORD = 'patient_record',
  SETTINGS = 'settings',
  OBSTETRICS = 'obstetrics'
}