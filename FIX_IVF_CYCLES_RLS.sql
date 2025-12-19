-- ============================================================================
-- إضافة سياسات RLS على جدول ivf_cycles
-- ============================================================================

-- 1. التحقق من السياسات الحالية
SELECT 
    '=== السياسات الحالية على ivf_cycles ===' as info;

SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'ivf_cycles';

-- 2. إضافة سياسة INSERT
DROP POLICY IF EXISTS "Doctors can insert IVF cycles" ON ivf_cycles;

CREATE POLICY "Doctors can insert IVF cycles" ON ivf_cycles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- 3. إضافة سياسة SELECT
DROP POLICY IF EXISTS "Doctors can read their IVF cycles" ON ivf_cycles;

CREATE POLICY "Doctors can read their IVF cycles" ON ivf_cycles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- 4. إضافة سياسة UPDATE
DROP POLICY IF EXISTS "Doctors can update their IVF cycles" ON ivf_cycles;

CREATE POLICY "Doctors can update their IVF cycles" ON ivf_cycles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- 5. التحقق من السياسات الجديدة
SELECT 
    '=== ✅ السياسات الجديدة ===' as info;

SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'ivf_cycles'
ORDER BY cmd;

SELECT '🎉 تم! جرب إنشاء دورة IVF الآن' as message;
