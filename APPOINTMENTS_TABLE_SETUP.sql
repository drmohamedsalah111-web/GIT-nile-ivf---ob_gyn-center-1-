-- ============================================================================
-- APPOINTMENTS TABLE SETUP
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP NOT NULL,
  appointment_time TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')) DEFAULT 'scheduled',
  visit_type TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Doctors can read their appointments" ON appointments;
CREATE POLICY "Doctors can read their appointments" ON appointments
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can insert appointments" ON appointments;
CREATE POLICY "Doctors can insert appointments" ON appointments
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can update their appointments" ON appointments;
CREATE POLICY "Doctors can update their appointments" ON appointments
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can delete their appointments" ON appointments;
CREATE POLICY "Doctors can delete their appointments" ON appointments
  FOR DELETE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

COMMENT ON TABLE appointments IS 'Patient appointments and scheduling';
