-- ============================================
-- 🔐 خطوات تثبيت نظام الأدمن المنفصل
-- ============================================
-- نسّخ كل الكود ده والصقه في Supabase SQL Editor
-- ============================================

-- 1️⃣ إنشاء جدول الأدمن
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'super_admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ إضافة indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- 3️⃣ جدول سجل نشاط الأدمن
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at DESC);

-- 4️⃣ RLS Policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- حذف Policies القديمة إن وجدت
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Admins can view activity logs" ON admin_activity_log;

-- إنشاء Policies جديدة
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view activity logs"
  ON admin_activity_log FOR SELECT
  USING (true);

-- 5️⃣ Functions
CREATE OR REPLACE FUNCTION update_admin_last_login(admin_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admins
  SET last_login = NOW(),
      updated_at = NOW()
  WHERE id = admin_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION log_admin_activity(
  admin_id_param UUID,
  action_param TEXT,
  details_param JSONB DEFAULT '{}'::JSONB,
  ip_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action, details, ip_address, user_agent)
  VALUES (admin_id_param, action_param, details_param, ip_param, user_agent_param)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 6️⃣ إضافة حساب أدمن افتراضي
-- 🔴 الإيميل: admin@nileivf.com
-- 🔴 الباسورد: Admin@123456
-- 🔴 غيّر الإيميل والباسورد بعد أول دخول!

INSERT INTO admins (name, email, password_hash, role)
VALUES (
  'Super Admin',
  'admin@nileivf.com',
  '$2b$10$gj3TrhIxu5LlcDgvlGJKvOHMcrh0CFMRs1aA4hm4eutiY1xL5/CrS',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- ✅ تم! الآن جرب تدخل:
-- ============================================
-- 1. افتح الموقع
-- 2. اضغط زر "دخول الأدمن" (أعلى اليسار)
-- 3. أدخل:
--    الإيميل: admin@nileivf.com
--    الباسورد: Admin@123456
-- 4. استمتع بلوحة تحكم الأدمن! 🎉
-- ============================================

-- 📊 للتحقق من التثبيت:
SELECT id, name, email, role, is_active, created_at 
FROM admins;
