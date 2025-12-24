-- ============================================================================
-- ESHRE INFERTILITY DIAGNOSIS ASSISTANT MODULE SETUP
-- ============================================================================

-- 1. CREATE SEMEN_ANALYSES TABLE
CREATE TABLE IF NOT EXISTS semen_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  volume DECIMAL(5, 2), -- ml
  concentration DECIMAL(10, 2), -- million/ml
  progressive_motility DECIMAL(5, 2), -- %
  morphology DECIMAL(5, 2), -- %
  notes TEXT,
  doctor_id UUID REFERENCES auth.users(id)
);

-- 2. UPDATE INFERTILITY_WORKUPS TABLE
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS fsh_day_3 DECIMAL(5, 2);
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS hsg_result TEXT; -- 'Bilateral Patent', 'Unilateral Block', 'Bilateral Block'
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS hysteroscopy_findings TEXT;
ALTER TABLE infertility_workups ADD COLUMN IF NOT EXISTS ovulation_status TEXT; -- 'Regular', 'Irregular (PCOS)', 'Anovulatory'

-- 3. ENABLE RLS FOR SEMEN_ANALYSES
ALTER TABLE semen_analyses ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR SEMEN_ANALYSES
DROP POLICY IF EXISTS "Doctors can read their patients semen analyses" ON semen_analyses;
DROP POLICY IF EXISTS "Doctors can insert semen analyses" ON semen_analyses;
DROP POLICY IF EXISTS "Doctors can update semen analyses" ON semen_analyses;
DROP POLICY IF EXISTS "Doctors can delete semen analyses" ON semen_analyses;

CREATE POLICY "Doctors can read their patients semen analyses" ON semen_analyses
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert semen analyses" ON semen_analyses
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update semen analyses" ON semen_analyses
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete semen analyses" ON semen_analyses
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_semen_analyses_patient_id ON semen_analyses(patient_id);
