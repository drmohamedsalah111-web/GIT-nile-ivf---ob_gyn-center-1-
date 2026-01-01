-- 🔧 تحديث بسيط لنظام الاشتراكات الموجود
-- Adding Missing Fields Only - Safe Update
-- لن يؤثر على النظام الحالي

-- ============================================================================
-- 1️⃣ إضافة الحقول الناقصة لجدول subscription_plans (إن لم تكن موجودة)
-- ============================================================================

-- إضافة name_ar إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'name_ar'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN name_ar VARCHAR(100);
        UPDATE subscription_plans SET name_ar = COALESCE(display_name_ar, display_name_en, name) WHERE name_ar IS NULL;
    END IF;
END $$;

-- إضافة description_ar إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'description_ar'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN description_ar TEXT;
    END IF;
END $$;

-- إضافة duration_days إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN duration_days INTEGER DEFAULT 30;
        -- القيمة الافتراضية 30 يوم (شهري)
    END IF;
END $$;

-- إضافة trial_days إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'trial_days'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN trial_days INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- 2️⃣ إضافة الحقول الناقصة لجدول clinic_subscriptions
-- ============================================================================

-- إضافة is_trial إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_subscriptions' 
        AND column_name = 'is_trial'
    ) THEN
        ALTER TABLE clinic_subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT false;
    END IF;
END $$;

-- إضافة payment_status إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_subscriptions' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE clinic_subscriptions ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
        UPDATE clinic_subscriptions SET payment_status = 'paid' WHERE status = 'active';
    END IF;
END $$;

-- إضافة amount_paid إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_subscriptions' 
        AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE clinic_subscriptions ADD COLUMN amount_paid DECIMAL(10,2);
    END IF;
END $$;

-- إضافة cancelled_at إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_subscriptions' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE clinic_subscriptions ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- إضافة cancellation_reason إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_subscriptions' 
        AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE clinic_subscriptions ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;

-- ============================================================================
-- 3️⃣ إنشاء جدول subscription_payments (إذا لم يكن موجود)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES clinic_subscriptions(clinic_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(payment_status);

-- ============================================================================
-- 4️⃣ إنشاء جدول clinic_usage (إذا لم يكن موجود)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,
    patients_count INTEGER DEFAULT 0,
    visits_count INTEGER DEFAULT 0,
    storage_mb DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_clinic_usage_clinic_month ON clinic_usage(clinic_id, month_year);

-- ============================================================================
-- 5️⃣ إضافة RLS Policies للجداول الجديدة
-- ============================================================================

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_view_own_payments" ON subscription_payments;
DROP POLICY IF EXISTS "doctors_view_own_usage" ON clinic_usage;

CREATE POLICY "doctors_view_own_payments" ON subscription_payments
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT clinic_id FROM clinic_subscriptions 
            WHERE clinic_id IN (
                SELECT id FROM doctors WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "doctors_view_own_usage" ON clinic_usage
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- 6️⃣ تحديث البيانات الموجودة (إن وجدت)
-- ============================================================================

-- ملء name_ar من display_name_ar إذا كانت فارغة
UPDATE subscription_plans 
SET name_ar = COALESCE(display_name_ar, display_name_en, name)
WHERE name_ar IS NULL OR name_ar = '';

-- ملء description_ar من description_en إذا كانت فارغة
UPDATE subscription_plans 
SET description_ar = COALESCE(description_en, '')
WHERE description_ar IS NULL OR description_ar = '';

-- ============================================================================
-- ✅ تم التحديث بنجاح
-- ============================================================================

-- التحقق من البيانات
SELECT 
    'subscription_plans' as table_name,
    COUNT(*) as count,
    COUNT(name_ar) as has_name_ar,
    COUNT(duration_days) as has_duration
FROM subscription_plans;

SELECT 
    'clinic_subscriptions' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending
FROM clinic_subscriptions;

-- نهاية الملف
