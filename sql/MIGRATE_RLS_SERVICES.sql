-- Migration: RLS for services table
-- Ensures clinic_id references doctors.id and RLS uses doctor ids (not auth.user ids)

-- Enable RLS
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;

-- Drop old policies (names may vary; safe to attempt drop)
DROP POLICY IF EXISTS "doctor_view_all_services" ON public.services;
DROP POLICY IF EXISTS "secretary_view_own_services" ON public.services;
DROP POLICY IF EXISTS "secretary_insert_services" ON public.services;
DROP POLICY IF EXISTS "secretary_update_own_services" ON public.services;
DROP POLICY IF EXISTS "secretary_delete_own_services" ON public.services;
DROP POLICY IF EXISTS "doctor_manage_services" ON public.services;
DROP POLICY IF EXISTS "all_users_select_services" ON public.services;

-- POLICY: Doctors and secretaries (via their doctor id) can SELECT services belonging to their doctor record
CREATE POLICY "doctor_or_secretary_select_services" ON public.services
  FOR SELECT
  USING (
    clinic_id IN (public.get_doctor_id(), public.get_secretary_doctor_id())
  );

-- POLICY: INSERT - doctors may insert for their own doctor id; secretaries may insert for their doctor_id but must set created_by = auth.uid()
CREATE POLICY "insert_by_doctor_or_secretary" ON public.services
  FOR INSERT
  WITH CHECK (
    (
      auth.role() = 'doctor' AND clinic_id = public.get_doctor_id()
    ) OR (
      auth.role() = 'secretary' AND clinic_id = public.get_secretary_doctor_id() AND created_by = auth.uid()
    ) OR (
      auth.role() IN ('owner','admin')
    )
  );

-- POLICY: UPDATE - doctors and their secretaries may update services belonging to their doctor; secretaries limited to records they created
CREATE POLICY "update_by_doctor_or_own_secretary" ON public.services
  FOR UPDATE
  USING (
    clinic_id IN (public.get_doctor_id(), public.get_secretary_doctor_id())
  )
  WITH CHECK (
    (
      auth.role() = 'doctor' AND clinic_id = public.get_doctor_id()
    ) OR (
      auth.role() = 'secretary' AND clinic_id = public.get_secretary_doctor_id() AND created_by = auth.uid()
    ) OR (
      auth.role() IN ('owner','admin')
    )
  );

-- POLICY: DELETE - only doctors (owner/admin) or admin roles may delete
CREATE POLICY "delete_by_doctor_or_admin" ON public.services
  FOR DELETE
  USING (
    auth.role() IN ('owner','admin') OR clinic_id = public.get_doctor_id()
  );

-- Optional: allow read-only access for other authenticated users to nothing (deny by default)
-- No broad public policy is created; authenticated users will only be able to act according to above policies.

-- Notes:
-- * This migration assumes `public.get_doctor_id()` and `public.get_secretary_doctor_id()` exist and return the `doctors.id` for the current session user (or NULL).
-- * Ensure the FK on services.clinic_id references public.doctors(id) and that `doctors` records exist for each auth user (use authService.ensureDoctorRecord on sign-up).

-- Grant usage to authenticated role if you use a specific role (supabase typically handles this via policies)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

-- End of migration
