-- ============================================================================
-- 🔄 FORCE REFRESH SUBSCRIPTION CACHE (Backend Side)
-- ============================================================================
-- Sometimes Supabase/Postgres caches query plans or policy checks.
-- This script forces a schema cache reload and ensures the subscription is valid.
-- ============================================================================

-- 1. Reload Schema Cache
NOTIFY pgrst, 'reload config';

-- 2. Explicitly update the subscription status to 'active' for this clinic
--    (Replace the ID with the one from the error log)
UPDATE clinic_subscriptions 
SET 
    status = 'active',
    end_date = CURRENT_DATE + INTERVAL '10 years',
    updated_at = NOW()
WHERE clinic_id = 'cdb9ca71-b2bc-45cd-a1a8-f2fcfb79e628';

-- 3. Ensure the plan is active
UPDATE subscription_plans
SET is_active = true;

-- 4. Verify the result
SELECT status, end_date FROM clinic_subscriptions 
WHERE clinic_id = 'cdb9ca71-b2bc-45cd-a1a8-f2fcfb79e628';
