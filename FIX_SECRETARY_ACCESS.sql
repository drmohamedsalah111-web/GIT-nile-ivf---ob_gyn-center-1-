-- ============================================================================
-- FIX SECRETARY ACCESS & DASHBOARD
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Ensure RLS policies allow users (including secretaries) to read their own role
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON doctors;
DROP POLICY IF EXISTS "doctors_read_own" ON doctors;

CREATE POLICY "Users can read own profile" ON doctors
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Ensure the user_role column is properly configured
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'doctor';

-- 3. Fix any existing secretaries that might be stuck as 'doctor'
-- This is tricky without knowing which is which, but we can rely on the fact 
-- that secretaries usually have a 'secretary_doctor_id' set.
UPDATE doctors 
SET user_role = 'secretary' 
WHERE secretary_doctor_id IS NOT NULL 
AND user_role = 'doctor';

-- 4. Verify the fix
SELECT id, name, user_role, secretary_doctor_id FROM doctors WHERE user_role = 'secretary';
