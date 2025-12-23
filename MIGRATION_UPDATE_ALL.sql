-- ============================================================================
-- 🔄 MIGRATION - تحديث قاعدة البيانات بكل التعديلات
-- ============================================================================
-- يضيف الأعمدة الناقصة ويصلح الـ Policies بدون حذف البيانات
-- ============================================================================

-- ============================================================================
-- PART 1: تحديث جدول DOCTORS
-- ============================================================================

-- إضافة الأعمدة الناقصة (لو مش موجودة)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty_ar TEXT DEFAULT 'الحقن المجهري وطب الإنجاب';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_name_ar TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_address_ar TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_logo TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '[]';

-- ============================================================================
-- PART 2: تحديث جدول PATIENTS
-- ============================================================================

-- التعامل مع العمود القديم "history"
DO $$ 
BEGIN
    -- إذا كان عمود history موجود، انقل بياناته إلى medical_history ثم احذفه
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'patients' AND column_name = 'history') THEN
        
        -- أضف medical_history لو مش موجود
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'patients' AND column_name = 'medical_history') THEN
            ALTER TABLE patients ADD COLUMN medical_history JSONB DEFAULT '{}';
        END IF;
        
        -- انقل البيانات من history إلى medical_history
        UPDATE patients 
        SET medical_history = CASE 
            WHEN history IS NOT NULL AND history != '' 
            THEN jsonb_build_object('notes', history)
            ELSE '{}'::jsonb
        END
        WHERE medical_history = '{}'::jsonb OR medical_history IS NULL;
        
        -- احذف العمود القديم
        ALTER TABLE patients DROP COLUMN history;
        
        RAISE NOTICE '✅ تم نقل بيانات history إلى medical_history وحذف العمود القديم';
    END IF;
END $$;

-- إضافة الأعمدة الناقصة
ALTER TABLE patients ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone2 TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'female';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Egypt';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS chronic_diseases TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'married';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS husband_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS husband_phone TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS husband_blood_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marriage_duration_years INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gravida INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS para INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS abortions INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS living_children INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS previous_ivf_attempts INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS amh_level DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS fsh_level DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '{}';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS rx_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- إضافة Constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'patients' AND constraint_name = 'patients_gender_check'
    ) THEN
        ALTER TABLE patients ADD CONSTRAINT patients_gender_check CHECK (gender IN ('male', 'female'));
    END IF;
END $$;

-- ============================================================================
-- PART 3: تحديث جدول APPOINTMENTS
-- ============================================================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS secretary_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'consultation';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by UUID;

-- ============================================================================
-- PART 4: تحديث جدول IVF_CYCLES
-- ============================================================================

ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS cycle_number INTEGER DEFAULT 1;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS assessment_date DATE;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS assessment_data JSONB DEFAULT '{}';
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS stimulation_medications JSONB DEFAULT '[]';
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS trigger_date DATE;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS trigger_medication TEXT;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS mature_eggs INTEGER;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS fertilization_method TEXT;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS lab_data JSONB DEFAULT '{}';
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS embryo_quality TEXT;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS transfer_difficulty TEXT;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS transfer_data JSONB DEFAULT '{}';
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS beta_hcg_value DECIMAL(10,2);
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS clinical_pregnancy BOOLEAN;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS heartbeat_date DATE;
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS outcome_data JSONB DEFAULT '{}';
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS complications TEXT;

-- ============================================================================
-- PART 5: تحديث جدول STIMULATION_LOGS
-- ============================================================================

-- تغيير أسماء الأعمدة لو كانت غلط
DO $$ 
BEGIN
    -- Check if old column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stimulation_logs' AND column_name = 'date') THEN
        ALTER TABLE stimulation_logs RENAME COLUMN date TO log_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stimulation_logs' AND column_name = 'cycle_day') THEN
        ALTER TABLE stimulation_logs RENAME COLUMN cycle_day TO day_number;
    END IF;
END $$;

-- إضافة الأعمدة الناقصة
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]';
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS ultrasound_findings JSONB DEFAULT '{}';
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS hormone_levels JSONB DEFAULT '{}';
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS decision TEXT;
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS next_appointment DATE;

-- ============================================================================
-- PART 6: تحديث جدول PREGNANCIES
-- ============================================================================

ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS lmp_date DATE;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS edd_date DATE;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS edd_by_scan DATE;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS conception_method TEXT DEFAULT 'natural';
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS ga_at_booking_weeks INTEGER;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS ga_at_booking_days INTEGER;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]';
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS pregnancy_type TEXT DEFAULT 'singleton';
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS progesterone_support BOOLEAN DEFAULT FALSE;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS thromboprophylaxis BOOLEAN DEFAULT FALSE;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS delivery_type TEXT;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS birth_weight_grams INTEGER;
ALTER TABLE pregnancies ADD COLUMN IF NOT EXISTS baby_gender TEXT;

-- ============================================================================
-- PART 7: تحديث جدول ANTENATAL_VISITS
-- ============================================================================

ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS gestational_age_weeks INTEGER;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS gestational_age_days INTEGER;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS pulse INTEGER;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS fetal_heart_rate INTEGER;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS fetal_movement BOOLEAN;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS presentation TEXT;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS urine_protein TEXT;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS urine_glucose TEXT;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS complaints TEXT[];
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS prescriptions TEXT;
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS next_visit_date DATE;

-- ============================================================================
-- PART 8: تحديث جدول BIOMETRY_SCANS
-- ============================================================================

ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS scan_type TEXT DEFAULT 'routine';
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS hl_mm DECIMAL(5,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS ua_pi DECIMAL(4,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS ua_ri DECIMAL(4,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS mca_pi DECIMAL(4,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS cpr DECIMAL(4,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS afi_cm DECIMAL(5,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS dvp_cm DECIMAL(4,2);
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS placenta_location TEXT;
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS placenta_grade TEXT;
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS growth_assessment TEXT;
ALTER TABLE biometry_scans ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- ============================================================================
-- PART 9: تحديث جدول LAB_RESULTS
-- ============================================================================

ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE SET NULL;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS test_category TEXT DEFAULT 'general';
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS lab_name TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS report_file_path TEXT;

-- ============================================================================
-- PART 10: تحديث الـ INDEXES
-- ============================================================================

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_secretary_doctor_id ON doctors(secretary_doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_role ON doctors(user_role);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_created ON patients(created_at DESC);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- IVF Cycles indexes
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_doctor ON ivf_cycles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_start_date ON ivf_cycles(start_date DESC);

-- Stimulation Logs indexes
CREATE INDEX IF NOT EXISTS idx_stimulation_logs_cycle ON stimulation_logs(cycle_id);
CREATE INDEX IF NOT EXISTS idx_stimulation_logs_date ON stimulation_logs(log_date);

-- Pregnancies indexes
CREATE INDEX IF NOT EXISTS idx_pregnancies_patient ON pregnancies(patient_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_doctor ON pregnancies(doctor_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_cycle ON pregnancies(cycle_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_status ON pregnancies(status);

-- ============================================================================
-- PART 11: تصليح RLS POLICIES
-- ============================================================================

-- تعطيل RLS مؤقتاً
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Doctors can read own record" ON doctors;
DROP POLICY IF EXISTS "Doctors can insert own record" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own record" ON doctors;
DROP POLICY IF EXISTS "Secretaries can view their doctor" ON doctors;
DROP POLICY IF EXISTS "Secretaries can view linked doctor" ON doctors;
DROP POLICY IF EXISTS "Allow users to read own doctor record" ON doctors;
DROP POLICY IF EXISTS "Allow users to insert own doctor record" ON doctors;
DROP POLICY IF EXISTS "Allow users to update own doctor record" ON doctors;
DROP POLICY IF EXISTS "Allow users to delete own doctor record" ON doctors;

-- إعادة تفعيل RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات جديدة بسيطة
CREATE POLICY "Allow users to read own doctor record"
    ON doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own doctor record"
    ON doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own doctor record"
    ON doctors FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own doctor record"
    ON doctors FOR DELETE
    USING (auth.uid() = user_id);

-- تصليح Patients policies
DROP POLICY IF EXISTS "Doctors can read their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can delete their patients" ON patients;
DROP POLICY IF EXISTS "Secretaries can read doctor's patients" ON patients;
DROP POLICY IF EXISTS "Secretaries can insert patients for doctor" ON patients;
DROP POLICY IF EXISTS "Users can manage patients" ON patients;

CREATE POLICY "Users can manage patients"
    ON patients FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- تصليح Appointments policies
DROP POLICY IF EXISTS "Doctors can manage their appointments" ON appointments;
DROP POLICY IF EXISTS "Secretaries can manage doctor's appointments" ON appointments;
DROP POLICY IF EXISTS "Users can manage appointments" ON appointments;

CREATE POLICY "Users can manage appointments"
    ON appointments FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- تصليح IVF Cycles policies
DROP POLICY IF EXISTS "Doctors can read their cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can insert cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can update their cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can delete their cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Users can manage ivf cycles" ON ivf_cycles;

CREATE POLICY "Users can manage ivf cycles"
    ON ivf_cycles FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- ✅ VERIFICATION
-- ============================================================================

SELECT 
    '✅ تم تحديث قاعدة البيانات بنجاح!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public') as total_columns;

-- Check doctors table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
ORDER BY ordinal_position;

-- Check patients table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 🎉 MIGRATION COMPLETE!
-- ============================================================================
