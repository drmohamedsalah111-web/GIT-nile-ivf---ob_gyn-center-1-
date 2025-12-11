/// <reference types="vite/client" />
import { PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { supabase } from '../lib/supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    console.log('🔐 SupabaseConnector: Fetching credentials...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        console.warn('⚠️ SupabaseConnector: No session found', error?.message);
        return null;
      }

      const endpoint = import.meta.env.VITE_POWERSYNC_URL;
      if (!endpoint) {
        console.error('❌ SupabaseConnector: VITE_POWERSYNC_URL not configured');
        return null;
      }

      if (!session.access_token) {
        console.warn('⚠️ SupabaseConnector: No access token in session');
        return null;
      }

      console.log('✅ SupabaseConnector: Credentials fetched successfully');
      return {
        endpoint: endpoint,
        token: session.access_token
      };
    } catch (error: any) {
      console.error('❌ SupabaseConnector: Error fetching credentials:', error?.message);
      return null;
    }
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
