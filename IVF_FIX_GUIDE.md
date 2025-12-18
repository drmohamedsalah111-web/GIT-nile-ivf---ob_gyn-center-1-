# IVF Created_at Column Fix - Complete Guide

## Problem
Error message: `فشل إنشاء دورة IVF: Could not find the 'created_at' column of 'ivf_cycles' in the schema cache (code: PGRST204)`

## Root Cause
PostgREST's internal schema cache is out of sync with the actual database schema. The `ivf_cycles` table may have the `created_at` column, but PostgREST doesn't recognize it.

## Solution Options

### Option 1: Quick Fix (Recommended - Preserves Data)
Use the `IVF_CREATED_AT_QUICK_FIX.sql` script:

1. **Open your Supabase project**
2. **Go to the SQL Editor**
3. **Copy and paste the entire contents of `IVF_CREATED_AT_QUICK_FIX.sql`**
4. **Execute the script**
5. **Test creating a new IVF cycle**

The script adds missing `created_at` and `updated_at` columns without dropping existing data.

### Option 2: Force Refresh (Complete Reset)
If the quick fix doesn't work, use `IVF_CYCLES_FORCE_REFRESH.sql`:

⚠️ **Warning: This will delete all existing IVF cycle data**

1. **Open your Supabase project**
2. **Go to the SQL Editor**
3. **Open and run the `IVF_CYCLES_FORCE_REFRESH.sql` file**
4. **After running the script, try creating an IVF cycle again**

### Option 3: Manual Column Addition
If you prefer to run commands individually:

```sql
-- Add missing columns to ivf_cycles table
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE ivf_cycles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to stimulation_logs table
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE stimulation_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing records
UPDATE ivf_cycles SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now()) WHERE created_at IS NULL OR updated_at IS NULL;
UPDATE stimulation_logs SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now()) WHERE created_at IS NULL OR updated_at IS NULL;
```

## Verification Steps

After applying the fix:

### 1. Test IVF Cycle Creation
- Navigate to the IVF Journey page
- Select a patient
- Click "Start New Cycle"
- Verify no PGRST204 error occurs

### 2. Verify Schema (Optional)
Run this query to confirm columns exist:
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name IN ('ivf_cycles', 'stimulation_logs') 
    AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, ordinal_position;
```

### 3. Test Database Operations
- Create a new IVF cycle
- Add stimulation logs
- Save cycle data
- Verify all operations work without schema errors

## If Error Persists

If the PGRST204 error continues after applying the fix:

1. **Wait 2-3 minutes** - PostgREST may need time to refresh its cache
2. **Contact Supabase Support**:
   - Go to your Supabase project dashboard
   - Contact support and mention:
     - PostgREST PGRST204 error with ivf_cycles table
     - Schema cache out of sync issue
     - Request PostgREST service restart

## Technical Details

The error occurs in the `saveCycle` function in `services/dbService.ts`:

```typescript
const { error } = await supabase
  .from('ivf_cycles')
  .insert([{
    id,
    patient_id: cycle.patientId,
    doctor_id: doctorId,
    protocol: cycle.protocol,
    status: cycle.status || 'Active',
    start_date: cycle.startDate,
    assessment_data: JSON.stringify(cycle.assessment || {}),
    lab_data: JSON.stringify(cycle.lab || {}),
    transfer_data: JSON.stringify(cycle.transfer || {}),
    outcome_data: JSON.stringify(cycle.outcome || {}),
    created_at: now,        // <- This column causes PGRST204 error
    updated_at: now
  }]);
```

PostgREST doesn't recognize the `created_at` column in its cached schema, resulting in the PGRST204 error.

## Prevention

To prevent this issue in the future:

1. **Use Consistent Schema Management**
   - Always run schema changes through the Supabase SQL Editor
   - Keep track of all schema modifications

2. **Test After Schema Changes**
   - Always test API operations after schema modifications
   - Verify PostgREST recognizes new/modified columns

3. **Use Migration Scripts**
   - Use the provided SQL setup scripts for initial deployment
   - For changes, create new migration scripts that can be rerun safely

## Files Involved

- `IVF_CREATED_AT_QUICK_FIX.sql` - Quick fix preserving data
- `IVF_CYCLES_FORCE_REFRESH.sql` - Complete table recreation
- `services/dbService.ts` - Database service that creates IVF cycles
- `services/ivfService.ts` - IVF service utilities
- `pages/IvfJourney.tsx` - UI component that creates IVF cycles

## Summary

The PGRST204 error is a schema cache issue, not a missing column problem. Running the quick fix script should resolve the issue by ensuring PostgREST's cache matches the actual database schema while preserving your existing data.
