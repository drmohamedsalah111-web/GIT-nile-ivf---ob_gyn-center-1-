import { supabase } from '../services/supabaseClient';

// ==================== Types ====================
export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'normal' | 'urgent' | 'follow_up';
  notes?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AppointmentWithDetails extends Appointment {
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  doctor_name?: string;
}

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  priority?: 'normal' | 'urgent' | 'follow_up';
  notes?: string;
}

export interface UpdateAppointmentData {
  patient_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: Appointment['status'];
  priority?: Appointment['priority'];
  notes?: string;
  reminder_sent?: boolean;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
  todayAppointments: number;
  upcomingAppointments: number;
}

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  status?: Appointment['status'] | 'all';
  priority?: Appointment['priority'] | 'all';
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// ==================== Service Class ====================
class ModernAppointmentService {
  // ==================== CRUD Operations ====================
  
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<{ data: Appointment | null; error: any }> {
    try {
      // Check for conflicts first
      const hasConflict = await this.checkConflict(
        data.doctor_id,
        data.appointment_date,
        data.appointment_time
      );

      if (hasConflict) {
        return {
          data: null,
          error: { message: 'يوجد موعد آخر في نفس الوقت' }
        };
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
          ...data,
          status: 'scheduled',
          priority: data.priority || 'normal',
          reminder_sent: false
        }])
        .select()
        .single();

      return { data: appointment, error };
    } catch (error) {
      console.error('Error creating appointment:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(
    appointmentId: string,
    data: UpdateAppointmentData
  ): Promise<{ data: Appointment | null; error: any }> {
    try {
      // If updating date/time, check for conflicts
      if (data.appointment_date || data.appointment_time) {
        const { data: current } = await supabase
          .from('appointments')
          .select('doctor_id, appointment_date, appointment_time')
          .eq('id', appointmentId)
          .single();

        if (current) {
          const newDate = data.appointment_date || current.appointment_date;
          const newTime = data.appointment_time || current.appointment_time;

          const hasConflict = await this.checkConflict(
            current.doctor_id,
            newDate,
            newTime,
            appointmentId
          );

          if (hasConflict) {
            return {
              data: null,
              error: { message: 'يوجد موعد آخر في نفس الوقت' }
            };
          }
        }
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      return { data: appointment, error };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(appointmentId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      return { error };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { error };
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<{ data: AppointmentWithDetails | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      // Load related data separately
      const { data: patientData } = await supabase
        .from('patients')
        .select('name, phone, email')
        .eq('id', data.patient_id)
        .single();

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('full_name')
        .eq('id', data.doctor_id)
        .single();

      const appointment: AppointmentWithDetails = {
        ...data,
        patient_name: patientData?.name,
        patient_phone: patientData?.phone,
        patient_email: patientData?.email,
        doctor_name: doctorData?.full_name
      };

      return { data: appointment, error: null };
    } catch (error) {
      console.error('Error getting appointment:', error);
      return { data: null, error };
    }
  }

  // ==================== Query Operations ====================

  /**
   * Get appointments with filters
   */
  async getAppointments(filters: AppointmentFilters = {}): Promise<{ data: AppointmentWithDetails[]; error: any }> {
    try {
      let query = supabase
        .from('appointments')
        .select('*');

      // Apply filters
      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.startDate) {
        query = query.gte('appointment_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('appointment_date', filters.endDate);
      }

      // Order by date and time
      query = query.order('appointment_date', { ascending: true })
                   .order('appointment_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      // Load related data separately
      const patientIds = [...new Set(data.map(apt => apt.patient_id))];
      const doctorIds = [...new Set(data.map(apt => apt.doctor_id))];

      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, name, phone, email')
        .in('id', patientIds);

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, full_name')
        .in('id', doctorIds);

      const patientsMap = new Map(patientsData?.map(p => [p.id, p]) || []);
      const doctorsMap = new Map(doctorsData?.map(d => [d.id, d]) || []);

      let appointments: AppointmentWithDetails[] = data.map(apt => ({
        ...apt,
        patient_name: patientsMap.get(apt.patient_id)?.name,
        patient_phone: patientsMap.get(apt.patient_id)?.phone,
        patient_email: patientsMap.get(apt.patient_id)?.email,
        doctor_name: doctorsMap.get(apt.doctor_id)?.full_name
      }));

      // Apply search filter if provided
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        appointments = appointments.filter(apt =>
          apt.patient_name?.toLowerCase().includes(searchLower) ||
          apt.patient_phone?.includes(filters.searchTerm!) ||
          apt.patient_email?.toLowerCase().includes(searchLower)
        );
      }

      return { data: appointments, error: null };
    } catch (error) {
      console.error('Error getting appointments:', error);
      return { data: [], error };
    }
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(doctorId: string): Promise<{ data: AppointmentWithDetails[]; error: any }> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointments({
      doctorId,
      startDate: today,
      endDate: today
    });
  }

  /**
   * Get upcoming appointments (next 7 days)
   */
  async getUpcomingAppointments(doctorId: string): Promise<{ data: AppointmentWithDetails[]; error: any }> {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const endDate = nextWeek.toISOString().split('T')[0];

    return this.getAppointments({
      doctorId,
      startDate: today,
      endDate,
      status: 'scheduled'
    });
  }

  /**
   * Get appointments for a specific date
   */
  async getAppointmentsByDate(
    doctorId: string,
    date: string
  ): Promise<{ data: AppointmentWithDetails[]; error: any }> {
    return this.getAppointments({
      doctorId,
      startDate: date,
      endDate: date
    });
  }

  /**
   * Get appointments in date range
   */
  async getAppointmentsByDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: AppointmentWithDetails[]; error: any }> {
    return this.getAppointments({
      doctorId,
      startDate,
      endDate
    });
  }

  // ==================== Status Operations ====================

  /**
   * Update appointment status
   */
  async updateStatus(
    appointmentId: string,
    status: Appointment['status']
  ): Promise<{ error: any }> {
    return this.updateAppointment(appointmentId, { status });
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(appointmentId: string): Promise<{ error: any }> {
    return this.updateStatus(appointmentId, 'confirmed');
  }

  /**
   * Start appointment
   */
  async startAppointment(appointmentId: string): Promise<{ error: any }> {
    return this.updateStatus(appointmentId, 'in_progress');
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string): Promise<{ error: any }> {
    return this.updateStatus(appointmentId, 'completed');
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string): Promise<{ error: any }> {
    return this.updateStatus(appointmentId, 'cancelled');
  }

  /**
   * Mark as no-show
   */
  async markNoShow(appointmentId: string): Promise<{ error: any }> {
    return this.updateStatus(appointmentId, 'no_show');
  }

  // ==================== Conflict & Validation ====================

  /**
   * Check if there's a scheduling conflict
   */
  async checkConflict(
    doctorId: string,
    date: string,
    time: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .in('status', ['scheduled', 'confirmed', 'in_progress']);

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking conflict:', error);
      return false;
    }
  }

  /**
   * Get available time slots for a date
   */
  async getAvailableTimeSlots(
    doctorId: string,
    date: string,
    startHour: number = 8,
    endHour: number = 20,
    interval: number = 30
  ): Promise<{ time: string; available: boolean }[]> {
    try {
      // Get all appointments for the date
      const { data: appointments } = await this.getAppointmentsByDate(doctorId, date);
      
      const bookedTimes = new Set(
        appointments
          ?.filter(apt => ['scheduled', 'confirmed', 'in_progress'].includes(apt.status))
          .map(apt => apt.appointment_time) || []
      );

      const slots: { time: string; available: boolean }[] = [];

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            time: timeString,
            available: !bookedTimes.has(timeString)
          });
        }
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  // ==================== Statistics ====================

  /**
   * Get appointment statistics
   */
  async getStats(doctorId?: string): Promise<AppointmentStats> {
    try {
      let query = supabase.from('appointments').select('status, appointment_date');

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];

      const stats: AppointmentStats = {
        total: data?.length || 0,
        scheduled: data?.filter(a => a.status === 'scheduled').length || 0,
        confirmed: data?.filter(a => a.status === 'confirmed').length || 0,
        in_progress: data?.filter(a => a.status === 'in_progress').length || 0,
        completed: data?.filter(a => a.status === 'completed').length || 0,
        cancelled: data?.filter(a => a.status === 'cancelled').length || 0,
        no_show: data?.filter(a => a.status === 'no_show').length || 0,
        todayAppointments: data?.filter(a => a.appointment_date === today).length || 0,
        upcomingAppointments: data?.filter(a => 
          a.appointment_date >= today && 
          ['scheduled', 'confirmed'].includes(a.status)
        ).length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
        todayAppointments: 0,
        upcomingAppointments: 0
      };
    }
  }

  /**
   * Get appointments grouped by status
   */
  async getAppointmentsByStatus(doctorId: string): Promise<{
    [key in Appointment['status']]: AppointmentWithDetails[]
  }> {
    try {
      const { data: appointments } = await this.getAppointments({ doctorId });

      const grouped = {
        scheduled: [] as AppointmentWithDetails[],
        confirmed: [] as AppointmentWithDetails[],
        in_progress: [] as AppointmentWithDetails[],
        completed: [] as AppointmentWithDetails[],
        cancelled: [] as AppointmentWithDetails[],
        no_show: [] as AppointmentWithDetails[]
      };

      appointments.forEach(apt => {
        grouped[apt.status].push(apt);
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping appointments:', error);
      return {
        scheduled: [],
        confirmed: [],
        in_progress: [],
        completed: [],
        cancelled: [],
        no_show: []
      };
    }
  }

  // ==================== Real-time Subscriptions ====================

  /**
   * Subscribe to appointment changes
   */
  subscribeToAppointments(
    doctorId: string,
    callback: (payload: any) => void
  ) {
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ==================== Bulk Operations ====================

  /**
   * Cancel multiple appointments
   */
  async cancelMultipleAppointments(appointmentIds: string[]): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', appointmentIds);

      return { error };
    } catch (error) {
      console.error('Error cancelling multiple appointments:', error);
      return { error };
    }
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(appointmentId: string): Promise<{ error: any }> {
    return this.updateAppointment(appointmentId, { reminder_sent: true });
  }

  /**
   * Get appointments needing reminders
   */
  async getAppointmentsNeedingReminders(doctorId: string): Promise<{ data: AppointmentWithDetails[]; error: any }> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', tomorrowDate)
        .eq('reminder_sent', false)
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      // Load related data separately
      const patientIds = [...new Set(data.map(apt => apt.patient_id))];

      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, name, phone, email')
        .in('id', patientIds);

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id, full_name')
        .eq('id', doctorId)
        .single();

      const patientsMap = new Map(patientsData?.map(p => [p.id, p]) || []);

      const appointments: AppointmentWithDetails[] = data.map(apt => ({
        ...apt,
        patient_name: patientsMap.get(apt.patient_id)?.name,
        patient_phone: patientsMap.get(apt.patient_id)?.phone,
        patient_email: patientsMap.get(apt.patient_id)?.email,
        doctor_name: doctorData?.full_name
      }));

      return { data: appointments, error: null };
    } catch (error) {
      console.error('Error getting appointments needing reminders:', error);
      return { data: [], error };
    }
  }

      if (error) throw error;

      const appointments: AppointmentWithDetails[] = data?.map(apt => ({
        ...apt,
        patient_name: apt.patient?.name,
        patient_phone: apt.patient?.phone,
        patient_email: apt.patient?.email,
        doctor_name: apt.doctor?.full_name
      })) || [];

      return { data: appointments, error: null };
    } catch (error) {
      console.error('Error getting appointments needing reminders:', error);
      return { data: [], error };
    }
  }

  // ==================== Export ====================

  /**
   * Export appointments to CSV
   */
  exportToCSV(appointments: AppointmentWithDetails[]): string {
    const headers = ['التاريخ', 'الوقت', 'المريض', 'الهاتف', 'الحالة', 'الأولوية', 'الملاحظات'];
    const rows = appointments.map(apt => [
      apt.appointment_date,
      apt.appointment_time,
      apt.patient_name || '',
      apt.patient_phone || '',
      apt.status,
      apt.priority,
      apt.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download appointments as CSV
   */
  downloadCSV(appointments: AppointmentWithDetails[], filename: string = 'appointments.csv') {
    const csv = this.exportToCSV(appointments);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
export const modernAppointmentService = new ModernAppointmentService();
export default modernAppointmentService;