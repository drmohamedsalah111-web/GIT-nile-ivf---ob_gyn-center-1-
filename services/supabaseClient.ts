import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables
// This prevents the "Cannot read properties of undefined" error when running in environments
// where import.meta.env is not fully defined.
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key];
  } catch (e) {
    return undefined;
  }
};

// ----------------------------------------------------------------------------------
// 🛑 ACTION REQUIRED: PASTE YOUR SUPABASE KEYS HERE
// ----------------------------------------------------------------------------------
// 1. Go to https://supabase.com/dashboard
// 2. Select your project -> Project Settings -> API
// 3. Copy the 'Project URL' and 'anon public' Key
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || 'https://ladqitwqkkfiijregqlu.supabase.co';
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZHFpdHdxa2tmaWlqcmVncWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Njk0MDgsImV4cCI6MjA4MDQ0NTQwOH0.qSAjg1kIcAO5DFnz5InlW4u3pxzeDTIbLdB6uN_CEUc';

// Validation to warn developer if keys are missing
if (SUPABASE_URL.includes('INSERT') || SUPABASE_ANON_KEY.includes('INSERT')) {
  console.warn('⚠️ Supabase credentials are missing or invalid! Please update services/supabaseClient.ts');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);