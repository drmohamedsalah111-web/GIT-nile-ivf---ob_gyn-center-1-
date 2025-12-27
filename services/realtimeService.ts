// Realtime Sync Service for Strict Separation Billing System
// This service manages all realtime subscriptions between Secretary and Doctor dashboards

import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback = (payload: any) => void;

class RealtimeSyncService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to service requests (Doctor → Secretary notifications)
   * When doctor requests a service, secretary gets instant notification
   */
  subscribeToServiceRequests(callback: RealtimeCallback): () => void {
    const channelName = 'service_requests_realtime';
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          console.log('New service request:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          console.log('Service request updated:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to appointment check-ins (Secretary → Doctor notifications)
   * When secretary checks in a patient, doctor's queue updates instantly
   */
  subscribeToAppointmentCheckIns(
    doctorId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `appointments_checkin_${doctorId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        (payload) => {
          // Only trigger callback if checked_in_at was changed
          const oldCheckedIn = payload.old?.checked_in_at;
          const newCheckedIn = payload.new?.checked_in_at;
          
          if (!oldCheckedIn && newCheckedIn) {
            console.log('Patient checked in:', payload);
            callback(payload);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to all appointments for today (Secretary dashboard)
   * Updates queue in real-time as appointments change
   */
  subscribeToTodayAppointments(callback: RealtimeCallback): () => void {
    const today = new Date().toISOString().split('T')[0];
    const channelName = `appointments_today_${today}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'appointments',
          filter: `date=eq.${today}`
        },
        (payload) => {
          console.log('Appointment changed:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to invoice updates
   * Updates payment status in real-time
   */
  subscribeToInvoiceUpdates(callback: RealtimeCallback): () => void {
    const channelName = 'invoices_realtime';
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          console.log('Invoice changed:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to payment status changes for specific appointment
   * Real-time payment tracking
   */
  subscribeToAppointmentPayment(
    appointmentId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `appointment_payment_${appointmentId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`
        },
        (payload) => {
          // Check if payment status changed
          if (payload.old?.payment_status !== payload.new?.payment_status) {
            console.log('Payment status changed:', payload);
            callback(payload);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Broadcast custom event (e.g., notification sounds, alerts)
   */
  broadcastEvent(channel: string, event: string, payload: any): void {
    const ch = this.channels.get(channel);
    if (ch) {
      ch.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }

  /**
   * Subscribe to broadcast channel for custom events
   */
  subscribeToBroadcast(
    channelName: string,
    eventName: string,
    callback: RealtimeCallback
  ): () => void {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel
      .on('broadcast', { event: eventName }, callback)
      .subscribe();

    return () => {
      channel?.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Unsubscribe from all channels (cleanup)
   */
  unsubscribeAll(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  /**
   * Get channel status
   */
  getChannelStatus(channelName: string): string | undefined {
    const channel = this.channels.get(channelName);
    return channel?.state;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeSyncService();

// Helper hook for React components
export const useRealtimeSync = () => {
  return {
    subscribeToServiceRequests: realtimeService.subscribeToServiceRequests.bind(realtimeService),
    subscribeToAppointmentCheckIns: realtimeService.subscribeToAppointmentCheckIns.bind(realtimeService),
    subscribeToTodayAppointments: realtimeService.subscribeToTodayAppointments.bind(realtimeService),
    subscribeToInvoiceUpdates: realtimeService.subscribeToInvoiceUpdates.bind(realtimeService),
    subscribeToAppointmentPayment: realtimeService.subscribeToAppointmentPayment.bind(realtimeService),
    subscribeToBroadcast: realtimeService.subscribeToBroadcast.bind(realtimeService),
    broadcastEvent: realtimeService.broadcastEvent.bind(realtimeService),
    unsubscribeAll: realtimeService.unsubscribeAll.bind(realtimeService),
    getChannelStatus: realtimeService.getChannelStatus.bind(realtimeService),
    getActiveChannels: realtimeService.getActiveChannels.bind(realtimeService)
  };
};
