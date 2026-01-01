-- 🎯 نظام الاشتراكات الكامل للعيادات
-- Clinic Subscription Management System
-- Created: 2026-01-01

-- ============================================================================
-- 1️⃣ جدول الباقات (Subscription Plans)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    description_ar TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL, -- مدة الاشتراك بالأيام
    max_patients INTEGER, -- أقصى عدد للمريضات (NULL = غير محدود)
    max_users INTEGER DEFAULT 1, -- عدد المستخدمين المسموح بهم
    features JSONB, -- مميزات الباقة
    is_active BOOLEAN DEFAULT true,
    trial_days INTEGER DEFAULT 0, -- أيام التجربة المجانية
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2️⃣ جدول اشتراكات العيادات (Clinic Subscriptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, expired, cancelled
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_trial BOOLEAN DEFAULT false,
    payment_method VARCHAR(50), -- cash, card, bank_transfer, vodafone_cash, etc
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
    payment_reference VARCHAR(255),
    amount_paid DECIMAL(10,2),
    notes TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3️⃣ جدول سجل المدفوعات (Subscription Payments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES clinic_subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4️⃣ جدول استخدام الموارد (Clinic Usage Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinic_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- YYYY-MM
    patients_count INTEGER DEFAULT 0,
    visits_count INTEGER DEFAULT 0,
    storage_mb DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, month_year)
);

-- ============================================================================
-- 📊 Indexes للأداء
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_clinic_id ON clinic_subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_status ON clinic_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_dates ON clinic_subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_clinic_usage_clinic_month ON clinic_usage(clinic_id, month_year);

-- ============================================================================
-- 🔐 RLS Policies
-- ============================================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_usage ENABLE ROW LEVEL SECURITY;

-- حذف Policies القديمة إن وجدت
DROP POLICY IF EXISTS "anyone_view_active_plans" ON subscription_plans;
DROP POLICY IF EXISTS "doctors_view_own_subscriptions" ON clinic_subscriptions;
DROP POLICY IF EXISTS "doctors_insert_subscriptions" ON clinic_subscriptions;
DROP POLICY IF EXISTS "doctors_view_own_payments" ON subscription_payments;
DROP POLICY IF EXISTS "doctors_view_own_usage" ON clinic_usage;

-- الجميع يمكنهم رؤية الباقات المتاحة
CREATE POLICY "anyone_view_active_plans" ON subscription_plans
    FOR SELECT
    USING (is_active = true);

-- الدكتور يشوف اشتراكه فقط
CREATE POLICY "doctors_view_own_subscriptions" ON clinic_subscriptions
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- السماح بإنشاء اشتراكات جديدة (أثناء التسجيل)
CREATE POLICY "doctors_insert_subscriptions" ON clinic_subscriptions
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- الدكتور يشوف مدفوعاته فقط
CREATE POLICY "doctors_view_own_payments" ON subscription_payments
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM clinic_subscriptions 
            WHERE clinic_id IN (
                SELECT id FROM doctors WHERE user_id = auth.uid()
            )
        )
    );

-- الدكتور يشوف استخدامه فقط
CREATE POLICY "doctors_view_own_usage" ON clinic_usage
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- 📦 إدراج باقات افتراضية
-- ============================================================================
INSERT INTO subscription_plans (name, name_ar, description, description_ar, price, duration_days, max_patients, max_users, features, trial_days, sort_order)
VALUES
-- ✅ باقة تجريبية
('Trial', 'تجريبية', 
 '14-day free trial with full features', 
 'تجربة مجانية لمدة 14 يوم بجميع المميزات',
 0, 14, 50, 1, 
 '{
    "patients": 50, 
    "appointments": true, 
    "prescriptions": true, 
    "lab_tests": true, 
    "ultrasound": true, 
    "ivf": true, 
    "reports": true, 
    "support": "email",
    "storage_gb": 5
  }'::jsonb,
 14, 1),

-- 💼 باقة أساسية
('Basic', 'أساسية',
 'Perfect for small clinics', 
 'مثالية للعيادات الصغيرة',
 499, 30, 100, 1,
 '{
    "patients": 100, 
    "appointments": true, 
    "prescriptions": true, 
    "lab_tests": true, 
    "ultrasound": true, 
    "ivf": false, 
    "reports": "basic", 
    "support": "email",
    "storage_gb": 10
  }'::jsonb,
 7, 2),

-- 🚀 باقة احترافية
('Professional', 'احترافية',
 'For growing clinics with IVF services',
 'للعيادات المتوسطة مع خدمات الحقن المجهري',
 999, 30, 500, 3,
 '{
    "patients": 500, 
    "appointments": true, 
    "prescriptions": true, 
    "lab_tests": true, 
    "ultrasound": true, 
    "ivf": true, 
    "reports": "advanced", 
    "support": "priority",
    "storage_gb": 50,
    "multi_branch": true
  }'::jsonb,
 7, 3),

-- 🏆 باقة مؤسسية
('Enterprise', 'مؤسسية',
 'Unlimited patients and full features',
 'عدد مريضات غير محدود وجميع المميزات',
 1999, 30, NULL, 10,
 '{
    "patients": "unlimited", 
    "appointments": true, 
    "prescriptions": true, 
    "lab_tests": true, 
    "ultrasound": true, 
    "ivf": true, 
    "reports": "custom", 
    "support": "24/7",
    "storage_gb": "unlimited",
    "multi_branch": true,
    "api_access": true,
    "custom_branding": true,
    "dedicated_support": true
  }'::jsonb,
 14, 4)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- 🔧 Functions مساعدة
-- ============================================================================

-- Function: التحقق من صلاحية الاشتراك
CREATE OR REPLACE FUNCTION check_subscription_status(p_clinic_id UUID)
RETURNS TABLE(
    is_active BOOLEAN,
    plan_name VARCHAR,
    days_remaining INTEGER,
    is_trial BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.status = 'active' AND cs.end_date > NOW() AS is_active,
        sp.name_ar AS plan_name,
        EXTRACT(DAY FROM (cs.end_date - NOW()))::INTEGER AS days_remaining,
        cs.is_trial
    FROM clinic_subscriptions cs
    JOIN subscription_plans sp ON cs.plan_id = sp.id
    WHERE cs.clinic_id = p_clinic_id
        AND cs.status = 'active'
        AND cs.end_date > NOW()
    ORDER BY cs.end_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تحديث حالة الاشتراكات المنتهية
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE clinic_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
        AND end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: حساب عدد المريضات لعيادة
CREATE OR REPLACE FUNCTION get_clinic_patients_count(p_clinic_id UUID)
RETURNS INTEGER AS $$
DECLARE
    patients_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patients_count
    FROM patients
    WHERE doctor_id = p_clinic_id;
    
    RETURN COALESCE(patients_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 🔔 إشعارات تلقائية (Optional - يحتاج pg_cron extension)
-- ============================================================================

-- تشغيل Function لتحديث الاشتراكات المنتهية كل ساعة
-- يمكن استخدام pg_cron أو Edge Functions في Supabase
COMMENT ON FUNCTION update_expired_subscriptions() IS 'Run this function hourly via cron or Edge Function to update expired subscriptions';

-- ============================================================================
-- 📊 Views للتقارير
-- ============================================================================

-- View: اشتراكات نشطة
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    cs.id,
    cs.clinic_id,
    d.full_name as doctor_name,
    d.clinic_name,
    sp.name_ar as plan_name,
    cs.start_date,
    cs.end_date,
    EXTRACT(DAY FROM (cs.end_date - NOW()))::INTEGER as days_remaining,
    cs.is_trial,
    cs.amount_paid,
    cs.payment_status
FROM clinic_subscriptions cs
JOIN doctors d ON cs.clinic_id = d.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.status = 'active'
    AND cs.end_date > NOW()
ORDER BY cs.end_date ASC;

-- View: اشتراكات قريبة من الانتهاء
CREATE OR REPLACE VIEW expiring_soon_subscriptions AS
SELECT 
    cs.id,
    cs.clinic_id,
    d.full_name as doctor_name,
    d.email,
    d.phone,
    sp.name_ar as plan_name,
    cs.end_date,
    EXTRACT(DAY FROM (cs.end_date - NOW()))::INTEGER as days_remaining
FROM clinic_subscriptions cs
JOIN doctors d ON cs.clinic_id = d.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.status = 'active'
    AND cs.end_date > NOW()
    AND cs.end_date <= NOW() + INTERVAL '7 days'
ORDER BY cs.end_date ASC;

-- ============================================================================
-- ✅ تم إنشاء نظام الاشتراكات بنجاح
-- ============================================================================

-- للتحقق من البيانات:
SELECT 'Subscription Plans Created' as status, COUNT(*) as count FROM subscription_plans;
SELECT 'Active Subscriptions' as status, COUNT(*) as count FROM clinic_subscriptions WHERE status = 'active';

-- نهاية الملف
