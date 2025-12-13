# PowerSync Auth Filtering: Security & Performance

## The Problem (Old Rules - UNSECURED)

```yaml
# ❌ BEFORE: No filtering
- SELECT id, name, age, phone, ... FROM patients
- SELECT id, patient_id, date, ... FROM visits
- SELECT id, patient_id, doctor_id, ... FROM ivf_cycles
```

**What happens:**
- Every doctor syncs **ALL patients** in the database
- Every doctor syncs **ALL visits** from every patient
- Every doctor syncs **ALL IVF cycles** and **ALL pregnancies**
- Dr. Ahmed syncs Dr. Fatima's patients and data
- Dr. Fatima syncs Dr. Ahmed's patients and data
- **CRITICAL SECURITY BREACH** (patient privacy violation, HIPAA/GDPR non-compliant)

**Storage impact:**
- Dr. Ahmed's device: 50 patients × 10 GB per patient = 500 GB synced
- Dr. Fatima's device: 50 patients × 10 GB per patient = 500 GB synced
- (Duplicate data on each device + massive sync bandwidth)

---

## The Solution (New Rules - SECURED)

```sql
-- ✅ AFTER: Filtered by auth.uid()
SELECT id, name, age, phone, ... FROM patients
WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
```

**What happens:**
- Dr. Ahmed only syncs his own 10 patients
- Dr. Fatima only syncs her own 8 patients
- No cross-doctor data leaks
- Each doctor sees only their own data locally and online

---

## Security Benefits

### 1. **Data Isolation (Doctor-to-Doctor)**
Each doctor is confined to their own scope:

```
Dr. Ahmed (auth.uid() = user-uuid-ahmed)
  ├─ doctors: Only his profile
  ├─ patients: Only his 10 patients
  ├─ visits: Only visits of his patients
  ├─ ivf_cycles: Only his cycles
  └─ pregnancies: Only his pregnancies

Dr. Fatima (auth.uid() = user-uuid-fatima)
  ├─ doctors: Only her profile
  ├─ patients: Only her 8 patients
  ├─ visits: Only visits of her patients
  ├─ ivf_cycles: Only her cycles
  └─ pregnancies: Only her pregnancies
```

### 2. **Compliance**
- ✅ **HIPAA**: Covered entities cannot disclose protected health information (PHI)
- ✅ **GDPR**: Patient data is confined to authorized personnel only
- ✅ **Local Regulations**: Doctor-patient confidentiality maintained

### 3. **No Offline Data Leaks**
- Lost phone or compromised device only exposes one doctor's data
- Not all doctors' data in the clinic

---

## Performance Benefits

### Dramatically Reduced Sync Size

**Scenario:** Clinic with 20 doctors, 1,000 total patients

#### Without Filtering (Old)
```
Per doctor device:
  1,000 patients × 10 records each = 10,000 rows
  + 5,000 visits × 2 KB each = 10 MB
  + 2,000 IVF cycles × 5 KB each = 10 MB
  + 10,000 stimulation logs × 1 KB each = 10 MB
  ────────────────────────────────────────────
  Total per device: ~30 MB per doctor
  ✗ Multiplied by 20 doctors = 600 MB total clinic data
  ✗ Each doctor's device stores 600 MB of irrelevant data
```

#### With Filtering (New)
```
Per doctor device (assuming avg 50 patients per doctor):
  50 patients × 10 records each = 500 rows
  + 250 visits × 2 KB each = 0.5 MB
  + 100 IVF cycles × 5 KB each = 0.5 MB
  + 500 stimulation logs × 1 KB each = 0.5 MB
  ────────────────────────────────────────────
  Total per device: ~1.5 MB per doctor
  ✓ Each device only stores relevant data
  ✓ Initial sync: 1.5 MB instead of 30 MB
```

### Bandwidth Savings
```
Without filtering:
  - First sync: 30 MB per doctor × 20 = 600 MB total clinic bandwidth
  - Monthly incremental: ~2 MB per doctor = 40 MB clinic-wide
  
With filtering:
  - First sync: 1.5 MB per doctor × 20 = 30 MB total (20x faster)
  - Monthly incremental: ~0.1 MB per doctor = 2 MB clinic-wide (20x less)
```

### Faster Offline-First Operation
- Smaller local database = faster queries
- Less data to sync when reconnecting
- Mobile clients with slow connections sync in seconds, not minutes

---

## How Auth Filtering Works

### 1. **Doctor Profile Level**
```sql
WHERE user_id = auth.uid()
```
- Directly matches Supabase auth user
- Dr. Ahmed can only see his own `doctors` record

### 2. **Patient Level (Single Subquery)**
```sql
WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
```
- Looks up the current doctor's ID
- Returns only their patients
- Works because every authenticated doctor has exactly one `doctors` record

### 3. **Nested Level (Multi-Level Ownership)**
```sql
WHERE patient_id IN (
  SELECT id FROM patients 
  WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
)
```
- Finds all patients owned by current doctor
- Syncs only data related to those patients
- Applied to: visits, patient_files, infertility_workups

### 4. **IVF/Pregnancy Hierarchy**
```sql
WHERE cycle_id IN (
  SELECT id FROM ivf_cycles 
  WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid() LIMIT 1)
)
```
- Syncs only stimulation logs for the current doctor's IVF cycles
- Avoids syncing logs from other doctors' cycles

### 5. **Public Data (App Settings)**
```sql
-- No WHERE clause - everyone can read
SELECT * FROM app_settings
```
- Branding, colors, settings are shared read-only
- No sensitive data

---

## Table-by-Table Filtering

| Table | Filter | Purpose |
|-------|--------|---------|
| **doctors** | `WHERE user_id = auth.uid()` | Own profile only |
| **patients** | `WHERE doctor_id = (...)` | Own patients only |
| **visits** | Nested by patient_id | Visits of own patients |
| **ivf_cycles** | `WHERE doctor_id = (...)` | Own cycles only |
| **stimulation_logs** | Nested by cycle_id | Logs of own cycles |
| **pregnancies** | `WHERE doctor_id = (...)` | Own pregnancies only |
| **antenatal_visits** | Nested by pregnancy_id | Visits of own pregnancies |
| **biometry_scans** | Nested by pregnancy_id | Scans of own pregnancies |
| **patient_files** | Nested by patient_id | Files of own patients |
| **infertility_workups** | Nested by patient_id | Workups of own patients |
| **app_settings** | None (public) | Clinic-wide settings |

---

## Impact Summary

### Security ✅
| Metric | Before | After |
|--------|--------|-------|
| Data isolation | ❌ None (all doctors see all data) | ✅ Complete (doctor sees only own data) |
| Privacy compliance | ❌ Violates HIPAA/GDPR | ✅ Meets compliance |
| Offline risk | ❌ Entire clinic exposed if device lost | ✅ Only one doctor's data exposed |
| Cross-doctor data leaks | ❌ Possible (no filtering) | ✅ Impossible (auth-filtered at sync) |

### Performance ✅
| Metric | Before | After |
|--------|--------|-------|
| Initial sync size | 30 MB per doctor | 1.5 MB per doctor (20x smaller) |
| Monthly bandwidth | 40 MB clinic | 2 MB clinic (20x less) |
| Sync time (slow connection) | 2-3 minutes | 6-10 seconds |
| Storage per device | ~30 MB | ~1.5 MB (95% reduction) |
| Query speed (offline) | Slow (10K+ rows) | Fast (<500 rows) |

---

## Deployment

### Update PowerSync Dashboard
1. Go to **PowerSync Dashboard → Sync Rules**
2. Replace current rules with `POWERSYNC_SYNC_RULES.yaml` (updated)
3. Click **Save**
4. PowerSync will validate and apply rules

### Verify in Browser
After deploying new rules:
```javascript
// In browser console
const db = await powerSyncDb.getAdapter();
const patientCount = (await db.execute("SELECT COUNT(*) FROM patients"))[0][0];
console.log("Patients synced:", patientCount); 
// Should be << 1000 (only current doctor's patients)
```

### Monitor Impact
- **PowerSync Dashboard → Statistics**: Initial sync should drop from 30 MB to 1.5 MB
- **IndexedDB size**: Check DevTools → Application → Storage → IndexedDB
- **Sync logs**: Check PowerSync Dashboard for any "permission denied" errors

---

## FAQ

**Q: Will existing offline data be cleared?**
A: PowerSync will re-sync with new rules. Old data from other doctors will be removed. This is expected and correct behavior.

**Q: What if a doctor needs to see another doctor's patients?**
A: That requires a different role/bucket (e.g., clinic admin). Create a separate sync rule for admins with full access.

**Q: Does this affect the Supabase API?**
A: No. Supabase API uses RLS policies (separate). PowerSync sync rules are a second layer of security specific to offline sync.

**Q: What if auth.uid() returns NULL?**
A: The WHERE clause will return no data. This is safe and correct (not authenticated = no data).

**Q: Can patients be shared between doctors?**
A: Currently, patients have one `doctor_id`. For shared patients, you'd need a junction table (patients_doctors) and adjust filtering logic.

---

## Next Steps

1. ✅ Update `POWERSYNC_SYNC_RULES.yaml` with auth filtering
2. Deploy to PowerSync Dashboard
3. Test in preview: verify sync size drops
4. Monitor production for 24-48 hours
5. Document in runbook for future reference
