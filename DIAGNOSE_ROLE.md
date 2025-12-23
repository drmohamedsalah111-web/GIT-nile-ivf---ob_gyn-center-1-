# تشخيص وإصلاح مشكلة تسجيل الدخول (Diagnose & Fix Login Issue)

يبدو أن النظام لا يزال يتعرف عليك كطبيب بدلاً من سكرتيرة. هذا يحدث عادةً بسبب قيود الأمان في قاعدة البيانات (RLS) التي تمنع قراءة دور المستخدم.

## الخطوة 1: تشغيل إصلاح قاعدة البيانات (إلزامي)

يجب تشغيل السكربت التالي في Supabase SQL Editor لإصلاح الصلاحيات وإنشاء دالة التحقق الآمنة.

1. افتح لوحة تحكم Supabase.
2. اذهب إلى **SQL Editor**.
3. انقر على **New Query**.
4. انسخ محتوى الملف `FINAL_FIX_ROLES.sql` الموجود في ملفات المشروع.
5. الصقه في المحرر واضغط **Run**.

إذا لم تتمكن من العثور على الملف، استخدم الكود التالي (هذا هو الحل الجذري):

```sql
-- 1. إنشاء دالة آمنة لجلب الدور (تتجاوز RLS)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- هذا هو الجزء المهم!
SET search_path = public
AS $$
DECLARE
    v_role text;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- محاولة جلب الدور من جدول الأطباء
    SELECT user_role INTO v_role
    FROM doctors
    WHERE user_id = v_user_id;
    
    RETURN v_role;
END;
$$;

-- 2. منح صلاحيات تنفيذ الدالة
GRANT EXECUTE ON FUNCTION get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_role TO anon;

-- 3. إصلاح سياسات RLS لجدول doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON doctors;
CREATE POLICY "Users can view their own profile"
ON doctors FOR SELECT
USING (auth.uid() = user_id);

-- 4. تحديث بيانات المستخدم الحالي ليكون سكرتيرة (اختياري - للتأكد فقط)
-- استبدل البريد الإلكتروني بالبريد الذي تستخدمه للدخول
UPDATE doctors 
SET user_role = 'secretary' 
WHERE email = 'secretary@example.com'; -- ⚠️ غير هذا البريد إلى بريدك!
```

## الخطوة 2: التحقق من المتصفح

بعد تشغيل السكربت أعلاه:

1. ارجع للمتصفح.
2. سجل الخروج (إذا كنت مسجلاً للدخول).
3. اضغط `F12` لفتح أدوات المطور (Developer Tools).
4. اذهب إلى تبويب **Console**.
5. سجل الدخول مرة أخرى.
6. لاحظ الرسائل في الكونسول. يجب أن ترى:
   - `Role fetched via RPC: secretary`
   - أو `Inferred Secretary Role from secretary_doctor_id`

## حل سريع (Nuclear Option)

إذا كنت تريد إجبار حسابك الحالي على أن يكون سكرتيرة فوراً، شغل هذا السكربت في Supabase، مع تغيير البريد الإلكتروني:

```sql
UPDATE doctors
SET user_role = 'secretary',
    secretary_doctor_id = (SELECT id FROM doctors WHERE user_role = 'doctor' LIMIT 1) -- يربطك بأول طبيب
WHERE email = 'YOUR_EMAIL_HERE';
```
