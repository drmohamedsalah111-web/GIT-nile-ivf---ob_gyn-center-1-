-- ============================================================================
-- FIX APPOINTMENT TIME COLUMN
-- إصلاح عمود وقت الموعد
-- ============================================================================
-- المشكلة: السكرتيرة تختار الوقت لكن لا يظهر في الجدول
-- الحل: التأكد من وجود العمود وأنه من النوع الصحيح
-- ============================================================================

-- 1. التأكد من وجود عمود appointment_time
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_time TEXT;

-- تحديث المواعيد القديمة فقط (اختياري - فقط إذا كانت كل المواعيد NULL)
-- UPDATE appointments 
-- SET appointment_time = '09:00'
-- WHERE appointment_time IS NULL AND appointment_date >= CURRENT_DATE;

-- 2. التحقق من الأعمدة الموجودة
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 3. عرض بعض المواعيد لاختبار البيانات
SELECT 
  id,
  patient_id,
  doctor_id,
  appointment_date,
  appointment_time,
  status,
  visit_type,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 10;

-- 4. التحقق من سياسات RLS للسكرتيرة
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
WHERE tablename = 'appointments'
ORDER BY policyname;
