// services/appointmentService.ts
import { supabase } from '../../services/supabaseClient';

export interface AppointmentData {
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  visit_type: string;
  notes?: string;
  created_by?: string;
}

export const appointmentService = {
  async createAppointment(data: AppointmentData) {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([
          {
            doctor_id: data.doctor_id,
            patient_id: data.patient_id,
            appointment_date: data.appointment_date,
            status: data.status,
            visit_type: data.visit_type,
            notes: data.notes || '',
            created_by: data.created_by || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return appointment;
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      throw new Error(error.message || 'فشل حجز الموعد');
    }
  },

  async getDoctorAppointments(doctorId: string, date: string) {
    try {
      const startDate = `${date}T00:00:00`;
      const endDate = `${date}T23:59:59`;

      const { data, error } = await supabase
        .rpc('get_doctor_appointments_with_details', {
          p_doctor_id: doctorId,
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  async getAllDoctorAppointments(doctorId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_all_doctor_appointments_with_details', {
          p_doctor_id: doctorId
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  async cancelAppointment(appointmentId: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      throw new Error(error.message || 'فشل إلغاء الموعد');
    }
  },

  getAvailableSlots(
    existingAppointments: any[],
    selectedDate: string,
    appointmentDuration: number = 30
  ) {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += appointmentDuration) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const appointmentDateTime = `${selectedDate}T${time}:00`;

        const isAvailable = !existingAppointments.some((apt) => {
          const aptTime = new Date(apt.appointment_date).toISOString().slice(11, 16);
          return aptTime === time;
        });

        if (isAvailable) {
          slots.push(time);
        }
      }
    }

    return slots;
  },

  async getAppointments(date: string) {
    try {
      const startDate = `${date}T00:00:00`;
      const endDate = `${date}T23:59:59`;

      const { data, error } = await supabase
        .rpc('get_appointments_with_details', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  async updateStatus(appointmentId: string, status: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      throw new Error(error.message || 'فشل تحديث حالة الموعد');
    }
  },

  subscribeToAppointments(callback: () => void) {
    const subscription = supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Appointment change detected:', payload);
          callback();
        }
      )
      .subscribe();

    return subscription;
  },
};