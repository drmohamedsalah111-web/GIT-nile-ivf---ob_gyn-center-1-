-- ================================================
-- FIX MISSING TABLES
-- ================================================
-- Creates missing tables that are causing 404 errors
-- ================================================

-- 1. Create clinic_print_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS clinic_print_settings (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL DEFAULT 1,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Print Layout Settings
    header_enabled BOOLEAN DEFAULT TRUE,
    footer_enabled BOOLEAN DEFAULT TRUE,
    watermark_enabled BOOLEAN DEFAULT FALSE,
    logo_enabled BOOLEAN DEFAULT TRUE,
    
    -- Header Content
    header_text TEXT,
    header_ar TEXT,
    
    -- Footer Content  
    footer_text TEXT,
    footer_ar TEXT,
    
    -- Watermark
    watermark_text TEXT,
    watermark_opacity DECIMAL(3,2) DEFAULT 0.1,
    
    -- Logo
    logo_url TEXT,
    logo_position TEXT DEFAULT 'top-left' CHECK (logo_position IN ('top-left', 'top-right', 'top-center')),
    logo_size TEXT DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
    
    -- Paper Settings
    paper_size TEXT DEFAULT 'A4' CHECK (paper_size IN ('A4', 'A5', 'Letter')),
    orientation TEXT DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
    
    -- Margins (in mm)
    margin_top INTEGER DEFAULT 20,
    margin_bottom INTEGER DEFAULT 20,
    margin_left INTEGER DEFAULT 15,
    margin_right INTEGER DEFAULT 15,
    
    -- Font Settings
    font_family TEXT DEFAULT 'Tajawal',
    font_size INTEGER DEFAULT 12,
    line_height DECIMAL(3,1) DEFAULT 1.5,
    
    -- Colors
    primary_color TEXT DEFAULT '#2d5a6b',
    secondary_color TEXT DEFAULT '#4fd1c5',
    text_color TEXT DEFAULT '#1f2937',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(clinic_id, doctor_id)
);

COMMENT ON TABLE clinic_print_settings IS 'Clinic print and prescription layout settings';

-- 2. Insert default settings
INSERT INTO clinic_print_settings (
    clinic_id,
    header_text,
    header_ar,
    footer_text,
    footer_ar,
    watermark_text
) VALUES (
    1,
    'Dr. Mohamed Salah - IVF & Reproductive Medicine',
    'د. محمد صلاح - الحقن المجهري وطب الإنجاب',
    'For consultation: +20 xxx xxx xxxx | Email: clinic@example.com',
    'للاستشارات: +20 xxx xxx xxxx | البريد: clinic@example.com',
    'CONFIDENTIAL'
)
ON CONFLICT (clinic_id, doctor_id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE clinic_print_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Users can view their clinic settings" ON clinic_print_settings;
DROP POLICY IF EXISTS "Users can update their clinic settings" ON clinic_print_settings;

CREATE POLICY "Users can view their clinic settings" 
    ON clinic_print_settings FOR SELECT
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR doctor_id IS NULL
    );

CREATE POLICY "Users can update their clinic settings" 
    ON clinic_print_settings FOR ALL
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR doctor_id IS NULL
    );

-- 5. Verify
SELECT 
    'Table created successfully' as status,
    COUNT(*) as row_count 
FROM clinic_print_settings;

-- ================================================
-- SUMMARY
-- ================================================
-- ✅ clinic_print_settings table created
-- ✅ Default settings inserted
-- ✅ RLS policies enabled
-- ================================================
