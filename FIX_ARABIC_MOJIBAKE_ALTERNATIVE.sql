-- ============================================================================
-- ALTERNATIVE METHOD: ARABIC TEXT MOJIBAKE FIX
-- ============================================================================
-- Use this if the primary fix method (FIX_ARABIC_MOJIBAKE.sql) doesn't work.
-- This method uses pgcrypto's convert_from with explicit encoding specification.
-- ============================================================================

-- ============================================================================
-- ENSURE EXTENSION IS AVAILABLE
-- ============================================================================
-- (pgcrypto should be available by default in Supabase)

-- ============================================================================
-- ALTERNATIVE FIX: Using convert_from with explicit UTF-8 validation
-- ============================================================================

-- For ASSESSMENT_DATA
UPDATE ivf_cycles
SET assessment_data = 
    convert_from(
        decode(
            encode(assessment_data::text::bytea, 'escape'),
            'escape'
        ),
        'UTF8'
    )::jsonb,
updated_at = now()
WHERE assessment_data::text LIKE 'Ø%';

-- For LAB_DATA
UPDATE ivf_cycles
SET lab_data = 
    convert_from(
        decode(
            encode(lab_data::text::bytea, 'escape'),
            'escape'
        ),
        'UTF8'
    )::jsonb,
updated_at = now()
WHERE lab_data::text LIKE 'Ø%';

-- For TRANSFER_DATA
UPDATE ivf_cycles
SET transfer_data = 
    convert_from(
        decode(
            encode(transfer_data::text::bytea, 'escape'),
            'escape'
        ),
        'UTF8'
    )::jsonb,
updated_at = now()
WHERE transfer_data::text LIKE 'Ø%';

-- For OUTCOME_DATA
UPDATE ivf_cycles
SET outcome_data = 
    convert_from(
        decode(
            encode(outcome_data::text::bytea, 'escape'),
            'escape'
        ),
        'UTF8'
    )::jsonb,
updated_at = now()
WHERE outcome_data::text LIKE 'Ø%';

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================
SELECT 
    id,
    assessment_data::text as sample
FROM ivf_cycles
WHERE assessment_data::text LIKE '%المريضة%' OR assessment_data::text LIKE 'Ø%'
LIMIT 5;
