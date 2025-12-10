import { ColumnType, Schema } from '@powersync/web';

export const AppSchema = new Schema({
  patients: {
    name: ColumnType.TEXT,
    age: ColumnType.INTEGER,
    phone: ColumnType.TEXT,
    husband_name: ColumnType.TEXT,
    history: ColumnType.TEXT,
    doctor_id: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  visits: {
    patient_id: ColumnType.TEXT,
    date: ColumnType.TEXT,
    department: ColumnType.TEXT,
    diagnosis: ColumnType.TEXT,
    prescription: ColumnType.TEXT,
    notes: ColumnType.TEXT,
    clinical_data: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  ivf_cycles: {
    patient_id: ColumnType.TEXT,
    doctor_id: ColumnType.TEXT,
    protocol: ColumnType.TEXT,
    status: ColumnType.TEXT,
    start_date: ColumnType.TEXT,
    assessment_data: ColumnType.TEXT,
    lab_data: ColumnType.TEXT,
    transfer_data: ColumnType.TEXT,
    outcome_data: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  stimulation_logs: {
    cycle_id: ColumnType.TEXT,
    cycle_day: ColumnType.INTEGER,
    date: ColumnType.TEXT,
    fsh: ColumnType.TEXT,
    hmg: ColumnType.TEXT,
    e2: ColumnType.TEXT,
    lh: ColumnType.TEXT,
    rt_follicles: ColumnType.TEXT,
    lt_follicles: ColumnType.TEXT,
    endometrium_thickness: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  pregnancies: {
    patient_id: ColumnType.TEXT,
    doctor_id: ColumnType.TEXT,
    lmp_date: ColumnType.TEXT,
    edd_date: ColumnType.TEXT,
    edd_by_scan: ColumnType.TEXT,
    risk_level: ColumnType.TEXT,
    risk_factors: ColumnType.TEXT,
    aspirin_prescribed: ColumnType.INTEGER,
    thromboprophylaxis_needed: ColumnType.INTEGER,
    created_at: ColumnType.TEXT
  },
  antenatal_visits: {
    pregnancy_id: ColumnType.TEXT,
    visit_date: ColumnType.TEXT,
    gestational_age_weeks: ColumnType.INTEGER,
    gestational_age_days: ColumnType.INTEGER,
    weight_kg: ColumnType.REAL,
    systolic_bp: ColumnType.INTEGER,
    diastolic_bp: ColumnType.INTEGER,
    notes: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  biometry_scans: {
    pregnancy_id: ColumnType.TEXT,
    scan_date: ColumnType.TEXT,
    efw_grams: ColumnType.INTEGER,
    percentile: ColumnType.INTEGER,
    bpd_mm: ColumnType.REAL,
    hc_mm: ColumnType.REAL,
    ac_mm: ColumnType.REAL,
    fl_mm: ColumnType.REAL,
    notes: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  patient_files: {
    patient_id: ColumnType.TEXT,
    file_url: ColumnType.TEXT,
    file_type: ColumnType.TEXT,
    file_name: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  profiles: {
    email: ColumnType.TEXT,
    name: ColumnType.TEXT,
    role: ColumnType.TEXT,
    created_at: ColumnType.TEXT
  },
  app_settings: {
    clinic_name: ColumnType.TEXT,
    logo_url: ColumnType.TEXT,
    primary_color: ColumnType.TEXT,
    secondary_color: ColumnType.TEXT
  }
} as any);
