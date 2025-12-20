# Secretary Dashboard Implementation Plan

## Overview
Create a professional secretary/reception interface with permissions to:
- Add/manage patients
- Book and manage appointments
- View clinic schedule

**Email**: reception@clinic.com

---

## Phase 1: Database & Auth Setup ✅ COMPLETED

### [x] Review current structure
- Reviewed doctors table, patients table, appointments concept
- No existing role system or appointments table

### [x] Database migrations
- **File created**: `SECRETARY_SETUP.sql`
- Adds `user_role` column to doctors table (values: 'doctor', 'secretary', 'admin')
- Creates appointments table with proper schema
- Updates RLS policies to support secretary role
- Adds indexes for performance
- **🔴 ACTION REQUIRED**: Run `SECRETARY_SETUP.sql` in Supabase SQL Editor

### [x] Auth system enhancements
- **Updated `authService.ts`** with:
  - `signup()` now accepts `role` parameter ('doctor' or 'secretary')
  - `getUserRole()` to detect user role
  - `getSecretaryProfile()` to fetch secretary data
  - Fixed `ensureDoctorRecord()` to set user_role

- **Updated `Login.tsx`** with:
  - Toggle between doctor and secretary signup
  - Secretary selector to pick assigned doctor
  - Role-aware signup flow
  - Doctor list dropdown for secretaries

- **Updated `types.ts`** with:
  - `Secretary` interface
  - Updated `Doctor` interface with user_role and secretary_doctor_id
  - Updated `Appointment` interface with all required fields

- **Created `appointmentsService.ts`** with:
  - `createAppointment()` - Create new appointment
  - `updateAppointment()` - Update appointment
  - `cancelAppointment()` - Cancel appointment
  - `getAppointmentsByDoctor()` - Fetch doctor's appointments
  - `getAppointmentsBySecretary()` - Fetch secretary's appointments
  - `getPatientAppointments()` - Fetch patient's appointments
  - `getAppointmentById()` - Get single appointment
  - `getAvailableSlots()` - Calculate available time slots
  - `searchAppointments()` - Search appointments

---

## Phase 2: Frontend Implementation (NEXT)

### [ ] Role-based routing
1. Update `App.tsx` to detect user role after login
2. Route doctors to `Dashboard.tsx`
3. Route secretaries to new `SecretaryDashboard.tsx`
4. Add role detection in login flow

### [ ] Secretary Dashboard
1. Create `SecretaryDashboard.tsx` component
2. Implement patient management interface
3. Add appointment booking system
4. Create appointment calendar view

### [ ] Components
1. Patient quick-add modal
2. Appointment scheduler
3. Clinic schedule viewer
4. Patient search/filter

---

## Phase 3: Services & Integration

### [ ] Service updates
1. ✅ Already created `appointmentsService.ts`
2. All secretary-specific queries ready
3. Auth system ready for secretary login

### [ ] Testing
1. Test patient registration as secretary
2. Test appointment booking
3. Verify RLS policies work correctly
4. Test role-based access control

---

## Phase 4: UI/UX Polish

### [ ] Styling & Branding
1. Match clinic branding colors
2. Arabic language support
3. Mobile responsiveness

### [ ] Additional features
1. Appointment reminders
2. Patient quick search
3. Clinic statistics dashboard
4. Doctor availability management

---

## Implementation Checklist
- [x] Database: user_role column (in SECRETARY_SETUP.sql)
- [x] Database: appointments table (in SECRETARY_SETUP.sql)
- [x] Database: RLS policies update (in SECRETARY_SETUP.sql)
- [x] Auth: Secretary signup flow
- [x] Auth: Role detection
- [x] Auth: Secretary profile fetch
- [x] Service: appointmentsService.ts
- [ ] Frontend: Role-based routing
- [ ] Component: SecretaryDashboard
- [ ] Component: AppointmentScheduler
- [ ] Testing: Full workflow verification
- [ ] Build & lint checks

---

## 🔴 CRITICAL: Next Steps

### 1. Run Database Migration
```
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content of SECRETARY_SETUP.sql
4. Click Run
5. Verify all tables and policies created successfully
```

### 2. Test Secretary Signup
```
1. Go to Login page
2. Click "ليس لديك حساب؟ إنشاء حساب" (Create Account)
3. Click "سكرتيرة" (Secretary) button
4. Fill in name, phone, and select a doctor
5. Use email: reception@clinic.com
6. Create password
7. Verify signup succeeds
```

### 3. Create SecretaryDashboard Component
- After migration is verified and secretary signup works
- Will include patient management and appointment scheduling

---

## Notes
- Secretary linked to doctor (secretary can manage one clinic)
- Appointments visible only to doctor & secretary who created them
- Use RTL/Arabic support throughout
- Keep design consistent with existing UI
- RLS policies ensure data isolation by role
