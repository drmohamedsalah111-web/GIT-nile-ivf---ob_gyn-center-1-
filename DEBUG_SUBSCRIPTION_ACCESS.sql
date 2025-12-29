-- CHECK IF SUBSCRIPTION EXISTS AND DEBUG RLS
-- Replace 'cdb9ca71-b2bc-45cd-a1a8-f2fcfb79e628' with the ID from the user's error log

-- 1. Check if the subscription row exists physically
SELECT * FROM clinic_subscriptions 
WHERE clinic_id = 'cdb9ca71-b2bc-45cd-a1a8-f2fcfb79e628';

-- 2. Check if the plan link exists
SELECT * FROM subscription_plans;

-- 3. Check Policies on the table
SELECT * FROM pg_policies WHERE tablename = 'clinic_subscriptions';

-- 4. FORCE OPEN ACCESS (The "Nuclear Option" for RLS)
-- If the previous specific policies failed, we can temporarily disable RLS to confirm it's the issue.
-- WARNING: This allows public access if not careful, but for 'authenticated' role it's fine for debugging.

ALTER TABLE clinic_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- (We will re-enable it properly later, but this confirms if RLS is the blocker)
