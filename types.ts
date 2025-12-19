export interface Patient {
  id?: string | number;
  name: string;
  age?: number;
  phone: string;
  husbandName?: string;
  history?: string;
  createdAt?: string;
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

export interface MaleFactorAssessment {
  volume?: number;
  concentration?: number;
  motility?: number;
  morphology?: number;
  tmsc?: number;
  diagnosis?: string;
  icsiIndicated?: boolean;
}

export interface FemaleFactorAssessment {
  amh?: number;
  fsh?: number;
  lh?: number;
  e2?: number;
  afcRight?: number;
  afcLeft?: number;
  ovaryClassification?: 'Poor Responder' | 'Normal' | 'High Responder';
}

export interface TubalUterineAssessment {
  hsgFindings?: string;
  hysteroscopyFindings?: string;
  septate?: boolean;
  polyps?: boolean;
  adhesions?: boolean;
}

export interface CoupleProfileAssessment {
  age?: number;
  infertilityDuration?: number;
  infertilityType?: 'Primary' | 'Secondary';
  previousAttempts?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  bmiAlert?: boolean;
}

export interface ImagingAssessment {
  baselineUltrasound: {
    uterus: { dimensions: string, myometrium: string, cavity: string };
    endometrium: { thickness: number, pattern: string };
    ovaries: {
      afcRight: number;
      afcLeft: number;
      pathology: { cyst: boolean, endometrioma: boolean, dermoid: boolean };
    };
    adnexa: { hydrosalpinx: boolean };
  };
  hysteroscopyHSG: {
    status: string[];
    actionTaken: string;
  };
}

export interface CycleAssessment {
  coupleProfile?: CoupleProfileAssessment;
  maleFactor?: MaleFactorAssessment;
  femaleFactor?: FemaleFactorAssessment;
  tubalUterine?: TubalUterineAssessment;
  imaging?: ImagingAssessment;
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
  endometriumThickness?: string;
}

export interface OpuLabData {
  opuDate?: string;
  totalOocytes?: number;
  mii?: number;
  mi?: number;
  gv?: number;
  atretic?: number;
  maturationRate?: number;
  fertilizedTwoPN?: number;
  fertilizationRate?: number;
  embryoDay3A?: number;
  embryoDay3B?: number;
  embryoDay3C?: number;
  blastocystsExpanded?: number;
  blastocystsHatching?: number;
}

export interface TransferData {
  transferDate?: string;
  numberTransferred?: number;
  embryoQuality?: string;
  catheterDifficulty?: 'Easy' | 'Moderate' | 'Difficult';
  lutealSupport?: string[];
}

export interface OutcomeData {
  betaHcg?: number;
  betaHcgPositive?: boolean;
  clinicalPregnancy?: boolean;
  gestationalSac?: boolean;
  fHR?: boolean;
}

export interface IvfCycle {
  id: string;
  patientId: string;
  protocol: 'Long' | 'Antagonist' | 'Flare-up' | 'Mini-IVF';
  startDate: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  assessment?: CycleAssessment;
  logs: StimulationLog[];
  lab?: OpuLabData;
  transfer?: TransferData;
  outcome?: OutcomeData;
  cycleData?: any;
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
  prescription?: PrescriptionItem[];
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

export interface ObstetricsData {
  id?: string;
  patientId: string;
  lmp: string | null;
  edd: string | null;
  gestationalAge?: string;
  riskFactors: string[];
  isHighRisk: boolean;
  notes?: string;
}

export interface AntenatalVisitData {
  id: string;
  date: string;
  gaWeeks: number;
  bp: string;
  weight: string;
  urine: string;
  fetalHeart: string;
  fundalHeight?: string;
  edema?: string;
  notes: string;
}

export interface FetalBiometryData {
  date: string;
  bpd?: number;
  fl?: number;
  ac?: number;
  hc?: number;
  efw?: number;
  afi?: number;
  placenta?: string;
}

export enum Page {
  HOME = 'home',
  RECEPTION = 'reception',
  CLINICAL = 'clinical',
  GYNECOLOGY = 'gynecology',
  IVF = 'ivf',
  SMART_IVF = 'smart_ivf',
  PATIENT_RECORD = 'patient_record',
  SETTINGS = 'settings',
  OBSTETRICS = 'obstetrics',
  ADMIN = 'admin'
}