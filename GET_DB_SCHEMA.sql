-- ============================================================================
-- 🕵️‍♂️ GET FULL DATABASE SCHEMA (استخراج هيكل قاعدة البيانات)
-- ============================================================================
-- Run this script to reveal the ACTUAL columns in your live database.
-- ============================================================================

SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN ('doctors', 'clinic_subscriptions', 'subscription_plans', 'users', 'profiles')
ORDER BY 
    table_name, ordinal_position;
