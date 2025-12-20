# Clinic Management System - Components Integration Guide

This document explains how to integrate the three new page components (`AddPatient`, `PatientProfile`, and `DoctorDashboard`) into your existing Clinic Management System.

## Components Overview

### 1. **AddPatient.tsx** (Secretary View)
**Location:** `pages/AddPatient.tsx`

**Purpose:** Allows secretaries to register new patients and assign them to a doctor.

**Key Features:**
- ✅ Fetch list of doctors from `doctors` table
- ✅ Doctor dropdown selector (mandatory)
- ✅ Form validation for required fields (name, phone, doctor_id)
- ✅ Phone number regex validation
- ✅ Insert patient data with `doctor_id` to `patients` table
- ✅ Loading and error states with toast notifications
- ✅ RTL Arabic language support

**Props:** None (standalone component)

**Database Operations:**
```typescript
// Fetches doctors
supabase.from('doctors')
  .select('id, name')
  .eq('user_role', 'doctor')

// Inserts patient with doctor_id
supabase.from('patients')
  .insert([{ name, age, phone, husband_name, history, doctor_id }])
```

**Integration in App.tsx:**
```typescript
import AddPatient from './pages/AddPatient';

// In renderContent switch statement:
case Page.ADD_PATIENT:
  return <AddPatient />;
```

---

### 2. **PatientProfile.tsx** (Patient Detail View)
**Location:** `pages/PatientProfile.tsx`

**Purpose:** Displays full patient information and provides actions to book appointments and request lab tests.

**Key Features:**
- ✅ Fetch patient data by ID
- ✅ Display assigned doctor's name (via `doctor_id` foreign key)
- ✅ Book Appointment modal with date/time picker
- ✅ Request Lab Tests modal with dynamic test list management
- ✅ Medical history display
- ✅ Patient stats (age, phone, husband name)
- ✅ Modals for appointment booking and lab requests

**Props:**
```typescript
interface PatientProfileProps {
  patientId: string;        // Patient ID to display
  onBack?: () => void;      // Callback when user clicks back
}
```

**Usage Example:**
```typescript
<PatientProfile 
  patientId={selectedPatientId} 
  onBack={() => setActivePage(Page.HOME)}
/>
```

**Database Operations:**
```typescript
// Fetch patient
supabase.from('patients').select('*').eq('id', patientId).single()

// Fetch assigned doctor
supabase.from('doctors').select('*').eq('id', patient.doctor_id).single()

// Book appointment
supabase.from('appointments').insert([{
  patient_id, doctor_id, appointment_date, status, visit_type, created_by
}])

// Request lab
supabase.from('lab_requests').insert([{
  patient_id, doctor_id, test_names, status, created_by
}])
```

**Modal Modals:**
1. **Book Appointment Modal**
   - Date picker (future dates only)
   - Time picker
   - Visit type selector (Consultation, Follow-up, Procedure)
   - Notes textarea
   - Submit button

2. **Request Lab Modal**
   - Test input field with Add button
   - List of selected tests with remove buttons
   - Notes textarea
   - Submit button

---

### 3. **DoctorDashboard.tsx** (Doctor View)
**Location:** `pages/DoctorDashboard.tsx`

**Purpose:** Displays all patients assigned to the logged-in doctor with a clean, professional table/card view.

**Key Features:**
- ✅ Auto-detect current logged-in doctor
- ✅ Fetch all patients WHERE `doctor_id` = current doctor's ID
- ✅ Fetch last visit date for each patient (from appointments)
- ✅ Display stats: Total patients, Appointments today, Pending lab requests
- ✅ Responsive design (mobile cards, desktop table)
- ✅ Search functionality (by name or phone)
- ✅ Add Patient button
- ✅ View patient details button for each row

**Props:**
```typescript
interface DoctorDashboardProps {
  onViewPatient?: (patientId: string) => void;  // Callback to view patient
  onAddPatient?: () => void;                     // Callback to add patient
}
```

**Usage Example:**
```typescript
<DoctorDashboard 
  onViewPatient={(patientId) => {
    setSelectedPatientId(patientId);
    setActivePage(Page.PATIENT_PROFILE);
  }}
  onAddPatient={() => setActivePage(Page.ADD_PATIENT)}
/>
```

**Database Operations:**
```typescript
// Fetch all patients for doctor
supabase.from('patients')
  .select('*')
  .eq('doctor_id', doctorId)

// Fetch completed appointments for last visit dates
supabase.from('appointments')
  .select('patient_id, appointment_date')
  .in('patient_id', patientIds)
  .eq('status', 'Completed')

// Fetch statistics
supabase.from('patients').select('id', { count: 'exact' })
supabase.from('appointments').select('id', { count: 'exact' })
supabase.from('lab_requests').select('id', { count: 'exact' })
```

---

## Integration Steps

### Step 1: Update `types.ts`
✅ Already done! Added:
- `LabRequest` interface for lab requests

### Step 2: Update `App.tsx`
Add imports and routing:

```typescript
import AddPatient from './pages/AddPatient';
import PatientProfile from './pages/PatientProfile';
import DoctorDashboard from './pages/DoctorDashboard';

// Add state for selected patient
const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

// In renderContent(), update the switch statement:
case Page.ADD_PATIENT:
  return <AddPatient />;

case Page.DOCTOR_DASHBOARD:
  return (
    <DoctorDashboard 
      onViewPatient={(patientId) => {
        setSelectedPatientId(patientId);
        setActivePage(Page.PATIENT_PROFILE);
      }}
      onAddPatient={() => setActivePage(Page.ADD_PATIENT)}
    />
  );

case Page.PATIENT_PROFILE:
  return selectedPatientId ? (
    <PatientProfile 
      patientId={selectedPatientId}
      onBack={() => setActivePage(Page.DOCTOR_DASHBOARD)}
    />
  ) : null;
```

### Step 3: Update `types.ts` Enum
Add new page types:

```typescript
export enum Page {
  HOME = 'home',
  RECEPTION = 'reception',
  ADD_PATIENT = 'add_patient',
  DOCTOR_DASHBOARD = 'doctor_dashboard',
  PATIENT_PROFILE = 'patient_profile',
  // ... other pages
}
```

### Step 4: Add Navigation to Sidebar
In `components/Sidebar.tsx`, add menu items:

```typescript
{
  label: 'Patients',
  icon: Users,
  page: Page.DOCTOR_DASHBOARD
},
{
  label: 'Add Patient',
  icon: Plus,
  page: Page.ADD_PATIENT
}
```

---

## Database Considerations

### Required Tables
The system assumes these tables exist in Supabase:

1. **doctors** table
   - `id` (UUID, PK)
   - `name` (TEXT)
   - `specialization` (TEXT, optional)
   - `phone` (TEXT, optional)
   - `user_role` (TEXT: 'doctor', 'secretary', 'admin')

2. **patients** table
   - `id` (UUID, PK)
   - `name` (TEXT, required)
   - `age` (INTEGER)
   - `phone` (TEXT, required)
   - `husband_name` (TEXT, optional)
   - `history` (TEXT, optional)
   - `doctor_id` (UUID, FK → doctors.id)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

3. **appointments** table
   - `id` (UUID, PK)
   - `patient_id` (UUID, FK → patients.id)
   - `doctor_id` (UUID, FK → doctors.id)
   - `appointment_date` (TIMESTAMP)
   - `status` (TEXT: 'Scheduled', 'Waiting', 'Completed', 'Cancelled', 'No Show')
   - `visit_type` (TEXT: 'Consultation', 'Follow-up', 'Procedure')
   - `notes` (TEXT, optional)
   - `created_by` (UUID)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

4. **lab_requests** table
   - `id` (UUID, PK)
   - `patient_id` (UUID, FK → patients.id)
   - `doctor_id` (UUID, FK → doctors.id)
   - `test_names` (TEXT[], array of test names)
   - `status` (TEXT: 'Pending', 'Completed', 'Cancelled')
   - `notes` (TEXT, optional)
   - `created_by` (UUID)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### RLS Policies
Ensure your Supabase RLS policies allow:

1. **Secretaries** can:
   - Read doctors (for dropdown in AddPatient)
   - Insert patients (with their assigned doctor_id)
   - Read/Insert appointments
   - Read/Insert lab_requests

2. **Doctors** can:
   - Read all their patients (where doctor_id = current doctor)
   - Insert/Update appointments
   - Insert/Update lab_requests
   - Read lab_requests for their patients

---

## UI/UX Features

### AddPatient.tsx
- ✅ Gradient header with teal/cyan colors
- ✅ Required field indicators (*)
- ✅ Loading spinner during doctor fetch
- ✅ Form validation with inline error messages
- ✅ Doctor dropdown with error if no doctors available
- ✅ Success toast on patient creation
- ✅ Form clears after successful submission

### PatientProfile.tsx
- ✅ Blue gradient header with patient name
- ✅ Grid layout for patient info (responsive)
- ✅ Medical history section
- ✅ Two action buttons (Book Appointment, Request Lab)
- ✅ Beautiful modals with gradient headers
- ✅ Modal close button (X) and Cancel button
- ✅ Loading states for submissions

### DoctorDashboard.tsx
- ✅ Stat cards with icons and colors
- ✅ Mobile-first responsive design
- ✅ Cards view for mobile, table for desktop
- ✅ Search bar with debouncing
- ✅ Add Patient button in header
- ✅ Patient avatars with initials
- ✅ Last visit date displayed for each patient
- ✅ Empty state messaging

---

## Error Handling

All components include:
- ✅ Try-catch blocks for async operations
- ✅ Supabase error handling
- ✅ Toast notifications for errors
- ✅ Loading states with spinners
- ✅ Error state messages with icons
- ✅ Back navigation/cancellation options

---

## Testing Checklist

- [ ] AddPatient - Form submission with all fields
- [ ] AddPatient - Doctor dropdown loads correctly
- [ ] AddPatient - Validation prevents submission without doctor
- [ ] PatientProfile - Load patient data by ID
- [ ] PatientProfile - Book appointment with future date
- [ ] PatientProfile - Request lab with multiple tests
- [ ] DoctorDashboard - Display all doctor's patients
- [ ] DoctorDashboard - Search functionality
- [ ] DoctorDashboard - Stats calculations
- [ ] DoctorDashboard - Mobile responsive design
- [ ] All components - Error states
- [ ] All components - Loading states

---

## Dependencies

All components use:
- **React Hooks:** useState, useEffect
- **Supabase Client:** @supabase/supabase-js
- **Lucide Icons:** lucide-react
- **Toast Notifications:** react-hot-toast
- **Tailwind CSS:** for styling

No additional dependencies required!

---

## Notes

- Components are fully self-contained with no external props required (except for callbacks)
- All styling follows your clinic's medical-grade blue/white theme
- Responsive design works on mobile, tablet, and desktop
- Arabic language support with RTL direction
- Form validation is client-side; consider adding server-side validation
- Toast notifications provide user feedback for all actions

---

## Support & Troubleshooting

**Issue:** Doctor dropdown is empty in AddPatient
- **Solution:** Check that doctors exist in your database and have `user_role = 'doctor'`

**Issue:** PatientProfile doesn't load patient data
- **Solution:** Verify the patient ID is correct and patient record exists in database

**Issue:** Appointments/Lab requests not saving
- **Solution:** Check RLS policies allow inserts for authenticated users

**Issue:** Last visit dates not showing
- **Solution:** Verify `appointments` table has completed visits with appointment_date values

---

**Created:** December 2024
**Version:** 1.0
**Clinic System:** Nile IVF Center - Clinic Management System
