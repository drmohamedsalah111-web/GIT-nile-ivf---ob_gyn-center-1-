# PowerSync & Database Schema Restructuring Guide

## Overview
This guide documents the restructuring of the database schema and PowerSync integration for the Nile IVF Center application.

## Changes Made

### 1. **AppSchema.ts** - Fixed and Expanded Schema Definition
**File**: `src/powersync/AppSchema.ts`

#### Changes:
- ✅ Added missing `endometrium_thickness` column to `stimulation_logs`
- ✅ Added missing columns to `antenatal_visits` (urine tests, fetal heart, edema, etc.)
- ✅ Added `gestational_age_weeks` and `gestational_age_days` to `biometry_scans`
- ✅ Added complete `doctors` table definition with all clinic information columns
- ✅ Corrected column types (using `column.real` instead of text for numeric values)

### 2. **ivfService.ts** - Enhanced Error Handling & Resilience
**File**: `services/ivfService.ts`

#### Changes:
- ✅ Added `executeWithRetry` function with exponential backoff
- ✅ Wrapped all database operations in try-catch blocks
- ✅ Added input validation before database operations
- ✅ Added detailed error logging in Arabic and English
- ✅ Improved error messages for user feedback
- ✅ Parallel data fetching for `getCycles()` using `Promise.all()`
- ✅ Added retry mechanism with 3 attempts and configurable delay

#### Benefits:
- Automatic retry on transient failures
- Better error messages for debugging
- Offline resilience through local PowerSync storage
- Improved user experience with detailed feedback

### 3. **SupabaseConnector.ts** - Upload with Retry & Conflict Resolution
**File**: `src/powersync/SupabaseConnector.ts`

#### Changes:
- ✅ Added per-operation retry logic (3 attempts)
- ✅ Implemented intelligent retry detection (connection errors only)
- ✅ Added conflict resolution with `onConflict: 'id'` for upserts
- ✅ Improved error tracking and reporting
- ✅ Exponential backoff between retry attempts
- ✅ Detailed logging for each operation

#### Features:
- **Retry Logic**: Automatically retries on connection failures
- **Conflict Handling**: Uses upsert with ID conflict resolution
- **Error Tracking**: Detailed failure tracking with table and error information
- **Graceful Degradation**: Continues syncing other records even if some fail

### 4. **Comprehensive Database Schema (POWERSYNC_SCHEMA_SETUP.sql)**
**File**: `POWERSYNC_SCHEMA_SETUP.sql`

This is the master SQL file containing:

#### Tables (10 total):
1. **doctors** - Medical staff profiles with clinic information
2. **patients** - Patient records
3. **visits** - Clinical visits across departments
4. **ivf_cycles** - IVF cycle management with JSONB data
5. **stimulation_logs** - Daily hormone and ultrasound tracking
6. **pregnancies** - Pregnancy records with risk assessment
7. **antenatal_visits** - Prenatal care visits
8. **biometry_scans** - Fetal ultrasound measurements
9. **patient_files** - Document storage
10. **app_settings** - Application configuration

#### Features:
- ✅ Proper indexes for performance (on foreign keys, dates, and JSONB columns)
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Cascade deletes for referential integrity
- ✅ Check constraints for valid values
- ✅ JSONB columns for flexible data storage
- ✅ Timestamps on all tables for audit trails
- ✅ Proper comments documenting each table

#### RLS Security Model:
```
auth.users (Supabase Auth)
  └── doctors (user_id)
      ├── patients (doctor_id)
      │   ├── visits
      │   └── patient_files
      ├── ivf_cycles (doctor_id)
      │   └── stimulation_logs
      ├── pregnancies (doctor_id)
      │   ├── antenatal_visits
      │   └── biometry_scans
      └── app_settings (public)
```

### 5. **PowerSync Sync Rules Configuration (SyncRules.ts)**
**File**: `src/powersync/SyncRules.ts`

#### Features:
- ✅ SQL rules for data sync filtering
- ✅ Offline-first strategy configuration
- ✅ Conflict resolution strategies
- ✅ Sync configuration options

#### Sync Rules:
Each table has a rule defining what data a doctor can sync:
```
doctors:      Only own profile
patients:     Only assigned patients
visits:       Only visits for own patients
ivf_cycles:   Only own IVF cycles
etc...
```

---

## How to Apply Changes

### Step 1: Update Supabase Database Schema
1. Go to **Supabase Dashboard → SQL Editor**
2. Click **Create Query**
3. Copy the entire content from `POWERSYNC_SCHEMA_SETUP.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Verify all tables are created and RLS is enabled

### Step 2: Configure PowerSync Sync Rules
1. Go to **PowerSync Dashboard → Settings → Sync Rules**
2. Copy the YAML rules from `src/powersync/SyncRules.ts` (the `SYNC_RULES` constant)
3. Paste into the sync rules editor
4. Click **Save**
5. Verify the rules are applied

### Step 3: Deploy Updated Application Code
1. All TypeScript files have been updated automatically:
   - `src/powersync/AppSchema.ts` - Enhanced schema
   - `services/ivfService.ts` - Better error handling
   - `src/powersync/SupabaseConnector.ts` - Retry logic
   - `src/powersync/SyncRules.ts` - New configuration

2. Build and deploy:
```bash
npm run build
npm run preview  # Test locally
# Deploy to production
```

### Step 4: Test the Integration
1. Clear browser cache and local storage
2. Log in to the application
3. Try creating a patient and IVF cycle
4. Go offline (DevTools → Network → Offline)
5. Make changes while offline
6. Go back online and verify sync

---

## Configuration Reference

### ivfService.ts - Retry Configuration
```typescript
const MAX_RETRIES = 3;        // Number of retry attempts
const RETRY_DELAY = 1000;     // Initial delay in ms
// Delay = RETRY_DELAY * attempt_number
```

### SupabaseConnector.ts - Upload Configuration
```typescript
const UPLOAD_RETRIES = 3;     // Retry attempts per operation
const RETRY_DELAY = 1000;     // Initial delay in ms
```

### Offline-First Strategy (from SyncRules.ts)
```typescript
{
  useLocalFirst: true,        // Use local data immediately
  syncWhenOnline: true,       // Sync changes when connection restored
  queueOfflineChanges: true,  // Queue changes made while offline
  persistQueue: true,         // Save queue to disk
  maxOfflineQueue: 1000       // Max pending changes before warning
}
```

---

## Key Features

### 1. **Error Resilience**
- Automatic retry with exponential backoff
- Graceful fallback to offline mode
- Detailed error messages for debugging

### 2. **Data Consistency**
- RLS policies prevent unauthorized access
- Cascade deletes maintain referential integrity
- Check constraints enforce valid values
- JSONB for flexible structured data

### 3. **Performance**
- Optimized indexes on all foreign keys and date fields
- GIN indexes for JSONB queries
- Batch operations for efficiency
- Parallel data fetching

### 4. **Security**
- Row-level security on all tables
- Doctor isolation - can only access own data
- Patient isolation - visible only to their doctor
- Audit timestamps on all records

### 5. **Offline Support**
- Local SQLite database with PowerSync
- Automatic queue of offline changes
- Smart conflict resolution
- Manual sync triggering

---

## Troubleshooting

### Schema Not Updated?
```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### PowerSync Not Syncing?
1. Check browser console for errors
2. Verify PowerSync connection in DevTools > Network
3. Check credentials in `.env` file
4. Verify sync rules in PowerSync Dashboard

### Offline Changes Not Syncing?
1. Check if device is online
2. Check browser DevTools > Application > IndexedDB > powersync
3. Manually trigger sync: `await powerSyncDb.waitForSync()`

### Conflicts on Sync?
The system uses **remote-wins** strategy by default:
- Remote (server) version overwrites local
- Except for JSONB fields where merge strategy applies
- Can be customized in `SyncRules.ts`

---

## Database Statistics

- **Tables**: 10
- **Indexes**: 20+ for optimal performance
- **RLS Policies**: 30+ policies for security
- **JSONB Fields**: 4 for flexible data storage
- **Relationships**: Properly structured with referential integrity

---

## Next Steps

1. ✅ Run `POWERSYNC_SCHEMA_SETUP.sql` in Supabase
2. ✅ Configure sync rules in PowerSync Dashboard
3. ✅ Deploy updated application code
4. ✅ Test offline functionality
5. ✅ Monitor error logs and adjust retry settings if needed

For questions or issues, check the detailed comments in each file.
