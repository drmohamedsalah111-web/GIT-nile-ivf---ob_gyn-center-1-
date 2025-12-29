-- ============================================================================
-- 🚑 FIX DR. MOHAMED SALAH GABR ACCOUNT (إصلاح حساب د. محمد صلاح)
-- ============================================================================
-- Targeted Fix for email: dr.mohamed.salah.gabr@gmail.com
-- ============================================================================

DO $$
DECLARE
    target_email TEXT := 'dr.mohamed.salah.gabr@gmail.com';
    target_user_id UUID;
BEGIN
    -- 1. Find the User ID from the doctors table
    SELECT user_id INTO target_user_id 
    FROM doctors 
    WHERE email = target_email 
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found in public.doctors with email: %', target_email;
        -- Optional: Strategy to find in auth.users if not in doctors table (requires specific permissions)
        RETURN;
    END IF;

    -- 2. Force Update the Role in public.doctors
    --    CRITICAL: Set secretary_doctor_id to NULL to prevent inferred secretary role logic
    UPDATE doctors
    SET 
        user_role = 'doctor',
        secretary_doctor_id = NULL,  -- Remove any link to other doctors
        specialty = 'Consultant (Owner)', -- Correct column name from schema
        role = 'doctor', -- Sync legacy role column just in case
        updated_at = NOW()
    WHERE email = target_email;

    RAISE NOTICE '✅ Role updated to DOCTOR and Secretary Links removed for: %', target_email;

    -- 3. ENSURE VALID SUBSCRIPTION
    --    Upsert an active Enterprise subscription effectively valid forever (10 years)
    INSERT INTO clinic_subscriptions (
        clinic_id, plan_id, status, start_date, end_date, payment_method, notes
    )
    SELECT 
        (SELECT id FROM doctors WHERE email = target_email LIMIT 1),
        (SELECT id FROM subscription_plans WHERE name = 'enterprise' LIMIT 1),
        'active',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '10 years',
        'cash',
        'Fixed by System Admin'
    ON CONFLICT (clinic_id) 
    DO UPDATE SET 
        status = 'active',
        end_date = CURRENT_DATE + INTERVAL '10 years',
        updated_at = NOW();

    RAISE NOTICE '✅ 10-Year Subscription Activated for: %', target_email;

END $$;

-- 4. Flush Caches (just in case)
NOTIFY pgrst, 'reload config';
