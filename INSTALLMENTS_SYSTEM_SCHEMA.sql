-- ============================================================================
-- نظام الأقساط للحقن المجهري (Installments System)
-- ============================================================================
-- Created: 2025-12-27
-- Purpose: إدارة الأقساط الخاصة بدورات الحقن المجهري والعمليات الكبيرة
-- 
-- ملاحظة مهمة: هذا السكريبت يفترض وجود الجداول التالية:
--   - doctors (مع user_id, user_role, secretary_doctor_id)
--   - patients (مع id)
--   - ivf_cycles (مع id, patient_id, doctor_id)
-- 
-- إذا كانت هذه الجداول غير موجودة، قم بتشغيل IVF_JOURNEY_SCHEMA.sql أولاً
-- ============================================================================

-- ============================================================================
-- 1. جدول الباقات والأسعار (IVF Packages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ivf_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- معلومات الباقة
  package_name TEXT NOT NULL,
  package_name_ar TEXT NOT NULL,
  description TEXT,
  
  -- السعر
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  
  -- الأقساط الافتراضية
  default_installments JSONB NOT NULL DEFAULT '[
    {"name": "التنشيط", "name_ar": "التنشيط", "percentage": 33, "due_on": "cycle_start"},
    {"name": "السحب", "name_ar": "السحب", "percentage": 50, "due_on": "opu"},
    {"name": "الإرجاع", "name_ar": "الإرجاع", "percentage": 17, "due_on": "transfer"}
  ]'::jsonb,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ivf_packages IS 'باقات الحقن المجهري مع خطط الأقساط';

-- ============================================================================
-- 2. جدول الأقساط (Installments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط بالدورة والمريضة
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  package_id UUID REFERENCES ivf_packages(id) ON DELETE SET NULL,
  
  -- معلومات القسط
  installment_number INTEGER NOT NULL,
  installment_name TEXT NOT NULL,
  installment_name_ar TEXT NOT NULL,
  
  -- المبلغ
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  
  -- الاستحقاق
  due_date DATE,
  due_on_event TEXT CHECK (due_on_event IN ('cycle_start', 'opu', 'transfer', 'custom')),
  
  -- حالة الدفع
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'due', 'paid', 'overdue', 'cancelled')
  ),
  
  -- معلومات الدفع
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES doctors(id), -- المستخدم الذي سجل الدفع
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'insurance', 'other')),
  
  -- رقم الإيصال
  receipt_number TEXT,
  
  -- ملاحظات
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE installments IS 'أقساط الدفع الخاصة بدورات الحقن المجهري';

-- ============================================================================
-- 3. جدول تاريخ الدفعات (Payment History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- معلومات الدفعة
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'insurance', 'other')),
  
  -- الإيصال
  receipt_number TEXT NOT NULL,
  
  -- من سجل الدفعة
  recorded_by UUID NOT NULL REFERENCES doctors(id),
  
  -- ملاحظات
  notes TEXT,
  
  -- التاريخ
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE installment_payments IS 'سجل كل دفعة للأقساط (للتدقيق)';

-- ============================================================================
-- 4. الفهارس (Indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_packages_doctor ON ivf_packages(doctor_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON ivf_packages(is_active);

CREATE INDEX IF NOT EXISTS idx_installments_cycle ON installments(cycle_id);
CREATE INDEX IF NOT EXISTS idx_installments_patient ON installments(patient_id);
CREATE INDEX IF NOT EXISTS idx_installments_doctor ON installments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_installment ON installment_payments(installment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON installment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_doctor ON installment_payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON installment_payments(payment_date DESC);

-- ============================================================================
-- 5. دوال مساعدة للـ RLS (Helper Functions for RLS)
-- ============================================================================

-- دالة للحصول على doctor_id من الـ session
CREATE OR REPLACE FUNCTION get_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
    AND user_role = 'doctor'
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_doctor_id() TO authenticated;

-- دالة للحصول على doctor_id الخاص بالسكرتيرة
CREATE OR REPLACE FUNCTION get_secretary_doctor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT secretary_doctor_id INTO v_doctor_id
  FROM doctors
  WHERE user_id = auth.uid()
    AND user_role = 'secretary'
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_secretary_doctor_id() TO authenticated;

-- ============================================================================
-- 6. RLS Policies
-- ============================================================================

-- ivf_packages
ALTER TABLE ivf_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can manage their packages" ON ivf_packages;
CREATE POLICY "Doctors can manage their packages" ON ivf_packages
  FOR ALL USING (doctor_id = get_doctor_id());

-- installments
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can manage their installments" ON installments;
CREATE POLICY "Doctors can manage their installments" ON installments
  FOR ALL USING (doctor_id = get_doctor_id());

DROP POLICY IF EXISTS "Secretaries can view and pay installments" ON installments;
CREATE POLICY "Secretaries can view and pay installments" ON installments
  FOR SELECT USING (doctor_id = get_secretary_doctor_id());

DROP POLICY IF EXISTS "Secretaries can update installments for payment" ON installments;
CREATE POLICY "Secretaries can update installments for payment" ON installments
  FOR UPDATE USING (doctor_id = get_secretary_doctor_id());

-- installment_payments
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their payments" ON installment_payments;
CREATE POLICY "Doctors can view their payments" ON installment_payments
  FOR SELECT USING (doctor_id = get_doctor_id());

DROP POLICY IF EXISTS "Secretaries can view payments" ON installment_payments;
CREATE POLICY "Secretaries can view payments" ON installment_payments
  FOR SELECT USING (doctor_id = get_secretary_doctor_id());

DROP POLICY IF EXISTS "Users can insert payments" ON installment_payments;
CREATE POLICY "Users can insert payments" ON installment_payments
  FOR INSERT WITH CHECK (
    doctor_id = get_doctor_id() OR doctor_id = get_secretary_doctor_id()
  );

-- ============================================================================
-- 7. Triggers
-- ============================================================================

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ivf_packages_updated_at ON ivf_packages;
CREATE TRIGGER update_ivf_packages_updated_at
  BEFORE UPDATE ON ivf_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;
CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON installments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. البيانات الافتراضية (Default Packages)
-- ============================================================================

-- ملاحظة: قم بإضافة باقاتك الخاصة هنا أو من خلال الواجهة
-- مثال:
/*
INSERT INTO ivf_packages (doctor_id, package_name, package_name_ar, total_price, description) VALUES
  ('YOUR_DOCTOR_ID', 'ICSI Standard Package', 'باقة الحقن المجهري القياسية', 30000.00, 'تشمل: التنشيط + السحب + الإرجاع'),
  ('YOUR_DOCTOR_ID', 'ICSI Premium Package', 'باقة الحقن المجهري المميزة', 45000.00, 'تشمل: التنشيط + السحب + الإرجاع + PGT-A');
*/

-- ============================================================================
-- 9. دوال مساعدة (Helper Functions)
-- ============================================================================

-- دالة لإنشاء أقساط تلقائياً عند بدء دورة جديدة
CREATE OR REPLACE FUNCTION create_installments_for_cycle(
  p_cycle_id UUID,
  p_patient_id UUID,
  p_doctor_id UUID,
  p_package_id UUID
)
RETURNS void AS $$
DECLARE
  v_package RECORD;
  v_installment JSONB;
  v_installment_number INTEGER := 0;
  v_amount DECIMAL(10,2);
BEGIN
  -- جلب معلومات الباقة
  SELECT * INTO v_package FROM ivf_packages WHERE id = p_package_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found: %', p_package_id;
  END IF;
  
  -- إنشاء الأقساط
  FOR v_installment IN SELECT * FROM jsonb_array_elements(v_package.default_installments)
  LOOP
    v_installment_number := v_installment_number + 1;
    v_amount := v_package.total_price * ((v_installment->>'percentage')::DECIMAL / 100);
    
    INSERT INTO installments (
      cycle_id,
      patient_id,
      doctor_id,
      package_id,
      installment_number,
      installment_name,
      installment_name_ar,
      amount,
      currency,
      due_on_event,
      status
    ) VALUES (
      p_cycle_id,
      p_patient_id,
      p_doctor_id,
      p_package_id,
      v_installment_number,
      v_installment->>'name',
      v_installment->>'name_ar',
      v_amount,
      v_package.currency,
      v_installment->>'due_on',
      CASE 
        WHEN v_installment->>'due_on' = 'cycle_start' THEN 'due'
        ELSE 'pending'
      END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- التحقق من النجاح
-- ============================================================================
SELECT 
  '✅ نظام الأقساط تم إنشاؤه بنجاح' as status,
  COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ivf_packages', 'installments', 'installment_payments');
