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

      // Fetch appointments first
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw appointmentsError;
      }

      if (!appointments || appointments.length === 0) {
        return [];
      }

      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(apt => apt.patient_id).filter(Boolean))];

      // Fetch patients data
      let patientsMap: Record<string, any> = {};
      if (patientIds.length > 0) {
        const { data: patients, error: patientsError } = await supabase
          .from('patients')
          .select('id, name, phone')
          .in('id', patientIds);

        if (!patientsError && patients) {
          patientsMap = patients.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Merge patient data into appointments
      const result = appointments.map(apt => ({
        ...apt,
        patient: patientsMap[apt.patient_id] || null
      }));

      return result;
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  async getAllDoctorAppointments(doctorId: string) {
    try {
      // Fetch all appointments for this doctor
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw appointmentsError;
      }

      if (!appointments || appointments.length === 0) {
        return [];
      }

      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(apt => apt.patient_id).filter(Boolean))];

      // Fetch patients data
      let patientsMap: Record<string, any> = {};
      if (patientIds.length > 0) {
        const { data: patients, error: patientsError } = await supabase
          .from('patients')
          .select('id, name, phone')
          .in('id', patientIds);

        if (!patientsError && patients) {
          patientsMap = patients.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Merge patient data into appointments
      const result = appointments.map(apt => ({
        ...apt,
        patient: patientsMap[apt.patient_id] || null
      }));

      return result;
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

      // Fetch appointments first
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw appointmentsError;
      }

      if (!appointments || appointments.length === 0) {
        return [];
      }

      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(apt => apt.patient_id).filter(Boolean))];

      // Fetch patients data
      let patientsMap: Record<string, any> = {};
      if (patientIds.length > 0) {
        const { data: patients, error: patientsError } = await supabase
          .from('patients')
          .select('id, name, phone')
          .in('id', patientIds);

        if (!patientsError && patients) {
          patientsMap = patients.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Merge patient data into appointments
      const result = appointments.map(apt => ({
        ...apt,
        patient: patientsMap[apt.patient_id] || null
      }));

      return result;
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