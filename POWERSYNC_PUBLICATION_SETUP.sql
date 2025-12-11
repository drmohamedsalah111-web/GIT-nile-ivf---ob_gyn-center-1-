-- ============================================================================
-- POWERSYNC PUBLICATION SETUP (ROBUST VERSION)
-- ============================================================================
-- Run this in Supabase SQL Editor. It will add all tables to the publication
-- and ignore any "already exists" errors.
-- ============================================================================

DO $$
DECLARE
    tables_to_add text[] := ARRAY[
        'patients', 
        'visits', 
        'ivf_cycles', 
        'stimulation_logs', 
        'pregnancies', 
        'antenatal_visits', 
        'biometry_scans', 
        'patient_files', 
        'doctors', 
        'app_settings'
    ];
    t text;
BEGIN
    -- Create publication if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
        CREATE PUBLICATION powersync;
    END IF;

    -- Loop through tables and add them if not already in publication
    FOREACH t IN ARRAY tables_to_add LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION powersync ADD TABLE public.%I', t);
        EXCEPTION WHEN duplicate_object THEN
            -- Ignore if table is already in publication
            RAISE NOTICE 'Table % is already in publication', t;
        END;
    END LOOP;
END $$;

-- Verify results
SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';
