-- Migration: create helper get_clinic_id() and replace RLS on public.services
-- Idempotent where possible. Run in Supabase SQL editor or psql as a DB owner.

BEGIN;

-- 1) Create or replace `get_clinic_id()`
-- Returns the clinic owner id for the current authenticated user (coalesce of clinic_id or doctor's own id)
-- Stable, SECURITY DEFINER, and uses a safe search_path.
CREATE OR REPLACE FUNCTION public.get_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT COALESCE(clinic_id, id)
  FROM public.doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 2) Drop any existing policies on public.services that reference auth.uid()
-- This tries to detect policies referencing auth.uid() and remove them so we can replace with correct ones.
DO $$
DECLARE
  r RECORD;
  q text;
BEGIN
  FOR r IN
    SELECT oid, polname, polrelid FROM pg_policy WHERE polrelid = 'public.services'::regclass
  LOOP
    BEGIN
      q := pg_get_expr((SELECT polqual FROM pg_policy WHERE oid = r.oid), r.polrelid);
    EXCEPTION WHEN OTHERS THEN q := NULL;
    END;
    IF q IS NOT NULL AND q LIKE '%auth.uid()%' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', r.polname);
    END IF;
    BEGIN
      q := pg_get_expr((SELECT polwithcheck FROM pg_policy WHERE oid = r.oid), r.polrelid);
    EXCEPTION WHEN OTHERS THEN q := NULL;
    END;
    IF q IS NOT NULL AND q LIKE '%auth.uid()%' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', r.polname);
    END IF;
  END LOOP;
END
$$;

-- 3) Enable RLS on services (no-op if already enabled)
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;

-- 4) Create new least-privilege policies using get_clinic_id()
DROP POLICY IF EXISTS services_select_by_clinic ON public.services;
CREATE POLICY services_select_by_clinic ON public.services
  FOR SELECT
  USING (clinic_id = get_clinic_id());

DROP POLICY IF EXISTS services_modify_by_clinic ON public.services;
CREATE POLICY services_modify_by_clinic ON public.services
  FOR ALL
  USING (clinic_id = get_clinic_id())
  WITH CHECK (clinic_id = get_clinic_id());

COMMIT;

-- Notes:
-- - `get_clinic_id()` returns NULL for users with no doctor row; policies will therefore deny access.
-- - The function is SECURITY DEFINER: ensure the function owner is a role with read access to `public.doctors`.
-- - If you prefer a stricter policy for admin/owner roles, add explicit role checks (auth.role() IN (...)).
