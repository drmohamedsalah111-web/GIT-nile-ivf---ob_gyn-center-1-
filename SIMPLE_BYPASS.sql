-- ============================================================================
-- الحل البسيط: تجاوز المشكلة بدون تعديل هيكل الجداول
-- ============================================================================

-- الخيار 1: إضافة سياسة INSERT مفتوحة (للمستخدمين المسجلين فقط)
-- هذا لا يتطلب تعديل أنواع البيانات

DROP POLICY IF EXISTS "Allow authenticated insert" ON ivf_cycles;
CREATE POLICY "Allow authenticated insert" ON ivf_cycles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- الخيار 2: إضافة سياسة SELECT مفتوحة للتأكد من رؤية البيانات
DROP POLICY IF EXISTS "Allow authenticated select" ON ivf_cycles;
CREATE POLICY "Allow authenticated select" ON ivf_cycles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- الخيار 3: إضافة سياسة UPDATE مفتوحة
DROP POLICY IF EXISTS "Allow authenticated update" ON ivf_cycles;
CREATE POLICY "Allow authenticated update" ON ivf_cycles
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- التأكد من تفعيل RLS
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;

-- التحقق
SELECT 
    '✅ تم إضافة السياسات المفتوحة' as status,
    policyname
FROM pg_policies
WHERE tablename = 'ivf_cycles';
