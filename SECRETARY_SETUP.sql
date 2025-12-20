-- ============================================================================
-- SECRETARY ROLE AND APPOINTMENTS SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor to add secretary functionality
-- Includes: user_role support, secretary-doctor relationships, appointments table
-- ============================================================================

-- ============================================================================
-- 1. ADD USER_ROLE TO DOCTORS TABLE
-- ============================================================================

-- Add user_role column if it doesn't exist
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'doctor' CHECK (user_role IN ('doctor', 'secretary', 'admin'));

-- Add secretary_doctor_id to allow secretary link to a doctor
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS secretary_doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE;

-- Add index for secretary lookups
CREATE INDEX IF NOT EXISTS idx_doctors_secretary_doctor_id ON doctors(secretary_doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_role ON doctors(user_role);

-- ============================================================================
-- 2. CREATE APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  secretary_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Waiting', 'Completed', 'Cancelled', 'No Show')),
  visit_type TEXT DEFAULT 'Consultation' CHECK (visit_type IN ('Consultation', 'Follow-up', 'Procedure')),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_secretary_id ON appointments(secretary_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES FOR APPOINTMENTS
-- ============================================================================

-- Doctors can see all appointments for their patients
DROP POLICY IF EXISTS "doctors_view_appointments" ON appointments;
CREATE POLICY "doctors_view_appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- Doctors can create appointments
DROP POLICY IF EXISTS "doctors_create_appointments" ON appointments;
CREATE POLICY "doctors_create_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- Doctors can update appointments
DROP POLICY IF EXISTS "doctors_update_appointments" ON appointments;
CREATE POLICY "doctors_update_appointments" ON appointments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- Secretaries can see appointments for their doctor's patients
DROP POLICY IF EXISTS "secretaries_view_appointments" ON appointments;
CREATE POLICY "secretaries_view_appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
  );

-- Secretaries can create appointments for their doctor
DROP POLICY IF EXISTS "secretaries_create_appointments" ON appointments;
CREATE POLICY "secretaries_create_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
  );

-- Secretaries can update appointments for their doctor
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;
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

-- ============================================================================
-- 4. UPDATE DOCTOR RLS POLICIES FOR SECRETARIES
-- ============================================================================

-- Secretaries can only view their own profile and doctor profile they're linked to
DROP POLICY IF EXISTS "secretaries_view_doctor_profile" ON doctors;
CREATE POLICY "secretaries_view_doctor_profile" ON doctors
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (
      user_role = 'secretary' 
      AND id = (SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================================================
-- 5. UPDATE PATIENT RLS POLICIES FOR SECRETARIES
-- ============================================================================

-- Secretaries can view patients of their assigned doctor
DROP POLICY IF EXISTS "secretaries_view_patients" ON patients;
CREATE POLICY "secretaries_view_patients" ON patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (
      SELECT secretary_doctor_id FROM doctors 
      WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1
    )
  );

-- Secretaries can add patients for their assigned doctor
DROP POLICY IF EXISTS "secretaries_insert_patients" ON patients;
CREATE POLICY "secretaries_insert_patients" ON patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (
      SELECT secretary_doctor_id FROM doctors 
      WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1
    )
  );

-- Secretaries can update patients for their assigned doctor
DROP POLICY IF EXISTS "secretaries_update_patients" ON patients;
CREATE POLICY "secretaries_update_patients" ON patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (
      SELECT secretary_doctor_id FROM doctors 
      WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (
      SELECT secretary_doctor_id FROM doctors 
      WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1
    )
  );

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE appointments IS 'Appointment records managed by doctors and secretaries';
COMMENT ON COLUMN appointments.user_role IS 'Role of user: doctor, secretary, or admin';
COMMENT ON COLUMN doctors.secretary_doctor_id IS 'Reference to doctor for secretary users';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
