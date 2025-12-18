-- ============================================================================
-- PATIENT DOCUMENTS MODULE SETUP - Supabase SQL
-- ============================================================================
-- This script creates tables for patient document management with category
-- filtering, tagging, and Supabase Storage integration.
-- ============================================================================

-- 1. CREATE PATIENT_DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('Image', 'PDF')),
  category TEXT NOT NULL CHECK (category IN ('Lab', 'Scan', 'Rx', 'Other')),
  file_size_bytes INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_doctor_id ON patient_documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_category ON patient_documents(category);
CREATE INDEX IF NOT EXISTS idx_patient_documents_created_at ON patient_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_documents_file_type ON patient_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_patient_documents_tags ON patient_documents USING GIN (tags);

-- 3. ENABLE RLS
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Doctors can read their patient documents" ON patient_documents;
DROP POLICY IF EXISTS "Doctors can insert patient documents" ON patient_documents;
DROP POLICY IF EXISTS "Doctors can update patient documents" ON patient_documents;
DROP POLICY IF EXISTS "Doctors can delete patient documents" ON patient_documents;

-- 5. RLS POLICIES FOR PATIENT_DOCUMENTS
CREATE POLICY "Doctors can read their patient documents" ON patient_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Doctors can insert patient documents" ON patient_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Doctors can update patient documents" ON patient_documents
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Doctors can delete patient documents" ON patient_documents
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
  );

-- 6. ADD TABLE COMMENTS
COMMENT ON TABLE patient_documents IS 'Stores patient document metadata with file URLs from Supabase Storage';
COMMENT ON COLUMN patient_documents.file_type IS 'Type of file: Image (JPG/PNG) or PDF';
COMMENT ON COLUMN patient_documents.category IS 'Document category: Lab (test results), Scan (ultrasound/radiology), Rx (prescriptions), Other';
COMMENT ON COLUMN patient_documents.tags IS 'Array of custom tags for filtering and organization';

-- ============================================================================
-- SUPABASE STORAGE BUCKET POLICY
-- ============================================================================
-- Execute the following in Supabase Dashboard → Storage → Policies
-- Bucket: patient_documents

-- 1. Create bucket (if not exists) - via Dashboard: Storage → Create bucket
--    Name: patient_documents
--    Make it Private (RLS enabled)

-- 2. Apply these RLS policies in Storage:

-- Allow doctors to upload documents for their patients
-- (Implement in Storage → Policies)
-- POLICY: "Doctors can upload patient documents"
-- Definition:
--   Role: authenticated
--   Target roles: authenticated
--   Allowed operations: SELECT, INSERT
--   With check: (
--       (SELECT auth.uid()) = (SELECT user_id FROM doctors WHERE id IN (
--         SELECT doctor_id FROM patient_documents WHERE patient_id = (
--           split_part(objects.name, '/', 1)::uuid
--         )
--       ))
--     )

-- Allow doctors to read their patient documents
-- POLICY: "Doctors can read patient documents"
-- Definition:
--   Role: authenticated
--   Target roles: authenticated
--   Allowed operations: SELECT
--   With check: (
--       (SELECT auth.uid()) = (SELECT user_id FROM doctors WHERE id IN (
--         SELECT doctor_id FROM patient_documents WHERE patient_id = (
--           split_part(objects.name, '/', 1)::uuid
--         )
--       ))
--     )

-- Allow doctors to delete their patient documents
-- POLICY: "Doctors can delete patient documents"
-- Definition:
--   Role: authenticated
--   Target roles: authenticated
--   Allowed operations: DELETE
--   With check: (
--       (SELECT auth.uid()) = (SELECT user_id FROM doctors WHERE id IN (
--         SELECT doctor_id FROM patient_documents WHERE patient_id = (
--           split_part(objects.name, '/', 1)::uuid
--         )
--       ))
--     )
