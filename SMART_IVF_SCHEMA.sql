-- ============================================================================
-- SMART IVF COPILOT - Database Schema
-- ============================================================================

-- 1. Smart IVF Cycles Table
CREATE TABLE IF NOT EXISTS smart_ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- AI Classification
  phenotype TEXT NOT NULL CHECK (phenotype IN ('High', 'Normal', 'Poor')),
  poseidon_group INTEGER CHECK (poseidon_group IN (1, 2, 3, 4)),
  risk_tags JSONB DEFAULT '[]',
  
  -- Protocol
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('Antagonist', 'Long', 'Flare', 'Mini-IVF', 'Natural')),
  starting_dose INTEGER NOT NULL DEFAULT 150,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'stimulation' CHECK (
    status IN ('stimulation', 'trigger', 'opu', 'transfer', 'outcome', 'cancelled')
  ),
  
  -- Dates
  start_date DATE NOT NULL,
  trigger_date DATE,
  opu_date DATE,
  transfer_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Smart Visits Table
CREATE TABLE IF NOT EXISTS smart_ivf_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  
  -- Timing
  day INTEGER NOT NULL,
  visit_date DATE NOT NULL,
  
  -- Hormones
  e2 DECIMAL(10,2) DEFAULT 0,
  p4 DECIMAL(10,3) DEFAULT 0,
  lh DECIMAL(10,2) DEFAULT 0,
  
  -- Ultrasound
  follicles_right JSONB DEFAULT '[]',
  follicles_left JSONB DEFAULT '[]',
  endometrium_thickness DECIMAL(5,2) DEFAULT 0,
  endometrium_pattern TEXT CHECK (endometrium_pattern IN ('trilaminar', 'homogeneous', 'irregular')),
  
  -- Medication
  fsh_dose INTEGER DEFAULT 0,
  hmg_dose INTEGER DEFAULT 0,
  antagonist_started BOOLEAN DEFAULT false,
  
  -- Calculated (Auto)
  total_follicles INTEGER GENERATED ALWAYS AS (
    jsonb_array_length(follicles_right) + jsonb_array_length(follicles_left)
  ) STORED,
  
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_smart_cycles_patient ON smart_ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_smart_cycles_doctor ON smart_ivf_cycles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_smart_cycles_status ON smart_ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_smart_visits_cycle ON smart_ivf_visits(cycle_id);
CREATE INDEX IF NOT EXISTS idx_smart_visits_day ON smart_ivf_visits(day);

-- 4. RLS Policies
ALTER TABLE smart_ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_ivf_visits ENABLE ROW LEVEL SECURITY;

-- Cycles Policies
CREATE POLICY "smart_cycles_select" ON smart_ivf_cycles
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "smart_cycles_insert" ON smart_ivf_cycles
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "smart_cycles_update" ON smart_ivf_cycles
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "smart_cycles_delete" ON smart_ivf_cycles
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

-- Visits Policies
CREATE POLICY "smart_visits_select" ON smart_ivf_visits
  FOR SELECT USING (
    cycle_id IN (SELECT id FROM smart_ivf_cycles WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
  );

CREATE POLICY "smart_visits_insert" ON smart_ivf_visits
  FOR INSERT WITH CHECK (
    cycle_id IN (SELECT id FROM smart_ivf_cycles WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
  );

CREATE POLICY "smart_visits_update" ON smart_ivf_visits
  FOR UPDATE USING (
    cycle_id IN (SELECT id FROM smart_ivf_cycles WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
  );

CREATE POLICY "smart_visits_delete" ON smart_ivf_visits
  FOR DELETE USING (
    cycle_id IN (SELECT id FROM smart_ivf_cycles WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
  );

-- 5. Update Trigger
CREATE OR REPLACE FUNCTION update_smart_cycle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS smart_cycle_updated ON smart_ivf_cycles;
CREATE TRIGGER smart_cycle_updated
  BEFORE UPDATE ON smart_ivf_cycles
  FOR EACH ROW EXECUTE FUNCTION update_smart_cycle_timestamp();

-- 6. Verification
SELECT 'Smart IVF Schema created successfully!' as status;
