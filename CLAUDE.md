# Development Commands & Notes

## Build & Type Checking
```bash
npm run build        # Builds the project (runs tsc then vite build)
npx tsc --noEmit    # Type check only without building
```

## Running the Application
```bash
npm run dev          # Start development server
npm run preview      # Preview production build
```

## Database Migrations
When new database tables are needed, create SQL files in the project root:
- `IVF_CYCLES_SETUP.sql` - IVF cycle management tables
- `OBSTETRICS_SETUP_V2.sql` - Obstetrics module
- `CLINICAL_DATA_MIGRATION.sql` - Visits and clinical data
- `BRANDING_SETUP.sql` - App settings and branding

To apply migrations:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy-paste the entire SQL file content
4. Click Run

## Project Structure
```
├── pages/               # React page components
├── components/          # Reusable React components
├── services/            # API and Supabase service layer
│   ├── ivfService.ts       # IVF cycle database operations
│   ├── visitsService.ts    # Patient visits
│   ├── supabaseClient.ts   # Supabase initialization
│   └── authService.ts      # Authentication
├── types.ts             # TypeScript interfaces
├── constants.ts         # Protocols, drugs, UI constants
└── [SQL files]          # Database migrations
```

## Recent Changes (IVF Assessment Fix)

### Issue: "Failed to save assessment" error
**Root Cause:** Missing `ivf_cycles` table with JSONB columns in Supabase

### Solution Applied:
1. **Created `IVF_CYCLES_SETUP.sql`**
   - Defines `ivf_cycles` table with assessment_data, lab_data, transfer_data, outcome_data (JSONB)
   - Defines `stimulation_logs` table for daily tracking
   - Sets up RLS policies for data isolation
   - Creates performance indexes

2. **Enhanced Error Handling in `ivfService.ts`**
   - Added try-catch blocks to all update functions
   - Added detailed console error logging
   - Changed error messages from generic to specific

3. **Improved Error Display in `IvfJourney.tsx`**
   - All save functions now display detailed error messages
   - Added console logging for debugging
   - Toast messages include actual error details

### How to Fix:
1. Run the `IVF_CYCLES_SETUP.sql` migration in Supabase SQL Editor
2. Refresh the browser
3. Try saving assessment again - error message will show what's wrong

## Key Services

### ivfService.ts Functions
- `calculateBMI()` - BMI calculation with alert flag
- `calculateTMSC()` - Total Motile Sperm Count (triggers ICSI at <5M)
- `classifyOvarianReserve()` - Poor/Normal/High responder classification
- `calculateMaturationRate()` - Oocyte maturation percentage
- `calculateFertilizationRate()` - 2PN fertilization percentage
- `db.getCycles()` - Fetch all cycles with stimulation logs
- `db.saveCycle()` - Create new IVF cycle
- `db.updateCycleAssessment()` - Save couple/male/female factor assessments
- `db.updateCycleLabData()` - Save OPU and embryo data
- `db.updateCycleTransfer()` - Save transfer details
- `db.updateCycleOutcome()` - Save beta-HCG and pregnancy outcomes

## IVF Journey Component
The `/ivf-journey` page has 4 tabs:

1. **Assessment Tab**
   - Couple profile (infertility duration/type, BMI)
   - Male factor with WHO 2021 parameters and TMSC calculation
   - Female factor with ovarian reserve classification
   - Tubal-uterine findings (HSG, hysteroscopy)
   - Protocol selection with "Generate Prescription" button

2. **Stimulation Tab**
   - Hormone trends chart (E2, LH, follicle progression)
   - Daily stimulation log table with FSH/HMG/E2/LH/follicles/endometrium

3. **OPU & Embryology Tab**
   - OPU day data (total oocytes, MII, MI, GV, atretic)
   - Auto-calculated maturation rate
   - Fertilization data (2PN count)
   - Auto-calculated fertilization rate
   - Embryo grading (Day 3: A/B/C, Day 5: expanded/hatching)

4. **Transfer & Outcome Tab**
   - Transfer details (date, number, embryo quality, catheter difficulty)
   - Luteal support multi-select (6 options)
   - Cycle outcome (Beta-HCG, clinical pregnancy markers)

## Debugging Tips

### "Failed to save assessment" troubleshooting:
1. Open browser console (F12)
2. Look for detailed error in red text
3. Check Supabase connection in `services/supabaseClient.ts`
4. Verify RLS policies are enabled
5. Verify doctor record exists in database

### Database Issues:
```sql
-- Check if tables exist
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('ivf_cycles', 'stimulation_logs');

-- Check doctor relationship
SELECT id, user_id FROM doctors WHERE user_id = '[current_user_id]';
```

## Performance Notes
- Current build size: ~993KB (gzip: 261KB)
- Consider code-splitting for large components if exceeds 500KB
- All database queries use indexes for optimal performance

## RLS Policy Structure
```
auth.users → doctors (via user_id)
           → patients (via doctor_id) 
           → ivf_cycles (via doctor_id)
           → stimulation_logs (via cycle_id)
```

Each doctor can only see their own data through RLS policies.
