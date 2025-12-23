-- ============================================================================
-- 🤰 FIX PREGNANCY COLUMNS - إصلاح أعمدة جدول الحمل
-- ============================================================================
-- يحل مشكلة "Could not find the 'thromboprophylaxis_needed' column"
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🔧 جاري إصلاح جدول pregnancies...';

    -- 1. تصحيح اسم عمود thromboprophylaxis إلى thromboprophylaxis_needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'pregnancies' AND column_name = 'thromboprophylaxis') THEN
        ALTER TABLE pregnancies RENAME COLUMN thromboprophylaxis TO thromboprophylaxis_needed;
        RAISE NOTICE '✅ تم تغيير اسم العمود من thromboprophylaxis إلى thromboprophylaxis_needed';
    END IF;

    -- 2. التأكد من وجود العمود thromboprophylaxis_needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pregnancies' AND column_name = 'thromboprophylaxis_needed') THEN
        ALTER TABLE pregnancies ADD COLUMN thromboprophylaxis_needed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ تم إضافة عمود thromboprophylaxis_needed';
    END IF;

    -- 3. التأكد من وجود عمود aspirin_prescribed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pregnancies' AND column_name = 'aspirin_prescribed') THEN
        ALTER TABLE pregnancies ADD COLUMN aspirin_prescribed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ تم إضافة عمود aspirin_prescribed';
    END IF;

    -- 4. التأكد من وجود عمود progesterone_support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pregnancies' AND column_name = 'progesterone_support') THEN
        ALTER TABLE pregnancies ADD COLUMN progesterone_support BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ تم إضافة عمود progesterone_support';
    END IF;

END $$;

-- ============================================================================
-- ✅ VERIFICATION
-- ============================================================================

SELECT 
    '✅ تم إصلاح جدول pregnancies بنجاح!' as status,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'pregnancies' 
AND column_name IN ('thromboprophylaxis_needed', 'aspirin_prescribed', 'progesterone_support');
