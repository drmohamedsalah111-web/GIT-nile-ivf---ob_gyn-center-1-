import { supabase } from '../lib/supabase';

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
     * Adds a new patient by invoking the 'add-patient' Edge Function.
     * This bypasses RLS restrictions for reception users.
     */
    async addPatient(patientData: PatientData) {
        try {
            const { data, error } = await supabase.functions.invoke('add-patient', {
                body: patientData,
            });

            if (error) {
                console.error('Error invoking add-patient function:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to add patient:', error);
            throw error;
        }
    }
};
