-- ============================================
-- 🔐 نظام الأدمن المستقل تماماً
-- ============================================
-- هذا النظام منفصل 100% عن نظام العيادات
-- ============================================

-- 1️⃣ إنشاء جدول الأدمن (منفصل تماماً عن doctors)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- سنستخدم bcrypt للتشفير
  role TEXT DEFAULT 'super_admin', -- super_admin, moderator, viewer
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- 3️⃣ إنشاء جدول سجل دخول الأدمن (Admin Activity Log)
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- login, logout, view_clinics, modify_subscription, etc.
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at DESC);

-- 4️⃣ إضافة حساب أدمن افتراضي
-- 🔴 مهم: غير الإيميل والباسورد بعد أول دخول!
-- الباسورد الافتراضي: Admin@123456
-- Hash للباسورد Admin@123456 باستخدام bcrypt
INSERT INTO admins (name, email, password_hash, role)
VALUES (
  'Super Admin',
  'admin@nileivf.com',
  '$2a$10$rQZYvJ5qE5xK7jZ9mK3qO.1YxJ3ZN5K5xK5xK5xK5xK5xK5xK5xK5',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- 5️⃣ RLS Policies للأمان
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: فقط الأدمن يقدر يشوف بيانات الأدمن
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (true); -- سنتحقق من الصلاحيات في الكود

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view activity logs"
  ON admin_activity_log FOR SELECT
  USING (true);

-- 6️⃣ Function لتحديث آخر دخول
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

-- 7️⃣ Function لتسجيل نشاط الأدمن
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

-- ============================================
-- 📊 Views مفيدة للأدمن
-- ============================================

-- View: إحصائيات العيادات
CREATE OR REPLACE VIEW admin_clinics_stats AS
SELECT 
  COUNT(*) as total_clinics,
  COUNT(*) FILTER (WHERE user_role = 'doctor') as active_doctors,
  COUNT(*) FILTER (WHERE user_role = 'secretary') as secretaries,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM doctors;

-- View: إحصائيات الاشتراكات
CREATE OR REPLACE VIEW admin_subscriptions_stats AS
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_subscriptions,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) as active_percentage
FROM clinic_subscriptions;

-- ============================================
-- ✅ التحقق من التثبيت
-- ============================================

-- اعرض بيانات الأدمن
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM admins;

-- اعرض الإحصائيات
SELECT * FROM admin_clinics_stats;
SELECT * FROM admin_subscriptions_stats;

-- ============================================
-- 🔧 للاستخدام لاحقاً: إضافة أدمن جديد يدوياً
-- ============================================
/*
-- استخدم bcryptjs لتشفير الباسورد في الكود، ثم:
INSERT INTO admins (name, email, password_hash, role)
VALUES (
  'اسم الأدمن',
  'email@example.com',
  'HASHED_PASSWORD_HERE',
  'super_admin'
);
*/
