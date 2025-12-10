import { PowerSyncDatabase, WASQLiteDBAdapter } from '@powersync/web';
import { AppSchema } from './AppSchema';
import { SupabaseConnector } from './SupabaseConnector';

let db: PowerSyncDatabase;
let connector: SupabaseConnector;

export const getDB = () => db;
export const getConnector = () => connector;

export const initPowerSync = async () => {
  console.log('🔌 Initializing PowerSync...');
  
  const dbAdapter = new WASQLiteDBAdapter({
    dbFilename: 'clinic_powersync_v1.db',
  });
  
  db = new PowerSyncDatabase({
    schema: AppSchema,
    database: dbAdapter,
  });
  
  connector = new SupabaseConnector();
  
  await db.init();
  await db.connect(connector);
  console.log('✅ PowerSync Connected!');
};

