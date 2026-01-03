-- ============================================================================
-- 🔧 FIX SUBSCRIPTION PLANS ACCESS - SIMPLE SOLUTION
-- ============================================================================

-- 1️⃣ Disable RLS on subscription_plans (it's public data anyway)
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- 2️⃣ Drop all existing policies
DROP POLICY IF EXISTS "anyone_view_active_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin full access on subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow all to view plans" ON subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;

-- 3️⃣ Make sure there are plans in the database
INSERT INTO subscription_plans (
    name, 
    display_name_ar, 
    display_name_en,
    description_ar, 
    description_en,
    monthly_price,
    yearly_price,
    max_patients, 
    max_users, 
    features, 
    is_active, 
    sort_order
)
VALUES
('basic', 'الباقة الأساسية', 'Basic Plan',
 'باقة أساسية للعيادات الصغيرة', 'Basic subscription plan for small clinics',
 500, 5000, 100, 1, 
 '["إدارة المواعيد", "السجلات الطبية", "التقارير الأساسية"]'::jsonb,
 true, 1),

('professional', 'الباقة الاحترافية', 'Professional Plan',
 'باقة احترافية للعيادات المتوسطة', 'Professional subscription plan for medium clinics',
 1000, 10000, 500, 3,
 '["إدارة المواعيد", "السجلات الطبية", "الحقن المجهري", "التقارير المتقدمة", "الدعم الفني"]'::jsonb,
 true, 2),

('enterprise', 'باقة الشركات', 'Enterprise Plan',
 'باقة متقدمة للعيادات الكبيرة', 'Enterprise subscription plan for large clinics',
 2000, 20000, NULL, 10,
 '["جميع المميزات", "مستخدمين غير محدودين", "مرضى غير محدودين", "دعم فني أولوية عليا", "تخصيص كامل"]'::jsonb,
 true, 3)
ON CONFLICT (name) DO UPDATE SET
    display_name_ar = EXCLUDED.display_name_ar,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    is_active = EXCLUDED.is_active;

-- 4️⃣ Verify
SELECT '✅ Subscription Plans' as table_name, COUNT(*) as count FROM subscription_plans;
SELECT '✅ Active Plans' as status, id, name, display_name_ar, monthly_price FROM subscription_plans WHERE is_active = true;

SELECT '✅ Done! RLS disabled for subscription_plans - everyone can read them now' as status;
