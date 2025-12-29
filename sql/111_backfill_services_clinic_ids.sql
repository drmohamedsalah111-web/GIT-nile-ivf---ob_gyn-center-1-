-- Backfill script: convert services.clinic_id values that erroneously equal auth.users.id
-- 1) Update rows where services.clinic_id equals doctors.user_id -> set to coalesce(clinic_id, id)
-- 2) Report rows that still have invalid clinic_id (no matching doctors.id)

BEGIN;

-- Update rows where clinic_id was set to the user's auth id (doctors.user_id)
-- This sets clinic_id to the clinic owner id (doctor.clinic_id if present, otherwise doctor.id)
UPDATE public.services s
SET clinic_id = COALESCE(d.clinic_id, d.id)
FROM public.doctors d
WHERE s.clinic_id = d.user_id
  AND s.clinic_id IS NOT NULL
  AND COALESCE(d.clinic_id, d.id) IS NOT NULL
  AND s.clinic_id <> COALESCE(d.clinic_id, d.id);

-- List remaining services with clinic_id not present in doctors(id)
-- Manual review required for these rows.
SELECT s.id AS service_id, s.clinic_id
FROM public.services s
LEFT JOIN public.doctors d ON s.clinic_id = d.id
WHERE d.id IS NULL;

COMMIT;

-- After running: if the SELECT above returns rows, inspect business data and correct manually.
