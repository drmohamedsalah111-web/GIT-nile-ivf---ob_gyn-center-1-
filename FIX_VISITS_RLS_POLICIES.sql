-- ============================================================================
-- 🔒 FIX VISITS RLS POLICIES - تصليح سياسات الأمان لجدول الزيارات
-- ============================================================================

-- ============================================================================
-- 📦 الخطوة 1: إنشاء الدوال المساعدة
-- ============================================================================

-- دالة للحصول على doctor_id للطبيب
CREATE OR REPLACE FUNCTION get_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
    AND user_role = 'doctor'
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

-- دالة للحصول على doctor_id للسكرتيرة (الطبيب المسؤول عنها)
CREATE OR REPLACE FUNCTION get_secretary_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT secretary_doctor_id INTO v_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
    AND user_role = 'secretary'
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

-- دالة للحصول على user_role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT user_role INTO v_role
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

GRANT EXECUTE ON FUNCTION get_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_secretary_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ============================================================================
-- 🗑️ الخطوة 2: حذف السياسات القديمة
-- ============================================================================

DROP POLICY IF EXISTS "Users can view visits" ON visits;
DROP POLICY IF EXISTS "Users can insert visits" ON visits;
DROP POLICY IF EXISTS "Users can update visits" ON visits;
DROP POLICY IF EXISTS "Users can delete visits" ON visits;
DROP POLICY IF EXISTS "Doctors can view their visits" ON visits;
DROP POLICY IF EXISTS "Secretaries can view their doctor visits" ON visits;
DROP POLICY IF EXISTS "Admins can view all visits" ON visits;
DROP POLICY IF EXISTS "Doctors can insert visits" ON visits;
DROP POLICY IF EXISTS "Secretaries can insert visits" ON visits;
DROP POLICY IF EXISTS "Admins can insert visits" ON visits;
DROP POLICY IF EXISTS "Doctors can update their visits" ON visits;
DROP POLICY IF EXISTS "Secretaries can update visits" ON visits;
DROP POLICY IF EXISTS "Admins can update all visits" ON visits;
DROP POLICY IF EXISTS "Doctors can delete their visits" ON visits;
DROP POLICY IF EXISTS "Secretaries can delete visits" ON visits;
DROP POLICY IF EXISTS "Admins can delete all visits" ON visits;
DROP POLICY IF EXISTS "doctors_read_visits" ON visits;
DROP POLICY IF EXISTS "secretaries_read_visits" ON visits;
DROP POLICY IF EXISTS "admins_read_visits" ON visits;
DROP POLICY IF EXISTS "doctors_insert_visits" ON visits;
DROP POLICY IF EXISTS "secretaries_insert_visits" ON visits;
DROP POLICY IF EXISTS "admins_insert_visits" ON visits;
DROP POLICY IF EXISTS "doctors_update_visits" ON visits;
DROP POLICY IF EXISTS "secretaries_update_visits" ON visits;
DROP POLICY IF EXISTS "admins_update_visits" ON visits;
DROP POLICY IF EXISTS "doctors_delete_visits" ON visits;
DROP POLICY IF EXISTS "secretaries_delete_visits" ON visits;
DROP POLICY IF EXISTS "admins_delete_visits" ON visits;

-- ============================================================================
-- 📋 الخطوة 3: سياسات SELECT - عرض البيانات
-- ============================================================================

-- الأطباء يشوفوا زياراتهم فقط
CREATE POLICY "doctors_read_visits"
ON visits FOR SELECT
TO authenticated
USING (
  doctor_id = get_doctor_id()
);

-- السكرتيرات يشوفوا زيارات الطبيب اللي شغالين معاه
CREATE POLICY "secretaries_read_visits"
ON visits FOR SELECT
TO authenticated
USING (
  doctor_id = get_secretary_doctor_id()
);

-- الأدمن يشوف كل الزيارات
CREATE POLICY "admins_read_visits"
ON visits FOR SELECT
TO authenticated
USING (
  get_user_role() = 'admin'
);

-- ============================================================================
-- ➕ الخطوة 4: سياسات INSERT - إضافة البيانات
-- ============================================================================

-- الأطباء يقدروا يضيفوا زيارات لمرضاهم
CREATE POLICY "doctors_insert_visits"
ON visits FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id = get_doctor_id()
);

-- السكرتيرات يقدروا يضيفوا زيارات للطبيب اللي شغالين معاه
CREATE POLICY "secretaries_insert_visits"
ON visits FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id = get_secretary_doctor_id()
);

-- الأدمن يقدر يضيف زيارات لأي طبيب
CREATE POLICY "admins_insert_visits"
ON visits FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = 'admin'
);

-- ============================================================================
-- ✏️ الخطوة 5: سياسات UPDATE - تعديل البيانات
-- ============================================================================

-- الأطباء يقدروا يعدلوا زياراتهم
CREATE POLICY "doctors_update_visits"
ON visits FOR UPDATE
TO authenticated
USING (doctor_id = get_doctor_id())
WITH CHECK (doctor_id = get_doctor_id());

-- السكرتيرات يقدروا يعدلوا زيارات الطبيب اللي شغالين معاه
CREATE POLICY "secretaries_update_visits"
ON visits FOR UPDATE
TO authenticated
USING (doctor_id = get_secretary_doctor_id())
WITH CHECK (doctor_id = get_secretary_doctor_id());

-- الأدمن يقدر يعدل أي زيارة
CREATE POLICY "admins_update_visits"
ON visits FOR UPDATE
TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- 🗑️ الخطوة 6: سياسات DELETE - حذف البيانات
-- ============================================================================

-- الأطباء يقدروا يحذفوا زياراتهم
CREATE POLICY "doctors_delete_visits"
ON visits FOR DELETE
TO authenticated
USING (
  doctor_id = get_doctor_id()
);

-- السكرتيرات يقدروا يحذفوا زيارات الطبيب اللي شغالين معاه
CREATE POLICY "secretaries_delete_visits"
ON visits FOR DELETE
TO authenticated
USING (
  doctor_id = get_secretary_doctor_id()
);

-- الأدمن يقدر يحذف أي زيارة
CREATE POLICY "admins_delete_visits"
ON visits FOR DELETE
TO authenticated
USING (
  get_user_role() = 'admin'
);

-- ============================================================================
-- ✅ الخطوة 7: VERIFICATION
-- ============================================================================

-- عرض السياسات الجديدة
SELECT 
    '✅ تم تحديث سياسات الأمان لجدول visits بنجاح!' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'visits'
ORDER BY policyname;

-- عرض معلومات المستخدم الحالي للتأكد
SELECT 
    '👤 معلومات المستخدم الحالي' as section,
    auth.uid() as user_id,
    get_user_role() as user_role,
    get_doctor_id() as doctor_id,
    get_secretary_doctor_id() as secretary_doctor_id;

-- عرض بيانات الأطباء
SELECT 
    '👨‍⚕️ بيانات الأطباء' as section,
    id,
    name,
    email,
    user_role,
    secretary_doctor_id
FROM doctors
WHERE user_id = auth.uid();

-- تعليمات
SELECT '💡 تعليمات:' as info
UNION ALL
SELECT '1. تأكد إن user_role مضبوط في جدول doctors'
UNION ALL
SELECT '2. للسكرتيرة: تأكد إن secretary_doctor_id مش NULL'
UNION ALL
SELECT '3. جرب إضافة visit جديدة'
UNION ALL
SELECT '4. لو لسه مش شغال، شيك console.log في الـ frontend';
