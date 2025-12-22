-- ========================================
-- Fix Appointments Foreign Keys for Supabase Relations
-- ========================================
-- This script ensures foreign key constraints exist properly
-- so Supabase can handle embedded relations correctly

-- Step 1: Drop existing constraints if they exist (safely)
DO $$ 
BEGIN
    -- Drop patient_id constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_patient_id_fkey'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_patient_id_fkey;
    END IF;
    
    -- Drop doctor_id constraint if exists  
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_doctor_id_fkey'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_doctor_id_fkey;
    END IF;
END $$;

-- Step 2: Clean up any orphaned records (records with invalid foreign keys)
-- Delete appointments with non-existent patients
DELETE FROM appointments 
WHERE patient_id IS NOT NULL 
  AND patient_id NOT IN (SELECT id FROM patients);

-- Delete appointments with non-existent doctors
DELETE FROM appointments 
WHERE doctor_id IS NOT NULL 
  AND doctor_id NOT IN (SELECT id FROM doctors);

-- Step 3: Re-create foreign key constraints with proper names
ALTER TABLE appointments
ADD CONSTRAINT appointments_patient_id_fkey
FOREIGN KEY (patient_id) 
REFERENCES patients(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_doctor_id_fkey
FOREIGN KEY (doctor_id) 
REFERENCES doctors(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id 
ON appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date 
ON appointments(appointment_date);

-- Step 5: Verify the setup
DO $$ 
BEGIN
    -- Check if foreign keys exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_patient_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Failed to create patient_id foreign key';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_doctor_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Failed to create doctor_id foreign key';
    END IF;
    
    RAISE NOTICE '✅ Foreign keys created successfully!';
END $$;

-- Step 6: Test query to verify relations work
SELECT 
    a.id,
    a.appointment_date,
    a.status,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    d.id as doctor_id,
    d.name as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LIMIT 5;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Foreign keys fixed successfully!';
    RAISE NOTICE '✅ Supabase should now handle embedded relations';
    RAISE NOTICE 'Test the app - appointments should load with patient names';
    RAISE NOTICE '========================================';
END $$;
