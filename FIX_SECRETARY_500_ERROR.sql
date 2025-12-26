-- ============================================================================
-- 🚨 إصلاح خطأ 500 للسكرتيرة - FIX 500 ERROR
-- ============================================================================
-- المشكلة: السكرتيرة تحصل على خطأ 500 عند محاولة الوصول للبيانات
-- السبب: الـ policies الجديدة منعت السكرتيرة من قراءة سجلها الخاص
-- الحل: إضافة policy للسكرتيرة عشان تقدر تقرأ بياناتها
-- ============================================================================

-- ========================================
-- الخطوة 1: تحديث دالة get_user_role بدون recursion
-- ========================================

-- حذف الدالة القديمة مع كل الـ dependencies
DROP FUNCTION IF EXISTS get_user_role() CASCADE;

-- دالة محسّنة بدون recursion (بدون استخدام policies)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT user_role 
  FROM doctors 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ========================================
-- الخطوة 2: إعادة إنشاء policies لجدول doctors
-- ========================================

-- حذف كل الـ policies القديمة
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_only" ON doctors;
DROP POLICY IF EXISTS "doctors_view_own_record_only" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_own_record" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor" ON doctors;
DROP POLICY IF EXISTS "doctors_view_own_record" ON doctors;
DROP POLICY IF EXISTS "Users can read own profile" ON doctors;
DROP POLICY IF EXISTS "doctors_read_own" ON doctors;

-- 1. السكرتيرة تقدر تقرأ سجلها الخاص (الأهم والأول!)
-- هذا الـ policy يجب أن يكون بسيط جداً بدون subqueries معقدة
CREATE POLICY "secretaries_read_own_profile" ON doctors
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND user_role = 'secretary'
  );

-- 2. السكرتيرة تقدر تشوف الطبيب المسؤول عنها
CREATE POLICY "secretaries_read_assigned_doctor" ON doctors
  FOR SELECT
  USING (
    user_role = 'doctor'
    AND id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- 3. الطبيب يقدر يشوف سجله الخاص
CREATE POLICY "doctors_read_own_profile" ON doctors
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND user_role = 'doctor'
  );

-- ========================================
-- الخطوة 3: إعادة إنشاء policies المرضى
-- ========================================

DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor" ON patients;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_patients" ON patients;

-- السكرتيرة تشوف فقط مرضى الطبيب المسؤول عنها
CREATE POLICY "secretaries_read_patients" ON patients
  FOR SELECT
  USING (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تضيف مرضى
CREATE POLICY "secretaries_insert_patients" ON patients
  FOR INSERT
  WITH CHECK (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تعدل مرضى
CREATE POLICY "secretaries_update_patients" ON patients
  FOR UPDATE
  USING (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- ========================================
-- الخطوة 4: إعادة إنشاء policies المواعيد
-- ========================================

DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_assigned_doctor_appointments" ON appointments;

-- السكرتيرة تشوف مواعيد الطبيب المسؤول عنها
CREATE POLICY "secretaries_read_appointments" ON appointments
  FOR SELECT
  USING (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تضيف مواعيد
CREATE POLICY "secretaries_insert_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تعدل مواعيد
CREATE POLICY "secretaries_update_appointments" ON appointments
  FOR UPDATE
  USING (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تحذف مواعيد
CREATE POLICY "secretaries_delete_appointments" ON appointments
  FOR DELETE
  USING (
    doctor_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- ========================================
-- الخطوة 5: إعادة إنشاء policies الفواتير
-- ========================================

DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_invoices" ON invoices;

-- السكرتيرة تشوف فواتير الطبيب المسؤول عنها
CREATE POLICY "secretaries_read_invoices" ON invoices
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تضيف فواتير
CREATE POLICY "secretaries_insert_invoices" ON invoices
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تعدل فواتير
CREATE POLICY "secretaries_update_invoices" ON invoices
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT secretary_doctor_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
    )
  );

-- ========================================
-- الخطوة 6: إعادة إنشاء policies invoice_items
-- ========================================

DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_invoice_items" ON invoice_items;

-- السكرتيرة تشوف عناصر فواتير الطبيب المسؤول عنها
CREATE POLICY "secretaries_read_invoice_items" ON invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN doctors d ON d.secretary_doctor_id = i.clinic_id
      WHERE d.user_id = auth.uid() 
        AND d.user_role = 'secretary'
    )
  );

-- السكرتيرة تقدر تضيف عناصر فواتير
CREATE POLICY "secretaries_insert_invoice_items" ON invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN doctors d ON d.secretary_doctor_id = i.clinic_id
      WHERE d.user_id = auth.uid() 
        AND d.user_role = 'secretary'
    )
  );

-- ========================================
-- الخطوة 7: التحقق من الإعدادات
-- ========================================

-- عرض الـ policies الحالية
SELECT 
  '📋 Policies الحالية' as title,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE '%secretaries%'
ORDER BY tablename, policyname;

-- عرض بيانات السكرتيرة
SELECT 
  '👩‍💼 بيانات السكرتيرة' as title,
  id,
  name,
  email,
  user_role,
  secretary_doctor_id,
  CASE 
    WHEN secretary_doctor_id IS NOT NULL THEN '✅ مربوطة بطبيب'
    ELSE '❌ غير مربوطة بطبيب - يجب ربطها!'
  END as status
FROM doctors
WHERE user_role = 'secretary';

-- ========================================
-- رسالة نجاح
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ تم إصلاح خطأ 500 للسكرتيرة!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ السكرتيرة الآن تقدر تقرأ سجلها الخاص';
  RAISE NOTICE '✅ السكرتيرة تقدر تشوف الطبيب المسؤول عنها';
  RAISE NOTICE '✅ السكرتيرة تقدر تدير المرضى والمواعيد والفواتير';
  RAISE NOTICE '✅ الصلاحيات محدودة بالطبيب المسؤول عنها فقط';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ تأكد من ربط السكرتيرة بطبيب معين:';
  RAISE NOTICE '   UPDATE doctors SET secretary_doctor_id = ''<doctor_id>''';
  RAISE NOTICE '   WHERE user_role = ''secretary'' AND email = ''secretary@example.com'';';
  RAISE NOTICE '';
  RAISE NOTICE 'الآن جرب تسجيل الدخول بحساب السكرتيرة مرة أخرى!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;
