-- ============================================================================
-- 🔄 استرجاع البيانات الضائعة - Data Recovery Script
-- ============================================================================
-- استخدم هذا السكريبت لاسترجاع البيانات التي تم حذفها أو تعديلها بالخطأ
-- ============================================================================

-- ========================================
-- الخطوة 1: التحقق من وجود Audit Log
-- ========================================
SELECT 
    '📋 عرض جدول Audit Log' as title,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT table_name) as affected_tables,
    MIN(timestamp) as first_operation,
    MAX(timestamp) as last_operation
FROM audit_log;

-- ========================================
-- الخطوة 2: عرض آخر 50 عملية
-- ========================================
SELECT 
    '🕒 آخر 50 عملية' as title,
    al.timestamp,
    al.user_role,
    d.name as user_name,
    d.email as user_email,
    al.table_name,
    al.operation,
    al.record_id
FROM audit_log al
LEFT JOIN doctors d ON al.user_id = d.user_id
ORDER BY al.timestamp DESC
LIMIT 50;

-- ========================================
-- الخطوة 3: عرض عمليات السكرتيرة فقط
-- ========================================
SELECT 
    '👩‍💼 عمليات السكرتيرة' as title,
    al.timestamp,
    d.name as secretary_name,
    d.email as secretary_email,
    al.table_name,
    al.operation,
    al.record_id,
    CASE 
        WHEN al.operation = 'DELETE' THEN al.old_data::text
        WHEN al.operation = 'INSERT' THEN al.new_data::text
        WHEN al.operation = 'UPDATE' THEN 
            jsonb_build_object(
                'old', al.old_data,
                'new', al.new_data
            )::text
    END as data_preview
FROM audit_log al
LEFT JOIN doctors d ON al.user_id = d.user_id
WHERE al.user_role = 'secretary'
ORDER BY al.timestamp DESC;

-- ========================================
-- الخطوة 4: عرض عمليات الحذف فقط
-- ========================================
SELECT 
    '🗑️ عمليات الحذف' as title,
    al.timestamp,
    d.name as user_name,
    d.email as user_email,
    al.user_role,
    al.table_name,
    al.record_id,
    al.old_data
FROM audit_log al
LEFT JOIN doctors d ON al.user_id = d.user_id
WHERE al.operation = 'DELETE'
ORDER BY al.timestamp DESC;

-- ========================================
-- الخطوة 5: استرجاع مريض محذوف
-- ========================================
-- استبدل 'RECORD_ID_HERE' بـ ID المريض المحذوف

/*
-- مثال:
DO $$
DECLARE
  recovered_data JSONB;
  patient_id UUID := 'RECORD_ID_HERE'; -- ضع ID المريض هنا
BEGIN
  -- استرجاع البيانات
  SELECT recover_data_from_audit(patient_id, 'patients') INTO recovered_data;
  
  IF recovered_data IS NOT NULL THEN
    -- إعادة إدراج المريض
    INSERT INTO patients (
      id,
      doctor_id,
      name,
      age,
      phone,
      husband_name,
      medical_history,
      created_at,
      updated_at
    )
    SELECT 
      (recovered_data->>'id')::UUID,
      (recovered_data->>'doctor_id')::UUID,
      recovered_data->>'name',
      (recovered_data->>'age')::INTEGER,
      recovered_data->>'phone',
      recovered_data->>'husband_name',
      (recovered_data->>'medical_history')::JSONB,
      (recovered_data->>'created_at')::TIMESTAMPTZ,
      NOW() -- updated_at
    WHERE NOT EXISTS (
      SELECT 1 FROM patients WHERE id = (recovered_data->>'id')::UUID
    );
    
    RAISE NOTICE '✅ تم استرجاع المريض بنجاح!';
  ELSE
    RAISE NOTICE '❌ لم يتم العثور على بيانات المريض';
  END IF;
END $$;
*/

-- ========================================
-- الخطوة 6: استرجاع موعد محذوف
-- ========================================
/*
-- مثال:
DO $$
DECLARE
  recovered_data JSONB;
  appointment_id UUID := 'RECORD_ID_HERE'; -- ضع ID الموعد هنا
BEGIN
  SELECT recover_data_from_audit(appointment_id, 'appointments') INTO recovered_data;
  
  IF recovered_data IS NOT NULL THEN
    INSERT INTO appointments (
      id,
      doctor_id,
      patient_id,
      appointment_date,
      status,
      visit_type,
      notes,
      created_at,
      updated_at
    )
    SELECT 
      (recovered_data->>'id')::UUID,
      (recovered_data->>'doctor_id')::UUID,
      (recovered_data->>'patient_id')::UUID,
      (recovered_data->>'appointment_date')::TIMESTAMPTZ,
      recovered_data->>'status',
      recovered_data->>'visit_type',
      recovered_data->>'notes',
      (recovered_data->>'created_at')::TIMESTAMPTZ,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM appointments WHERE id = (recovered_data->>'id')::UUID
    );
    
    RAISE NOTICE '✅ تم استرجاع الموعد بنجاح!';
  ELSE
    RAISE NOTICE '❌ لم يتم العثور على بيانات الموعد';
  END IF;
END $$;
*/

-- ========================================
-- الخطوة 7: استرجاع فاتورة محذوفة
-- ========================================
/*
-- مثال:
DO $$
DECLARE
  recovered_data JSONB;
  invoice_id UUID := 'RECORD_ID_HERE'; -- ضع ID الفاتورة هنا
BEGIN
  SELECT recover_data_from_audit(invoice_id, 'invoices') INTO recovered_data;
  
  IF recovered_data IS NOT NULL THEN
    INSERT INTO invoices (
      id,
      clinic_id,
      patient_id,
      invoice_number,
      invoice_type,
      total_amount,
      payment_method,
      payment_reference,
      status,
      created_by,
      created_at,
      updated_at
    )
    SELECT 
      (recovered_data->>'id')::UUID,
      (recovered_data->>'clinic_id')::UUID,
      (recovered_data->>'patient_id')::UUID,
      recovered_data->>'invoice_number',
      recovered_data->>'invoice_type',
      (recovered_data->>'total_amount')::DECIMAL,
      recovered_data->>'payment_method',
      recovered_data->>'payment_reference',
      recovered_data->>'status',
      (recovered_data->>'created_by')::UUID,
      (recovered_data->>'created_at')::TIMESTAMPTZ,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM invoices WHERE id = (recovered_data->>'id')::UUID
    );
    
    RAISE NOTICE '✅ تم استرجاع الفاتورة بنجاح!';
  ELSE
    RAISE NOTICE '❌ لم يتم العثور على بيانات الفاتورة';
  END IF;
END $$;
*/

-- ========================================
-- الخطوة 8: استرجاع جماعي لجميع المرضى المحذوفين اليوم
-- ========================================
/*
DO $$
DECLARE
  rec RECORD;
  recovered_count INTEGER := 0;
BEGIN
  FOR rec IN 
    SELECT DISTINCT record_id, old_data
    FROM audit_log
    WHERE operation = 'DELETE'
      AND table_name = 'patients'
      AND timestamp >= CURRENT_DATE
  LOOP
    BEGIN
      INSERT INTO patients (
        id,
        doctor_id,
        name,
        age,
        phone,
        husband_name,
        medical_history,
        created_at,
        updated_at
      )
      SELECT 
        (rec.old_data->>'id')::UUID,
        (rec.old_data->>'doctor_id')::UUID,
        rec.old_data->>'name',
        (rec.old_data->>'age')::INTEGER,
        rec.old_data->>'phone',
        rec.old_data->>'husband_name',
        (rec.old_data->>'medical_history')::JSONB,
        (rec.old_data->>'created_at')::TIMESTAMPTZ,
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM patients WHERE id = (rec.old_data->>'id')::UUID
      );
      
      recovered_count := recovered_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'فشل استرجاع مريض: %', rec.record_id;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ تم استرجاع % مريض', recovered_count;
END $$;
*/

-- ========================================
-- الخطوة 9: بحث عن تعديلات معينة
-- ========================================
-- ابحث عن تعديلات على مريض معين
/*
SELECT 
    al.timestamp,
    d.name as user_name,
    al.operation,
    al.old_data->>'name' as old_name,
    al.new_data->>'name' as new_name,
    al.old_data->>'phone' as old_phone,
    al.new_data->>'phone' as new_phone
FROM audit_log al
LEFT JOIN doctors d ON al.user_id = d.user_id
WHERE al.table_name = 'patients'
  AND al.record_id = 'PATIENT_ID_HERE'
ORDER BY al.timestamp DESC;
*/

-- ========================================
-- الخطوة 10: تقرير شامل عن نشاط السكرتيرة
-- ========================================
SELECT 
    '📊 تقرير نشاط السكرتيرة' as title,
    d.name as secretary_name,
    d.email as secretary_email,
    al.table_name,
    al.operation,
    COUNT(*) as operation_count,
    MIN(al.timestamp) as first_operation,
    MAX(al.timestamp) as last_operation
FROM audit_log al
LEFT JOIN doctors d ON al.user_id = d.user_id
WHERE al.user_role = 'secretary'
GROUP BY d.name, d.email, al.table_name, al.operation
ORDER BY d.name, al.table_name, al.operation;

-- ========================================
-- الخطوة 11: مقارنة البيانات قبل وبعد التعديل
-- ========================================
/*
WITH changes AS (
  SELECT 
    timestamp,
    record_id,
    jsonb_each(old_data) as old,
    jsonb_each(new_data) as new
  FROM audit_log
  WHERE operation = 'UPDATE'
    AND table_name = 'patients'
    AND record_id = 'PATIENT_ID_HERE'
  ORDER BY timestamp DESC
  LIMIT 1
)
SELECT 
  'التعديلات على المريض' as title,
  (old).key as field_name,
  (old).value as old_value,
  (new).value as new_value
FROM changes
WHERE (old).key = (new).key
  AND (old).value IS DISTINCT FROM (new).value;
*/

-- ========================================
-- الخطوة 12: حذف سجلات Audit قديمة (اختياري)
-- ========================================
-- احذف السجلات الأقدم من 3 أشهر
/*
DELETE FROM audit_log
WHERE timestamp < NOW() - INTERVAL '3 months';
*/

-- ========================================
-- معلومات مهمة
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📋 دليل استرجاع البيانات';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ شاهد آخر العمليات في audit_log';
  RAISE NOTICE '2️⃣ ابحث عن العملية المشبوهة';
  RAISE NOTICE '3️⃣ استخدم recover_data_from_audit() للاسترجاع';
  RAISE NOTICE '4️⃣ أعد إدراج البيانات المحذوفة';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ تنبيه: استرجاع البيانات يتطلب صلاحيات طبيب';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
