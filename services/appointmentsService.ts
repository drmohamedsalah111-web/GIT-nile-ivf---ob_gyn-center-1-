import { supabase } from './supabaseClient';
import { Appointment } from '../types';

export const appointmentsService = {
  createAppointment: async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          doctor_id: appointment.doctor_id,
          secretary_id: appointment.secretary_id || null,
          patient_id: appointment.patient_id,
          appointment_date: appointment.appointment_date,
          status: appointment.status || 'Scheduled',
          visit_type: appointment.visit_type || 'Consultation',
          notes: appointment.notes || null,
          created_by: appointment.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Failed to create appointment:', error);
      throw new Error(`فشل إنشاء الموعد: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  updateAppointment: async (id: string, updates: Partial<Appointment>) => {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Failed to update appointment:', error);
      throw new Error(`فشل تحديث الموعد: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  updateAppointmentDetails: async (id: string, updates: Partial<Appointment>) => {
    return await appointmentsService.updateAppointment(id, updates);
  },

  cancelAppointment: async (id: string) => {
    try {
      return await appointmentsService.updateAppointment(id, { status: 'Cancelled' });
    } catch (error: any) {
      console.error('❌ Failed to cancel appointment:', error);
      throw error;
    }
  },

  deleteAppointment: async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete appointment:', error);
      throw new Error(`فشل حذف الموعد: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  getAppointmentsByDoctor: async (doctorId: string, startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, husband_name, history),
          doctor_details:doctor_id(id, name, email, specialization)
        `)
        .eq('doctor_id', doctorId)
        .neq('status', 'Cancelled') // Filter out cancelled
        .neq('status', 'cancelled') // Handle both cases just in case
        .order('appointment_date', { ascending: true });

      if (startDate && endDate) {
        query = query
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch appointments:', error);
      throw new Error(`فشل جلب المواعيد: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  getAppointmentsBySecretary: async (secretaryId: string, startDate?: string, endDate?: string) => {
    try {
      // First, get the doctor ID associated with this secretary
      const { data: secretaryData, error: secretaryError } = await supabase
        .from('doctors')
        .select('secretary_doctor_id')
        .eq('user_id', secretaryId) // Assuming secretaryId passed here is user_id
        .single();

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, husband_name, history),
          doctor_details:doctor_id(id, name, email, specialization)
        `)
        .order('appointment_date', { ascending: true })
        .neq('status', 'Cancelled')
        .neq('status', 'cancelled');

      // If we found a linked doctor, filter by that doctor instead of secretary_id
      // This is better because appointments are usually linked to the doctor, not just the creator
      if (secretaryData?.secretary_doctor_id) {
        query = query.eq('doctor_id', secretaryData.secretary_doctor_id);
      } else {
        // Fallback to filtering by secretary_id if no doctor link found
        // Note: This might return empty if appointments are not explicitly tagged with secretary_id
        query = query.eq('secretary_id', secretaryId);
      }

      if (startDate && endDate) {
        query = query
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch appointments:', error);
      throw new Error(`فشل جلب المواعيد: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  getPatientAppointments: async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor_details:doctor_id(id, name, email, specialization)
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch patient appointments:', error);
      throw new Error(`فشل جلب مواعيد المريضة: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  getAppointmentById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, husband_name, history),
          doctor_details:doctor_id(id, name, email, specialization)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Failed to fetch appointment:', error);
      throw new Error(`فشل جلب الموعد: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  getAvailableSlots: async (doctorId: string, date: string, slotDuration: number = 30) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('doctor_id', doctorId)
        .eq('status', 'Scheduled')
        .gte('appointment_date', `${date}T00:00:00`)
        .lte('appointment_date', `${date}T23:59:59`);

      if (error) throw error;

      const bookedSlots = (appointments || []).map(apt => {
        const date = new Date(apt.appointment_date);
        return Math.floor(date.getHours() * 60 / slotDuration) * slotDuration;
      });

      const slots = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotMinutes = hour * 60 + minute;
          if (!bookedSlots.includes(slotMinutes)) {
            slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
          }
        }
      }

      return slots;
    } catch (error: any) {
      console.error('❌ Failed to get available slots:', error);
      throw new Error(`فشل جلب المواعيد المتاحة: ${error.message || 'خطأ في قاعدة البيانات'}`);
    }
  },

  searchAppointments: async (query: string, doctorId?: string) => {
    try {
      let q = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone),
          doctor_details:doctor_id(id, name)
        `);

      if (doctorId) {
        q = q.eq('doctor_id', doctorId);
      }

      const { data, error } = await q;

      if (error) throw error;

      const filtered = (data || []).filter(apt =>
        apt.patient?.name?.includes(query) ||
        apt.patient?.phone?.includes(query) ||
        apt.doctor_details?.name?.includes(query)
      );

      return filtered;
    } catch (error: any) {
      console.error('❌ Failed to search appointments:', error);
      throw error;
    }
  },

  calculateAvailableSlots: (
    existingAppointments: any[],
    selectedDate: string,
    appointmentDuration: number = 60
  ) => {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += appointmentDuration) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        // Check if slot is taken by a non-cancelled appointment
        const isAvailable = !existingAppointments.some((apt) => {
          if (apt.status === 'cancelled' || apt.status === 'Cancelled') return false; // Ignore cancelled appointments
          const aptTime = new Date(apt.appointment_date).toISOString().slice(11, 16);
          // Simple check: if start time matches.
          return aptTime === time;
        });

        if (isAvailable) {
          slots.push(time);
        }
      }
    }

    return slots;
  },

  checkAppointmentOverlap: async (doctorId: string, date: string, startTime: string, durationMinutes: number = 30, excludeId?: string) => {
    console.log('🔍 checkAppointmentOverlap called', { doctorId, date, startTime }); // Debug log
    try {
      // Calculate new appointment start and end times
      const newStart = new Date(`${date}T${startTime}`);
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('id, appointment_date') // Removed duration
        .eq('doctor_id', doctorId)
        .neq('status', 'Cancelled')
        .neq('status', 'cancelled')
        .gte('appointment_date', `${date}T00:00:00`)
        .lte('appointment_date', `${date}T23:59:59`);

      if (error) throw error;

      if (!existingAppointments) return false;

      return existingAppointments.some(apt => {
        if (excludeId && apt.id === excludeId) return false;

        const aptStart = new Date(apt.appointment_date);
        // Default duration 30 mins since column doesn't exist
        const aptDuration = 30;
        const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);

        // Check for overlap
        // (StartA < EndB) and (EndA > StartB)
        return (newStart < aptEnd) && (newEnd > aptStart);
      });
    } catch (error: any) {
      console.error('❌ Failed to check overlap:', error);
      // Fail safe: return false or throw? 
      // Better to assume NO conflict if check fails to avoid blocking, OR warn user.
      // Let's throw to handle it in UI.
      throw new Error(`فشل التحقق من توفر الموعد: ${error.message}`);
    }
  }
};
