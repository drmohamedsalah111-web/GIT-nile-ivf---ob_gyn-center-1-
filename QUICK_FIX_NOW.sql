-- ============================================================================
-- 🔧 MINIMAL FIX - إصلاح سريع بدون حذف البيانات
-- ============================================================================
-- هنصلح المشاكل الموجودة فقط بدون ما نمسح حاجة
-- ============================================================================

-- الخطوة 1: التأكد من وجود الطبيب في جدول doctors
INSERT INTO doctors (id, user_id, email, name, created_at, updated_at)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    updated_at = NOW();

-- الخطوة 2: إصلاح Foreign Key Constraint
ALTER TABLE ivf_cycles DROP CONSTRAINT IF EXISTS ivf_cycles_doctor_id_fkey;
ALTER TABLE ivf_cycles 
ADD CONSTRAINT ivf_cycles_doctor_id_fkey 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

-- الخطوة 3: إصلاح RLS Policy للـ Insert
DROP POLICY IF EXISTS "Doctors can insert their cycles" ON ivf_cycles;
CREATE POLICY "Doctors can insert their cycles"
ON ivf_cycles FOR INSERT
WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- الخطوة 4: إضافة policy للـ ALL إذا لم يكن موجود
DROP POLICY IF EXISTS "Doctors full access to cycles" ON ivf_cycles;
CREATE POLICY "Doctors full access to cycles"
ON ivf_cycles FOR ALL
USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- الخطوة 5: التحقق النهائي
SELECT '1️⃣ فحص وجود الطبيب:' as step;
SELECT id, user_id, email, name 
FROM doctors 
WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';

SELECT '2️⃣ فحص Foreign Key:' as step;
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'ivf_cycles' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'ivf_cycles_doctor_id_fkey';

SELECT '3️⃣ فحص RLS Policies:' as step;
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'ivf_cycles';

SELECT '✅ تم الإصلاح بنجاح - جرب إنشاء دورة IVF الآن' as result;
