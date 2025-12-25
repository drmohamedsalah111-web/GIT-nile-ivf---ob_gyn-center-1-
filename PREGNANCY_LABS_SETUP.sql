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
-- REFERENCE DATA: Common Pregnancy Labs (English)
-- =====================================================

-- Common pregnancy lab tests in English
COMMENT ON COLUMN pregnancy_labs.test_names IS 
'Common pregnancy lab tests:
- CBC (Complete Blood Count)
- Blood Group & Rh Factor
- RBS (Random Blood Sugar) / FBS (Fasting Blood Sugar)
- HbA1c (Glycated Hemoglobin)
- TSH (Thyroid Stimulating Hormone)
- Free T3, Free T4
- Toxoplasma IgG & IgM
- Rubella IgG & IgM
- CMV IgG & IgM (Cytomegalovirus)
- HIV Test
- HBsAg (Hepatitis B Surface Antigen)
- HCV Antibody (Hepatitis C Virus)
- VDRL/RPR (Syphilis Test)
- Urine Analysis
- Urine Culture
- OGTT (Oral Glucose Tolerance Test) 75g
- GCT (Glucose Challenge Test) 50g
- AFI (Amniotic Fluid Index) - Ultrasound
- NIPT (Non-Invasive Prenatal Testing)
- Double Marker Test (First Trimester)
- Triple/Quadruple Marker Test (Second Trimester)
- Ferritin Level
- Serum Iron
- Vitamin D
- Vitamin B12
- Folate Level
- APTT & PT/INR (Coagulation Profile)
- Liver Function Tests (LFT)
- Kidney Function Tests (Creatinine, Urea)
- Electrolytes (Na, K, Ca)
- Protein in Urine (24-hour collection)
- Group B Streptococcus (GBS) - Late pregnancy';

-- =====================================================
-- REFERENCE DATA: Common Pregnancy Medications (Egyptian Market)
-- =====================================================

COMMENT ON COLUMN pregnancy_prescriptions.items IS 
'Common pregnancy medications - Egyptian trade names:

VITAMINS & SUPPLEMENTS:
- Folic Acid 5mg (Folicap, Folicare)
- Prenatal Multivitamin (Pregnacare, Vitapreg, Maternavit)
- Iron + Folic Acid (Ferrovit, Haemoton, Pharmaton)
- Calcium + Vitamin D (Calcimate D, Calcivit D, Osteocare)
- Omega-3 (Octatron, Omega Plus)
- Vitamin D 50,000 IU weekly (Vidrop, Devarol-S)

NAUSEA & VOMITING:
- Doxylamine + Pyridoxine (Xonvea, Diclegis)
- Ondansetron 4mg/8mg (Zofran, Emeset)
- Metoclopramide 10mg (Primperan, Controloc)
- Meclizine 25mg (Dramamine)

GASTROINTESTINAL:
- Omeprazole 20mg (Gastroloc, Omiz)
- Esomeprazole 40mg (Nexium, Ezoloc)
- Antacids (Maalox, Gaviscon)
- Lactulose (Duphalac, Laevolac) - for constipation
- Psyllium Husk (Agiolax) - fiber supplement

ANTIBIOTICS (when needed):
- Amoxicillin 500mg/1000mg (Augmentin, E-Mox)
- Cephalexin 500mg (Ceporex, Keflex)
- Azithromycin 500mg (Zithromax, Azithrocin)
- Nitrofurantoin 100mg (Furadantin) - for UTI

ANTIHYPERTENSIVES:
- Methyldopa 250mg/500mg (Aldomet)
- Labetalol 100mg/200mg (Trandate)
- Nifedipine 10mg (Epilat retard)

THYROID:
- Levothyroxine (Eltroxin, Euthyrox)
- Propylthiouracil (PTU)

ANTICOAGULATION:
- Low Molecular Weight Heparin (Clexane 40mg/60mg)
- Aspirin 75mg/81mg (Jusprin, Aspocid)

ANTI-DIABETIC:
- Insulin (Actrapid, Mixtard, Insulatard, NovoRapid)
- Metformin 500mg/1000mg (Glucophage) - in select cases

PROGESTERONE SUPPORT:
- Progesterone vaginal (Cyclogest 400mg, Prontogest)
- Progesterone oral (Duphaston 10mg)
- Progesterone injection (Proluton Depot 250mg)

TOCOLYTICS (Preterm Labor):
- Nifedipine 10mg (Epilat retard)
- Ritodrine (Yutopar)

CORTICOSTEROIDS (Fetal Lung Maturity):
- Betamethasone 12mg IM (Celestone)
- Dexamethasone 6mg IM (Fortecortin, Dexamethasone)

PAIN RELIEF:
- Paracetamol 500mg/1000mg (Panadol, Cetal)
- Paracetamol Extra (with caffeine) - limit caffeine

ALLERGIES:
- Loratadine 10mg (Claritine, Lorano)
- Cetirizine 10mg (Zyrtec, Letizen)

TOPICAL:
- Hemorrhoid cream (Proctoglyvenol, Faktu)
- Anti-stretch marks cream (Bio-Oil, Palmer''s)
- Vaginal antifungal (Clotrimazole/Canesten cream)';

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- INSERT INTO pregnancy_labs (pregnancy_id, test_names, status, notes, ordered_at)
-- VALUES 
--   ('your-pregnancy-id', ARRAY['CBC (Complete Blood Count)', 'Blood Group & Rh Factor', 'RBS (Random Blood Sugar)'], 'pending', 'First antenatal visit', NOW());
