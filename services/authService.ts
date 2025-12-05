import { supabase } from './supabaseClient';

export const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signup: async (email: string, password: string, doctorData: { name: string; specialization?: string; phone?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;

    if (data.user) {
      const { error: dbError } = await supabase
        .from('doctors')
        .insert([
          {
            user_id: data.user.id,
            email: email,
            name: doctorData.name,
            specialization: doctorData.specialization || null,
            phone: doctorData.phone || null,
          }
        ]);

      if (dbError) throw dbError;
    }

    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getDoctorProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  }
};
