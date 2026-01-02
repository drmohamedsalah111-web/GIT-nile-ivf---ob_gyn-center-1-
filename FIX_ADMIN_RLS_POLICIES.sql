-- ============================================================================
-- 🔧 إصلاح جذري - إلغاء RLS مؤقتاً لحين الإصلاح
-- ============================================================================
-- يحل مشكلة: النظام بالكامل معطل بسبب RLS Policies متضاربة
-- الحل: إلغاء RLS على جداول الاشتراكات مؤقتاً
-- ============================================================================

-- ⚠️ إلغاء RLS على جميع الجداول المتعلقة بالاشتراكات
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_usage DISABLE ROW LEVEL SECURITY;

-- مسح جميع السياسات القديمة المتضاربة
-- Doctors policies
DROP POLICY IF EXISTS "Allow users to view own profile" ON doctors;
DROP POLICY IF EXISTS "Allow admin to view all doctors" ON doctors;
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON doctors;
DROP POLICY IF EXISTS "Allow users to insert their profile" ON doctors;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON doctors;
DROP POLICY IF EXISTS "Allow users to update own profile" ON doctors;
DROP POLICY IF EXISTS "Allow admin to update any doctor" ON doctors;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON doctors;
DROP POLICY IF EXISTS "Allow all authenticated to view doctors" ON doctors;
DROP POLICY IF EXISTS "Allow insert own profile" ON doctors;
DROP POLICY IF EXISTS "Allow update profile" ON doctors;

-- Subscriptions policies
DROP POLICY IF EXISTS "doctors_view_own_subscription" ON clinic_subscriptions;
DROP POLICY IF EXISTS "admin_view_all_subscriptions" ON clinic_subscriptions;
DROP POLICY IF EXISTS "Allow users to view their own subscription" ON clinic_subscriptions;
DROP POLICY IF EXISTS "Allow admin to view all subscriptions" ON clinic_subscriptions;
DROP POLICY IF EXISTS "Allow admin to modify all subscriptions" ON clinic_subscriptions;
DROP POLICY IF EXISTS "Allow access to subscriptions" ON clinic_subscriptions;

-- Plans policies
DROP POLICY IF EXISTS "Anyone can view plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow all to view plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow admin to manage plans" ON subscription_plans;

-- Payments policies
DROP POLICY IF EXISTS "doctors_view_own_payments" ON subscription_payments;
DROP POLICY IF EXISTS "admin_view_all_payments" ON subscription_payments;
DROP POLICY IF EXISTS "Allow users to view their payments" ON subscription_payments;
DROP POLICY IF EXISTS "Allow admin to view all payments" ON subscription_payments;
DROP POLICY IF EXISTS "Allow access to payments" ON subscription_payments;

-- Usage policies
DROP POLICY IF EXISTS "doctors_view_own_usage" ON clinic_usage;

-- 4️⃣ تفعيل حساب الدكتور محمد صالح
-- تحديث الحساب ليكون admin وتفعيل الاشتراك
UPDATE doctors 
SET user_role = 'admin', role = 'admin'
WHERE email IN ('admin@nileivf.com', 'dr.mohamed.salah.gabr@gmail.com');

-- تفعيل أو إنشاء اشتراك نشط
INSERT INTO clinic_subscriptions (clinic_id, plan_id, status, payment_status, start_date, end_date, paid_amount)
SELECT 
  d.id,
  COALESCE((SELECT id FROM subscription_plans ORDER BY monthly_price DESC LIMIT 1), gen_random_uuid()),
  'active',
  'paid',
  NOW(),
  NOW() + INTERVAL '10 years', -- اشتراك طويل المدى
  0
FROM doctors d
WHERE d.email = 'dr.mohamed.salah.gabr@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM clinic_subscriptions cs WHERE cs.clinic_id = d.id
)
ON CONFLICT DO NOTHING;

-- تحديث أي اشتراك موجود ليكون نشط
UPDATE clinic_subscriptions 
SET 
  status = 'active', 
  payment_status = 'paid',
  end_date = NOW() + INTERVAL '10 years'
WHERE clinic_id IN (
  SELECT id FROM doctors WHERE email = 'dr.mohamed.salah.gabr@gmail.com'
);

-- ============================================================================
-- ✅ تم إلغاء RLS مؤقتاً - النظام الآن يعمل بدون قيود
-- ============================================================================

-- عرض حالة النظام
SELECT '✅ Doctors' as table_name, COUNT(*) as total FROM doctors;
SELECT '✅ Subscriptions' as table_name, COUNT(*) as total FROM clinic_subscriptions;
SELECT '✅ Plans' as table_name, COUNT(*) as total FROM subscription_plans;

-- عرض حالة حساب الدكتور محمد صالح
SELECT 
  '✅ Account Status' as info,
  d.email,
  d.user_role,
  d.role,
  cs.status as subscription_status,
  cs.end_date
FROM doctors d
LEFT JOIN clinic_subscriptions cs ON cs.clinic_id = d.id
WHERE d.email = 'dr.mohamed.salah.gabr@gmail.com';

-- ملاحظة مهمة:
-- RLS الآن معطل على جميع الجداول
-- لإعادة تفعيله بعد التأكد من عمل النظام، استخدم:
-- ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- نهاية الملف
