-- ============================================================================
-- SUPABASE SETUP FOR NILE IVF EMR - Doctor Settings
-- ============================================================================
-- Run this SQL script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ALTER DOCTORS TABLE - Add new columns for doctor and clinic info
-- ============================================================================

ALTER TABLE IF EXISTS doctors 
ADD COLUMN IF NOT EXISTS doctor_image TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clinic_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clinic_address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clinic_phone TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clinic_image TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clinic_latitude TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clinic_longitude TEXT DEFAULT NULL;

-- ============================================================================
-- 2. CREATE INDEX for better query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- ============================================================================
-- 3. STORAGE POLICIES - These must be run in SQL Editor or via UI
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload files to doctor-files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files from doctor-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in doctor-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files from doctor-files" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Users can upload files to doctor-files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-files'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow anyone to read/view files
CREATE POLICY "Anyone can read files from doctor-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'doctor-files');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Users can update their own files in doctor-files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'doctor-files'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'doctor-files'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Users can delete their own files from doctor-files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'doctor-files'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- DONE! 
-- ============================================================================
-- Next steps:
-- 1. Make sure the 'doctor-files' bucket exists in Storage
-- 2. If it doesn't exist, create it manually in the Supabase UI:
--    - Go to Storage → New bucket
--    - Name: doctor-files
--    - Access: Public (so images can be viewed by anyone)
-- ============================================================================
