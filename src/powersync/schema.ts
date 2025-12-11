import { column, Schema, Table } from '@powersync/web';

// Define PowerSync schema matching Supabase tables
const patients = new Table({
    name: column.text,
    age: column.integer,
    phone: column.text,
    husband_name: column.text,
    history: column.text,
    doctor_id: column.text,
    created_at: column.text,
    updated_at: column.text
});

const visits = new Table({
    patient_id: column.text,
    date: column.text,
    department: column.text,
    diagnosis: column.text,
    prescription: column.text,
    notes: column.text,
    clinical_data: column.text,
    created_at: column.text,
    updated_at: column.text
});

const ivf_cycles = new Table({
    patient_id: column.text,
    doctor_id: column.text,
    protocol: column.text,
    status: column.text,
    start_date: column.text,
    assessment_data: column.text,
    lab_data: column.text,
    transfer_data: column.text,
    outcome_data: column.text,
    created_at: column.text,
    updated_at: column.text
});

const stimulation_logs = new Table({
    cycle_id: column.text,
    cycle_day: column.integer,
    date: column.text,
    fsh: column.text,
    hmg: column.text,
    e2: column.text,
    lh: column.text,
    rt_follicles: column.text,
    lt_follicles: column.text,
    created_at: column.text,
    updated_at: column.text
});

const pregnancies = new Table({
    patient_id: column.text,
    doctor_id: column.text,
    lmp_date: column.text,
    edd_date: column.text,
    edd_by_scan: column.text,
    risk_level: column.text,
    risk_factors: column.text,
    aspirin_prescribed: column.integer,
    thromboprophylaxis_needed: column.integer,
    created_at: column.text,
    updated_at: column.text
});

const antenatal_visits = new Table({
    pregnancy_id: column.text,
    visit_date: column.text,
    gestational_age_weeks: column.integer,
    gestational_age_days: column.integer,
    systolic_bp: column.integer,
    diastolic_bp: column.integer,
    weight_kg: column.real,
    urine_albuminuria: column.text,
    urine_glycosuria: column.text,
    fetal_heart_sound: column.text,
    fundal_height_cm: column.real,
    edema: column.integer,
    edema_grade: column.text,
    notes: column.text,
    next_visit_date: column.text,
    created_at: column.text,
    updated_at: column.text
});

const biometry_scans = new Table({
    pregnancy_id: column.text,
    scan_date: column.text,
    gestational_age_weeks: column.integer,
    gestational_age_days: column.integer,
    bpd_mm: column.real,
    hc_mm: column.real,
    ac_mm: column.real,
    fl_mm: column.real,
    efw_grams: column.real,
    percentile: column.real,
    notes: column.text,
    created_at: column.text,
    updated_at: column.text
});

const patient_files = new Table({
    patient_id: column.text,
    file_name: column.text,
    file_type: column.text,
    file_url: column.text,
    file_size: column.integer,
    uploaded_by: column.text,
    created_at: column.text,
    updated_at: column.text
});

const doctors = new Table({
    user_id: column.text,
    email: column.text,
    name: column.text,
    specialization: column.text,
    phone: column.text,
    doctor_image: column.text,
    clinic_name: column.text,
    clinic_address: column.text,
    clinic_phone: column.text,
    created_at: column.text,
    updated_at: column.text
});

const app_settings = new Table({
    clinic_name: column.text,
    logo_url: column.text,
    clinic_address: column.text,
    clinic_phone: column.text,
    primary_color: column.text,
    secondary_color: column.text,
    accent_color: column.text,
    created_at: column.text,
    updated_at: column.text
});

const infertility_workups = new Table({
    patient_id: column.text,
    amh: column.real,
    cycle_regularity: column.text,
    sperm_count: column.integer,
    motility: column.integer,
    morphology: column.integer,
    left_tube: column.text,
    right_tube: column.text,
    cavity_status: column.text,
    diagnosis: column.text,
    plan: column.text,
    created_at: column.text,
    updated_at: column.text
});

export const AppSchema = new Schema({
    patients,
    visits,
    ivf_cycles,
    stimulation_logs,
    pregnancies,
    antenatal_visits,
    biometry_scans,
    patient_files,
    doctors,
    app_settings,
    infertility_workups
});

export type Database = (typeof AppSchema)['types'];
