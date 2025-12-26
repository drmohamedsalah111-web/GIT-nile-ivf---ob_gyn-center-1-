import { supabase } from '../../services/supabaseClient';

export interface PatientData {
    name: string;
    phone: string;
    age?: number;
    doctor_id: string;
    user_id?: string;
    husband_name?: string;
    history?: string;
}

export const PatientService = {
    /**
     * Adds a new patient directly to the database.
     * Uses the fixed RLS policies that allow secretary/doctor access.
     */
    async addPatient(patientData: PatientData) {
        try {
            const { data, error } = await supabase
                .from('patients')
                .insert([{
                    name: patientData.name,
                    age: patientData.age,
                    phone: patientData.phone,
                    husband_name: patientData.husband_name || '',
                    history: patientData.history || '',
                    doctor_id: patientData.doctor_id,
                }])
                .select()
                .single();

            if (error) {
                console.error('Error adding patient:', error);
                throw new Error(error.message || 'Failed to add patient to database');
            }

            return data;
        } catch (error) {
            console.error('Failed to add patient:', error);
            throw error;
        }
    }
};
export const patientService = {
  async registerPatient(patientData: PatientData) {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .insert([{
          name: patientData.name,
          age: patientData.age,
          phone: patientData.phone,
          husband_name: patientData.husband_name || '',
          history: patientData.history || '',
          doctor_id: patientData.doctor_id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message || 'فشل تسجيل المريضة');
      }

      return patient;
    } catch (error: any) {
      console.error('Error registering patient:', error);
      throw error;
    }
  },
};