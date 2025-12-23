-- ============================================================================
-- 🔧 FIX RLS POLICIES - حل مشكلة Infinite Recursion (SIMPLIFIED)
-- ============================================================================

-- تعطيل RLS مؤقتاً لحذف السياسات
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة من جدول doctors
DROP POLICY IF EXISTS "Doctors can read own record" ON doctors;
DROP POLICY IF EXISTS "Doctors can insert own record" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own record" ON doctors;
DROP POLICY IF EXISTS "Secretaries can view their doctor" ON doctors;
DROP POLICY IF EXISTS "Secretaries can view linked doctor" ON doctors;

-- إعادة تفعيل RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- ============================
-- DOCTORS POLICIES (SIMPLE - NO RECURSION)
-- ============================

-- Policy 1: Allow authenticated users to read their own doctor record
CREATE POLICY "Allow users to read own doctor record"
    ON doctors FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to insert their own doctor record
CREATE POLICY "Allow users to insert own doctor record"
    ON doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow authenticated users to update their own doctor record
CREATE POLICY "Allow users to update own doctor record"
    ON doctors FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow authenticated users to delete their own doctor record
CREATE POLICY "Allow users to delete own doctor record"
    ON doctors FOR DELETE
    USING (auth.uid() = user_id);

-- ملاحظة: تم إزالة سياسة السكرتارية لتجنب infinite recursion
-- يمكن التعامل مع صلاحيات السكرتارية من خلال Application Level بدلاً من RLS

-- ============================
-- FIX PATIENTS POLICIES (Remove recursion)
-- ============================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Doctors can read their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can delete their patients" ON patients;
DROP POLICY IF EXISTS "Secretaries can read doctor's patients" ON patients;
DROP POLICY IF EXISTS "Secretaries can insert patients for doctor" ON patients;

-- إعادة إنشاء سياسات بسيطة بدون recursion
CREATE POLICY "Users can manage patients"
    ON patients FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- ============================
-- FIX OTHER TABLES POLICIES
-- ============================

-- Fix appointments
DROP POLICY IF EXISTS "Doctors can manage their appointments" ON appointments;
DROP POLICY IF EXISTS "Secretaries can manage doctor's appointments" ON appointments;

CREATE POLICY "Users can manage appointments"
    ON appointments FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- Fix ivf_cycles
DROP POLICY IF EXISTS "Doctors can read their cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can insert cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can update their cycles" ON ivf_cycles;
DROP POLICY IF EXISTS "Doctors can delete their cycles" ON ivf_cycles;

CREATE POLICY "Users can manage ivf cycles"
    ON ivf_cycles FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- ✅ VERIFICATION
-- ============================================================================

-- Check doctors policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'doctors'
ORDER BY policyname;

-- Check patients policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'patients'
ORDER BY policyname;

-- ============================================================================
-- 🎉 POLICIES FIXED!
-- ============================================================================
