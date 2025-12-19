-- ============================================================================
-- الحل النهائي الشامل لمشكلة doctor_id
-- ============================================================================
-- هذا السكريبت يحل المشكلة بشكل نهائي
-- ============================================================================

-- الخطوة 1: التحقق من المشكلة
SELECT 
    '=== 1. التحقق من سجل الطبيب ===' as step;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM doctors WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c')
        THEN '✅ السجل موجود'
        ELSE '❌ السجل غير موجود - سيتم إنشاؤه'
    END as doctor_status;

-- الخطوة 2: إنشاء السجل إذا لم يكن موجوداً
SELECT 
    '=== 2. إنشاء سجل الطبيب ===' as step;

-- استخدام DO block لإنشاء السجل بشكل آمن
DO $$
BEGIN
    -- تحقق من عدم وجود السجل
    IF NOT EXISTS (SELECT 1 FROM doctors WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c') THEN
        -- إنشاء السجل
        INSERT INTO doctors (id, user_id, email, name)
        VALUES (
            '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
            'efbfbed7-401d-449f-8759-6a707a358dd5',
            'dr.mohamed.salah.gabr@gmail.com',
            'د. محمد صلاح جبر'
        );
        RAISE NOTICE '✅ تم إنشاء سجل الطبيب بنجاح';
    ELSE
        RAISE NOTICE '✅ سجل الطبيب موجود بالفعل';
    END IF;
END $$;

-- الخطوة 3: إضافة سياسة INSERT
SELECT 
    '=== 3. إضافة سياسة INSERT ===' as step;

DROP POLICY IF EXISTS "Doctors can insert their own profile" ON doctors;

CREATE POLICY "Doctors can insert their own profile" ON doctors
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

SELECT '✅ تم إضافة سياسة INSERT بنجاح' as result;

-- الخطوة 4: التحقق النهائي
SELECT 
    '=== 4. التحقق النهائي ===' as step;

-- تحقق من السجل
SELECT 
    id,
    user_id,
    email,
    name
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
   OR user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- تحقق من السياسات
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY cmd;

-- الخطوة 5: اختبار إنشاء دورة IVF
SELECT 
    '=== 5. جاهز للاختبار ===' as step;

SELECT 
    '✅ يمكنك الآن محاولة إنشاء دورة IVF جديدة' as message;
