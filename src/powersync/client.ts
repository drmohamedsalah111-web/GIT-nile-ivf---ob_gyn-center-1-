import { WASQLitePowerSyncDatabaseOpenFactory } from '@powersync/web';
import { AppSchema } from './schema';
import { SupabaseConnector } from './SupabaseConnector';

// Create PowerSync database instance
export const powerSyncDb = new WASQLitePowerSyncDatabaseOpenFactory({
    schema: AppSchema,
    dbFilename: 'powersync.db',
    // Use the worker script from the public directory
    // @ts-ignore
    workerScriptURL: '/powersync.worker.js'
}).getInstance();

// Create connector instance
export const connector = new SupabaseConnector();

// Initialize and connect PowerSync
export async function initPowerSync() {
    console.log('🔌 Initializing PowerSync...');

    try {
        await powerSyncDb.connect(connector);
        console.log('✅ PowerSync connected successfully');
    } catch (error) {
        console.error('❌ PowerSync connection failed:', error);
        throw error;
    }
}
