-- ============================================================================
-- 🔧 إصلاح RLS Policies لجدول doctors - للسماح بالتسجيل الجديد
-- ============================================================================
-- يحل مشكلة: 400 Bad Request و 406 Not Acceptable أثناء التسجيل
-- ============================================================================

-- 1️⃣ تفعيل RLS على جدول doctors (إذا لم يكن مفعل)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- 2️⃣ حذف السياسات القديمة المتضاربة
DROP POLICY IF EXISTS "Users can insert their own doctor profile" ON doctors;
DROP POLICY IF EXISTS "Users can view their own doctor profile" ON doctors;
DROP POLICY IF EXISTS "Users can update their own doctor profile" ON doctors;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON doctors;
DROP POLICY IF EXISTS "Enable read access for all users" ON doctors;

-- 3️⃣ سياسة INSERT - السماح للمستخدمين المسجلين بإنشاء ملفهم الشخصي
CREATE POLICY "Allow authenticated users to insert their profile"
ON doctors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4️⃣ سياسة SELECT - السماح للمستخدم بقراءة بياناته الخاصة
CREATE POLICY "Allow users to view their own profile"
ON doctors
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5️⃣ سياسة UPDATE - السماح للمستخدم بتحديث بياناته
CREATE POLICY "Allow users to update their own profile"
ON doctors
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6️⃣ سياسة SELECT للإدمن - السماح للإدمن برؤية كل الدكاترة
CREATE POLICY "Allow admin to view all doctors"
ON doctors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors d
    WHERE d.user_id = auth.uid()
    AND d.user_role = 'admin'
  )
);

-- 7️⃣ السماح للدكتور برؤية السكرتيرات التابعين له
CREATE POLICY "Allow doctors to view their secretaries"
ON doctors
FOR SELECT
TO authenticated
USING (
  secretary_doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- 8️⃣ السماح للسكرتيرة برؤية بيانات الدكتور التابع له
CREATE POLICY "Allow secretaries to view their doctor"
ON doctors
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT secretary_doctor_id FROM doctors WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- ✅ تم إصلاح RLS Policies بنجاح
-- ============================================================================

-- التحقق من السياسات
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY policyname;

-- نهاية الملف
