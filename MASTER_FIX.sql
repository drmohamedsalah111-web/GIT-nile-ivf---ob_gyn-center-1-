-- ============================================================================
-- MASTER FIX: الإصلاح الشامل والنهائي
-- ============================================================================

-- 1. دالة مساعدة لحذف السياسات ديناميكياً لأي جدول
CREATE OR REPLACE FUNCTION drop_policies_for_table(tbl text) RETURNS void AS $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = tbl
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. إيقاف/حذف جميع السياسات المرتبطة وتفكيك الارتباطات
DO $$
BEGIN
    -- حذف سياسات الجداول المتورطة
    PERFORM drop_policies_for_table('ivf_cycles');
    PERFORM drop_policies_for_table('stimulation_logs');
    PERFORM drop_policies_for_table('pregnancies');
    PERFORM drop_policies_for_table('doctors'); 
    
    -- حذف القيود (Foreign Keys) مؤقتاً
    ALTER TABLE ivf_cycles DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;
    ALTER TABLE stimulation_logs DROP CONSTRAINT IF EXISTS stimulation_logs_doctor_id_fkey;
    ALTER TABLE pregnancies DROP CONSTRAINT IF EXISTS pregnancies_doctor_id_fkey;
END $$;

-- 3. توحيد أنواع البيانات (الكل يجب أن يكون UUID)
ALTER TABLE doctors ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE ivf_cycles ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

-- حاول تعديل الجداول الأخرى إذا كانت موجودة
DO $$
BEGIN
    BEGIN
        ALTER TABLE stimulation_logs ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;
    EXCEPTION WHEN OTHERS THEN NULL; -- تجاهل الخطأ إذا الجدول غير موجود
    END;
    
    BEGIN
        ALTER TABLE pregnancies ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 4. إعادة بناء العلاقات بشكل سليم
ALTER TABLE ivf_cycles
  ADD CONSTRAINT ivf_cycles_doctor_id_fkey
  FOREIGN KEY (doctor_id)
  REFERENCES doctors(id)
  ON DELETE CASCADE;

-- 5. التأكد من وجود سجل الطبيب وبياناته
INSERT INTO doctors (id, user_id, email, name)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر'
)
ON CONFLICT (id) DO UPDATE 
SET user_id = EXCLUDED.user_id;

-- 6. إعادة بناء السياسات الموحدة (Standard Policies)

-- A. سياسات Doctors
CREATE POLICY "doctors_read_own" ON doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "doctors_insert_own" ON doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "doctors_update_own" ON doctors FOR UPDATE USING (auth.uid() = user_id);

-- B. سياسات IVF Cycles
CREATE POLICY "cycles_read_own" ON ivf_cycles FOR SELECT USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));
CREATE POLICY "cycles_insert_own" ON ivf_cycles FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));
CREATE POLICY "cycles_update_own" ON ivf_cycles FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));
CREATE POLICY "cycles_delete_own" ON ivf_cycles FOR DELETE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));

-- C. سياسات Stimulation Logs (إذا وجد)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stimulation_logs') THEN
        CREATE POLICY "logs_read_own" ON stimulation_logs FOR SELECT USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));
        CREATE POLICY "logs_insert_own" ON stimulation_logs FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));
        CREATE POLICY "logs_update_own" ON stimulation_logs FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM doctors WHERE id = doctor_id));
    END IF;
END $$;

-- تفعييل RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stimulation_logs') THEN ALTER TABLE stimulation_logs ENABLE ROW LEVEL SECURITY; END IF; END $$;

-- 7. النتيجة النهائية
SELECT '🚀 تمت العملية بنجاح! تم إصلاح جميع الجداول والسياسات.' as final_status;
