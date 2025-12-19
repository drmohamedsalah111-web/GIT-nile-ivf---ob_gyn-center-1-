-- ============================================================================
-- IVF JOURNEY - COMPREHENSIVE DATABASE SCHEMA
-- ============================================================================
-- Professional IVF Cycle Management System
-- Covers: Assessment, Protocol, Stimulation, OPU, Lab, Embryology, Transfer, Outcome
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. IVF CYCLES TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- Cycle Information
  cycle_number INTEGER NOT NULL DEFAULT 1,
  protocol_type TEXT CHECK (protocol_type IN ('Long', 'Antagonist', 'Flare-up', 'Mini-IVF', 'Natural')),
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'assessment' CHECK (
    status IN ('assessment', 'protocol', 'stimulation', 'opu', 'lab', 'transfer', 'outcome', 'completed', 'cancelled')
  ),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_doctor ON ivf_cycles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_start_date ON ivf_cycles(start_date DESC);

-- ============================================================================
-- 2. CYCLE ASSESSMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cycle_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  -- Female Assessment
  female_age INTEGER,
  female_bmi DECIMAL(5,2),
  amh DECIMAL(6,2), -- ng/mL
  afc_right INTEGER,
  afc_left INTEGER,
  afc_total INTEGER GENERATED ALWAYS AS (COALESCE(afc_right, 0) + COALESCE(afc_left, 0)) STORED,
  fsh DECIMAL(6,2), -- mIU/mL
  lh DECIMAL(6,2), -- mIU/mL
  e2 DECIMAL(8,2), -- pg/mL
  
  -- Ovarian Reserve Classification
  ovarian_reserve TEXT CHECK (ovarian_reserve IN ('poor', 'normal', 'high', 'pcos')),
  
  -- Male Assessment
  sperm_count DECIMAL(10,2), -- million/mL
  motility DECIMAL(5,2), -- percentage
  progressive_motility DECIMAL(5,2), -- percentage
  morphology DECIMAL(5,2), -- percentage (normal forms)
  tmsc DECIMAL(10,2), -- Total Motile Sperm Count (million)
  
  -- Diagnosis
  infertility_type TEXT CHECK (infertility_type IN ('primary', 'secondary')),
  infertility_duration INTEGER, -- months
  previous_ivf_cycles INTEGER DEFAULT 0,
  previous_pregnancies INTEGER DEFAULT 0,
  previous_live_births INTEGER DEFAULT 0,
  
  -- Medical History
  medical_conditions JSONB DEFAULT '[]',
  surgical_history JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_cycle ON cycle_assessment(cycle_id);

-- ============================================================================
-- 3. STIMULATION PROTOCOL TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stimulation_protocol (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  -- Protocol Details
  protocol_name TEXT NOT NULL,
  protocol_type TEXT CHECK (protocol_type IN ('Long', 'Antagonist', 'Flare-up', 'Mini-IVF', 'Natural')),
  
  -- Down-regulation (for Long protocol)
  down_regulation_drug TEXT,
  down_regulation_dose TEXT,
  down_regulation_start_date DATE,
  down_regulation_duration INTEGER, -- days
  
  -- Stimulation
  stimulation_drug TEXT,
  stimulation_starting_dose TEXT,
  stimulation_start_date DATE,
  stimulation_duration INTEGER, -- days
  
  -- Antagonist (for Antagonist protocol)
  antagonist_drug TEXT,
  antagonist_dose TEXT,
  antagonist_start_date DATE,
  
  -- Trigger
  trigger_drug TEXT,
  trigger_dose TEXT,
  trigger_date TIMESTAMPTZ,
  
  -- Luteal Support
  luteal_support JSONB DEFAULT '[]', -- [{drug, dose, route, frequency}]
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocol_cycle ON stimulation_protocol(cycle_id);

-- ============================================================================
-- 4. MONITORING VISITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitoring_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  
  -- Visit Information
  visit_date DATE NOT NULL,
  cycle_day INTEGER NOT NULL,
  stimulation_day INTEGER,
  
  -- Hormone Levels
  e2 DECIMAL(8,2), -- pg/mL
  lh DECIMAL(6,2), -- mIU/mL
  progesterone DECIMAL(6,2), -- ng/mL
  fsh DECIMAL(6,2), -- mIU/mL
  
  -- Ultrasound Findings
  endometrium_thickness DECIMAL(4,2), -- mm
  endometrium_pattern TEXT CHECK (endometrium_pattern IN ('trilaminar', 'homogeneous', 'irregular')),
  
  -- Follicles (stored as array of sizes)
  follicles_right JSONB DEFAULT '[]', -- [12, 14, 15, ...]
  follicles_left JSONB DEFAULT '[]',
  
  -- Calculated Fields
  total_follicles INTEGER,
  follicles_gt_10mm INTEGER,
  follicles_gt_14mm INTEGER,
  follicles_gt_18mm INTEGER,
  lead_follicle_size DECIMAL(4,2),
  
  -- Medications Administered
  medications JSONB DEFAULT '[]', -- [{drug, dose, route}]
  
  -- Next Steps
  next_visit_date DATE,
  recommendations TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_cycle ON monitoring_visits(cycle_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_date ON monitoring_visits(visit_date DESC);

-- ============================================================================
-- 5. OOCYTE RETRIEVAL (OPU) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS oocyte_retrieval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  -- Timing
  retrieval_date TIMESTAMPTZ NOT NULL,
  hours_after_trigger DECIMAL(4,1),
  
  -- Oocyte Count
  total_oocytes INTEGER NOT NULL,
  mii_oocytes INTEGER, -- Mature (Metaphase II)
  mi_oocytes INTEGER, -- Intermediate (Metaphase I)
  gv_oocytes INTEGER, -- Immature (Germinal Vesicle)
  atretic_oocytes INTEGER, -- Degenerated
  
  -- Calculated Rates
  maturation_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_oocytes > 0 
    THEN (mii_oocytes::DECIMAL / total_oocytes * 100) 
    ELSE NULL END
  ) STORED,
  
  -- Procedure Details
  anesthesia_type TEXT,
  procedure_duration INTEGER, -- minutes
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'difficult')),
  
  -- Complications
  complications TEXT,
  bleeding BOOLEAN DEFAULT false,
  infection BOOLEAN DEFAULT false,
  ohss_risk TEXT CHECK (ohss_risk IN ('none', 'low', 'moderate', 'high')),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opu_cycle ON oocyte_retrieval(cycle_id);

-- ============================================================================
-- 6. FERTILIZATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fertilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  -- Method
  fertilization_method TEXT NOT NULL CHECK (fertilization_method IN ('IVF', 'ICSI', 'Mixed')),
  insemination_date TIMESTAMPTZ NOT NULL,
  
  -- IVF Details
  ivf_oocytes INTEGER DEFAULT 0,
  ivf_fertilized INTEGER DEFAULT 0,
  
  -- ICSI Details
  icsi_oocytes INTEGER DEFAULT 0,
  icsi_fertilized INTEGER DEFAULT 0,
  
  -- Total Fertilization
  total_oocytes_inseminated INTEGER NOT NULL,
  total_fertilized_2pn INTEGER NOT NULL, -- Normal fertilization (2 pronuclei)
  abnormal_1pn INTEGER DEFAULT 0, -- Parthenogenesis
  abnormal_3pn INTEGER DEFAULT 0, -- Polyspermy
  
  -- Calculated Rate
  fertilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_oocytes_inseminated > 0 
    THEN (total_fertilized_2pn::DECIMAL / total_oocytes_inseminated * 100) 
    ELSE NULL END
  ) STORED,
  
  -- Sperm Details
  sperm_source TEXT CHECK (sperm_source IN ('fresh', 'frozen', 'donor')),
  sperm_preparation TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fertilization_cycle ON fertilization(cycle_id);

-- ============================================================================
-- 7. EMBRYO DEVELOPMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS embryo_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  
  -- Embryo Identification
  embryo_number INTEGER NOT NULL,
  
  -- Development Day
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 7),
  assessment_time TIMESTAMPTZ NOT NULL,
  
  -- Cleavage Stage (Day 2-3)
  cell_count INTEGER,
  fragmentation DECIMAL(5,2), -- percentage
  symmetry TEXT CHECK (symmetry IN ('symmetric', 'asymmetric')),
  
  -- Blastocyst Stage (Day 5-6)
  expansion TEXT CHECK (expansion IN ('early', 'expanding', 'expanded', 'hatching', 'hatched')),
  icm_grade TEXT CHECK (icm_grade IN ('A', 'B', 'C', 'D')), -- Inner Cell Mass
  te_grade TEXT CHECK (te_grade IN ('A', 'B', 'C', 'D')), -- Trophectoderm
  
  -- Overall Grade
  overall_grade TEXT CHECK (overall_grade IN ('A', 'B', 'C', 'D')),
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'developing' CHECK (
    status IN ('developing', 'arrested', 'transferred', 'frozen', 'biopsied', 'discarded')
  ),
  
  -- PGT (if applicable)
  pgt_performed BOOLEAN DEFAULT false,
  pgt_result TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(cycle_id, embryo_number, day)
);

CREATE INDEX IF NOT EXISTS idx_embryo_cycle ON embryo_development(cycle_id);
CREATE INDEX IF NOT EXISTS idx_embryo_status ON embryo_development(status);

-- ============================================================================
-- 8. EMBRYO TRANSFER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS embryo_transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  
  -- Transfer Details
  transfer_date TIMESTAMPTZ NOT NULL,
  transfer_day INTEGER NOT NULL CHECK (transfer_day IN (2, 3, 5, 6)), -- Day 2, 3, 5, or 6
  
  -- Embryos
  embryos_transferred INTEGER NOT NULL,
  embryo_ids JSONB NOT NULL, -- Array of embryo_development IDs
  embryo_grades JSONB, -- Array of grades for transferred embryos
  
  -- Remaining Embryos
  embryos_frozen INTEGER DEFAULT 0,
  frozen_embryo_ids JSONB DEFAULT '[]',
  embryos_discarded INTEGER DEFAULT 0,
  
  -- Endometrium
  endometrium_thickness DECIMAL(4,2), -- mm
  endometrium_pattern TEXT,
  
  -- Procedure
  catheter_type TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'difficult')),
  ultrasound_guided BOOLEAN DEFAULT true,
  blood_on_catheter BOOLEAN DEFAULT false,
  
  -- Luteal Support
  luteal_support JSONB NOT NULL, -- [{drug, dose, route, frequency, start_date}]
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_cycle ON embryo_transfer(cycle_id);
CREATE INDEX IF NOT EXISTS idx_transfer_date ON embryo_transfer(transfer_date DESC);

-- ============================================================================
-- 9. CYCLE OUTCOME TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cycle_outcome (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  -- Beta-hCG Tests
  beta_hcg_day_14_date DATE,
  beta_hcg_day_14_value DECIMAL(8,2),
  beta_hcg_day_14_result TEXT CHECK (beta_hcg_day_14_result IN ('negative', 'positive', 'biochemical')),
  
  beta_hcg_day_21_date DATE,
  beta_hcg_day_21_value DECIMAL(8,2),
  
  -- Ultrasound Findings
  first_scan_date DATE,
  gestational_sacs INTEGER DEFAULT 0,
  fetal_poles INTEGER DEFAULT 0,
  fetal_heart_rates INTEGER DEFAULT 0,
  
  -- Pregnancy Classification
  biochemical_pregnancy BOOLEAN DEFAULT false,
  clinical_pregnancy BOOLEAN DEFAULT false,
  ongoing_pregnancy BOOLEAN DEFAULT false,
  live_birth BOOLEAN DEFAULT false,
  
  -- Multiple Pregnancy
  singleton BOOLEAN,
  twins BOOLEAN,
  triplets BOOLEAN,
  
  -- Complications
  ectopic_pregnancy BOOLEAN DEFAULT false,
  miscarriage BOOLEAN DEFAULT false,
  miscarriage_date DATE,
  miscarriage_gestational_age INTEGER, -- weeks
  
  ohss BOOLEAN DEFAULT false,
  ohss_severity TEXT CHECK (ohss_severity IN ('mild', 'moderate', 'severe')),
  
  -- Final Outcome
  outcome_status TEXT CHECK (
    outcome_status IN ('negative', 'biochemical', 'miscarriage', 'ectopic', 'ongoing', 'live_birth')
  ),
  delivery_date DATE,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcome_cycle ON cycle_outcome(cycle_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE stimulation_protocol ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE oocyte_retrieval ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE embryo_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE embryo_transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_outcome ENABLE ROW LEVEL SECURITY;

-- Policies for ivf_cycles
DROP POLICY IF EXISTS "Doctors can read their IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can read their IVF cycles" ON ivf_cycles
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can insert IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can insert IVF cycles" ON ivf_cycles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Doctors can update their IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can update their IVF cycles" ON ivf_cycles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- Similar policies for related tables (using cycle_id foreign key)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'cycle_assessment', 'stimulation_protocol', 'monitoring_visits',
      'oocyte_retrieval', 'fertilization', 'embryo_development',
      'embryo_transfer', 'cycle_outcome'
    ])
  LOOP
    -- SELECT policy
    EXECUTE format('
      DROP POLICY IF EXISTS "Doctors can read %I" ON %I;
      CREATE POLICY "Doctors can read %I" ON %I
        FOR SELECT USING (
          auth.uid() IS NOT NULL
          AND cycle_id IN (
            SELECT id FROM ivf_cycles
            WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
          )
        );
    ', tbl, tbl, tbl, tbl);
    
    -- INSERT policy
    EXECUTE format('
      DROP POLICY IF EXISTS "Doctors can insert %I" ON %I;
      CREATE POLICY "Doctors can insert %I" ON %I
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL
          AND cycle_id IN (
            SELECT id FROM ivf_cycles
            WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
          )
        );
    ', tbl, tbl, tbl, tbl);
    
    -- UPDATE policy
    EXECUTE format('
      DROP POLICY IF EXISTS "Doctors can update %I" ON %I;
      CREATE POLICY "Doctors can update %I" ON %I
        FOR UPDATE USING (
          auth.uid() IS NOT NULL
          AND cycle_id IN (
            SELECT id FROM ivf_cycles
            WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
          )
        );
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'ivf_cycles', 'cycle_assessment', 'stimulation_protocol', 'monitoring_visits',
      'oocyte_retrieval', 'fertilization', 'embryo_development',
      'embryo_transfer', 'cycle_outcome'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ivf_cycles IS 'Main IVF cycle tracking table';
COMMENT ON TABLE cycle_assessment IS 'Initial assessment data for each cycle';
COMMENT ON TABLE stimulation_protocol IS 'Stimulation protocol details';
COMMENT ON TABLE monitoring_visits IS 'Daily monitoring during stimulation';
COMMENT ON TABLE oocyte_retrieval IS 'OPU procedure details and oocyte counts';
COMMENT ON TABLE fertilization IS 'Fertilization method and results';
COMMENT ON TABLE embryo_development IS 'Daily embryo development tracking';
COMMENT ON TABLE embryo_transfer IS 'Embryo transfer procedure details';
COMMENT ON TABLE cycle_outcome IS 'Final cycle outcomes and pregnancy results';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  '✅ IVF Journey Database Schema Created Successfully' as status,
  COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'ivf_cycles', 'cycle_assessment', 'stimulation_protocol', 'monitoring_visits',
    'oocyte_retrieval', 'fertilization', 'embryo_development',
    'embryo_transfer', 'cycle_outcome'
  );
