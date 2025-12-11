# Database Migration Guide - Dexie to PowerSync

## ✅ What Was Done

### 1. Removed Old Database Files
- ❌ Deleted `src/db/localDB.ts` (Dexie database)
- ❌ Deleted `src/lib/localDb.ts` (Dexie database)
- ✅ Created `src/lib/powerSyncHelpers.ts` (PowerSync utilities)

### 2. Removed Dependencies
- ❌ Removed `dexie-react-hooks` from `package.json`

### 3. PowerSync Helpers Created
New file: `src/lib/powerSyncHelpers.ts` provides:
- **Hooks**: `usePatients()`, `useVisits()`, `useIVFCycles()`, etc.
- **Database operations**: `db.patients.add()`, `db.visits.add()`, etc.

## 🔄 Migration Steps for Each File

### Files That Need Updates:
1. `pages/IvfJourney.tsx`
2. `pages/Reception.tsx`
3. `pages/PatientMasterRecord.tsx`
4. `pages/ObstetricsDashboard.tsx`
5. `pages/Gynecology.tsx`
6. `pages/Dashboard.tsx`
7. `services/visitsService.ts`
8. `components/SyncStatus.tsx`

### Migration Pattern:

**Before (Dexie):**
```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDB } from '../src/db/localDB';

const patients = useLiveQuery(() => dexieDB.patients.toArray(), []) || [];
```

**After (PowerSync):**
```typescript
import { usePatients } from '../src/lib/powerSyncHelpers';

const { data: patients = [] } = usePatients();
```

## 📝 Next Steps

Run `npm install` to update dependencies, then update each file to use PowerSync helpers.
