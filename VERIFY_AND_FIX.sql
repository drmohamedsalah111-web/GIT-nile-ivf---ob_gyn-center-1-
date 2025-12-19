-- ============================================================================
-- الحل النهائي القاطع
-- ============================================================================
-- هذا السكريبت سيحل المشكلة 100%
-- ============================================================================

-- 1. عرض جميع سجلات doctors
SELECT 
    '=== جميع سجلات الأطباء ===' as info,
    id,
    user_id,
    email,
    name
FROM doctors
ORDER BY created_at DESC;

-- 2. البحث عن السجل بالـ user_id
SELECT 
    '=== البحث بـ user_id ===' as info,
    id,
    user_id,
    email
FROM doctors
WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- 3. إذا لم يكن موجود، إنشاؤه
INSERT INTO doctors (id, user_id, email, name)
SELECT 
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
WHERE NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5'
);

-- 4. التحقق النهائي
SELECT 
    '=== ✅ النتيجة النهائية ===' as info,
    id,
    user_id,
    email,
    name
FROM doctors
WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- 5. اختبار foreign key
SELECT 
    '=== اختبار Foreign Key ===' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM doctors 
            WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
        )
        THEN '✅ يمكن استخدام هذا الـ ID في ivf_cycles'
        ELSE '❌ لا يمكن استخدام هذا الـ ID'
    END as result;
