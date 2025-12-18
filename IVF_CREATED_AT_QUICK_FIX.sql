-- ============================================================================
-- QUICK FIX FOR IVF CYCLES created_at COLUMN ISSUE
-- ============================================================================
-- This script adds the missing created_at and updated_at columns to ivf_cycles
-- and stimulation_logs tables without dropping existing data.
-- ============================================================================

-- 1. Add missing columns to ivf_cycles table
ALTER TABLE ivf_cycles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE ivf_cycles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Add missing columns to stimulation_logs table
ALTER TABLE stimulation_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE stimulation_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Update any existing records that don't have timestamps
UPDATE ivf_cycles 
SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE stimulation_logs 
SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- 4. Verify the columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name IN ('ivf_cycles', 'stimulation_logs') 
    AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Run this script in your Supabase SQL Editor
-- 2. After execution, try creating a new IVF cycle in the application
-- 3. The PGRST204 error should be resolved
-- 4. If the error persists, you may need to contact Supabase support to restart
--    the PostgREST service (mention schema cache sync issue)
-- ============================================================================
