-- ============================================================================
-- DIAGNOSTIC SCRIPT: CHECK USER ROLES AND RLS
-- ============================================================================

-- 1. Check if the current user can read their own role
-- This query simulates what the application does
SELECT 
  id, 
  user_id, 
  email, 
  user_role, 
  secretary_doctor_id 
FROM doctors 
WHERE user_id = auth.uid();

-- 2. Check if there are any users with 'secretary' role
SELECT count(*) as secretary_count FROM doctors WHERE user_role = 'secretary';

-- 3. Check RLS policies on doctors table
SELECT * FROM pg_policies WHERE tablename = 'doctors';

-- ============================================================================
-- FIX SCRIPT: ENSURE RLS ALLOWS READING OWN ROLE
-- ============================================================================

-- Allow users to read their own profile regardless of role
DROP POLICY IF EXISTS "Users can view own profile" ON doctors;
CREATE POLICY "Users can view own profile" ON doctors
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow secretaries to view their assigned doctor's profile
DROP POLICY IF EXISTS "Secretaries can view assigned doctor" ON doctors;
CREATE POLICY "Secretaries can view assigned doctor" ON doctors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.user_id = auth.uid() 
      AND d.user_role = 'secretary'
      AND d.secretary_doctor_id = doctors.id
    )
  );

-- Allow doctors to view their secretaries
DROP POLICY IF EXISTS "Doctors can view their secretaries" ON doctors;
CREATE POLICY "Doctors can view their secretaries" ON doctors
  FOR SELECT
  USING (
    secretary_doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

