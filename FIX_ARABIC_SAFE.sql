-- ============================================================================
-- SAFE ARABIC TEXT FIX - Handles missing tables gracefully
-- ============================================================================
-- This script fixes garbled Arabic text (mojibake) only for tables that exist

DO $$
BEGIN
  -- 1. FIX app_settings TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings') THEN
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
    RAISE NOTICE 'Fixed app_settings table';
  ELSE
    RAISE NOTICE 'Table app_settings does not exist - skipped';
  END IF;

  -- 2. FIX patients TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
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
    RAISE NOTICE 'Fixed patients table';
  ELSE
    RAISE NOTICE 'Table patients does not exist - skipped';
  END IF;

  -- 3. FIX visits TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits') THEN
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
    RAISE NOTICE 'Fixed visits table';
  ELSE
    RAISE NOTICE 'Table visits does not exist - skipped';
  END IF;

  -- 4. FIX prescriptions TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescriptions') THEN
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
    RAISE NOTICE 'Fixed prescriptions table';
  ELSE
    RAISE NOTICE 'Table prescriptions does not exist - skipped';
  END IF;

  -- 5. FIX lab_requests TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_requests') THEN
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
    WHERE test_name LIKE 'Ø%' OR notes LIKE 'Ø%';
    RAISE NOTICE 'Fixed lab_requests table';
  ELSE
    RAISE NOTICE 'Table lab_requests does not exist - skipped';
  END IF;

  -- 6. FIX infertility_workups TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'infertility_workups') THEN
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
    WHERE assessment_notes LIKE 'Ø%' OR clinical_impression LIKE 'Ø%' OR recommendations LIKE 'Ø%';
    RAISE NOTICE 'Fixed infertility_workups table';
  ELSE
    RAISE NOTICE 'Table infertility_workups does not exist - skipped';
  END IF;

  -- 7. FIX obstetric_visits TABLE (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obstetric_visits') THEN
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
    WHERE clinical_notes LIKE 'Ø%' OR assessment LIKE 'Ø%' OR plan LIKE 'Ø%';
    RAISE NOTICE 'Fixed obstetric_visits table';
  ELSE
    RAISE NOTICE 'Table obstetric_visits does not exist - skipped';
  END IF;

  RAISE NOTICE 'Encoding fix completed!';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION - List all existing tables
-- ============================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
