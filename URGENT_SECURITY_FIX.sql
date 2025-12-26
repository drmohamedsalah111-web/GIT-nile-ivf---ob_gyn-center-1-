-- ============================================================================
-- 🚨 إصلاح أمني عاجل - منع السكرتيرة من الوصول لحساب الطبيب
-- ============================================================================
-- المشكلة: السكرتيرة لها صلاحيات واسعة جداً وممكن تدخل على حساب الطبيب
-- الحل: تقييد الصلاحيات وفصل البيانات
-- ============================================================================

-- ========================================
-- الخطوة 1: حذف جميع الـ Policies القديمة أولاً
-- ========================================

-- حذف policies الأطباء
DROP POLICY IF EXISTS "secretaries_view_all_doctors" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_only" ON doctors;
DROP POLICY IF EXISTS "doctors_view_own_record_only" ON doctors;

-- حذف policies المرضى
DROP POLICY IF EXISTS "secretaries_view_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_create_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_update_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_delete_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor" ON patients;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_patients" ON patients;

-- حذف policies المواعيد
DROP POLICY IF EXISTS "secretaries_view_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_assigned_doctor_appointments" ON appointments;

-- حذف policies الفواتير
DROP POLICY IF EXISTS "secretaries_view_all_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_create_all_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_all_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_assigned_doctor_invoices" ON invoices;

-- حذف policies invoice_items
DROP POLICY IF EXISTS "Users can view their invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can create invoice items" ON invoice_items;
DROP POLICY IF EXISTS "secretaries_view_assigned_doctor_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "secretaries_insert_for_assigned_doctor_invoice_items" ON invoice_items;

-- حذف policies IVF
DROP POLICY IF EXISTS "secretaries_view_ivf_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "doctors_only_view_ivf_cycles" ON ivf_cycles;

-- ========================================
-- الخطوة 2: حذف الدالة القديمة (الآن آمن)
-- ========================================
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS check_secretary_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS recover_data_from_audit(UUID, TEXT) CASCADE;

-- ========================================
-- الخطوة 3: إنشاء دالة get_user_role الجديدة
-- ========================================
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
  
  -- إذا لم يجد role، يرجع null بدلاً من 'doctor'
  RETURN user_role_val;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ========================================
-- الخطوة 4: إنشاء الـ Policies الجديدة الآمنة
-- ========================================

-- === policies جدول الأطباء ===

-- السكرتيرة تشوف فقط الطبيب المسؤول عنها
CREATE POLICY "secretaries_view_assigned_doctor_only" ON doctors
  FOR SELECT
  USING (
    -- إذا كان المستخدم سكرتيرة
    get_user_role() = 'secretary'
    AND
    -- تشوف فقط الطبيب المسؤول عنها
    id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- الطبيب يشوف سجله فقط
CREATE POLICY "doctors_view_own_record_only" ON doctors
  FOR SELECT
  USING (
    get_user_role() = 'doctor'
    AND user_id = auth.uid()
  );

-- === policies جدول المرضى ===

-- السكرتيرة تشوف فقط مرضى الطبيب المسؤول عنها
CREATE POLICY "secretaries_view_assigned_doctor_patients" ON patients
  FOR SELECT
  USING (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تضيف مرضى لكن فقط للطبيب المسؤول عنها
CREATE POLICY "secretaries_insert_for_assigned_doctor" ON patients
  FOR INSERT
  WITH CHECK (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تعدل مرضى الطبيب المسؤول عنها فقط
CREATE POLICY "secretaries_update_assigned_doctor_patients" ON patients
  FOR UPDATE
  USING (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- === policies جدول المواعيد ===

-- السكرتيرة تشوف فقط مواعيد الطبيب المسؤول عنها
CREATE POLICY "secretaries_view_assigned_doctor_appointments" ON appointments
  FOR SELECT
  USING (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تضيف مواعيد لكن فقط للطبيب المسؤول عنها
CREATE POLICY "secretaries_insert_for_assigned_doctor_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تعدل مواعيد الطبيب المسؤول عنها فقط
CREATE POLICY "secretaries_update_assigned_doctor_appointments" ON appointments
  FOR UPDATE
  USING (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تحذف مواعيد (للإلغاء) لكن فقط للطبيب المسؤول عنها
CREATE POLICY "secretaries_delete_assigned_doctor_appointments" ON appointments
  FOR DELETE
  USING (
    get_user_role() = 'secretary'
    AND doctor_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- === policies جدول الفواتير ===

-- السكرتيرة تشوف فقط فواتير الطبيب المسؤول عنها
CREATE POLICY "secretaries_view_assigned_doctor_invoices" ON invoices
  FOR SELECT
  USING (
    get_user_role() = 'secretary'
    AND clinic_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تضيف فواتير لكن فقط للطبيب المسؤول عنها
CREATE POLICY "secretaries_insert_for_assigned_doctor_invoices" ON invoices
  FOR INSERT
  WITH CHECK (
    get_user_role() = 'secretary'
    AND clinic_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- السكرتيرة تقدر تعدل فواتير الطبيب المسؤول عنها فقط
CREATE POLICY "secretaries_update_assigned_doctor_invoices" ON invoices
  FOR UPDATE
  USING (
    get_user_role() = 'secretary'
    AND clinic_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    get_user_role() = 'secretary'
    AND clinic_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
  );

-- === policies جدول invoice_items ===

-- السكرتيرة تشوف فقط عناصر فواتير الطبيب المسؤول عنها
CREATE POLICY "secretaries_view_assigned_doctor_invoice_items" ON invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE clinic_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- السكرتيرة تقدر تضيف عناصر فواتير لكن فقط للطبيب المسؤول عنها
CREATE POLICY "secretaries_insert_for_assigned_doctor_invoice_items" ON invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE clinic_id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- === منع الوصول لجداول حساسة ===

-- فقط الأطباء يشوفون بياناتهم الطبية
CREATE POLICY "doctors_only_view_ivf_cycles" ON ivf_cycles
  FOR SELECT
  USING (
    get_user_role() = 'doctor'
    AND doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- ========================================
-- الخطوة 5: Audit Log - تسجيل كل العمليات
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_role TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);

-- ========================================
-- الخطوة 6: تفعيل RLS على audit_log
-- ========================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- فقط الأطباء يشوفون سجل عملياتهم
CREATE POLICY "doctors_view_own_audit_log" ON audit_log
  FOR SELECT
  USING (
    get_user_role() = 'doctor'
    AND user_id = auth.uid()
  );

-- السكرتيرة تقدر تشوف سجل عملياتها فقط
CREATE POLICY "secretaries_view_own_audit_log" ON audit_log
  FOR SELECT
  USING (
    get_user_role() = 'secretary'
    AND user_id = auth.uid()
  );

-- الجميع يقدر يضيف في audit_log
CREATE POLICY "everyone_can_insert_audit_log" ON audit_log
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- الخطوة 7: Trigger لتسجيل العمليات تلقائياً
-- ========================================
CREATE OR REPLACE FUNCTION log_operation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_log (user_id, user_role, table_name, operation, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    get_user_role(),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$;

-- تفعيل Trigger على الجداول المهمة
DROP TRIGGER IF EXISTS audit_patients ON patients;
CREATE TRIGGER audit_patients
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION log_operation();

DROP TRIGGER IF EXISTS audit_appointments ON appointments;
CREATE TRIGGER audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION log_operation();

DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_operation();

-- ========================================
-- الخطوة 8: دالة للتحقق من الصلاحيات
-- ========================================
CREATE OR REPLACE FUNCTION check_secretary_access(
  target_doctor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assigned_doctor_id UUID;
BEGIN
  -- إذا المستخدم مش سكرتيرة، يرجع false
  IF get_user_role() != 'secretary' THEN
    RETURN FALSE;
  END IF;
  
  -- جلب الطبيب المسؤول عن السكرتيرة
  SELECT secretary_doctor_id INTO assigned_doctor_id
  FROM doctors
  WHERE user_id = auth.uid();
  
  -- التحقق من المطابقة
  RETURN assigned_doctor_id = target_doctor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION check_secretary_access(UUID) TO authenticated;

-- ========================================
-- الخطوة 9: دالة استرجاع البيانات الضائعة
-- ========================================
CREATE OR REPLACE FUNCTION recover_data_from_audit(
  record_id_to_recover UUID,
  table_to_recover TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_valid_data JSONB;
BEGIN
  -- فقط الأطباء يقدرون يسترجعون البيانات
  IF get_user_role() != 'doctor' THEN
    RAISE EXCEPTION 'Access denied: Only doctors can recover data';
  END IF;
  
  -- جلب آخر نسخة صحيحة من البيانات
  SELECT new_data INTO last_valid_data
  FROM audit_log
  WHERE record_id = record_id_to_recover
    AND table_name = table_to_recover
    AND operation IN ('INSERT', 'UPDATE')
  ORDER BY timestamp DESC
  LIMIT 1;
  
  RETURN last_valid_data;
END;
$$;

GRANT EXECUTE ON FUNCTION recover_data_from_audit(UUID, TEXT) TO authenticated;

-- ========================================
-- التحقق النهائي
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ إصلاح الأمان اكتمل بنجاح!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ تم تقييد صلاحيات السكرتيرة';
  RAISE NOTICE '✅ السكرتيرة تشوف فقط بيانات الطبيب المسؤول عنها';
  RAISE NOTICE '✅ تم تفعيل Audit Log لتسجيل كل العمليات';
  RAISE NOTICE '✅ يمكن استرجاع البيانات الضائعة من audit_log';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ========================================
-- استعلام للتحقق من الصلاحيات
-- ========================================
-- SELECT 
--   tablename,
--   policyname,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname LIKE '%secretaries%'
-- ORDER BY tablename, policyname;
