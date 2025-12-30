import { supabase } from '../lib/supabase';

export type NewMedicationInput = {
  trade_name: string;
  generic_name: string;
  manufacturer?: string;
  category: string;
  category_color: string;
  form: string;
  strength: string;
  default_dose?: string;
  default_frequency?: string;
  default_duration?: string;
  warnings?: string | null;
};

export const medicationsService = {
  fetchAll: async () => {
    const { data, error } = await supabase
      .from('pregnancy_medications')
      .select('*')
      .eq('is_active', true)
      .order('use_count', { ascending: false });

    if (error) throw error;
    return (data || []);
  },

  addMedication: async (input: NewMedicationInput) => {
    const payload = {
      ...input,
      is_active: true,
      use_count: 0
    };

    const { data, error } = await supabase
      .from('pregnancy_medications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default medicationsService;
