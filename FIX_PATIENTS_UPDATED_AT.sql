-- ============================================================================
-- إصلاح جدول patients - إضافة عمود updated_at
-- ============================================================================

-- 1. إضافة عمود updated_at إذا لم يكن موجوداً
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. تحديث القيم الحالية
UPDATE patients 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. إنشاء trigger للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_patients_updated_at_trigger ON patients;
CREATE TRIGGER update_patients_updated_at_trigger
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_patients_updated_at();

-- 4. التحقق
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
  AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

SELECT '✅ تم إضافة عمود updated_at بنجاح' as result;
