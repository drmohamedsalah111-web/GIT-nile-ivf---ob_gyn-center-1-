import { supabase } from '../../services/supabaseClient';
import { Appointment } from '../../types';

export const appointmentService = {
    // Get appointments for a specific date
    getAppointments: async (date: string): Promise<Appointment[]> => {
        try {
            // We want to fetch appointments for the whole day, so we look for range [start, end]
            // Assuming date is 'YYYY-MM-DD'
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          patient:patients (
            name,
            phone
          )
        `)
                .gte('appointment_date', startOfDay.toISOString())
                .lte('appointment_date', endOfDay.toISOString())
                .order('appointment_date', { ascending: true });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching appointments:', error);
            return [];
        }
    },

    // Create a new appointment
    createAppointment: async (appointment: Partial<Appointment>): Promise<Appointment | null> => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([appointment])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    },

    // Update appointment status
    updateStatus: async (id: string, status: 'Scheduled' | 'Waiting' | 'Completed' | 'Cancelled' | 'No Show'): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error updating appointment status:', error);
            return false;
        }
    }
};
