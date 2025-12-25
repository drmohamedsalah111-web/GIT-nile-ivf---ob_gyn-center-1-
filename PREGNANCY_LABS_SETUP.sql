-- =====================================================
-- PREGNANCY LABS & PRESCRIPTIONS TABLES
-- تحاليل وروشتات الحمل
-- =====================================================

-- 1. جدول تحاليل الحمل
CREATE TABLE IF NOT EXISTS pregnancy_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  test_names TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. جدول روشتات الحمل
CREATE TABLE IF NOT EXISTS pregnancy_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES antenatal_visits(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_pregnancy_labs_pregnancy ON pregnancy_labs(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_labs_status ON pregnancy_labs(status);
CREATE INDEX IF NOT EXISTS idx_pregnancy_prescriptions_pregnancy ON pregnancy_prescriptions(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_prescriptions_visit ON pregnancy_prescriptions(visit_id);

-- 4. RLS Policies
ALTER TABLE pregnancy_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_prescriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "pregnancy_labs_select_all" ON pregnancy_labs;
DROP POLICY IF EXISTS "pregnancy_labs_insert" ON pregnancy_labs;
DROP POLICY IF EXISTS "pregnancy_labs_update" ON pregnancy_labs;
DROP POLICY IF EXISTS "pregnancy_labs_delete" ON pregnancy_labs;
DROP POLICY IF EXISTS "pregnancy_prescriptions_select_all" ON pregnancy_prescriptions;
DROP POLICY IF EXISTS "pregnancy_prescriptions_insert" ON pregnancy_prescriptions;
DROP POLICY IF EXISTS "pregnancy_prescriptions_update" ON pregnancy_prescriptions;
DROP POLICY IF EXISTS "pregnancy_prescriptions_delete" ON pregnancy_prescriptions;

-- Allow all authenticated users to read
CREATE POLICY "pregnancy_labs_select_all" ON pregnancy_labs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pregnancy_prescriptions_select_all" ON pregnancy_prescriptions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for authenticated users
CREATE POLICY "pregnancy_labs_insert" ON pregnancy_labs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pregnancy_labs_update" ON pregnancy_labs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "pregnancy_labs_delete" ON pregnancy_labs
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "pregnancy_prescriptions_insert" ON pregnancy_prescriptions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pregnancy_prescriptions_update" ON pregnancy_prescriptions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "pregnancy_prescriptions_delete" ON pregnancy_prescriptions
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_pregnancy_labs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS pregnancy_labs_updated_at ON pregnancy_labs;
DROP TRIGGER IF EXISTS pregnancy_prescriptions_updated_at ON pregnancy_prescriptions;

CREATE TRIGGER pregnancy_labs_updated_at
  BEFORE UPDATE ON pregnancy_labs
  FOR EACH ROW EXECUTE FUNCTION update_pregnancy_labs_updated_at();

CREATE TRIGGER pregnancy_prescriptions_updated_at
  BEFORE UPDATE ON pregnancy_prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_pregnancy_labs_updated_at();

-- 6. Grant permissions
GRANT ALL ON pregnancy_labs TO authenticated;
GRANT ALL ON pregnancy_prescriptions TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- INSERT INTO pregnancy_labs (pregnancy_id, test_names, status, notes, ordered_at)
-- VALUES 
--   ('your-pregnancy-id', ARRAY['cbc', 'blood_group', 'rbs'], 'pending', 'First visit labs', NOW());
