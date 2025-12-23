-- ============================================================================
-- 🔍 فحص الأعمدة في جدول PATIENTS
-- ============================================================================
-- استخدم هذا الاستعلام للتأكد من وجود جميع الأعمدة المطلوبة
-- ============================================================================

-- عرض جميع الأعمدة الموجودة في جدول patients
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- التحقق من الأعمدة الأساسية المطلوبة
-- ============================================================================

SELECT 
    'medical_history' AS required_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
              AND column_name = 'medical_history'
              AND data_type = 'jsonb'
        ) THEN '✅ موجود'
        ELSE '❌ ناقص - يجب تشغيل MIGRATION_UPDATE_ALL.sql'
    END AS status
    
UNION ALL

SELECT 
    'is_active' AS required_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
              AND column_name = 'is_active'
        ) THEN '✅ موجود'
        ELSE '❌ ناقص - يجب تشغيل MIGRATION_UPDATE_ALL.sql'
    END AS status

UNION ALL

SELECT 
    'gravida' AS required_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
              AND column_name = 'gravida'
        ) THEN '✅ موجود'
        ELSE '❌ ناقص - يجب تشغيل MIGRATION_UPDATE_ALL.sql'
    END AS status

UNION ALL

SELECT 
    'marital_status' AS required_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
              AND column_name = 'marital_status'
        ) THEN '✅ موجود'
        ELSE '❌ ناقص - يجب تشغيل MIGRATION_UPDATE_ALL.sql'
    END AS status

UNION ALL

SELECT 
    'gender' AS required_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
              AND column_name = 'gender'
        ) THEN '✅ موجود'
        ELSE '❌ ناقص - يجب تشغيل MIGRATION_UPDATE_ALL.sql'
    END AS status;

-- ============================================================================
-- 📊 ملخص
-- ============================================================================

SELECT 
    '🔍 فحص قاعدة البيانات' AS title,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patients') AS total_columns_in_patients,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patients') >= 30 
        THEN '✅ الأعمدة مكتملة تقريباً'
        ELSE '⚠️ ناقص أعمدة - شغل MIGRATION_UPDATE_ALL.sql'
    END AS recommendation;
