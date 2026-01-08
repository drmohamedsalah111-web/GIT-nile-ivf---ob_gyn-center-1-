import { supabase } from '../../services/supabaseClient';

export interface PatientData {
  name: string;
  phone: string;
  age?: number;
  doctor_id: string;
  user_id?: string;
  husband_name?: string;
  medical_history?: any;
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
          medical_history: patientData.medical_history || {},
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
  },

  async updatePatient(id: string, patientData: Partial<PatientData>) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: patientData.name,
          age: patientData.age,
          phone: patientData.phone,
          husband_name: patientData.husband_name,
          medical_history: patientData.medical_history,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        throw new Error(error.message || 'Failed to update patient');
      }

      return data;
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw error;
    }
  },

  async deletePatient(id: string) {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting patient:', error);
        throw new Error(error.message || 'Failed to delete patient');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete patient:', error);
      throw error;
    }
  }
};

export const patientService = {
  async registerPatient(patientData: PatientData) {
    return PatientService.addPatient(patientData);
  },

  async updatePatient(id: string, patientData: Partial<PatientData>) {
    return PatientService.updatePatient(id, patientData);
  },

  async deletePatient(id: string) {
    return PatientService.deletePatient(id);
  }
};