/// <reference types="vite/client" />
import { PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { supabase } from '../lib/supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    console.log('🔐 SupabaseConnector: Fetching credentials...');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session || error) {
      console.error('❌ SupabaseConnector: No session or error', error);
      throw new Error('Could not fetch credentials');
    }

    console.log('✅ SupabaseConnector: Credentials fetched successfully');
    return {
      endpoint: import.meta.env.VITE_POWERSYNC_URL,
      token: session.access_token
    };
  }

  async uploadData(database: any) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = op.table;
        const data = op.opData;

        if (op.op === UpdateType.PUT) {
          await supabase.from(table).upsert(data);
        } else if (op.op === UpdateType.PATCH) {
          await supabase.from(table).update(data).eq('id', data.id);
        } else if (op.op === UpdateType.DELETE) {
          await supabase.from(table).delete().eq('id', data.id);
        }
      }
      await transaction.complete();
    } catch (error) {
      console.error('Upload failed', error);
      // await transaction.reject();
    }
  }
}
