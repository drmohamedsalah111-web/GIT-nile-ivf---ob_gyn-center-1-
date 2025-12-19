-- ============================================================================
-- الحل النهائي البسيط - نسخة مبسطة
-- ============================================================================

-- 1. حذف أي سجلات قديمة للمستخدم (إن وجدت)
DELETE FROM doctors 
WHERE user_id = 'efbfbed7-401d-449f-8759-6a707a358dd5'
  AND id != '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

-- 2. إنشاء السجل مباشرة
INSERT INTO doctors (id, user_id, email, name)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
)
ON CONFLICT (id) DO NOTHING;

-- 3. إضافة سياسة INSERT
DROP POLICY IF EXISTS "Doctors can insert their own profile" ON doctors;
CREATE POLICY "Doctors can insert their own profile" ON doctors
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. التحقق
SELECT 
    '✅ تم بنجاح' as status,
    id, 
    user_id, 
    email, 
    name
FROM doctors
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';
