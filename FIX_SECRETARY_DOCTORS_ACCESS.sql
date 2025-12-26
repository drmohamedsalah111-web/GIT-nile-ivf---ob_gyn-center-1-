-- ========================================
-- FIX SECRETARY ACCESS TO DOCTORS TABLE
-- ========================================
-- Problem: Secretary cannot see doctors list when adding patients
-- Solution: Allow secretaries to view all doctors
-- ========================================

-- Drop old policies if exist
DROP POLICY IF EXISTS "secretaries_view_doctors" ON doctors;
DROP POLICY IF EXISTS "secretaries_view_all_doctors" ON doctors;

-- Allow secretaries to VIEW all doctors in the clinic
CREATE POLICY "secretaries_view_all_doctors" ON doctors
  FOR SELECT
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
-- Run this to confirm:
-- SELECT schemaname, tablename, policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'doctors' AND policyname LIKE 'secretaries%';
