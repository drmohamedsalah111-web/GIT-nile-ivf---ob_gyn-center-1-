-- ========================================
-- COMPLETE SECRETARY RLS POLICIES FIX
-- ========================================
-- Fix all RLS policies to allow secretary full access
-- Uses get_user_role() RPC to avoid recursion issues
-- ========================================

-- ========================================
-- STEP 0: CREATE get_user_role() FUNCTION
-- ========================================
-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_role();

-- Create function to get user role from doctors table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  SELECT user_role INTO user_role_val
  FROM doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role_val, 'doctor');
END;
$$;

-- ========================================
-- 1. APPOINTMENTS TABLE
-- ========================================
DROP POLICY IF EXISTS "secretaries_view_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_view_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_all_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_delete_all_appointments" ON appointments;

-- Secretaries can VIEW all appointments
CREATE POLICY "secretaries_view_all_appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can CREATE appointments
CREATE POLICY "secretaries_create_all_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can UPDATE appointments
CREATE POLICY "secretaries_update_all_appointments" ON appointments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can DELETE appointments
CREATE POLICY "secretaries_delete_all_appointments" ON appointments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- ========================================
-- 2. PATIENTS TABLE
-- ========================================
DROP POLICY IF EXISTS "secretaries_view_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_update_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_delete_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_view_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_create_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_update_all_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_delete_all_patients" ON patients;

-- Secretaries can VIEW all patients
CREATE POLICY "secretaries_view_all_patients" ON patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can CREATE patients
CREATE POLICY "secretaries_create_all_patients" ON patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can UPDATE patients
CREATE POLICY "secretaries_update_all_patients" ON patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can DELETE patients
CREATE POLICY "secretaries_delete_all_patients" ON patients
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- ========================================
-- 3. DOCTORS TABLE
-- ========================================
DROP POLICY IF EXISTS "secretaries_view_doctors" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_all_doctors" ON doctors;

-- Secretaries can VIEW all doctors
CREATE POLICY "secretaries_view_all_doctors" ON doctors
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- ========================================
-- 4. INVOICES TABLE (for daily cash)
-- ========================================
DROP POLICY IF EXISTS "secretaries_view_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_create_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_view_all_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_create_all_invoices" ON invoices;
DROP POLICY IF EXISTS "secretaries_update_all_invoices" ON invoices;

-- Secretaries can VIEW all invoices
CREATE POLICY "secretaries_view_all_invoices" ON invoices
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can CREATE invoices
CREATE POLICY "secretaries_create_all_invoices" ON invoices
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- Secretaries can UPDATE invoices
CREATE POLICY "secretaries_update_all_invoices" ON invoices
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND get_user_role() = 'secretary'
  );

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Uncomment to verify policies are created:

-- Check appointments policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'appointments' AND policyname LIKE 'secretaries%';

-- Check patients policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'patients' AND policyname LIKE 'secretaries%';

-- Check doctors policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'doctors' AND policyname LIKE 'secretaries%';

-- Check invoices policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'invoices' AND policyname LIKE 'secretaries%';
