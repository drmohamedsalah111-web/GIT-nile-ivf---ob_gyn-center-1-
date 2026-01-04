-- ============================================================================
-- 📅 نظام حساب وتتبع الأيام المتبقية في الاشتراك
-- SUBSCRIPTION DAYS REMAINING TRACKING SYSTEM
-- ============================================================================
-- التاريخ: 4 يناير 2026
-- الغرض: حساب الأيام المتبقية وتتبع حالة الاشتراكات بدقة
-- ============================================================================

-- ============================================================================
-- 1️⃣ دالة حساب الأيام المتبقية في الاشتراك
-- ============================================================================
-- هذه الدالة تحسب عدد الأيام المتبقية بدقة لأي اشتراك
-- ============================================================================

CREATE OR REPLACE FUNCTION get_days_remaining(
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  days_left INTEGER;
BEGIN
  -- حساب الفرق بين تاريخ الانتهاء واليوم الحالي
  days_left := p_end_date - CURRENT_DATE;
  
  -- إذا كان سالب، نرجع 0 (يعني منتهي)
  IF days_left < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN days_left;
END;
$$;

COMMENT ON FUNCTION get_days_remaining(DATE) IS 'حساب عدد الأيام المتبقية في الاشتراك';

-- ============================================================================
-- 1️⃣-ب نسخة للدالة تقبل TIMESTAMP (overload)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_days_remaining(
  p_end_date TIMESTAMP
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  days_left INTEGER;
BEGIN
  -- حساب الفرق بين تاريخ الانتهاء واليوم الحالي
  days_left := p_end_date::DATE - CURRENT_DATE;
  
  -- إذا كان سالب، نرجع 0 (يعني منتهي)
  IF days_left < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN days_left;
END;
$$;

COMMENT ON FUNCTION get_days_remaining(TIMESTAMP) IS 'حساب عدد الأيام المتبقية في الاشتراك (TIMESTAMP version)';

-- ============================================================================
-- 2️⃣ دالة حساب نسبة الاستهلاك من الاشتراك
-- ============================================================================
-- تحسب كم نسبة مر من الاشتراك (مفيدة للتقارير)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_subscription_usage_percentage(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_days INTEGER;
  days_passed INTEGER;
  usage_percentage DECIMAL(5,2);
BEGIN
  -- حساب إجمالي أيام الاشتراك
  total_days := p_end_date - p_start_date;
  
  -- إذا كان الاشتراك لم يبدأ بعد
  IF CURRENT_DATE < p_start_date THEN
    RETURN 0.00;
  END IF;
  
  -- إذا كان الاشتراك انتهى
  IF CURRENT_DATE > p_end_date THEN
    RETURN 100.00;
  END IF;
  
  -- حساب الأيام التي مرت
  days_passed := CURRENT_DATE - p_start_date;
  
  -- حساب النسبة
  IF total_days > 0 THEN
    usage_percentage := (days_passed::DECIMAL / total_days::DECIMAL) * 100;
  ELSE
    usage_percentage := 100.00;
  END IF;
  
  RETURN ROUND(usage_percentage, 2);
END;
$$;

COMMENT ON FUNCTION get_subscription_usage_percentage(DATE, DATE) IS 'حساب نسبة استهلاك مدة الاشتراك';

-- ============================================================================
-- 2️⃣-ب نسخة للدالة تقبل TIMESTAMP (overload)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_subscription_usage_percentage(
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_days INTEGER;
  days_passed INTEGER;
  usage_percentage DECIMAL(5,2);
BEGIN
  -- حساب إجمالي أيام الاشتراك
  total_days := p_end_date::DATE - p_start_date::DATE;
  
  -- إذا كان الاشتراك لم يبدأ بعد
  IF CURRENT_DATE < p_start_date::DATE THEN
    RETURN 0.00;
  END IF;
  
  -- إذا كان الاشتراك انتهى
  IF CURRENT_DATE > p_end_date::DATE THEN
    RETURN 100.00;
  END IF;
  
  -- حساب الأيام التي مرت
  days_passed := CURRENT_DATE - p_start_date::DATE;
  
  -- حساب النسبة
  IF total_days > 0 THEN
    usage_percentage := (days_passed::DECIMAL / total_days::DECIMAL) * 100;
  ELSE
    usage_percentage := 100.00;
  END IF;
  
  RETURN ROUND(usage_percentage, 2);
END;
$$;

COMMENT ON FUNCTION get_subscription_usage_percentage(TIMESTAMP, TIMESTAMP) IS 'حساب نسبة استهلاك مدة الاشتراك (TIMESTAMP version)';

-- ============================================================================
-- 3️⃣ View شامل لتتبع حالة الاشتراكات مع الأيام المتبقية
-- ============================================================================
-- هذا الـ View يعرض كل المعلومات المهمة لتتبع الاشتراكات
-- ============================================================================

CREATE OR REPLACE VIEW subscription_tracking_details AS
SELECT 
  cs.clinic_id,
  COALESCE(d.name, d.clinic_name, d.email) AS clinic_name,
  d.email AS clinic_email,
  d.phone AS clinic_phone,
  cs.plan_id,
  sp.name AS plan_name,
  sp.display_name_ar AS plan_name_ar,
  sp.display_name_en AS plan_name_en,
  cs.status,
  cs.start_date,
  cs.end_date,
  cs.trial_end_date,
  
  -- الأيام المتبقية
  get_days_remaining(cs.end_date) AS days_remaining,
  
  -- نسبة الاستهلاك
  get_subscription_usage_percentage(cs.start_date, cs.end_date) AS usage_percentage,
  
  -- إجمالي مدة الاشتراك
  (cs.end_date - cs.start_date) AS total_subscription_days,
  
  -- الأيام التي مرت
  CASE 
    WHEN CURRENT_DATE < cs.start_date THEN 0
    WHEN CURRENT_DATE > cs.end_date THEN (cs.end_date - cs.start_date)
    ELSE (CURRENT_DATE - cs.start_date)
  END AS days_elapsed,
  
  -- تصنيف حالة الانتهاء
  CASE
    WHEN cs.status = 'expired' THEN 'منتهي'
    WHEN cs.status = 'cancelled' THEN 'ملغي'
    WHEN cs.status = 'suspended' THEN 'موقوف'
    WHEN get_days_remaining(cs.end_date) = 0 THEN 'منتهي اليوم'
    WHEN get_days_remaining(cs.end_date) <= 3 THEN 'عاجل جداً'
    WHEN get_days_remaining(cs.end_date) <= 7 THEN 'عاجل'
    WHEN get_days_remaining(cs.end_date) <= 15 THEN 'تحذير'
    WHEN get_days_remaining(cs.end_date) <= 30 THEN 'انتبه'
    ELSE 'طبيعي'
  END AS expiry_status_ar,
  
  CASE
    WHEN cs.status = 'expired' THEN 'EXPIRED'
    WHEN cs.status = 'cancelled' THEN 'CANCELLED'
    WHEN cs.status = 'suspended' THEN 'SUSPENDED'
    WHEN get_days_remaining(cs.end_date) = 0 THEN 'EXPIRES_TODAY'
    WHEN get_days_remaining(cs.end_date) <= 3 THEN 'CRITICAL'
    WHEN get_days_remaining(cs.end_date) <= 7 THEN 'URGENT'
    WHEN get_days_remaining(cs.end_date) <= 15 THEN 'WARNING'
    WHEN get_days_remaining(cs.end_date) <= 30 THEN 'ATTENTION'
    ELSE 'NORMAL'
  END AS expiry_status_en,
  
  -- معلومات الدفع
  cs.payment_method,
  cs.payment_reference,
  cs.auto_renew,
  sp.monthly_price,
  sp.yearly_price,
  
  -- تواريخ مهمة
  cs.created_at,
  cs.updated_at
  
FROM clinic_subscriptions cs
JOIN doctors d ON cs.clinic_id = d.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
ORDER BY get_days_remaining(cs.end_date) ASC;

COMMENT ON VIEW subscription_tracking_details IS 'عرض شامل لتتبع حالة الاشتراكات مع حساب الأيام المتبقية';

-- ============================================================================
-- 4️⃣ View للاشتراكات النشطة القريبة من الانتهاء
-- ============================================================================
-- يعرض فقط الاشتراكات النشطة التي تنتهي خلال 30 يوم
-- ============================================================================

CREATE OR REPLACE VIEW active_subscriptions_expiring_soon AS
SELECT 
  *
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining <= 30
  AND days_remaining >= 0
ORDER BY days_remaining ASC;

COMMENT ON VIEW active_subscriptions_expiring_soon IS 'الاشتراكات النشطة التي تنتهي خلال 30 يوم';

-- ============================================================================
-- 5️⃣ View للاشتراكات التي تحتاج تدخل عاجل (≤ 7 أيام)
-- ============================================================================

CREATE OR REPLACE VIEW critical_expiring_subscriptions AS
SELECT 
  *
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining <= 7
  AND days_remaining >= 0
ORDER BY days_remaining ASC;

COMMENT ON VIEW critical_expiring_subscriptions IS 'الاشتراكات العاجلة التي تنتهي خلال 7 أيام أو أقل';

-- ============================================================================
-- 6️⃣ View للإحصائيات المفصلة حسب حالة الانتهاء
-- ============================================================================

CREATE OR REPLACE VIEW subscription_expiry_statistics AS
SELECT 
  expiry_status_en,
  expiry_status_ar,
  COUNT(*) AS subscription_count,
  ARRAY_AGG(clinic_name) AS clinic_names,
  AVG(days_remaining) AS avg_days_remaining,
  MIN(days_remaining) AS min_days_remaining,
  MAX(days_remaining) AS max_days_remaining
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
GROUP BY expiry_status_en, expiry_status_ar
ORDER BY 
  CASE expiry_status_en
    WHEN 'EXPIRES_TODAY' THEN 1
    WHEN 'CRITICAL' THEN 2
    WHEN 'URGENT' THEN 3
    WHEN 'WARNING' THEN 4
    WHEN 'ATTENTION' THEN 5
    WHEN 'NORMAL' THEN 6
    ELSE 7
  END;

COMMENT ON VIEW subscription_expiry_statistics IS 'إحصائيات مفصلة حسب حالة قرب انتهاء الاشتراكات';

-- ============================================================================
-- 7️⃣ دالة للحصول على ملخص الاشتراك لعيادة محددة
-- ============================================================================

CREATE OR REPLACE FUNCTION get_clinic_subscription_summary(
  p_clinic_id UUID
)
RETURNS TABLE (
  clinic_name TEXT,
  plan_name TEXT,
  status TEXT,
  days_remaining INTEGER,
  usage_percentage DECIMAL,
  start_date DATE,
  end_date DATE,
  expiry_status TEXT,
  auto_renew BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    std.clinic_name,
    std.plan_name_ar,
    std.status,
    std.days_remaining,
    std.usage_percentage,
    std.start_date,
    std.end_date,
    std.expiry_status_ar,
    std.auto_renew
  FROM subscription_tracking_details std
  WHERE std.clinic_id = p_clinic_id;
END;
$$;

COMMENT ON FUNCTION get_clinic_subscription_summary(UUID) IS 'الحصول على ملخص اشتراك عيادة محددة';

-- ============================================================================
-- 8️⃣ دالة للحصول على الاشتراكات حسب نطاق الأيام
-- ============================================================================

CREATE OR REPLACE FUNCTION get_subscriptions_by_days_range(
  p_min_days INTEGER DEFAULT 0,
  p_max_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  clinic_id UUID,
  clinic_name TEXT,
  clinic_email TEXT,
  plan_name TEXT,
  status TEXT,
  days_remaining INTEGER,
  end_date DATE,
  expiry_status TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    std.clinic_id,
    std.clinic_name,
    std.clinic_email,
    std.plan_name_ar::text,
    std.status::text,
    std.days_remaining,
    std.end_date,
    std.expiry_status_ar
  FROM subscription_tracking_details std
  WHERE std.status IN ('active', 'trial')
    AND std.days_remaining >= p_min_days
    AND std.days_remaining <= p_max_days
  ORDER BY std.days_remaining ASC;
END;
$$;

COMMENT ON FUNCTION get_subscriptions_by_days_range(INTEGER, INTEGER) IS 'الحصول على الاشتراكات ضمن نطاق أيام محدد';

-- ============================================================================
-- 9️⃣ Trigger لتحديث حالة الاشتراك تلقائياً عند انتهاء المدة
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تحديث حالة الاشتراكات المنتهية
  UPDATE clinic_subscriptions
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status IN ('active', 'trial')
    AND end_date < CURRENT_DATE;
    
  RAISE NOTICE 'تم تحديث حالة الاشتراكات المنتهية';
END;
$$;

COMMENT ON FUNCTION auto_expire_subscriptions() IS 'تحديث حالة الاشتراكات المنتهية تلقائياً';

-- ============================================================================
-- 🔟 إنشاء جدول لتسجيل التنبيهات المرسلة
-- ============================================================================
-- لتتبع التنبيهات التي تم إرسالها للعيادات عن قرب انتهاء الاشتراك
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_expiry_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('30_days', '15_days', '7_days', '3_days', '1_day', 'expired')),
  days_remaining INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_via TEXT CHECK (sent_via IN ('email', 'sms', 'whatsapp', 'in_app')),
  notification_status TEXT DEFAULT 'sent' CHECK (notification_status IN ('sent', 'delivered', 'failed')),
  message_content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_notifications_clinic ON subscription_expiry_notifications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_sent_at ON subscription_expiry_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_type ON subscription_expiry_notifications(notification_type);

COMMENT ON TABLE subscription_expiry_notifications IS 'سجل التنبيهات المرسلة للعيادات عن قرب انتهاء الاشتراك';

-- ============================================================================
-- 1️⃣1️⃣ دالة لتسجيل تنبيه جديد
-- ============================================================================

CREATE OR REPLACE FUNCTION log_expiry_notification(
  p_clinic_id UUID,
  p_notification_type TEXT,
  p_days_remaining INTEGER,
  p_sent_via TEXT DEFAULT 'in_app',
  p_message_content TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO subscription_expiry_notifications (
    clinic_id,
    notification_type,
    days_remaining,
    sent_via,
    message_content
  )
  VALUES (
    p_clinic_id,
    p_notification_type,
    p_days_remaining,
    p_sent_via,
    p_message_content
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

COMMENT ON FUNCTION log_expiry_notification IS 'تسجيل تنبيه جديد في قاعدة البيانات';

-- ============================================================================
-- ✅ استعلامات اختبار وتحقق
-- ============================================================================

-- 1. عرض جميع الاشتراكات مع الأيام المتبقية
SELECT 
  clinic_name,
  plan_name_ar,
  status,
  days_remaining,
  usage_percentage,
  expiry_status_ar
FROM subscription_tracking_details
ORDER BY days_remaining ASC
LIMIT 10;

-- 2. عرض الاشتراكات العاجلة (≤7 أيام)
SELECT * FROM critical_expiring_subscriptions;

-- 3. عرض الاشتراكات التي تنتهي خلال 30 يوم
SELECT * FROM active_subscriptions_expiring_soon;

-- 4. إحصائيات حالة الانتهاء
SELECT * FROM subscription_expiry_statistics;

-- 5. الحصول على ملخص لعيادة محددة
-- SELECT * FROM get_clinic_subscription_summary('clinic_id_here');

-- 6. الحصول على الاشتراكات التي تنتهي خلال 1-7 أيام
SELECT * FROM get_subscriptions_by_days_range(1, 7);

-- 7. تحديث الاشتراكات المنتهية تلقائياً
SELECT auto_expire_subscriptions();

-- ============================================================================
-- 📊 استعلامات تقارير مفيدة
-- ============================================================================

-- التقرير 1: عدد الاشتراكات حسب حالة الانتهاء
SELECT 
  expiry_status_ar AS "حالة الانتهاء",
  COUNT(*) AS "عدد الاشتراكات"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
GROUP BY expiry_status_ar
ORDER BY COUNT(*) DESC;

-- التقرير 2: العيادات التي لديها أقل من 7 أيام
SELECT 
  clinic_name AS "اسم العيادة",
  clinic_email AS "البريد الإلكتروني",
  clinic_phone AS "رقم الهاتف",
  plan_name_ar AS "الباقة",
  days_remaining AS "الأيام المتبقية",
  end_date AS "تاريخ الانتهاء"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
  AND days_remaining <= 7
  AND days_remaining >= 0
ORDER BY days_remaining ASC;

-- التقرير 3: متوسط الأيام المتبقية لكل باقة
SELECT 
  plan_name_ar AS "الباقة",
  COUNT(*) AS "عدد الاشتراكات",
  ROUND(AVG(days_remaining), 0) AS "متوسط الأيام المتبقية",
  MIN(days_remaining) AS "أقل عدد أيام",
  MAX(days_remaining) AS "أكثر عدد أيام"
FROM subscription_tracking_details
WHERE status IN ('active', 'trial')
GROUP BY plan_name_ar
ORDER BY "عدد الاشتراكات" DESC;

-- ============================================================================
-- ✅ النظام جاهز! 
-- ============================================================================
-- الآن لديك:
-- ✅ دوال لحساب الأيام المتبقية والنسب
-- ✅ Views شاملة لتتبع الاشتراكات
-- ✅ تصنيف حالة الانتهاء (عاجل، تحذير، طبيعي، إلخ)
-- ✅ جدول لتسجيل التنبيهات المرسلة
-- ✅ دالة للتحديث التلقائي للاشتراكات المنتهية
-- ✅ تقارير جاهزة للاستخدام
-- ============================================================================
