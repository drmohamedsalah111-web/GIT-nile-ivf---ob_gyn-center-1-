-- ============================================================================
-- تحقق بسيط: هل السجل موجود؟
-- ============================================================================

-- 1. البحث عن السجل بالـ ID
SELECT 
    'البحث بـ ID' as search_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as status
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 2. البحث عن السجل بـ user_id
SELECT 
    'البحث بـ user_id' as search_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as status
FROM doctors
WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- 3. عرض جميع سجلات الأطباء
SELECT 
    '=== جميع الأطباء ===' as section;
    
SELECT id, user_id, email, name
FROM doctors
ORDER BY id;

-- ============================================================================
-- الحل: إنشاء السجل إذا لم يكن موجوداً
-- ============================================================================

-- حذف أي سجل قديم بنفس user_id (إن وجد)
DELETE FROM doctors 
WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5'
  AND id != '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- إنشاء السجل الجديد
INSERT INTO doctors (id, user_id, email, name)
SELECT 
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
WHERE NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
);

-- التحقق النهائي
SELECT 
    '=== ✅ النتيجة النهائية ===' as section;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM doctors WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c')
        THEN '✅ السجل موجود الآن - يمكنك إنشاء دورات IVF'
        ELSE '❌ السجل لا يزال غير موجود - هناك مشكلة أخرى'
    END as final_status;

SELECT id, user_id, email, name
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
   OR user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';
