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

  signup: async (email: string, password: string, doctorData: { name: string; specialization?: string; phone?: string }, role: 'doctor' | 'secretary' = 'doctor', doctorId?: string) => {
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
            user_role: role,
            secretary_doctor_id: role === 'secretary' ? doctorId : null,
            created_at: now,
            updated_at: now
          }]);

        console.log(`✅ ${role === 'secretary' ? 'Secretary' : 'Doctor'} record created in Supabase`);
      } catch (dbError: any) {
        console.error(`❌ Failed to create ${role} record:`, dbError);
        throw new Error(`فشل إنشاء الملف: ${dbError.message || 'خطأ في قاعدة البيانات'}`);
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
      // 1. First try to refresh the session if it exists
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.refresh_token) {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.warn('⚠️ Session refresh failed:', error.message);
          } else if (data?.user) {
            console.log('✅ Session refreshed successfully');
            return data.user;
          }
        } catch (refreshError) {
          console.warn('⚠️ Session refresh error:', refreshError);
        }
      }

      // 2. Try strict server verification (Secure)
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error: any) {
      // 3. If Network Error ("Failed to fetch"), Fallback to Local Session
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
    const now = new Date().toISOString();
    
    // Step 1: Check if doctor already exists
    try {
      const { data: existingDoctor, error: fetchError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingDoctor) {
        console.log('✅ Doctor record already exists:', existingDoctor.id);
        return existingDoctor;
      }

      if (fetchError) {
        console.error('Error fetching doctor:', fetchError);
      }
    } catch (fetchErr) {
      console.warn('Error checking existing doctor:', fetchErr);
    }

    // Step 2: Create new doctor record
    const doctorId = crypto.randomUUID();
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('doctors')
        .insert([{
          id: doctorId,
          user_id: userId,
          email,
          name: 'الطبيب',
          user_role: 'doctor',
          created_at: now,
          updated_at: now
        }])
        .select('id')
        .single();

      if (insertError) {
        // Handle UNIQUE constraint - try fetching again
        if (insertError.code === '23505') {
          console.warn('⚠️ Doctor record already exists (UNIQUE constraint)');
          const { data: retryDoctor } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (retryDoctor) {
            console.log('✅ Doctor record found after retry:', retryDoctor.id);
            return retryDoctor;
          }
        }
        throw insertError;
      }

      console.log('✅ Doctor record created in Supabase:', doctorId);
      return insertData || { id: doctorId };
    } catch (error: any) {
      console.error('❌ Failed to create doctor record:', error?.message);
      throw new Error(`فشل إنشاء ملف الطبيب: ${error?.message || 'خطأ غير معروف'}`);
    }
  },

  getUserRole: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('user_role, id, secretary_doctor_id')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.warn('Failed to fetch user role, defaulting to doctor');
        return 'doctor';
      }

      return data.user_role || 'doctor';
    } catch (error: any) {
      console.warn('Error fetching user role:', error?.message);
      return 'doctor';
    }
  },

  getSecretaryProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .eq('user_role', 'secretary')
        .single();

      if (error || !data) {
        console.warn('Failed to load secretary profile');
        return null;
      }

      return data;
    } catch (error: any) {
      console.warn('Failed to load secretary profile:', error?.message);
      return null;
    }
  }
};
export const getUserRole = async (userId: string): Promise<'doctor' | 'secretary'> => {
  try {
    // حاول الحصول على الدور من جدول doctors
    const { data, error } = await supabase
      .from('doctors')
      .select('user_role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.log('Defaulting to doctor role');
      return 'doctor';
    }

    return (data.user_role as 'doctor' | 'secretary') || 'doctor';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'doctor'; // القيمة الافتراضية
  }
};