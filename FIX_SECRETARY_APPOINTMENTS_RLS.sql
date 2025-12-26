-- ========================================
-- FIX SECRETARY APPOINTMENTS RLS POLICIES
-- ========================================
-- Problem: Secretary cannot update appointments because RLS policies 
-- check secretary_id column which doesn't exist or is NULL
-- Solution: Allow secretaries to manage ALL appointments in the clinic
-- ========================================

-- Drop old policies
DROP POLICY IF EXISTS "secretaries_view_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_all_appointments" ON appointments;

-- Drop new policies if they exist (in case of re-running)
DROP POLICY IF EXISTS "secretaries_view_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_all_appointments" ON appointments;

-- New simplified policies for secretaries
-- Secretaries can VIEW all appointments in the clinic
CREATE POLICY "secretaries_view_all_appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid() 
      AND user_role = 'secretary'
    )
  );

-- Secretaries can CREATE appointments for any doctor
CREATE POLICY "secretaries_create_all_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid() 
      AND user_role = 'secretary'
    )
  );

-- Secretaries can UPDATE any appointment (check-in, status changes)
CREATE POLICY "secretaries_update_all_appointments" ON appointments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid() 
      AND user_role = 'secretary'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid() 
      AND user_role = 'secretary'
    )
  );

-- Secretaries can DELETE appointments if needed
CREATE POLICY "secretaries_delete_all_appointments" ON appointments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid() 
      AND user_role = 'secretary'
    )
  );

-- ========================================
-- VERIFY THE FIX
-- ========================================
-- Run this to confirm policies are active:
-- SELECT schemaname, tablename, policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'appointments' AND policyname LIKE 'secretaries%';
