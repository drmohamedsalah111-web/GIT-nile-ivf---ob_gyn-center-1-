import bcrypt from 'bcryptjs';

// اختبار كلمة المرور
async function testPassword() {
  const password = 'Admin@123';
  const hash = '$2a$10$YQ4FvZ0Z6RGWe5N8V/8FPuF.jMvnxZ3sHB2.lCVUHvJYFxGVrNP3O';
  
  console.log('🧪 اختبار تطابق كلمة المرور...\n');
  console.log('كلمة المرور:', password);
  console.log('Hash:', hash);
  console.log('');
  
  const isValid = await bcrypt.compare(password, hash);
  
  if (isValid) {
    console.log('✅ كلمة المرور صحيحة!');
    console.log('يمكنك الدخول بـ:');
    console.log('📧 البريد: admin@clinic.com');
    console.log('🔑 كلمة المرور: Admin@123');
  } else {
    console.log('❌ كلمة المرور غير صحيحة');
    console.log('سيتم إنشاء hash جديد...\n');
    
    const newHash = await bcrypt.hash(password, 10);
    console.log('Hash الجديد:');
    console.log(newHash);
    console.log('\nاستخدم هذا الـ hash في قاعدة البيانات');
  }
}

testPassword();
