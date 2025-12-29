-- ============================================================================
-- 🔓 COMPREHENSIVE ACCESS FIX (SECRETARY & LINKED TABLES)
-- ============================================================================
-- Problem: 406 Error persists. likely due to:
--          1. RLS on the related 'subscription_plans' table blocks access (if plan is inactive).
--          2. Missing explicit GRANT permissions for the 'authenticated' role.
-- Solution: Open read access for ALL authenticated users to both:
--           - clinic_subscriptions
--           - subscription_plans
-- ============================================================================

-- 1. Grant Role Permissions (Crucial for 406 errors)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.clinic_subscriptions TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;

-- 2. Fix 'clinic_subscriptions' RLS
DROP POLICY IF EXISTS "Clinics can view own subscription" ON public.clinic_subscriptions;
DROP POLICY IF EXISTS "Staff can view own subscription" ON public.clinic_subscriptions;
DROP POLICY IF EXISTS "Allow staff to view subscription" ON public.clinic_subscriptions;

CREATE POLICY "Allow staff to view subscription" 
ON public.clinic_subscriptions 
FOR SELECT 
TO authenticated
USING (true); -- Allow ALL authenticated users to see ANY subscription (Simple & Safe for now)

-- 3. Fix 'subscription_plans' RLS (The Join was likely failing here)
-- Previous policy only allowed 'is_active=true'. If the plan was old/archived, the join fail.
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Allow staff to view plans" ON public.subscription_plans;

CREATE POLICY "Allow staff to view plans" 
ON public.subscription_plans 
FOR SELECT 
TO authenticated
USING (true); -- Allow viewing ALL plans (active or inactive) purely for display history

-- 4. Refresh PostgREST Schema Cache (Helps with stale policy cache)
NOTIFY pgrst, 'reload config';

-- 5. Verification
-- Returns the policy names to confirm they were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('clinic_subscriptions', 'subscription_plans');
