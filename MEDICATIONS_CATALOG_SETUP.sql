-- =====================================================
-- MEDICATIONS CATALOG
-- جدول دليل الأدوية
-- =====================================================

CREATE TABLE IF NOT EXISTS medications_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Generic name
  trade_name TEXT NOT NULL, -- Egyptian trade name
  category TEXT, -- e.g., 'Vitamins', 'Antibiotics'
  default_dosage TEXT,
  default_frequency TEXT,
  default_duration TEXT,
  is_custom BOOLEAN DEFAULT true, -- true if added by user, false if system default
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications_catalog(name);
CREATE INDEX IF NOT EXISTS idx_medications_trade_name ON medications_catalog(trade_name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications_catalog(category);

-- RLS Policies
ALTER TABLE medications_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medications_catalog_select_all" ON medications_catalog;
DROP POLICY IF EXISTS "medications_catalog_insert" ON medications_catalog;
DROP POLICY IF EXISTS "medications_catalog_update" ON medications_catalog;
DROP POLICY IF EXISTS "medications_catalog_delete" ON medications_catalog;

CREATE POLICY "medications_catalog_select_all" ON medications_catalog
  FOR SELECT USING (true); -- Anyone can read the catalog

CREATE POLICY "medications_catalog_insert" ON medications_catalog
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "medications_catalog_update" ON medications_catalog
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "medications_catalog_delete" ON medications_catalog
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON medications_catalog TO authenticated;
GRANT SELECT ON medications_catalog TO anon;
