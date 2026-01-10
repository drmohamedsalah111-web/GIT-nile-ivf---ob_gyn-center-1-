-- 🔐 إنشاء/تحديث حساب السوبر أدمن
-- نسخ هذا الكود في Supabase SQL Editor وتشغيله

-- حذف أي حساب موجود بنفس البريد (اختياري)
DELETE FROM public.admins WHERE email = 'admin@clinic.com';

-- إنشاء حساب السوبر أدمن
-- البريد: admin@clinic.com
-- كلمة المرور: Admin@123
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
    '$2a$10$YQ4FvZ0Z6RGWe5N8V/8FPuF.jMvnxZ3sHB2.lCVUHvJYFxGVrNP3O', -- Admin@123
    'super_admin',
    true,
    NOW()
);

-- التحقق من إنشاء الحساب
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at
FROM public.admins 
WHERE email = 'admin@clinic.com';

-- رسالة النجاح
DO $$ 
BEGIN 
    RAISE NOTICE '✅ تم إنشاء حساب السوبر أدمن بنجاح!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📧 البريد الإلكتروني: admin@clinic.com';
    RAISE NOTICE '🔑 كلمة المرور: Admin@123';
    RAISE NOTICE '🎭 الصلاحية: super_admin';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '⚠️  غيّر كلمة المرور بعد أول دخول!';
END $$;
