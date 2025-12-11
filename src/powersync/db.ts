import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './AppSchema';
import { SupabaseConnector } from './SupabaseConnector';

export const powerSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'clinic-powersync.db',
  },
});

let connector: SupabaseConnector | null = null;
let connected = false;

export async function initPowerSync() {
  if (connected) {
    return;
  }

  if (!connector) {
    connector = new SupabaseConnector();
  }

  await connector.init();
  // Skip anonymous login - use existing authenticated session

  await powerSync.connect(connector);

  console.log('✅ PowerSync connected');
  connected = true;
}
