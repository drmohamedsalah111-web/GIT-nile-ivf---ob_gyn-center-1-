-- Add branding columns to doctors table one by one
ALTER TABLE doctors ADD COLUMN primary_color TEXT DEFAULT '#2d5a6b';
ALTER TABLE doctors ADD COLUMN secondary_color TEXT DEFAULT '#00838f';
ALTER TABLE doctors ADD COLUMN accent_color TEXT DEFAULT '#00bcd4';
ALTER TABLE doctors ADD COLUMN background_color TEXT DEFAULT '#ffffff';
ALTER TABLE doctors ADD COLUMN text_color TEXT DEFAULT '#1f2937';
ALTER TABLE doctors ADD COLUMN header_font TEXT DEFAULT 'Tajawal';
ALTER TABLE doctors ADD COLUMN body_font TEXT DEFAULT 'Tajawal';
ALTER TABLE doctors ADD COLUMN button_style TEXT DEFAULT 'rounded';
ALTER TABLE doctors ADD COLUMN card_style TEXT DEFAULT 'shadow';
ALTER TABLE doctors ADD COLUMN default_rx_notes TEXT;
ALTER TABLE doctors ADD COLUMN prescription_header TEXT;
ALTER TABLE doctors ADD COLUMN prescription_footer TEXT;
ALTER TABLE doctors ADD COLUMN clinic_watermark TEXT;

-- Update existing doctors with default branding values
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
