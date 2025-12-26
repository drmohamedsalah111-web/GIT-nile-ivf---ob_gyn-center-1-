-- ============================================================================
-- 🔗 ربط السكرتيرة بطبيب - إصلاح سريع
-- ============================================================================
-- هذا السكريبت يربط السكرتيرة الحالية (laya/aya) بالطبيب
-- ============================================================================

-- ========================================
-- الخطوة 1: عرض قائمة الأطباء والسكرتيرات
-- ========================================

-- عرض جميع الأطباء
SELECT 
  '👨‍⚕️ قائمة الأطباء المتاحين' as section,
  id as doctor_id,
  name as doctor_name,
  email as doctor_email,
  user_role,
  created_at
FROM doctors
WHERE user_role = 'doctor'
ORDER BY created_at DESC;

-- عرض جميع السكرتيرات وحالة الربط
SELECT 
  '👩‍💼 قائمة السكرتيرات وحالة الربط' as section,
  d.id as secretary_id,
  d.name as secretary_name,
  d.email as secretary_email,
  d.user_role,
  d.secretary_doctor_id,
  doc.name as linked_doctor_name,
  CASE 
    WHEN d.secretary_doctor_id IS NOT NULL THEN '✅ مربوطة بطبيب: ' || doc.name
    ELSE '❌ غير مربوطة - يجب الربط فوراً!'
  END as link_status
FROM doctors d
LEFT JOIN doctors doc ON d.secretary_doctor_id = doc.id
WHERE d.user_role = 'secretary'
ORDER BY d.created_at DESC;

-- ========================================
-- الخطوة 2: ربط جميع السكرتيرات غير المربوطة بأول طبيب
-- ========================================

DO $$
DECLARE
  v_doctor_id UUID;
  v_updated_count INTEGER;
BEGIN
  -- الحصول على أول طبيب متاح
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE user_role = 'doctor'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'لا يوجد أطباء في النظام! يجب إنشاء حساب طبيب أولاً.';
  END IF;

  -- ربط جميع السكرتيرات غير المربوطة
  UPDATE doctors 
  SET secretary_doctor_id = v_doctor_id
  WHERE user_role = 'secretary' 
    AND secretary_doctor_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ تم ربط % سكرتيرة بالطبيب', v_updated_count;
  RAISE NOTICE '   الطبيب المختار: %', (SELECT name FROM doctors WHERE id = v_doctor_id);
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

-- ========================================
-- الخطوة 3: التحقق من النتائج
-- ========================================

SELECT 
  '✅ حالة الربط بعد التحديث' as section,
  d.id as secretary_id,
  d.name as secretary_name,
  d.email as secretary_email,
  d.secretary_doctor_id,
  doc.id as doctor_id,
  doc.name as doctor_name,
  doc.email as doctor_email,
  CASE 
    WHEN d.secretary_doctor_id IS NOT NULL THEN '✅ الربط تم بنجاح!'
    ELSE '❌ فشل الربط - يرجى المحاولة يدوياً'
  END as status
FROM doctors d
LEFT JOIN doctors doc ON d.secretary_doctor_id = doc.id
WHERE d.user_role = 'secretary'
ORDER BY d.name;

-- ========================================
-- الخطوة 4: ربط يدوي (إذا لزم الأمر)
-- ========================================

/*
-- إذا كنت تريد ربط سكرتيرة معينة بطبيب معين، استخدم هذا:
-- استبدل <doctor_id> و <secretary_email> بالقيم الصحيحة من الجداول أعلاه

UPDATE doctors 
SET secretary_doctor_id = '<doctor_id>'
WHERE user_role = 'secretary' 
  AND email = '<secretary_email>';

-- مثال:
-- UPDATE doctors 
-- SET secretary_doctor_id = 'a1b2c3d4-5678-90ab-cdef-1234567890ab'
-- WHERE email = 'laya@example.com';
*/

-- ========================================
-- ملخص التنفيذ
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📋 ملخص العملية';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ تم ربط جميع السكرتيرات بأطباء';
  RAISE NOTICE '';
  RAISE NOTICE '📝 الخطوات التالية:';
  RAISE NOTICE '   1. راجع نتائج "حالة الربط بعد التحديث" أعلاه';
  RAISE NOTICE '   2. تأكد أن كل سكرتيرة مربوطة بالطبيب الصحيح';
  RAISE NOTICE '   3. حدّث صفحة التطبيق (F5)';
  RAISE NOTICE '   4. سجل دخول كسكرتيرة وجرب حجز موعد';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 يجب أن يعمل حجز المواعيد الآن بشكل صحيح!';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;
