-- ============================================================================
-- 🔧 FIX: Add missing clinic_id column to doctors table and backfill
-- ============================================================================

-- Step 1: Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'clinic_id'
    ) THEN
        ALTER TABLE doctors ADD COLUMN clinic_id UUID REFERENCES doctors(id);
        RAISE NOTICE 'Added clinic_id column to doctors table';
    ELSE
        RAISE NOTICE 'clinic_id column already exists';
    END IF;
END $$;

-- Step 2: Backfill clinic_id
-- 2.1 For Doctors: The clinic_id is their own ID
UPDATE doctors 
SET clinic_id = id 
WHERE user_role = 'doctor' AND clinic_id IS NULL;

-- 2.2 For Secretaries: The clinic_id is their assigned doctor (secretary_doctor_id)
UPDATE doctors 
SET clinic_id = secretary_doctor_id 
WHERE user_role = 'secretary' AND clinic_id IS NULL AND secretary_doctor_id IS NOT NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);

-- Step 4: Verification
SELECT 
    'Verification' as step,
    COUNT(*) as total_users,
    COUNT(CASE WHEN clinic_id IS NOT NULL THEN 1 END) as with_clinic_id,
    COUNT(CASE WHEN clinic_id IS NULL THEN 1 END) as missing_clinic_id
FROM doctors;

-- Show sample of updated rows
SELECT id, name, user_role, clinic_id 
FROM doctors 
LIMIT 5;
