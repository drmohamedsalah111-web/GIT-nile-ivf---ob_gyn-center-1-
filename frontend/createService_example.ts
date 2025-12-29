/* Example: createService() patch for Supabase JS (v2) - TypeScript
   - Fetch doctor row by `user_id = auth.uid()`
   - Compute clinicIdToUse = doctor.clinic_id ?? doctor.id
   - Insert service with clinic_id = clinicIdToUse
   - Log computed clinic id and handle PostgREST errors (including 409 FK errors)
*/

import { SupabaseClient } from '@supabase/supabase-js';

type DoctorRow = { id: string; clinic_id: string | null; user_role?: string | null };

export async function createService(supabase: SupabaseClient, servicePayload: any) {
  const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data?.user : null;
  const userId = user?.id;
  if (!userId) throw new Error('No authenticated user');

  // 1) Get current doctor row for the user
  const { data: doctor, error: doctorErr } = await supabase
    .from<DoctorRow>('doctors')
    .select('id, clinic_id, user_role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (doctorErr) {
    console.error('Failed to fetch doctor row for user', userId, doctorErr);
    throw doctorErr;
  }

  if (!doctor) {
    console.error('No doctor row found for user', userId);
    throw new Error('No doctor row found for current user');
  }

  // 2) Compute clinic id to use (clinic owner id)
  const clinicIdToUse = doctor.clinic_id ?? doctor.id;
  console.info('Computed clinicIdToUse for service insert:', clinicIdToUse);

  if (!clinicIdToUse) {
    throw new Error('Unable to determine clinic id for service');
  }

  // 3) Insert new service record with the computed clinic id
  const insertPayload = { ...servicePayload, clinic_id: clinicIdToUse };
  const { data: insertData, error: insertErr, status } = await supabase
    .from('services')
    .insert([insertPayload])
    .select();

  if (insertErr) {
    // clear logging for FK error (409) and other PostgREST errors
    console.error('Service insert failed', { status, error: insertErr, payload: insertPayload });
    throw insertErr;
  }

  return insertData;
}
