-- ============================================================================
-- 🏥 CREATE VISITS TABLE - إنشاء جدول الزيارات العامة
-- ============================================================================
-- هذا الجدول مفقود ويسبب خطأ "Could not find the table 'public.visits'"
-- ============================================================================

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    department TEXT DEFAULT 'General',
    diagnosis TEXT,
    prescription JSONB DEFAULT '[]',
    notes TEXT,
    clinical_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits(department);

-- تفعيل RLS (Row Level Security)
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان (مؤقتاً مفتوحة للمستخدمين المسجلين)
CREATE POLICY "Users can view visits" 
    ON visits FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert visits" 
    ON visits FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update visits" 
    ON visits FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete visits" 
    ON visits FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- ✅ VERIFICATION
-- ============================================================================

SELECT 
    '✅ تم إنشاء جدول visits بنجاح!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'visits') as column_count;
