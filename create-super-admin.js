/**
 * 🔐 سكريبت لإنشاء حساب السوبر أدمن
 * 
 * استخدام:
 * 1. تأكد من تثبيت bcryptjs: npm install bcryptjs
 * 2. شغّل: node create-super-admin.js
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase (استبدلها بإعداداتك)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createSuperAdmin() {
  try {
    console.log('🚀 بدء إنشاء حساب السوبر أدمن...\n');

    // 1. بيانات السوبر أدمن
    const adminData = {
      name: 'المدير العام',
      email: 'admin@clinic.com',
      password: 'Admin@123',
      role: 'super_admin'
    };

    // 2. تشفير كلمة المرور
    console.log('🔐 تشفير كلمة المرور...');
    const passwordHash = await bcrypt.hash(adminData.password, 10);
    console.log('✅ تم تشفير كلمة المرور بنجاح\n');

    // 3. التحقق من وجود الأدمن
    console.log('🔍 التحقق من وجود حساب موجود...');
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id, email')
      .eq('email', adminData.email)
      .single();

    if (existingAdmin) {
      console.log('⚠️  يوجد بالفعل حساب بهذا البريد الإلكتروني');
      console.log(`📧 البريد: ${existingAdmin.email}`);
      console.log(`🆔 ID: ${existingAdmin.id}\n`);
      
      // تحديث كلمة المرور
      const { error: updateError } = await supabase
        .from('admins')
        .update({ 
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAdmin.id);

      if (updateError) {
        console.error('❌ خطأ في تحديث كلمة المرور:', updateError);
      } else {
        console.log('✅ تم تحديث كلمة المرور بنجاح!\n');
      }
      return;
    }

    // 4. إنشاء الحساب الجديد
    console.log('➕ إنشاء حساب جديد...');
    const { data: newAdmin, error } = await supabase
      .from('admins')
      .insert([{
        name: adminData.name,
        email: adminData.email,
        password_hash: passwordHash,
        role: adminData.role,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في إنشاء الحساب:', error);
      throw error;
    }

    // 5. عرض النتائج
    console.log('\n✅ تم إنشاء حساب السوبر أدمن بنجاح!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 معلومات تسجيل الدخول:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 الاسم: ${adminData.name}`);
    console.log(`📧 البريد الإلكتروني: ${adminData.email}`);
    console.log(`🔑 كلمة المرور: ${adminData.password}`);
    console.log(`🆔 Admin ID: ${newAdmin.id}`);
    console.log(`🎭 الصلاحية: ${adminData.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('⚠️  ملاحظات مهمة:');
    console.log('   1. احفظ بيانات الدخول في مكان آمن');
    console.log('   2. غيّر كلمة المرور بعد أول دخول');
    console.log('   3. رابط الدخول: /admin-login');
    console.log('   4. لا تشارك بيانات الدخول مع أحد\n');

    console.log('🔐 Hash كلمة المرور (للنسخ الاحتياطي):');
    console.log(passwordHash + '\n');

  } catch (error) {
    console.error('\n❌ خطأ عام:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
console.log('╔═══════════════════════════════════════╗');
console.log('║   🔐 إنشاء حساب السوبر أدمن 🔐      ║');
console.log('╚═══════════════════════════════════════╝\n');

createSuperAdmin()
  .then(() => {
    console.log('✅ اكتمل التنفيذ بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل التنفيذ:', error);
    process.exit(1);
  });
