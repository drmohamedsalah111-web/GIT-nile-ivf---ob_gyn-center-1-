-- ============================================================================
-- FIX NULL secretary_doctor_id VALUES
-- ============================================================================
-- This script fixes secretaries that have NULL secretary_doctor_id
-- by assigning them to a valid doctor
-- ============================================================================

-- Step 1: Find a valid doctor ID to assign to secretaries with NULL secretary_doctor_id
-- We'll use the first doctor with user_role = 'doctor'
DO $$
DECLARE
    valid_doctor_id UUID;
BEGIN
    -- Get the first available doctor ID
    SELECT id INTO valid_doctor_id
    FROM doctors
    WHERE user_role = 'doctor'
    LIMIT 1;

    -- If no doctor exists, create a default one
    IF valid_doctor_id IS NULL THEN
        INSERT INTO doctors (id, user_id, email, name, user_role, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000'::uuid, -- placeholder user_id
            'default@doctor.com',
            'Default Doctor',
            'doctor',
            now(),
            now()
        )
        RETURNING id INTO valid_doctor_id;
    END IF;

    -- Update all secretaries with NULL secretary_doctor_id
    UPDATE doctors
    SET secretary_doctor_id = valid_doctor_id
    WHERE user_role = 'secretary'
    AND secretary_doctor_id IS NULL;

    -- Log the result
    RAISE NOTICE 'Updated secretaries with NULL secretary_doctor_id to point to doctor ID: %', valid_doctor_id;
END $$;

-- Step 2: Verify the fix
SELECT
    id,
    name,
    email,
    user_role,
    secretary_doctor_id,
    CASE
        WHEN user_role = 'secretary' AND secretary_doctor_id IS NULL THEN 'ERROR: Still NULL'
        WHEN user_role = 'secretary' AND secretary_doctor_id IS NOT NULL THEN 'FIXED'
        ELSE 'OK'
    END as status
FROM doctors
WHERE user_role = 'secretary'
ORDER BY name;

-- Step 3: Ensure the referenced doctor exists
SELECT
    s.id as secretary_id,
    s.name as secretary_name,
    s.secretary_doctor_id,
    d.name as doctor_name,
    d.user_role as doctor_role
FROM doctors s
LEFT JOIN doctors d ON s.secretary_doctor_id = d.id
WHERE s.user_role = 'secretary'
ORDER BY s.name;