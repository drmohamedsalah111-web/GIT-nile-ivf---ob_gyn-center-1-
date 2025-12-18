-- ============================================================================
-- ARABIC TEXT MOJIBAKE FIX - IVF Cycles Table
-- ============================================================================
-- This script fixes garbled Arabic text in JSONB columns by converting
-- from incorrectly decoded UTF-8 (stored as Latin-1) back to proper UTF-8.
--
-- Problem: Arabic text like "المريضة" appears as "Ø§Ù„Ù…Ø±ÙŠØ¶Ø©"
-- Solution: Use convert_from(convert_to(..., 'LATIN1'), 'UTF8') to repair
-- ============================================================================

-- ============================================================================
-- STEP 1: BACKUP CHECK - Verify corrupted data exists
-- ============================================================================
-- Run this first to see how many rows are affected
SELECT 
    id,
    patient_id,
    created_at,
    assessment_data::text AS assessment_sample,
    CASE 
        WHEN assessment_data::text LIKE 'Ø%' THEN 'CORRUPTED'
        ELSE 'OK'
    END as assessment_status,
    CASE 
        WHEN lab_data::text LIKE 'Ø%' THEN 'CORRUPTED'
        ELSE 'OK'
    END as lab_status,
    CASE 
        WHEN outcome_data::text LIKE 'Ø%' THEN 'CORRUPTED'
        ELSE 'OK'
    END as outcome_status
FROM ivf_cycles
WHERE 
    assessment_data::text LIKE 'Ø%' OR 
    lab_data::text LIKE 'Ø%' OR 
    outcome_data::text LIKE 'Ø%'
LIMIT 10;

-- ============================================================================
-- STEP 2: FIX ASSESSMENT_DATA COLUMN
-- ============================================================================
-- Converts: "Ø§Ù„Ù…Ø±ÙŠØ¶Ø©" -> "المريضة"
UPDATE ivf_cycles
SET assessment_data = CASE
    WHEN assessment_data::text LIKE 'Ø%' THEN
        convert(
            convert_to(assessment_data::text, 'LATIN1'),
            'LATIN1'::name,
            'UTF8'::name
        )::jsonb
    ELSE assessment_data
END,
updated_at = now()
WHERE assessment_data::text LIKE 'Ø%';

-- ============================================================================
-- STEP 3: FIX LAB_DATA COLUMN
-- ============================================================================
UPDATE ivf_cycles
SET lab_data = CASE
    WHEN lab_data::text LIKE 'Ø%' THEN
        convert(
            convert_to(lab_data::text, 'LATIN1'),
            'LATIN1'::name,
            'UTF8'::name
        )::jsonb
    ELSE lab_data
END,
updated_at = now()
WHERE lab_data::text LIKE 'Ø%';

-- ============================================================================
-- STEP 4: FIX TRANSFER_DATA COLUMN
-- ============================================================================
UPDATE ivf_cycles
SET transfer_data = CASE
    WHEN transfer_data::text LIKE 'Ø%' THEN
        convert(
            convert_to(transfer_data::text, 'LATIN1'),
            'LATIN1'::name,
            'UTF8'::name
        )::jsonb
    ELSE transfer_data
END,
updated_at = now()
WHERE transfer_data::text LIKE 'Ø%';

-- ============================================================================
-- STEP 5: FIX OUTCOME_DATA COLUMN
-- ============================================================================
UPDATE ivf_cycles
SET outcome_data = CASE
    WHEN outcome_data::text LIKE 'Ø%' THEN
        convert(
            convert_to(outcome_data::text, 'LATIN1'),
            'LATIN1'::name,
            'UTF8'::name
        )::jsonb
    ELSE outcome_data
END,
updated_at = now()
WHERE outcome_data::text LIKE 'Ø%';

-- ============================================================================
-- STEP 6: VERIFY FIX - Check if corruption is resolved
-- ============================================================================
-- Run this to confirm the fix worked
SELECT 
    id,
    patient_id,
    created_at,
    assessment_data::text AS assessment_sample,
    CASE 
        WHEN assessment_data::text LIKE 'Ø%' THEN 'STILL CORRUPTED'
        WHEN assessment_data::text LIKE '%المريضة%' THEN 'FIXED ✓'
        ELSE 'CLEAN'
    END as assessment_status,
    CASE 
        WHEN lab_data::text LIKE 'Ø%' THEN 'STILL CORRUPTED'
        ELSE 'CLEAN'
    END as lab_status,
    CASE 
        WHEN outcome_data::text LIKE 'Ø%' THEN 'STILL CORRUPTED'
        ELSE 'CLEAN'
    END as outcome_status
FROM ivf_cycles
WHERE 
    assessment_data IS NOT NULL OR 
    lab_data IS NOT NULL OR 
    outcome_data IS NOT NULL
LIMIT 10;

-- ============================================================================
-- STEP 7: COUNT UPDATED ROWS
-- ============================================================================
-- This shows you how many rows were affected by the fix
SELECT 
    'assessment_data' as column_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE assessment_data::text LIKE '%المريضة%') as fixed_rows,
    COUNT(*) FILTER (WHERE assessment_data::text LIKE 'Ø%') as still_corrupted
FROM ivf_cycles
UNION ALL
SELECT 
    'lab_data',
    COUNT(*),
    COUNT(*) FILTER (WHERE lab_data::text LIKE '%المريضة%'),
    COUNT(*) FILTER (WHERE lab_data::text LIKE 'Ø%')
FROM ivf_cycles
UNION ALL
SELECT 
    'transfer_data',
    COUNT(*),
    COUNT(*) FILTER (WHERE transfer_data::text LIKE '%المريضة%'),
    COUNT(*) FILTER (WHERE transfer_data::text LIKE 'Ø%')
FROM ivf_cycles
UNION ALL
SELECT 
    'outcome_data',
    COUNT(*),
    COUNT(*) FILTER (WHERE outcome_data::text LIKE '%المريضة%'),
    COUNT(*) FILTER (WHERE outcome_data::text LIKE 'Ø%')
FROM ivf_cycles;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copy ENTIRE script to Supabase SQL Editor
-- 2. Run it (▶️ button)
-- 3. Check the verification queries output (Step 6 & 7)
-- 4. Hard refresh your app (Ctrl+Shift+R)
-- 5. Test that Arabic text now displays correctly
--
-- If you see "STILL CORRUPTED" in Step 6 output:
--   - The conversion method may need adjustment
--   - Try the ALTERNATIVE_FIX_METHOD.sql script
-- ============================================================================
