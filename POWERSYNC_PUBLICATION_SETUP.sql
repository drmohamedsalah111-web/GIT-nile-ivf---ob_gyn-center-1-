-- ============================================================================
-- POWERSYNC PUBLICATION SETUP FOR SUPABASE
-- ============================================================================
-- Run this SQL script in Supabase SQL Editor to add tables to PowerSync publication
-- ============================================================================

-- Add missing tables to PowerSync publication
ALTER PUBLICATION powersync ADD TABLE "public"."patient_files";
ALTER PUBLICATION powersync ADD TABLE "public"."profiles";

-- If the publication doesn't exist, create it first:
-- CREATE PUBLICATION powersync FOR ALL TABLES;

-- Or create it with specific tables:
-- CREATE PUBLICATION powersync FOR TABLE 
--   patients, 
--   visits, 
--   ivf_cycles, 
--   stimulation_logs, 
--   pregnancies, 
--   antenatal_visits, 
--   biometry_scans, 
--   patient_files, 
--   profiles, 
--   app_settings;

-- ============================================================================
-- VERIFY PUBLICATION
-- ============================================================================
-- Run this to see all tables in the publication:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';
