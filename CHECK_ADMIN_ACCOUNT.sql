-- 🔍 فحص حساب الأدمن والتحقق من البيانات
-- نسخ هذا في Supabase SQL Editor

-- 1. التحقق من وجود الحساب
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at,
    last_login,
    LENGTH(password_hash) as hash_length,
    SUBSTRING(password_hash, 1, 10) as hash_preview
FROM public.admins 
WHERE email = 'admin@clinic.com';

-- 2. إذا لم يظهر شيء، معناها الحساب غير موجود
-- قم بتشغيل الكود التالي لإنشاء الحساب:

DO $$ 
DECLARE
    admin_count INTEGER;
BEGIN
    -- التحقق من وجود الحساب
    SELECT COUNT(*) INTO admin_count 
    FROM public.admins 
    WHERE email = 'admin@clinic.com';
    
    IF admin_count = 0 THEN
        -- إنشاء الحساب
        INSERT INTO public.admins (
            name,
            email,
            password_hash,
            role,
            is_active,
            created_at
        ) VALUES (
            'المدير العام',
            'admin@clinic.com',
            '$2b$10$qdyzC6xmvoez8XNrdOWPKufMSpBoWpouhULPwCA976SmwiEzyiMOK',
            'super_admin',
            true,
            NOW()
        );
        
        RAISE NOTICE '✅ تم إنشاء حساب السوبر أدمن';
        RAISE NOTICE '📧 البريد: admin@clinic.com';
        RAISE NOTICE '🔑 كلمة المرور: Admin@123';
    ELSE
        -- تحديث كلمة المرور
        UPDATE public.admins 
        SET 
            password_hash = '$2b$10$qdyzC6xmvoez8XNrdOWPKufMSpBoWpouhULPwCA976SmwiEzyiMOK',
            is_active = true,
            updated_at = NOW()
        WHERE email = 'admin@clinic.com';
        
        RAISE NOTICE '✅ تم تحديث كلمة المرور';
        RAISE NOTICE '📧 البريد: admin@clinic.com';
        RAISE NOTICE '🔑 كلمة المرور: Admin@123';
    END IF;
END $$;

-- 3. التحقق النهائي
SELECT 
    '✅ الحساب جاهز!' as status,
    name,
    email,
    role,
    is_active
FROM public.admins 
WHERE email = 'admin@clinic.com';
