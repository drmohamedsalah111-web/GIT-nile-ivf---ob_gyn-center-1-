-- ============================================================================
-- 🔧 إصلاح Infinite Recursion - حل نهائي
-- ============================================================================
-- المشكلة: Policies تستخدم subqueries على نفس الجدول = infinite recursion
-- الحل: استخدام policies بسيطة جداً + SECURITY DEFINER functions
-- ============================================================================

-- ========================================
-- الخطوة 1: حذف جميع الـ policies القديمة
-- ========================================

-- حذف policies جدول doctors
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_only" ON doctors;
DROP POLICY IF EXISTS "doctors_view_own_record_only" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_own_record" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor" ON doctors;
DROP POLICY IF EXISTS "doctors_view_own_record" ON doctors;
DROP POLICY IF EXISTS "Users can read own profile" ON doctors;
DROP POLICY IF EXISTS "doctors_read_own" ON doctors;
DROP POLICY IF EXISTS "secretaries_read_own_profile" ON doctors;
DROP POLICY IF EXISTS "secretaries_read_assigned_doctor" ON doctors;
DROP POLICY IF EXISTS "doctors_read_own_profile" ON doctors;

-- حذف policies المرضى
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor" ON patients;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_read_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_update_patients" ON patients;

-- حذف policies المواعيد
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_read_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_appointments" ON appointments;

-- حذف policies الفواتير
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_read_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_invoices" ON invoices;

-- حذف policies invoice_items
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "secretaries_read_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "secretaries_insert_invoice_items" ON invoice_items;

-- ========================================
-- الخطوة 2: إنشاء دالة آمنة للحصول على doctor_id
-- ========================================

DROP FUNCTION IF EXISTS get_doctor_id() CASCADE;
DROP FUNCTION IF EXISTS get_secretary_doctor_id() CASCADE;

-- دالة تعيد doctors.id للمستخدم الحالي (بدون recursion)
CREATE OR REPLACE FUNCTION get_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- إيقاف RLS مؤقتاً داخل هذه الدالة فقط
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

-- دالة تعيد doctor_id للسكرتيرة بدون recursion
CREATE OR REPLACE FUNCTION get_secretary_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- إيقاف RLS مؤقتاً داخل هذه الدالة فقط
  SELECT secretary_doctor_id INTO v_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_secretary_doctor_id() TO authenticated;

-- ========================================
-- الخطوة 3: إنشاء policies بسيطة لجدول doctors
-- ========================================

-- حذف أي policies موجودة مسبقاً
DROP POLICY IF EXISTS "users_read_own_profile" ON doctors;
DROP POLICY IF EXISTS "users_update_own_profile" ON doctors;
DROP POLICY IF EXISTS "users_insert_own_profile" ON doctors;

-- كل مستخدم يقرأ سجله الخاص فقط (بدون subqueries!)
CREATE POLICY "users_read_own_profile" ON doctors
  FOR SELECT
  USING (auth.uid() = user_id);

-- كل مستخدم يعدل سجله الخاص
CREATE POLICY "users_update_own_profile" ON doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- السماح بإنشاء سجل جديد
CREATE POLICY "users_insert_own_profile" ON doctors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- الخطوة 4: policies المرضى (باستخدام الدالة الآمنة)
-- ========================================

-- حذف أي policies موجودة مسبقاً
DROP POLICY IF EXISTS "doctors_view_own_patients" ON patients;
DROP POLICY IF EXISTS "doctors_insert_patients" ON patients;
DROP POLICY IF EXISTS "doctors_update_patients" ON patients;

-- الطبيب يشوف مرضاه فقط
CREATE POLICY "doctors_view_own_patients" ON patients
  FOR SELECT
  USING (
    doctor_id = get_doctor_id()
  );

-- السكرتيرة تشوف مرضى الطبيب المسؤول عنها
CREATE POLICY "secretaries_view_patients" ON patients
  FOR SELECT
  USING (
    doctor_id = get_secretary_doctor_id()
  );

-- الطبيب يضيف مرضى
CREATE POLICY "doctors_insert_patients" ON patients
  FOR INSERT
  WITH CHECK (doctor_id = get_doctor_id());

-- السكرتيرة تضيف مرضى
CREATE POLICY "secretaries_insert_patients" ON patients
  FOR INSERT
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- الطبيب يعدل مرضاه
CREATE POLICY "doctors_update_patients" ON patients
  FOR UPDATE
  USING (doctor_id = get_doctor_id())
  WITH CHECK (doctor_id = get_doctor_id());

-- السكرتيرة تعدل المرضى
CREATE POLICY "secretaries_update_patients" ON patients
  FOR UPDATE
  USING (doctor_id = get_secretary_doctor_id())
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 5: policies المواعيد
-- ========================================

-- حذف أي policies موجودة مسبقاً
DROP POLICY IF EXISTS "doctors_view_appointments" ON appointments;
DROP POLICY IF EXISTS "doctors_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "doctors_update_appointments" ON appointments;
DROP POLICY IF EXISTS "doctors_delete_appointments" ON appointments;

-- الطبيب يشوف مواعيده
CREATE POLICY "doctors_view_appointments" ON appointments
  FOR SELECT
  USING (doctor_id = get_doctor_id());

-- السكرتيرة تشوف المواعيد
CREATE POLICY "secretaries_view_appointments" ON appointments
  FOR SELECT
  USING (doctor_id = get_secretary_doctor_id());

-- الطبيب يضيف مواعيد
CREATE POLICY "doctors_insert_appointments" ON appointments
  FOR INSERT
  WITH CHECK (doctor_id = get_doctor_id());

-- السكرتيرة تضيف مواعيد
CREATE POLICY "secretaries_insert_appointments" ON appointments
  FOR INSERT
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- الطبيب يعدل مواعيد
CREATE POLICY "doctors_update_appointments" ON appointments
  FOR UPDATE
  USING (doctor_id = get_doctor_id())
  WITH CHECK (doctor_id = get_doctor_id());

-- السكرتيرة تعدل مواعيد
CREATE POLICY "secretaries_update_appointments" ON appointments
  FOR UPDATE
  USING (doctor_id = get_secretary_doctor_id())
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- الطبيب يحذف مواعيد
CREATE POLICY "doctors_delete_appointments" ON appointments
  FOR DELETE
  USING (doctor_id = get_doctor_id());

-- السكرتيرة تحذف مواعيد
CREATE POLICY "secretaries_delete_appointments" ON appointments
  FOR DELETE
  USING (doctor_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 6: policies الفواتير
-- ========================================

-- حذف أي policies موجودة مسبقاً
DROP POLICY IF EXISTS "doctors_view_invoices" ON invoices;
DROP POLICY IF EXISTS "doctors_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "doctors_update_invoices" ON invoices;

-- الطبيب يشوف فواتيره
CREATE POLICY "doctors_view_invoices" ON invoices
  FOR SELECT
  USING (clinic_id = get_doctor_id());

-- السكرتيرة تشوف الفواتير
CREATE POLICY "secretaries_view_invoices" ON invoices
  FOR SELECT
  USING (clinic_id = get_secretary_doctor_id());

-- الطبيب يضيف فواتير
CREATE POLICY "doctors_insert_invoices" ON invoices
  FOR INSERT
  WITH CHECK (clinic_id = get_doctor_id());

-- السكرتيرة تضيف فواتير
CREATE POLICY "secretaries_insert_invoices" ON invoices
  FOR INSERT
  WITH CHECK (clinic_id = get_secretary_doctor_id());

-- الطبيب يعدل فواتير
CREATE POLICY "doctors_update_invoices" ON invoices
  FOR UPDATE
  USING (clinic_id = get_doctor_id())
  WITH CHECK (clinic_id = get_doctor_id());

-- السكرتيرة تعدل فواتير
CREATE POLICY "secretaries_update_invoices" ON invoices
  FOR UPDATE
  USING (clinic_id = get_secretary_doctor_id())
  WITH CHECK (clinic_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 7: policies invoice_items
-- ========================================

-- حذف أي policies موجودة مسبقاً
DROP POLICY IF EXISTS "doctors_view_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "doctors_insert_invoice_items" ON invoice_items;

-- الطبيب يشوف عناصر فواتيره
CREATE POLICY "doctors_view_invoice_items" ON invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.clinic_id = get_doctor_id()
    )
  );

-- السكرتيرة تشوف عناصر الفواتير
CREATE POLICY "secretaries_view_invoice_items" ON invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.clinic_id = get_secretary_doctor_id()
    )
  );

-- الطبيب يضيف عناصر فواتير
CREATE POLICY "doctors_insert_invoice_items" ON invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.clinic_id = get_doctor_id()
    )
  );

-- السكرتيرة تضيف عناصر فواتير
CREATE POLICY "secretaries_insert_invoice_items" ON invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.clinic_id = get_secretary_doctor_id()
    )
  );

-- ========================================
-- الخطوة 8: policies للجداول المتعلقة بالنظام المالي
-- ========================================

-- حذف أي policies موجودة مسبقاً
DROP POLICY IF EXISTS "doctors_view_financial_cases" ON financial_cases;
DROP POLICY IF EXISTS "secretaries_view_financial_cases" ON financial_cases;
DROP POLICY IF EXISTS "doctors_insert_financial_cases" ON financial_cases;
DROP POLICY IF EXISTS "secretaries_insert_financial_cases" ON financial_cases;
DROP POLICY IF EXISTS "doctors_update_financial_cases" ON financial_cases;
DROP POLICY IF EXISTS "secretaries_update_financial_cases" ON financial_cases;

DROP POLICY IF EXISTS "doctors_view_packages" ON packages;
DROP POLICY IF EXISTS "secretaries_view_packages" ON packages;
DROP POLICY IF EXISTS "doctors_insert_packages" ON packages;
DROP POLICY IF EXISTS "doctors_update_packages" ON packages;

DROP POLICY IF EXISTS "doctors_view_ivf_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "secretaries_view_ivf_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "doctors_insert_ivf_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "secretaries_insert_ivf_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "doctors_update_ivf_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "secretaries_update_ivf_cycles" ON ivf_cycles;

DROP POLICY IF EXISTS "doctors_view_pregnancies" ON pregnancies;
DROP POLICY IF EXISTS "secretaries_view_pregnancies" ON pregnancies;
DROP POLICY IF EXISTS "doctors_insert_pregnancies" ON pregnancies;
DROP POLICY IF EXISTS "secretaries_insert_pregnancies" ON pregnancies;
DROP POLICY IF EXISTS "doctors_update_pregnancies" ON pregnancies;
DROP POLICY IF EXISTS "secretaries_update_pregnancies" ON pregnancies;

-- Policies لـ financial_cases
CREATE POLICY "doctors_view_financial_cases" ON financial_cases
  FOR SELECT
  USING (clinic_id = get_doctor_id());

CREATE POLICY "secretaries_view_financial_cases" ON financial_cases
  FOR SELECT
  USING (clinic_id = get_secretary_doctor_id());

CREATE POLICY "doctors_insert_financial_cases" ON financial_cases
  FOR INSERT
  WITH CHECK (clinic_id = get_doctor_id());

CREATE POLICY "secretaries_insert_financial_cases" ON financial_cases
  FOR INSERT
  WITH CHECK (clinic_id = get_secretary_doctor_id());

CREATE POLICY "doctors_update_financial_cases" ON financial_cases
  FOR UPDATE
  USING (clinic_id = get_doctor_id())
  WITH CHECK (clinic_id = get_doctor_id());

CREATE POLICY "secretaries_update_financial_cases" ON financial_cases
  FOR UPDATE
  USING (clinic_id = get_secretary_doctor_id())
  WITH CHECK (clinic_id = get_secretary_doctor_id());

-- Policies لـ packages
CREATE POLICY "doctors_view_packages" ON packages
  FOR SELECT
  USING (clinic_id = get_doctor_id());

CREATE POLICY "secretaries_view_packages" ON packages
  FOR SELECT
  USING (clinic_id = get_secretary_doctor_id());

CREATE POLICY "doctors_insert_packages" ON packages
  FOR INSERT
  WITH CHECK (clinic_id = get_doctor_id());

CREATE POLICY "doctors_update_packages" ON packages
  FOR UPDATE
  USING (clinic_id = get_doctor_id())
  WITH CHECK (clinic_id = get_doctor_id());

-- Policies لـ ivf_cycles
CREATE POLICY "doctors_view_ivf_cycles" ON ivf_cycles
  FOR SELECT
  USING (doctor_id = get_doctor_id());

CREATE POLICY "secretaries_view_ivf_cycles" ON ivf_cycles
  FOR SELECT
  USING (doctor_id = get_secretary_doctor_id());

CREATE POLICY "doctors_insert_ivf_cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (doctor_id = get_doctor_id());

CREATE POLICY "secretaries_insert_ivf_cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (doctor_id = get_secretary_doctor_id());

CREATE POLICY "doctors_update_ivf_cycles" ON ivf_cycles
  FOR UPDATE
  USING (doctor_id = get_doctor_id())
  WITH CHECK (doctor_id = get_doctor_id());

CREATE POLICY "secretaries_update_ivf_cycles" ON ivf_cycles
  FOR UPDATE
  USING (doctor_id = get_secretary_doctor_id())
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- Policies لـ pregnancies
CREATE POLICY "doctors_view_pregnancies" ON pregnancies
  FOR SELECT
  USING (doctor_id = get_doctor_id());

CREATE POLICY "secretaries_view_pregnancies" ON pregnancies
  FOR SELECT
  USING (doctor_id = get_secretary_doctor_id());

CREATE POLICY "doctors_insert_pregnancies" ON pregnancies
  FOR INSERT
  WITH CHECK (doctor_id = get_doctor_id());

CREATE POLICY "secretaries_insert_pregnancies" ON pregnancies
  FOR INSERT
  WITH CHECK (doctor_id = get_secretary_doctor_id());

CREATE POLICY "doctors_update_pregnancies" ON pregnancies
  FOR UPDATE
  USING (doctor_id = get_doctor_id())
  WITH CHECK (doctor_id = get_doctor_id());

CREATE POLICY "secretaries_update_pregnancies" ON pregnancies
  FOR UPDATE
  USING (doctor_id = get_secretary_doctor_id())
  WITH CHECK (doctor_id = get_secretary_doctor_id());

-- ========================================
-- الخطوة 9: التحقق من ربط السكرتيرة بالطبيب
-- ========================================

-- عرض بيانات الأطباء والسكرتيرات
SELECT 
  '👥 الأطباء والسكرتيرات' as title,
  id,
  name,
  email,
  user_role,
  secretary_doctor_id,
  CASE 
    WHEN user_role = 'doctor' THEN '👨‍⚕️ طبيب'
    WHEN user_role = 'secretary' AND secretary_doctor_id IS NOT NULL THEN '👩‍💼 سكرتيرة (مربوطة)'
    WHEN user_role = 'secretary' AND secretary_doctor_id IS NULL THEN '⚠️ سكرتيرة (غير مربوطة)'
    ELSE '❓ غير محدد'
  END as status
FROM doctors
ORDER BY user_role, name;

-- ========================================
-- الخطوة 10: التحقق النهائي
-- ========================================

-- عرض الـ policies الجديدة
SELECT 
  '📋 Policies الجديدة' as title,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename IN ('doctors', 'patients', 'appointments', 'invoices', 'invoice_items')
ORDER BY tablename, policyname;

-- التحقق من البيانات
SELECT 
  '✅ اختبار الوصول للبيانات' as title,
  'doctors' as table_name,
  COUNT(*) as record_count
FROM doctors
UNION ALL
SELECT 
  '✅ اختبار الوصول للبيانات',
  'patients',
  COUNT(*)
FROM patients
UNION ALL
SELECT 
  '✅ اختبار الوصول للبيانات',
  'appointments',
  COUNT(*)
FROM appointments;

-- ========================================
-- رسالة نجاح
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ تم إصلاح Infinite Recursion بنجاح!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ تم حذف الـ policies القديمة التي تسبب recursion';
  RAISE NOTICE '✅ تم إنشاء دوال get_doctor_id() و get_secretary_doctor_id()';
  RAISE NOTICE '✅ تم إنشاء policies لجميع الجداول:';
  RAISE NOTICE '   - doctors, patients, appointments';
  RAISE NOTICE '   - invoices, invoice_items';
  RAISE NOTICE '   - financial_cases, packages';
  RAISE NOTICE '   - ivf_cycles, pregnancies';
  RAISE NOTICE '✅ الطبيب يشوف بياناته فقط';
  RAISE NOTICE '✅ السكرتيرة تشوف بيانات الطبيب المسؤول عنها';
  RAISE NOTICE '';
  RAISE NOTICE '📋 شوف النتائج أعلاه للتأكد من ربط السكرتيرة بالطبيب';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ إذا السكرتيرة غير مربوطة، نفذ:';
  RAISE NOTICE '   UPDATE doctors SET secretary_doctor_id = ''<doctor_id>''';
  RAISE NOTICE '   WHERE user_role = ''secretary'';';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 حدّث الصفحة الآن (F5) - يجب أن تشوف الفواتير!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;
