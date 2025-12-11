/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not configured');
  console.error('❌ يرجى إضافة VITE_SUPABASE_URL في ملف .env');
  console.error('❌ يمكنك الحصول على الرابط من Supabase Dashboard > Settings > API');
}

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not configured');
  console.error('❌ يرجى إضافة VITE_SUPABASE_ANON_KEY في ملف .env');
  console.error('❌ يمكنك الحصول على المفتاح من Supabase Dashboard > Settings > API');
}

// Create Supabase client with optimized options
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '', // Fallback to empty string if not configured
  supabaseKey || '', // Fallback to empty string if not configured
  {
    auth: {
      // Automatically refresh tokens before they expire
      autoRefreshToken: true,
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
