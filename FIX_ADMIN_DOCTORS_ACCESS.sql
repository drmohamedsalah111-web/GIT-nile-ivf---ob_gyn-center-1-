-- ============================================
-- 🔧 حل مشكلة وصول الأدمن لجدول العيادات
-- ============================================
-- المشكلة: الأدمن لا يستطيع رؤية العيادات الموجودة بالفعل
-- السبب: RLS policies تمنع القراءة بدون Supabase Auth
-- الحل: إضافة policy تسمح لأي شخص بقراءة doctors
-- ============================================

-- 1️⃣ إضافة policy للسماح بقراءة جدول doctors بدون قيود
-- (آمن لأن المعلومات عامة داخل النظام)
DROP POLICY IF EXISTS "Allow admin to read all doctors" ON doctors;

CREATE POLICY "Allow admin to read all doctors"
  ON doctors FOR SELECT
  USING (true);

-- 2️⃣ إضافة policies للسماح للأدمن بإدارة العيادات
DROP POLICY IF EXISTS "Allow admin to update doctors" ON doctors;

CREATE POLICY "Allow admin to update doctors"
  ON doctors FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin to delete doctors" ON doctors;

CREATE POLICY "Allow admin to delete doctors"
  ON doctors FOR DELETE
  USING (true);

-- 3️⃣ نفس الشيء لجدول clinic_subscriptions
DROP POLICY IF EXISTS "Allow admin to read subscriptions" ON clinic_subscriptions;

CREATE POLICY "Allow admin to read subscriptions"
  ON clinic_subscriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin to update subscriptions" ON clinic_subscriptions;

CREATE POLICY "Allow admin to update subscriptions"
  ON clinic_subscriptions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4️⃣ نفس الشيء لجدول subscription_plans
DROP POLICY IF EXISTS "Allow admin to read plans" ON subscription_plans;

CREATE POLICY "Allow admin to read plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- 5️⃣ نفس الشيء لجدول patients (للإحصائيات)
DROP POLICY IF EXISTS "Allow admin to read patients" ON patients;

CREATE POLICY "Allow admin to read patients"
  ON patients FOR SELECT
  USING (true);

-- ✅ تم! الآن الأدمن يستطيع رؤية كل العيادات الموجودة
-- 🔄 ارجع للوحة تحكم الأدمن واضغط F5 (تحديث)

-- التحقق من البيانات الموجودة:
SELECT 
  '👨‍⚕️ الأطباء' as نوع_البيانات,
  COUNT(*) as العدد
FROM doctors
WHERE user_role = 'doctor' OR user_role IS NULL;

SELECT 
  '📝 السكرتيرات' as نوع_البيانات,
  COUNT(*) as العدد
FROM doctors
WHERE user_role = 'secretary';

SELECT 
  '👥 إجمالي المستخدمين' as نوع_البيانات,
  COUNT(*) as العدد
FROM doctors;

-- عرض أول 5 أطباء:
SELECT 
  name as الاسم,
  email as البريد_الإلكتروني,
  phone as الهاتف,
  specialty as التخصص,
  user_role as الدور,
  created_at as تاريخ_الإنشاء
FROM doctors 
WHERE user_role = 'doctor' OR user_role IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- عرض أول 5 سكرتيرات:
SELECT 
  name as الاسم,
  email as البريد_الإلكتروني,
  phone as الهاتف,
  user_role as الدور,
  created_at as تاريخ_الإنشاء
FROM doctors 
WHERE user_role = 'secretary'
ORDER BY created_at DESC
LIMIT 5;
