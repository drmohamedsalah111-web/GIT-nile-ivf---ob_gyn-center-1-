-- ============================================================================
-- Nile IVF Center - Doctor-Specific Branding Setup
-- ============================================================================
-- This script enhances the doctors table with comprehensive branding options
-- allowing each doctor to have their own visual identity within the application
-- ============================================================================

-- 1. Add comprehensive branding columns to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2d5a6b';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#00838f';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#00bcd4';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1f2937';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS header_font TEXT DEFAULT 'Tajawal';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS body_font TEXT DEFAULT 'Tajawal';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'shadow';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS default_rx_notes TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS prescription_header TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS prescription_footer TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_watermark TEXT;

-- 2. Update existing doctors with default branding values
UPDATE doctors 
SET 
    primary_color = '#2d5a6b',
    secondary_color = '#00838f',
    accent_color = '#00bcd4',
    background_color = '#ffffff',
    text_color = '#1f2937',
    header_font = 'Tajawal',
    body_font = 'Tajawal',
    button_style = 'rounded',
    card_style = 'shadow'
WHERE primary_color IS NULL;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_branding ON doctors(primary_color, secondary_color, accent_color);

-- 4. Update RLS policies to allow doctors to update their branding
DROP POLICY IF EXISTS "Doctors can update their own profile" ON doctors;
CREATE POLICY "Doctors can update their own profile" ON doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Storage Setup for Doctor Branding
-- ============================================================================
-- Note: Create these buckets in Supabase Dashboard → Storage:
-- 1. "doctor-logos" - for clinic/doctor logos
-- 2. "doctor-watermarks" - for prescription watermarks
-- ============================================================================

-- Storage Policies for doctor logos (run after creating bucket)
DROP POLICY IF EXISTS "Doctors can upload their own logos" ON storage.objects;
CREATE POLICY "Doctors can upload their own logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-logos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Doctors can update their own logos" ON storage.objects;
CREATE POLICY "Doctors can update their own logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'doctor-logos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Doctors can delete their own logos" ON storage.objects;
CREATE POLICY "Doctors can delete their own logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'doctor-logos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Public read access to doctor logos" ON storage.objects;
CREATE POLICY "Public read access to doctor logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'doctor-logos');

-- Storage Policies for watermarks (run after creating bucket)
DROP POLICY IF EXISTS "Doctors can upload their own watermarks" ON storage.objects;
CREATE POLICY "Doctors can upload their own watermarks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-watermarks' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Doctors can update their own watermarks" ON storage.objects;
CREATE POLICY "Doctors can update their own watermarks"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'doctor-watermarks' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Doctors can delete their own watermarks" ON storage.objects;
CREATE POLICY "Doctors can delete their own watermarks"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'doctor-watermarks' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Public read access to doctor watermarks" ON storage.objects;
CREATE POLICY "Public read access to doctor watermarks"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'doctor-watermarks');

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Check if columns were added successfully:
-- \d doctors

-- Check branding defaults:
-- SELECT id, name, primary_color, secondary_color, accent_color FROM doctors LIMIT 5;
