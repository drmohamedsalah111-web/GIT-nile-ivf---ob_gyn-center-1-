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
  clinical_data?: ClinicalData;
  vitals?: {
    weight?: number;
    height?: number;
    bmi?: number;
  };
}

// Clinical Data Types for JSONB storage
export type ClinicalData = GynecologyData | ObstetricsData | IvfData;

export interface GynecologyData {
  department: 'gynecology';
  hormonalProfile?: HormonalProfile;
  ultrasoundFindings?: UltrasoundFindings;
  diagnosis?: string[];
  clinicalNotes?: string;
}

export interface HormonalProfile {
  fsh?: number; // IU/L
  lh?: number; // IU/L
  e2?: number; // pg/mL
  prolactin?: number; // ng/mL
  tsh?: number; // mIU/L
  amh?: number; // ng/mL
}

export interface UltrasoundFindings {
  uterus?: {
    length?: number; // mm
    width?: number; // mm
    ap?: number; // mm
    orientation?: 'AVF' | 'RVF';
    myometrium?: 'Normal' | 'Adenomyosis' | 'Fibroid';
  };
  endometrium?: {
    thickness?: number; // mm
    pattern?: 'Triple Line' | 'Homogeneous';
  };
  ovaries?: {
    right?: {
      size?: string;
      cysts?: string;
    };
    left?: {
      size?: string;
      cysts?: string;
    };
  };
  pouchOfDouglas?: {
    freeFluid?: boolean;
  };
}

export interface ObstetricsData {
  department: 'obstetrics';
  pregnancyId?: string;
  ancVisit?: AncVisitData;
  fetalBiometry?: FetalBiometryData;
}

export interface AncVisitData {
  gestationalAge?: {
    weeks: number;
    days: number;
  };
  bp?: {
    systolic: number;
    diastolic: number;
  };
  weight?: number; // kg
  urine?: {
    albuminuria?: string;
    glycosuria?: string;
  };
  pallor?: boolean;
  edema?: boolean;
  edemaGrade?: string;
  fetalHeartSound?: boolean;
  fundalHeight?: number; // cm
  notes?: string;
}

export interface FetalBiometryData {
  bpd?: number; // mm
  fl?: number; // mm
  ac?: number; // mm
  hc?: number; // mm
  efw?: number; // grams
  placentaLocation?: string;
  liquor?: {
    afi?: number;
  };
  dopplerIndices?: {
    umbilicalRI?: number;
    mcaPI?: number;
  };
}

export interface IvfData {
  department: 'ivf';
  cycleId?: string;
  labData?: LabData;
  semenPrep?: SemenPrepData;
}

export interface LabData {
  totalOocytes?: number;
  mii?: number; // Mature oocytes
  fertilized2PN?: number;
  cleavageGrade?: string; // Day 3
  blastocystGrade?: string; // Day 5
}

export interface SemenPrepData {
  count?: number; // million/mL
  motility?: number; // %
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
  GYNECOLOGY = 'gynecology',
  OBSTETRICS = 'obstetrics',
  IVF = 'ivf',
  SETTINGS = 'settings'
}