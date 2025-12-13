# PowerSync Sync Diagnostics Guide

## Quick Start

### 1. **Browser Console - Quick Diagnosis** (Recommended for fast debugging)

Open browser DevTools (F12) and run:

```javascript
// One-line status check
await diagnoseSync()

// Detailed diagnostic report
await printSyncDiagnostics()
```

These will show:
- ✅/❌ Connection status (Supabase & PowerSync)
- 📤 Upload queue size (pending operations)
- ❌ Last upload error (if any)
- 📋 Recent pending operations
- 💡 Troubleshooting suggestions

---

## 2. **Visual Diagnostics Panel** (UI-based)

Import and add to any page:

```tsx
import SyncDiagnosticPanel from './src/components/SyncDiagnosticPanel';

export default function DebugPage() {
  return (
    <div className="p-4">
      <SyncDiagnosticPanel expanded={true} />
    </div>
  );
}
```

**Features:**
- Auto-refreshes every 5 seconds
- Click to expand/collapse details
- Shows real-time queue status
- Lists recent pending operations
- Quick action buttons: Refresh, Console, Diagnose

---

## 3. **Programmatic API** (For custom integrations)

```typescript
import {
  getFullConnectionStatus,
  getSyncDiagnostics,
  printSyncDiagnostics,
  diagnoseSync
} from './src/utils/connectionDiagnostics';

// Get full status object
const status = await getFullConnectionStatus();
console.log(status.overall.status); // 'connected' | 'partial' | 'disconnected'
console.log(status.sync.uploadQueueSize); // number of pending ops
console.log(status.sync.lastUploadError); // error message or null

// Get only sync metrics
const syncDiags = await getSyncDiagnostics();
```

---

## Troubleshooting Matrix

### Issue: "NOT CONNECTED"

**Possible Cause:** No internet, PowerSync not initialized, credentials missing

**Check:**
```javascript
// Run in console:
await diagnoseSync()
// Look for specific errors under Supabase/PowerSync sections
```

**Solutions:**
1. Verify internet connection
2. Check `VITE_POWERSYNC_URL` env variable
3. Check `VITE_SUPABASE_URL` env variable
4. Refresh page and retry

---

### Issue: "UPLOAD QUEUE HAS PENDING DATA" with error

**Possible Causes:**
- 🔐 **RLS Violation** - Permission denied on table
- 🔑 **UNIQUE Constraint** - Duplicate doctor record
- 📊 **Missing Table** - Table not in Supabase
- 🔗 **Foreign Key** - Missing parent record

**Check:**
```javascript
await printSyncDiagnostics()
// Look for: "📋 Pending Operations" and "❌ Last Upload Error"
```

**Solutions by Error:**

| Error Message | Issue | Solution |
|---------------|-------|----------|
| `UNIQUE constraint violation` | Duplicate record (usually doctor) | Ensure `ensureDoctorRecord()` only inserts once |
| `policy violation` | RLS denying access | Check RLS policies in Supabase Dashboard |
| `relation does not exist` | Table not in Supabase | Run SQL migration for that table |
| `column does not exist` | Field missing | Check table schema matches sync rules |

---

### Issue: "SYNC RULES RETURNING EMPTY"

**Symptoms:**
- Connected ✅
- No errors ❌
- But data doesn't appear in app

**Check in Supabase Dashboard:**
```sql
-- Check if sync rules are actually returning data for logged-in user
SELECT * FROM doctors WHERE user_id = current_user_id;
SELECT * FROM patients WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = current_user_id LIMIT 1);
```

**Possible Issues:**
1. User ID not in `doctors` table
2. Doctor exists but has no patients
3. RLS policies blocking the SELECT

**Solutions:**
1. Run `ensureDoctorRecord()` to create doctor record
2. Add test patient via Supabase Dashboard
3. Check RLS is enabled and has correct policies

---

## SQL Helper Queries

Run these in **Supabase SQL Editor** to inspect sync state:

```sql
-- 1. Check PowerSync queue (ps_crud)
SELECT COUNT(*) as pending_count, 
       array_agg(DISTINCT table_name) as tables
FROM ps_crud;

-- 2. List recent pending operations
SELECT id, table_name, op, created_at
FROM ps_crud
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check doctor records exist
SELECT id, user_id, email, name
FROM doctors
ORDER BY created_at DESC;

-- 4. Check patient-doctor relationships
SELECT p.id, p.name, d.name as doctor_name, p.doctor_id
FROM patients p
LEFT JOIN doctors d ON p.doctor_id = d.id
ORDER BY p.created_at DESC;

-- 5. Verify RLS is working (run as doctor user)
SELECT COUNT(*) FROM doctors WHERE user_id = current_user_id;
SELECT COUNT(*) FROM patients WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = current_user_id LIMIT 1);
```

---

## Integration Example

Add diagnostics to Settings page:

```tsx
import SyncDiagnosticPanel from '../src/components/SyncDiagnosticPanel';

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-4">
      {/* Debug section */}
      <div>
        <h2 className="text-xl font-bold mb-4">🔧 Sync Diagnostics</h2>
        <SyncDiagnosticPanel expanded={false} />
      </div>

      {/* Rest of settings... */}
    </div>
  );
}
```

---

## Monitoring in Production

```typescript
// Track upload errors in your app
import { subscribeToDiagnostics } from './src/powersync/SupabaseConnector';

subscribeToDiagnostics((diags) => {
  if (diags.lastUploadError) {
    console.error('Upload failed:', diags.lastUploadError);
    // Send to error tracking service (e.g., Sentry)
    reportError(diags.lastUploadError);
  }
});
```

---

## Key Metrics to Monitor

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| `uploadQueueSize` | 0 | 1-5 | >50 |
| `successfulUploads` | Growing | Stalled | 0 for >10s |
| `lastUploadError` | null | Set but retrying | Set for >1min |
| Overall Status | `connected` | `partial` | `disconnected` |

---

## Console Shortcuts

Save these bookmarklets for quick access:

```javascript
// Bookmark 1: Quick Status
javascript:(async() => { await window.diagnoseSync?.(); })()

// Bookmark 2: Queue Size
javascript:(async() => { const s = await window.getSyncDiagnostics?.(); console.log(`Queue: ${s?.uploadQueueSize || 0}`); })()
```

Then access the functions from global scope:
```javascript
diagnoseSync()
printSyncDiagnostics()
```

---

## Common Fixes

### Fix 1: Duplicate Doctor Record

```typescript
// In browser console
const db = getDb();
await db.execute('DELETE FROM doctors WHERE user_id = ? AND id != ?', 
  [currentUserId, correctDoctorId]);
// Then reconnect
await connectPowerSync({ force: true });
```

### Fix 2: Clear Upload Queue (Last Resort)

```typescript
// Only if you're sure pending data is lost
const db = getDb();
await db.execute('DELETE FROM ps_crud');
console.log('Queue cleared - reconnect to sync');
```

### Fix 3: Sync Rules Not Returning Data

1. Go to PowerSync Dashboard
2. Update Sync Rules
3. Test query in dashboard editor:
   ```sql
   SELECT * FROM doctors WHERE user_id = auth.uid()
   ```
4. If empty, verify user record exists in `doctors` table

---

## Contact Support

If diagnostics show:
- ❌ Connection error: Check env variables
- 🔐 RLS violation: Check permissions in Supabase
- 📤 Upload stuck: Check `ps_crud` table size
- 💾 Data missing: Run SQL helper queries above
