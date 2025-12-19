-- ============================================================================
-- FINAL TARGET FIX: إصلاح ivf_cycles فقط (بدون لمس الأطباء)
-- ============================================================================

-- 1. دالة لحذف سياسات جدول معين
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Loop through all policies on ivf_cycles specifically
    FOR pol IN
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ivf_cycles'
    LOOP
        RAISE NOTICE 'Dropping policy: %', pol.policyname;
        EXECUTE format('DROP POLICY IF EXISTS %I ON ivf_cycles', pol.policyname);
    END LOOP;
END $$;

-- 2. الآن الجدول حر من السياسات، نصلح الهيكل
ALTER TABLE ivf_cycles
  DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

-- تحويل العمود إلى UUID ليتطابق مع doctors (الذي هو UUID بالفعل)
ALTER TABLE ivf_cycles 
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

-- 3. إعادة ربط العلاقة
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

-- 5. إعادة بناء السياسات لجدول ivf_cycles فقط
CREATE POLICY "cycles_read_own" ON ivf_cycles 
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "cycles_insert_own" ON ivf_cycles 
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "cycles_update_own" ON ivf_cycles 
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "cycles_delete_own" ON ivf_cycles 
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

-- 6. تفعيل RLS
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;

-- 7. النتيجة
SELECT '✅ تم إصلاح ivf_cycles بنجاح دون التأثير على الجداول الأخرى' as status;
