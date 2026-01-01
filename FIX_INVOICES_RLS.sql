-- 🔧 إصلاح RLS على جدول invoices
-- المشكلة: RLS مفعّل ولكن لا توجد policy تسمح للدكتور بر؉ية فواتيره

-- 1️⃣ أولاً: نشوف الـ policies الموجودة
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'invoices';

-- 2️⃣ نحذف أي policies قديمة قد تكون مشكلة
DROP POLICY IF EXISTS "Doctors can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Doctors can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Doctors can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Doctors can delete own invoices" ON invoices;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON invoices;
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;
DROP POLICY IF EXISTS "doctors_view_own_invoices" ON invoices;
DROP POLICY IF EXISTS "doctors_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "doctors_update_invoices" ON invoices;
DROP POLICY IF EXISTS "doctors_delete_invoices" ON invoices;

-- 3️⃣ إنشاء policies جديدة صحيحة (بدون secretaries)

-- السماح للدكتور برؤية فواتير عيادته
CREATE POLICY "doctors_view_own_invoices" ON invoices
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- السماح للدكتور بإنشاء فواتير
CREATE POLICY "doctors_insert_invoices" ON invoices
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- السماح للدكتور بتعديل فواتيره
CREATE POLICY "doctors_update_invoices" ON invoices
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- السماح للدكتور بحذف فواتيره
CREATE POLICY "doctors_delete_invoices" ON invoices
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- 4️⃣ نفس الشيء لـ pos_invoices
ALTER TABLE pos_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pos_invoices_select" ON pos_invoices;
DROP POLICY IF EXISTS "pos_invoices_insert" ON pos_invoices;
DROP POLICY IF EXISTS "pos_invoices_update" ON pos_invoices;
DROP POLICY IF EXISTS "pos_invoices_delete" ON pos_invoices;

CREATE POLICY "pos_invoices_select" ON pos_invoices
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "pos_invoices_insert" ON pos_invoices
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "pos_invoices_update" ON pos_invoices
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "pos_invoices_delete" ON pos_invoices
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- 5️⃣ تأكيد أن الـ policies تم إنشاؤها
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('invoices', 'pos_invoices')
ORDER BY tablename, policyname;
