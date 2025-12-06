-- ============================================================================
-- IVF CYCLES MODULE SETUP - Supabase SQL
-- ============================================================================
-- This script creates tables for IVF cycle management with assessment,
-- lab data, transfer, and outcome tracking.
-- ============================================================================

-- 1. CREATE IVF_CYCLES TABLE
CREATE TABLE IF NOT EXISTS ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL CHECK (protocol IN ('Long', 'Antagonist', 'Flare-up', 'Mini-IVF')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  start_date DATE NOT NULL,
  assessment_data JSONB DEFAULT NULL,
  lab_data JSONB DEFAULT NULL,
  transfer_data JSONB DEFAULT NULL,
  outcome_data JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. CREATE STIMULATION_LOGS TABLE
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

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_patient_id ON ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_doctor_id ON ivf_cycles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_start_date ON ivf_cycles(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_stimulation_logs_cycle_id ON stimulation_logs(cycle_id);
CREATE INDEX IF NOT EXISTS idx_stimulation_logs_date ON stimulation_logs(date);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_assessment_data ON ivf_cycles USING GIN (assessment_data);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_lab_data ON ivf_cycles USING GIN (lab_data);

-- 4. ENABLE RLS
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stimulation_logs ENABLE ROW LEVEL SECURITY;

-- 5. DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Doctors can read their IVF cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can insert IVF cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can update IVF cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can read stimulation logs" ON stimulation_logs;
DROP POLICY IF EXISTS "Doctors can insert stimulation logs" ON stimulation_logs;
DROP POLICY IF EXISTS "Doctors can update stimulation logs" ON stimulation_logs;

-- 6. RLS POLICIES FOR IVF_CYCLES
CREATE POLICY "Doctors can read their IVF cycles" ON ivf_cycles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Doctors can insert IVF cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

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

-- 7. RLS POLICIES FOR STIMULATION_LOGS
CREATE POLICY "Doctors can read stimulation logs" ON stimulation_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND cycle_id IN (
      SELECT id FROM ivf_cycles
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Doctors can insert stimulation logs" ON stimulation_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND cycle_id IN (
      SELECT id FROM ivf_cycles
      WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

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

-- 8. ADD TABLE COMMENTS
COMMENT ON TABLE ivf_cycles IS 'Stores IVF cycle information including protocol, status, and JSONB data for assessments, lab results, transfer, and outcomes';
COMMENT ON COLUMN ivf_cycles.assessment_data IS 'JSONB object containing couple profile, male/female factor, and tubal-uterine assessments';
COMMENT ON COLUMN ivf_cycles.lab_data IS 'JSONB object containing OPU data, embryo counts, and grading';
COMMENT ON COLUMN ivf_cycles.transfer_data IS 'JSONB object containing transfer details and luteal support options';
COMMENT ON COLUMN ivf_cycles.outcome_data IS 'JSONB object containing beta-HCG and clinical pregnancy outcomes';
