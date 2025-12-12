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
const CONNECTION_COOLDOWN = 5000; // 5 seconds cooldown between connection attempts

// Track initialization state to ensure PowerSync initializes only once per session
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Initialize and connect PowerSync with retry logic
export async function initPowerSync(retries = 3, delay = 2000, force = false): Promise<void> {
  // If already initializing, return the existing promise
  if (initPromise && !force) {
    console.log('⏸️ PowerSync initialization already in progress, returning existing promise...');
    return initPromise;
  }

  // Prevent multiple simultaneous connection attempts (unless forced)
  const now = Date.now();
  if (!force && isConnecting) {
    console.log('⏸️ PowerSync connection already in progress, skipping...');
    return;
  }

  if (!force && now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    console.log('⏸️ PowerSync connection cooldown active, skipping...');
    return;
  }

  // Prevent multiple initializations unless forced (for offline-first, initialize once per session)
  if (!force && isInitialized) {
    console.log('⏸️ PowerSync already initialized for this session, skipping...');
    return;
  }

  // Create the init promise
  const performInit = async () => {
    isConnecting = true;
    lastConnectionAttempt = now;

    try {
      console.log('🚀 PowerSync init start - session initialization');

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

      // First, verify credentials before attempting connection
      console.log('🔐 Verifying credentials before connection...');
      const credentials = await connector.fetchCredentials();
      if (!credentials) {
        console.error('❌ Failed to fetch credentials - cannot connect to PowerSync');
        console.error('❌ Please check:');
        console.error('   1. You are logged in');
        console.error('   2. VITE_POWERSYNC_URL is correct');
        console.error('   3. Supabase session is valid');
        return;
      }
      console.log('✅ Credentials verified:', {
        endpoint: credentials.endpoint,
        hasToken: !!credentials.token
      });

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`🔌 Attempting to connect PowerSync (attempt ${attempt}/${retries})...`);
          console.log(`🔗 Endpoint: ${credentials.endpoint}`);

          // Disconnect first if already connected (for reconnection)
          try {
            await powerSyncDb.disconnect();
          } catch (disconnectError) {
            // Ignore disconnect errors
          }

          await powerSyncDb.connect(connector);
          console.log('✅ PowerSync connection success - offline-first DB ready');
          isInitialized = true; // Mark as initialized for this session
          return;
        } catch (error: any) {
          const isLastAttempt = attempt === retries;
          console.warn(`⚠️ PowerSync connection attempt ${attempt} failed:`, error?.message);
          console.warn(`⚠️ Error type:`, error?.constructor?.name);
          console.warn(`⚠️ Error stack:`, error?.stack);

          if (isLastAttempt) {
            console.error('❌ PowerSync connection failure - all retries exhausted');
            console.error('❌ Final error details:', error);
            console.warn('⚠️ Switching to offline mode - local data preserved');
            console.warn('⚠️ App will work with cached data until connection restored');

            // Provide specific error messages
            if (navigator.onLine) {
              console.error('❌ Network available but PowerSync connection failed');
              console.error('❌ Possible causes:');
              console.error('   1. VITE_POWERSYNC_URL is incorrect');
              console.error('   2. PowerSync server is down');
              console.error('   3. Authentication token expired');
              console.error('   4. Network firewall blocking connection');
              console.error('   5. PowerSync sync rules not configured');
              console.error('   6. CORS issues');

              // Check specific error types
              if (error?.message?.includes('fetch')) {
                console.error('❌ Network error detected - check internet connection');
              }
              if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
                console.error('❌ Authentication error - token may be expired');
              }
              if (error?.message?.includes('CORS')) {
                console.error('❌ CORS error - check PowerSync server configuration');
              }
            }
            throw error; // Throw to allow caller to handle
          }

          // Wait before retrying
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } finally {
      isConnecting = false;
      initPromise = null; // Clear the promise after completion
    }
  };

  initPromise = performInit();
}
