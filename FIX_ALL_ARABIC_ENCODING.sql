-- ============================================================================
-- COMPLETE ARABIC TEXT FIX - All Tables
-- ============================================================================
-- This script fixes garbled Arabic text (mojibake) across ALL tables in the database
-- that contain Arabic text in any column.
-- ============================================================================

-- ============================================================================
-- 1. FIX app_settings TABLE
-- ============================================================================
-- These contain clinic name and branding info

UPDATE app_settings
SET clinic_name = CASE
    WHEN clinic_name LIKE 'Ø%' THEN convert_from(convert_to(clinic_name, 'LATIN1'), 'UTF8')
    ELSE clinic_name
END,
clinic_address = CASE
    WHEN clinic_address LIKE 'Ø%' THEN convert_from(convert_to(clinic_address, 'LATIN1'), 'UTF8')
    ELSE clinic_address
END,
clinic_phone = CASE
    WHEN clinic_phone LIKE 'Ø%' THEN convert_from(convert_to(clinic_phone, 'LATIN1'), 'UTF8')
    ELSE clinic_phone
END,
updated_at = now()
WHERE clinic_name LIKE 'Ø%' OR clinic_address LIKE 'Ø%' OR clinic_phone LIKE 'Ø%';

-- ============================================================================
-- 2. FIX patients TABLE
-- ============================================================================
UPDATE patients
SET name = CASE
    WHEN name LIKE 'Ø%' THEN convert_from(convert_to(name, 'LATIN1'), 'UTF8')
    ELSE name
END,
husband_name = CASE
    WHEN husband_name LIKE 'Ø%' THEN convert_from(convert_to(husband_name, 'LATIN1'), 'UTF8')
    ELSE husband_name
END,
history = CASE
    WHEN history LIKE 'Ø%' THEN convert_from(convert_to(history, 'LATIN1'), 'UTF8')
    ELSE history
END,
updated_at = now()
WHERE name LIKE 'Ø%' OR husband_name LIKE 'Ø%' OR history LIKE 'Ø%';

-- ============================================================================
-- 3. FIX visits TABLE
-- ============================================================================
UPDATE visits
SET diagnosis = CASE
    WHEN diagnosis LIKE 'Ø%' THEN convert_from(convert_to(diagnosis, 'LATIN1'), 'UTF8')
    ELSE diagnosis
END,
notes = CASE
    WHEN notes LIKE 'Ø%' THEN convert_from(convert_to(notes, 'LATIN1'), 'UTF8')
    ELSE notes
END,
updated_at = now()
WHERE diagnosis LIKE 'Ø%' OR notes LIKE 'Ø%';

-- ============================================================================
-- 4. FIX prescriptions TABLE
-- ============================================================================
UPDATE prescriptions
SET drug_name = CASE
    WHEN drug_name LIKE 'Ø%' THEN convert_from(convert_to(drug_name, 'LATIN1'), 'UTF8')
    ELSE drug_name
END,
notes = CASE
    WHEN notes LIKE 'Ø%' THEN convert_from(convert_to(notes, 'LATIN1'), 'UTF8')
    ELSE notes
END,
updated_at = now()
WHERE drug_name LIKE 'Ø%' OR notes LIKE 'Ø%';

-- ============================================================================
-- 5. FIX lab_requests TABLE (IF EXISTS)
-- ============================================================================
UPDATE lab_requests
SET test_name = CASE
    WHEN test_name LIKE 'Ø%' THEN convert_from(convert_to(test_name, 'LATIN1'), 'UTF8')
    ELSE test_name
END,
notes = CASE
    WHEN notes LIKE 'Ø%' THEN convert_from(convert_to(notes, 'LATIN1'), 'UTF8')
    ELSE notes
END,
updated_at = now()
WHERE test_name LIKE 'Ø%' OR notes LIKE 'Ø%'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_requests');

-- ============================================================================
-- 6. FIX infertility_workups TABLE (IF EXISTS)
-- ============================================================================
UPDATE infertility_workups
SET assessment_notes = CASE
    WHEN assessment_notes LIKE 'Ø%' THEN convert_from(convert_to(assessment_notes, 'LATIN1'), 'UTF8')
    ELSE assessment_notes
END,
clinical_impression = CASE
    WHEN clinical_impression LIKE 'Ø%' THEN convert_from(convert_to(clinical_impression, 'LATIN1'), 'UTF8')
    ELSE clinical_impression
END,
recommendations = CASE
    WHEN recommendations LIKE 'Ø%' THEN convert_from(convert_to(recommendations, 'LATIN1'), 'UTF8')
    ELSE recommendations
END,
updated_at = now()
WHERE assessment_notes LIKE 'Ø%' OR clinical_impression LIKE 'Ø%' OR recommendations LIKE 'Ø%'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'infertility_workups');

-- ============================================================================
-- 7. FIX obstetric_visits TABLE (IF EXISTS)
-- ============================================================================
UPDATE obstetric_visits
SET clinical_notes = CASE
    WHEN clinical_notes LIKE 'Ø%' THEN convert_from(convert_to(clinical_notes, 'LATIN1'), 'UTF8')
    ELSE clinical_notes
END,
assessment = CASE
    WHEN assessment LIKE 'Ø%' THEN convert_from(convert_to(assessment, 'LATIN1'), 'UTF8')
    ELSE assessment
END,
plan = CASE
    WHEN plan LIKE 'Ø%' THEN convert_from(convert_to(plan, 'LATIN1'), 'UTF8')
    ELSE plan
END,
updated_at = now()
WHERE clinical_notes LIKE 'Ø%' OR assessment LIKE 'Ø%' OR plan LIKE 'Ø%'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obstetric_visits');

-- ============================================================================
-- 8. VERIFY FIXES
-- ============================================================================
-- Check each table for remaining corruption
SELECT 'app_settings' as table_name, COUNT(*) as corrupted_rows
FROM app_settings
WHERE clinic_name LIKE 'Ø%' OR clinic_address LIKE 'Ø%'
UNION ALL
SELECT 'patients', COUNT(*)
FROM patients
WHERE name LIKE 'Ø%' OR husband_name LIKE 'Ø%'
UNION ALL
SELECT 'visits', COUNT(*)
FROM visits
WHERE diagnosis LIKE 'Ø%' OR notes LIKE 'Ø%'
UNION ALL
SELECT 'prescriptions', COUNT(*)
FROM prescriptions
WHERE drug_name LIKE 'Ø%' OR notes LIKE 'Ø%'
ORDER BY table_name;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copy entire script to Supabase SQL Editor
-- 2. Run it (▶️ button)
-- 3. Check verification query output - all tables should show 0 corrupted_rows
-- 4. Hard refresh your app (Ctrl+Shift+R)
-- 5. Arabic text should now display correctly throughout the system
-- ============================================================================
