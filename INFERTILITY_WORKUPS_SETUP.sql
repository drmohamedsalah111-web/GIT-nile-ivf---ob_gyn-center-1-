-- ============================================================================
-- INFERTILITY WORKUPS MODULE SETUP - Supabase SQL
-- ============================================================================
-- This script creates the infertility_workups table for infertility assessment
-- ============================================================================

-- 1. CREATE INFERTILITY_WORKUPS TABLE
CREATE TABLE IF NOT EXISTS infertility_workups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. ADD MISSING COLUMNS
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS amh DECIMAL(5, 2);
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS cycle_regularity TEXT CHECK (cycle_regularity IN ('Regular', 'Irregular'));
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS sperm_count INTEGER;
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS motility INTEGER;
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS morphology INTEGER;
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS left_tube TEXT CHECK (left_tube IN ('Patent', 'Blocked', 'Hydrosalpinx'));
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS right_tube TEXT CHECK (right_tube IN ('Patent', 'Blocked', 'Hydrosalpinx'));
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS cavity_status TEXT CHECK (cavity_status IN ('Normal', 'Septum', 'Polyp', 'Adhesions'));
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS plan TEXT;

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_infertility_workups_patient_id ON infertility_workups(patient_id);

-- 3. ENABLE RLS
ALTER TABLE infertility_workups ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Doctors can read their infertility workups" ON infertility_workups;
DROP POLICY IF EXISTS "Doctors can insert infertility workups" ON infertility_workups;
DROP POLICY IF EXISTS "Doctors can update infertility workups" ON infertility_workups;

-- 5. RLS POLICIES FOR INFERTILITY_WORKUPS
CREATE POLICY "Doctors can read their infertility workups" ON infertility_workups
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert infertility workups" ON infertility_workups
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update infertility workups" ON infertility_workups
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

-- 6. ADD TABLE COMMENTS
COMMENT ON TABLE infertility_workups IS 'Stores infertility assessment data including ovarian, male, tubal, and uterine factors';
COMMENT ON COLUMN infertility_workups.amh IS 'Anti-Mullerian Hormone level';
COMMENT ON COLUMN infertility_workups.cycle_regularity IS 'Menstrual cycle regularity';
COMMENT ON COLUMN infertility_workups.sperm_count IS 'Sperm count in millions';
COMMENT ON COLUMN infertility_workups.motility IS 'Sperm motility percentage';
COMMENT ON COLUMN infertility_workups.morphology IS 'Sperm morphology percentage';
COMMENT ON COLUMN infertility_workups.left_tube IS 'Left fallopian tube status';
COMMENT ON COLUMN infertility_workups.right_tube IS 'Right fallopian tube status';
COMMENT ON COLUMN infertility_workups.cavity_status IS 'Uterine cavity status';
COMMENT ON COLUMN infertility_workups.diagnosis IS 'Auto-generated diagnosis based on factors';
COMMENT ON COLUMN infertility_workups.plan IS 'Auto-generated treatment plan';