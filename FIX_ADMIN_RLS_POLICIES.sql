-- ============================================================================
-- 🔧 إصلاح RLS Policies للإدمن - لرؤية كل البيانات
-- ============================================================================
-- يحل مشكلة: الإدمن مش شايف الاشتراكات والبيانات في Dashboard
-- ============================================================================

-- 1️⃣ إصلاح RLS على clinic_subscriptions
ALTER TABLE clinic_subscriptions ENABLE ROW LEVEL SECURITY;

-- مسح السياسات القديمة
DROP POLICY IF EXISTS "doctors_view_own_subscription" ON clinic_subscriptions;
DROP POLICY IF EXISTS "admin_view_all_subscriptions" ON clinic_subscriptions;
DROP POLICY IF EXISTS "Allow users to view their own subscription" ON clinic_subscriptions;

-- السماح للمستخدم برؤية اشتراكه
CREATE POLICY "Allow users to view their own subscription"
ON clinic_subscriptions
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- السماح للإدمن برؤية كل الاشتراكات
CREATE POLICY "Allow admin to view all subscriptions"
ON clinic_subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- السماح للإدمن بتعديل كل الاشتراكات
CREATE POLICY "Allow admin to modify all subscriptions"
ON clinic_subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- 2️⃣ إصلاح RLS على subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin can manage plans" ON subscription_plans;

-- الجميع يمكنهم رؤية الخطط
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- الإدمن يمكنه إدارة الخطط
CREATE POLICY "Admin can manage subscription plans"
ON subscription_plans
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- 3️⃣ إصلاح RLS على subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_view_own_payments" ON subscription_payments;
DROP POLICY IF EXISTS "admin_view_all_payments" ON subscription_payments;

CREATE POLICY "Allow users to view their payments"
ON subscription_payments
FOR SELECT
TO authenticated
USING (
  subscription_id IN (
    SELECT clinic_id FROM clinic_subscriptions 
    WHERE clinic_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Allow admin to view all payments"
ON subscription_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- 4️⃣ التأكد من وجود حساب الإدمن
-- تحديث user_role للإدمن الموجود (غير البريد الإلكتروني حسب الحاجة)
UPDATE doctors 
SET user_role = 'admin'
WHERE email IN ('admin@nileivf.com', 'dr.mohamed.salah.gabr@gmail.com');

-- ============================================================================
-- ✅ تم إصلاح RLS للإدمن بنجاح
-- ============================================================================

-- عرض البيانات للتأكد
SELECT 'Subscriptions:' as info, COUNT(*) as count FROM clinic_subscriptions;
SELECT 'Plans:' as info, COUNT(*) as count FROM subscription_plans;
SELECT 'Admins:' as info, COUNT(*) as count FROM doctors WHERE user_role = 'admin';

-- نهاية الملف
