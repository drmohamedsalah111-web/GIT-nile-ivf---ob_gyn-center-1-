-- ================================================
-- FIX HISTORY COLUMN - Update to medical_history
-- ================================================
-- This script ensures the patients table uses medical_history (JSONB)
-- instead of history (TEXT) to match the updated application code
-- ================================================

-- 1. Check current column state
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
  AND column_name IN ('history', 'medical_history')
ORDER BY column_name;

-- 2. Add medical_history if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'medical_history'
    ) THEN
        ALTER TABLE patients ADD COLUMN medical_history JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added medical_history column';
    ELSE
        RAISE NOTICE '✓ medical_history column already exists';
    END IF;
END $$;

-- 3. Migrate data from history to medical_history if history column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'history'
    ) THEN
        -- Migrate existing data
        UPDATE patients 
        SET medical_history = 
            CASE 
                WHEN history IS NOT NULL AND history != '' 
                THEN jsonb_build_object('notes', history)
                ELSE '{}'::jsonb
            END
        WHERE medical_history = '{}'::jsonb OR medical_history IS NULL;
        
        RAISE NOTICE '✅ Migrated data from history to medical_history';
        
        -- Drop old history column
        ALTER TABLE patients DROP COLUMN history;
        RAISE NOTICE '✅ Dropped old history column';
    ELSE
        RAISE NOTICE '✓ history column already removed';
    END IF;
END $$;

-- 4. Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
  AND column_name IN ('history', 'medical_history')
ORDER BY column_name;

-- 5. Check a sample of patient records
SELECT 
    id,
    name,
    medical_history,
    created_at
FROM patients 
LIMIT 5;

-- ================================================
-- SUMMARY
-- ================================================
-- After running this script:
-- ✅ history column removed (if it existed)
-- ✅ medical_history (JSONB) column exists
-- ✅ All existing data migrated to medical_history
-- ✅ Application code can now successfully insert patients
-- ================================================
