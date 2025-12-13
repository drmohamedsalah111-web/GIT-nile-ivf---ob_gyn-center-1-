/// <reference types="vite/client" />
import { PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { supabase } from '../lib/supabase';

// Diagnostic state for upload errors and pending CRUD count
export interface UploadDiagnostics {
  pendingCrudCount: number;
  lastUploadError: string | null;
  lastUploadErrorAt: number | null;
  successfulUploads: number;
}

export const uploadDiagnostics: UploadDiagnostics = {
  pendingCrudCount: 0,
  lastUploadError: null,
  lastUploadErrorAt: null,
  successfulUploads: 0
};

// Subscribers for diagnostic updates (for UI components)
const diagnosticSubscribers = new Set<(diag: UploadDiagnostics) => void>();

export function subscribeToDiagnostics(callback: (diag: UploadDiagnostics) => void) {
  diagnosticSubscribers.add(callback);
  return () => diagnosticSubscribers.delete(callback);
}

function notifyDiagnosticsChange() {
  diagnosticSubscribers.forEach(cb => cb({ ...uploadDiagnostics }));
}

// Cache credentials to prevent excessive calls
let credentialsCache: { endpoint: string; token: string; expiresAt: number; lastFetch: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const MIN_FETCH_INTERVAL = 2000; // Minimum 2 seconds between fetches (even if cache invalidated)

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const now = Date.now();
    
    // Check cache first - use it if still valid
    if (credentialsCache && credentialsCache.expiresAt > now) {
      // Only log occasionally to reduce console spam
      if (Math.random() < 0.1) { // Log 10% of the time
        console.log('🔐 SupabaseConnector: Using cached credentials');
      }
      return {
        endpoint: credentialsCache.endpoint,
        token: credentialsCache.token
      };
    }

    // Rate limiting: Don't fetch too frequently even if cache invalidated
    if (credentialsCache && (now - credentialsCache.lastFetch) < MIN_FETCH_INTERVAL) {
      // Return cached token even if expired, to prevent excessive calls
      console.log('🔐 SupabaseConnector: Rate limiting - using cached credentials');
      return {
        endpoint: credentialsCache.endpoint,
        token: credentialsCache.token
      };
    }

    console.log('🔐 SupabaseConnector: Fetching credentials...');
    try {
      // Check environment variables first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const endpoint = import.meta.env.VITE_POWERSYNC_URL;
      
      if (!supabaseUrl) {
        console.error('❌ SupabaseConnector: VITE_SUPABASE_URL not configured');
        console.error('❌ يرجى إضافة VITE_SUPABASE_URL في ملف .env');
        return null;
      }
      
      if (!endpoint) {
        console.error('❌ SupabaseConnector: VITE_POWERSYNC_URL not configured');
        console.error('❌ يرجى إضافة VITE_POWERSYNC_URL في ملف .env');
        console.error('❌ يمكنك الحصول على الرابط من PowerSync Dashboard > Settings > Instance URL');
        return null;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        console.warn('⚠️ SupabaseConnector: No session found', error?.message);
        console.warn('⚠️ يرجى تسجيل الدخول مرة أخرى');
        // Clear cache on auth error
        credentialsCache = null;
        return null;
      }

      if (!session.access_token) {
        console.warn('⚠️ SupabaseConnector: No access token in session');
        console.warn('⚠️ يرجى تسجيل الدخول مرة أخرى');
        // Clear cache on auth error
        credentialsCache = null;
        return null;
      }

      // Cache the credentials
      credentialsCache = {
        endpoint: endpoint,
        token: session.access_token,
        expiresAt: Date.now() + CACHE_DURATION,
        lastFetch: Date.now()
      };

      // Only log occasionally to reduce console spam
      if (Math.random() < 0.2) { // Log 20% of the time
        console.log('✅ SupabaseConnector: Credentials fetched successfully');
        console.log('🔗 Endpoint:', endpoint);
        console.log('🔑 Token exists:', !!session.access_token);
      }
      return {
        endpoint: endpoint,
        token: session.access_token
      };
    } catch (error: any) {
      console.error('❌ SupabaseConnector: Error fetching credentials:', error?.message);
      console.error('❌ تفاصيل الخطأ:', error);
      // Clear cache on error
      credentialsCache = null;
      return null;
    }
  }

  // Method to invalidate cache (useful when token expires)
  // Note: PowerSync SDK calls this frequently, so we use rate limiting instead of clearing cache
  invalidateCredentials() {
    // Don't clear cache immediately - use rate limiting instead
    // Only clear if cache is very old (more than 10 minutes)
    if (credentialsCache) {
      const age = Date.now() - credentialsCache.lastFetch;
      if (age > 10 * 60 * 1000) { // 10 minutes
        credentialsCache = null;
        console.log('🔄 SupabaseConnector: Credentials cache invalidated (old cache)');
      } else {
        // Just mark as needing refresh, but keep for rate limiting
        // Don't log - PowerSync calls this too frequently
      }
    }
    // Don't log invalidate calls - they're too frequent
  }

  async uploadData(database: any) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      uploadDiagnostics.pendingCrudCount = 0;
      notifyDiagnosticsChange();
      return;
    }

    const UPLOAD_RETRIES = 3;
    const RETRY_DELAY = 1000; // exponential backoff: 1s, 2s, 3s

    const uploadWithRetry = async (op: any): Promise<{ success: boolean; error?: string; recordId?: string }> => {
      const { table, opData } = op;
      const recordId = opData?.id || 'unknown';

      for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt++) {
        try {
          let result;
          const operationType = 
            op.op === UpdateType.PUT ? 'PUT (upsert)' : 
            op.op === UpdateType.PATCH ? 'PATCH (update)' : 
            op.op === UpdateType.DELETE ? 'DELETE' : 'UNKNOWN';

          if (op.op === UpdateType.PUT) {
            result = await supabase.from(table).upsert(opData, { onConflict: 'id' });
          } else if (op.op === UpdateType.PATCH) {
            const { id, ...updateData } = opData;
            result = await supabase.from(table).update(updateData).eq('id', id);
          } else if (op.op === UpdateType.DELETE) {
            result = await supabase.from(table).delete().eq('id', recordId);
          } else {
            return { success: false, error: `Unknown operation type: ${op.op}`, recordId };
          }

          if (result.error) {
            const statusCode = result.error?.code;
            const isRetryable = ['PGRST116', 'PGRST301', 'Connection'].some(c => statusCode?.includes(c));
            
            if (attempt < UPLOAD_RETRIES && isRetryable) {
              const delayMs = RETRY_DELAY * attempt;
              console.warn(`⚠️ [${table}:${recordId}] ${operationType} retry ${attempt}/${UPLOAD_RETRIES} in ${delayMs}ms: ${result.error.message}`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }

            return { success: false, error: `[${table}:${recordId}] ${result.error.message}`, recordId };
          }

          console.log(`✅ [${table}:${recordId}] ${operationType} success (attempt ${attempt})`);
          return { success: true, recordId };
        } catch (error: any) {
          const isLastAttempt = attempt === UPLOAD_RETRIES;
          console.error(`❌ [${table}:${recordId}] Upload error (attempt ${attempt}/${UPLOAD_RETRIES}): ${error?.message}`);

          if (isLastAttempt) {
            return { success: false, error: `[${table}:${recordId}] ${error?.message}`, recordId };
          }

          const delayMs = RETRY_DELAY * attempt;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      return { success: false, error: `[${table}:${recordId}] Max retries exceeded`, recordId };
    };

    try {
      let successCount = 0;
      let failCount = 0;
      const failures: Array<{ table: string; recordId: string; error: string }> = [];

      // Process each CRUD operation
      for (const op of transaction.crud) {
        const result = await uploadWithRetry(op);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          failures.push({ 
            table: op.table, 
            recordId: result.recordId || 'unknown',
            error: result.error || 'Unknown error' 
          });
        }
      }

      // Update pending CRUD count
      uploadDiagnostics.pendingCrudCount = transaction.crud.length;

      if (failCount === 0) {
        // All operations succeeded - complete the transaction
        console.log(`✅ Upload complete: ${successCount} operations successful`);
        uploadDiagnostics.successfulUploads += successCount;
        uploadDiagnostics.lastUploadError = null;
        uploadDiagnostics.lastUploadErrorAt = null;
        uploadDiagnostics.pendingCrudCount = 0;
        await transaction.complete();
        console.log('✅ Transaction marked complete');
      } else {
        // Partial or complete failure - DO NOT complete the transaction
        const errorMsg = `${successCount} OK, ${failCount} FAILED: ${failures.map(f => f.error).join(' | ')}`;
        console.warn(`⚠️ Upload partial failure: ${errorMsg}`);
        uploadDiagnostics.lastUploadError = errorMsg;
        uploadDiagnostics.lastUploadErrorAt = Date.now();
        
        // Log individual failures for debugging
        failures.forEach(f => {
          console.error(`   ❌ ${f.table}[${f.recordId}]: ${f.error}`);
        });
        
        // CRITICAL: Do NOT call transaction.complete() - leave for retry
        console.log('⏸️ Transaction pending for retry (not completed)');
      }

      notifyDiagnosticsChange();
    } catch (error: any) {
      const errorMsg = `Transaction error: ${error?.message}`;
      console.error(`❌ ${errorMsg}`);
      uploadDiagnostics.lastUploadError = errorMsg;
      uploadDiagnostics.lastUploadErrorAt = Date.now();
      notifyDiagnosticsChange();
    }
  }
}
