# Deployment Quick Start Guide

## Current Status
- ✅ Database schema prepared (POWERSYNC_SCHEMA_SETUP.sql)
- ✅ Service layer with error handling (dbService.ts)
- ✅ AppSchema updated for PowerSync (optional, offline mode)

---

## Option 1: Quick Deploy (Recommended - Supabase Direct)

### Step 1: Apply Database Schema
1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Copy entire content of `POWERSYNC_SCHEMA_SETUP.sql`
4. Paste and run
5. Verify all 10 tables created with RLS enabled

**Expected output:**
```
doctors          true
patients         true
visits           true
ivf_cycles       true
stimulation_logs true
pregnancies      true
antenatal_visits true
biometry_scans   true
patient_files    true
app_settings     true
```

### Step 2: Update Application Code

**Replace ivfService imports** in your components:

```typescript
// OLD
import { db } from '../services/ivfService';

// NEW
import { dbService as db } from '../services/dbService';
```

**Or create alias in ivfService.ts:**

```typescript
export { dbService as db } from './dbService';
```

### Step 3: Build & Deploy
```bash
npm run build
npm run preview  # Test locally
# Then deploy to hosting
```

---

## Option 2: With PowerSync (Advanced - Offline First)

### Prerequisites
- PowerSync account at https://powersync.journeyapps.com
- PowerSync URL from dashboard

### Step 1-3: Same as Option 1

### Step 4: Configure PowerSync Sync Rules
1. Go to **PowerSync Dashboard → Settings → Sync Rules**
2. Copy rules from `src/powersync/SyncRules.ts`
3. Configure each bucket rule:

```yaml
bucket_definitions:
  doctors:
    table: doctors
    rule: 'auth.uid() = user_id'
  
  patients:
    table: patients
    rule: 'doctor_id in (select id from doctors where user_id = auth.uid())'
  
  # ... add rest from SyncRules.ts
```

### Step 5: Build with PowerSync
```bash
npm run build
```

**Note:** PowerSync is optional. App works fine with Supabase direct (Option 1).

---

## Verification Checklist

### Database
- [ ] All 10 tables exist
- [ ] RLS enabled on all tables
- [ ] Publication "powersync" created (if using PowerSync)
- [ ] Sample data inserts without errors

### Application
- [ ] Build completes without errors
- [ ] Can login with doctor credentials
- [ ] Can create patient
- [ ] Can create IVF cycle
- [ ] Can add stimulation logs
- [ ] Can save assessments
- [ ] Can update cycle data

### (Optional) PowerSync
- [ ] Sync rules configured
- [ ] Data syncs offline/online
- [ ] Conflicts resolve correctly

---

## Troubleshooting

### Tables Not Created?
```sql
-- Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### "Doctor not found" Error?
```sql
-- Verify doctor record exists
SELECT * FROM doctors WHERE user_id = 'your-user-id';

-- Insert if missing (replace with real UUID)
INSERT INTO doctors (user_id, email, name) 
VALUES ('your-user-id', 'doctor@example.com', 'Dr. Name');
```

### Data Not Saving?
1. Check browser console (F12) for detailed errors
2. Verify doctor_id exists: `SELECT * FROM doctors;`
3. Check Supabase logs: Dashboard → Logs

### Build Errors?
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## File Changes Summary

### New Files Created:
- `services/dbService.ts` - Direct Supabase database layer
- `src/powersync/SyncRules.ts` - PowerSync configuration
- `POWERSYNC_SCHEMA_SETUP.sql` - Complete database schema

### Modified Files:
- `src/powersync/AppSchema.ts` - Fixed column definitions
- `services/ivfService.ts` - Enhanced error handling
- `src/powersync/SupabaseConnector.ts` - Retry logic

---

## Database Structure

```
doctors (1)
  ├── patients (N)
  │   ├── visits (N)
  │   ├── patient_files (N)
  │   └── ivf_cycles (N)
  │       └── stimulation_logs (N)
  ├── pregnancies (N)
  │   ├── antenatal_visits (N)
  │   └── biometry_scans (N)
  └── app_settings (shared)
```

Each doctor sees only their own data via RLS policies.

---

## Performance Tips

1. **Indexes**: All created automatically
2. **JSONB**: Use for flexible data (assessment_data, lab_data, etc.)
3. **Batch Operations**: Use for multiple inserts/updates
4. **Connection Pool**: Handled by Supabase

---

## Support

- Supabase Docs: https://supabase.com/docs
- PowerSync Docs: https://powersync.journeyapps.com/docs
- Check Supabase Dashboard Logs for errors

---

## Next Steps

1. ✅ Run POWERSYNC_SCHEMA_SETUP.sql in Supabase
2. ✅ Update imports to use dbService
3. ✅ Build and test locally
4. ✅ Deploy to production
5. (Optional) Add PowerSync for offline support
