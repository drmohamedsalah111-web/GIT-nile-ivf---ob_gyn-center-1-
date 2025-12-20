-- Fix: Allow unauthenticated users to read doctors list for secretary signup
-- ============================================================================

-- Add a policy that allows anyone (authenticated or not) to read doctors with user_role = 'doctor'
-- This is needed for the secretary signup form to display the doctor dropdown
CREATE POLICY "public_read_doctors" ON doctors
FOR SELECT
USING (
  -- Allow if user owns the record
  (auth.uid() = user_id)
  OR
  -- OR allow public read of doctors only (not secretaries)
  (user_role = 'doctor' OR user_role IS NULL)
);

-- Alternatively, if the above doesn't work due to existing policies,
-- we can use an anonymous policy:
-- CREATE POLICY "anonymous_read_doctors" ON doctors
-- FOR SELECT
-- USING (user_role = 'doctor');

SELECT 'Doctor dropdown fix applied successfully!' as status;
