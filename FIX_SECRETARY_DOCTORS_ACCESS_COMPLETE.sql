-- ============================================================================
-- 🔧 حل مشكلة "No doctors available" للسكرتيرة
-- ============================================================================
-- المشكلة: السكرتيرة لا تستطيع رؤية قائمة الأطباء لإضافة مريض جديد
-- السبب: policies الـ RLS تمنع السكرتيرة من قراءة جدول doctors
-- الحل: تحديث الـ RLS policies + ربط السكرتيرة بطبيب + دالة مساعدة
-- ============================================================================

-- ========================================
-- الخطوة 1: عرض البيانات الحالية (التشخيص)
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 تشخيص المشكلة الحالية';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

-- عرض قائمة الأطباء
SELECT 
  '👨‍⚕️ قائمة الأطباء الحالية' as section,
  id,
  name,
  email,
  user_role,
  created_at
FROM doctors
WHERE user_role = 'doctor'
ORDER BY name;

-- عرض قائمة السكرتيرات وحالة الربط
SELECT 
  '👩‍💼 قائمة السكرتيرات وحالة الربط' as section,
  d.id,
  d.name,
  d.email,
  d.user_role,
  d.secretary_doctor_id,
  doc.name as linked_doctor_name,
  CASE 
    WHEN d.secretary_doctor_id IS NOT NULL THEN '✅ مربوطة بطبيب'
    ELSE '❌ غير مربوطة - يحتاج ربط'
  END as link_status
FROM doctors d
LEFT JOIN doctors doc ON d.secretary_doctor_id = doc.id
WHERE d.user_role = 'secretary'
ORDER BY d.name;

-- ========================================
-- الخطوة 2: إنشاء/تحديث دالة get_user_role
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '⚙️ إنشاء دالة get_user_role';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

-- حذف الدالة القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS get_user_role() CASCADE;

-- إنشاء الدالة من جديد
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  SELECT user_role INTO user_role_val
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role_val, 'doctor');
END;
$$;

-- منح صلاحيات التنفيذ للمستخدمين المصادقين
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ========================================
-- الخطوة 3: إنشاء/تحديث دالة get_secretary_doctor_id
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '⚙️ إنشاء دالة get_secretary_doctor_id';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

DROP FUNCTION IF EXISTS get_secretary_doctor_id() CASCADE;

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

GRANT EXECUTE ON FUNCTION get_secretary_doctor_id() TO authenticated;

-- ========================================
-- الخطوة 4: إنشاء/تحديث دالة get_doctor_id
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '⚙️ إنشاء دالة get_doctor_id';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

DROP FUNCTION IF EXISTS get_doctor_id() CASCADE;

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

GRANT EXECUTE ON FUNCTION get_doctor_id() TO authenticated;

-- ========================================
-- الخطوة 5: تحديث RLS Policies لجدول doctors
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔒 تحديث policies جدول الأطباء';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

-- حذف policies القديمة
DROP POLICY IF EXISTS "secretaries_read_own_profile" ON doctors;
DROP POLICY IF EXISTS "secretaries_read_assigned_doctor" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_all_doctors" ON doctors;
DROP POLICY IF EXISTS "doctors_read_own_profile" ON doctors;
DROP POLICY IF EXISTS "doctors_read_all" ON doctors;

-- 1. السكرتيرة تقرأ سجلها الخاص
CREATE POLICY "secretaries_read_own_profile" ON doctors
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND user_role = 'secretary'
  );

-- 2. السكرتيرة تقرأ جميع الأطباء (هذا هو المفتاح!)
-- لازم تشوف جميع الأطباء عشان تختار واحد عند إضافة مريض
CREATE POLICY "secretaries_view_all_doctors" ON doctors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
    AND user_role = 'doctor'
  );

-- 3. الطبيب يقرأ سجله الخاص
CREATE POLICY "doctors_read_own_profile" ON doctors
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND user_role = 'doctor'
  );

-- ========================================
-- الخطوة 6: تحديث RLS Policies لجدول المرضى
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔒 تحديث policies جدول المرضى';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

DROP POLICY IF EXISTS "secretaries_read_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_update_patients" ON patients;

-- السكرتيرة تشوف مرضى الطبيب المسؤول عنها
CREATE POLICY "secretaries_read_patients" ON patients
  FOR SELECT
  USING (
    doctor_id = get_secretary_doctor_id()
  );

-- السكرتيرة تضيف مرضى للطبيب المسؤول عنها فقط
CREATE POLICY "secretaries_insert_patients" ON patients
  FOR INSERT
  WITH CHECK (
    doctor_id = get_secretary_doctor_id()
  );

-- السكرتيرة تعدل مرضى الطبيب المسؤول عنها
CREATE POLICY "secretaries_update_patients" ON patients
  FOR UPDATE
  USING (doctor_id = get_secretary_doctor_id())
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 7: تحديث RLS Policies لجدول المواعيد
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔒 تحديث policies جدول المواعيد';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

DROP POLICY IF EXISTS "secretaries_view_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_appointments" ON appointments;

-- السكرتيرة تشوف مواعيد الطبيب
CREATE POLICY "secretaries_view_appointments" ON appointments
  FOR SELECT
  USING (doctor_id = get_secretary_doctor_id());

-- السكرتيرة تضيف مواعيد
CREATE POLICY "secretaries_insert_appointments" ON appointments
  FOR INSERT
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- السكرتيرة تعدل مواعيد
CREATE POLICY "secretaries_update_appointments" ON appointments
  FOR UPDATE
  USING (doctor_id = get_secretary_doctor_id())
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- السكرتيرة تحذف مواعيد
CREATE POLICY "secretaries_delete_appointments" ON appointments
  FOR DELETE
  USING (doctor_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 8: تحديث RLS Policies لجدول الفواتير
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔒 تحديث policies جدول الفواتير';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

DROP POLICY IF EXISTS "secretaries_view_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_invoices" ON invoices;

-- السكرتيرة تشوف فواتير الطبيب
CREATE POLICY "secretaries_view_invoices" ON invoices
  FOR SELECT
  USING (clinic_id = get_secretary_doctor_id());

-- السكرتيرة تضيف فواتير
CREATE POLICY "secretaries_insert_invoices" ON invoices
  FOR INSERT
  WITH CHECK (clinic_id = get_secretary_doctor_id());

-- السكرتيرة تعدل فواتير
CREATE POLICY "secretaries_update_invoices" ON invoices
  FOR UPDATE
  USING (clinic_id = get_secretary_doctor_id())
  WITH CHECK (clinic_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 9: ربط السكرتيرة بالطبيب (يدوي)
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔗 ربط السكرتيرة بالطبيب';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ يجب تنفيذ الربط يدوياً!';
  RAISE NOTICE '';
  RAISE NOTICE 'انظر إلى نتائج الاستعلامات أعلاه:';
  RAISE NOTICE '1. احصل على doctor_id من قائمة الأطباء';
  RAISE NOTICE '2. احصل على secretary_email من قائمة السكرتيرات';
  RAISE NOTICE '3. نفذ الأمر التالي (بعد استبدال القيم):';
  RAISE NOTICE '';
  RAISE NOTICE 'UPDATE doctors';
  RAISE NOTICE 'SET secretary_doctor_id = ''<doctor_id>''';
  RAISE NOTICE 'WHERE user_role = ''secretary''';
  RAISE NOTICE '  AND email = ''<secretary_email>'';';
  RAISE NOTICE '';
END $$;

/*
-- ⚠️ مثال للربط (قم بإلغاء التعليق وتعديل القيم):
-- استبدل <doctor_id> بـ ID الطبيب
-- استبدل <secretary_email> بإيميل السكرتيرة

UPDATE doctors 
SET secretary_doctor_id = '<doctor_id>'
WHERE user_role = 'secretary' 
  AND email = '<secretary_email>';

-- أو لربط جميع السكرتيرات بنفس الطبيب:
UPDATE doctors 
SET secretary_doctor_id = '<doctor_id>'
WHERE user_role = 'secretary' 
  AND secretary_doctor_id IS NULL;
*/

-- ========================================
-- الخطوة 10: التحقق النهائي
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ التحقق النهائي';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

-- عرض حالة الربط بعد التحديث
SELECT 
  '✅ حالة الربط النهائية' as section,
  d.id as secretary_id,
  d.name as secretary_name,
  d.email as secretary_email,
  d.secretary_doctor_id,
  doc.name as doctor_name,
  doc.email as doctor_email,
  CASE 
    WHEN d.secretary_doctor_id IS NOT NULL THEN '✅ الربط تم بنجاح!'
    ELSE '❌ السكرتيرة ما زالت غير مربوطة - نفذ الخطوة 9'
  END as status
FROM doctors d
LEFT JOIN doctors doc ON d.secretary_doctor_id = doc.id
WHERE d.user_role = 'secretary'
ORDER BY d.name;

-- عرض policies الحالية
SELECT 
  '🔒 Policies الحالية لجدول doctors' as section,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'doctors' 
  AND policyname LIKE '%secretar%'
ORDER BY policyname;

-- ========================================
-- ملخص التنفيذ
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📋 ملخص التنفيذ';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ تم إنشاء الدوال المساعدة (get_user_role, get_secretary_doctor_id, get_doctor_id)';
  RAISE NOTICE '✅ تم تحديث policies جدول الأطباء - السكرتيرة تقدر تشوف كل الأطباء';
  RAISE NOTICE '✅ تم تحديث policies جدول المرضى';
  RAISE NOTICE '✅ تم تحديث policies جدول المواعيد';
  RAISE NOTICE '✅ تم تحديث policies جدول الفواتير';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ الخطوة المتبقية:';
  RAISE NOTICE '   1. راجع نتائج الاستعلامات أعلاه';
  RAISE NOTICE '   2. نفذ أمر UPDATE لربط السكرتيرة بالطبيب (الخطوة 9)';
  RAISE NOTICE '   3. تحقق من النتيجة النهائية';
  RAISE NOTICE '   4. حدّث الصفحة (F5) في التطبيق';
  RAISE NOTICE '   5. جرب إضافة مريض جديد - يجب أن تظهر قائمة الأطباء!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 بعد الربط، السكرتيرة ستقدر:';
  RAISE NOTICE '   ✓ تشوف قائمة الأطباء عند إضافة مريض';
  RAISE NOTICE '   ✓ تضيف مرضى للطبيب المسؤول عنها';
  RAISE NOTICE '   ✓ تدير المواعيد والفواتير';
  RAISE NOTICE '   ✓ تستخدم جميع ميزات النظام';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;
