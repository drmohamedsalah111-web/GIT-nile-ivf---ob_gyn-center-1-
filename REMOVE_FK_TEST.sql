-- ============================================================================
-- الحل المؤقت: إزالة قيد Foreign Key للاختبار
-- ============================================================================

-- 1. إزالة قيد Foreign Key
ALTER TABLE ivf_cycles
  DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

-- 2. التحقق من عدم وجود قيود أخرى
SELECT 
    conname as constraint_name
FROM pg_constraint
WHERE conrelid = 'ivf_cycles'::regclass
  AND contype = 'f';

-- 3. النتيجة
SELECT '✅ تم إزالة قيد Foreign Key - جرب إنشاء دورة IVF الآن' as status;
