-- 🔧 إنشاء جدول الخدمات (إذا لم يكن موجوداً)
-- Create Services Table for Doctor's Service Catalog

-- 1️⃣ إنشاء الجدول
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'consultation',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- 3️⃣ تفعيل RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 4️⃣ حذف أي policies قديمة
DROP POLICY IF EXISTS "doctors_view_services" ON services;
DROP POLICY IF EXISTS "doctors_insert_services" ON services;
DROP POLICY IF EXISTS "doctors_update_services" ON services;
DROP POLICY IF EXISTS "doctors_delete_services" ON services;

-- 5️⃣ إنشاء RLS Policies
CREATE POLICY "doctors_view_services" ON services
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "doctors_insert_services" ON services
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "doctors_update_services" ON services
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "doctors_delete_services" ON services
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    );

-- 6️⃣ إضافة خدمات افتراضية للدكتور (محمد صلاح)
-- ملاحظة: غيّر الـ UUID إذا كان الدكتور مختلف
DO $$
DECLARE
    doc_id UUID := 'dd67a83e-0105-4099-bb56-138b88b18f49';
BEGIN
    -- التحقق من عدم وجود خدمات
    IF NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = doc_id LIMIT 1) THEN
        -- إضافة خدمات افتراضية
        INSERT INTO services (clinic_id, name, name_en, category, price, description) VALUES
        -- استشارات
        (doc_id, 'كشف أول', 'First Consultation', 'consultation', 500, 'الكشف الأول للمريضة'),
        (doc_id, 'كشف متابعة', 'Follow-up Consultation', 'followup', 300, 'كشف متابعة'),
        (doc_id, 'استشارة عقم', 'Infertility Consultation', 'consultation', 600, 'استشارة متخصصة للعقم'),
        
        -- سونار
        (doc_id, 'سونار مهبلي', 'Vaginal Ultrasound', 'ultrasound', 400, 'فحص بالموجات فوق الصوتية'),
        (doc_id, 'سونار بطني', 'Abdominal Ultrasound', 'ultrasound', 350, 'سونار على البطن'),
        (doc_id, 'سونار 4D', '4D Ultrasound', 'ultrasound', 800, 'سونار رباعي الأبعاد'),
        
        -- تحاليل
        (doc_id, 'تحليل هرمونات', 'Hormonal Analysis', 'lab', 600, 'تحليل هرمونات الخصوبة'),
        (doc_id, 'تحليل سائل منوي', 'Semen Analysis', 'lab', 400, 'تحليل السائل المنوي'),
        (doc_id, 'تحليل حمل', 'Pregnancy Test', 'lab', 100, 'تحليل الحمل'),
        
        -- حقن مجهري
        (doc_id, 'دورة حقن مجهري كاملة', 'Full IVF Cycle', 'ivf', 35000, 'دورة حقن مجهري كاملة'),
        (doc_id, 'تنشيط مبايض', 'Ovarian Stimulation', 'ivf', 5000, 'تنشيط المبايض'),
        (doc_id, 'سحب بويضات', 'Egg Retrieval', 'ivf', 8000, 'عملية سحب البويضات'),
        (doc_id, 'ترجيع أجنة', 'Embryo Transfer', 'ivf', 5000, 'عملية ترجيع الأجنة'),
        (doc_id, 'تجميد أجنة', 'Embryo Freezing', 'ivf', 3000, 'تجميد الأجنة'),
        
        -- إجراءات
        (doc_id, 'منظار رحمي', 'Hysteroscopy', 'procedure', 4000, 'منظار تشخيصي للرحم'),
        (doc_id, 'أشعة بالصبغة', 'HSG', 'procedure', 1500, 'أشعة بالصبغة على الرحم والأنابيب'),
        (doc_id, 'حقن داخل الرحم', 'IUI', 'procedure', 2000, 'تلقيح صناعي داخل الرحم'),
        
        -- أدوية
        (doc_id, 'روشتة أدوية', 'Prescription', 'medication', 50, 'وصفة طبية');
        
        RAISE NOTICE 'تم إضافة الخدمات الافتراضية بنجاح';
    ELSE
        RAISE NOTICE 'الخدمات موجودة مسبقاً';
    END IF;
END $$;

-- 7️⃣ التحقق من النتائج
SELECT id, name, category, price, is_active 
FROM services 
WHERE clinic_id = 'dd67a83e-0105-4099-bb56-138b88b18f49'
ORDER BY category, name;
