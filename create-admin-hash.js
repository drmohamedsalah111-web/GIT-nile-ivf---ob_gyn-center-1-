// ============================================
// 🔐 Script لإنشاء حساب أدمن جديد
// ============================================
// هذا الـ script يشفر الباسورد ويعطيك الـ hash لتستخدمه في SQL
// ============================================

import bcrypt from 'bcryptjs';

// ✏️ بدّل هنا بالباسورد اللي عاوزه
const password = 'Admin@123456';

async function createAdminHash() {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('');
    console.log('====================================');
    console.log('✅ تم تشفير كلمة المرور بنجاح!');
    console.log('====================================');
    console.log('');
    console.log('📝 استخدم هذا الكود في Supabase SQL Editor:');
    console.log('');
    console.log('-- إضافة حساب أدمن جديد');
    console.log(`INSERT INTO admins (name, email, password_hash, role)`);
    console.log(`VALUES (`);
    console.log(`  'Super Admin',`);
    console.log(`  'admin@nileivf.com',  -- بدّل الإيميل هنا`);
    console.log(`  '${hash}',`);
    console.log(`  'super_admin'`);
    console.log(`)
ON CONFLICT (email) DO NOTHING;`);
    console.log('');
    console.log('====================================');
    console.log('📋 معلومات الدخول:');
    console.log('====================================');
    console.log(`الإيميل: admin@nileivf.com`);
    console.log(`الباسورد: ${password}`);
    console.log('====================================');
    console.log('');
    console.log('🔐 Hash الباسورد فقط:');
    console.log(hash);
    console.log('');
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

createAdminHash();
