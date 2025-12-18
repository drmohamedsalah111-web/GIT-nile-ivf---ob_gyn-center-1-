# IVF Cycles Created_at Column Fix

## Problem
Error message: `فشل إنشاء دورة IVF: Could not find the 'created_at' column of 'ivf_cycles' in the schema cache (code: PGRST204)`

This error occurs when PostgREST's internal schema cache is out of sync with the actual database schema. The `ivf_cycles` table may have the `created_at` column, but PostgREST doesn't recognize it.

## Root Cause
PostgREST maintains an internal cache of the database schema. When tables are created or modified through different methods (SQL scripts, migrations, etc.), the cache can become stale and not reflect the current schema.

## Solution Options

### Option 1: Force Schema Refresh (Recommended)
Run the existing `IVF_CYCLES_FORCE_REFRESH.sql` script in your Supabase SQL Editor:

1. Open your Supabase project
2. Go to the SQL Editor
3. Open the `IVF_CYCLES_FORCE_REFRESH.sql` file
4. Execute the script
5. Test creating an IVF cycle again

This script:
- Drops and recreates the `ivf_cycles` and `stimulation_logs` tables
- Ensures proper column definitions including `created_at` and `updated_at`
- Recreates all indexes and RLS policies
- Forces PostgREST to refresh its schema cache

### Option 2: Manual Column Addition
If you have existing data you want to preserve:

```sql
-- Add missing columns to ivf_cycles table
ALTER TABLE ivf_cycles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE ivf_cycles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to stimulation_logs table
ALTER TABLE stimulation_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE stimulation_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

After running these commands:
1. Restart the PostgREST service (usually automatic in Supabase)
2. Test creating an IVF cycle

### Option 3: Contact Supabase Support
If the issue persists after trying the above solutions:

1. Go to your Supabase project dashboard
2. Contact support and mention:
   - PostgREST PGRST204 error
   - Schema cache out of sync with ivf_cycles table
   - Request PostgREST service restart

## Verification Steps

After applying the fix:

1. **Test IVF Cycle Creation**
   - Navigate to the IVF Journey page
   - Select a patient
   - Click "Start New Cycle"
   - Verify no PGRST204 error occurs

2. **Verify Schema**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns 
   WHERE table_name = 'ivf_cycles' 
   ORDER BY ordinal_position;
   ```

3. **Test Database Operations**
   - Create a new IVF cycle
   - Add stimulation logs
   - Save cycle data
   - Verify all operations work without schema errors

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

- `IVF_CYCLES_FORCE_REFRESH.sql` - Complete table recreation script
- `services/dbService.ts` - Database service that creates IVF cycles
- `services/ivfService.ts` - IVF service utilities
- `pages/IvfJourney.tsx` - UI component that creates IVF cycles

## Technical Details

The error occurs in the `saveCycle` function in `dbService.ts`:

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

## Summary

The PGRST204 error is a schema cache issue, not a missing column problem. Running the force refresh script or manually adding the columns will resolve the issue by ensuring PostgREST's cache matches the actual database schema.
