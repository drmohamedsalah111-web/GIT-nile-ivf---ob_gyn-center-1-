import { AbstractPowerSyncDatabase, PowerSyncBackendConnector, PowerSyncCredentials } from '@powersync/web';
import { supabase } from '../lib/supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
    private client = supabase;

    async fetchCredentials(): Promise<PowerSyncCredentials> {
        const { data: { session }, error } = await this.client.auth.getSession();

        if (!session || error) {
            throw new Error('No active session');
        }

        return {
            endpoint: import.meta.env.VITE_POWERSYNC_URL,
            token: session.access_token
        };
    }

    async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
        const transaction = await database.getNextCrudTransaction();

        if (!transaction) {
            return;
        }

        let lastOp: any = null;
        try {
            for (const op of transaction.crud) {
                lastOp = op;
                const table = this.client.from(op.table);

                switch (op.op) {
                    case 'PUT':
                        await table.upsert({ ...op.opData, id: op.id });
                        break;
                    case 'PATCH':
                        await table.update(op.opData).eq('id', op.id);
                        break;
                    case 'DELETE':
                        await table.delete().eq('id', op.id);
                        break;
                }
            }

            await transaction.complete();
        } catch (error) {
            console.error('Upload error:', error, lastOp);
            throw error;
        }
    }
}
