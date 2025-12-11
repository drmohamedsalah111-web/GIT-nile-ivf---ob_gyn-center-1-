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
    // Check if offline before attempting connection
    if (!navigator.onLine) {
      console.warn('⚠️ Browser is offline - PowerSync will work in offline mode');
      return;
    }

    console.log('🔌 Attempting to connect PowerSync...');
    await powerSyncDb.connect(connector);
    console.log('✅ PowerSync connected successfully');
  } catch (error: any) {
    console.warn('⚠️ PowerSync connection failed (offline mode available):', error?.message);
    console.warn('⚠️ Error details:', error);
    // Don't throw - allow app to work offline
    if (navigator.onLine) {
      console.error('❌ Network available but PowerSync connection failed');
    }
  }
}
