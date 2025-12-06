-- ============================================================================
-- Nile IVF Center - Dynamic Branding Setup
-- ============================================================================
-- This script creates the app_settings table and enables dynamic branding
-- for clinic name, logo, and color customization.
-- ============================================================================

-- 1. Create app_settings table for dynamic branding
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  clinic_name TEXT NOT NULL DEFAULT 'نظام د محمد صلاح جبر',
  logo_url TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  primary_color TEXT DEFAULT '#2d5a6b',
  secondary_color TEXT DEFAULT '#00838f',
  accent_color TEXT DEFAULT '#00bcd4',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  CONSTRAINT single_row CHECK (id = 1),
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- 2. Enable RLS on app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for app_settings table
-- Policy: Authenticated users can read app_settings
DROP POLICY IF EXISTS "Users can read app_settings" ON app_settings;
CREATE POLICY "Users can read app_settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update app_settings
DROP POLICY IF EXISTS "Authenticated users can update app_settings" ON app_settings;
CREATE POLICY "Authenticated users can update app_settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Insert default settings row
INSERT INTO app_settings (id, clinic_name, logo_url)
VALUES (1, 'نظام د محمد صلاح جبر', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NOTE: For Storage Bucket Creation, use Supabase Dashboard:
-- ============================================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create new bucket"
-- 3. Enter name: "branding"
-- 4. Choose "Public bucket"
-- 5. Click "Create bucket"
-- 
-- Then run the storage policies below in SQL Editor:
-- ============================================================================

-- 5. Storage Policies (Run these AFTER creating "branding" bucket)
DROP POLICY IF EXISTS "Allow authenticated users to upload branding" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "Allow authenticated users to delete branding" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete branding"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Allow public read access to branding" ON storage.objects;
CREATE POLICY "Allow public read access to branding"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'branding');

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Verify table was created:
-- SELECT * FROM app_settings;
--
-- Verify bucket exists (use Supabase Dashboard Storage tab):
-- Should see "branding" bucket listed
