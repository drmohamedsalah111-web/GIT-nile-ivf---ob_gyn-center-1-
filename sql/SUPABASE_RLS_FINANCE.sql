-- RLS policies to let doctors view all financial records, secretaries view their own
-- Run in Supabase SQL Editor. Adjust role names and user id checks to match your auth setup.

-- Enable RLS on invoices
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (roles handled in JWT claims) to select based on role
-- Doctor role: allow full read access
DROP POLICY IF EXISTS "doctor_view_all_invoices" ON public.invoices;
CREATE POLICY "doctor_view_all_invoices" ON public.invoices
  FOR SELECT
  USING (
    auth.role() = 'doctor' OR auth.role() = 'owner' OR auth.role() = 'admin'
  );

-- Secretary: allow reading invoices they created (created_by)
DROP POLICY IF EXISTS "secretary_view_own_invoices" ON public.invoices;
CREATE POLICY "secretary_view_own_invoices" ON public.invoices
  FOR SELECT
  USING (
    auth.role() = 'secretary' AND created_by = auth.uid()
  );

-- Fallback: authenticated users cannot see other invoices
-- Allow secretaries (POS) to insert invoices for their clinic and set created_by = auth.uid()
DROP POLICY IF EXISTS "secretary_insert_invoices" ON public.invoices;
CREATE POLICY "secretary_insert_invoices" ON public.invoices
  FOR INSERT
  WITH CHECK (
    auth.role() = 'secretary' AND created_by = auth.uid()
  );

-- Allow secretaries to update invoices they created (limited fields)
DROP POLICY IF EXISTS "secretary_update_own_invoices" ON public.invoices;
CREATE POLICY "secretary_update_own_invoices" ON public.invoices
  FOR UPDATE
  USING (
    auth.role() = 'secretary' AND created_by = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'secretary' AND created_by = auth.uid()
  );

-- Allow secretaries to delete invoices they created (if desired)
DROP POLICY IF EXISTS "secretary_delete_own_invoices" ON public.invoices;
CREATE POLICY "secretary_delete_own_invoices" ON public.invoices
  FOR DELETE
  USING (
    auth.role() = 'secretary' AND created_by = auth.uid()
  );

-- Allow doctors to insert/update/select (doctors may manage clinic records)
DROP POLICY IF EXISTS "doctor_manage_invoices" ON public.invoices;
CREATE POLICY "doctor_manage_invoices" ON public.invoices
  FOR ALL
  USING (
    auth.role() = 'doctor' OR auth.role() = 'owner' OR auth.role() = 'admin'
  )
  WITH CHECK (
    auth.role() = 'doctor' OR auth.role() = 'owner' OR auth.role() = 'admin'
  );

-- If you use a service_role (server) for inserts, create appropriate policies or use the service key.
