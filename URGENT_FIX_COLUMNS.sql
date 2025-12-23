-- ============================================================================
-- 🚨 URGENT FIX - إصلاح سريع للأعمدة الناقصة/الخاطئة
-- ============================================================================
-- شغل هذا الملف فوراً في Supabase SQL Editor
-- ============================================================================

-- 1️⃣ إصلاح جدول PATIENTS - حذف history القديم وإضافة medical_history
DO $$ 
BEGIN
    RAISE NOTICE '🔧 جاري إصلاح جدول patients...';
    
    -- إضافة medical_history لو مش موجود
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'medical_history') THEN
        ALTER TABLE patients ADD COLUMN medical_history JSONB DEFAULT '{}';
        RAISE NOTICE '✅ تم إضافة عمود medical_history';
    END IF;
    
    -- إذا كان history موجود، انقل بياناته ثم احذفه
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'patients' AND column_name = 'history') THEN
        
        -- نقل البيانات
        UPDATE patients 
        SET medical_history = CASE 
            WHEN history IS NOT NULL AND history != '' 
            THEN jsonb_build_object('notes', history)
            ELSE '{}'::jsonb
        END
        WHERE medical_history = '{}'::jsonb OR medical_history IS NULL;
        
        -- حذف العمود القديم
        ALTER TABLE patients DROP COLUMN history;
        RAISE NOTICE '✅ تم حذف عمود history القديم بعد نقل البيانات';
    END IF;
    
    -- إضافة الأعمدة الأساسية المطلوبة
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS gravida INTEGER DEFAULT 0;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS para INTEGER DEFAULT 0;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS abortions INTEGER DEFAULT 0;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS living_children INTEGER DEFAULT 0;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS previous_ivf_attempts INTEGER DEFAULT 0;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'married';
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'female';
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Egypt';
    
    RAISE NOTICE '✅ تم إضافة الأعمدة الأساسية';
END $$;

-- 2️⃣ إصلاح جدول STIMULATION_LOGS - تغيير اسم date إلى log_date
DO $$ 
BEGIN
    RAISE NOTICE '🔧 جاري إصلاح جدول stimulation_logs...';
    
    -- تغيير date إلى log_date
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stimulation_logs' AND column_name = 'date') THEN
        ALTER TABLE stimulation_logs RENAME COLUMN date TO log_date;
        RAISE NOTICE '✅ تم تغيير date إلى log_date';
    END IF;
    
    -- تغيير cycle_day إلى day_number
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stimulation_logs' AND column_name = 'cycle_day') THEN
        ALTER TABLE stimulation_logs RENAME COLUMN cycle_day TO day_number;
        RAISE NOTICE '✅ تم تغيير cycle_day إلى day_number';
    END IF;
    
    -- إضافة log_date لو مش موجود خالص
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stimulation_logs' AND column_name = 'log_date') THEN
        ALTER TABLE stimulation_logs ADD COLUMN log_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ تم إضافة عمود log_date';
    END IF;
    
    -- إضافة day_number لو مش موجود
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stimulation_logs' AND column_name = 'day_number') THEN
        ALTER TABLE stimulation_logs ADD COLUMN day_number INTEGER DEFAULT 1;
        RAISE NOTICE '✅ تم إضافة عمود day_number';
    END IF;
END $$;

-- 3️⃣ التحقق من النتائج
SELECT 
    '✅ URGENT FIX COMPLETE!' AS status,
    'patients' AS table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'patients' AND column_name = 'medical_history')
        THEN '✅ medical_history موجود'
        ELSE '❌ medical_history ناقص'
    END AS medical_history_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'patients' AND column_name = 'history')
        THEN '⚠️ history لسه موجود (لازم يتحذف!)'
        ELSE '✅ history تم حذفه'
    END AS history_status

UNION ALL

SELECT 
    '✅ URGENT FIX COMPLETE!' AS status,
    'stimulation_logs' AS table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'stimulation_logs' AND column_name = 'log_date')
        THEN '✅ log_date موجود'
        ELSE '❌ log_date ناقص'
    END AS medical_history_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'stimulation_logs' AND column_name = 'date')
        THEN '⚠️ date لسه موجود (لازم يتغير!)'
        ELSE '✅ date تم تغييره'
    END AS history_status;

-- 4️⃣ عرض أعمدة جدول patients
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients'
  AND column_name IN ('medical_history', 'history', 'is_active', 'gender', 'gravida')
ORDER BY column_name;

-- ============================================================================
-- 🎯 بعد تشغيل هذا الملف:
-- ============================================================================
-- 1. ✅ جدول patients: medical_history موجود، history تم حذفه
-- 2. ✅ جدول stimulation_logs: log_date و day_number موجودين
-- 3. ✅ refresh المتصفح (Ctrl+Shift+R) عشان Supabase يحدث الـ schema cache
-- 4. ✅ جرب تسجيل مريضة جديدة - لازم يشتغل!
-- ============================================================================

SELECT '🎉 DONE! الرجاء refresh المتصفح بـ Ctrl+Shift+R' AS final_message;
