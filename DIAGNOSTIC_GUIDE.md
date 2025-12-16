# 🔍 Complete Diagnostic Guide - Data Load Verification

## Quick Test (في المتصفح Browser Console)

Copy and paste this in your browser console (F12) to test all sections at once:

```javascript
// Copy entire TEST_ALL_SECTIONS.ts code from the project root
```

Or run in browser console:
```javascript
alert('Check browser console (F12) for test results');
```

---

## Step-by-Step Section Testing

### ✅ Section 1: RECEPTION (استقبال)
**What to test:** Patient list loads and registration works

1. Go to Reception page
2. Check that patient list appears in the "Directory" tab
3. Try registering a new patient
4. **Expected Console Logs:**
   ```
   🚀 Fetching patients from Supabase...
   ✅ Patients fetched: X
   📍 Mapping patient: [id] [name]
   ```

**❌ If not working:**
- Check if patient list is empty → See [RLS Policies](#rls-check)
- Check if error in console → See [Error Troubleshooting](#errors)

---

### ✅ Section 2: GYNECOLOGY (أمراض نسائية)
**What to test:** Patient selection and visit history

1. Go to Gynecology page
2. Select a patient from the dropdown
3. Check if "Patient History" sidebar shows visits
4. **Expected Console Logs:**
   ```
   🔍 Fetching history for Patient ID: [id]
   📊 Found: X general visits, Y pregnancies, Z IVF cycles
   ✅ Total combined history: N items
   ```

**❌ If not working:**
- Patient dropdown empty → Same as Reception
- History sidebar empty → Check [Visits Table](#table-check) is populated

---

### ✅ Section 3: IVF JOURNEY (برنامج الحقن المجهري)
**What to test:** IVF cycles load with stimulation logs

1. Go to IVF Journey page
2. Select a patient with IVF cycles
3. Check if cycle data and charts load
4. **Expected Console Logs:**
   ```
   🚀 Fetching IVF cycles from Supabase...
   ✅ Cycles fetched: X
   ✅ Stimulation logs fetched: Y
   📍 Mapping cycle: [cycle-id]
   ```

**❌ If not working:**
- No cycles showing → Check [IVF Cycles Table](#table-check)
- Logs not showing → Check stimulation_logs table has data

---

### ✅ Section 4: OBSTETRICS (الأمومة والتوليد)
**What to test:** Pregnancy data and ANC visits

1. Go to Obstetrics Dashboard
2. Select a pregnant patient
3. Check if pregnancy data, ANC visits, and biometry scans load
4. **Expected Console Logs:**
   ```
   ℹ️ No pregnancy record found (OK, if no pregnant patients)
   ✅ ANC visits: X
   ```

**❌ If not working:**
- Pregnancy not loading → Check [Pregnancies Table](#table-check)
- ANC visits empty → Check antenatal_visits table

---

### ✅ Section 5: MAIN DASHBOARD (لوحة التحكم)
**What to test:** Statistics and charts display

1. Go to Dashboard page
2. Check if patient count, cycle count, and charts appear
3. **Expected Console Logs:**
   ```
   📊 Dashboard: Fetching data from Supabase...
   ✅ Dashboard: Fetched X patients and Y cycles
   ```

**❌ If not working:**
- Empty stats → Check [Patients](#rls-check) and [IVF Cycles](#table-check) tables

---

### ✅ Section 6: PATIENT RECORDS (ملفات المرضى)
**What to test:** Patient file list and visit history

1. Go to Patient Records page
2. Select a patient
3. Check if files list and visit history display
4. **Expected Console Logs:**
   ```
   📁 PatientMasterRecord: Fetching files for patient: [id]
   ✅ PatientMasterRecord: Fetched X files
   ```

**❌ If not working:**
- Files empty → Check patient_files table
- History empty → See [Visits Table](#table-check)

---

## 🔧 Troubleshooting

### <a name="rls-check"></a>1️⃣ CHECK RLS POLICIES (Most Common Issue)

**In Supabase Dashboard:**
1. Go to: `Authentication` → `Policies`
2. For each table, check if policies allow your user:

```sql
-- Your authenticated user should be able to read from:
patients        -- check policy allows SELECT without doctor_id filter
ivf_cycles      -- check policy allows SELECT
visits          -- check policy allows SELECT
pregnancies     -- check policy allows SELECT
antenatal_visits -- check policy allows SELECT
biometry_scans  -- check policy allows SELECT
```

**The Policy Should Look Like:**
```sql
-- ✅ CORRECT (allows data to show)
CREATE POLICY "Users can read all patients"
ON patients FOR SELECT
TO authenticated
USING (true);

-- ❌ WRONG (blocks data)
CREATE POLICY "Users can read own patients"
ON patients FOR SELECT
TO authenticated
USING (doctor_id = auth.uid());
```

**Fix:** If policies are too restrictive, update them in Supabase to allow authenticated users to read without doctor_id filtering.

---

### <a name="table-check"></a>2️⃣ CHECK IF TABLES HAVE DATA

**In Supabase SQL Editor:**

```sql
-- Check patients table
SELECT COUNT(*) as patient_count, COUNT(DISTINCT doctor_id) as doctors
FROM patients;

-- Check IVF cycles
SELECT COUNT(*) as cycle_count FROM ivf_cycles;

-- Check visits
SELECT COUNT(*) as visit_count FROM visits;

-- Check pregnancies
SELECT COUNT(*) as pregnancy_count FROM pregnancies;

-- Check ANC visits
SELECT COUNT(*) as anc_count FROM antenatal_visits;

-- Check your doctor exists
SELECT id, name, user_id FROM doctors WHERE user_id = 'YOUR_USER_ID';
```

**Expected:** All counts should be > 0 (or the relevant ones for your test data)

---

### <a name="errors"></a>3️⃣ COMMON ERRORS & FIXES

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `PGRST301 Requested object not found` | Table doesn't exist | Create table in Supabase |
| `42501 - permission denied` | RLS policy blocking read | Update RLS policy (see above) |
| `Auth error: Not authenticated` | User not logged in | Log out and back in |
| `Doctor profile missing` | Doctor record not in DB | Run ensureDoctorRecord() - happens auto on login |
| Empty patient list | Multiple possible causes | Check RLS + Data |
| Network error "Failed to fetch" | Supabase down or offline | Check internet, try refresh |

---

### 4️⃣ ENABLE DETAILED LOGGING

**In your browser console, run:**

```javascript
// Set log level to verbose
localStorage.setItem('supabase-debug', 'true');

// Then refresh page and watch console for detailed logs
```

---

## 🗂️ Database Structure Check

Run this SQL in Supabase to verify all tables exist:

```sql
-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- antenatal_visits
-- biometry_scans
-- doctors
-- infertility_workups
-- ivf_cycles
-- patient_files
-- patients
-- pregnancies
-- stimulation_logs
-- visits
```

---

## 🔐 Authentication Check

**In browser console:**

```javascript
// Check if user is logged in
async function checkAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('Auth error:', error);
  return user;
}

checkAuth();

// Check doctor profile
async function checkDoctor() {
  const user = await checkAuth();
  if (user) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', user.id);
    console.log('Doctor profile:', data);
    console.log('Doctor error:', error);
  }
}

checkDoctor();
```

---

## 📋 Quick Checklist

- [ ] User is logged in (check browser console via `checkAuth()`)
- [ ] Doctor record exists in database
- [ ] RLS policies allow authenticated users to read
- [ ] Tables have data (run SQL count queries above)
- [ ] No red errors in console (F12)
- [ ] All 6 sections show data or appropriate "no data" messages

---

## 🎯 Expected Behavior

| Section | Expected Result |
|---------|-----------------|
| **Reception** | Patient list shows (or "No patients" if new doctor) |
| **Gynecology** | Can select patient + history shows |
| **IVF Journey** | Shows IVF cycles (or "No cycles" if none exist) |
| **Obstetrics** | Shows pregnancy data for pregnant patients |
| **Dashboard** | Shows statistics and charts |
| **Patient Records** | Shows files + visit history |

---

## 🚀 Still Not Working?

1. **Check console (F12)** for any red error messages
2. **Copy the full error** and provide it
3. **Run the SQL checks above** and share results
4. **Screenshot your RLS policies** from Supabase
5. **Contact support** with this information

---

## 📞 Quick Sanity Check

Run this in browser console to confirm Supabase connection:

```javascript
async function sanityCheck() {
  console.log('🧪 Sanity Check Starting...\n');
  
  try {
    // Check 1: Supabase initialized
    console.log('1. Supabase Connection:', supabase.auth.getSession() ? '✅' : '❌');
    
    // Check 2: Can read patients
    const { data: patients, error: pError } = await supabase
      .from('patients')
      .select('count(*)', { count: 'exact' });
    console.log(`2. Patients Readable: ${pError ? '❌ ' + pError.message : '✅'}`);
    
    // Check 3: Can read IVF cycles
    const { data: cycles, error: cError } = await supabase
      .from('ivf_cycles')
      .select('count(*)', { count: 'exact' });
    console.log(`3. IVF Cycles Readable: ${cError ? '❌ ' + cError.message : '✅'}`);
    
    // Check 4: Auth user
    const { data: { user }, error: uError } = await supabase.auth.getUser();
    console.log(`4. User Logged In: ${user ? '✅ ' + user.email : '❌ Not logged in'}`);
    
    console.log('\n✅ Sanity check complete!');
  } catch (err) {
    console.error('❌ Sanity check failed:', err);
  }
}

sanityCheck();
```

---

## 📌 Summary

**All 6 sections are connected to Supabase.** The issue "نفس المشكلة" (same problem) is likely due to:

1. **RLS Policies blocking reads** ← Most likely
2. **User not authenticated** ← Check login
3. **No test data in database** ← Create test records
4. **Network/Supabase connectivity** ← Refresh page

**Fix Priority:**
1. Check RLS policies first
2. Verify user is logged in
3. Check tables have data
4. Check browser console for errors
