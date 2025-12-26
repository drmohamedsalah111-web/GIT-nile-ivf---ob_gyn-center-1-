-- ============================================================
-- PREGNANCY MEDICATIONS CATALOG - EGYPTIAN MARKET
-- ============================================================
-- Purpose: Quick prescription writing for antenatal care
-- Features: Color-coded categories, Egyptian brand names
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: PREGNANCY MEDICATIONS CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pregnancy_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Medication Identity
    trade_name TEXT NOT NULL,           -- Commercial name in Egypt
    generic_name TEXT NOT NULL,         -- Scientific name
    manufacturer TEXT,                  -- Pharmaceutical company
    
    -- Classification
    category TEXT NOT NULL CHECK (category IN (
        'Vitamins & Supplements',
        'Folic Acid',
        'Iron & Calcium',
        'Anti-Nausea',
        'Progesterone Support',
        'Antihypertensive',
        'Antidiabetic',
        'Antibiotics',
        'Antifungal',
        'Pain Relief',
        'Antispasmodic',
        'Laxatives',
        'Anticoagulants',
        'Thyroid',
        'Tocolytics',
        'Corticosteroids',
        'Other'
    )),
    
    -- Category Color (for UI)
    category_color TEXT NOT NULL,
    
    -- Dosage Forms
    form TEXT NOT NULL CHECK (form IN (
        'Tablet', 'Capsule', 'Syrup', 'Injection', 
        'Suppository', 'Cream', 'Drops', 'Sachet', 'Ampoule'
    )),
    strength TEXT NOT NULL,             -- e.g., "500mg", "5ml"
    
    -- Prescribing Info
    default_dose TEXT,                  -- e.g., "1 tablet"
    default_frequency TEXT,             -- e.g., "Once daily"
    default_duration TEXT,              -- e.g., "Throughout pregnancy"
    
    -- Safety
    trimester_safety JSONB DEFAULT '{"first": true, "second": true, "third": true}',
    warnings TEXT,
    
    -- Usage
    is_active BOOLEAN DEFAULT true,
    use_count INTEGER DEFAULT 0,        -- For smart sorting
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX idx_preg_med_trade ON public.pregnancy_medications(trade_name);
CREATE INDEX idx_preg_med_generic ON public.pregnancy_medications(generic_name);
CREATE INDEX idx_preg_med_category ON public.pregnancy_medications(category);
CREATE INDEX idx_preg_med_active ON public.pregnancy_medications(is_active) WHERE is_active = true;

-- ============================================================
-- CATEGORY COLORS REFERENCE
-- ============================================================
-- Vitamins & Supplements: #10B981 (Emerald)
-- Folic Acid: #8B5CF6 (Purple)
-- Iron & Calcium: #EF4444 (Red)
-- Anti-Nausea: #F59E0B (Amber)
-- Progesterone Support: #EC4899 (Pink)
-- Antihypertensive: #3B82F6 (Blue)
-- Antidiabetic: #06B6D4 (Cyan)
-- Antibiotics: #F97316 (Orange)
-- Antifungal: #84CC16 (Lime)
-- Pain Relief: #6366F1 (Indigo)
-- Antispasmodic: #14B8A6 (Teal)
-- Laxatives: #A855F7 (Violet)
-- Anticoagulants: #DC2626 (Red-dark)
-- Thyroid: #0EA5E9 (Sky)
-- Tocolytics: #D946EF (Fuchsia)
-- Corticosteroids: #64748B (Slate)
-- Other: #78716C (Stone)

-- ============================================================
-- EGYPTIAN MARKET MEDICATIONS DATA
-- ============================================================

INSERT INTO public.pregnancy_medications (trade_name, generic_name, manufacturer, category, category_color, form, strength, default_dose, default_frequency, default_duration, warnings) VALUES

-- ═══════════════════════════════════════════════════════════
-- FOLIC ACID (Purple #8B5CF6)
-- ═══════════════════════════════════════════════════════════
('Folicap', 'Folic Acid', 'Pharco', 'Folic Acid', '#8B5CF6', 'Capsule', '500mcg', '1 capsule', 'Once daily', 'First trimester', NULL),
('Folic Acid EIPICO', 'Folic Acid', 'EIPICO', 'Folic Acid', '#8B5CF6', 'Tablet', '5mg', '1 tablet', 'Once daily', 'Pre-conception to 12 weeks', 'High dose for history of NTD'),
('Folicum', 'Folic Acid', 'Amoun', 'Folic Acid', '#8B5CF6', 'Tablet', '1mg', '1 tablet', 'Once daily', 'Throughout pregnancy', NULL),

-- ═══════════════════════════════════════════════════════════
-- VITAMINS & SUPPLEMENTS (Emerald #10B981)
-- ═══════════════════════════════════════════════════════════
('Pregnacare', 'Prenatal Multivitamins', 'Vitabiotics', 'Vitamins & Supplements', '#10B981', 'Tablet', 'Complete', '1 tablet', 'Once daily', 'Throughout pregnancy', NULL),
('Elevit Pronatal', 'Prenatal Vitamins + Minerals', 'Bayer', 'Vitamins & Supplements', '#10B981', 'Tablet', 'Complete', '1 tablet', 'Once daily', 'Pre-conception onwards', NULL),
('Pregnavit', 'Prenatal Vitamins', 'Merck', 'Vitamins & Supplements', '#10B981', 'Capsule', 'Complete', '1 capsule', 'Once daily', 'Throughout pregnancy', NULL),
('Materna', 'Prenatal Multivitamins', 'Pfizer', 'Vitamins & Supplements', '#10B981', 'Tablet', 'Complete', '1 tablet', 'Once daily', 'Throughout pregnancy', NULL),
('Feroglobin', 'Iron + B12 + Folic', 'Vitabiotics', 'Vitamins & Supplements', '#10B981', 'Capsule', 'Complete', '1 capsule', 'Once daily', 'Throughout pregnancy', NULL),
('Perfectil', 'Skin + Hair Vitamins', 'Vitabiotics', 'Vitamins & Supplements', '#10B981', 'Tablet', 'Complete', '1 tablet', 'Once daily', 'As needed', NULL),
('Omega 3 Plus', 'Omega-3 Fatty Acids', 'Sedico', 'Vitamins & Supplements', '#10B981', 'Capsule', '1000mg', '1 capsule', 'Once daily', 'Second trimester onwards', NULL),
('Vitamin D3 DEVAROL', 'Cholecalciferol', 'Memphis', 'Vitamins & Supplements', '#10B981', 'Ampoule', '200000 IU', '1 ampoule', 'Monthly', 'As per levels', NULL),
('Vidrop', 'Vitamin D3 Drops', 'Medical Union', 'Vitamins & Supplements', '#10B981', 'Drops', '2800 IU/ml', '4 drops', 'Once daily', 'Throughout pregnancy', NULL),

-- ═══════════════════════════════════════════════════════════
-- IRON & CALCIUM (Red #EF4444)
-- ═══════════════════════════════════════════════════════════
('Haematinic', 'Ferrous Fumarate + Folic', 'Nile', 'Iron & Calcium', '#EF4444', 'Capsule', '350mg', '1 capsule', 'Once daily', 'Second trimester onwards', 'Take with vitamin C'),
('Feromax', 'Ferrous Fumarate', 'Pharco', 'Iron & Calcium', '#EF4444', 'Capsule', '350mg', '1 capsule', 'Once daily', 'As per Hb levels', 'May cause constipation'),
('Ferrosac', 'Iron Saccharate', 'Amoun', 'Iron & Calcium', '#EF4444', 'Ampoule', '100mg/5ml', '1 ampoule', 'Weekly IV', 'Severe anemia', 'IV infusion only'),
('Ferose F', 'Ferrous Sulphate + Folic', 'Spimaco', 'Iron & Calcium', '#EF4444', 'Tablet', '150mg', '1 tablet', 'Once daily', 'Throughout pregnancy', NULL),
('Calcitron', 'Calcium + Vitamin D', 'Amoun', 'Iron & Calcium', '#EF4444', 'Tablet', '600mg', '1 tablet', 'Twice daily', 'Second trimester onwards', 'Take with meals'),
('Caltrate', 'Calcium Carbonate + D3', 'Pfizer', 'Iron & Calcium', '#EF4444', 'Tablet', '600mg', '1 tablet', 'Twice daily', 'Second trimester onwards', NULL),
('Osteocare', 'Calcium + Magnesium + Zinc', 'Vitabiotics', 'Iron & Calcium', '#EF4444', 'Tablet', 'Complete', '1 tablet', 'Twice daily', 'Throughout pregnancy', NULL),
('Calcimax', 'Calcium + D3', 'EVA Pharma', 'Iron & Calcium', '#EF4444', 'Tablet', '500mg', '1 tablet', 'Twice daily', 'As needed', NULL),

-- ═══════════════════════════════════════════════════════════
-- ANTI-NAUSEA (Amber #F59E0B)
-- ═══════════════════════════════════════════════════════════
('Navidoxine', 'Doxylamine + Pyridoxine', 'Pharaonia', 'Anti-Nausea', '#F59E0B', 'Tablet', '10mg/10mg', '1 tablet', 'Three times daily', 'First trimester', 'Safe for pregnancy nausea'),
('Emetrex', 'Meclizine', 'Adwia', 'Anti-Nausea', '#F59E0B', 'Tablet', '25mg', '1 tablet', 'Twice daily', 'As needed', NULL),
('Vitamin B6', 'Pyridoxine', 'EIPICO', 'Anti-Nausea', '#F59E0B', 'Tablet', '40mg', '1 tablet', 'Three times daily', 'First trimester', 'First-line for nausea'),
('Dramamine', 'Dimenhydrinate', 'Pfizer', 'Anti-Nausea', '#F59E0B', 'Tablet', '50mg', '1 tablet', 'As needed', 'Short term', NULL),
('Zofran', 'Ondansetron', 'GSK', 'Anti-Nausea', '#F59E0B', 'Tablet', '4mg', '1 tablet', 'Twice daily', 'Severe cases', 'Use if other options fail'),
('Primperan', 'Metoclopramide', 'Sanofi', 'Anti-Nausea', '#F59E0B', 'Tablet', '10mg', '1 tablet', 'Three times daily', 'Short term', 'Max 5 days'),

-- ═══════════════════════════════════════════════════════════
-- PROGESTERONE SUPPORT (Pink #EC4899)
-- ═══════════════════════════════════════════════════════════
('Prontogest', 'Progesterone', 'Marcyrl', 'Progesterone Support', '#EC4899', 'Ampoule', '100mg', '1 ampoule', 'Daily IM', 'First trimester', 'Threatened abortion'),
('Cyclogest', 'Progesterone', 'Actavis', 'Progesterone Support', '#EC4899', 'Suppository', '400mg', '1 suppository', 'Twice daily', 'Until 12 weeks', 'Vaginal or rectal'),
('Utrogestan', 'Micronized Progesterone', 'Besins', 'Progesterone Support', '#EC4899', 'Capsule', '200mg', '2 capsules', 'At bedtime', 'Until 12 weeks', 'Vaginal route preferred'),
('Crinone', 'Progesterone Gel', 'Merck Serono', 'Progesterone Support', '#EC4899', 'Cream', '8%', '1 applicator', 'Once daily', 'Until 12 weeks', 'Vaginal gel'),
('Duphaston', 'Dydrogesterone', 'Abbott', 'Progesterone Support', '#EC4899', 'Tablet', '10mg', '1 tablet', 'Twice daily', 'Until 12-16 weeks', 'Oral progesterone'),
('Proluton Depot', 'Hydroxyprogesterone', 'Bayer', 'Progesterone Support', '#EC4899', 'Ampoule', '250mg', '1 ampoule', 'Weekly IM', 'High-risk pregnancy', 'Prevent preterm'),

-- ═══════════════════════════════════════════════════════════
-- ANTIHYPERTENSIVE (Blue #3B82F6)
-- ═══════════════════════════════════════════════════════════
('Aldomet', 'Methyldopa', 'MSD', 'Antihypertensive', '#3B82F6', 'Tablet', '250mg', '1 tablet', 'Three times daily', 'As needed', 'First-line for pregnancy HTN'),
('Labetalol', 'Labetalol', 'Various', 'Antihypertensive', '#3B82F6', 'Tablet', '100mg', '1 tablet', 'Twice daily', 'As needed', 'Second-line option'),
('Nifedipine', 'Nifedipine', 'Bayer', 'Antihypertensive', '#3B82F6', 'Tablet', '10mg', '1 tablet', 'Three times daily', 'As needed', 'Avoid sublingual'),
('Adalat Retard', 'Nifedipine SR', 'Bayer', 'Antihypertensive', '#3B82F6', 'Tablet', '20mg', '1 tablet', 'Twice daily', 'As needed', 'Slow release form'),
('Hydralazine', 'Hydralazine', 'Various', 'Antihypertensive', '#3B82F6', 'Ampoule', '20mg', '1 ampoule', 'IV PRN', 'Severe HTN', 'Hospital use'),

-- ═══════════════════════════════════════════════════════════
-- ANTIDIABETIC (Cyan #06B6D4)
-- ═══════════════════════════════════════════════════════════
('Insulatard', 'Isophane Insulin', 'Novo Nordisk', 'Antidiabetic', '#06B6D4', 'Injection', '100 IU/ml', 'Per protocol', 'Twice daily', 'As needed', 'GDM/DM in pregnancy'),
('Actrapid', 'Regular Insulin', 'Novo Nordisk', 'Antidiabetic', '#06B6D4', 'Injection', '100 IU/ml', 'Per protocol', 'Three times daily', 'As needed', 'Before meals'),
('Mixtard', 'Biphasic Insulin', 'Novo Nordisk', 'Antidiabetic', '#06B6D4', 'Injection', '30/70', 'Per protocol', 'Twice daily', 'As needed', 'Mixed insulin'),
('Lantus', 'Insulin Glargine', 'Sanofi', 'Antidiabetic', '#06B6D4', 'Injection', '100 IU/ml', 'Per protocol', 'Once daily', 'As needed', 'Basal insulin'),
('Levemir', 'Insulin Detemir', 'Novo Nordisk', 'Antidiabetic', '#06B6D4', 'Injection', '100 IU/ml', 'Per protocol', 'Once/Twice daily', 'As needed', 'Long-acting'),

-- ═══════════════════════════════════════════════════════════
-- ANTIBIOTICS (Orange #F97316)
-- ═══════════════════════════════════════════════════════════
('Amoxil', 'Amoxicillin', 'GSK', 'Antibiotics', '#F97316', 'Capsule', '500mg', '1 capsule', 'Three times daily', '7 days', 'Safe in pregnancy'),
('Augmentin', 'Amoxicillin/Clavulanate', 'GSK', 'Antibiotics', '#F97316', 'Tablet', '1g', '1 tablet', 'Twice daily', '7 days', 'Safe in pregnancy'),
('Cefzil', 'Cefprozil', 'BMS', 'Antibiotics', '#F97316', 'Tablet', '500mg', '1 tablet', 'Twice daily', '7 days', NULL),
('Velosef', 'Cephradine', 'BMS', 'Antibiotics', '#F97316', 'Capsule', '500mg', '1 capsule', 'Four times daily', '7 days', NULL),
('Zinnat', 'Cefuroxime', 'GSK', 'Antibiotics', '#F97316', 'Tablet', '500mg', '1 tablet', 'Twice daily', '7 days', NULL),
('Azithromycin', 'Azithromycin', 'Pfizer', 'Antibiotics', '#F97316', 'Tablet', '500mg', '1 tablet', 'Once daily', '3 days', NULL),
('Erythromycin', 'Erythromycin', 'Various', 'Antibiotics', '#F97316', 'Tablet', '500mg', '1 tablet', 'Four times daily', '7 days', 'Alternative to penicillin'),
('Nitrofurantoin', 'Nitrofurantoin', 'Various', 'Antibiotics', '#F97316', 'Capsule', '100mg', '1 capsule', 'Twice daily', '7 days', 'UTI - avoid at term'),

-- ═══════════════════════════════════════════════════════════
-- ANTIFUNGAL (Lime #84CC16)
-- ═══════════════════════════════════════════════════════════
('Gyno-Daktarin', 'Miconazole', 'Janssen', 'Antifungal', '#84CC16', 'Suppository', '400mg', '1 suppository', 'At bedtime', '3 days', 'Vaginal candidiasis'),
('Clotrimazole', 'Clotrimazole', 'Various', 'Antifungal', '#84CC16', 'Suppository', '500mg', '1 suppository', 'Single dose', 'One time', NULL),
('Gyno-Pevaryl', 'Econazole', 'Janssen', 'Antifungal', '#84CC16', 'Suppository', '150mg', '1 suppository', 'At bedtime', '3 days', NULL),
('Nystatin', 'Nystatin', 'BMS', 'Antifungal', '#84CC16', 'Suppository', '100000 IU', '1 suppository', 'Twice daily', '14 days', 'Safe throughout pregnancy'),

-- ═══════════════════════════════════════════════════════════
-- PAIN RELIEF (Indigo #6366F1)
-- ═══════════════════════════════════════════════════════════
('Panadol', 'Paracetamol', 'GSK', 'Pain Relief', '#6366F1', 'Tablet', '500mg', '2 tablets', 'Every 6 hours', 'As needed', 'Max 4g/day'),
('Adol', 'Paracetamol', 'Julphar', 'Pain Relief', '#6366F1', 'Tablet', '500mg', '2 tablets', 'Every 6 hours', 'As needed', NULL),
('Cetal', 'Paracetamol', 'EIPICO', 'Pain Relief', '#6366F1', 'Tablet', '500mg', '2 tablets', 'Every 6 hours', 'As needed', NULL),
('Paracetamol Supp', 'Paracetamol', 'Various', 'Pain Relief', '#6366F1', 'Suppository', '1000mg', '1 suppository', 'Every 8 hours', 'As needed', NULL),

-- ═══════════════════════════════════════════════════════════
-- ANTISPASMODIC (Teal #14B8A6)
-- ═══════════════════════════════════════════════════════════
('Visceralgine', 'Tiemonium', 'Sanofi', 'Antispasmodic', '#14B8A6', 'Tablet', '50mg', '1 tablet', 'Three times daily', 'As needed', 'Abdominal cramps'),
('Buscopan', 'Hyoscine', 'Boehringer', 'Antispasmodic', '#14B8A6', 'Tablet', '10mg', '1 tablet', 'Three times daily', 'As needed', NULL),
('Spasmofree', 'Hyoscine', 'Pharaonia', 'Antispasmodic', '#14B8A6', 'Ampoule', '20mg', '1 ampoule', 'IM/IV PRN', 'Acute pain', NULL),
('Duspatalin', 'Mebeverine', 'Abbott', 'Antispasmodic', '#14B8A6', 'Tablet', '135mg', '1 tablet', 'Three times daily', 'IBS symptoms', NULL),

-- ═══════════════════════════════════════════════════════════
-- LAXATIVES (Violet #A855F7)
-- ═══════════════════════════════════════════════════════════
('Lactulose', 'Lactulose', 'Various', 'Laxatives', '#A855F7', 'Syrup', '10g/15ml', '15ml', 'Twice daily', 'As needed', 'Osmotic laxative'),
('Agiolax', 'Plantago + Senna', 'MADAUS', 'Laxatives', '#A855F7', 'Sachet', '5g', '1 sachet', 'At bedtime', 'As needed', 'Natural fiber'),
('Fybogel', 'Ispaghula Husk', 'Reckitt', 'Laxatives', '#A855F7', 'Sachet', '3.5g', '1 sachet', 'Twice daily', 'As needed', 'Bulk-forming'),
('Movicol', 'Macrogol', 'Norgine', 'Laxatives', '#A855F7', 'Sachet', '13.8g', '1 sachet', 'Once daily', 'As needed', NULL),
('Dulcolax', 'Bisacodyl', 'Boehringer', 'Laxatives', '#A855F7', 'Tablet', '5mg', '1-2 tablets', 'At bedtime', 'Short term', 'Stimulant - use sparingly'),

-- ═══════════════════════════════════════════════════════════
-- ANTICOAGULANTS (Dark Red #DC2626)
-- ═══════════════════════════════════════════════════════════
('Clexane', 'Enoxaparin', 'Sanofi', 'Anticoagulants', '#DC2626', 'Injection', '40mg', '1 syringe', 'Once daily', 'As per protocol', 'LMWH prophylaxis'),
('Clexane 60', 'Enoxaparin', 'Sanofi', 'Anticoagulants', '#DC2626', 'Injection', '60mg', '1 syringe', 'Once daily', 'As per protocol', 'Therapeutic dose'),
('Innohep', 'Tinzaparin', 'LEO', 'Anticoagulants', '#DC2626', 'Injection', '4500 IU', '1 syringe', 'Once daily', 'As per protocol', 'Alternative LMWH'),
('Aspirin', 'Acetylsalicylic Acid', 'Bayer', 'Anticoagulants', '#DC2626', 'Tablet', '81mg', '1 tablet', 'Once daily', 'From 12 weeks', 'Pre-eclampsia prevention'),
('Jusprin', 'Aspirin', 'Pharco', 'Anticoagulants', '#DC2626', 'Tablet', '75mg', '1 tablet', 'Once daily', 'From 12 weeks', 'Low-dose aspirin'),

-- ═══════════════════════════════════════════════════════════
-- THYROID (Sky #0EA5E9)
-- ═══════════════════════════════════════════════════════════
('Eltroxin', 'Levothyroxine', 'GSK', 'Thyroid', '#0EA5E9', 'Tablet', '50mcg', '1 tablet', 'Once daily', 'Continuous', 'Take on empty stomach'),
('Eltroxin 100', 'Levothyroxine', 'GSK', 'Thyroid', '#0EA5E9', 'Tablet', '100mcg', '1 tablet', 'Once daily', 'Continuous', 'Adjust per TSH'),
('Euthyrox', 'Levothyroxine', 'Merck', 'Thyroid', '#0EA5E9', 'Tablet', '25mcg', '1 tablet', 'Once daily', 'Continuous', NULL),
('Thyrocil', 'Carbimazole', 'Nicholas', 'Thyroid', '#0EA5E9', 'Tablet', '5mg', '1 tablet', 'Three times daily', 'Hyperthyroid', 'PTU preferred in 1st tri'),
('PTU', 'Propylthiouracil', 'Various', 'Thyroid', '#0EA5E9', 'Tablet', '50mg', '1 tablet', 'Three times daily', 'First trimester', 'For hyperthyroidism'),

-- ═══════════════════════════════════════════════════════════
-- TOCOLYTICS (Fuchsia #D946EF)
-- ═══════════════════════════════════════════════════════════
('Yutopar', 'Ritodrine', 'Solvay', 'Tocolytics', '#D946EF', 'Tablet', '10mg', '1 tablet', 'Every 4 hours', 'Preterm labor', 'Tocolytic'),
('Gynipral', 'Hexoprenaline', 'Takeda', 'Tocolytics', '#D946EF', 'Ampoule', '10mcg', '1 ampoule', 'IV infusion', 'Preterm labor', 'Hospital use'),
('Tractocile', 'Atosiban', 'Ferring', 'Tocolytics', '#D946EF', 'Injection', '37.5mg', '1 vial', 'IV infusion', 'Preterm labor', 'Oxytocin antagonist'),
('Nifedipine', 'Nifedipine', 'Various', 'Tocolytics', '#D946EF', 'Tablet', '10mg', '1 tablet', 'Every 20 min', 'Acute tocolysis', 'Also antihypertensive'),

-- ═══════════════════════════════════════════════════════════
-- CORTICOSTEROIDS (Slate #64748B)
-- ═══════════════════════════════════════════════════════════
('Dexamethasone', 'Dexamethasone', 'Various', 'Corticosteroids', '#64748B', 'Ampoule', '8mg', '1 ampoule', 'IM x4 doses', 'Lung maturity', '24-34 weeks'),
('Betnesol', 'Betamethasone', 'GSK', 'Corticosteroids', '#64748B', 'Ampoule', '12mg', '1 ampoule', 'IM x2 doses', 'Lung maturity', '24-34 weeks'),
('Prednisolone', 'Prednisolone', 'Various', 'Corticosteroids', '#64748B', 'Tablet', '5mg', '1-4 tablets', 'Once daily', 'As needed', 'Autoimmune conditions'),
('Hydrocortisone', 'Hydrocortisone', 'Pfizer', 'Corticosteroids', '#64748B', 'Ampoule', '100mg', '1 ampoule', 'IV/IM', 'Emergency', 'Adrenal crisis');

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.pregnancy_medications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read medications
CREATE POLICY "Anyone can view pregnancy medications"
    ON public.pregnancy_medications FOR SELECT
    TO authenticated
    USING (true);

-- Allow doctors to manage medications
CREATE POLICY "Doctors can manage medications"
    ON public.pregnancy_medications FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.doctors))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.doctors));

-- ============================================================
-- FUNCTION: Increment use count for smart sorting
-- ============================================================

CREATE OR REPLACE FUNCTION increment_medication_use(med_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.pregnancy_medications
    SET use_count = use_count + 1
    WHERE id = med_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEW: Medications grouped by category
-- ============================================================

CREATE OR REPLACE VIEW public.pregnancy_medications_by_category AS
SELECT 
    category,
    category_color,
    COUNT(*) as medication_count,
    json_agg(json_build_object(
        'id', id,
        'trade_name', trade_name,
        'generic_name', generic_name,
        'form', form,
        'strength', strength,
        'default_dose', default_dose,
        'default_frequency', default_frequency
    ) ORDER BY use_count DESC, trade_name) as medications
FROM public.pregnancy_medications
WHERE is_active = true
GROUP BY category, category_color
ORDER BY category;

-- ============================================================
-- END OF PREGNANCY MEDICATIONS CATALOG
-- ============================================================
