-- ============================================================================
-- 📊 استعلامات سريعة لتتبع الأيام المتبقية في الاشتراكات
-- QUICK QUERIES FOR SUBSCRIPTION TRACKING
-- ============================================================================
-- احفظ هذه الاستعلامات كـ Bookmarks في Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 🔍 استعلامات البحث السريع
-- ============================================================================

-- 1️⃣ الاشتراكات العاجلة (≤ 7 أيام)
SELECT 
  clinic_name AS "العيادة",
  clinic_email AS "البريد",
  clinic_phone AS "الهاتف",
  plan_name_ar AS "الباقة",
  days_remaining AS "الأيام المتبقية",
  end_date AS "تاريخ الانتهاء"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining <= 7
  AND days_remaining >= 0
ORDER BY days_remaining ASC;

-- 2️⃣ الاشتراكات التي تنتهي اليوم
SELECT 
  clinic_name,
  clinic_email,
  clinic_phone,
  plan_name_ar,
  end_date
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining = 0;

-- 3️⃣ الاشتراكات التي تنتهي خلال 30 يوم
SELECT * FROM active_subscriptions_expiring_soon;

-- 4️⃣ إحصائيات سريعة
SELECT * FROM subscription_expiry_statistics;

-- ============================================================================
-- 📈 تقارير الإدارة
-- ============================================================================

-- 5️⃣ ملخص اليوم
SELECT 
  COUNT(*) FILTER (WHERE days_remaining = 0) AS "ينتهي_اليوم",
  COUNT(*) FILTER (WHERE days_remaining <= 3) AS "عاجل_جداً",
  COUNT(*) FILTER (WHERE days_remaining <= 7) AS "عاجل",
  COUNT(*) FILTER (WHERE days_remaining <= 15) AS "تحذير",
  COUNT(*) FILTER (WHERE days_remaining <= 30) AS "انتبه",
  COUNT(*) AS "الإجمالي"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial');

-- 6️⃣ الاشتراكات حسب الباقة
SELECT 
  plan_name_ar AS "الباقة",
  COUNT(*) AS "العدد",
  ROUND(AVG(days_remaining), 0) AS "متوسط_الأيام",
  MIN(days_remaining) AS "أقل_عدد",
  MAX(days_remaining) AS "أكبر_عدد"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
GROUP BY plan_name_ar
ORDER BY "العدد" DESC;

-- 7️⃣ الاشتراكات حسب نسبة الاستهلاك
SELECT 
  clinic_name AS "العيادة",
  plan_name_ar AS "الباقة",
  ROUND(usage_percentage, 1) AS "الاستهلاك%",
  days_remaining AS "الأيام_المتبقية"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND usage_percentage >= 80
ORDER BY usage_percentage DESC;

-- ============================================================================
-- 🔔 استعلامات التنبيهات
-- ============================================================================

-- 8️⃣ العيادات التي تحتاج تنبيه اليوم (3 أيام متبقية)
SELECT 
  clinic_id,
  clinic_name,
  clinic_email,
  clinic_phone,
  days_remaining,
  end_date
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining = 3;

-- 9️⃣ العيادات التي تحتاج تنبيه أسبوعي (7 أيام متبقية)
SELECT 
  clinic_id,
  clinic_name,
  clinic_email,
  days_remaining,
  end_date
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining = 7;

-- 🔟 العيادات بدون تجديد تلقائي والمقرب انتهاؤها
SELECT 
  clinic_name AS "العيادة",
  clinic_email AS "البريد",
  clinic_phone AS "الهاتف",
  days_remaining AS "الأيام_المتبقية",
  end_date AS "تاريخ_الانتهاء",
  expiry_status_ar AS "الحالة"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND auto_renew = false
  AND days_remaining <= 15
ORDER BY days_remaining ASC;

-- ============================================================================
-- 📊 تقارير متقدمة
-- ============================================================================

-- 1️⃣1️⃣ توزيع الاشتراكات حسب الأسابيع
SELECT 
  CASE 
    WHEN days_remaining <= 7 THEN '1️⃣ الأسبوع القادم'
    WHEN days_remaining <= 14 THEN '2️⃣ أسبوعين'
    WHEN days_remaining <= 21 THEN '3️⃣ ثلاثة أسابيع'
    WHEN days_remaining <= 30 THEN '4️⃣ شهر'
    ELSE '5️⃣ أكثر من شهر'
  END AS "الفترة",
  COUNT(*) AS "العدد",
  ROUND(AVG(days_remaining), 0) AS "المتوسط"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining >= 0
GROUP BY 
  CASE 
    WHEN days_remaining <= 7 THEN '1️⃣ الأسبوع القادم'
    WHEN days_remaining <= 14 THEN '2️⃣ أسبوعين'
    WHEN days_remaining <= 21 THEN '3️⃣ ثلاثة أسابيع'
    WHEN days_remaining <= 30 THEN '4️⃣ شهر'
    ELSE '5️⃣ أكثر من شهر'
  END
ORDER BY MIN(days_remaining);

-- 1️⃣2️⃣ الاشتراكات التي ستنتهي في شهر محدد
SELECT 
  clinic_name AS "العيادة",
  plan_name_ar AS "الباقة",
  end_date AS "تاريخ_الانتهاء",
  days_remaining AS "الأيام_المتبقية"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND EXTRACT(YEAR FROM end_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM end_date) = EXTRACT(MONTH FROM CURRENT_DATE) + 1
ORDER BY end_date ASC;

-- 1️⃣3️⃣ مقارنة التجديد التلقائي
SELECT 
  CASE 
    WHEN auto_renew THEN '✅ مفعّل'
    ELSE '❌ غير مفعّل'
  END AS "التجديد_التلقائي",
  COUNT(*) AS "العدد",
  ROUND(AVG(days_remaining), 0) AS "متوسط_الأيام"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
GROUP BY auto_renew;

-- ============================================================================
-- 🔧 استعلامات الصيانة
-- ============================================================================

-- 1️⃣4️⃣ تحديث الاشتراكات المنتهية (يدوياً)
SELECT auto_expire_subscriptions();

-- 1️⃣5️⃣ التحقق من الاتساق
SELECT 
  'clinic_subscriptions' AS "الجدول",
  COUNT(*) AS "إجمالي_السجلات",
  COUNT(*) FILTER (WHERE status = 'active') AS "نشط",
  COUNT(*) FILTER (WHERE status = 'trial') AS "تجريبي",
  COUNT(*) FILTER (WHERE status = 'expired') AS "منتهي",
  COUNT(*) FILTER (WHERE status = 'suspended') AS "موقوف"
FROM clinic_subscriptions;

-- 1️⃣6️⃣ البحث عن اشتراكات بمشاكل
SELECT 
  clinic_id,
  clinic_name,
  start_date,
  end_date,
  status
FROM subscription_tracking_details
WHERE 
  -- تاريخ البداية بعد تاريخ النهاية
  start_date > end_date
  OR
  -- اشتراك نشط ولكن منتهي
  (status IN ('active', 'trial') AND end_date < CURRENT_DATE);

-- ============================================================================
-- 📋 استعلامات لعيادة محددة
-- ============================================================================

-- 1️⃣7️⃣ الحصول على clinic_id من الاشتراكات الموجودة
SELECT DISTINCT 
  clinic_id,
  clinic_name,
  clinic_email
FROM subscription_tracking_details
LIMIT 10;

-- 1️⃣7️⃣-ب معلومات شاملة لعيادة (استخدم clinic_id من الاستعلام السابق)
-- SELECT * FROM get_clinic_subscription_summary('اضع-هنا-clinic-id-من-الاستعلام-السابق');

-- 1️⃣8️⃣ تفاصيل كاملة لعيادة (غيّر اسم العيادة)
SELECT * FROM subscription_tracking_details
WHERE clinic_name LIKE '%اسم العيادة%';

-- ============================================================================
-- 📤 استعلامات للتصدير
-- ============================================================================

-- 1️⃣9️⃣ تقرير شامل للتصدير
SELECT 
  clinic_name AS "اسم العيادة",
  clinic_email AS "البريد الإلكتروني",
  clinic_phone AS "رقم الهاتف",
  plan_name_ar AS "الباقة",
  status AS "حالة الاشتراك",
  start_date AS "تاريخ البداية",
  end_date AS "تاريخ الانتهاء",
  days_remaining AS "الأيام المتبقية",
  usage_percentage AS "نسبة الاستهلاك",
  expiry_status_ar AS "حالة الانتهاء",
  CASE WHEN auto_renew THEN 'نعم' ELSE 'لا' END AS "تجديد تلقائي",
  monthly_price AS "السعر الشهري"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
ORDER BY days_remaining ASC;

-- 2️⃣0️⃣ تقرير مبسط للطباعة
SELECT 
  ROW_NUMBER() OVER (ORDER BY days_remaining) AS "#",
  clinic_name AS "العيادة",
  days_remaining AS "الأيام",
  end_date AS "الانتهاء",
  expiry_status_ar AS "الحالة"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining <= 30
ORDER BY days_remaining ASC;

-- ============================================================================
-- 🎯 استعلامات مخصصة
-- ============================================================================

-- 2️⃣1️⃣ الاشتراكات في نطاق أيام محدد (1-7 أيام)
SELECT * FROM get_subscriptions_by_days_range(1, 7);

-- 2️⃣2️⃣ الاشتراكات في نطاق أيام محدد (8-15 يوم)
SELECT * FROM get_subscriptions_by_days_range(8, 15);

-- 2️⃣3️⃣ الاشتراكات في نطاق أيام محدد (16-30 يوم)
SELECT * FROM get_subscriptions_by_days_range(16, 30);

-- ============================================================================
-- 📈 استعلامات Dashboard
-- ============================================================================

-- 2️⃣4️⃣ بيانات للـ Dashboard الرئيسي
SELECT 
  (SELECT COUNT(*) FROM subscription_tracking_details WHERE status IN ('active', 'trial')) AS total_active,
  (SELECT COUNT(*) FROM critical_expiring_subscriptions) AS critical_count,
  (SELECT COUNT(*) FROM active_subscriptions_expiring_soon) AS expiring_soon_count,
  (SELECT ROUND(AVG(days_remaining), 0) FROM subscription_tracking_details WHERE status IN ('active', 'trial')) AS avg_days_remaining;

-- 2️⃣5️⃣ بيانات للرسوم البيانية
SELECT 
  expiry_status_ar AS status,
  subscription_count AS count
FROM subscription_expiry_statistics
ORDER BY 
  CASE expiry_status_en
    WHEN 'EXPIRES_TODAY' THEN 1
    WHEN 'CRITICAL' THEN 2
    WHEN 'URGENT' THEN 3
    WHEN 'WARNING' THEN 4
    WHEN 'ATTENTION' THEN 5
    WHEN 'NORMAL' THEN 6
  END;

-- ============================================================================
-- ✅ اختبارات سريعة
-- ============================================================================

-- 2️⃣6️⃣ اختبار دالة حساب الأيام
SELECT 
  get_days_remaining(CURRENT_DATE + INTERVAL '10 days') AS test_10_days,
  get_days_remaining(CURRENT_DATE + INTERVAL '1 day') AS test_1_day,
  get_days_remaining(CURRENT_DATE) AS test_today,
  get_days_remaining(CURRENT_DATE - INTERVAL '1 day') AS test_expired;

-- 2️⃣7️⃣ اختبار دالة نسبة الاستهلاك
SELECT 
  get_subscription_usage_percentage(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE + INTERVAL '90 days'
  ) AS should_be_50_percent;

-- 2️⃣8️⃣ عدد السجلات في كل View
SELECT 
  'subscription_tracking_details' AS view_name,
  COUNT(*) AS record_count
FROM subscription_tracking_details
UNION ALL
SELECT 
  'active_subscriptions_expiring_soon',
  COUNT(*)
FROM active_subscriptions_expiring_soon
UNION ALL
SELECT 
  'critical_expiring_subscriptions',
  COUNT(*)
FROM critical_expiring_subscriptions
UNION ALL
SELECT 
  'subscription_expiry_statistics',
  COUNT(*)
FROM subscription_expiry_statistics;

-- ============================================================================
-- 💾 النسخ الاحتياطي والأرشفة
-- ============================================================================

-- 2️⃣9️⃣ نسخة احتياطية من سجل التنبيهات
CREATE TABLE IF NOT EXISTS subscription_expiry_notifications_backup AS
SELECT * FROM subscription_expiry_notifications;

-- 3️⃣0️⃣ أرشفة التنبيهات القديمة (أقدم من 6 أشهر)
-- تحذير: هذا سيحذف البيانات!
-- DELETE FROM subscription_expiry_notifications
-- WHERE sent_at < NOW() - INTERVAL '6 months';

-- ============================================================================
-- 📌 ملاحظات الاستخدام
-- ============================================================================

/*
💡 نصائح:

1. احفظ الاستعلامات الأكثر استخداماً كـ Saved Queries في Supabase
2. استخدم Ctrl+Enter لتنفيذ الاستعلام المحدد فقط
3. للبحث السريع، اضغط Ctrl+F في هذا الملف
4. عدّل قيمة clinic_id أو clinic_name حسب حاجتك
5. استخدم LIMIT للاستعلامات الكبيرة

⚡ أداء:
- جميع الـ Views مفهرسة تلقائياً
- الدوال مُحسّنة للأداء
- استخدم WHERE بحكمة للاستعلامات الضخمة

🔔 تنبيهات:
- شغّل auto_expire_subscriptions() يومياً
- راجع critical_expiring_subscriptions أسبوعياً
- صدّر نسخة احتياطية شهرياً
*/

-- ============================================================================
-- ✅ تم بنجاح!
-- ============================================================================
