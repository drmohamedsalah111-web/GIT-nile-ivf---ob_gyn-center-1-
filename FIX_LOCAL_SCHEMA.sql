-- ============================================================================
-- FIX LOCAL DB SCHEMA (PowerSync)
-- ============================================================================
-- This script adds the missing columns to the doctors table in the local database.
-- Run this in the Supabase SQL Editor to ensure the server schema is correct,
-- which will then sync to the local database.
-- ============================================================================

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2d5a6b';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#4fd1c5';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#f59e0b';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#f3f4f6';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1f2937';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS header_font TEXT DEFAULT 'Tajawal';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS body_font TEXT DEFAULT 'Tajawal';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded-lg';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'shadow-md';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_watermark TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_image TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS prescription_header TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS prescription_footer TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS default_rx_notes TEXT;

-- Force update to trigger sync
UPDATE doctors SET updated_at = NOW() WHERE primary_color IS NULL;
