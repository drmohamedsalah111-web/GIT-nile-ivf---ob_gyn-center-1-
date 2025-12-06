-- Create app_settings table for dynamic branding
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

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read app_settings
CREATE POLICY "Users can read app_settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update app_settings
CREATE POLICY "Authenticated users can update app_settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default row
INSERT INTO app_settings (id, clinic_name, logo_url)
VALUES (1, 'نظام د محمد صلاح جبر', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create branding bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload to branding bucket
CREATE POLICY "Allow authenticated users to upload branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding');

-- Storage policy: Allow authenticated users to delete their branding files
CREATE POLICY "Allow authenticated users to delete branding"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding');

-- Storage policy: Allow public read access to branding files
CREATE POLICY "Allow public read access to branding"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'branding');
