-- ============================================================================
-- Nile IVF Center - Prescription Print Settings Setup
-- ============================================================================
-- This script creates the clinic_print_settings table for branded prescription printing.
-- ============================================================================

-- 1. Create clinic_print_settings table
CREATE TABLE IF NOT EXISTS clinic_print_settings (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL DEFAULT 1,
  primary_color TEXT NOT NULL DEFAULT '#2d5a6b',
  secondary_color TEXT NOT NULL DEFAULT '#00838f',
  logo_url TEXT,
  header_text TEXT,
  footer_text TEXT,
  show_watermark BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable RLS on clinic_print_settings
ALTER TABLE clinic_print_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for clinic_print_settings table
-- Policy: Authenticated users can read clinic_print_settings
DROP POLICY IF EXISTS "Users can read clinic_print_settings" ON clinic_print_settings;
CREATE POLICY "Users can read clinic_print_settings"
  ON clinic_print_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert clinic_print_settings
DROP POLICY IF EXISTS "Users can insert clinic_print_settings" ON clinic_print_settings;
CREATE POLICY "Users can insert clinic_print_settings"
  ON clinic_print_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update clinic_print_settings
DROP POLICY IF EXISTS "Authenticated users can update clinic_print_settings" ON clinic_print_settings;
CREATE POLICY "Authenticated users can update clinic_print_settings"
  ON clinic_print_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Insert default settings row for clinic_id = 1
INSERT INTO clinic_print_settings (clinic_id, primary_color, secondary_color, header_text, footer_text, show_watermark)
VALUES (1, '#2d5a6b', '#00838f', 'Dr. Mohamed Salah Gabr', 'Clinic Address | Phone: 0123456789', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NOTE: For Storage Bucket Creation, use Supabase Dashboard:
-- ============================================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create new bucket"
-- 3. Enter name: "clinic-assets"
-- 4. Choose "Public bucket"
-- 5. Click "Create bucket"
--
-- Then run the storage policies below in SQL Editor:
-- ============================================================================

-- 5. Storage Policies (Run these AFTER creating "clinic-assets" bucket)
DROP POLICY IF EXISTS "Allow authenticated users to upload clinic-assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload clinic-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Allow authenticated users to delete clinic-assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete clinic-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Allow public read access to clinic-assets" ON storage.objects;
CREATE POLICY "Allow public read access to clinic-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'clinic-assets');

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Verify table was created:
-- SELECT * FROM clinic_print_settings;
--
-- Verify bucket exists (use Supabase Dashboard Storage tab):
-- Should see "clinic-assets" bucket listed