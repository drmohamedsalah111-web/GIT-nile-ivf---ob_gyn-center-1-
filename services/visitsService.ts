import { supabase } from './supabaseClient';
import { Visit } from '../types';

export const visitsService = {
  // Unified save visit function for all departments
  saveVisit: async (params: {
    patientId: string;
    department: string;
    clinicalData: any;
    diagnosis?: string;
    prescription?: any[];
    notes?: string;
  }) => {
    try {
      const visitData = {
        patient_id: params.patientId, // snake_case for database
        date: new Date().toISOString().split('T')[0],
        department: params.department,
        diagnosis: params.diagnosis || '',
        prescription: params.prescription || [],
        notes: params.notes || '',
        clinical_data: params.clinicalData,
      };

      const { data, error } = await supabase
        .from('visits')
        .insert([visitData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error inserting visit:', error);
        throw new Error(`Failed to save visit: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error('Exception in saveVisit:', err);
      throw err;
    }
  },

  // Create a new visit with clinical data (legacy - kept for compatibility)
  createVisit: async (visit: Omit<Visit, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .insert([visit])
        .select()
        .single();

      if (error) {
        console.error('Supabase error inserting visit:', error);
        throw new Error(`Failed to create visit: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error('Exception in createVisit:', err);
      throw err;
    }
  },

  // Get visits for a patient
  getVisitsByPatient: async (patientId: string) => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('patient_id', patientId) // snake_case for database
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update a visit
  updateVisit: async (visitId: string, updates: Partial<Visit>) => {
    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.patientId) dbUpdates.patient_id = updates.patientId;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
    if (updates.prescription !== undefined) dbUpdates.prescription = updates.prescription;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.clinical_data !== undefined) dbUpdates.clinical_data = updates.clinical_data;

    const { data, error } = await supabase
      .from('visits')
      .update(dbUpdates)
      .eq('id', visitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a visit
  deleteVisit: async (visitId: string) => {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', visitId);

    if (error) throw error;
  },
};