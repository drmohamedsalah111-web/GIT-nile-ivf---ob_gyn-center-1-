-- ============================================================================
-- الحل الجذري: حذف السياسات -> التعديل -> إعادة السياسات
-- ============================================================================

-- 1. حذف جميع السياسات القديمة التي قد تعتمد على العمود
DROP POLICY IF EXISTS "doctors_select_cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can insert IVF cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can read their IVF cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can update their IVF cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can delete their IVF cycles" ON ivf_cycles;

-- 2. الآن يمكننا تعديل الجدول بأمان
ALTER TABLE ivf_cycles
  DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

ALTER TABLE ivf_cycles 
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

-- 3. إعادة إنشاء العلاقة
ALTER TABLE ivf_cycles
  ADD CONSTRAINT ivf_cycles_doctor_id_fkey
  FOREIGN KEY (doctor_id)
  REFERENCES doctors(id)
  ON DELETE CASCADE;

-- 4. إعادة إنشاء السياسات (محدثة)
CREATE POLICY "Doctors can view their cycles" ON ivf_cycles
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

CREATE POLICY "Doctors can insert cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

CREATE POLICY "Doctors can update their cycles" ON ivf_cycles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

CREATE POLICY "Doctors can delete their cycles" ON ivf_cycles
  FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

-- 5. تفعيل RLS
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;

-- 6. التحقق النهائي
SELECT 
    '✅ تم التحديث بنجاح' as status,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
WHERE tc.table_name = 'ivf_cycles' 
  AND tc.constraint_type = 'FOREIGN KEY';
