-- ============================================================================
-- الحل النهائي الأكيد - بدون تعقيدات
-- ============================================================================
-- نفذ هذا السكريبت كاملاً مرة واحدة
-- ============================================================================

-- الخطوة 1: عرض الوضع الحالي
SELECT 'الخطوة 1: التحقق من الوضع الحالي' as step;

SELECT 
    COUNT(*) as doctor_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ لا يوجد سجل - سيتم الإنشاء'
        ELSE '✅ يوجد سجل'
    END as status
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c' 
   OR user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- الخطوة 2: حذف أي سجلات مكررة أو قديمة
SELECT 'الخطوة 2: تنظيف السجلات القديمة' as step;

DELETE FROM doctors 
WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- الخطوة 3: إنشاء السجل الجديد
SELECT 'الخطوة 3: إنشاء سجل الطبيب' as step;

INSERT INTO doctors (id, user_id, email, name)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
);

-- الخطوة 4: إضافة سياسة INSERT
SELECT 'الخطوة 4: إضافة سياسة INSERT' as step;

DROP POLICY IF EXISTS "Doctors can insert their own profile" ON doctors;

CREATE POLICY "Doctors can insert their own profile" ON doctors
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- الخطوة 5: التحقق النهائي
SELECT 'الخطوة 5: التحقق النهائي' as step;

-- عرض السجل
SELECT 
    '✅ السجل موجود الآن' as status,
    id, 
    user_id, 
    email, 
    name
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- عرض السياسات
SELECT 
    '✅ السياسات' as status,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY cmd;

-- رسالة نهائية
SELECT '🎉 تم بنجاح! يمكنك الآن إنشاء دورة IVF' as final_message;
