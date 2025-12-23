-- ============================================================================
-- FIX DOCTORS LIST FOR SECRETARY REGISTRATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create a secure function to get the list of doctors for the signup page
-- This function runs with SECURITY DEFINER to bypass RLS, allowing unauthenticated users to see the list
CREATE OR REPLACE FUNCTION get_doctors_list()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.email
  FROM doctors d
  WHERE d.user_role = 'doctor'
  ORDER BY d.name;
END;
$$;

-- 2. Grant execute permission to everyone (including unauthenticated users for signup)
GRANT EXECUTE ON FUNCTION get_doctors_list() TO anon, authenticated, service_role;

-- 3. Ensure existing doctors have a role (fix for migrated data)
UPDATE doctors SET user_role = 'doctor' WHERE user_role IS NULL;

-- 4. Check if there are any doctors in the system
SELECT COUNT(*) as doctor_count FROM doctors WHERE user_role = 'doctor';

-- NOTE: If doctor_count is 0, you must register a Doctor account first!
-- Uncheck "Register as Secretary" and create a Doctor account.
