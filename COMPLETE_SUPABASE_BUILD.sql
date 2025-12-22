-- ============================================================================
-- 🏥 NILE IVF & OB/GYN CENTER - COMPLETE SUPABASE BUILD FROM SCRATCH
-- ============================================================================
-- نظام إدارة عيادات الحقن المجهري وأمراض النساء والتوليد
-- تاريخ الإنشاء: 2024
-- ============================================================================
-- ⚠️ تحذير: هذا السكربت يمسح كل البيانات الموجودة ويبني من الصفر!
-- ============================================================================

-- ============================================================================
-- 📍 PART 1: CLEANUP - تنظيف قاعدة البيانات
-- ============================================================================

-- تعطيل RLS مؤقتاً
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- حذف جميع السياسات (Policies)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- حذف جميع Triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- حذف الجداول بالترتيب الصحيح (الجداول المعتمدة أولاً)
DROP TABLE IF EXISTS stimulation_logs CASCADE;
DROP TABLE IF EXISTS biometry_scans CASCADE;
DROP TABLE IF EXISTS antenatal_visits CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS patient_documents CASCADE;
DROP TABLE IF EXISTS infertility_workups CASCADE;
DROP TABLE IF EXISTS ivf_cycles CASCADE;
DROP TABLE IF EXISTS pregnancies CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- حذف الـ Custom Types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS cycle_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS risk_level CASCADE;

-- حذف الـ Functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_doctor_id_from_auth() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ============================================================================
-- 📍 PART 2: CREATE CUSTOM TYPES - إنشاء الأنواع المخصصة
-- ============================================================================

CREATE TYPE user_role AS ENUM ('doctor', 'secretary', 'admin');
CREATE TYPE cycle_status AS ENUM ('Active', 'Completed', 'Cancelled', 'On Hold');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'waiting', 'in-progress', 'completed', 'cancelled', 'no-show');
CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'high');

-- ============================================================================
-- 📍 PART 3: CREATE TABLES - إنشاء الجداول
-- ============================================================================

-- ============================================
-- 3.1 PROFILES TABLE (يربط مع Supabase Auth)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'doctor',
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'ملفات المستخدمين المرتبطة بـ Supabase Auth';

-- ============================================
-- 3.2 DOCTORS TABLE - جدول الأطباء
-- ============================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT, -- الاسم بالعربي
    specialty TEXT DEFAULT 'IVF & Reproductive Medicine',
    specialty_ar TEXT DEFAULT 'الحقن المجهري وطب الإنجاب',
    phone TEXT,
    license_number TEXT,
    user_role TEXT DEFAULT 'doctor' CHECK (user_role IN ('doctor', 'secretary', 'admin')),
    secretary_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    
    -- Branding Info
    doctor_image TEXT,
    clinic_name TEXT,
    clinic_name_ar TEXT,
    clinic_address TEXT,
    clinic_address_ar TEXT,
    clinic_phone TEXT,
    clinic_image TEXT,
    clinic_logo TEXT,
    clinic_latitude TEXT,
    clinic_longitude TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    working_hours JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE doctors IS 'جدول الأطباء والسكرتارية';

-- ============================================
-- 3.3 PATIENTS TABLE - جدول المرضى
-- ============================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    name_ar TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    phone2 TEXT,
    national_id TEXT,
    birth_date DATE,
    age INTEGER,
    gender TEXT DEFAULT 'female' CHECK (gender IN ('male', 'female')),
    
    -- Address
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Egypt',
    
    -- Medical Info
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
    allergies TEXT[],
    chronic_diseases TEXT[],
    current_medications TEXT[],
    
    -- Marital Status (important for IVF)
    marital_status TEXT DEFAULT 'married' CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    husband_name TEXT,
    husband_phone TEXT,
    husband_blood_type TEXT,
    marriage_duration_years INTEGER,
    
    -- Fertility History
    gravida INTEGER DEFAULT 0,  -- عدد مرات الحمل
    para INTEGER DEFAULT 0,     -- عدد الولادات
    abortions INTEGER DEFAULT 0, -- عدد الإجهاضات
    living_children INTEGER DEFAULT 0,
    
    -- IVF Specific
    previous_ivf_attempts INTEGER DEFAULT 0,
    amh_level DECIMAL(5,2),
    fsh_level DECIMAL(5,2),
    
    -- Additional
    medical_history JSONB DEFAULT '{}',
    notes TEXT,
    rx_notes TEXT, -- ملاحظات الروشتة
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE patients IS 'جدول المرضى - معلومات المريضات والأزواج';

-- ============================================
-- 3.4 APPOINTMENTS TABLE - جدول المواعيد
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    secretary_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    
    -- Visit Info
    visit_type TEXT DEFAULT 'consultation' CHECK (visit_type IN ('consultation', 'follow-up', 'procedure', 'ultrasound', 'lab', 'ivf-monitoring', 'embryo-transfer', 'pregnancy-check')),
    visit_reason TEXT,
    
    -- Notes
    notes TEXT,
    doctor_notes TEXT,
    
    -- Tracking
    checked_in_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE appointments IS 'جدول المواعيد';

-- ============================================
-- 3.5 IVF_CYCLES TABLE - جدول دورات الحقن المجهري
-- ============================================
CREATE TABLE ivf_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Cycle Info
    cycle_number INTEGER DEFAULT 1,
    protocol TEXT DEFAULT 'Antagonist' CHECK (protocol IN ('Antagonist', 'Long Agonist', 'Short Agonist', 'Mild Stimulation', 'Natural', 'Mini IVF', 'Frozen', 'Other')),
    status cycle_status NOT NULL DEFAULT 'Active',
    
    -- Dates
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Phase 1: Assessment
    assessment_date DATE,
    assessment_data JSONB DEFAULT '{
        "amh": null,
        "fsh": null,
        "lh": null,
        "e2": null,
        "afc_right": null,
        "afc_left": null,
        "uterus": null,
        "endometrium": null,
        "notes": null
    }',
    
    -- Phase 2: Stimulation
    stimulation_start_date DATE,
    stimulation_protocol TEXT,
    stimulation_medications JSONB DEFAULT '[]',
    trigger_date DATE,
    trigger_medication TEXT,
    
    -- Phase 3: Lab/Retrieval
    retrieval_date DATE,
    eggs_retrieved INTEGER,
    mature_eggs INTEGER,
    eggs_fertilized INTEGER,
    fertilization_method TEXT CHECK (fertilization_method IN ('IVF', 'ICSI', 'Split', NULL)),
    lab_data JSONB DEFAULT '{
        "day1_embryos": null,
        "day3_embryos": null,
        "day5_blastocysts": null,
        "embryos_frozen": null,
        "frozen_date": null,
        "notes": null
    }',
    
    -- Phase 4: Transfer
    transfer_date DATE,
    embryos_transferred INTEGER,
    embryo_quality TEXT,
    transfer_difficulty TEXT CHECK (transfer_difficulty IN ('Easy', 'Moderate', 'Difficult', NULL)),
    transfer_data JSONB DEFAULT '{
        "embryo_grades": [],
        "catheter_used": null,
        "ultrasound_guidance": true,
        "notes": null
    }',
    
    -- Phase 5: Outcome
    pregnancy_test_date DATE,
    pregnancy_test_result BOOLEAN,
    beta_hcg_value DECIMAL(10,2),
    clinical_pregnancy BOOLEAN,
    heartbeat_date DATE,
    outcome_data JSONB DEFAULT '{
        "final_outcome": null,
        "delivery_date": null,
        "pregnancy_type": null,
        "notes": null
    }',
    
    -- Additional
    notes TEXT,
    complications TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ivf_cycles IS 'جدول دورات الحقن المجهري';

-- ============================================
-- 3.6 STIMULATION_LOGS TABLE - سجلات التنشيط
-- ============================================
CREATE TABLE stimulation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    
    -- Day Info
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_number INTEGER NOT NULL,
    
    -- Medications
    medications JSONB NOT NULL DEFAULT '[]',
    /* Example: [
        {"name": "Gonal-F", "dose": 225, "unit": "IU"},
        {"name": "Merional", "dose": 75, "unit": "IU"},
        {"name": "Cetrotide", "dose": 0.25, "unit": "mg"}
    ] */
    
    -- Ultrasound Findings
    ultrasound_findings JSONB DEFAULT '{
        "right_follicles": [],
        "left_follicles": [],
        "endometrium_thickness": null,
        "endometrium_pattern": null,
        "fluid": null,
        "notes": null
    }',
    
    -- Hormone Levels
    hormone_levels JSONB DEFAULT '{
        "e2": null,
        "lh": null,
        "progesterone": null
    }',
    
    -- Decision
    decision TEXT, -- continue, trigger, cancel, coast
    next_appointment DATE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stimulation_logs IS 'سجلات متابعة التنشيط اليومية';

-- ============================================
-- 3.7 PREGNANCIES TABLE - جدول الحمل
-- ============================================
CREATE TABLE pregnancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
    
    -- Pregnancy Info
    lmp_date DATE,
    edd_date DATE,
    edd_by_scan DATE,
    conception_method TEXT DEFAULT 'natural' CHECK (conception_method IN ('natural', 'IVF', 'ICSI', 'IUI', 'FET')),
    
    -- Gestational Age
    ga_at_booking_weeks INTEGER,
    ga_at_booking_days INTEGER,
    
    -- Risk Assessment
    risk_level risk_level DEFAULT 'low',
    risk_factors JSONB DEFAULT '[]',
    
    -- Status
    status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'delivered', 'miscarriage', 'ectopic', 'molar', 'terminated')),
    pregnancy_type TEXT DEFAULT 'singleton' CHECK (pregnancy_type IN ('singleton', 'twins', 'triplets', 'higher-order')),
    
    -- Medications
    aspirin_prescribed BOOLEAN DEFAULT FALSE,
    progesterone_support BOOLEAN DEFAULT FALSE,
    thromboprophylaxis BOOLEAN DEFAULT FALSE,
    
    -- Outcome
    delivery_date DATE,
    delivery_type TEXT CHECK (delivery_type IN ('vaginal', 'cs-elective', 'cs-emergency', NULL)),
    birth_weight_grams INTEGER,
    baby_gender TEXT CHECK (baby_gender IN ('male', 'female', NULL)),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pregnancies IS 'جدول متابعة الحمل';

-- ============================================
-- 3.8 ANTENATAL_VISITS TABLE - زيارات المتابعة
-- ============================================
CREATE TABLE antenatal_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
    
    -- Visit Info
    visit_date DATE NOT NULL,
    gestational_age_weeks INTEGER,
    gestational_age_days INTEGER,
    
    -- Vitals
    weight_kg DECIMAL(5,2),
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    pulse INTEGER,
    
    -- Examination
    fundal_height_cm DECIMAL(5,2),
    fetal_heart_rate INTEGER,
    fetal_movement BOOLEAN,
    presentation TEXT CHECK (presentation IN ('cephalic', 'breech', 'transverse', 'unstable', NULL)),
    
    -- Urine Analysis
    urine_protein TEXT CHECK (urine_protein IN ('negative', 'trace', '+', '++', '+++', '++++', NULL)),
    urine_glucose TEXT CHECK (urine_glucose IN ('negative', 'trace', '+', '++', '+++', '++++', NULL)),
    
    -- Edema
    edema BOOLEAN DEFAULT FALSE,
    edema_grade TEXT CHECK (edema_grade IN ('mild', 'moderate', 'severe', NULL)),
    
    -- Symptoms/Complaints
    complaints TEXT[],
    
    -- Plan
    notes TEXT,
    prescriptions TEXT,
    next_visit_date DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE antenatal_visits IS 'زيارات متابعة الحمل';

-- ============================================
-- 3.9 BIOMETRY_SCANS TABLE - سونار قياسات الجنين
-- ============================================
CREATE TABLE biometry_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
    
    -- Scan Info
    scan_date DATE NOT NULL,
    gestational_age_weeks INTEGER,
    gestational_age_days INTEGER,
    scan_type TEXT DEFAULT 'routine' CHECK (scan_type IN ('dating', 'nuchal', 'anomaly', 'growth', 'routine', 'doppler')),
    
    -- Biometry Measurements (in mm)
    bpd_mm DECIMAL(5,2),  -- Biparietal Diameter
    hc_mm DECIMAL(5,2),   -- Head Circumference
    ac_mm DECIMAL(5,2),   -- Abdominal Circumference
    fl_mm DECIMAL(5,2),   -- Femur Length
    hl_mm DECIMAL(5,2),   -- Humerus Length
    
    -- Estimated Fetal Weight
    efw_grams INTEGER,
    efw_percentile INTEGER,
    
    -- Doppler
    ua_pi DECIMAL(4,2),   -- Umbilical Artery PI
    ua_ri DECIMAL(4,2),   -- Umbilical Artery RI
    mca_pi DECIMAL(4,2),  -- Middle Cerebral Artery PI
    cpr DECIMAL(4,2),     -- Cerebroplacental Ratio
    
    -- Amniotic Fluid
    afi_cm DECIMAL(5,2),  -- Amniotic Fluid Index
    dvp_cm DECIMAL(4,2),  -- Deepest Vertical Pocket
    
    -- Placenta
    placenta_location TEXT CHECK (placenta_location IN ('anterior', 'posterior', 'fundal', 'lateral', 'low-lying', 'previa', NULL)),
    placenta_grade TEXT CHECK (placenta_grade IN ('0', 'I', 'II', 'III', NULL)),
    
    -- Assessment
    growth_assessment TEXT CHECK (growth_assessment IN ('normal', 'SGA', 'LGA', 'IUGR', NULL)),
    
    notes TEXT,
    images JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE biometry_scans IS 'سونار قياسات الجنين';

-- ============================================
-- 3.10 LAB_RESULTS TABLE - نتائج التحاليل
-- ============================================
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE SET NULL,
    
    -- Test Info
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_type TEXT NOT NULL,
    test_category TEXT DEFAULT 'general' CHECK (test_category IN ('hormones', 'blood', 'urine', 'infectious', 'genetic', 'semen', 'imaging', 'general')),
    
    -- Results
    results JSONB NOT NULL DEFAULT '{}',
    /* Example for hormones:
    {
        "FSH": {"value": 6.5, "unit": "mIU/mL", "normal_range": "3.5-12.5"},
        "LH": {"value": 4.2, "unit": "mIU/mL", "normal_range": "2.4-12.6"},
        "E2": {"value": 45, "unit": "pg/mL", "normal_range": "30-400"},
        "AMH": {"value": 2.8, "unit": "ng/mL", "normal_range": "1.0-3.5"}
    }
    */
    
    -- Lab Info
    lab_name TEXT,
    report_file_path TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lab_results IS 'نتائج التحاليل المعملية';

-- ============================================
-- 3.11 INFERTILITY_WORKUPS TABLE - ملف العقم
-- ============================================
CREATE TABLE infertility_workups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Assessment Date
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Female Assessment
    female_data JSONB DEFAULT '{
        "age": null,
        "bmi": null,
        "duration_of_infertility_years": null,
        "type": null,
        "menstrual_history": {
            "cycle_length": null,
            "cycle_regularity": null,
            "dysmenorrhea": false
        },
        "ovarian_reserve": {
            "amh": null,
            "fsh": null,
            "afc": null
        },
        "tubal_status": {
            "hsg_done": false,
            "hsg_result": null,
            "laparoscopy_done": false,
            "laparoscopy_result": null
        },
        "uterine_assessment": {
            "ultrasound": null,
            "hysteroscopy_done": false,
            "hysteroscopy_result": null
        },
        "diagnoses": []
    }',
    
    -- Male Assessment
    male_data JSONB DEFAULT '{
        "age": null,
        "semen_analysis": {
            "date": null,
            "volume_ml": null,
            "count_million_per_ml": null,
            "motility_percent": null,
            "morphology_percent": null,
            "dna_fragmentation": null
        },
        "hormone_profile": {
            "fsh": null,
            "lh": null,
            "testosterone": null
        },
        "diagnoses": []
    }',
    
    -- Combined Assessment
    diagnosis TEXT,
    diagnosis_ar TEXT,
    recommendations TEXT,
    treatment_plan TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE infertility_workups IS 'ملف تقييم العقم';

-- ============================================
-- 3.12 PATIENT_DOCUMENTS TABLE - مستندات المريض
-- ============================================
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Document Info
    document_type TEXT NOT NULL CHECK (document_type IN ('lab_report', 'ultrasound', 'prescription', 'referral', 'consent', 'medical_report', 'id_document', 'insurance', 'other')),
    document_name TEXT NOT NULL,
    description TEXT,
    
    -- File Info
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Dates
    document_date DATE DEFAULT CURRENT_DATE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE patient_documents IS 'مستندات وملفات المريض';

-- ============================================================================
-- 📍 PART 4: CREATE INDEXES - إنشاء الفهارس
-- ============================================================================

-- Doctors indexes
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_secretary_doctor_id ON doctors(secretary_doctor_id);
CREATE INDEX idx_doctors_user_role ON doctors(user_role);

-- Patients indexes
CREATE INDEX idx_patients_doctor ON patients(doctor_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_national_id ON patients(national_id);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_created ON patients(created_at DESC);

-- Appointments indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- IVF Cycles indexes
CREATE INDEX idx_ivf_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX idx_ivf_cycles_doctor ON ivf_cycles(doctor_id);
CREATE INDEX idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX idx_ivf_cycles_start_date ON ivf_cycles(start_date DESC);

-- Stimulation Logs indexes
CREATE INDEX idx_stimulation_logs_cycle ON stimulation_logs(cycle_id);
CREATE INDEX idx_stimulation_logs_date ON stimulation_logs(log_date);

-- Pregnancies indexes
CREATE INDEX idx_pregnancies_patient ON pregnancies(patient_id);
CREATE INDEX idx_pregnancies_doctor ON pregnancies(doctor_id);
CREATE INDEX idx_pregnancies_cycle ON pregnancies(cycle_id);
CREATE INDEX idx_pregnancies_status ON pregnancies(status);

-- Antenatal Visits indexes
CREATE INDEX idx_antenatal_visits_pregnancy ON antenatal_visits(pregnancy_id);
CREATE INDEX idx_antenatal_visits_date ON antenatal_visits(visit_date);

-- Biometry Scans indexes
CREATE INDEX idx_biometry_scans_pregnancy ON biometry_scans(pregnancy_id);
CREATE INDEX idx_biometry_scans_date ON biometry_scans(scan_date);

-- Lab Results indexes
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_lab_results_doctor ON lab_results(doctor_id);
CREATE INDEX idx_lab_results_cycle ON lab_results(cycle_id);
CREATE INDEX idx_lab_results_date ON lab_results(test_date);

-- Infertility Workups indexes
CREATE INDEX idx_infertility_workups_patient ON infertility_workups(patient_id);

-- Patient Documents indexes
CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type);

-- ============================================================================
-- 📍 PART 5: CREATE FUNCTIONS - إنشاء الدوال
-- ============================================================================

-- Function: Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Get doctor_id from auth.uid()
CREATE OR REPLACE FUNCTION get_doctor_id_from_auth()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'doctor')
    );
    
    -- Also create a doctor record
    INSERT INTO doctors (user_id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate gestational age
CREATE OR REPLACE FUNCTION calculate_gestational_age(lmp_date DATE)
RETURNS TABLE(weeks INTEGER, days INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(DAY FROM (CURRENT_DATE - lmp_date))::INTEGER / 7 AS weeks,
        EXTRACT(DAY FROM (CURRENT_DATE - lmp_date))::INTEGER % 7 AS days;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate EDD from LMP
CREATE OR REPLACE FUNCTION calculate_edd(lmp_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN lmp_date + INTERVAL '280 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 📍 PART 6: CREATE TRIGGERS - إنشاء المحفزات
-- ============================================================================

-- Trigger: Auto update updated_at on all tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ivf_cycles_updated_at 
    BEFORE UPDATE ON ivf_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stimulation_logs_updated_at 
    BEFORE UPDATE ON stimulation_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregnancies_updated_at 
    BEFORE UPDATE ON pregnancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_antenatal_visits_updated_at 
    BEFORE UPDATE ON antenatal_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biometry_scans_updated_at 
    BEFORE UPDATE ON biometry_scans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at 
    BEFORE UPDATE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_infertility_workups_updated_at 
    BEFORE UPDATE ON infertility_workups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_documents_updated_at 
    BEFORE UPDATE ON patient_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Handle new user signup (optional - can be enabled if needed)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 📍 PART 7: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stimulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE antenatal_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometry_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE infertility_workups ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 📍 PART 8: CREATE RLS POLICIES - سياسات الأمان
-- ============================================================================

-- ============================
-- PROFILES POLICIES
-- ============================
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================
-- DOCTORS POLICIES
-- ============================
CREATE POLICY "Doctors can read own record"
    ON doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own record"
    ON doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update own record"
    ON doctors FOR UPDATE
    USING (auth.uid() = user_id);

-- Secretary policies for doctors table
CREATE POLICY "Secretaries can view their doctor"
    ON doctors FOR SELECT
    USING (
        id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
    );

-- ============================
-- PATIENTS POLICIES
-- ============================
CREATE POLICY "Doctors can read their patients"
    ON patients FOR SELECT
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert patients"
    ON patients FOR INSERT
    WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their patients"
    ON patients FOR UPDATE
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can delete their patients"
    ON patients FOR DELETE
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Secretary policies for patients
CREATE POLICY "Secretaries can read doctor's patients"
    ON patients FOR SELECT
    USING (
        doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary')
    );

CREATE POLICY "Secretaries can insert patients for doctor"
    ON patients FOR INSERT
    WITH CHECK (
        doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary')
    );

-- ============================
-- APPOINTMENTS POLICIES
-- ============================
CREATE POLICY "Doctors can manage their appointments"
    ON appointments FOR ALL
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Secretaries can manage doctor's appointments"
    ON appointments FOR ALL
    USING (
        doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary')
    );

-- ============================
-- IVF CYCLES POLICIES
-- ============================
CREATE POLICY "Doctors can read their cycles"
    ON ivf_cycles FOR SELECT
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert cycles"
    ON ivf_cycles FOR INSERT
    WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their cycles"
    ON ivf_cycles FOR UPDATE
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can delete their cycles"
    ON ivf_cycles FOR DELETE
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- ============================
-- STIMULATION LOGS POLICIES
-- ============================
CREATE POLICY "Doctors can manage stimulation logs"
    ON stimulation_logs FOR ALL
    USING (
        cycle_id IN (
            SELECT id FROM ivf_cycles 
            WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

-- ============================
-- PREGNANCIES POLICIES
-- ============================
CREATE POLICY "Doctors can manage pregnancies"
    ON pregnancies FOR ALL
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- ============================
-- ANTENATAL VISITS POLICIES
-- ============================
CREATE POLICY "Doctors can manage antenatal visits"
    ON antenatal_visits FOR ALL
    USING (
        pregnancy_id IN (
            SELECT id FROM pregnancies 
            WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

-- ============================
-- BIOMETRY SCANS POLICIES
-- ============================
CREATE POLICY "Doctors can manage biometry scans"
    ON biometry_scans FOR ALL
    USING (
        pregnancy_id IN (
            SELECT id FROM pregnancies 
            WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

-- ============================
-- LAB RESULTS POLICIES
-- ============================
CREATE POLICY "Doctors can manage lab results"
    ON lab_results FOR ALL
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- ============================
-- INFERTILITY WORKUPS POLICIES
-- ============================
CREATE POLICY "Doctors can manage workups"
    ON infertility_workups FOR ALL
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- ============================
-- PATIENT DOCUMENTS POLICIES
-- ============================
CREATE POLICY "Doctors can manage patient documents"
    ON patient_documents FOR ALL
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- ============================================================================
-- 📍 PART 9: STORAGE SETUP - إعداد التخزين
-- ============================================================================

-- Create buckets (run these in Supabase Dashboard > Storage)
-- 1. doctor-files - for doctor/clinic images
-- 2. patient-documents - for patient files
-- 3. ultrasound-images - for ultrasound scans

-- Storage policies for doctor-files bucket
DROP POLICY IF EXISTS "Users can upload files to doctor-files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files from doctor-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their files in doctor-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files from doctor-files" ON storage.objects;

CREATE POLICY "Users can upload files to doctor-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'doctor-files' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read files from doctor-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-files');

CREATE POLICY "Users can update their files in doctor-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'doctor-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their files from doctor-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'doctor-files' AND auth.role() = 'authenticated');

-- Storage policies for patient-documents bucket
DROP POLICY IF EXISTS "Upload to patient-documents" ON storage.objects;
DROP POLICY IF EXISTS "Read from patient-documents" ON storage.objects;
DROP POLICY IF EXISTS "Delete from patient-documents" ON storage.objects;

CREATE POLICY "Upload to patient-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Read from patient-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Delete from patient-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-documents' AND auth.role() = 'authenticated');

-- ============================================================================
-- 📍 PART 10: VERIFICATION - التحقق
-- ============================================================================

-- Check all tables created
SELECT 
    '✅ تم إنشاء قاعدة البيانات بنجاح!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables;

-- List all tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 🎉 DATABASE BUILD COMPLETE!
-- ============================================================================
-- 
-- الخطوات التالية:
-- 1. اذهب إلى Supabase Dashboard > Storage
-- 2. أنشئ Buckets جديدة:
--    - doctor-files (Public)
--    - patient-documents (Private)
--    - ultrasound-images (Private)
-- 
-- 3. أضف أول طبيب من خلال التسجيل في التطبيق
-- 
-- ============================================================================
