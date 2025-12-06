# IVF Cycle Management Database Migration Guide

## Issue Resolution: "Failed to save assessment"

The "Failed to save assessment" error was occurring because the `ivf_cycles` table was missing the required JSONB columns (`assessment_data`, `lab_data`, `transfer_data`, `outcome_data`) in your Supabase database.

## Solution

A new SQL migration file has been created: `IVF_CYCLES_SETUP.sql`

This file creates:
1. **ivf_cycles** table with all required columns
2. **stimulation_logs** table for daily cycle tracking
3. Proper indexes for performance
4. Row-Level Security (RLS) policies for data access control

## How to Apply the Migration

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Execute SQL
1. Open `IVF_CYCLES_SETUP.sql` from your project root
2. Copy the entire SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success
After running the migration, you should see:
- ✅ No error messages in the SQL editor
- ✅ Query succeeded notification

Verify the tables were created:
```sql
-- Check ivf_cycles table
SELECT * FROM ivf_cycles LIMIT 1;

-- Check stimulation_logs table
SELECT * FROM stimulation_logs LIMIT 1;
```

## What Changed in the Code

### New Database Schema
```
ivf_cycles (Main IVF Cycle Record)
├── id (UUID, primary key)
├── patient_id (UUID, foreign key)
├── doctor_id (UUID, foreign key)
├── protocol (TEXT: 'Long', 'Antagonist', 'Flare-up', 'Mini-IVF')
├── status (TEXT: 'Active', 'Completed', 'Cancelled')
├── start_date (DATE)
├── assessment_data (JSONB) ← Now saves couple profile, male/female factor assessments
├── lab_data (JSONB) ← Saves OPU and embryology data
├── transfer_data (JSONB) ← Saves transfer details and luteal support
├── outcome_data (JSONB) ← Saves beta-HCG and pregnancy outcomes
└── timestamps (created_at, updated_at)

stimulation_logs (Daily Stimulation Records)
├── id (UUID, primary key)
├── cycle_id (UUID, foreign key to ivf_cycles)
├── cycle_day (INTEGER)
├── date (DATE)
├── fsh, hmg, e2, lh (TEXT fields for hormone values)
├── rt_follicles, lt_follicles (TEXT for follicle counts)
├── endometrium_thickness (TEXT)
└── timestamps (created_at, updated_at)
```

### Enhanced Error Handling
The following functions now provide detailed error messages:
- `updateCycleAssessment()` - Saves assessment data
- `updateCycleLabData()` - Saves lab data
- `updateCycleTransfer()` - Saves transfer data
- `updateCycleOutcome()` - Saves outcome data

**Before:**
```
toast.error('Failed to save assessment');
```

**After:**
```
toast.error('Failed to save assessment: [Detailed error message]');
console.error('Save assessment error:', error);
```

## Row-Level Security (RLS)

The migration includes RLS policies that ensure:
- Doctors can only access their own patient's cycles
- Each doctor is isolated from other doctors' data
- Automatic filtering based on authenticated user ID

## Troubleshooting

### If you still see "Failed to save assessment":

1. **Check browser console (F12)** for detailed error messages
2. **Verify RLS policies** are enabled:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('ivf_cycles', 'stimulation_logs');
   ```

3. **Check doctor_id mapping** - ensure your doctor record exists:
   ```sql
   SELECT id, user_id FROM doctors WHERE user_id = 'YOUR_USER_ID';
   ```

4. **Verify table structure**:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'ivf_cycles';
   ```

## Database Relationships

```
auth.users (Supabase Auth)
    ↓
doctors (has doctor_id, user_id)
    ↓
patients (has doctor_id)
    ↓
ivf_cycles (has patient_id, doctor_id)
    ↓
stimulation_logs (has cycle_id)
```

## Next Steps

1. Run the migration using the steps above
2. Refresh your browser
3. Create a new IVF cycle - the "Save Assessment" button should now work
4. Check browser console (F12) for confirmation of successful saves

## Support

If you encounter any issues:
1. Check the browser console for detailed error messages
2. Run verification queries provided in Step 3
3. Ensure you're logged in with a valid doctor account
4. Verify the Supabase connection in `services/supabaseClient.ts`
