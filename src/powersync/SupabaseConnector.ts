/// <reference types="vite/client" />
import { PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { supabase } from '../lib/supabase';

// Cache credentials to prevent excessive calls
let credentialsCache: { endpoint: string; token: string; expiresAt: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    // Check cache first
    if (credentialsCache && credentialsCache.expiresAt > Date.now()) {
      console.log('🔐 SupabaseConnector: Using cached credentials');
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
        expiresAt: Date.now() + CACHE_DURATION
      };

      console.log('✅ SupabaseConnector: Credentials fetched successfully');
      console.log('🔗 Endpoint:', endpoint);
      console.log('🔑 Token exists:', !!session.access_token);
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
  invalidateCredentials() {
    credentialsCache = null;
    console.log('🔄 SupabaseConnector: Credentials cache invalidated');
  }

  async uploadData(database: any) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      let successCount = 0;
      let failCount = 0;

      for (const op of transaction.crud) {
        const table = op.table;
        const data = op.opData;

        try {
          if (op.op === UpdateType.PUT) {
            const { error } = await supabase.from(table).upsert(data);
            if (error) throw error;
          } else if (op.op === UpdateType.PATCH) {
            const { error } = await supabase.from(table).update(data).eq('id', data.id);
            if (error) throw error;
          } else if (op.op === UpdateType.DELETE) {
            const { error } = await supabase.from(table).delete().eq('id', data.id);
            if (error) throw error;
          }
          successCount++;
        } catch (error: any) {
          failCount++;
          console.error(`❌ Upload failed for ${table}:`, error?.message);
        }
      }

      if (failCount === 0) {
        console.log(`✅ Upload complete: ${successCount} operations successful`);
        await transaction.complete();
      } else {
        console.warn(`⚠️ Upload partial: ${successCount} successful, ${failCount} failed`);
        await transaction.complete();
      }
    } catch (error: any) {
      console.error('❌ Upload transaction failed:', error?.message);
    }
  }
}
