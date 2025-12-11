-- Add default_rx_notes column to app_settings table
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_rx_notes TEXT;
