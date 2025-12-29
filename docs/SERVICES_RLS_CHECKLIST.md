**Summary**
- Purpose: ensure `services.clinic_id` always stores a valid `doctors.id` (clinic owner id)
- Files added: SQL migrations and frontend example

**A) SQL scripts (apply in order)**
- `sql/110_get_clinic_id_and_policies.sql` - creates `get_clinic_id()` and replaces RLS
- `sql/111_backfill_services_clinic_ids.sql` - backfills incorrect `clinic_id` values and lists failures

Run sequence (recommended on staging first):
1. Run `sql/111_backfill_services_clinic_ids.sql` to convert existing rows.
2. Run `sql/110_get_clinic_id_and_policies.sql` to install the function and new policies.

**B) Frontend change**
- See `frontend/createService_example.ts` for a minimal `createService()` example.
  - Fetch doctor via `user_id = auth.uid()`
  - Use `clinicIdToUse = doctor.clinic_id ?? doctor.id`
  - Insert with `clinic_id: clinicIdToUse` (do not use service_role key in client)

**C) Verification queries and steps**
1. Confirm no services reference non-existent doctors:

   SELECT COUNT(*) AS bad_services
   FROM public.services s
   LEFT JOIN public.doctors d ON s.clinic_id = d.id
   WHERE d.id IS NULL;

   Expected: 0 (after backfill + manual fixes)

2. Confirm clinic ids map to doctors:

   SELECT s.id, s.clinic_id, d.user_id, d.clinic_id AS doctor_clinic_id
   FROM public.services s
   JOIN public.doctors d ON s.clinic_id = d.id
   LIMIT 25;

3. Test inserts from the frontend (as different roles):
   - As a doctor: create a service using the updated `createService()` flow. Should succeed.
   - As a secretary: fetch the doctor row for that secretary's user (their `clinic_id` should exist) and insert.
   - As a user with no doctor row: the client should fail before insert with an explanatory error.

4. Example debug steps (if you can create JWTs for test users):
   - Use PostgREST / Supabase client with auth JWT of a doctor; attempt insert and expect 201.
   - If you still see 409: inspect the logged `clinic_id` sent by client, then run:

     SELECT * FROM public.doctors WHERE id = '<the-clinic-id-you-sent>' OR user_id = '<the-clinic-id-you-sent>';

     This reveals whether the value is a `doctors.id` or a `user_id`.

**D) Why the 409 happened**
- Your client inserted `clinic_id = auth.uid()` (auth.users.id). The `services.clinic_id` FK points to `doctors.id`, not `auth.users.id`.
- If the UUID you provided as `clinic_id` does not exist in `doctors.id`, Postgres rejects the insert with a foreign key violation (HTTP 409 from PostgREST).

**E) How this fix prevents the 409**
- The client computes `clinic_id` from the `doctors` row (the doctor's `clinic_id` or their own `id`) so it always supplies a valid `doctors.id`.
- RLS policies use `get_clinic_id()` (server-side) so users cannot bypass the constraint by sending arbitrary clinic ids.

**F) Manual follow-ups**
- Review any SELECT from the backfill script that returned rows with no matching `doctors.id`.
- Decide business action for those rows (delete, reassign, or contact support).
