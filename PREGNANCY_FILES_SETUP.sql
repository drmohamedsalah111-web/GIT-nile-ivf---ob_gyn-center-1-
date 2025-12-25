-- Create pregnancy_files table to store metadata about uploaded ultrasound images
CREATE TABLE IF NOT EXISTS pregnancy_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pregnancy_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read pregnancy files"
ON pregnancy_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert pregnancy files"
ON pregnancy_files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete pregnancy files"
ON pregnancy_files FOR DELETE
TO authenticated
USING (true);

-- Create storage bucket for ultrasound images if it doesn't exist
-- Note: This usually needs to be done via Supabase dashboard or API, 
-- but we can document the requirement.
-- The bucket name should be 'ultrasound-images'
