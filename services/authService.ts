import { supabase } from './supabaseClient';

interface AuthService {
  login: (email: string, password: string) => Promise<{ user: any; session: any; weakPassword?: any } | { user: null; session: null; weakPassword?: null }>;
  signup: (email: string, password: string, userData: any, role: string, doctorId?: string) => Promise<any>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<any>;
  getDoctorProfile: (userId: string) => Promise<any>;
  onAuthStateChange: (callback: (user: any) => void) => any;
  updateDoctorProfile: (userId: string, updates: any) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  uploadImage: (userId: string, file: File, folder: 'doctor_images' | 'clinic_images') => Promise<string>;
  ensureDoctorRecord: (userId: string, email: string) => Promise<any>;
  getUserRole: (userId: string) => Promise<string>;
  getSecretaryProfile: (userId: string) => Promise<any>;
}

export const authService: AuthService = {
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
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        return session.user;
      }

      // 2. Fallback to getUser for strict server verification if needed
      const { data: { user } } = await supabase.auth.getUser();
      return user || null;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
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

    // First, get the doctor's ID from user_id
    const { data: doctor, error: fetchError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError || !doctor) {
      console.error('❌ Failed to find doctor profile:', fetchError);
      throw fetchError || new Error('Doctor not found');
    }

    // Now update using the doctor's ID
    const { error } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('id', doctor.id);

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
      // 1. Try to use the secure RPC function first (Bypasses RLS)
      const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role');
      if (!rpcError && rpcRole) {
        console.log('✓ Role fetched via RPC');
        return rpcRole;
      }

      // 2. Fallback to direct table query
      const { data, error } = await supabase
        .from('doctors')
        .select('user_role, id, secretary_doctor_id')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        // Smart Inference: If secretary_doctor_id exists, it MUST be a secretary
        if (data.secretary_doctor_id) {
          return 'secretary';
        }
        return data.user_role || 'doctor';
      }

      // Default fallback
      return 'doctor';
    } catch (error) {
      // Silently default to doctor on error
      return 'doctor';
    }
  },

  getSecretaryProfile: async (userId: string) => {
    try {
      // 1. Try to fetch using the secure RPC function first (Bypasses RLS)
      // Note: We might need to create a specific RPC for profile if RLS blocks select *

      // 2. Direct query
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single(); // Removed .eq('user_role', 'secretary') to be more lenient

      if (error || !data) {
        console.warn('Failed to load secretary profile');
        return null;
      }

      // Double check role if needed, but return data anyway
      return data;
    } catch (error: any) {
      console.warn('Failed to load secretary profile:', error?.message);
      return null;
    }
  }
};