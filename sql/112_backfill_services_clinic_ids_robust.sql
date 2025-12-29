-- Robust backfill: fix services.clinic_id values that were mistakenly set to auth.users.id
-- Behavior:
-- 1) Creates an audit table if missing
-- 2) Updates rows where services.clinic_id = doctors.user_id -> sets clinic_id = COALESCE(doctors.clinic_id, doctors.id)
-- 3) Inserts audit rows for each change
-- 4) Lists remaining services rows with invalid clinic_id (no matching doctors.id)

BEGIN;

-- 1) Audit table (idempotent)
CREATE TABLE IF NOT EXISTS public.services_clinic_backfill_audit (
  id bigserial PRIMARY KEY,
  service_id uuid NOT NULL,
  old_clinic_id uuid,
  new_clinic_id uuid,
  doctor_id uuid,
  doctor_user_id uuid,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Prepare rows to update: join services where clinic_id equals doctors.user_id
WITH to_update AS (
  SELECT s.id AS service_id,
         s.clinic_id AS old_clinic_id,
         d.id AS doctor_id,
         d.user_id AS doctor_user_id,
         COALESCE(d.clinic_id, d.id) AS new_clinic_id
  FROM public.services s
  JOIN public.doctors d ON s.clinic_id = d.user_id
  WHERE s.clinic_id IS NOT NULL
)
-- 3) Apply update and return affected rows
UPDATE public.services s
SET clinic_id = u.new_clinic_id
FROM to_update u
WHERE s.id = u.service_id
RETURNING s.id AS service_id, u.old_clinic_id, u.new_clinic_id, u.doctor_id, u.doctor_user_id;

-- 4) Insert returned rows into audit table
INSERT INTO public.services_clinic_backfill_audit (service_id, old_clinic_id, new_clinic_id, doctor_id, doctor_user_id)
SELECT r.service_id, r.old_clinic_id, r.new_clinic_id, r.doctor_id, r.doctor_user_id
FROM (
  WITH to_update AS (
    SELECT s.id AS service_id,
           s.clinic_id AS old_clinic_id,
           d.id AS doctor_id,
           d.user_id AS doctor_user_id,
           COALESCE(d.clinic_id, d.id) AS new_clinic_id
    FROM public.services s
    JOIN public.doctors d ON s.clinic_id = d.user_id
    WHERE s.clinic_id IS NOT NULL
  )
  UPDATE public.services s
  SET clinic_id = u.new_clinic_id
  FROM to_update u
  WHERE s.id = u.service_id
  RETURNING s.id AS service_id, u.old_clinic_id, u.new_clinic_id, u.doctor_id, u.doctor_user_id
) r
ON CONFLICT DO NOTHING;

-- Note: the above UPDATE/INSERT block is idempotent for rows that match doctors.user_id.

-- 5) List remaining services with invalid clinic_id (no matching doctors.id)
-- These need manual intervention: either delete, reassign, or contact support.
SELECT s.id AS service_id, s.clinic_id
FROM public.services s
LEFT JOIN public.doctors d ON s.clinic_id = d.id
WHERE d.id IS NULL
ORDER BY s.id
LIMIT 100;

COMMIT;

-- Usage notes:
-- - Run this on staging first. Review the SELECT output to see rows that could not be fixed.
-- - The audit table stores changes; you can inspect it with:
--     SELECT * FROM public.services_clinic_backfill_audit ORDER BY processed_at DESC LIMIT 200;
