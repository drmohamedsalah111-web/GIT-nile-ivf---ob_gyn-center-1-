-- ============================================================================
-- 🔒 FIX VISITS RLS POLICIES - تصليح سياسات الأمان لجدول الزيارات
-- ============================================================================

-- ============================================================================
-- 📦 الخطوة 1: إنشاء الدوال المساعدة
-- ============================================================================

-- دالة للحصول على doctor_id للمستخدم الحالي (بدون شرط user_role)
CREATE OR REPLACE FUNCTION get_my_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
  v_user_role TEXT;
  v_secretary_doctor_id UUID;
BEGIN
  -- جلب بيانات المستخدم
  SELECT id, user_role, secretary_doctor_id 
  INTO v_doctor_id, v_user_role, v_secretary_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- لو سكرتيرة، يرجع الطبيب المسؤول عنها
  IF v_user_role = 'secretary' AND v_secretary_doctor_id IS NOT NULL THEN
    RETURN v_secretary_doctor_id;
  END IF;
  
  -- غير كده، يرجع id الشخصي (طبيب أو أي role تاني)
  RETURN v_doctor_id;
END;
$$;

-- دالة للتحقق هل المستخدم أدمن
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
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
  
  RETURN v_role = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

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
DROP POLICY IF EXISTS "users_read_visits" ON visits;
DROP POLICY IF EXISTS "users_insert_visits" ON visits;
DROP POLICY IF EXISTS "users_update_visits" ON visits;
DROP POLICY IF EXISTS "users_delete_visits" ON visits;

-- ============================================================================
-- 📋 الخطوة 3: سياسات SELECT - عرض البيانات
-- ============================================================================

-- سياسة موحدة للقراءة - الطبيب والسكرتيرة
CREATE POLICY "users_read_visits"
ON visits FOR SELECT
TO authenticated
USING (
  doctor_id = get_my_doctor_id() OR is_admin()
);

-- ============================================================================
-- ➕ الخطوة 4: سياسات INSERT - إضافة البيانات
-- ============================================================================

-- سياسة موحدة للإضافة
CREATE POLICY "users_insert_visits"
ON visits FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id = get_my_doctor_id() OR is_admin()
);

-- ============================================================================
-- ✏️ الخطوة 5: سياسات UPDATE - تعديل البيانات
-- ============================================================================

-- سياسة موحدة للتعديل
CREATE POLICY "users_update_visits"
ON visits FOR UPDATE
TO authenticated
USING (doctor_id = get_my_doctor_id() OR is_admin())
WITH CHECK (doctor_id = get_my_doctor_id() OR is_admin());

-- ============================================================================
-- 🗑️ الخطوة 6: سياسات DELETE - حذف البيانات
-- ============================================================================

-- سياسة موحدة للحذف
CREATE POLICY "users_delete_visits"
ON visits FOR DELETE
TO authenticated
USING (
  doctor_id = get_my_doctor_id() OR is_admin()
);

-- ============================================================================
-- ✅ الخطوة 7: VERIFICATION
-- ============================================================================

-- عرض السياسات الجديدة
SELECT 
    '✅ تم تحديث سياسات الأمان لجدول visits بنجاح!' as status,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'visits'
ORDER BY policyname;

-- عرض معلومات المستخدم الحالي للتأكد
SELECT 
    '👤 معلومات المستخدم الحالي' as section,
    auth.uid() as user_id,
    get_my_doctor_id() as my_doctor_id,
    is_admin() as is_admin;

-- عرض بيانات الطبيب/السكرتيرة
SELECT 
    '👨‍⚕️ بيانات المستخدم' as section,
    id,
    name,
    email,
    user_role,
    secretary_doctor_id
FROM doctors
WHERE user_id = auth.uid();

-- تعليمات التشخيص
SELECT '💡 تعليمات:' as info
UNION ALL
SELECT '1. لو my_doctor_id = NULL، معناه المستخدم مالوش سجل في جدول doctors'
UNION ALL
SELECT '2. للسكرتيرة: تأكد إن secretary_doctor_id مش NULL'
UNION ALL
SELECT '3. جرب إضافة visit جديدة';
