import { supabase } from './supabaseClient';
import { Visit } from '../types';

export const visitsService = {
  // Create a new visit with clinical data
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
      .eq('patientId', patientId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update a visit
  updateVisit: async (visitId: string, updates: Partial<Visit>) => {
    const { data, error } = await supabase
      .from('visits')
      .update(updates)
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