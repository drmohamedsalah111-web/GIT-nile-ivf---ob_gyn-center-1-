-- ============================================================================
-- FORCE FIX FOR SPECIFIC USER ID
-- ============================================================================
-- Replace 'YOUR_USER_ID_HERE' with the ID you found in the console (e.g., dd67a83e...)
-- ============================================================================

DO $$
DECLARE
    v_target_user_id uuid := 'dd67a83e-0105-4099-bb56-138b88b18f49'; -- 👈 I put the ID from your logs here
    v_doctor_id uuid;
BEGIN
    -- 1. Find the main doctor
    SELECT id INTO v_doctor_id 
    FROM doctors 
    WHERE email = 'dr.mohamed.salah.gabr@gmail.com' 
    LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RAISE NOTICE '❌ Main doctor not found!';
        RETURN;
    END IF;

    -- 2. Force update the specific user ID to be a secretary
    UPDATE doctors 
    SET 
        user_role = 'secretary',
        secretary_doctor_id = v_doctor_id
    WHERE user_id = v_target_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Successfully forced user % to be a SECRETARY linked to doctor %', v_target_user_id, v_doctor_id;
    ELSE
        RAISE NOTICE '⚠️ User % not found in doctors table. Creating record...', v_target_user_id;
        
        INSERT INTO doctors (id, user_id, email, name, user_role, secretary_doctor_id)
        VALUES (
            gen_random_uuid(),
            v_target_user_id,
            'Unknown User', -- We don't know the email, but we have the ID
            'Forced Secretary',
            'secretary',
            v_doctor_id
        );
        RAISE NOTICE '✅ Created new secretary record for user %', v_target_user_id;
    END IF;

END $$;
