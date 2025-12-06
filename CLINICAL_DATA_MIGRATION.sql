-- ============================================================================
-- VISITS TABLE MIGRATION - Create visits table and add clinical columns
-- ============================================================================

-- Create visits table if it doesn't exist
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  department TEXT DEFAULT NULL,
  diagnosis TEXT DEFAULT '',
  prescription JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  clinical_data JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add department column to visits table (if table already exists)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS department TEXT DEFAULT NULL;

-- Add clinical_data column to visits table (if table already exists)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS clinical_data JSONB DEFAULT NULL;

-- Create index for better query performance on clinical_data
CREATE INDEX IF NOT EXISTS idx_visits_clinical_data ON visits USING GIN (clinical_data);

-- Create index for department queries
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits (department);

-- Create index for patient visits with clinical data
CREATE INDEX IF NOT EXISTS idx_visits_patient_clinical ON visits (patient_id, date DESC) WHERE clinical_data IS NOT NULL;

-- Enable RLS on visits table
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visits table
DROP POLICY IF EXISTS "Doctors can read visits" ON visits;
DROP POLICY IF EXISTS "Doctors can insert visits" ON visits;
DROP POLICY IF EXISTS "Doctors can update visits" ON visits;

CREATE POLICY "Doctors can read visits" ON visits
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert visits" ON visits
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update visits" ON visits
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

-- Add comments for documentation
COMMENT ON COLUMN visits.department IS 'Department identifier (GYNA, OBS, IVF_STIM, IVF_LAB)';
COMMENT ON COLUMN visits.clinical_data IS 'Structured clinical data stored as JSONB for different departments (gynecology, obstetrics, ivf)';
COMMENT ON INDEX idx_visits_clinical_data IS 'GIN index for efficient JSONB queries on clinical_data';
COMMENT ON INDEX idx_visits_department IS 'Index for filtering visits by department';
COMMENT ON INDEX idx_visits_patient_clinical IS 'Index for patient clinical visits ordered by date';