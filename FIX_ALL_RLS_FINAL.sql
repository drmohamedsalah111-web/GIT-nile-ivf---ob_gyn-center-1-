-- ============================================================================
-- الحل النووي: حذف جميع السياسات ديناميكياً -> إصلاح -> إعادة بناء
-- ============================================================================

-- 1. كتلة برمجية لحذف كل السياسات على ivf_cycles بغض النظر عن اسمها
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ivf_cycles'
    LOOP
        RAISE NOTICE 'Dropping policy: %', pol.policyname;
        EXECUTE format('DROP POLICY IF EXISTS %I ON ivf_cycles', pol.policyname);
    END LOOP;
END $$;

-- 2. الآن الجدول "حر" تماماً.. نصلح الأنواع والعلاقات
ALTER TABLE ivf_cycles
  DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

-- تحويل العمود إلى UUID (هذا هو أصل المشكلة)
ALTER TABLE ivf_cycles 
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

-- إعادة ربط العلاقة بشكل صحيح
ALTER TABLE ivf_cycles
  ADD CONSTRAINT ivf_cycles_doctor_id_fkey
  FOREIGN KEY (doctor_id)
  REFERENCES doctors(id)
  ON DELETE CASCADE;

-- 3. التأكد من وجود سجل الطبيب (للاحتياط)
INSERT INTO doctors (id, user_id, email, name)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
)
ON CONFLICT (id) DO UPDATE 
SET user_id = EXCLUDED.user_id;

-- 4. إعادة إنشاء السياسات الموحدة (Standardized Policies)
-- سياسة القراءة
CREATE POLICY "ivf_cycles_select_policy" ON ivf_cycles
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

-- سياسة الإضافة
CREATE POLICY "ivf_cycles_insert_policy" ON ivf_cycles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

-- سياسة التحديث
CREATE POLICY "ivf_cycles_update_policy" ON ivf_cycles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

-- سياسة الحذف
CREATE POLICY "ivf_cycles_delete_policy" ON ivf_cycles
  FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

-- 5. تفعيل RLS
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;

-- 6. إضافة user_id للطبيب الحالي إذا كان مختلفاً (لحل مشاكل الـ Auth)
-- هذا يتأكد أن المستخدم الحالي هو مالك الطبيب
UPDATE doctors 
SET user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5'
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 7. النتيجة
SELECT '🎉 تم تنظيف وإصلاح قاعدة البيانات بنجاح تام' as final_status;
