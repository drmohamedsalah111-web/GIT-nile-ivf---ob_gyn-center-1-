-- ============================================================================
-- FINAL FIX: ROLE DETECTION AND PERMISSIONS
-- ============================================================================
-- Run this script in the Supabase SQL Editor to fix the "Secretary sees Doctor View" issue.
-- ============================================================================

-- 1. Create a secure function to get the user's role (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin), bypassing RLS
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT user_role INTO v_role
  FROM doctors
  WHERE user_id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_role TO authenticated;

-- 3. Fix RLS Policy for doctors table (Ensure users can read their own record)
DROP POLICY IF EXISTS "Users can view own profile" ON doctors;
CREATE POLICY "Users can view own profile" ON doctors
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Data Fix: Ensure all users with a secretary_doctor_id are marked as secretaries
UPDATE doctors
SET user_role = 'secretary'
WHERE secretary_doctor_id IS NOT NULL 
AND (user_role IS NULL OR user_role != 'secretary');

-- 5. Data Fix: Ensure the specific user you are testing with is a secretary
-- Replace 'secretary@example.com' with the actual email if you know it
-- UPDATE doctors SET user_role = 'secretary' WHERE email = 'your_secretary_email@example.com';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT email, user_role, secretary_doctor_id FROM doctors;
