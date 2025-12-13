/// <reference types="vite/client" />

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingKeys: string[];
}

function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && url.includes('supabase.co');
  } catch {
    return false;
  }
}

function isValidJWT(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingKeys: []
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const powerSyncUrl = import.meta.env.VITE_POWERSYNC_URL;

  if (!supabaseUrl) {
    result.errors.push('VITE_SUPABASE_URL is missing');
    result.missingKeys.push('VITE_SUPABASE_URL');
    result.isValid = false;
  } else if (!isValidSupabaseUrl(supabaseUrl)) {
    result.errors.push(
      `VITE_SUPABASE_URL format is invalid. Expected: https://<project>.supabase.co, got: ${supabaseUrl.substring(0, 50)}...`
    );
    result.isValid = false;
  }

  if (!supabaseAnonKey) {
    result.errors.push('VITE_SUPABASE_ANON_KEY is missing');
    result.missingKeys.push('VITE_SUPABASE_ANON_KEY');
    result.isValid = false;
  } else if (!isValidJWT(supabaseAnonKey)) {
    result.errors.push('VITE_SUPABASE_ANON_KEY format is invalid (not a valid JWT token)');
    result.isValid = false;
  }

  if (!powerSyncUrl) {
    result.warnings.push('VITE_POWERSYNC_URL is missing (offline sync will not work)');
    result.missingKeys.push('VITE_POWERSYNC_URL');
  } else {
    try {
      new URL(powerSyncUrl);
    } catch {
      result.errors.push(`VITE_POWERSYNC_URL format is invalid: ${powerSyncUrl}`);
      result.isValid = false;
    }
  }

  return result;
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();

  if (validation.isValid) {
    console.log('✅ Environment variables configured correctly');
    console.log('🔑 Configured keys: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY' + (import.meta.env.VITE_POWERSYNC_URL ? ', VITE_POWERSYNC_URL' : ''));
  } else {
    console.error('❌ Environment configuration errors:');
    validation.errors.forEach(err => console.error(`   • ${err}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    validation.warnings.forEach(warn => console.warn(`   • ${warn}`));
  }

  if (validation.missingKeys.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${validation.missingKeys.join(', ')}`);
  }
}

export function getEnvironmentErrors(): string[] {
  return validateEnvironment().errors;
}

export function hasEnvironmentErrors(): boolean {
  return validateEnvironment().errors.length > 0;
}
