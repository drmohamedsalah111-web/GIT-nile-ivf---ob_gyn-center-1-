-- ============================================================================
-- إصلاح العلاقة بشكل آمن (IVF Cycles Only)
-- ============================================================================

-- 1. إزالة القيد القديم من جدول ivf_cycles
ALTER TABLE ivf_cycles
  DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

-- 2. توحيد نوع البيانات في ivf_cycles ليكون UUID
-- ملاحظة: لن نلمس جدول doctors لتجنب المشاكل
ALTER TABLE ivf_cycles 
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

-- 3. إعادة إنشاء العلاقة (Foreign Key)
-- سيقوم Postgres تلقائياً بمطابقة الأنواع، وإذا فشل سيعطينا رسالة واضحة
ALTER TABLE ivf_cycles
  ADD CONSTRAINT ivf_cycles_doctor_id_fkey
  FOREIGN KEY (doctor_id)
  REFERENCES doctors(id)
  ON DELETE CASCADE;

-- 4. التأكد من وجود سجل الطبيب (للاحتياط)
INSERT INTO doctors (id, user_id, email, name)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
)
ON CONFLICT (id) DO NOTHING;

-- 5. تحديث سياسات ivf_cycles للتأكد
DROP POLICY IF EXISTS "Doctors can insert IVF cycles" ON ivf_cycles;
CREATE POLICY "Doctors can insert IVF cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM doctors WHERE id = doctor_id)
  );

-- 6. التحقق النهائي
SELECT 
    '✅ تم إصلاح العلاقة بنجاح' as status,
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'ivf_cycles';
