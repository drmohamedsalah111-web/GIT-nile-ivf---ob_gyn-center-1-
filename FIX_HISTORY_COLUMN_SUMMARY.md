# 🔧 Fix: "Could not find the 'history' column" Error

## Problem
The application was failing to add patients with the error:
```
Failed to add patient: Could not find the 'history' column of 'patients' in the schema cache
```

## Root Cause
The database schema was updated to use `medical_history` (JSONB) instead of `history` (TEXT), but the application code was still trying to insert data into the old `history` column.

## Solution
Updated all application code to use `medical_history` instead of `history`:

### Files Updated

#### 1. TypeScript Interfaces & Hooks
- [src/hooks/usePatients.ts](src/hooks/usePatients.ts)
  - Updated `Patient` interface: `history` → `medical_history`
  - Updated `addPatient` and `updatePatient` functions

#### 2. Service Files
- [src/services/PatientService.ts](src/services/PatientService.ts)
  - Updated `PatientData` interface
  - Updated `addPatient` and `registerPatient` methods to insert `medical_history: {}` (JSONB)
  
- [src/services/patients.service.ts](src/services/patients.service.ts) (Angular)
  - Updated `AddPatientPayload` interface

#### 3. Page Components
- [pages/Reception.tsx](pages/Reception.tsx)
  - Updated form state: `history` → `medical_history`
  - Updated form field binding
  - Updated `addPatient` call to convert string to JSON object

- [pages/SecretaryDashboard.tsx](pages/SecretaryDashboard.tsx)
  - Updated patient insert to use `medical_history: { notes: ... }`

#### 4. Dashboard Files
- [update_dashboard.js](update_dashboard.js)
- [update_dashboard.py](update_dashboard.py)
  - Updated patient insert statements

#### 5. Edge Function
- [supabase/functions/add-patient/index.ts](supabase/functions/add-patient/index.ts)
  - Updated `RequestBody` interface
  - Changed insert to use `medical_history: body.medical_history || {}`

#### 6. Angular Components
- [src/components/add-patient-form/add-patient-form.component.ts](src/components/add-patient-form/add-patient-form.component.ts)
  - Updated form field: `history` → `medical_history`
  - Updated getter method

#### 7. Type Definitions
- [types.ts](types.ts)
  - Updated `Patient` interface: `history?: string` → `medical_history?: any`

## Database Fix
Run [FIX_HISTORY_COLUMN.sql](FIX_HISTORY_COLUMN.sql) to ensure the database schema is correct:
```sql
-- This script will:
-- 1. Add medical_history (JSONB) column if missing
-- 2. Migrate data from old history column
-- 3. Drop the old history column
-- 4. Verify the changes
```

## Key Changes Summary

| Before | After |
|--------|-------|
| `history: string` (TEXT) | `medical_history: any` (JSONB) |
| `history: 'some text'` | `medical_history: { notes: 'some text' }` |
| `history: null` | `medical_history: {}` |

## Testing
After applying these changes:
1. ✅ Secretaries can add new patients
2. ✅ The `medical_history` field is properly stored as JSONB
3. ✅ No more "column not found" errors
4. ✅ Existing data is preserved in the new format

## Notes
- The `medical_history` column uses JSONB for structured medical data
- Empty histories are stored as `{}` instead of `null`
- Text notes are wrapped in `{ notes: "text" }` format
- The [dbService.ts](services/dbService.ts) already had proper conversion logic
