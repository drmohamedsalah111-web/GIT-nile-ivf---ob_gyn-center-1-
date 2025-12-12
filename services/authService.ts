import { supabase } from './supabaseClient';
import { powerSyncDb } from '../src/powersync/client';

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
      // Write to PowerSync (offline-first)
      const now = new Date().toISOString();
      await powerSyncDb.execute(
        `INSERT INTO doctors (user_id, email, name, specialization, phone, doctor_image, clinic_name, clinic_address, clinic_phone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.user.id, email, doctorData.name, doctorData.specialization || null, doctorData.phone || null,
         null, null, null, null, now, now]
      );

      console.log('✅ Doctor record created in PowerSync');
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
    // Read from PowerSync (offline-first)
    const result = await powerSyncDb.execute(
      'SELECT * FROM doctors WHERE user_id = ?',
      [userId]
    );

    const doctors = result.rows?._array || [];
    if (doctors.length === 0) {
      throw new Error('Doctor profile not found');
    }

    return doctors[0];
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  },

  updateDoctorProfile: async (userId: string, updates: any) => {
    // Build dynamic UPDATE query
    const updateData = { ...updates, updated_at: new Date().toISOString() };
    const setParts = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(userId); // Add userId at the end

    await powerSyncDb.execute(
      `UPDATE doctors SET ${setParts} WHERE user_id = ?`,
      values
    );

    console.log('✅ Doctor profile updated in PowerSync');
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
    // Check if doctor exists in PowerSync
    const result = await powerSyncDb.execute(
      'SELECT id FROM doctors WHERE user_id = ?',
      [userId]
    );

    const doctors = result.rows?._array || [];
    if (doctors.length > 0) {
      return doctors[0];
    }

    // Create new doctor record in PowerSync
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await powerSyncDb.execute(
      `INSERT INTO doctors (id, user_id, email, name, specialization, phone, doctor_image, clinic_name, clinic_address, clinic_phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, email, 'الطبيب', null, null, null, null, null, null, now, now]
    );

    console.log('✅ Doctor record ensured in PowerSync');
    return { id };
  }
};
