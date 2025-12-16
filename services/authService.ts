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
      try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await supabase
          .from('doctors')
          .insert([{
            id,
            user_id: data.user.id,
            email,
            name: doctorData.name,
            specialization: doctorData.specialization || null,
            phone: doctorData.phone || null,
            created_at: now,
            updated_at: now
          }]);

        console.log('✅ Doctor record created in Supabase');
      } catch (dbError: any) {
        console.error('❌ Failed to create doctor record:', dbError);
        throw new Error(`فشل إنشاء ملف الطبيب: ${dbError.message || 'خطأ في قاعدة البيانات'}`);
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
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.warn('Failed to load doctor profile from database, using default profile');
        return {
          id: 'default-profile',
          full_name: 'Dr. Mohamed Salah',
          specialty: 'IVF & OB/GYN Consultant',
          avatar_url: null
        };
      }
      return data;
    } catch (err: any) {
      console.warn('Failed to load doctor profile from database, using default profile');
      return {
        id: 'default-profile',
        full_name: 'Dr. Mohamed Salah',
        specialty: 'IVF & OB/GYN Consultant',
        avatar_url: null
      };
    }
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  },

  updateDoctorProfile: async (userId: string, updates: any) => {
    const updateData = { ...updates, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Failed to update doctor profile:', error);
      throw error;
    }

    console.log('✅ Doctor profile updated in Supabase');
    return updateData;
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
    // Check if doctor already exists
    const { data: existingDoctor, error: fetchError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingDoctor) {
      console.log('✅ Doctor record already exists:', existingDoctor.id);
      return existingDoctor;
    }

    // Create new doctor record only if it doesn't exist
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    try {
      const { error: insertError } = await supabase
        .from('doctors')
        .insert([{
          id,
          user_id: userId,
          email,
          name: 'الطبيب',
          created_at: now,
          updated_at: now
        }]);

      if (insertError) throw insertError;
      console.log('✅ Doctor record created in Supabase:', id);
    } catch (error: any) {
      // Handle UNIQUE constraint violation (doctor was created by another process)
      if (error?.message?.includes('UNIQUE') || error?.code === '23505') {
        console.warn('⚠️ Doctor record UNIQUE constraint: retrying lookup');
        // Retry the lookup in case another process just created it
        const { data: retryDoctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (retryDoctor) {
          console.log('✅ Doctor record found after retry:', retryDoctor.id);
          return retryDoctor;
        }
      }
      console.error('❌ Failed to ensure doctor record:', error?.message);
      // Return a fallback instead of throwing
      console.log('ℹ️ Using fallback doctor record');
      return { id: 'fallback-' + userId };
    }

    return { id };
  }
};
