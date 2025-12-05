-- ============================================================================
-- OBSTETRICS MODULE SETUP - Supabase SQL
-- ============================================================================

-- 1. PREGNANCIES TABLE
CREATE TABLE IF NOT EXISTS pregnancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  lmp_date DATE,
  edd_date DATE,
  edd_by_scan DATE,
  ga_at_booking INTEGER,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high')),
  risk_factors JSONB DEFAULT '[]',
  aspirin_prescribed BOOLEAN DEFAULT FALSE,
  thromboprophylaxis_needed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. ANTENATAL VISITS TABLE
CREATE TABLE IF NOT EXISTS antenatal_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  gestational_age_weeks INTEGER,
  gestational_age_days INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  weight_kg DECIMAL(5, 2),
  urine_albuminuria TEXT,
  urine_glycosuria TEXT,
  fetal_heart_sound BOOLEAN,
  fundal_height_cm DECIMAL(5, 2),
  edema BOOLEAN,
  edema_grade TEXT,
  notes TEXT,
  next_visit_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. BIOMETRY SCANS TABLE (Fetal Growth)
CREATE TABLE IF NOT EXISTS biometry_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  gestational_age_weeks INTEGER,
  gestational_age_days INTEGER,
  bpd_mm DECIMAL(5, 2),
  hc_mm DECIMAL(5, 2),
  ac_mm DECIMAL(5, 2),
  fl_mm DECIMAL(5, 2),
  efw_grams INTEGER,
  percentile INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. CREATE INDEXES
CREATE INDEX idx_pregnancies_patient_id ON pregnancies(patient_id);
CREATE INDEX idx_antenatal_visits_pregnancy_id ON antenatal_visits(pregnancy_id);
CREATE INDEX idx_biometry_scans_pregnancy_id ON biometry_scans(pregnancy_id);

-- 5. ENABLE RLS
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE antenatal_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometry_scans ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES for pregnancies
CREATE POLICY "Doctors can read all pregnancies" ON pregnancies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Doctors can insert pregnancies" ON pregnancies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Doctors can update pregnancies" ON pregnancies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. RLS POLICIES for antenatal_visits
CREATE POLICY "Doctors can read all antenatal visits" ON antenatal_visits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Doctors can insert antenatal visits" ON antenatal_visits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Doctors can update antenatal visits" ON antenatal_visits
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. RLS POLICIES for biometry_scans
CREATE POLICY "Doctors can read all biometry scans" ON biometry_scans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Doctors can insert biometry scans" ON biometry_scans
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Doctors can update biometry scans" ON biometry_scans
  FOR UPDATE USING (auth.role() = 'authenticated');
