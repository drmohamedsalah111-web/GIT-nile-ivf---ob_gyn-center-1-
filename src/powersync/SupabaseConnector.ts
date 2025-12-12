/// <reference types="vite/client" />
import { PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { supabase } from '../lib/supabase';

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
    if (!transaction) return;

    const UPLOAD_RETRIES = 3;
    const RETRY_DELAY = 1000;

    const uploadWithRetry = async (op: any): Promise<{ success: boolean; error?: string }> => {
      const { table, opData } = op;

      for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt++) {
        try {
          let result;

          if (op.op === UpdateType.PUT) {
            result = await supabase.from(table).upsert(opData, { onConflict: 'id' });
          } else if (op.op === UpdateType.PATCH) {
            result = await supabase.from(table).update(opData).eq('id', opData.id);
          } else if (op.op === UpdateType.DELETE) {
            result = await supabase.from(table).delete().eq('id', opData.id);
          } else {
            return { success: false, error: `Unknown operation type: ${op.op}` };
          }

          if (result.error) {
            const statusCode = result.error?.code;
            
            if (attempt < UPLOAD_RETRIES && ['PGRST116', 'PGRST301', 'Connection'].some(c => statusCode?.includes(c))) {
              const delayMs = RETRY_DELAY * attempt;
              console.warn(`⚠️ [${table}] Retry ${attempt}/${UPLOAD_RETRIES} in ${delayMs}ms:`, result.error.message);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }

            return { success: false, error: result.error.message };
          }

          console.log(`✅ [${table}] ${op.op === UpdateType.PUT ? 'Upserted' : op.op === UpdateType.PATCH ? 'Updated' : 'Deleted'} successfully (attempt ${attempt})`);
          return { success: true };
        } catch (error: any) {
          const isLastAttempt = attempt === UPLOAD_RETRIES;
          console.error(`❌ [${table}] Upload error (attempt ${attempt}/${UPLOAD_RETRIES}):`, error?.message);

          if (isLastAttempt) {
            return { success: false, error: error?.message };
          }

          const delayMs = RETRY_DELAY * attempt;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      return { success: false, error: 'Max retries exceeded' };
    };

    try {
      let successCount = 0;
      let failCount = 0;
      const failures = [];

      for (const op of transaction.crud) {
        const result = await uploadWithRetry(op);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          failures.push({ table: op.table, error: result.error });
        }
      }

      if (failCount === 0) {
        console.log(`✅ Upload complete: ${successCount} operations successful`);
        await transaction.complete();
      } else {
        console.warn(`⚠️ Upload partial: ${successCount} successful, ${failCount} failed`);
        console.error('Failed operations:', failures);
        await transaction.complete();
      }
    } catch (error: any) {
      console.error('❌ Upload transaction failed:', error?.message);
    }
  }
}
