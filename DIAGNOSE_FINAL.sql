-- ============================================================================
-- تشخيص نهائي - لماذا تفشل عملية الإدراج؟
-- ============================================================================

-- 1. التحقق من وجود السجل
SELECT 
    '=== 1. هل السجل موجود؟ ===' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ نعم، السجل موجود'
        ELSE '❌ لا، السجل غير موجود'
    END as result
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 2. عرض السجل
SELECT 
    '=== 2. بيانات السجل ===' as check_name;

SELECT * FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 3. عدد المرضى المرتبطين
SELECT 
    '=== 3. المرضى المرتبطين ===' as check_name,
    COUNT(*) as patient_count
FROM patients
WHERE doctor_id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 4. التحقق من سياسات RLS على ivf_cycles
SELECT 
    '=== 4. سياسات RLS على ivf_cycles ===' as check_name;

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
WHERE tablename = 'ivf_cycles';

-- 5. التحقق من القيود على ivf_cycles
SELECT 
    '=== 5. القيود على ivf_cycles ===' as check_name;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'ivf_cycles'::regclass;

-- 6. محاولة إدراج تجريبي
SELECT 
    '=== 6. اختبار الإدراج ===' as check_name;

DO $$
DECLARE
    test_cycle_id UUID := gen_random_uuid();
    test_patient_id UUID;
BEGIN
    -- الحصول على أول مريض
    SELECT id INTO test_patient_id
    FROM patients
    WHERE doctor_id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
    LIMIT 1;
    
    IF test_patient_id IS NULL THEN
        RAISE NOTICE '❌ لا يوجد مرضى لهذا الطبيب';
        RETURN;
    END IF;
    
    -- محاولة الإدراج
    BEGIN
        INSERT INTO ivf_cycles (
            id,
            patient_id,
            doctor_id,
            protocol,
            status,
            start_date
        ) VALUES (
            test_cycle_id,
            test_patient_id,
            '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
            'Antagonist',
            'Active',
            CURRENT_DATE
        );
        
        RAISE NOTICE '✅ نجح الإدراج التجريبي!';
        
        -- حذف الدورة التجريبية
        DELETE FROM ivf_cycles WHERE id = test_cycle_id;
        RAISE NOTICE '✅ تم حذف الدورة التجريبية';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ فشل الإدراج: %', SQLERRM;
    END;
END $$;

-- 7. الخلاصة
SELECT 
    '=== 7. الخلاصة ===' as check_name;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM doctors WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c')
        THEN '✅ سجل الطبيب موجود'
        ELSE '❌ سجل الطبيب غير موجود'
    END as doctor_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'doctors' 
            AND policyname = 'Doctors can insert their own profile'
        )
        THEN '✅ سياسة INSERT موجودة'
        ELSE '❌ سياسة INSERT مفقودة'
    END as insert_policy_status;
