import { AbstractPowerSyncDatabase, PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { supabase } from '../../services/supabaseClient';

export const POWERSYNC_URL = 'https://6938cb407e2a07e6df7b34de.powersync.journeyapps.com';

export class SupabaseConnector implements PowerSyncBackendConnector {
  
  async fetchCredentials() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No Supabase session found');
    }

    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = op.table;
        const data = op.opData;

        if (!data) continue;

        if (op.op === UpdateType.PUT) {
          const { error } = await supabase.from(table).upsert(data);
          if (error) throw error;
        } else if (op.op === UpdateType.PATCH) {
          const { error } = await supabase.from(table).update(data).eq('id', op.id);
          if (error) throw error;
        } else if (op.op === UpdateType.DELETE) {
          const { error } = await supabase.from(table).delete().eq('id', op.id);
          if (error) throw error;
        }
      }
      await transaction.complete();
    } catch (ex) {
      console.error('Upload failed:', ex);
    }
  }
}
