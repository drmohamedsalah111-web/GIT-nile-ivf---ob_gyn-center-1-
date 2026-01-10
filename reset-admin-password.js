import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://purknrqalbkajufqfiqu.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // يجب استخدام service role key

async function resetAdminPassword() {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const email = 'admin@clinic.com';
  const password = 'Admin@123';
  
  console.log('🔐 إعادة ضبط كلمة مرور السوبر أدمن...\n');
  
  // إنشاء hash جديد
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('✅ تم إنشاء Hash جديد\n');
  
  // حذف الحساب القديم إن وجد
  const { error: deleteError } = await supabaseAdmin
    .from('admins')
    .delete()
    .eq('email', email);
  
  // إنشاء حساب جديد
  const { data, error } = await supabaseAdmin
    .from('admins')
    .insert([{
      name: 'المدير العام',
      email: email,
      password_hash: passwordHash,
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('❌ خطأ:', error);
    console.log('\n📋 استخدم هذا SQL في Supabase SQL Editor:\n');
    console.log(`
-- حذف الحساب القديم
DELETE FROM admins WHERE email = '${email}';

-- إنشاء حساب جديد
INSERT INTO admins (name, email, password_hash, role, is_active, created_at)
VALUES (
  'المدير العام',
  '${email}',
  '${passwordHash}',
  'super_admin',
  true,
  NOW()
);

-- التحقق
SELECT id, name, email, role FROM admins WHERE email = '${email}';
    `);
    return;
  }
  
  console.log('✅ نجح!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 البريد: ' + email);
  console.log('🔑 كلمة المرور: ' + password);
  console.log('━━━━━━━━━━━━━━━━━━━━━');
}

resetAdminPassword();
