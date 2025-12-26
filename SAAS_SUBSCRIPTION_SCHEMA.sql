-- ============================================================================
-- 💼 SaaS SUBSCRIPTION & LICENSING SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Phase 1: Database Infrastructure for Subscription Management
-- Author: Senior Full-Stack Architect
-- Date: December 26, 2025
-- ============================================================================

-- ========================================
-- STEP 1: CREATE SUBSCRIPTION PLANS TABLE
-- ========================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.subscription_history CASCADE;
DROP TABLE IF EXISTS public.clinic_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price_yearly DECIMAL(10, 2) NOT NULL,
    price_monthly DECIMAL(10, 2),
    max_users INTEGER NOT NULL DEFAULT 1,
    max_patients INTEGER,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_subscription_plans_name ON public.subscription_plans(name);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Add table comments
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for clinics';
COMMENT ON COLUMN public.subscription_plans.name IS 'Internal plan identifier (basic, pro, enterprise)';
COMMENT ON COLUMN public.subscription_plans.display_name IS 'User-facing plan name';
COMMENT ON COLUMN public.subscription_plans.features IS 'Array of feature strings in JSON format';
COMMENT ON COLUMN public.subscription_plans.max_users IS 'Maximum number of users (doctors/secretaries) allowed';
COMMENT ON COLUMN public.subscription_plans.max_patients IS 'Maximum number of patients (NULL = unlimited)';

-- ========================================
-- STEP 2: CREATE CLINIC SUBSCRIPTIONS TABLE
-- ========================================

-- Create clinic subscriptions table
CREATE TABLE public.clinic_subscriptions (
    clinic_id UUID PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'trial', 'cancelled')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    trial_end_date DATE,
    payment_reference TEXT,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'whatsapp', 'cash', 'other')),
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX idx_clinic_subscriptions_plan ON public.clinic_subscriptions(plan_id);
CREATE INDEX idx_clinic_subscriptions_status ON public.clinic_subscriptions(status);
CREATE INDEX idx_clinic_subscriptions_end_date ON public.clinic_subscriptions(end_date);
CREATE INDEX idx_clinic_subscriptions_dates ON public.clinic_subscriptions(start_date, end_date);

-- Add table comments
COMMENT ON TABLE public.clinic_subscriptions IS 'Active subscriptions for each clinic';
COMMENT ON COLUMN public.clinic_subscriptions.clinic_id IS 'References the doctor/clinic owner in doctors table';
COMMENT ON COLUMN public.clinic_subscriptions.status IS 'Current subscription status';
COMMENT ON COLUMN public.clinic_subscriptions.trial_end_date IS 'Trial period end date (if applicable)';
COMMENT ON COLUMN public.clinic_subscriptions.auto_renew IS 'Whether subscription should auto-renew';

-- ========================================
-- STEP 3: CREATE SUBSCRIPTION HISTORY TABLE (AUDIT LOG)
-- ========================================

CREATE TABLE public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    action TEXT NOT NULL CHECK (action IN ('created', 'renewed', 'upgraded', 'downgraded', 'suspended', 'cancelled', 'expired')),
    old_status TEXT,
    new_status TEXT NOT NULL,
    old_end_date DATE,
    new_end_date DATE NOT NULL,
    payment_reference TEXT,
    amount_paid DECIMAL(10, 2),
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_subscription_history_clinic ON public.subscription_history(clinic_id);
CREATE INDEX idx_subscription_history_action ON public.subscription_history(action);
CREATE INDEX idx_subscription_history_created ON public.subscription_history(created_at DESC);

COMMENT ON TABLE public.subscription_history IS 'Audit log of all subscription changes';

-- ========================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to calculate days remaining in subscription
CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(p_clinic_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_end_date DATE;
    v_status TEXT;
BEGIN
    SELECT end_date, status 
    INTO v_end_date, v_status
    FROM public.clinic_subscriptions
    WHERE clinic_id = p_clinic_id;
    
    IF v_end_date IS NULL OR v_status != 'active' THEN
        RETURN 0;
    END IF;
    
    RETURN GREATEST(0, v_end_date - CURRENT_DATE);
END;
$$;

-- Function to check if subscription is valid
CREATE OR REPLACE FUNCTION public.is_subscription_valid(p_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    SELECT status, end_date
    INTO v_subscription
    FROM public.clinic_subscriptions
    WHERE clinic_id = p_clinic_id;
    
    -- No subscription found
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if active and not expired
    RETURN (
        v_subscription.status IN ('active', 'trial')
        AND v_subscription.end_date >= CURRENT_DATE
    );
END;
$$;

-- Function to auto-update expired subscriptions (run daily via cron)
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Update subscriptions that have expired
    WITH updated AS (
        UPDATE public.clinic_subscriptions
        SET 
            status = 'expired',
            updated_at = NOW()
        WHERE 
            status = 'active'
            AND end_date < CURRENT_DATE
        RETURNING clinic_id
    )
    SELECT COUNT(*) INTO v_updated_count FROM updated;
    
    -- Log the changes
    INSERT INTO public.subscription_history (
        clinic_id,
        plan_id,
        action,
        old_status,
        new_status,
        new_end_date,
        notes
    )
    SELECT 
        cs.clinic_id,
        cs.plan_id,
        'expired',
        'active',
        'expired',
        cs.end_date,
        'Auto-expired by system'
    FROM public.clinic_subscriptions cs
    WHERE cs.status = 'expired'
        AND cs.updated_at::date = CURRENT_DATE;
    
    RETURN v_updated_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_subscription_days_remaining(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_subscription_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_expired_subscriptions() TO service_role;

-- ========================================
-- STEP 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- ==================== SUBSCRIPTION PLANS POLICIES ====================

-- Public can read active plans
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans" 
    ON public.subscription_plans 
    FOR SELECT 
    USING (is_active = true);

-- Only service role can modify plans
DROP POLICY IF EXISTS "Only service role can manage plans" ON public.subscription_plans;
CREATE POLICY "Only service role can manage plans" 
    ON public.subscription_plans 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ==================== CLINIC SUBSCRIPTIONS POLICIES ====================

-- Clinics can view their own subscription
DROP POLICY IF EXISTS "Clinics can view own subscription" ON public.clinic_subscriptions;
CREATE POLICY "Clinics can view own subscription" 
    ON public.clinic_subscriptions 
    FOR SELECT 
    USING (
        clinic_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

-- Super admins can view all subscriptions
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.clinic_subscriptions;
CREATE POLICY "Super admins can view all subscriptions" 
    ON public.clinic_subscriptions 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE user_id = auth.uid() 
            AND (user_role = 'admin' OR email LIKE '%@admin.nileivf.com')
        )
    );

-- Only service role can modify subscriptions
DROP POLICY IF EXISTS "Only service role can manage subscriptions" ON public.clinic_subscriptions;
CREATE POLICY "Only service role can manage subscriptions" 
    ON public.clinic_subscriptions 
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ==================== SUBSCRIPTION HISTORY POLICIES ====================

-- Clinics can view their own history
DROP POLICY IF EXISTS "Clinics can view own history" ON public.subscription_history;
CREATE POLICY "Clinics can view own history" 
    ON public.subscription_history 
    FOR SELECT 
    USING (
        clinic_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

-- Super admins can view all history
DROP POLICY IF EXISTS "Super admins can view all history" ON public.subscription_history;
CREATE POLICY "Super admins can view all history" 
    ON public.subscription_history 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE user_id = auth.uid() 
            AND (user_role = 'admin' OR email LIKE '%@admin.nileivf.com')
        )
    );

-- Only service role can insert history
DROP POLICY IF EXISTS "Only service role can insert history" ON public.subscription_history;
CREATE POLICY "Only service role can insert history" 
    ON public.subscription_history 
    FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- STEP 6: SEED DATA - DEFAULT SUBSCRIPTION PLANS
-- ========================================

INSERT INTO public.subscription_plans (
    name, 
    display_name, 
    description,
    price_yearly, 
    price_monthly,
    max_users, 
    max_patients,
    features,
    sort_order
) VALUES 
(
    'basic',
    'Basic Plan',
    'Perfect for small clinics just getting started',
    4999.00,
    499.00,
    2,
    100,
    '[
        "Up to 2 users (1 doctor + 1 secretary)",
        "Up to 100 patients",
        "Patient management",
        "Appointment scheduling",
        "Basic reporting",
        "Email support"
    ]'::jsonb,
    1
),
(
    'standard',
    'Standard Plan',
    'Ideal for growing clinics with multiple staff',
    9999.00,
    999.00,
    5,
    500,
    '[
        "Up to 5 users (doctors + secretaries)",
        "Up to 500 patients",
        "Patient management",
        "Advanced appointment scheduling",
        "IVF cycle tracking",
        "Financial management",
        "Invoicing system",
        "Advanced analytics",
        "WhatsApp notifications",
        "Priority support"
    ]'::jsonb,
    2
),
(
    'enterprise',
    'Enterprise Plan',
    'Complete solution for large fertility centers',
    19999.00,
    1999.00,
    999,
    NULL,
    '[
        "Unlimited users",
        "Unlimited patients",
        "All Standard features",
        "Multi-clinic management",
        "Custom branding",
        "API access",
        "Advanced security",
        "Dedicated account manager",
        "24/7 premium support",
        "Custom integrations",
        "Data export & backup"
    ]'::jsonb,
    3
);

-- ========================================
-- STEP 7: CREATE TRIAL SUBSCRIPTIONS FOR EXISTING CLINICS
-- ========================================

-- Give all existing clinics a 30-day trial on the Standard plan
INSERT INTO public.clinic_subscriptions (
    clinic_id,
    plan_id,
    status,
    start_date,
    end_date,
    trial_end_date,
    notes
)
SELECT 
    d.id,
    (SELECT id FROM public.subscription_plans WHERE name = 'standard' LIMIT 1),
    'trial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '30 days',
    'Initial 30-day trial period'
FROM public.doctors d
WHERE d.user_role = 'doctor'
    AND NOT EXISTS (
        SELECT 1 FROM public.clinic_subscriptions cs WHERE cs.clinic_id = d.id
    );

-- ========================================
-- STEP 8: CREATE TRIGGERS FOR AUTO-UPDATE
-- ========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_subscriptions_updated_at
    BEFORE UPDATE ON public.clinic_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to log subscription changes to history
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.subscription_history (
            clinic_id,
            plan_id,
            action,
            new_status,
            new_end_date,
            performed_by
        ) VALUES (
            NEW.clinic_id,
            NEW.plan_id,
            'created',
            NEW.status,
            NEW.end_date,
            NEW.created_by
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if status or end_date changed
        IF OLD.status != NEW.status OR OLD.end_date != NEW.end_date THEN
            INSERT INTO public.subscription_history (
                clinic_id,
                plan_id,
                action,
                old_status,
                new_status,
                old_end_date,
                new_end_date,
                payment_reference,
                performed_by
            ) VALUES (
                NEW.clinic_id,
                NEW.plan_id,
                CASE 
                    WHEN OLD.status = 'active' AND NEW.status = 'expired' THEN 'expired'
                    WHEN OLD.status = 'active' AND NEW.status = 'suspended' THEN 'suspended'
                    WHEN OLD.status != 'active' AND NEW.status = 'active' THEN 'renewed'
                    ELSE 'updated'
                END,
                OLD.status,
                NEW.status,
                OLD.end_date,
                NEW.end_date,
                NEW.payment_reference,
                NEW.updated_by
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER log_subscription_changes
    AFTER INSERT OR UPDATE ON public.clinic_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_subscription_change();

-- ========================================
-- STEP 9: VERIFICATION QUERIES
-- ========================================

-- Verify plans were created
SELECT 
    '✅ Subscription Plans Created' as status,
    name,
    display_name,
    price_yearly,
    max_users,
    jsonb_array_length(features) as feature_count
FROM public.subscription_plans
ORDER BY sort_order;

-- Verify trial subscriptions were created
SELECT 
    '✅ Trial Subscriptions Created' as status,
    COUNT(*) as total_clinics,
    SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial_count,
    MIN(end_date) as earliest_expiry,
    MAX(end_date) as latest_expiry
FROM public.clinic_subscriptions;

-- Show sample subscription details
SELECT 
    '✅ Sample Subscription Details' as status,
    d.name as clinic_name,
    d.email as clinic_email,
    sp.display_name as plan,
    cs.status,
    cs.end_date,
    get_subscription_days_remaining(cs.clinic_id) as days_remaining,
    is_subscription_valid(cs.clinic_id) as is_valid
FROM public.clinic_subscriptions cs
JOIN public.doctors d ON d.id = cs.clinic_id
JOIN public.subscription_plans sp ON sp.id = cs.plan_id
LIMIT 5;

-- ========================================
-- FINAL SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🎉 PHASE 1 COMPLETED: SaaS SUBSCRIPTION DATABASE SCHEMA';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables Created:';
    RAISE NOTICE '   • subscription_plans (3 plans seeded)';
    RAISE NOTICE '   • clinic_subscriptions (with trial data)';
    RAISE NOTICE '   • subscription_history (audit log)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Functions Created:';
    RAISE NOTICE '   • get_subscription_days_remaining()';
    RAISE NOTICE '   • is_subscription_valid()';
    RAISE NOTICE '   • update_expired_subscriptions()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Security:';
    RAISE NOTICE '   • RLS Policies enabled on all tables';
    RAISE NOTICE '   • Clinics can view own subscription';
    RAISE NOTICE '   • Super admins can view all';
    RAISE NOTICE '   • Only service role can modify';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Features:';
    RAISE NOTICE '   • Auto-expiry checking';
    RAISE NOTICE '   • Audit logging';
    RAISE NOTICE '   • Trial period support';
    RAISE NOTICE '   • Multiple payment methods';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '   1. Review the verification queries above';
    RAISE NOTICE '   2. Confirm schema is correct';
    RAISE NOTICE '   3. Request PHASE 2: TypeScript Services';
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
END $$;
