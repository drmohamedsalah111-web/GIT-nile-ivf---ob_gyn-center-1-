# Backend Rebuild Checklist: Supabase + PowerSync (Clean Setup)

## Overview
This guide rebuilds the Nile IVF backend cleanly with two separate Supabase projects:
- **OLD**: Current project (untouched, for reference)
- **NEW**: Fresh project (clean database with PowerSync configured)

---

## PHASE 1: NEW SUPABASE PROJECT SETUP

### 1.1 Create New Supabase Project
- [ ] Go to [Supabase Dashboard](https://app.supabase.com/)
- [ ] Click **New Project**
- [ ] **Name**: `nile-ivf-prod-v2` (or similar)
- [ ] **Database Password**: Generate strong password (save securely)
- [ ] **Region**: Same as old project for consistency
- [ ] **Pricing Plan**: Same tier as production
- [ ] Wait for database initialization (~2 minutes)
- [ ] Copy new **Project URL** (format: `https://<new-ref>.supabase.co`)
- [ ] Copy new **Anon Key** (starts with `eyJhbGc...`)

---

## PHASE 2: DATABASE SCHEMA SETUP (NEW PROJECT)

### 2.1 Run Schema Setup in SQL Editor

**In NEW Supabase Project:**

1. Go to **SQL Editor → New Query**
2. Copy entire content from `POWERSYNC_SCHEMA_SETUP.sql` (see below)
3. Click **Run**
4. Verify: All 10 tables created ✓

**Tables created:**
- `doctors`
- `patients`
- `visits`
- `ivf_cycles`
- `stimulation_logs`
- `pregnancies`
- `antenatal_visits`
- `biometry_scans`
- `patient_files`
- `app_settings`

**File to execute:** `POWERSYNC_SCHEMA_SETUP.sql` (615 lines)

---

## PHASE 3: CREATE DEDICATED REPLICATION ROLE

### 3.1 Create PowerSync Replication Role & User

**In NEW Supabase Project SQL Editor**, run:

```sql
-- ============================================================================
-- CREATE DEDICATED REPLICATION ROLE FOR POWERSYNC
-- ============================================================================
-- This role has minimal required privileges for logical replication
-- Run in Supabase SQL Editor with POSTGRES_ROLE_CREATE_ENABLED

-- 1. Create replication role with password
CREATE ROLE powersync_role WITH LOGIN PASSWORD 'your-secure-password-here' REPLICATION;

-- 2. Grant schema access
GRANT USAGE ON SCHEMA public TO powersync_role;

-- 3. Grant table permissions (SELECT only - read-only for replication)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- 4. Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO powersync_role;

-- 5. Set defaults for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO powersync_role;

-- 6. Verify permissions (run separately to check)
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'powersync_role';
```

**Critical Notes:**
- Replace `'your-secure-password-here'` with a strong password
- Save the password securely (use password manager or Supabase environment variables)
- The role has `REPLICATION` privilege (required for logical replication)
- Permissions are READ-ONLY (SELECT only) for safety

### 3.2 Verify Role Creation

```sql
-- List all roles
SELECT rolname, rolcanlogin, rolreplication 
FROM pg_roles 
WHERE rolname = 'powersync_role';

-- Should return:
-- rolname         | rolcanlogin | rolreplication
-- powersync_role  | t           | t
```

---

## PHASE 4: LOGICAL REPLICATION PUBLICATION SETUP

### 4.1 Create Publication for PowerSync

**In NEW Supabase Project SQL Editor**, run:

```sql
-- ============================================================================
-- POWERSYNC PUBLICATION SETUP
-- ============================================================================
-- This creates a logical replication publication for PowerSync

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
            RAISE NOTICE 'Table % is already in publication', t;
        END;
    END LOOP;
END $$;

-- Verify results
SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';
```

**Expected output:** 10 rows (one per table)

---

## PHASE 5: DATABASE CONNECTION STRING (DSN)

### 5.1 Format: Direct PostgreSQL Connection

For PowerSync to connect directly to Supabase PostgreSQL:

```
postgresql://powersync_role:PASSWORD@db.<NEW-REF>.supabase.co:5432/postgres
```

**Components:**
- **User**: `powersync_role` (dedicated replication role)
- **Password**: The password you set in PHASE 3
- **Host**: `db.<NEW-REF>.supabase.co` (direct database connection)
- **Port**: `5432` (PostgreSQL default)
- **Database**: `postgres` (Supabase default)

### 5.2 Example (with placeholder values)

If your new project URL is `https://abcdef123456.supabase.co`:
- `<NEW-REF>` = `abcdef123456`
- DSN = `postgresql://powersync_role:MySecurePass123!@db.abcdef123456.supabase.co:5432/postgres`

### 5.3 Test Connection (Local Machine)

```bash
# Install psql if not present, then test:
psql "postgresql://powersync_role:PASSWORD@db.<NEW-REF>.supabase.co:5432/postgres"

# Should connect and show psql prompt
postgres=> SELECT version();
postgres=> \dt  -- list tables
postgres=> \q   -- quit
```

---

## PHASE 6: POWERSYNC DASHBOARD CONFIGURATION

### 6.1 Create or Update PowerSync Connector

1. Go to [PowerSync Dashboard](https://dashboard.powersync.co/)
2. Select or create a **Service** (if first time)
3. Click **Connectors → Add Connector**
4. **Connector Type**: PostgreSQL
5. **Connection Details**:
   - **Host**: `db.<NEW-REF>.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **Username**: `powersync_role`
   - **Password**: (from PHASE 3)
   - **SSL Mode**: `require` (Supabase requires SSL)

### 6.2 Test Connection

- Click **Test Connection**
- Should see ✓ **Connected successfully**

### 6.3 Configure Sync Rules

1. Go to **Sync Rules** in PowerSync Dashboard
2. Paste the YAML from `POWERSYNC_SYNC_RULES.yaml` (see below)
3. Click **Save**
4. Verify tables are listed in "Tables Synced"

**Sync Rules YAML:**

```yaml
global:
  tables:
    - name: doctors
      replication_type: FULL
      doc: "Doctor profiles with clinic information"
      
    - name: patients
      replication_type: FULL
      doc: "Patient records"
      
    - name: visits
      replication_type: FULL
      doc: "Clinical visits"
      
    - name: ivf_cycles
      replication_type: FULL
      doc: "IVF cycle management"
      
    - name: stimulation_logs
      replication_type: FULL
      doc: "Daily stimulation tracking"
      
    - name: pregnancies
      replication_type: FULL
      doc: "Pregnancy records"
      
    - name: antenatal_visits
      replication_type: FULL
      doc: "Antenatal visits"
      
    - name: biometry_scans
      replication_type: FULL
      doc: "Fetal biometry scans"
      
    - name: patient_files
      replication_type: FULL
      doc: "Patient documents"
      
    - name: app_settings
      replication_type: FULL
      doc: "Application settings"
```

---

## PHASE 7: VERIFICATION QUERIES

### 7.1 Verify Tables in Publication

**Run in NEW Supabase SQL Editor:**

```sql
-- List all tables in powersync publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'powersync'
ORDER BY tablename;
```

**Expected:** 10 rows
```
schemaname | tablename
public     | app_settings
public     | antenatal_visits
public     | biometry_scans
public     | doctors
public     | ivf_cycles
public     | patient_files
public     | patients
public     | pregnancies
public     | stimulation_logs
public     | visits
```

### 7.2 Verify Replication Slots

```sql
-- Check replication slots created by PowerSync
SELECT slot_name, slot_type, database, plugin 
FROM pg_replication_slots;
```

**Expected:** At least one slot named by PowerSync (e.g., `powersync_slot` or similar)

### 7.3 Verify Table Row Counts

```sql
-- Count rows in each table (after migration, if data copied)
SELECT 
  schemaname,
  tablename,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 7.4 Verify RLS Policies Exist

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- All should have rowsecurity = true
```

### 7.5 Verify Indexes

```sql
-- List indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## PHASE 8: ENVIRONMENT VARIABLES (NEW PROJECT)

### 8.1 Update Application Configuration

In your application `.env` or deployment platform (Cloudflare Pages, etc.):

```env
# NEW Supabase Project
VITE_SUPABASE_URL=https://<NEW-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<new-anon-key-from-api-settings>

# PowerSync (optional if same instance)
VITE_POWERSYNC_URL=<your-powersync-instance-url>
```

**Where to find these:**
- **VITE_SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
- **VITE_SUPABASE_ANON_KEY**: Supabase Dashboard → Settings → API → Anon Key
- **VITE_POWERSYNC_URL**: PowerSync Dashboard → API Connector → Connection URL

---

## PHASE 9: SAFE DATA MIGRATION (OLD → NEW)

### 9.1 Migration Strategy

Only migrate if you want to copy production data to the new project. **Do NOT migrate if starting fresh.**

**Order of migration** (respects foreign keys):

1. **doctors** (no dependencies)
2. **patients** (depends on doctors)
3. **visits** (depends on patients)
4. **ivf_cycles** (depends on patients, doctors)
5. **stimulation_logs** (depends on ivf_cycles)
6. **pregnancies** (depends on patients, doctors)
7. **antenatal_visits** (depends on pregnancies)
8. **biometry_scans** (depends on pregnancies)
9. **patient_files** (depends on patients)
10. **app_settings** (no dependencies)

### 9.2 Export Data from OLD Project

**In OLD Supabase Project SQL Editor:**

```sql
-- 1. Export doctors (no ordering needed)
\COPY (SELECT * FROM doctors) TO 'doctors.csv' WITH (FORMAT csv, HEADER);

-- 2. Export patients
\COPY (SELECT * FROM patients ORDER BY created_at) TO 'patients.csv' WITH (FORMAT csv, HEADER);

-- 3. Export visits
\COPY (SELECT * FROM visits ORDER BY created_at) TO 'visits.csv' WITH (FORMAT csv, HEADER);

-- And so on for remaining tables...
```

**OR use Supabase UI:**
1. SQL Editor → Click table name
2. Click **Export** button
3. Choose **CSV** format
4. Download

### 9.3 Import Data to NEW Project

**In NEW Supabase Project:**

1. Go to **SQL Editor → New Query**
2. For each CSV file (in order from 9.1):

```sql
-- Disable RLS temporarily for bulk import
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- Use COPY to import
\COPY doctors FROM 'doctors.csv' WITH (FORMAT csv, HEADER);

-- Re-enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
```

**Or use Supabase Table Editor:**
1. Go to **Table Editor → Select Table**
2. Click **Import Data**
3. Upload CSV file
4. Map columns
5. Click **Import**

### 9.4 Verify Migration

```sql
-- Compare row counts between old and new projects
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
SELECT 'app_settings', COUNT(*) FROM app_settings;
```

### 9.5 Post-Migration Validation

```sql
-- Check for referential integrity violations
-- This should return 0 if all foreign keys are valid

-- Patients without doctors
SELECT COUNT(*) FROM patients WHERE doctor_id NOT IN (SELECT id FROM doctors);

-- Visits without patients
SELECT COUNT(*) FROM visits WHERE patient_id NOT IN (SELECT id FROM patients);

-- IVF cycles without doctors/patients
SELECT COUNT(*) FROM ivf_cycles 
WHERE doctor_id NOT IN (SELECT id FROM doctors) 
   OR patient_id NOT IN (SELECT id FROM patients);

-- (Continue for remaining tables...)
```

---

## PHASE 10: APPLICATION DEPLOYMENT

### 10.1 Update Code for NEW Project

1. **Update environment variables** (see PHASE 8)
2. **Rebuild application**:
   ```bash
   npm run build
   npm run preview
   ```
3. **Test offline functionality:**
   - Open app → Go offline (DevTools → Network)
   - Make changes → Go online
   - Verify sync completes

### 10.2 Deploy to Production

**Cloudflare Pages:**
1. Push code to GitHub
2. Cloudflare Pages auto-deploys
3. Set environment variables in **Settings → Environment Variables**:
   - **Production environment**: NEW project credentials
   - **Preview environment**: Keep old project (or same, your choice)
4. Verify deployment

**Other platforms:** Follow your standard deployment process

---

## PHASE 11: CUTOVER CHECKLIST (OLD → NEW)

- [ ] NEW project database fully populated (if migrating)
- [ ] PowerSync replication syncing correctly
- [ ] Application tested in NEW project (offline + online)
- [ ] All verification queries passed (PHASE 7)
- [ ] Environment variables deployed
- [ ] Production deployment complete
- [ ] Monitor sync errors in PowerSync Dashboard (first 24h)
- [ ] OLD project marked "DO NOT USE" or archived

---

## QUICK REFERENCE: CONNECTION STRINGS

### PowerSync Direct Connection
```
postgresql://powersync_role:PASSWORD@db.<REF>.supabase.co:5432/postgres
```

### Supabase API Connection (from app)
```
URL: https://<REF>.supabase.co
ANON_KEY: eyJhbGc... (starts with this)
```

### psql CLI Test
```bash
psql "postgresql://powersync_role:PASSWORD@db.<REF>.supabase.co:5432/postgres"
```

---

## TROUBLESHOOTING

### "Invalid replication role"
- Verify `powersync_role` exists: `SELECT rolname FROM pg_roles WHERE rolname = 'powersync_role';`
- Verify `REPLICATION` privilege: `SELECT rolreplication FROM pg_roles WHERE rolname = 'powersync_role';`

### "Publication not found"
- Recreate publication: Run PHASE 4 again
- Verify: `SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';`

### "No replication slot"
- PowerSync will create it automatically after first connection
- If not created, run: `SELECT pg_create_logical_replication_slot('powersync', 'test_decoding');`

### "RLS blocking inserts"
- Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'patients';`
- Test as authenticated user: Ensure `auth.uid()` matches `doctor.user_id`

---

## FILES REFERENCE

- **POWERSYNC_SCHEMA_SETUP.sql** (615 lines) - Run first, creates all 10 tables + RLS policies
- **POWERSYNC_PUBLICATION_SETUP.sql** (42 lines) - Run second, creates publication
- **POWERSYNC_SYNC_RULES.yaml** - Upload to PowerSync Dashboard

---

**Next Steps:**
1. Follow PHASE 1-3 sequentially
2. Run verification queries (PHASE 7)
3. Configure PowerSync (PHASE 6)
4. Optionally migrate data (PHASE 9)
5. Deploy application with new credentials (PHASE 10)
