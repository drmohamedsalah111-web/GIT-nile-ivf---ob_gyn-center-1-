import { createClient } from '@supabase/supabase-js';

// 1. جلب المتغيرات من ملف البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. التحقق من أن المتغيرات موجودة لتجنب الأخطاء الغامضة
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Supabase URL or Key is missing! Check your .env file.');
}

// 3. إنشاء الاتصال وتصديره
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
);