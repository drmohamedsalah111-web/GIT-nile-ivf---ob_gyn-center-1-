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
  diagnosis: string;
  prescription: PrescriptionItem[];
  notes: string;
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

export enum Page {
  HOME = 'home',
  RECEPTION = 'reception',
  CLINICAL = 'clinical',
  IVF = 'ivf',
  SETTINGS = 'settings'
}