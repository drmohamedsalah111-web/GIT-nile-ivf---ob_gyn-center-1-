-- Migration: Fix services RLS and get_clinic_id() function
-- This script ensures that both doctors and secretaries can access services for their clinic.

BEGIN;

-- 1) Robust get_clinic_id() function
-- This function returns the clinic owner's ID (the doctor's ID) for the current user.
CREATE OR REPLACE FUNCTION public.get_clinic_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- In this system, every user (doctor or secretary) has a clinic_id in their doctor record.
  -- For doctors: clinic_id = id
  -- For secretaries: clinic_id = secretary_doctor_id
  SELECT clinic_id INTO v_clinic_id
  FROM public.doctors
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Fallback to doctor's own id if clinic_id is somehow null
  IF v_clinic_id IS NULL THEN
    SELECT id INTO v_clinic_id
    FROM public.doctors
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN v_clinic_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_clinic_id() TO authenticated;

-- 2) Update RLS for public.services
-- First, drop existing policies to avoid conflicts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'services' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', r.policyname);
  END LOOP;
END $$;

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- SELECT: Allow users to view services for their clinic
CREATE POLICY "services_select" ON public.services
  FOR SELECT
  TO authenticated
  USING (clinic_id = get_clinic_id());

-- INSERT: Allow users to insert services for their clinic
CREATE POLICY "services_insert" ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id = get_clinic_id());

-- UPDATE: Allow users to update services for their clinic
CREATE POLICY "services_update" ON public.services
  FOR UPDATE
  TO authenticated
  USING (clinic_id = get_clinic_id())
  WITH CHECK (clinic_id = get_clinic_id());

-- DELETE: Allow users to delete services for their clinic
CREATE POLICY "services_delete" ON public.services
  FOR DELETE
  TO authenticated
  USING (clinic_id = get_clinic_id());

-- 3) Also update other related tables just in case they have the same issue
-- Packages
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.packages', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_select" ON public.packages
  FOR SELECT TO authenticated USING (clinic_id = get_clinic_id());

CREATE POLICY "packages_insert" ON public.packages
  FOR INSERT TO authenticated WITH CHECK (clinic_id = get_clinic_id());

CREATE POLICY "packages_update" ON public.packages
  FOR UPDATE TO authenticated USING (clinic_id = get_clinic_id()) WITH CHECK (clinic_id = get_clinic_id());

CREATE POLICY "packages_delete" ON public.packages
  FOR DELETE TO authenticated USING (clinic_id = get_clinic_id());

-- Financial Cases
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'financial_cases' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.financial_cases', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.financial_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_cases_select" ON public.financial_cases
  FOR SELECT TO authenticated USING (clinic_id = get_clinic_id());

CREATE POLICY "financial_cases_insert" ON public.financial_cases
  FOR INSERT TO authenticated WITH CHECK (clinic_id = get_clinic_id());

CREATE POLICY "financial_cases_update" ON public.financial_cases
  FOR UPDATE TO authenticated USING (clinic_id = get_clinic_id()) WITH CHECK (clinic_id = get_clinic_id());

-- Invoices
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'invoices' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.invoices', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT TO authenticated USING (clinic_id = get_clinic_id());

CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (clinic_id = get_clinic_id());

CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE TO authenticated USING (clinic_id = get_clinic_id()) WITH CHECK (clinic_id = get_clinic_id());

COMMIT;
