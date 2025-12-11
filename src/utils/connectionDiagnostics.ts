// Connection Diagnostics Utility
import { supabase } from '../lib/supabase';
import { powerSyncDb } from '../powersync/client';
import { useStatus } from '@powersync/react';

export interface ConnectionStatus {
  supabase: {
    connected: boolean;
    url: string;
    error?: string;
    user?: any;
  };
  powerSync: {
    connected: boolean;
    endpoint?: string;
    error?: string;
    lastSyncedAt?: Date;
  };
  overall: {
    status: 'connected' | 'partial' | 'disconnected';
    message: string;
  };
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  url: string;
  error?: string;
  user?: any;
}> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        connected: false,
        url: 'Not configured',
        error: 'VITE_SUPABASE_URL not found in environment variables'
      };
    }

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        connected: false,
        url: supabaseUrl,
        error: sessionError.message
      };
    }

    if (!session) {
      return {
        connected: false,
        url: supabaseUrl,
        error: 'No active session. Please log in.'
      };
    }

    // Test database connection
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (error) {
      return {
        connected: false,
        url: supabaseUrl,
        error: `Database error: ${error.message}`,
        user: session.user
      };
    }

    return {
      connected: true,
      url: supabaseUrl,
      user: session.user
    };
  } catch (error: any) {
    return {
      connected: false,
      url: import.meta.env.VITE_SUPABASE_URL || 'Unknown',
      error: error?.message || 'Unknown error'
    };
  }
}

export async function checkPowerSyncConnection(): Promise<{
  connected: boolean;
  endpoint?: string;
  error?: string;
  lastSyncedAt?: Date;
}> {
  try {
    const endpoint = import.meta.env.VITE_POWERSYNC_URL;
    
    if (!endpoint) {
      return {
        connected: false,
        error: 'VITE_POWERSYNC_URL not found in environment variables'
      };
    }

    // Try to query PowerSync database
    try {
      const testQuery = await powerSyncDb.getAll('SELECT 1 as test');
      
      // Check connection status via useStatus hook would need to be called from component
      // For now, we'll check if we can query
      return {
        connected: true,
        endpoint: endpoint
      };
    } catch (dbError: any) {
      return {
        connected: false,
        endpoint: endpoint,
        error: `Database query failed: ${dbError?.message}`
      };
    }
  } catch (error: any) {
    return {
      connected: false,
      error: error?.message || 'Unknown error'
    };
  }
}

export async function getFullConnectionStatus(): Promise<ConnectionStatus> {
  const [supabaseStatus, powerSyncStatus] = await Promise.all([
    checkSupabaseConnection(),
    checkPowerSyncConnection()
  ]);

  // Determine overall status
  let overallStatus: 'connected' | 'partial' | 'disconnected';
  let message: string;

  if (supabaseStatus.connected && powerSyncStatus.connected) {
    overallStatus = 'connected';
    message = '✅ جميع الاتصالات تعمل بشكل صحيح';
  } else if (supabaseStatus.connected) {
    overallStatus = 'partial';
    message = '⚠️ Supabase متصل، لكن PowerSync غير متصل - البيانات متاحة من Supabase مباشرة';
  } else if (powerSyncStatus.connected) {
    overallStatus = 'partial';
    message = '⚠️ PowerSync متصل، لكن Supabase غير متصل';
  } else {
    overallStatus = 'disconnected';
    message = '❌ جميع الاتصالات فاشلة - يرجى التحقق من الإعدادات';
  }

  return {
    supabase: supabaseStatus,
    powerSync: powerSyncStatus,
    overall: {
      status: overallStatus,
      message: message
    }
  };
}

