-- ============================================================================
-- 🔒 إصلاح فصل البيانات - كل عيادة تشوف بياناتها فقط
-- ============================================================================
-- المشكلة: الأطباء يشوفون مرضى بعض وبيانات بعض
-- الحل: RLS policies صارمة باستخدام clinic_id
-- ============================================================================

-- ========================================
-- الخطوة 1: إنشاء دالة مساعدة للحصول على clinic_id
-- ========================================

-- دالة تجيب clinic_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
  v_role TEXT;
BEGIN
  -- جلب الدور و clinic_id من جدول doctors
  SELECT user_role, COALESCE(clinic_id, id)
  INTO v_role, v_clinic_id
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- إذا كان سكرتير، نستخدم clinic_id (معرف الطبيب المسؤول)
  -- إذا كان طبيب، نستخدم id الخاص به (هو نفسه clinic_id)
  RETURN v_clinic_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_clinic_id() TO authenticated;

-- ========================================
-- الخطوة 2: تحديث سياسات جدول PATIENTS
-- ========================================

-- حذف جميع السياسات القديمة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'patients' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON patients', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة - كل عيادة ترى مرضاها فقط
CREATE POLICY "clinic_view_own_patients" ON patients
  FOR SELECT
  USING (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_insert_own_patients" ON patients
  FOR INSERT
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_update_own_patients" ON patients
  FOR UPDATE
  USING (doctor_id = get_my_clinic_id())
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_delete_own_patients" ON patients
  FOR DELETE
  USING (doctor_id = get_my_clinic_id());

-- ========================================
-- الخطوة 3: تحديث سياسات جدول APPOINTMENTS
-- ========================================

-- حذف جميع السياسات القديمة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'appointments' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON appointments', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة
CREATE POLICY "clinic_view_own_appointments" ON appointments
  FOR SELECT
  USING (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_insert_own_appointments" ON appointments
  FOR INSERT
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_update_own_appointments" ON appointments
  FOR UPDATE
  USING (doctor_id = get_my_clinic_id())
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_delete_own_appointments" ON appointments
  FOR DELETE
  USING (doctor_id = get_my_clinic_id());

-- ========================================
-- الخطوة 4: تحديث سياسات جدول VISITS
-- ========================================

-- حذف جميع السياسات القديمة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'visits' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON visits', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة
CREATE POLICY "clinic_view_own_visits" ON visits
  FOR SELECT
  USING (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_insert_own_visits" ON visits
  FOR INSERT
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_update_own_visits" ON visits
  FOR UPDATE
  USING (doctor_id = get_my_clinic_id())
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_delete_own_visits" ON visits
  FOR DELETE
  USING (doctor_id = get_my_clinic_id());

-- ========================================
-- الخطوة 5: تحديث سياسات جدول IVF_CYCLES
-- ========================================

-- حذف جميع السياسات القديمة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'ivf_cycles' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON ivf_cycles', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة
CREATE POLICY "clinic_view_own_ivf_cycles" ON ivf_cycles
  FOR SELECT
  USING (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_insert_own_ivf_cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_update_own_ivf_cycles" ON ivf_cycles
  FOR UPDATE
  USING (doctor_id = get_my_clinic_id())
  WITH CHECK (doctor_id = get_my_clinic_id());

CREATE POLICY "clinic_delete_own_ivf_cycles" ON ivf_cycles
  FOR DELETE
  USING (doctor_id = get_my_clinic_id());

-- ========================================
-- الخطوة 6: تحديث سياسات جدول PREGNANCIES (الحمل)
-- ========================================

-- حذف جميع السياسات القديمة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'pregnancies' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON pregnancies', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة - عن طريق المريض
CREATE POLICY "clinic_view_own_pregnancies" ON pregnancies
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_insert_own_pregnancies" ON pregnancies
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_update_own_pregnancies" ON pregnancies
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_delete_own_pregnancies" ON pregnancies
  FOR DELETE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

-- ========================================
-- الخطوة 7: تحديث سياسات جدول LAB_RESULTS
-- ========================================

-- حذف جميع السياسات القديمة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'lab_results' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON lab_results', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة - عن طريق المريض
CREATE POLICY "clinic_view_own_lab_results" ON lab_results
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_insert_own_lab_results" ON lab_results
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_update_own_lab_results" ON lab_results
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_delete_own_lab_results" ON lab_results
  FOR DELETE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

-- ========================================
-- الخطوة 8: تحديث سياسات جدول PATIENT_FILES
-- ========================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'patient_files' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON patient_files', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة
CREATE POLICY "clinic_view_own_patient_files" ON patient_files
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_insert_own_patient_files" ON patient_files
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_update_own_patient_files" ON patient_files
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

CREATE POLICY "clinic_delete_own_patient_files" ON patient_files
  FOR DELETE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE doctor_id = get_my_clinic_id()
    )
  );

-- ========================================
-- الخطوة 9: تحديث سياسات جدول INVOICES
-- ========================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'invoices' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON invoices', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة
CREATE POLICY "clinic_view_own_invoices" ON invoices
  FOR SELECT
  USING (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_insert_own_invoices" ON invoices
  FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_update_own_invoices" ON invoices
  FOR UPDATE
  USING (clinic_id = get_my_clinic_id())
  WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_delete_own_invoices" ON invoices
  FOR DELETE
  USING (clinic_id = get_my_clinic_id());

-- ========================================
-- الخطوة 10: تحديث سياسات جدول SERVICES
-- ========================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'services' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON services', r.policyname);
  END LOOP;
END $$;

-- السياسات الجديدة
CREATE POLICY "clinic_view_own_services" ON services
  FOR SELECT
  USING (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_insert_own_services" ON services
  FOR INSERT
  WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_update_own_services" ON services
  FOR UPDATE
  USING (clinic_id = get_my_clinic_id())
  WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_delete_own_services" ON services
  FOR DELETE
  USING (clinic_id = get_my_clinic_id());

-- ========================================
-- الخطوة 11: سياسات جدول DOCTORS (خاصة)
-- ========================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'doctors' 
    AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON doctors', r.policyname);
  END LOOP;
END $$;

-- كل مستخدم يشوف بياناته الخاصة
CREATE POLICY "users_view_own_profile" ON doctors
  FOR SELECT
  USING (user_id = auth.uid());

-- السكرتيرة تشوف بيانات الطبيب المسؤول عنها فقط
CREATE POLICY "secretary_view_assigned_doctor" ON doctors
  FOR SELECT
  USING (
    id IN (
      SELECT clinic_id 
      FROM doctors 
      WHERE user_id = auth.uid() 
      AND clinic_id IS NOT NULL
    )
  );

CREATE POLICY "users_update_own_profile" ON doctors
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_insert_own_profile" ON doctors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ========================================
-- الخطوة 12: التحقق من التطبيق
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ تم تطبيق سياسات RLS الصارمة بنجاح';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 كل عيادة الآن تشوف بياناتها فقط:';
  RAISE NOTICE '   ✓ المرضى (patients)';
  RAISE NOTICE '   ✓ المواعيد (appointments)';
  RAISE NOTICE '   ✓ الزيارات (visits)';
  RAISE NOTICE '   ✓ دورات IVF (ivf_cycles)';
  RAISE NOTICE '   ✓ متابعة الحمل (pregnancies)';
  RAISE NOTICE '   ✓ التحاليل (lab_results)';
  RAISE NOTICE '   ✓ الملفات (patient_files)';
  RAISE NOTICE '   ✓ الفواتير (invoices)';
  RAISE NOTICE '   ✓ الخدمات (services)';
  RAISE NOTICE '';
  RAISE NOTICE '👥 السكرتيرة ترى بيانات الطبيب المسؤول عنها فقط';
  RAISE NOTICE '👨‍⚕️ الطبيب يرى بيانات عيادته فقط';
  RAISE NOTICE '';
END $$;

-- ========================================
-- استعلام للتحقق من السياسات المطبقة
-- ========================================

-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('patients', 'appointments', 'visits', 'ivf_cycles', 'doctors', 'invoices')
-- ORDER BY tablename, policyname;
