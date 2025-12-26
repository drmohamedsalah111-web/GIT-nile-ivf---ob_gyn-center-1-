-- ========================================
-- تحويل حسابك إلى حساب أدمن
-- Make Your Account Admin
-- ========================================

-- الخطوة 1: شوف كل الحسابات الموجودة
-- Step 1: View all existing accounts
SELECT id, email, name, user_role 
FROM doctors
ORDER BY created_at DESC;

-- ========================================
-- الخطوة 2: غير الإيميل ده بإيميلك اللي بتدخل بيه
-- Step 2: Replace with YOUR email
-- ========================================

UPDATE doctors 
SET user_role = 'admin'
WHERE email = 'YOUR_EMAIL@example.com';  -- <-- غير الإيميل ده بإيميلك

-- ========================================
-- الخطوة 3: تأكد من التعديل
-- Step 3: Verify the change
-- ========================================

SELECT id, email, name, user_role 
FROM doctors
WHERE email = 'YOUR_EMAIL@example.com';  -- <-- نفس الإيميل

-- ========================================
-- نتيجة متوقعة:
-- Expected Result:
-- user_role = 'admin' ✓
-- ========================================

-- ========================================
-- إذا كان عندك أكثر من حساب:
-- If you have multiple accounts:
-- ========================================

-- اجعل كل الحسابات أدمن (اختياري):
-- Make all accounts admin (optional):
-- UPDATE doctors SET user_role = 'admin';

-- أو حساب واحد بس بالـ ID:
-- Or one account by ID:
-- UPDATE doctors SET user_role = 'admin' WHERE id = 'your-uuid-here';
