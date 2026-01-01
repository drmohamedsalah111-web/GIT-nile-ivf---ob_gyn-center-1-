-- ============================================================================
-- 🎯 SMART SUBSCRIPTION SYSTEM - نظام الاشتراكات الذكي
-- ============================================================================
-- نظام متكامل لإدارة اشتراكات العيادات من داشبورد السوبر أدمن
-- ============================================================================

-- حذف الجداول القديمة إذا كانت موجودة (بالترتيب العكسي بسبب Foreign Keys)
DROP TABLE IF EXISTS public.subscription_history CASCADE;
DROP TABLE IF EXISTS public.clinic_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- ============================================================================
-- 1️⃣ جدول خطط الاشتراك (Subscription Plans)
-- ============================================================================

CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- معلومات الخطة
    name VARCHAR(100) NOT NULL UNIQUE, -- 'basic', 'professional', 'enterprise'
    display_name_ar VARCHAR(100) NOT NULL, -- 'الخطة الأساسية'
    display_name_en VARCHAR(100) NOT NULL, -- 'Basic Plan'
    description_ar TEXT,
    description_en TEXT,
    
    -- التسعير
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    setup_fee DECIMAL(10,2) DEFAULT 0, -- رسوم الإعداد الأولية
    
    -- الحدود والمميزات
    max_users INTEGER DEFAULT 1, -- عدد المستخدمين المسموح (دكاترة + سكرتيرة)
    max_patients INTEGER, -- NULL = غير محدود
    max_storage_gb INTEGER, -- مساحة التخزين بالجيجا
    
    -- المميزات (JSONB)
    features JSONB DEFAULT '[]'::jsonb, -- ['ميزة 1', 'ميزة 2']
    
    -- الحالة
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false, -- لتمييز الخطة المميزة
    sort_order INTEGER DEFAULT 0, -- ترتيب العرض
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON public.subscription_plans(name);

-- ============================================================================
-- 2️⃣ جدول اشتراكات العيادات (Clinic Subscriptions)
-- ============================================================================

CREATE TABLE public.clinic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- الربط
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    
    -- معلومات الاشتراك
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'suspended', 'cancelled')),
    
    -- التواريخ
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    trial_end_date DATE, -- تاريخ انتهاء الفترة التجريبية
    
    -- المالية
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50), -- 'bank_transfer', 'cash', 'card', 'whatsapp'
    payment_reference VARCHAR(200), -- رقم الحوالة أو الإيصال
    payment_date DATE,
    
    -- الملاحظات والإعدادات
    notes TEXT,
    auto_renew BOOLEAN DEFAULT false,
    
    -- الحدود المخصصة (يمكن تجاوز حدود الخطة لعيادة معينة)
    custom_max_users INTEGER,
    custom_max_patients INTEGER,
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID, -- ID المدير الذي أنشأ الاشتراك
    
    -- قيد فريد: عيادة واحدة = اشتراك واحد نشط
    CONSTRAINT unique_active_subscription UNIQUE (clinic_id)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_clinic ON public.clinic_subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_plan ON public.clinic_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_status ON public.clinic_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_end_date ON public.clinic_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_dates ON public.clinic_subscriptions(start_date, end_date);

-- ============================================================================
-- 3️⃣ جدول تاريخ الاشتراكات (Subscription History)
-- ============================================================================

CREATE TABLE public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- الربط
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.clinic_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    
    -- نوع العملية
    action VARCHAR(50) NOT NULL, -- 'created', 'renewed', 'upgraded', 'downgraded', 'suspended', 'cancelled', 'expired'
    
    -- التفاصيل
    old_plan_name VARCHAR(100),
    new_plan_name VARCHAR(100),
    old_end_date DATE,
    new_end_date DATE,
    amount DECIMAL(10,2),
    
    -- الملاحظات
    notes TEXT,
    
    -- من قام بالعملية
    performed_by UUID, -- admin_id أو user_id
    performed_by_name VARCHAR(255),
    
    -- التاريخ
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_subscription_history_clinic ON public.subscription_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON public.subscription_history(created_at DESC);

-- ============================================================================
-- 4️⃣ الدوال المساعدة (Helper Functions)
-- ============================================================================

-- حذف الدوال القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS public.get_subscription_days_remaining(UUID);
DROP FUNCTION IF EXISTS public.is_subscription_valid(UUID);
DROP FUNCTION IF EXISTS public.update_expired_subscriptions();

-- دالة حساب الأيام المتبقية
CREATE FUNCTION public.get_subscription_days_remaining(clinic_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    SELECT EXTRACT(DAY FROM (end_date - CURRENT_DATE))::INTEGER
    INTO days_remaining
    FROM public.clinic_subscriptions
    WHERE clinic_id = clinic_id_param
    AND status IN ('active', 'trial');
    
    RETURN COALESCE(days_remaining, 0);
END;
$$;

-- دالة التحقق من صلاحية الاشتراك
CREATE FUNCTION public.is_subscription_valid(clinic_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.clinic_subscriptions
        WHERE clinic_id = clinic_id_param
        AND status IN ('active', 'trial')
        AND end_date >= CURRENT_DATE
    ) INTO is_valid;
    
    RETURN COALESCE(is_valid, false);
END;
$$;

-- دالة تحديث حالات الاشتراكات المنتهية (تشغل يومياً)
CREATE FUNCTION public.update_expired_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- تحديث الاشتراكات المنتهية
    WITH updated AS (
        UPDATE public.clinic_subscriptions
        SET status = 'expired',
            updated_at = NOW()
        WHERE status IN ('active', 'trial')
        AND end_date < CURRENT_DATE
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM updated;
    
    -- تعطيل العيادات المنتهية
    UPDATE public.doctors d
    SET is_active = false
    FROM public.clinic_subscriptions cs
    WHERE d.id = cs.clinic_id
    AND cs.status = 'expired';
    
    RETURN updated_count;
END;
$$;

-- ============================================================================
-- 5️⃣ Triggers للتحديث التلقائي
-- ============================================================================

-- حذف الدالة القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS public.trigger_update_timestamp() CASCADE;

-- Trigger لتحديث updated_at في subscription_plans
CREATE FUNCTION public.trigger_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_subscription_plans_timestamp ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_timestamp
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_timestamp();

DROP TRIGGER IF EXISTS update_clinic_subscriptions_timestamp ON public.clinic_subscriptions;
CREATE TRIGGER update_clinic_subscriptions_timestamp
    BEFORE UPDATE ON public.clinic_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_timestamp();

-- ============================================================================
-- 6️⃣ الصلاحيات (Permissions)
-- ============================================================================

-- صلاحيات للمستخدمين المصادق عليهم
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.clinic_subscriptions TO authenticated;
GRANT SELECT ON public.subscription_history TO authenticated;

-- صلاحيات للأدمن (يتم إدارتها من خلال RLS)
GRANT ALL ON public.subscription_plans TO authenticated;
GRANT ALL ON public.clinic_subscriptions TO authenticated;
GRANT ALL ON public.subscription_history TO authenticated;

-- صلاحيات تنفيذ الدوال
GRANT EXECUTE ON FUNCTION public.get_subscription_days_remaining TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_subscription_valid TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_expired_subscriptions TO authenticated;

-- ============================================================================
-- 7️⃣ بيانات تجريبية للخطط (Sample Plans)
-- ============================================================================

-- حذف الخطط القديمة مع الاشتراكات المرتبطة (استخدم بحذر!)
-- TRUNCATE public.subscription_plans CASCADE;
-- أو استخدم INSERT ON CONFLICT للتحديث بدلاً من الحذف

-- إضافة أو تحديث الخطط الأساسية
INSERT INTO public.subscription_plans (
    name, 
    display_name_ar, 
    display_name_en,
    description_ar,
    description_en,
    monthly_price,
    yearly_price,
    setup_fee,
    max_users,
    max_patients,
    max_storage_gb,
    features,
    is_active,
    is_popular,
    sort_order
) VALUES 
-- الخطة الأساسية
(
    'basic',
    'الخطة الأساسية',
    'Basic Plan',
    'مناسبة للعيادات الصغيرة والمبتدئين',
    'Perfect for small clinics and beginners',
    999.00,
    9990.00,
    0,
    2, -- 2 مستخدمين
    100, -- 100 مريض
    5, -- 5 جيجا
    '["إدارة المرضى", "حجز المواعيد", "السجلات الطبية", "دعم فني أساسي"]'::jsonb,
    true,
    false,
    1
),
-- الخطة الاحترافية
(
    'professional',
    'الخطة الاحترافية',
    'Professional Plan',
    'الأنسب للعيادات المتوسطة والمتنامية',
    'Best for medium and growing clinics',
    1999.00,
    19990.00,
    0,
    5, -- 5 مستخدمين
    500, -- 500 مريض
    20, -- 20 جيجا
    '["جميع مميزات الخطة الأساسية", "تقارير متقدمة", "روشتات إلكترونية", "تحليل البيانات", "دعم فني ممتاز", "نسخ احتياطي تلقائي"]'::jsonb,
    true,
    true, -- الخطة المميزة
    2
),
-- الخطة المؤسسية
(
    'enterprise',
    'الخطة المؤسسية',
    'Enterprise Plan',
    'للمراكز الطبية والمستشفيات الكبيرة',
    'For medical centers and large hospitals',
    3999.00,
    39990.00,
    5000.00, -- رسوم إعداد
    NULL, -- مستخدمين غير محدود
    NULL, -- مرضى غير محدود
    100, -- 100 جيجا
    '["جميع المميزات الاحترافية", "عدد غير محدود من المستخدمين", "عدد غير محدود من المرضى", "تخصيص كامل", "API مخصص", "دعم 24/7", "تدريب الموظفين", "مدير حساب مخصص"]'::jsonb,
    true,
    false,
    3
)
ON CONFLICT (name) 
DO UPDATE SET
    display_name_ar = EXCLUDED.display_name_ar,
    display_name_en = EXCLUDED.display_name_en,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    setup_fee = EXCLUDED.setup_fee,
    max_users = EXCLUDED.max_users,
    max_patients = EXCLUDED.max_patients,
    max_storage_gb = EXCLUDED.max_storage_gb,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ============================================================================
-- ✅ اكتمل الإعداد!
-- ============================================================================

-- للتحقق من الإعداد
SELECT 
    name,
    display_name_ar,
    monthly_price,
    yearly_price,
    max_users,
    is_active
FROM public.subscription_plans
ORDER BY sort_order;

-- ============================================================================
-- 📝 ملاحظات الاستخدام
-- ============================================================================
-- 1. الخطط الثلاث جاهزة: أساسية، احترافية، مؤسسية
-- 2. يمكن تعديل الأسعار من داشبورد السوبر أدمن
-- 3. كل عيادة يمكن أن يكون لها اشتراك واحد فقط نشط
-- 4. التاريخ يُسجل تلقائياً في جدول subscription_history
-- 5. الاشتراكات المنتهية تتحول لـ 'expired' تلقائياً
-- 6. يمكن تخصيص حدود لعيادة معينة (custom_max_users, custom_max_patients)
