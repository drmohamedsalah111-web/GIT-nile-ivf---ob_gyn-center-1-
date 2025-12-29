-- ============================================================================
-- 🦸‍♂️ UPGRADE ACCOUNT TO DOCTOR (ترقية الحساب لطبيب)
-- ============================================================================
-- 1. Replace 'YOUR_EMAIL_HERE' with the account email.
-- 2. Run this script in Supabase SQL Editor.
-- ============================================================================

DO $$
DECLARE
    target_email TEXT := 'YOUR_EMAIL_HERE'; -- 👈 PUT EMAIL HERE | ضع الإيميل هنا
    user_id UUID;
    new_doctor_id UUID;
BEGIN
    -- 1. Get the user ID
    SELECT id INTO new_doctor_id FROM doctors WHERE email = target_email;

    IF new_doctor_id IS NULL THEN
        RAISE NOTICE '❌ User not found with email: %', target_email;
        RETURN;
    END IF;

    -- 2. Upgrade Role
    UPDATE doctors
    SET 
        user_role = 'doctor',
        doctor_id = NULL, -- Remove link to other doctors
        specialty = COALESCE(specialty, 'IVF Specialist'), -- Correct column name
        role = 'doctor', -- Sync legacy role column

    WHERE id = new_doctor_id;

    RAISE NOTICE '✅ User upgraded to Doctor role.';

    -- 3. Create a fresh Subscription (Enterprise Plan)
    --    This ensures the new doctor can login immediately without "Subscription Expired" error.
    INSERT INTO clinic_subscriptions (clinic_id, plan_id, status, start_date, end_date, payment_method, notes)
    SELECT 
        new_doctor_id,
        (SELECT id FROM subscription_plans WHERE name = 'enterprise' LIMIT 1),
        'active',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '10 years', -- 10 Years Access
        'cash',
        'Auto-generated upon upgrade to Doctor'
    ON CONFLICT (clinic_id) 
    DO UPDATE SET 
        status = 'active',
        end_date = CURRENT_DATE + INTERVAL '10 years';

    RAISE NOTICE '✅ Created active Enterprise subscription for the new doctor.';

END $$;
