-- RLS policies to let doctors view all financial records, secretaries view their own
-- Run in Supabase SQL Editor. Adjust role names and user id checks to match your auth setup.

-- Enable RLS on invoices
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (roles handled in JWT claims) to select based on role
-- Doctor role: allow full read access
CREATE POLICY "doctor_view_all_invoices" ON public.invoices
  FOR SELECT
  USING (
    auth.role() = 'doctor' OR auth.role() = 'owner'
  );

-- Secretary: allow reading invoices they created (created_by)
CREATE POLICY "secretary_view_own_invoices" ON public.invoices
  FOR SELECT
  USING (
    auth.role() = 'secretary' AND created_by = auth.uid()
  );

-- Fallback: authenticated users cannot see other invoices

-- If you also need insert/update/delete rules for secretary (POS), add policies accordingly.
