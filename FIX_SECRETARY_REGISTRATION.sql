-- ============================================================================
-- 🔧 إصلاح مشاكل تسجيل السكرتيرة - SECRETARY REGISTRATION FIX
-- ============================================================================
-- المشاكل المُصلَحة:
-- 1. قائمة الأطباء فارغة عند تسجيل سكرتيرة جديدة
-- 2. السكرتيرة لا تستطيع رؤية بيانات طبيبها بعد التسجيل
-- 3. السكرتيرة لا تستطيع رؤية مرضى طبيبها
-- ============================================================================

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ الخطوة 1: حذف السياسات القديمة لجدول doctors                               ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "doctors_read_own" ON doctors;
DROP POLICY IF EXISTS "doctors_insert_own" ON doctors;
DROP POLICY IF EXISTS "doctors_update_own" ON doctors;
DROP POLICY IF EXISTS "doctors_select_own" ON doctors;
DROP POLICY IF EXISTS "doctors_public_read" ON doctors;
DROP POLICY IF EXISTS "authenticated_read_doctors_basic" ON doctors;
DROP POLICY IF EXISTS "secretaries_read_own_doctor" ON doctors;

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ الخطوة 2: إنشاء دالة آمنة لجلب قائمة الأطباء (للمستخدمين غير المسجلين)    ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- دالة آمنة يمكن استدعاؤها بدون تسجيل دخول لجلب قائمة الأطباء
-- تستخدم SECURITY DEFINER للتجاوز المؤقت لـ RLS
CREATE OR REPLACE FUNCTION get_doctors_list()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT d.id, d.name, d.email
    FROM doctors d
    WHERE d.user_role = 'doctor';
END;
$$;

-- منح الصلاحية للمستخدمين المجهولين والمصادقين
GRANT EXECUTE ON FUNCTION get_doctors_list() TO anon;
GRANT EXECUTE ON FUNCTION get_doctors_list() TO authenticated;

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ الخطوة 3: إنشاء سياسات جديدة لجدول doctors                                 ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- سياسة 1: السماح لأي مستخدم مصادق بقراءة قائمة الأطباء الأساسية
CREATE POLICY "authenticated_read_doctors_list" ON doctors
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND user_role = 'doctor'
);

-- سياسة 2: كل مستخدم يستطيع قراءة بياناته الخاصة
CREATE POLICY "users_read_own_profile" ON doctors
FOR SELECT
USING (
    auth.uid() = user_id
);

-- سياسة 3: السكرتيرة تستطيع قراءة بيانات طبيبها المرتبط بها
CREATE POLICY "secretaries_read_their_doctor" ON doctors
FOR SELECT
USING (
    -- السماح للسكرتيرة بقراءة بيانات الطبيب المرتبطة به
    id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- سياسة 4: السماح للمستخدم الجديد بإنشاء سجله
CREATE POLICY "users_insert_own_profile" ON doctors
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- سياسة 5: السماح للمستخدم بتحديث بياناته
CREATE POLICY "users_update_own_profile" ON doctors
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ الخطوة 3: تحديث سياسات المرضى للسكرتيرة                                    ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- حذف السياسات القديمة للسكرتيرة على جدول المرضى
DROP POLICY IF EXISTS "secretaries_view_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_insert_patients" ON patients;
DROP POLICY IF EXISTS "secretaries_update_patients" ON patients;

-- سياسة: السكرتيرة ترى مرضى طبيبها
CREATE POLICY "secretaries_view_patients" ON patients
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- سياسة: السكرتيرة تضيف مريض لطبيبها
CREATE POLICY "secretaries_insert_patients" ON patients
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- سياسة: السكرتيرة تحدث بيانات مرضى طبيبها
CREATE POLICY "secretaries_update_patients" ON patients
FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ الخطوة 4: تحديث سياسات المواعيد للسكرتيرة                                  ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- حذف السياسات القديمة للمواعيد
DROP POLICY IF EXISTS "secretaries_view_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_create_appointments" ON appointments;
DROP POLICY IF EXISTS "secretaries_update_appointments" ON appointments;

-- سياسة: السكرتيرة ترى مواعيد طبيبها
CREATE POLICY "secretaries_view_appointments" ON appointments
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- سياسة: السكرتيرة تنشئ مواعيد لطبيبها
CREATE POLICY "secretaries_create_appointments" ON appointments
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- سياسة: السكرتيرة تحدث مواعيد طبيبها
CREATE POLICY "secretaries_update_appointments" ON appointments
FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL
    AND doctor_id = (
        SELECT secretary_doctor_id 
        FROM doctors 
        WHERE user_id = auth.uid() 
        AND user_role = 'secretary'
        LIMIT 1
    )
);

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ الخطوة 5: التأكد من تفعيل RLS                                              ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ النتيجة النهائية                                                           ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

SELECT '✅ تم إصلاح مشاكل تسجيل السكرتيرة بنجاح!' as status;

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ اختبار السياسات                                                            ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- للتحقق من السياسات المُنشأة:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('doctors', 'patients', 'appointments')
ORDER BY tablename, policyname;
