/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEnvironment, logEnvironmentStatus } from './envValidation';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment at module load time
const envValidation = validateEnvironment();

// Log environment status on startup
if (import.meta.env.DEV || !import.meta.env.PROD) {
  logEnvironmentStatus();
} else {
  if (!envValidation.isValid) {
    console.error('❌ CRITICAL: Environment variables not properly configured');
    envValidation.errors.forEach(err => {
      console.error(`   ❌ ${err}`);
    });
  } else {
    console.log('✅ Environment validation passed');
  }
}

// Create Supabase client with optimized options
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '', // Fallback to empty string if not configured
  supabaseKey || '', // Fallback to empty string if not configured
  {
    auth: {
      // Automatically refresh tokens before they expire
      autoRefreshToken: !(import.meta.env.DEV || import.meta.env.VITE_OFFLINE_DEV_MODE),
      // Persist session in localStorage
      persistSession: true,
      // Detect session from URL hash (for OAuth redirects)
      detectSessionInUrl: true,
      // Storage key for session
      storageKey: 'supabase.auth.token',
      // Storage implementation (defaults to localStorage)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    // Global fetch options
    global: {
      headers: {
        'x-client-info': 'nile-ivf-emr@1.0.0',
      },
    },
    // Realtime options (if needed in future)
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

// Helper function to get configuration status
export function getSupabaseConfigStatus(): {
  urlConfigured: boolean;
  keyConfigured: boolean;
  fullyConfigured: boolean;
} {
  return {
    urlConfigured: !!supabaseUrl,
    keyConfigured: !!supabaseKey,
    fullyConfigured: !!(supabaseUrl && supabaseKey),
  };
}

// Export environment validation for use in other parts of the app
export { validateEnvironment, hasEnvironmentErrors, getEnvironmentErrors } from './envValidation';

// Log configuration status in development
if (import.meta.env.DEV) {
  const configStatus = getSupabaseConfigStatus();
  if (configStatus.fullyConfigured) {
    console.log('✅ Supabase configured successfully');
    console.log('🔗 URL:', supabaseUrl?.substring(0, 30) + '...');
  } else {
    console.warn('⚠️ Supabase configuration incomplete:');
    console.warn('   URL:', configStatus.urlConfigured ? '✓' : '✗');
    console.warn('   Key:', configStatus.keyConfigured ? '✓' : '✗');
  }
}
