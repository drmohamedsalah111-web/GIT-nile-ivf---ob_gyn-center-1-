-- ============================================================================
-- COMPREHENSIVE POWERSYNC SCHEMA SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor to set up complete schema for PowerSync sync
-- Includes all tables, indexes, RLS policies, and publication configuration
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. DOCTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  doctor_image TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  clinic_image TEXT,
  clinic_latitude TEXT,
  clinic_longitude TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read their own profile" ON doctors;
CREATE POLICY "Doctors can read their own profile" ON doctors
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can update their own profile" ON doctors;
CREATE POLICY "Doctors can update their own profile" ON doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE doctors IS 'Medical doctors with clinic information';

-- ============================================================================
-- 2. PATIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  phone TEXT NOT NULL,
  husband_name TEXT,
  history TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read their patients" ON patients;
CREATE POLICY "Doctors can read their patients" ON patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can insert patients" ON patients;
CREATE POLICY "Doctors can insert patients" ON patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can update patients" ON patients;
CREATE POLICY "Doctors can update patients" ON patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE patients IS 'Patient records managed by doctors';

-- ============================================================================
-- 3. VISITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  department TEXT CHECK (department IN ('GYNA', 'OBS', 'IVF_STIM', 'IVF_LAB')),
  diagnosis TEXT,
  prescription TEXT,
  notes TEXT,
  clinical_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits(department);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read patient visits" ON visits;
CREATE POLICY "Doctors can read patient visits" ON visits
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can insert visits" ON visits;
CREATE POLICY "Doctors can insert visits" ON visits
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can update visits" ON visits;
CREATE POLICY "Doctors can update visits" ON visits
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

COMMENT ON TABLE visits IS 'Patient visits across departments';

-- ============================================================================
-- 4. IVF CYCLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL CHECK (protocol IN ('Long', 'Antagonist', 'Flare-up', 'Mini-IVF')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  start_date DATE NOT NULL,
  assessment_data JSONB DEFAULT '{}',
  lab_data JSONB DEFAULT '{}',
  transfer_data JSONB DEFAULT '{}',
  outcome_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ivf_cycles_patient_id ON ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_doctor_id ON ivf_cycles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_start_date ON ivf_cycles(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_assessment_data ON ivf_cycles USING GIN (assessment_data);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_lab_data ON ivf_cycles USING GIN (lab_data);

ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read their IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can read their IVF cycles" ON ivf_cycles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can insert IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can insert IVF cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can update IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can update IVF cycles" ON ivf_cycles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE ivf_cycles IS 'IVF cycles with assessment, lab, transfer, and outcome data';
COMMENT ON COLUMN ivf_cycles.assessment_data IS 'JSONB: couple profile, male/female factor, tubal-uterine assessments';
COMMENT ON COLUMN ivf_cycles.lab_data IS 'JSONB: OPU data, embryo counts, grading';
COMMENT ON COLUMN ivf_cycles.transfer_data IS 'JSONB: transfer details and luteal support';
COMMENT ON COLUMN ivf_cycles.outcome_data IS 'JSONB: beta-HCG and pregnancy outcomes';

-- ============================================================================
-- 5. STIMULATION LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stimulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  cycle_day INTEGER NOT NULL,
  date DATE NOT NULL,
  fsh TEXT DEFAULT '',
  hmg TEXT DEFAULT '',
  e2 TEXT DEFAULT '',
  lh TEXT DEFAULT '',
  rt_follicles TEXT DEFAULT '',
  lt_follicles TEXT DEFAULT '',
  endometrium_thickness TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stimulation_logs_cycle_id ON stimulation_logs(cycle_id);
CREATE INDEX IF NOT EXISTS idx_stimulation_logs_date ON stimulation_logs(date);
CREATE INDEX IF NOT EXISTS idx_stimulation_logs_cycle_day ON stimulation_logs(cycle_day);

ALTER TABLE stimulation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read stimulation logs" ON stimulation_logs;
CREATE POLICY "Doctors can read stimulation logs" ON stimulation_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND cycle_id IN (
      SELECT id FROM ivf_cycles
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can insert stimulation logs" ON stimulation_logs;
CREATE POLICY "Doctors can insert stimulation logs" ON stimulation_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND cycle_id IN (
      SELECT id FROM ivf_cycles
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can update stimulation logs" ON stimulation_logs;
CREATE POLICY "Doctors can update stimulation logs" ON stimulation_logs
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND cycle_id IN (
      SELECT id FROM ivf_cycles
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND cycle_id IN (
      SELECT id FROM ivf_cycles
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

COMMENT ON TABLE stimulation_logs IS 'Daily hormone and ultrasound data during stimulation phase';

-- ============================================================================
-- 6. PREGNANCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pregnancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  lmp_date DATE,
  edd_date DATE,
  edd_by_scan DATE,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high')),
  risk_factors JSONB DEFAULT '[]',
  aspirin_prescribed BOOLEAN DEFAULT false,
  thromboprophylaxis_needed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pregnancies_patient_id ON pregnancies(patient_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_doctor_id ON pregnancies(doctor_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_lmp_date ON pregnancies(lmp_date);

ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read pregnancies" ON pregnancies;
CREATE POLICY "Doctors can read pregnancies" ON pregnancies
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can insert pregnancies" ON pregnancies;
CREATE POLICY "Doctors can insert pregnancies" ON pregnancies
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can update pregnancies" ON pregnancies;
CREATE POLICY "Doctors can update pregnancies" ON pregnancies
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE pregnancies IS 'Pregnancy records with risk assessment';

-- ============================================================================
-- 7. ANTENATAL VISITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS antenatal_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  gestational_age_weeks INTEGER,
  gestational_age_days INTEGER,
  weight_kg REAL,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  urine_albuminuria TEXT,
  urine_glycosuria TEXT,
  fetal_heart_sound BOOLEAN,
  fundal_height_cm REAL,
  edema BOOLEAN,
  edema_grade TEXT,
  notes TEXT,
  next_visit_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_antenatal_visits_pregnancy_id ON antenatal_visits(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_antenatal_visits_visit_date ON antenatal_visits(visit_date DESC);

ALTER TABLE antenatal_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read antenatal visits" ON antenatal_visits;
CREATE POLICY "Doctors can read antenatal visits" ON antenatal_visits
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can insert antenatal visits" ON antenatal_visits;
CREATE POLICY "Doctors can insert antenatal visits" ON antenatal_visits
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can update antenatal visits" ON antenatal_visits;
CREATE POLICY "Doctors can update antenatal visits" ON antenatal_visits
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

COMMENT ON TABLE antenatal_visits IS 'Regular antenatal care visits';

-- ============================================================================
-- 8. BIOMETRY SCANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS biometry_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  gestational_age_weeks INTEGER,
  gestational_age_days INTEGER,
  efw_grams INTEGER,
  percentile INTEGER,
  bpd_mm REAL,
  hc_mm REAL,
  ac_mm REAL,
  fl_mm REAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biometry_scans_pregnancy_id ON biometry_scans(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_biometry_scans_scan_date ON biometry_scans(scan_date DESC);

ALTER TABLE biometry_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read biometry scans" ON biometry_scans;
CREATE POLICY "Doctors can read biometry scans" ON biometry_scans
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can insert biometry scans" ON biometry_scans;
CREATE POLICY "Doctors can insert biometry scans" ON biometry_scans
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can update biometry scans" ON biometry_scans;
CREATE POLICY "Doctors can update biometry scans" ON biometry_scans
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND pregnancy_id IN (
      SELECT id FROM pregnancies
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

COMMENT ON TABLE biometry_scans IS 'Fetal biometry measurements during pregnancy';

-- ============================================================================
-- 9. PATIENT FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_files_patient_id ON patient_files(patient_id);

ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can read patient files" ON patient_files;
CREATE POLICY "Doctors can read patient files" ON patient_files
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Doctors can insert patient files" ON patient_files;
CREATE POLICY "Doctors can insert patient files" ON patient_files
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

COMMENT ON TABLE patient_files IS 'Patient document files and records';

-- ============================================================================
-- 10. APP SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1f2937',
  secondary_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read app settings" ON app_settings;
CREATE POLICY "Public can read app settings" ON app_settings
  FOR SELECT
  USING (true);

COMMENT ON TABLE app_settings IS 'Global application settings and branding';

-- ============================================================================
-- POWERSYNC PUBLICATION
-- ============================================================================
-- Handle publication setup with proper error handling
DO $$
DECLARE
    pub_exists boolean;
    pub_all_tables boolean;
BEGIN
    -- Check if publication exists
    SELECT EXISTS(SELECT 1 FROM pg_publication WHERE pubname = 'powersync') INTO pub_exists;
    
    -- If it exists, check if it's FOR ALL TABLES
    IF pub_exists THEN
        SELECT puballtables INTO pub_all_tables 
        FROM pg_publication 
        WHERE pubname = 'powersync';
        
        IF pub_all_tables THEN
            DROP PUBLICATION powersync CASCADE;
            RAISE NOTICE 'Dropped FOR ALL TABLES publication';
        END IF;
    END IF;
    
    -- Now create the publication (fresh)
    BEGIN
        CREATE PUBLICATION powersync;
        RAISE NOTICE 'Created new publication: powersync';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Publication powersync already exists';
    END;
END $$;

-- Add tables to publication one by one
DO $$
DECLARE
    tables text[] := ARRAY['doctors', 'patients', 'visits', 'ivf_cycles', 'stimulation_logs', 
                           'pregnancies', 'antenatal_visits', 'biometry_scans', 'patient_files', 'app_settings'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        BEGIN
            EXECUTE 'ALTER PUBLICATION powersync ADD TABLE ' || t;
            RAISE NOTICE 'Added table: %', t;
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Table % already in publication', t;
        END;
    END LOOP;
END $$;

-- Verify publication
SELECT tablename FROM pg_publication_tables WHERE pubname = 'powersync' ORDER BY tablename;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'doctors', 'patients', 'visits', 'ivf_cycles', 'stimulation_logs',
    'pregnancies', 'antenatal_visits', 'biometry_scans', 'patient_files', 'app_settings'
)
ORDER BY tablename;
