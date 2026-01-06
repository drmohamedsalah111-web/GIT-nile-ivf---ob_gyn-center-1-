-- ============================================================================
-- SMART IVF SCHEMA FIX - CONFLICT RESOLUTION
-- Use this script if you get "policy already exists" errors
-- ============================================================================

-- 1. Drop existing policies to avoid conflicts
-- Smart Cycles
DROP POLICY IF EXISTS "doctors_view_own_clinic_smart_cycles" ON smart_ivf_cycles;
DROP POLICY IF EXISTS "doctors_insert_own_smart_cycles" ON smart_ivf_cycles;
DROP POLICY IF EXISTS "doctors_update_own_smart_cycles" ON smart_ivf_cycles;

-- Smart Visits
DROP POLICY IF EXISTS "view_visits_for_accessible_cycles" ON smart_monitoring_visits;
DROP POLICY IF EXISTS "insert_visits_for_own_cycles" ON smart_monitoring_visits;
DROP POLICY IF EXISTS "update_visits_for_own_cycles" ON smart_monitoring_visits;

-- 2. Ensure RLS is enabled
ALTER TABLE smart_ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_monitoring_visits ENABLE ROW LEVEL SECURITY;

-- 3. Re-create Policies
-- Cycles
CREATE POLICY "doctors_view_own_clinic_smart_cycles" ON smart_ivf_cycles
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "doctors_insert_own_smart_cycles" ON smart_ivf_cycles
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "doctors_update_own_smart_cycles" ON smart_ivf_cycles
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- Visits
CREATE POLICY "view_visits_for_accessible_cycles" ON smart_monitoring_visits
  FOR SELECT USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "insert_visits_for_own_cycles" ON smart_monitoring_visits
  FOR INSERT WITH CHECK (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "update_visits_for_own_cycles" ON smart_monitoring_visits
  FOR UPDATE USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- 4. Create Tables (IF NOT EXISTS is already safe)
-- (We only re-run this part to ensure columns exist if the table was partial)
-- Note: PostgreSQL's CREATE TABLE IF NOT EXISTS doesn't add missing columns.
-- If you need to ensure columns, use specific ALTER TABLE commands.
-- For now, verifying table creation is usually enough if it wasn't there, 
-- or if it was there, we assume it's correct from previous partial runs.

-- Ensure smart_ivf_cycles exists
CREATE TABLE IF NOT EXISTS smart_ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'assessment',
  ovarian_phenotype TEXT,
  poseidon_group INTEGER,
  predicted_response TEXT,
  protocol_type TEXT,
  protocol_name TEXT,
  initial_fsh_dose INTEGER,
  initial_hmg_dose INTEGER,
  total_dose_fsh INTEGER DEFAULT 0,
  total_dose_hmg INTEGER DEFAULT 0,
  gonadotropin_type TEXT,
  antagonist_type TEXT,
  trigger_type TEXT,
  trigger_date TIMESTAMPTZ,
  risk_tags TEXT[] DEFAULT '{}',
  ohss_risk_level TEXT,
  predicted_oocytes INTEGER,
  predicted_quality TEXT,
  confidence_score DECIMAL(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Ensure smart_monitoring_visits exists
CREATE TABLE IF NOT EXISTS smart_monitoring_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  visit_number INTEGER NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_time TIME DEFAULT CURRENT_TIME,
  cycle_day INTEGER NOT NULL,
  stimulation_day INTEGER,
  e2_level DECIMAL(8,2),
  lh_level DECIMAL(6,2),
  p4_level DECIMAL(6,2),
  fsh_level DECIMAL(6,2),
  endometrium_thickness DECIMAL(4,2),
  endometrium_pattern TEXT,
  endometrium_quality TEXT,
  follicles_right JSONB DEFAULT '[]',
  follicles_left JSONB DEFAULT '[]',
  total_follicles INTEGER,
  follicles_small INTEGER,
  follicles_medium INTEGER,
  follicles_large INTEGER,
  follicles_mature INTEGER,
  lead_follicle_size DECIMAL(4,2),
  cohort_synchrony TEXT,
  fsh_dose_given INTEGER,
  hmg_dose_given INTEGER,
  antagonist_given BOOLEAN DEFAULT false,
  antagonist_dose TEXT,
  other_medications JSONB DEFAULT '[]',
  ai_recommendations JSONB DEFAULT '[]',
  recommended_fsh_dose INTEGER,
  recommended_hmg_dose INTEGER,
  dose_adjustment TEXT,
  dose_adjustment_reason TEXT,
  alerts JSONB DEFAULT '[]',
  needs_attention BOOLEAN DEFAULT false,
  next_visit_date DATE,
  next_visit_reason TEXT,
  ready_for_trigger BOOLEAN DEFAULT false,
  trigger_recommendation TEXT,
  cancel_recommendation BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  doctor_notes TEXT,
  patient_feedback TEXT,
  side_effects JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Triggers (Drop specific triggers to be safe, but keep function)
DROP TRIGGER IF EXISTS update_smart_cycles_modtime ON smart_ivf_cycles;
DROP TRIGGER IF EXISTS update_smart_visits_modtime ON smart_monitoring_visits;

-- We rely on CREATE OR REPLACE to update the function if needed, 
-- without dropping it to avoid dependency errors with other tables.
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_smart_cycles_modtime
  BEFORE UPDATE ON smart_ivf_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_smart_visits_modtime
  BEFORE UPDATE ON smart_monitoring_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Done!
