-- ============================================================================
-- LAB TESTS QUICK SETUP
-- Run this in Supabase SQL Editor to enable lab functionality
-- ============================================================================

-- 1. Create main tables
CREATE TABLE IF NOT EXISTS lab_tests_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(100),
  reference_range_min NUMERIC,
  reference_range_max NUMERIC,
  reference_range_text VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  request_date TIMESTAMP DEFAULT now(),
  status VARCHAR(50) DEFAULT 'Pending',
  clinical_indication TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES lab_tests_catalog(id) ON DELETE CASCADE,
  priority VARCHAR(20) DEFAULT 'Normal',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_item_id UUID NOT NULL REFERENCES lab_request_items(id) ON DELETE CASCADE,
  result_value NUMERIC,
  result_text VARCHAR(500),
  result_date TIMESTAMP,
  is_abnormal BOOLEAN DEFAULT false,
  abnormal_type VARCHAR(20),
  interpretation TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- If tables already exist, ensure missing columns are added (safe re-run)
ALTER TABLE lab_requests ADD COLUMN IF NOT EXISTS clinical_indication TEXT;
ALTER TABLE lab_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

ALTER TABLE lab_request_items ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Normal';
ALTER TABLE lab_request_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE lab_request_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS abnormal_type VARCHAR(20);
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS interpretation TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- 2. Enable RLS
ALTER TABLE lab_tests_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Anyone can read catalog" ON lab_tests_catalog;
CREATE POLICY "Anyone can read catalog"
  ON lab_tests_catalog FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read requests" ON lab_requests;
CREATE POLICY "Anyone can read requests"
  ON lab_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own requests" ON lab_requests;
CREATE POLICY "Users can insert own requests"
  ON lab_requests FOR INSERT TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can read items" ON lab_request_items;
CREATE POLICY "Anyone can read items"
  ON lab_request_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert items" ON lab_request_items;
CREATE POLICY "Users can insert items"
  ON lab_request_items FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read results" ON lab_results;
CREATE POLICY "Anyone can read results"
  ON lab_results FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert results" ON lab_results;
CREATE POLICY "Users can insert results"
  ON lab_results FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_lab_requests_patient ON lab_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON lab_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_request_items_request ON lab_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_item ON lab_results(request_item_id);

-- 5. Insert common tests (copy these tests into catalog)
INSERT INTO lab_tests_catalog (name, category, unit, reference_range_text, is_active) VALUES
-- Hormones
('FSH', 'Hormones', 'mIU/mL', '3.5-12.5 mIU/mL', true),
('LH', 'Hormones', 'mIU/mL', '2.4-12.6 mIU/mL', true),
('E2 (Estradiol)', 'Hormones', 'pg/mL', '20-144 pg/mL', true),
('AMH', 'Hormones', 'ng/mL', '1.1-3.5 ng/mL', true),
('Prolactin', 'Hormones', 'ng/mL', '5-25 ng/mL', true),
('TSH', 'Hormones', 'mIU/L', '0.4-4.0 mIU/L', true),
('Progesterone', 'Hormones', 'ng/mL', '>10 ng/mL (Luteal)', true),

-- Hematology
('CBC', 'Hematology', 'Various', 'WBC, RBC, Hgb, Hct, Platelets', true),
('Hemoglobin', 'Hematology', 'g/dL', '12.0-16.0 g/dL', true),
('Blood Group & Rh', 'Hematology', 'Text', 'A, B, AB, O + Rh', true),
('Platelet Count', 'Hematology', 'K/µL', '150-400 K/µL', true),

-- Chemistry
('Fasting Blood Sugar', 'Chemistry', 'mg/dL', '70-100 mg/dL', true),
('Urea', 'Chemistry', 'mg/dL', '7-20 mg/dL', true),
('Creatinine', 'Chemistry', 'mg/dL', '0.6-1.2 mg/dL', true),
('Total Cholesterol', 'Chemistry', 'mg/dL', '<200 mg/dL', true),
('ALT', 'Chemistry', 'U/L', '7-56 U/L', true),
('AST', 'Chemistry', 'U/L', '10-40 U/L', true),

-- Immunology
('HIV Antibody', 'Immunology', 'Text', 'Negative', true),
('HBsAg', 'Immunology', 'Text', 'Negative', true),
('HCV Antibody', 'Immunology', 'Text', 'Negative', true),
('RPR (Syphilis)', 'Immunology', 'Text', 'Negative', true),
('TORCH Screen', 'Immunology', 'Text', 'Various', true),
('Rubella IgG', 'Immunology', 'IU/mL', '>10 IU/mL (Immune)', true)
ON CONFLICT (name) DO NOTHING;

-- Check setup
SELECT 'Tables Created: ' || COUNT(*) as status FROM information_schema.tables 
WHERE table_name IN ('lab_tests_catalog', 'lab_requests', 'lab_request_items', 'lab_results')
AND table_schema = 'public';

SELECT COUNT(*) as test_count FROM lab_tests_catalog;
SELECT category, COUNT(*) FROM lab_tests_catalog GROUP BY category;
