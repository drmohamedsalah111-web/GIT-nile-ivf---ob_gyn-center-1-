-- ============================================================================
-- FIX DOCTORS INSERT POLICY - حل مشكلة إنشاء دورة IVF
-- ============================================================================
-- هذا السكريبت يضيف سياسة INSERT لجدول doctors للسماح بإنشاء ملفات الأطباء
-- المشكلة: foreign key constraint violation عند إنشاء دورة IVF جديدة
-- السبب: عدم وجود سياسة INSERT على جدول doctors
-- ============================================================================

-- إضافة سياسة INSERT لجدول doctors
DROP POLICY IF EXISTS "Doctors can insert their own profile" ON doctors;

CREATE POLICY "Doctors can insert their own profile" ON doctors
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- التحقق من السياسات الموجودة
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'doctors'
ORDER BY cmd, policyname;

-- ============================================================================
-- ملاحظات مهمة
-- ============================================================================
-- 1. هذه السياسة تسمح للمستخدم المصادق عليه بإنشاء ملفه الشخصي فقط
-- 2. تتحقق السياسة من أن user_id يطابق auth.uid() الحالي
-- 3. بعد تطبيق هذا السكريبت، يجب أن تعمل وظيفة getDoctorIdOrThrow بشكل صحيح
-- 4. سيتم إنشاء سجل الطبيب تلقائياً عند أول محاولة لإنشاء دورة IVF
-- ============================================================================

-- اختبار: تحقق من أن السياسة تم إنشاؤها بنجاح
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'doctors' AND policyname = 'Doctors can insert their own profile';
    
    IF policy_count > 0 THEN
        RAISE NOTICE '✅ سياسة INSERT تم إنشاؤها بنجاح';
    ELSE
        RAISE WARNING '❌ فشل إنشاء سياسة INSERT';
    END IF;
END $$;
