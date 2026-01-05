// ============================================================================
// APPOINTMENT SERVICE - ENHANCED
// خدمات المواعيد المحسّنة
// ============================================================================

import { supabase } from './supabaseClient';

export interface AppointmentData {
  id?: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status?: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  visit_type: string;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'follow_up';
  reminder_sent?: boolean;
}

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
}

export interface AppointmentStats {
  total_appointments: number;
  scheduled_count: number;
  waiting_count: number;
  in_progress_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  urgent_count: number;
  avg_waiting_time: number;
}

class SmartAppointmentService {
  
  // ============================================================================
  // CREATE
  // ============================================================================
  
  async createAppointment(data: AppointmentData) {
    try {
      // Check for conflicts
      const hasConflict = await this.checkConflict(
        data.doctor_id,
        data.appointment_date,
        data.appointment_time
      );

      if (hasConflict) {
        throw new Error('يوجد موعد آخر في هذا الوقت');
      }

      const appointmentDateTime = new Date(`${data.appointment_date}T${data.appointment_time}`);

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([
          {
            ...data,
            appointment_date: appointmentDateTime.toISOString(),
            status: data.status || 'scheduled',
            priority: data.priority || 'normal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id)
        `)
        .single();

      if (error) throw error;
      return { success: true, data: appointment };
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // READ
  // ============================================================================

  async getAppointments(filters: AppointmentFilters = {}) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id),
          doctor:doctors!appointments_doctor_id_fkey(id, name, specialization)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.startDate) {
        query = query.gte('appointment_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('appointment_date', filters.endDate);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('❌ Error getting appointments:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getAppointmentById(id: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id, history),
          doctor:doctors!appointments_doctor_id_fkey(id, name, email, specialization)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error getting appointment:', error);
      return { success: false, error: error.message };
    }
  }

  async getTodayAppointments(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointments({
      doctorId,
      startDate: today,
      endDate: today
    });
  }

  async getUpcomingAppointments(doctorId: string, daysAhead: number = 7) {
    try {
      const { data, error } = await supabase
        .rpc('get_upcoming_appointments', {
          p_doctor_id: doctorId,
          p_days_ahead: daysAhead
        });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('❌ Error getting upcoming appointments:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getWaitingQueue(doctorId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_waiting_queue', {
          p_doctor_id: doctorId
        });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('❌ Error getting waiting queue:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async updateAppointment(id: string, updates: Partial<AppointmentData>) {
    try {
      // If updating time, check for conflicts
      if (updates.appointment_date && updates.appointment_time) {
        const hasConflict = await this.checkConflict(
          updates.doctor_id!,
          updates.appointment_date,
          updates.appointment_time,
          id
        );

        if (hasConflict) {
          throw new Error('يوجد موعد آخر في هذا الوقت');
        }
      }

      let updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.appointment_date && updates.appointment_time) {
        const appointmentDateTime = new Date(
          `${updates.appointment_date}T${updates.appointment_time}`
        );
        updateData.appointment_date = appointmentDateTime.toISOString();
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id)
        `)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error updating appointment:', error);
      return { success: false, error: error.message };
    }
  }

  async updateStatus(
    id: string,
    status: AppointmentData['status'],
    notes?: string
  ) {
    const updates: any = { status };
    if (notes) updates.notes = notes;
    
    return this.updateAppointment(id, updates);
  }

  async markAsWaiting(id: string) {
    return this.updateStatus(id, 'waiting');
  }

  async markAsInProgress(id: string) {
    return this.updateStatus(id, 'in_progress');
  }

  async markAsCompleted(id: string, notes?: string) {
    return this.updateStatus(id, 'completed', notes);
  }

  async markAsCancelled(id: string, reason?: string) {
    return this.updateStatus(id, 'cancelled', reason);
  }

  async markAsNoShow(id: string) {
    return this.updateStatus(id, 'no_show');
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async deleteAppointment(id: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error deleting appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  async checkConflict(
    doctorId: string,
    date: string,
    time: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const appointmentDateTime = new Date(`${date}T${time}`);
      
      const { data, error } = await supabase
        .rpc('check_appointment_conflict', {
          p_doctor_id: doctorId,
          p_appointment_date: appointmentDateTime.toISOString(),
          p_appointment_duration: 30,
          p_exclude_appointment_id: excludeAppointmentId || null
        });

      if (error) throw error;
      return !data; // Function returns true if NO conflict
    } catch (error) {
      console.error('❌ Error checking conflict:', error);
      return false; // Assume no conflict on error
    }
  }

  async getStats(
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AppointmentStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_appointment_stats', {
          p_doctor_id: doctorId,
          p_start_date: startDate || new Date().toISOString().split('T')[0],
          p_end_date: endDate || new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error: any) {
      console.error('❌ Error getting stats:', error);
      return null;
    }
  }

  async getAuditLog(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('appointment_audit_log')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('❌ Error getting audit log:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTION
  // ============================================================================

  subscribeToAppointments(
    doctorId: string,
    callback: (payload: any) => void
  ) {
    const channel = supabase
      .channel('appointments_changes')
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

    return channel;
  }

  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async bulkUpdateStatus(
    appointmentIds: string[],
    status: AppointmentData['status']
  ) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', appointmentIds)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error bulk updating:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkDelete(appointmentIds: string[]) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .in('id', appointmentIds);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error bulk deleting:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  async search(searchTerm: string, doctorId?: string) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id)
        `);

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      // Search in patient name or phone
      query = query.or(`patient.name.ilike.%${searchTerm}%,patient.phone.ilike.%${searchTerm}%`);

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('❌ Error searching:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  async exportToCSV(filters: AppointmentFilters) {
    try {
      const result = await this.getAppointments(filters);
      
      if (!result.success || !result.data) {
        throw new Error('فشل تحميل البيانات');
      }

      const appointments = result.data;
      
      // Create CSV
      const headers = [
        'ID',
        'المريض',
        'رقم الهاتف',
        'التاريخ',
        'الوقت',
        'الحالة',
        'نوع الزيارة',
        'الأولوية',
        'الملاحظات'
      ];

      const rows = appointments.map((apt: any) => [
        apt.id,
        apt.patient?.name || '',
        apt.patient?.phone || '',
        new Date(apt.appointment_date).toLocaleDateString('ar-EG'),
        apt.appointment_time || '',
        apt.status,
        apt.visit_type,
        apt.priority || 'normal',
        apt.notes || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error exporting:', error);
      return { success: false, error: error.message };
    }
  }
}

export const smartAppointmentService = new SmartAppointmentService();
export default smartAppointmentService;
