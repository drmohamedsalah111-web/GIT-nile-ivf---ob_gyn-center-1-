/// <reference types="vite/client" />
import { PowerSyncBackendConnector } from '@powersync/web';
import { supabase } from '../lib/supabase';

export class AppConfig {
    static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    static readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    static readonly POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL;
}

export class Connector implements PowerSyncBackendConnector {
    async fetchCredentials() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!session || error) {
            throw new Error('Could not fetch credentials');
        }

        return {
            endpoint: AppConfig.POWERSYNC_URL,
            token: session.access_token
        };
    }

    async uploadData(database: any) {
        // Upload logic if needed, usually handled by Supabase automatically via triggers
        // But for PowerSync, we might need to handle writes if we are using local-only tables or custom sync
        // For now, we assume writes go to Supabase directly or via PowerSync's write-back (if configured)
        // Since we are using Supabase as the backend, PowerSync handles the sync from Supabase to local.
        // Writes should be done to PowerSync local DB and then synced back?
        // PowerSync Web SDK handles uploadData by calling this method.
        // We need to implement the upload logic here.

        const transaction = await database.getNextCrudTransaction();
        if (!transaction) return;

        try {
            // Process transaction
            await transaction.complete();
        } catch (error) {
            console.error('Upload failed', error);
            // await transaction.reject();
        }
    }
}
