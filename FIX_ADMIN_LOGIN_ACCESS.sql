-- ==========================================
-- ✅ إصلاح دخول السوبر أدمن
-- ==========================================

-- 1. إنشاء جدول الأدمن إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء جدول سجل نشاط الأدمن
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON public.admin_activity_logs(created_at DESC);

-- 4. دالة لتحديث آخر دخول
CREATE OR REPLACE FUNCTION public.update_admin_last_login(admin_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.admins
    SET last_login = NOW(),
        updated_at = NOW()
    WHERE id = admin_id_param;
END;
$$;

-- 5. إنشاء حساب سوبر أدمن تجريبي
-- كلمة المرور: Admin@123
-- ⚠️ غيّر كلمة المرور بعد أول دخول!

DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- التحقق من وجود أدمن
    SELECT COUNT(*) INTO admin_count FROM public.admins WHERE role = 'super_admin';
    
    IF admin_count = 0 THEN
        -- إضافة سوبر أدمن افتراضي
        INSERT INTO public.admins (name, email, password_hash, role, is_active)
        VALUES (
            'المدير العام',
            'admin@clinic.com',
            '$2a$10$YourHashedPasswordHere', -- يجب استبداله بـ hash حقيقي
            'super_admin',
            true
        );
        
        RAISE NOTICE '✅ تم إنشاء حساب السوبر أدمن الافتراضي';
        RAISE NOTICE '📧 البريد: admin@clinic.com';
        RAISE NOTICE '🔑 كلمة المرور: Admin@123';
        RAISE NOTICE '⚠️ يرجى تغيير كلمة المرور بعد أول دخول!';
    ELSE
        RAISE NOTICE 'ℹ️ يوجد بالفعل حساب سوبر أدمن';
    END IF;
END;
$$;

-- 6. منح الصلاحيات
GRANT SELECT, INSERT, UPDATE ON public.admins TO authenticated;
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_last_login TO authenticated;

-- ==========================================
-- ✅ اكتمل الإعداد!
-- ==========================================

-- للحصول على كلمة مرور مشفرة، استخدم هذا الكود في Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('Admin@123', 10);
-- console.log(hash);

-- ثم استبدل الـ hash في الـ INSERT أعلاه

-- ==========================================
-- 📝 ملاحظات مهمة:
-- ==========================================
-- 1. تأكد من تثبيت uuid-ossp extension:
--    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- 2. جدول admins منفصل تماماً عن جداول الدكاترة والسكرتيرات
--
-- 3. نظام المصادقة يستخدم bcrypt لتشفير كلمات المرور
--
-- 4. الـ RequireRole component الآن يدعم التحقق من الأدمن
--
-- 5. صفحة /admin-login منفصلة عن /login العادية
