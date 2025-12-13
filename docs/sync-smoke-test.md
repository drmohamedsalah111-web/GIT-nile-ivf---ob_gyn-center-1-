# PowerSync Sync Smoke Test Checklist

## Overview

This manual test validates that offline data creation, updates, deletions, and online syncing work correctly with PowerSync.

**Test Duration:** ~15-20 minutes  
**Required Tools:** Browser (Chrome/Firefox), DevTools Console, Supabase Dashboard  
**Scope:** CREATE → UPDATE → DELETE → UPLOAD → VERIFY

---

## Pre-Test Setup

### 1. Environment Check

Open browser console (F12) and run:

```javascript
// Verify PowerSync is initialized
await diagnoseSync()
```

Expected output:
```
✅ FULLY CONNECTED
📤 NO PENDING UPLOADS
```

If you see warnings, troubleshoot using [SYNC_DIAGNOSTICS.md](../SYNC_DIAGNOSTICS.md) first.

### 2. Baseline ps_crud State

In Supabase SQL Editor, run:

```sql
-- Check baseline queue is empty
SELECT COUNT(*) as pending_count FROM ps_crud;
```

Expected: `pending_count = 0`

---

## Test 1: Offline Create

### Step 1.1: Enable Offline Mode

In DevTools Console:
```javascript
// Disable network to simulate offline
// Method 1: Use DevTools Network tab
// - In Chrome/Firefox DevTools, go to Network tab
// - Click the "Online" dropdown and select "Offline"

// Method 2: Or simulate via JS (harder to test real sync)
// Just proceed with next step
```

**Visual Confirmation:**
- Browser shows ⚠️ or 📴 icon (depends on your SyncStatus component)
- Or check console:
```javascript
await diagnoseSync()
// Should show: 📴 OFFLINE or ⚠️ PARTIAL CONNECTION
```

### Step 1.2: Create a Patient Record

In the app, navigate to **Patients** and click **Add Patient**.

Fill in:
- **Name:** `Test Patient Offline` + timestamp (e.g., `Test Patient Offline 2025-01-01T12:30:45`)
- **Age:** `30`
- **Phone:** `+20123456789`
- **History:** `Test offline creation`

Click **Save**.

Expected on-screen feedback:
```
✅ Patient saved to PowerSync: [uuid]
```

### Step 1.3: Verify ps_crud Has New Record

In Supabase SQL Editor:

```sql
-- Check ps_crud increased
SELECT COUNT(*) as pending_count FROM ps_crud;
```

Expected: `pending_count = 1` (or higher if other ops pending)

Verify the insert operation:

```sql
-- List the pending operation
SELECT id, table_name, op, created_at
FROM ps_crud
ORDER BY created_at DESC
LIMIT 1;
```

Expected output:
```
id                                   table_name  op  created_at
[uuid]                              patients    1   2025-01-01T12:30:45
```

**Note:** `op = 1` means INSERT

### Step 1.4: Console Logs to Expect

In browser console, you should see:
```
✅ Patient saved to PowerSync: 550e8400-e29b-41d4-a716-446655440000
```

Verify with diagnoseSync:
```javascript
await diagnoseSync()
```

Expected:
```
📤 UPLOAD QUEUE HAS PENDING DATA
  Queue size: 1 operations
  Status: Waiting for connection
```

---

## Test 2: Online Upload

### Step 2.1: Re-enable Network

In DevTools Network tab, click dropdown and select **Online**.

**Visual Confirmation:**
```javascript
await diagnoseSync()
// Should show: ✅ FULLY CONNECTED
```

### Step 2.2: Monitor Upload

Watch console logs as sync happens:

```javascript
// Subscribe to upload progress
await printSyncDiagnostics()
```

Expected output sequence:
```
🔍 POWERSYNC SYNC DIAGNOSTICS
  📡 Connection Status
    Overall: CONNECTED ✅
    Supabase: ✅ Connected
    PowerSync: ✅ Connected
  
  📊 Upload Queue Status
    Pending operations: 0
    Successful uploads: 1
    ✅ No recent upload errors
```

### Step 2.3: Console Logs Expected

In browser console, watch for:

```
✅ [patients:550e8400...] PUT (upsert) success (attempt 1)
✅ Upload complete: 1 operations successful
✅ Transaction marked complete
```

### Step 2.4: Verify in Supabase

In Supabase Dashboard, query the `patients` table:

```sql
-- Find the newly synced patient
SELECT id, name, age, phone, history, created_at, updated_at
FROM patients
WHERE name LIKE 'Test Patient Offline%'
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
```
id                                   name                              age  phone           history                  created_at           updated_at
550e8400-e29b-41d4-a716-446655440000 Test Patient Offline 2025-01-01...  30  +20123456789   Test offline creation   2025-01-01T12:30:45  2025-01-01T12:30:45
```

### Step 2.5: Verify ps_crud Cleared

```sql
-- Queue should be empty after successful sync
SELECT COUNT(*) as pending_count FROM ps_crud;
```

Expected: `pending_count = 0`

---

## Test 3: Offline Update

### Step 3.1: Disconnect Network Again

DevTools → Network → Offline

```javascript
await diagnoseSync()
// Expected: 📴 OFFLINE or ⚠️ PARTIAL CONNECTION
```

### Step 3.2: Edit the Patient Record

In the app, find the patient you just created and click **Edit**.

Update one field:
- **History:** Change to `Test offline update - modified at [timestamp]`

Click **Save**.

Expected on-screen:
```
✅ Patient saved to PowerSync: 550e8400-e29b-41d4-a716-446655440000
```

### Step 3.3: Verify ps_crud Has Update Operation

```sql
-- Check for UPDATE operation (op = 2)
SELECT id, table_name, op, created_at
FROM ps_crud
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
```
id                                   table_name  op  created_at
[uuid-for-update-op]                 patients    2   2025-01-01T12:31:00
```

**Note:** `op = 2` means UPDATE (PATCH in PowerSync terms)

### Step 3.4: Check Console

```javascript
await diagnoseSync()
```

Expected:
```
📤 UPLOAD QUEUE HAS PENDING DATA
  Queue size: 1 operations
  Status: Waiting for connection
```

---

## Test 4: Online Update Sync

### Step 4.1: Go Online

DevTools → Network → Online

```javascript
await diagnoseSync()
// Expected: ✅ FULLY CONNECTED
```

### Step 4.2: Monitor Update Upload

```javascript
await printSyncDiagnostics()
```

Expected:
```
📊 Upload Queue Status
  Pending operations: 0
  Successful uploads: 2
  ✅ No recent upload errors
```

### Step 4.3: Console Logs Expected

```
✅ [patients:550e8400...] PATCH (update) success (attempt 1)
✅ Upload complete: 1 operations successful
✅ Transaction marked complete
```

### Step 4.4: Verify in Supabase

```sql
-- Verify history was updated
SELECT id, name, history, updated_at
FROM patients
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
LIMIT 1;
```

Expected:
```
id                                   name                          history                              updated_at
550e8400-e29b-41d4-a716-446655440000 Test Patient Offline 2025-01... Test offline update - modified at... 2025-01-01T12:31:00
```

**Note:** `updated_at` should be newer than `created_at`

---

## Test 5: Offline Delete

### Step 5.1: Disconnect Again

DevTools → Network → Offline

```javascript
await diagnoseSync()
// Expected: 📴 OFFLINE
```

### Step 5.2: Delete the Patient Record

In the app, find the test patient and click **Delete**.

Confirm the deletion in the modal.

Expected on-screen:
```
✅ Patient deleted
```

### Step 5.3: Verify ps_crud Has Delete Operation

```sql
-- Check for DELETE operation (op = 3)
SELECT COUNT(*) as pending_count FROM ps_crud
WHERE table_name = 'patients' AND op = 3;
```

Expected: `pending_count = 1` (at least)

Verify details:
```sql
SELECT id, table_name, op, op_data, created_at
FROM ps_crud
WHERE table_name = 'patients' AND op = 3
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
```
id                                   table_name  op  op_data                                                                  created_at
[uuid-for-delete-op]                 patients    3   {"id":"550e8400-e29b-41d4-a716-446655440000"}                         2025-01-01T12:32:00
```

**Note:** `op = 3` means DELETE, `op_data` contains the record ID

### Step 5.4: Check Console

```javascript
await diagnoseSync()
```

Expected:
```
📤 UPLOAD QUEUE HAS PENDING DATA
  Queue size: 1 operations (DELETE)
  Status: Waiting for connection
```

---

## Test 6: Online Delete Sync

### Step 6.1: Go Online

DevTools → Network → Online

```javascript
await diagnoseSync()
// Expected: ✅ FULLY CONNECTED
```

### Step 6.2: Monitor Delete Upload

```javascript
await printSyncDiagnostics()
```

Expected:
```
📊 Upload Queue Status
  Pending operations: 0
  Successful uploads: 3
  ✅ No recent upload errors
```

### Step 6.3: Console Logs Expected

```
✅ [patients:550e8400...] DELETE success (attempt 1)
✅ Upload complete: 1 operations successful
✅ Transaction marked complete
```

### Step 6.4: Verify in Supabase

```sql
-- Verify patient is deleted
SELECT COUNT(*) as count
FROM patients
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

Expected: `count = 0`

Or verify with soft-delete pattern (if implemented):
```sql
-- If using soft-delete flag
SELECT id, deleted_at
FROM patients
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

Expected: `deleted_at` should be set (not NULL)

### Step 6.5: Final ps_crud Check

```sql
-- Queue should be empty after all syncs
SELECT COUNT(*) as pending_count FROM ps_crud;
```

Expected: `pending_count = 0`

---

## Summary Results Table

Fill in as you complete each test:

| Test | Step | Status | Notes |
|------|------|--------|-------|
| **Test 1: Offline Create** | Create patient | ✅ / ❌ | Patient name + time |
| | ps_crud count increases | ✅ / ❌ | Should see 1 INSERT op |
| | Console logs | ✅ / ❌ | "Patient saved to PowerSync" |
| **Test 2: Online Upload** | Network goes online | ✅ / ❌ | Check connection status |
| | Upload runs | ✅ / ❌ | "Upload complete" in console |
| | Patient in Supabase | ✅ / ❌ | Query returns the record |
| | ps_crud empty | ✅ / ❌ | Count = 0 |
| **Test 3: Offline Update** | Disconnect network | ✅ / ❌ | Status shows OFFLINE |
| | Edit patient history | ✅ / ❌ | Save succeeds locally |
| | ps_crud has UPDATE op | ✅ / ❌ | op = 2 in ps_crud |
| **Test 4: Online Update Sync** | Go online | ✅ / ❌ | Connection restored |
| | Update syncs | ✅ / ❌ | "PATCH (update) success" |
| | History updated in Supabase | ✅ / ❌ | Query shows new value |
| **Test 5: Offline Delete** | Disconnect | ✅ / ❌ | Status shows OFFLINE |
| | Delete patient | ✅ / ❌ | Confirm deletion |
| | ps_crud has DELETE op | ✅ / ❌ | op = 3 in ps_crud |
| **Test 6: Online Delete Sync** | Go online | ✅ / ❌ | Connection restored |
| | Delete syncs | ✅ / ❌ | "DELETE success" |
| | Patient gone from Supabase | ✅ / ❌ | Count = 0 in DB |

---

## Troubleshooting During Test

### Issue: ps_crud Not Increasing After Create

**Cause:** PowerSync not capturing the insert.

**Check:**
```javascript
// Verify PowerSync db is the actual db being used
await powerSyncDb.getAll('SELECT COUNT(*) as count FROM patients')
// Should show the patient you just created
```

**Solution:**
1. Ensure you're using `powerSyncDb` not `supabase` for writes
2. Check `dbService.ts` is using `powerSyncDb.execute()`
3. Restart the app

### Issue: Upload Not Starting When Online

**Cause:** Connector not connecting or credentials expired.

**Check:**
```javascript
await diagnoseSync()
// Look for PowerSync connection error
```

**Solution:**
1. Check `VITE_POWERSYNC_URL` is set
2. Force reconnect: `await connectPowerSync({ force: true })`
3. Check Supabase session: `await supabase.auth.getSession()`

### Issue: Upload Fails with UNIQUE Constraint

**Cause:** Duplicate doctor record (common on re-runs).

**Fix:**
```sql
-- Delete duplicate doctors for the test user
DELETE FROM doctors
WHERE user_id = '[your-user-id]' 
  AND id NOT IN (
    SELECT id FROM doctors 
    WHERE user_id = '[your-user-id]'
    ORDER BY created_at ASC 
    LIMIT 1
  );
```

### Issue: RLS Violation During Upload

**Cause:** Supabase RLS policies blocking the upload.

**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('patients', 'doctors');
```

Expected: `rowsecurity = true` for all tables

**Verify policies:**
```sql
-- List RLS policies for patients table
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'patients';
```

**Solution:** Check `POWERSYNC_SCHEMA_SETUP.sql` and re-apply RLS policies

---

## Quick Re-Test Script

If you need to run the full test again:

```javascript
// 1. Clear queue (only if needed)
const db = await getDb();
await db.execute('DELETE FROM ps_crud');

// 2. Start fresh
await connectPowerSync({ force: true });
await diagnoseSync();

// 3. Follow tests 1-6 above with new patient name
```

---

## Expected Diagnostic Output Examples

### Success Case

```javascript
await diagnoseSync()
```

Expected:
```
🔧 SYNC DIAGNOSTICS REPORT

✅ FULLY CONNECTED

✅ NO PENDING UPLOADS

Possible issues & solutions:
(none - sync is healthy)
```

### Partial Failure (Upload Queued)

```javascript
await printSyncDiagnostics()
```

Expected:
```
📡 Connection Status
  Overall: CONNECTED - ✅ جميع الاتصالات تعمل بشكل صحيح
  Supabase: ✅ Connected
  PowerSync: ✅ Connected

📊 Upload Queue Status
  Pending operations: 1
  Successful uploads: 2
  ❌ Last Upload Error
    Message: [UNIQUE constraint violation on user_id]
    Time: 1/1/2025, 12:31:00 PM

📋 Pending Operations (1)
  1. patients [550e8400-e29b...] - INSERT
```

---

## Sign-Off

When all tests pass, sign off:

```
✅ SYNC SMOKE TEST PASSED
- Offline CREATE works (ps_crud captures INSERT)
- Online UPLOAD works (record synced to Supabase)
- Offline UPDATE works (ps_crud captures PATCH)
- Online UPDATE SYNC works (changes synced)
- Offline DELETE works (ps_crud captures DELETE)
- Online DELETE SYNC works (record removed from Supabase)
- ps_crud queue empties after successful sync
- No RLS or UNIQUE constraint errors

Date: ___________
Tester: ___________
Environment: [dev/staging/prod]
Branch: ___________
```

---

## Notes

- Replace `550e8400-e29b-41d4-a716-446655440000` with actual UUIDs from your tests
- Timestamps will vary; use `LIKE` or `ORDER BY created_at DESC` for queries
- If tests fail on first run, restart the app and try once more
- Check `SYNC_DIAGNOSTICS.md` for advanced troubleshooting
