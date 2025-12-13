// Connection Diagnostics Utility
import { supabase } from '../lib/supabase';
import { powerSyncDb } from '../powersync/client';
import { uploadDiagnostics } from '../powersync/SupabaseConnector';
import { useStatus } from '@powersync/react';

export interface CrudOperation {
  id: string;
  table: string;
  op: number;
  opData: any;
  clientId?: string;
  created_at?: string;
}

export interface SyncDiagnostics {
  uploadQueueSize: number;
  pendingOperations: CrudOperation[];
  lastUploadError: string | null;
  lastUploadErrorAt: number | null;
  successfulUploads: number;
}

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
  sync: SyncDiagnostics;
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

export async function getSyncDiagnostics(): Promise<SyncDiagnostics> {
  try {
    const pendingOperations = await powerSyncDb.getAll(
      'SELECT id, table_name as table, op, op_data as opData FROM ps_crud ORDER BY created_at DESC LIMIT 100'
    );

    const countResult = await powerSyncDb.getOptional(
      'SELECT COUNT(*) as count FROM ps_crud'
    );

    return {
      uploadQueueSize: countResult?.count || 0,
      pendingOperations: pendingOperations as CrudOperation[],
      lastUploadError: uploadDiagnostics.lastUploadError,
      lastUploadErrorAt: uploadDiagnostics.lastUploadErrorAt,
      successfulUploads: uploadDiagnostics.successfulUploads
    };
  } catch (error: any) {
    console.warn('⚠️ Could not fetch ps_crud diagnostics:', error?.message);
    return {
      uploadQueueSize: 0,
      pendingOperations: [],
      lastUploadError: uploadDiagnostics.lastUploadError,
      lastUploadErrorAt: uploadDiagnostics.lastUploadErrorAt,
      successfulUploads: uploadDiagnostics.successfulUploads
    };
  }
}

export async function getFullConnectionStatus(): Promise<ConnectionStatus> {
  const [supabaseStatus, powerSyncStatus, syncDiags] = await Promise.all([
    checkSupabaseConnection(),
    checkPowerSyncConnection(),
    getSyncDiagnostics()
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
    sync: syncDiags,
    overall: {
      status: overallStatus,
      message: message
    }
  };
}

export async function printSyncDiagnostics(): Promise<void> {
  console.group('🔍 POWERSYNC SYNC DIAGNOSTICS');
  
  const status = await getFullConnectionStatus();
  
  console.group('📡 Connection Status');
  console.log(`Overall: ${status.overall.status.toUpperCase()} - ${status.overall.message}`);
  console.log(`Supabase: ${status.supabase.connected ? '✅ Connected' : '❌ Disconnected'}`);
  if (status.supabase.user) console.log(`  User: ${status.supabase.user.email}`);
  if (status.supabase.error) console.error(`  Error: ${status.supabase.error}`);
  console.log(`PowerSync: ${status.powerSync.connected ? '✅ Connected' : '❌ Disconnected'}`);
  if (status.powerSync.error) console.error(`  Error: ${status.powerSync.error}`);
  console.groupEnd();
  
  console.group('📊 Upload Queue Status');
  console.log(`Pending operations: ${status.sync.uploadQueueSize}`);
  console.log(`Successful uploads: ${status.sync.successfulUploads}`);
  
  if (status.sync.lastUploadError) {
    console.group('❌ Last Upload Error');
    console.error(`Message: ${status.sync.lastUploadError}`);
    if (status.sync.lastUploadErrorAt) {
      console.error(`Time: ${new Date(status.sync.lastUploadErrorAt).toLocaleString()}`);
    }
    console.groupEnd();
  } else {
    console.log('✅ No recent upload errors');
  }
  console.groupEnd();
  
  if (status.sync.pendingOperations.length > 0) {
    console.group(`📋 Pending Operations (${status.sync.pendingOperations.length})`);
    status.sync.pendingOperations.slice(0, 10).forEach((op, idx) => {
      const opTypeMap = { 1: 'INSERT', 2: 'UPDATE', 3: 'DELETE' };
      const opType = opTypeMap[op.op as keyof typeof opTypeMap] || `Unknown(${op.op})`;
      console.log(`${idx + 1}. ${op.table} [${op.id}] - ${opType}`);
    });
    if (status.sync.pendingOperations.length > 10) {
      console.log(`... and ${status.sync.pendingOperations.length - 10} more`);
    }
    console.groupEnd();
  }
  
  console.groupEnd();
}

export async function diagnoseSync(): Promise<void> {
  const status = await getFullConnectionStatus();
  
  console.clear();
  console.log('%c🔧 SYNC DIAGNOSTICS REPORT', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  console.log('');
  
  if (status.overall.status === 'disconnected') {
    console.log('%c❌ NOT CONNECTED', 'font-size: 14px; color: #dc2626;');
    if (status.supabase.error) console.log(`  Supabase: ${status.supabase.error}`);
    if (status.powerSync.error) console.log(`  PowerSync: ${status.powerSync.error}`);
  } else if (status.overall.status === 'partial') {
    console.log('%c⚠️ PARTIAL CONNECTION', 'font-size: 14px; color: #ea580c;');
  } else {
    console.log('%c✅ FULLY CONNECTED', 'font-size: 14px; color: #16a34a;');
  }
  
  console.log('');
  
  if (status.sync.uploadQueueSize > 0) {
    console.log('%c📤 UPLOAD QUEUE HAS PENDING DATA', 'font-size: 13px; color: #ea580c; font-weight: bold;');
    console.log(`  Queue size: ${status.sync.uploadQueueSize} operations`);
    
    if (status.sync.lastUploadError) {
      console.log(`  Last error: ${status.sync.lastUploadError}`);
      console.log('  Status: ⏸️  PAUSED (will retry when online)');
    } else {
      console.log('  Status: 📤 UPLOADING or queued for next sync');
    }
  } else {
    console.log('%c✅ NO PENDING UPLOADS', 'font-size: 13px; color: #16a34a;');
  }
  
  console.log('');
  console.log('%cPossible issues & solutions:', 'font-weight: bold;');
  
  if (!status.powerSync.connected) {
    console.log('  1. PowerSync not connected → Check internet connection');
    console.log('     2. Verify VITE_POWERSYNC_URL is configured');
    console.log('     3. Check browser console for auth errors');
  }
  
  if (!status.supabase.connected && status.sync.uploadQueueSize > 0) {
    console.log('  4. Supabase not connected but data pending → No way to upload yet');
    console.log('     Check: Is RLS enabled? Are permissions correct?');
  }
  
  if (status.sync.lastUploadError) {
    console.log('  5. Upload failing → Check error message above');
    console.log('     Common: UNIQUE constraint (duplicate doctor), RLS violation, missing table');
  }
  
  console.log('');
  console.log('💡 Next step: Run diagnoseSync() again after fixing, or check ps_crud table');
}

