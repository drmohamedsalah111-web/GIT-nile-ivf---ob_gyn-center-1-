-- ============================================================================
-- تشخيص شامل لمشكلة إنشاء دورة IVF
-- ============================================================================

-- 1. التحقق من وجود سجل الطبيب
SELECT 
    '=== 1. سجل الطبيب ===' as section,
    id,
    user_id,
    email,
    name
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
   OR user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5';

-- 2. عدد المرضى المرتبطين بهذا الطبيب
SELECT 
    '=== 2. المرضى المرتبطين ===' as section,
    COUNT(*) as patient_count
FROM patients
WHERE doctor_id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 3. عدد دورات IVF المرتبطة بهذا الطبيب
SELECT 
    '=== 3. دورات IVF المرتبطة ===' as section,
    COUNT(*) as cycle_count
FROM ivf_cycles
WHERE doctor_id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 4. التحقق من سياسات RLS على جدول doctors
SELECT 
    '=== 4. سياسات RLS على doctors ===' as section,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY cmd;

-- 5. التحقق من القيود على جدول doctors
SELECT 
    '=== 5. القيود على doctors ===' as section,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'doctors'::regclass
ORDER BY contype;

-- 6. محاولة إنشاء دورة IVF تجريبية (للتشخيص فقط - لن يتم الحفظ)
DO $$
DECLARE
    test_patient_id UUID;
    test_cycle_id UUID := gen_random_uuid();
BEGIN
    -- الحصول على أول مريض لهذا الطبيب
    SELECT id INTO test_patient_id
    FROM patients
    WHERE doctor_id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c'
    LIMIT 1;
    
    IF test_patient_id IS NULL THEN
        RAISE NOTICE '❌ لا يوجد مرضى لهذا الطبيب';
        RETURN;
    END IF;
    
    RAISE NOTICE '=== 6. اختبار إنشاء دورة IVF ===';
    RAISE NOTICE 'Patient ID: %', test_patient_id;
    RAISE NOTICE 'Doctor ID: 8014e2f1-02a2-4045-aea0-341dc19c4d2c';
    
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
        
        RAISE NOTICE '✅ نجح إنشاء دورة IVF تجريبية!';
        
        -- حذف الدورة التجريبية
        DELETE FROM ivf_cycles WHERE id = test_cycle_id;
        RAISE NOTICE '✅ تم حذف الدورة التجريبية';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ فشل إنشاء دورة IVF: %', SQLERRM;
    END;
END $$;

-- 7. الخلاصة والتوصيات
SELECT 
    '=== 7. الخلاصة ===' as section,
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
