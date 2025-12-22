-- ============================================================================
-- تشخيص شامل لمشكلة ivf_cycles_doctor_id_fkey
-- ============================================================================

-- 1️⃣ فحص: هل الطبيب موجود فعلاً في جدول doctors؟
SELECT '1️⃣ فحص وجود الطبيب' as step;
SELECT id, user_id, email, name 
FROM doctors 
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 2️⃣ فحص: هل Foreign Key موجود وصحيح؟
SELECT '2️⃣ فحص Foreign Key Constraint' as step;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'ivf_cycles' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'ivf_cycles_doctor_id_fkey';

-- 3️⃣ إصلاح: إزالة وإعادة بناء Foreign Key
SELECT '3️⃣ إعادة بناء Foreign Key' as step;

ALTER TABLE ivf_cycles
DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;

ALTER TABLE ivf_cycles
ADD CONSTRAINT ivf_cycles_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES doctors(id)
ON DELETE CASCADE;

-- 4️⃣ إضافة/تحديث سجل الطبيب
SELECT '4️⃣ تحديث سجل الطبيب' as step;

INSERT INTO doctors (id, user_id, email, name, created_at, updated_at)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر',
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- 5️⃣ التحقق النهائي
SELECT '5️⃣ التحقق النهائي' as step;
SELECT 
    '✅ الطبيب موجود الآن' as status,
    id, 
    user_id, 
    email, 
    name
FROM doctors 
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- التحقق النهائي
SELECT 
    '✅ SUCCESS - تم إضافة الطبيب بنجاح!' as status,
    id, 
    user_id, 
    email, 
    name,
    created_at
FROM doctors 
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- رسالة تأكيد
SELECT '🎉 يمكنك الآن إنشاء دورة IVF جديدة في التطبيق' as message;
