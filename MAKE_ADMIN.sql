-- ===================================
-- تحويل حسابك لحساب أدمن
-- ===================================

-- 🔴 مهم: بدل الإيميل ده بإيميلك الحقيقي اللي دخلت بيه Supabase
UPDATE doctors 
SET user_role = 'admin'
WHERE email = 'your-email@example.com';

-- تحقق من النتيجة
SELECT id, name, email, user_role 
FROM doctors 
WHERE email = 'your-email@example.com';

-- ===================================
-- إذا لم يكن حسابك موجود في جدول doctors أصلاً، استخدم هذا الكود:
-- ===================================
-- (احذف التعليق -- من بداية السطور التالية إذا احتجت لها)

-- INSERT INTO doctors (
--   id,
--   name,
--   email,
--   user_role,
--   specialization,
--   phone,
--   created_at
-- )
-- SELECT 
--   auth.uid(),
--   'Admin User',
--   'your-email@example.com',
--   'admin',
--   'إدارة النظام',
--   '0501234567',
--   NOW()
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- AND NOT EXISTS (
--   SELECT 1 FROM doctors WHERE email = 'your-email@example.com'
-- );

-- ===================================
-- لعرض كل الحسابات ودورها
-- ===================================
SELECT 
  id,
  name,
  email,
  user_role,
  specialization
FROM doctors
ORDER BY created_at DESC;
