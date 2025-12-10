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
            doctor_image: null,
            clinic_name: null,
            clinic_address: null,
            clinic_phone: null,
            clinic_image: null,
            clinic_latitude: null,
            clinic_longitude: null,
          }
        ]);

      if (dbError) {
        console.error('Doctor insert error:', dbError);
        throw dbError;
      }
    }

    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    try {
      // 1. Try strict server verification first (Secure)
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error: any) {
      // 2. If Network Error ("Failed to fetch"), Fallback to Local Session
      if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
        console.warn('Offline mode: Verifying local session...');
        const { data: { session } } = await supabase.auth.getSession();
        // If we have a valid local session, allow access
        if (session?.user) {
          return session.user;
        }
      }
      // Real auth error? Re-throw
      throw error;
    }
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
  },

  updateDoctorProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Update error details:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
    return data;
  },

  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  },

  uploadImage: async (userId: string, file: File, folder: 'doctor_images' | 'clinic_images') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('doctor-files')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('doctor-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  ensureDoctorRecord: async (userId: string, email: string) => {
    const { data: existingDoctor, error: fetchError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingDoctor) {
      return existingDoctor;
    }

    const { data: newDoctor, error: insertError } = await supabase
      .from('doctors')
      .insert([
        {
          user_id: userId,
          email: email,
          name: 'الطبيب',
          specialization: null,
          phone: null,
          doctor_image: null,
          clinic_name: null,
          clinic_address: null,
          clinic_phone: null,
          clinic_image: null,
          clinic_latitude: null,
          clinic_longitude: null,
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating doctor record:', insertError);
      throw insertError;
    }

    return newDoctor;
  }
};
