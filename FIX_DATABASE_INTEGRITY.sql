-- ============================================================================
-- إصلاح سلامة قاعدة البيانات والعلاقات
-- ============================================================================

-- 1. التأكد من أنواع البيانات في الجدولين
ALTER TABLE doctors 
  ALTER COLUMN id TYPE UUID USING id::UUID;

ALTER TABLE ivf_cycles 
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

-- 2. إزالة قيد FK القديم (الذي قد يكون معيباً)
ALTER TABLE ivf_cycles
  DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

-- 3. إعادة إنشاء القيد بشكل صحيح ومباشر
ALTER TABLE ivf_cycles
  ADD CONSTRAINT ivf_cycles_doctor_id_fkey
  FOREIGN KEY (doctor_id)
  REFERENCES doctors(id)
  ON DELETE CASCADE;

-- 4. تحديث سياسات RLS لضمان عدم وجود حجب
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view doctors" ON doctors;
CREATE POLICY "Active users can view doctors" ON doctors
  FOR SELECT
  USING (true); -- السماح للجميع برؤية الأطباء لضمان عمل العلاقات

-- 5. التأكد من وجود الطبيب (للمرة الأخيرة)
INSERT INTO doctors (id, user_id, email, name)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
)
ON CONFLICT (id) DO UPDATE 
SET user_id = EXCLUDED.user_id;

-- 6. التحقق النهائي
SELECT 
    '✅ تم تحديث العلاقات والبيانات' as status,
    (SELECT COUNT(*) FROM doctors WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c') as doctor_count;
