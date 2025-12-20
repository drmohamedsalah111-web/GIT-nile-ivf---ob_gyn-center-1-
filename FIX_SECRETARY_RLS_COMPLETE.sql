-- Fix All Secretary RLS Policy Issues
-- ============================================================================

-- STEP 1: Fix doctors table RLS to allow secretaries to read their own record
DROP POLICY IF EXISTS "doctors_read_own" ON doctors;
DROP POLICY IF EXISTS "doctors_insert_own" ON doctors;
DROP POLICY IF EXISTS "doctors_update_own" ON doctors;

CREATE POLICY "doctors_read_own" ON doctors
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "doctors_insert_own" ON doctors
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "doctors_update_own" ON doctors
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- STEP 2: Update appointments table to handle secretary_id properly
-- Drop existing policies
DROP POLICY IF EXISTS "secretaries_view_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;

-- Recreate with proper logic
CREATE POLICY "secretaries_view_appointments" ON appointments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
);

CREATE POLICY "secretaries_create_appointments" ON appointments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
  AND doctor_id IS NOT NULL
);

CREATE POLICY "secretaries_update_appointments" ON appointments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
);

-- STEP 3: Verify doctors table RLS is enabled
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

SELECT '✅ Secretary RLS policies fixed successfully!' as status;
