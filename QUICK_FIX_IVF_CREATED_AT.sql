-- ============================================================================
-- INSTRUCTIONS FOR FIXING IVF CYCLES created_at COLUMN ISSUE
-- ============================================================================
-- The error "Could not find the 'created_at' column of 'ivf_cycles' in the schema cache (code: PGRST204)"
-- occurs when PostgREST's schema cache is out of sync with the actual database schema.
-- 
-- SOLUTION: Run the IVF_CYCLES_FORCE_REFRESH.sql script in your Supabase SQL Editor
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Open your Supabase project
-- 2. Go to the SQL Editor
-- 3. Open and run the IVF_CYCLES_FORCE_REFRESH.sql file
-- 4. After running the script, try creating an IVF cycle again

-- WHY THIS WORKS:
-- The IVF_CYCLES_FORCE_REFRESH.sql script drops and recreates the ivf_cycles and stimulation_logs tables
-- with the correct schema, which forces PostgREST to refresh its schema cache and recognize the created_at column.

-- ALTERNATIVE: If you have existing data you want to preserve, you can manually run these commands in Supabase:

-- 1. First, backup your data (if needed):
-- SELECT * FROM ivf_cycles;
-- SELECT * FROM stimulation_logs;

-- 2. Then run the force refresh script or manually add the column:
-- ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
-- ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Restart the PostgREST service in Supabase (done automatically in most cases)

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- After applying the fix:
-- 1. Test creating a new IVF cycle in the application
-- 2. The PGRST204 error should be resolved
-- 3. If the error persists, contact Supabase support to restart PostgREST service
-- ============================================================================
