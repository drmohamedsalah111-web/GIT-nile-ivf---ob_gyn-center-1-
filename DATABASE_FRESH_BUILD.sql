-- ============================================================================
-- 🏗️ SAFE DATABASE BUILD - IVF & OB/GYN Clinic Management System
-- ============================================================================
-- نظام إدارة عيادات الحقن المجهري - بناء آمن خطوة بخطوة
-- ============================================================================

-- تعطيل RLS مؤقتاً للسماح بالتعديلات
ALTER TABLE IF EXISTS stimulation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS infertility_workups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lab_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pregnancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ivf_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- حذف جميع Policies القديمة
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- حذف الجداول بالترتيب الآمن
DROP TABLE IF EXISTS stimulation_logs CASCADE;
DROP TABLE IF EXISTS infertility_workups CASCADE;
DROP TABLE IF EXISTS patient_documents CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS pregnancies CASCADE;
DROP TABLE IF EXISTS ivf_cycles CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- حذف الـ Types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS cycle_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- ============================================================================
-- STEP 2: Create Custom Types
-- ============================================================================

CREATE TYPE user_role AS ENUM ('doctor', 'secretary', 'admin');
CREATE TYPE cycle_status AS ENUM ('Active', 'Completed', 'Cancelled');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no-show');

-- ============================================================================
-- STEP 3: Core Tables - الجداول الأساسية
-- ============================================================================

-- 3.1 Profiles Table (يربط مع Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'doctor',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Doctors Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    phone TEXT,
    license_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    national_id TEXT UNIQUE,
    birth_date DATE,
    address TEXT,
    blood_type TEXT,
    notes TEXT,
    medical_history JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 IVF Cycles Table
CREATE TABLE ivf_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    protocol TEXT DEFAULT 'Antagonist',
    status cycle_status NOT NULL DEFAULT 'Active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Assessment Phase
    assessment_data JSONB DEFAULT '{}',
    
    -- Stimulation Phase
    stimulation_start_date DATE,
    stimulation_protocol TEXT,
    
    -- Lab Phase
    lab_data JSONB DEFAULT '{}',
    retrieval_date DATE,
    eggs_retrieved INTEGER,
    eggs_fertilized INTEGER,
    
    -- Transfer Phase
    transfer_data JSONB DEFAULT '{}',
    transfer_date DATE,
    embryos_transferred INTEGER,
    
    -- Outcome Phase
    outcome_data JSONB DEFAULT '{}',
    pregnancy_test_date DATE,
    pregnancy_test_result BOOLEAN,
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Stimulation Logs Table
CREATE TABLE stimulation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_number INTEGER NOT NULL,
    medications JSONB NOT NULL DEFAULT '[]',
    ultrasound_findings JSONB DEFAULT '{}',
    hormone_levels JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Pregnancies Table
CREATE TABLE pregnancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
    lmp DATE NOT NULL,
    edd DATE NOT NULL,
    gestational_age_weeks INTEGER,
    status TEXT DEFAULT 'Active',
    visits JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 Lab Results Table
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_type TEXT NOT NULL,
    results JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 Infertility Workups Table
CREATE TABLE infertility_workups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    female_data JSONB DEFAULT '{}',
    male_data JSONB DEFAULT '{}',
    diagnosis TEXT,
    recommendations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Patient Documents Table
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Indexes for Performance
-- ============================================================================

CREATE INDEX idx_patients_doctor ON patients(doctor_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_ivf_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX idx_ivf_cycles_doctor ON ivf_cycles(doctor_id);
CREATE INDEX idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX idx_stimulation_logs_cycle ON stimulation_logs(cycle_id);
CREATE INDEX idx_pregnancies_patient ON pregnancies(patient_id);
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);

-- ============================================================================
-- STEP 5: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stimulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE infertility_workups ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Doctors Policies
CREATE POLICY "Doctors can read own record"
    ON doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own record"
    ON doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update own record"
    ON doctors FOR UPDATE
    USING (auth.uid() = user_id);

-- Patients Policies
CREATE POLICY "Doctors can read their patients"
    ON patients FOR SELECT
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can insert their patients"
    ON patients FOR INSERT
    WITH CHECK (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can update their patients"
    ON patients FOR UPDATE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can delete their patients"
    ON patients FOR DELETE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- Appointments Policies
CREATE POLICY "Doctors can manage their appointments"
    ON appointments FOR ALL
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- IVF Cycles Policies
CREATE POLICY "Doctors can read their cycles"
    ON ivf_cycles FOR SELECT
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can insert their cycles"
    ON ivf_cycles FOR INSERT
    WITH CHECK (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

CREATE POLICY "Doctors can update their cycles"
    ON ivf_cycles FOR UPDATE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- Stimulation Logs Policies
CREATE POLICY "Doctors can manage stimulation logs"
    ON stimulation_logs FOR ALL
    USING (
        cycle_id IN (
            SELECT id FROM ivf_cycles 
            WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

-- Pregnancies Policies
CREATE POLICY "Doctors can manage pregnancies"
    ON pregnancies FOR ALL
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- Lab Results Policies
CREATE POLICY "Doctors can manage lab results"
    ON lab_results FOR ALL
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- Infertility Workups Policies
CREATE POLICY "Doctors can manage workups"
    ON infertility_workups FOR ALL
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- Patient Documents Policies
CREATE POLICY "Doctors can manage patient documents"
    ON patient_documents FOR ALL
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    );

-- ============================================================================
-- STEP 6: Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ivf_cycles_updated_at BEFORE UPDATE ON ivf_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stimulation_logs_updated_at BEFORE UPDATE ON stimulation_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregnancies_updated_at BEFORE UPDATE ON pregnancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: Helper Functions
-- ============================================================================

-- دالة للحصول على doctor_id من auth.uid()
CREATE OR REPLACE FUNCTION get_doctor_id_from_auth()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: إضافة الطبيب الأساسي
-- ============================================================================

INSERT INTO doctors (id, user_id, email, name, created_at, updated_at)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ✅ DATABASE BUILD COMPLETE
-- ============================================================================

SELECT 
    '✅ تم بناء قاعدة البيانات بنجاح!' as status,
    (SELECT COUNT(*) FROM doctors) as total_doctors,
    (SELECT COUNT(*) FROM patients) as total_patients,
    (SELECT COUNT(*) FROM ivf_cycles) as total_cycles;
    
SELECT '🎉 النظام جاهز للاستخدام - ابدأ باستخدام التطبيق' as message;