-- ⚠️ هام جداً: استبدل البريد الإلكتروني في الأسفل ببريدك الإلكتروني الذي تسجل الدخول به
-- ⚠️ IMPORTANT: Replace the email below with your login email

DO $$
DECLARE
    v_target_email text := 'secretary@test.com'; -- 👈 ضع بريدك هنا | Put your email here
    v_user_id uuid;
    v_doctor_id uuid;
BEGIN
    -- 1. الحصول على معرف المستخدم من جدول auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User not found with email: %', v_target_email;
        RETURN;
    END IF;

    -- 2. الحصول على معرف أي طبيب لربط السكرتيرة به (مطلوب للسكرتيرة)
    SELECT id INTO v_doctor_id FROM doctors WHERE user_role = 'doctor' LIMIT 1;
    
    IF v_doctor_id IS NULL THEN
        RAISE NOTICE 'No doctor found to link to!';
        -- يمكننا المتابعة بدون ربط مؤقتاً
    END IF;

    -- 3. تحديث أو إنشاء سجل في جدول doctors
    -- نحاول التحديث أولاً
    UPDATE doctors 
    SET 
        user_role = 'secretary',
        secretary_doctor_id = v_doctor_id
    WHERE user_id = v_user_id;
    
    IF NOT FOUND THEN
        -- إذا لم يوجد سجل، نقوم بإنشائه
        INSERT INTO doctors (id, user_id, email, name, user_role, secretary_doctor_id)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            v_target_email,
            'Secretary (Forced)',
            'secretary',
            v_doctor_id
        );
        RAISE NOTICE 'Created new secretary profile for %', v_target_email;
    ELSE
        RAISE NOTICE 'Updated existing profile to secretary for %', v_target_email;
    END IF;

    -- 4. التأكد من أن الدالة get_my_role موجودة وتعمل
    -- (هذا الجزء يعيد تعريف الدالة للتأكد)
    CREATE OR REPLACE FUNCTION get_my_role()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
        v_role text;
    BEGIN
        SELECT user_role INTO v_role
        FROM doctors
        WHERE user_id = auth.uid();
        RETURN v_role;
    END;
    $func$;

    GRANT EXECUTE ON FUNCTION get_my_role TO authenticated;
    GRANT EXECUTE ON FUNCTION get_my_role TO anon;

END $$;
