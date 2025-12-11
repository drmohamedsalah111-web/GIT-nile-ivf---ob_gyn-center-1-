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

// Track connection state to prevent multiple simultaneous connection attempts
let isConnecting = false;
let lastConnectionAttempt = 0;
const CONNECTION_COOLDOWN = 10000; // 10 seconds cooldown between connection attempts

// Initialize and connect PowerSync with retry logic
export async function initPowerSync(retries = 2, delay = 3000): Promise<void> {
  // Prevent multiple simultaneous connection attempts
  const now = Date.now();
  if (isConnecting) {
    console.log('⏸️ PowerSync connection already in progress, skipping...');
    return;
  }
  
  if (now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    console.log('⏸️ PowerSync connection cooldown active, skipping...');
    return;
  }

  isConnecting = true;
  lastConnectionAttempt = now;

  try {
    console.log('🔌 Initializing PowerSync...');

    // Check if offline before attempting connection
    if (!navigator.onLine) {
      console.warn('⚠️ Browser is offline - PowerSync will work in offline mode');
      console.warn('⚠️ البيانات متاحة من Supabase مباشرة');
      return;
    }

    // Check environment variables
    const endpoint = import.meta.env.VITE_POWERSYNC_URL;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!endpoint || !supabaseUrl) {
      console.error('❌ PowerSync: Missing required environment variables');
      console.error('   VITE_POWERSYNC_URL:', endpoint ? '✓' : '✗');
      console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
      console.error('❌ يرجى إضافة المتغيرات المطلوبة في ملف .env');
      console.error('❌ يمكنك الحصول على القيم من:');
      console.error('   - Supabase Dashboard > Settings > API');
      console.error('   - PowerSync Dashboard > Settings > Instance URL');
      console.warn('⚠️ التطبيق سيعمل في وضع أوفلاين - البيانات متاحة من Supabase مباشرة');
      return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔌 Attempting to connect PowerSync (attempt ${attempt}/${retries})...`);
        await powerSyncDb.connect(connector);
        console.log('✅ PowerSync connected successfully');
        return;
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        console.warn(`⚠️ PowerSync connection attempt ${attempt} failed:`, error?.message);
        
        if (isLastAttempt) {
          console.error('❌ PowerSync connection failed after all retries');
          console.error('❌ Error details:', error);
          console.warn('⚠️ التطبيق سيعمل في وضع أوفلاين');
          console.warn('⚠️ البيانات القديمة متاحة من Supabase مباشرة');
          // Don't throw - allow app to work offline, but log the error
          if (navigator.onLine) {
            console.error('❌ Network available but PowerSync connection failed');
            console.error('❌ Possible causes:');
            console.error('   1. VITE_POWERSYNC_URL is incorrect');
            console.error('   2. PowerSync server is down');
            console.error('   3. Authentication token expired');
            console.error('   4. Network firewall blocking connection');
          }
          return;
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } finally {
    isConnecting = false;
  }
}
