# Backend Rebuild: SQL Snippets (Ready-to-Copy)

## Quick Copy-Paste SQL Commands

Run these in order in **NEW Supabase Project → SQL Editor**.

---

## SNIPPET 1: Enable Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**Action:** Copy → Paste in SQL Editor → Run ✓

---

## SNIPPET 2: Create All 10 Tables + RLS Policies

This is the complete schema. It's 615 lines, so:

1. **Option A (Recommended):** Copy entire file `POWERSYNC_SCHEMA_SETUP.sql` from project root
2. **Option B:** Run in Supabase UI by uploading the file

**File:** `POWERSYNC_SCHEMA_SETUP.sql`

---

## SNIPPET 3: Create Replication Role

```sql
-- Create role with REPLICATION privilege
CREATE ROLE powersync_role WITH LOGIN PASSWORD 'YOUR_SECURE_PASSWORD' REPLICATION;

-- Grant minimum required permissions (READ-ONLY)
GRANT USAGE ON SCHEMA public TO powersync_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO powersync_role;

-- Set defaults for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO powersync_role;
```

**Important:** Replace `'YOUR_SECURE_PASSWORD'` with a strong password (min 12 chars, include symbols)

**Save password:** Store in password manager or Supabase environment variables

---

## SNIPPET 4: Create Logical Replication Publication

```sql
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

    -- Add all tables to publication
    FOREACH t IN ARRAY tables_to_add LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION powersync ADD TABLE public.%I', t);
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Table % is already in publication', t;
        END;
    END LOOP;
END $$;

-- Verify results
SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';
```

**Expected result:** 10 rows (one per table)

---

## SNIPPET 5: Verify Replication Role

```sql
-- List the role
SELECT rolname, rolcanlogin, rolreplication 
FROM pg_roles 
WHERE rolname = 'powersync_role';

-- Expected result:
-- rolname         | rolcanlogin | rolreplication
-- powersync_role  | t           | t
```

---

## SNIPPET 6: Verify Tables in Publication

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'powersync'
ORDER BY tablename;

-- Expected: 10 rows
```

---

## SNIPPET 7: Verify RLS Enabled on All Tables

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'doctors', 'patients', 'visits', 'ivf_cycles', 'stimulation_logs',
    'pregnancies', 'antenatal_visits', 'biometry_scans', 'patient_files', 'app_settings'
)
ORDER BY tablename;

-- Expected: All should have rowsecurity = true
```

---

## SNIPPET 8: Export Data from OLD Project (if migrating)

Run this in **OLD Supabase Project** to export each table as CSV:

```sql
-- 1. Doctors
SELECT * FROM doctors;
-- Then: Export → CSV → Save as "doctors.csv"

-- 2. Patients
SELECT * FROM patients ORDER BY created_at;

-- 3. Visits
SELECT * FROM visits ORDER BY created_at;

-- 4. IVF Cycles
SELECT * FROM ivf_cycles ORDER BY created_at;

-- 5. Stimulation Logs
SELECT * FROM stimulation_logs ORDER BY created_at;

-- 6. Pregnancies
SELECT * FROM pregnancies ORDER BY created_at;

-- 7. Antenatal Visits
SELECT * FROM antenatal_visits ORDER BY created_at;

-- 8. Biometry Scans
SELECT * FROM biometry_scans ORDER BY created_at;

-- 9. Patient Files
SELECT * FROM patient_files ORDER BY created_at;

-- 10. App Settings
SELECT * FROM app_settings;
```

**In Supabase UI:**
1. Click on table name in left sidebar
2. Click **Export button** (top right)
3. Choose **CSV**
4. Click **Download**
5. Repeat for all 10 tables

---

## SNIPPET 9: Import Data to NEW Project (if migrating)

Run in **NEW Supabase Project** for each CSV file (in this order):

```sql
-- Temporarily disable RLS for bulk import
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all 10 tables)

-- Use table editor to import CSV:
-- 1. Click table name in left sidebar
-- 2. Click "Import data"
-- 3. Upload CSV file
-- 4. Map columns
-- 5. Click Import

-- After all imports, re-enable RLS:
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all 10 tables)
```

**OR use psql (if installed locally):**

```bash
# From directory containing CSV files
psql "postgresql://powersync_role:PASSWORD@db.<REF>.supabase.co:5432/postgres" \
  -c "\COPY doctors FROM 'doctors.csv' WITH (FORMAT csv, HEADER);"
psql "postgresql://powersync_role:PASSWORD@db.<REF>.supabase.co:5432/postgres" \
  -c "\COPY patients FROM 'patients.csv' WITH (FORMAT csv, HEADER);"
# ... repeat for all 10 tables
```

---

## SNIPPET 10: Verify Migration (if data copied)

```sql
-- Compare row counts
SELECT 'doctors' as table_name, COUNT(*) as count FROM doctors
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'visits', COUNT(*) FROM visits
UNION ALL
SELECT 'ivf_cycles', COUNT(*) FROM ivf_cycles
UNION ALL
SELECT 'stimulation_logs', COUNT(*) FROM stimulation_logs
UNION ALL
SELECT 'pregnancies', COUNT(*) FROM pregnancies
UNION ALL
SELECT 'antenatal_visits', COUNT(*) FROM antenatal_visits
UNION ALL
SELECT 'biometry_scans', COUNT(*) FROM biometry_scans
UNION ALL
SELECT 'patient_files', COUNT(*) FROM patient_files
UNION ALL
SELECT 'app_settings', COUNT(*) FROM app_settings
ORDER BY table_name;
```

Compare with OLD project counts to verify all data copied.

---

## SNIPPET 11: Check Referential Integrity (after migration)

```sql
-- Patients without doctors
SELECT COUNT(*) as orphan_patients 
FROM patients 
WHERE doctor_id NOT IN (SELECT id FROM doctors);

-- Visits without patients
SELECT COUNT(*) as orphan_visits 
FROM visits 
WHERE patient_id NOT IN (SELECT id FROM patients);

-- IVF cycles without doctor or patient
SELECT COUNT(*) as orphan_ivf_cycles 
FROM ivf_cycles 
WHERE doctor_id NOT IN (SELECT id FROM doctors)
   OR patient_id NOT IN (SELECT id FROM patients);

-- Stimulation logs without cycles
SELECT COUNT(*) as orphan_logs 
FROM stimulation_logs 
WHERE cycle_id NOT IN (SELECT id FROM ivf_cycles);

-- Pregnancies without doctor or patient
SELECT COUNT(*) as orphan_pregnancies 
FROM pregnancies 
WHERE doctor_id NOT IN (SELECT id FROM doctors)
   OR patient_id NOT IN (SELECT id FROM patients);

-- Antenatal visits without pregnancy
SELECT COUNT(*) as orphan_antenatal 
FROM antenatal_visits 
WHERE pregnancy_id NOT IN (SELECT id FROM pregnancies);

-- Biometry scans without pregnancy
SELECT COUNT(*) as orphan_biometry 
FROM biometry_scans 
WHERE pregnancy_id NOT IN (SELECT id FROM pregnancies);

-- Patient files without patient
SELECT COUNT(*) as orphan_files 
FROM patient_files 
WHERE patient_id NOT IN (SELECT id FROM patients);
```

**Expected:** All counts should be 0 if migration is clean.

---

## SNIPPET 12: Test PowerSync Connection (local psql)

```bash
# Connect as powersync_role to verify credentials
psql "postgresql://powersync_role:PASSWORD@db.<NEW-REF>.supabase.co:5432/postgres"

# In psql prompt, run:
postgres=> SELECT version();
postgres=> SELECT COUNT(*) FROM doctors;
postgres=> SELECT COUNT(*) FROM patients;
postgres=> \dt  -- list all tables
postgres=> \q   -- quit
```

Replace:
- `PASSWORD` = password from SNIPPET 3
- `<NEW-REF>` = your new project reference (first part of URL)

---

## SNIPPET 13: List Database Users (debug)

```sql
-- Show all roles
SELECT rolname, rolcanlogin, rolreplication 
FROM pg_roles 
ORDER BY rolname;

-- Show role permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'powersync_role'
LIMIT 10;
```

---

## QUICK REFERENCE: Connection Strings

### For PowerSync Dashboard
```
postgresql://powersync_role:PASSWORD@db.<NEW-REF>.supabase.co:5432/postgres
```

### For Environment Variables (App)
```
VITE_SUPABASE_URL=https://<NEW-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### For Local Testing
```bash
psql "postgresql://powersync_role:PASSWORD@db.<NEW-REF>.supabase.co:5432/postgres"
```

---

## EXECUTION ORDER

**Run in NEW Supabase SQL Editor in this exact order:**

1. ✅ SNIPPET 1: Extensions
2. ✅ SNIPPET 2: Schema (POWERSYNC_SCHEMA_SETUP.sql - 615 lines)
3. ✅ SNIPPET 3: Replication role
4. ✅ SNIPPET 4: Publication setup
5. ✅ SNIPPET 5: Verify role
6. ✅ SNIPPET 6: Verify publication
7. ✅ SNIPPET 7: Verify RLS
8. (Optional) SNIPPET 8-11: Data migration
9. (Optional) SNIPPET 12: Test connection
10. (Optional) SNIPPET 13: List users

---

## ERROR HANDLING

### "Role already exists"
- Safe to ignore, role is already created
- Verify with SNIPPET 5

### "Duplicate object in publication"
- Safe to ignore, table already published
- Verify with SNIPPET 6

### "Permission denied"
- Make sure you're logged in as postgres or superuser
- Check that powersync_role has GRANT permissions

### "RLS blocking inserts"
- RLS is working correctly
- Ensure your auth.uid() matches the doctor's user_id
- Disable RLS temporarily: `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;`

---

**See BACKEND_REBUILD_CHECKLIST.md for full context and Phase-by-Phase guide.**
