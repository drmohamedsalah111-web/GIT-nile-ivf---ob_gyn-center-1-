-- ============================================================================
-- VISITS TABLE MIGRATION - Add department and clinical_data columns
-- ============================================================================

-- Add department column to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS department TEXT DEFAULT NULL;

-- Add clinical_data column to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS clinical_data JSONB DEFAULT NULL;

-- Create index for better query performance on clinical_data
CREATE INDEX IF NOT EXISTS idx_visits_clinical_data ON visits USING GIN (clinical_data);

-- Create index for department queries
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits (department);

-- Create index for patient visits with clinical data
CREATE INDEX IF NOT EXISTS idx_visits_patient_clinical ON visits (patient_id, date DESC) WHERE clinical_data IS NOT NULL;

-- Update RLS policies to include clinical_data access
-- Note: Existing policies should already cover this since we're adding a column to existing table

-- Add comments for documentation
COMMENT ON COLUMN visits.clinical_data IS 'Structured clinical data stored as JSONB for different departments (gynecology, obstetrics, ivf)';
COMMENT ON INDEX idx_visits_clinical_data IS 'GIN index for efficient JSONB queries on clinical_data';
COMMENT ON INDEX idx_visits_department IS 'Index for filtering visits by department';
COMMENT ON INDEX idx_visits_patient_clinical IS 'Index for patient clinical visits ordered by date';