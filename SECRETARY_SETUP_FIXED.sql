-- ============================================================================
-- SECRETARY ROLE AND APPOINTMENTS SETUP - FIXED VERSION
-- ============================================================================
-- Run this in Supabase SQL Editor step by step if needed
-- ============================================================================

-- STEP 1: Add columns to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'doctor' CHECK (user_role IN ('doctor', 'secretary', 'admin'));
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS secretary_doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_doctors_secretary_doctor_id ON doctors(secretary_doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_role ON doctors(user_role);

-- STEP 2: Create appointments table
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
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

-- STEP 3: Create indexes
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_secretary_id ON appointments(secretary_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date DESC);
CREATE INDEX idx_appointments_status ON appointments(status);

-- STEP 4: Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies
-- Doctors can see all appointments for their patients
CREATE POLICY "doctors_view_appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- Doctors can create appointments
CREATE POLICY "doctors_create_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- Doctors can update appointments
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

-- Secretaries can see appointments for their doctor
CREATE POLICY "secretaries_view_appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
  );

-- Secretaries can create appointments
CREATE POLICY "secretaries_create_appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND secretary_id = (SELECT id FROM doctors WHERE user_id = auth.uid() AND user_role = 'secretary' LIMIT 1)
  );

-- Secretaries can update appointments
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

-- STEP 6: Update patient RLS policies for secretaries
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

-- STEP 7: Table comments
COMMENT ON TABLE appointments IS 'Appointment records managed by doctors and secretaries';
COMMENT ON COLUMN doctors.user_role IS 'Role of user: doctor, secretary, or admin';
COMMENT ON COLUMN doctors.secretary_doctor_id IS 'Reference to doctor for secretary users';

-- All done!
SELECT 'Migration completed successfully!' as status;
