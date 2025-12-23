-- ============================================================================
-- FIX DATA ROLES: LINK SECRETARY TO DOCTOR
-- ============================================================================

DO $$
DECLARE
    v_doctor_id uuid;
BEGIN
    -- 1. Find the main doctor's ID (Dr. Mohamed Salah Gabr)
    SELECT id INTO v_doctor_id 
    FROM doctors 
    WHERE email = 'dr.mohamed.salah.gabr@gmail.com' 
    LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RAISE NOTICE '❌ Main doctor not found! Cannot link secretary.';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Found Doctor ID: %', v_doctor_id;

    -- 2. Update the reception account to be a SECRETARY
    UPDATE doctors 
    SET 
        user_role = 'secretary',
        secretary_doctor_id = v_doctor_id
    WHERE email = 'reception@clinic.com';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Updated reception@clinic.com to be a SECRETARY.';
    ELSE
        RAISE NOTICE '⚠️ reception@clinic.com not found in doctors table.';
    END IF;

    -- 3. Also update 'aya@form.com' just in case that is the one you are testing with
    UPDATE doctors 
    SET 
        user_role = 'secretary',
        secretary_doctor_id = v_doctor_id
    WHERE email = 'aya@form.com';

    IF FOUND THEN
        RAISE NOTICE '✅ Updated aya@form.com to be a SECRETARY.';
    END IF;

END $$;

-- ============================================================================
-- VERIFICATION (Run this line separately if needed)
-- ============================================================================
SELECT email, user_role, secretary_doctor_id FROM doctors;
