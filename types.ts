export interface Patient {
  id?: string | number;
  name: string;
  age?: number;
  phone: string;
  husbandName?: string;
  medical_history?: any;
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

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  secretary_id?: string;
  appointment_date: string;
  status: 'Scheduled' | 'Waiting' | 'Completed' | 'Cancelled' | 'No Show';
  visit_type: 'Consultation' | 'Follow-up' | 'Procedure';
  notes?: string;
  created_by: string;
  patient?: {
    name: string;
    phone: string;
  };
  doctor?: {
    name: string;
  };
  secretary?: {
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LabRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_names: string[];
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
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
  user_role?: 'doctor' | 'secretary' | 'admin';
  secretary_doctor_id?: string;
  updated_at?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  header_font?: string;
  body_font?: string;
  button_style?: string;
  card_style?: string;
  clinic_watermark?: string;
  prescription_header?: string;
  prescription_footer?: string;
  default_rx_notes?: string;
}

export interface Secretary {
  id: string;
  user_id: string;
  email: string;
  name: string;
  phone?: string;
  doctor_id: string;
  user_role: 'secretary';
  created_at?: string;
  updated_at?: string;
}

export interface ObstetricHistory {
  gravida: number;
  parity_fullterm: number;
  parity_preterm: number;
  abortions: number;
  living: number;
}

export interface MedicalHistory {
  hypertension: boolean;
  diabetes: boolean;
  thyroid: boolean;
  cardiac: boolean;
  dvt_vte: boolean;
  other: string;
}

export interface PastObsHistory {
  preeclampsia: boolean;
  pph: boolean;
  previous_cs: boolean;
  recurrent_abortion: boolean;
  other: string;
}

export interface CurrentRiskFactors {
  smoking: boolean;
  bmi_over_30: boolean;
  rh_negative: boolean;
  twin_pregnancy: boolean;
  advanced_maternal_age: boolean;
  other: string;
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
  obstetric_history?: ObstetricHistory;
  medical_history?: MedicalHistory;
  past_obs_history?: PastObsHistory;
  current_risk_factors?: CurrentRiskFactors;
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
  presentation?: 'Cephalic' | 'Breech' | 'Transverse' | 'Oblique';
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

export interface PregnancyFile {
  id: string;
  pregnancy_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at?: string;
  updated_at?: string;
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

export interface PrintSettings {
  id?: number;
  clinic_id: number;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  header_text: string;
  footer_text: string;
  show_watermark: boolean;
}

export interface PatientData {
  name: string;
  age: number;
  date: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  instructions: string;
}

export interface PrescriptionData {
  patient: PatientData;
  medicines: Medicine[];
}

export enum Page {
  HOME = 'home',
  RECEPTION = 'reception',
  ADD_PATIENT = 'add_patient',
  CLINICAL = 'clinical',
  GYNECOLOGY = 'gynecology',
  IVF = 'ivf',
  SMART_IVF = 'smart_ivf',
  INFERTILITY_WORKUP = 'infertility_workup',
  PATIENT_RECORD = 'patient_record',
  FINANCE = 'finance',
  SETTINGS = 'settings',
  OBSTETRICS = 'obstetrics',
  ADMIN = 'admin',
  SAAS_MANAGEMENT = 'saas_management',
  SUPER_ADMIN = 'super_admin'
}