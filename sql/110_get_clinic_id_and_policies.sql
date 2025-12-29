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
-- SELECT: allow users who resolve to the clinic or global roles
DROP POLICY IF EXISTS services_select_by_clinic ON public.services;
CREATE POLICY services_select_by_clinic ON public.services
  FOR SELECT
  USING (
    clinic_id = get_clinic_id()
    OR auth.role() IN ('owner', 'admin')
  );

-- INSERT: allow insert when the supplied clinic_id matches the caller's clinic, or caller is owner/admin
DROP POLICY IF EXISTS services_insert_by_clinic ON public.services;
CREATE POLICY services_insert_by_clinic ON public.services
  FOR INSERT
  WITH CHECK (
    clinic_id = get_clinic_id()
    OR auth.role() IN ('owner', 'admin')
  );

-- UPDATE: allow updating rows belonging to the caller's clinic (or owner/admin)
DROP POLICY IF EXISTS services_update_by_clinic ON public.services;
CREATE POLICY services_update_by_clinic ON public.services
  FOR UPDATE
  USING (
    clinic_id = get_clinic_id()
    OR auth.role() IN ('owner', 'admin')
  )
  WITH CHECK (
    clinic_id = get_clinic_id()
    OR auth.role() IN ('owner', 'admin')
  );

-- DELETE: allow deleting rows belonging to the caller's clinic (or owner/admin)
DROP POLICY IF EXISTS services_delete_by_clinic ON public.services;
CREATE POLICY services_delete_by_clinic ON public.services
  FOR DELETE
  USING (
    clinic_id = get_clinic_id()
    OR auth.role() IN ('owner', 'admin')
  );

COMMIT;

-- Notes:
-- - `get_clinic_id()` returns NULL for users with no doctor row; policies will therefore deny access.
-- - The function is SECURITY DEFINER: ensure the function owner is a role with read access to `public.doctors`.
-- - If you prefer a stricter policy for admin/owner roles, add explicit role checks (auth.role() IN (...)).

-- Use this if you applied the ALTER TABLE ... SET DEFAULT public.get_clinic_id();
import { SupabaseClient } from '@supabase/supabase-js';

export async function createServiceOmitClinic(supabase: SupabaseClient, payload: any) {
  const { data, error } = await supabase
    .from('services')
    .insert([{ ...payload }])   -- no clinic_id key
    .select();

  if (error) {
    console.error('Insert failed', error);
    throw error;
  }
  return data;
}
