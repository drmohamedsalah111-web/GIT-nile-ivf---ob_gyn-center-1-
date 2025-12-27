-- ============================================================================
-- إصلاح جدول الفواتير (Fix Invoices Table)
-- ============================================================================
-- هذا السكريبت ينشئ جدول invoices إذا لم يكن موجوداً
-- يتوافق مع نظام السكرتيرة والنظام المالي
-- ============================================================================

-- ============================================================================
-- 1. إنشاء جدول الفواتير (Invoices Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط بالعيادة والمريض
  clinic_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  
  -- رقم الفاتورة
  invoice_number TEXT UNIQUE,
  
  -- نوع الفاتورة
  invoice_type TEXT DEFAULT 'service' CHECK (
    invoice_type IN ('service', 'package', 'installment', 'other')
  ),
  
  -- المبالغ المالية
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- معلومات الدفع
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('cash', 'visa', 'bank_transfer', 'insurance', 'deferred')
  ),
  payment_reference TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'paid' CHECK (
    status IN ('draft', 'paid', 'cancelled', 'refunded')
  ),
  
  -- الربط بالأقساط (اختياري)
  case_id UUID, -- للربط بنظام financial_cases
  installment_id UUID REFERENCES installments(id) ON DELETE SET NULL,
  
  -- ملاحظات
  notes TEXT,
  
  -- من أنشأ الفاتورة
  created_by UUID REFERENCES doctors(id),
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE invoices IS 'فواتير المدفوعات والخدمات';

-- ============================================================================
-- 2. الفهارس (Indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_doctor ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);

-- ============================================================================
-- 3. RLS Policies
-- ============================================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- الأطباء يمكنهم إدارة فواتيرهم
DROP POLICY IF EXISTS "Doctors can manage their invoices" ON invoices;
CREATE POLICY "Doctors can manage their invoices" ON invoices
  FOR ALL USING (
    clinic_id = get_doctor_id() OR doctor_id = get_doctor_id()
  );

-- السكرتيرات يمكنهن عرض الفواتير
DROP POLICY IF EXISTS "Secretaries can view invoices" ON invoices;
CREATE POLICY "Secretaries can view invoices" ON invoices
  FOR SELECT USING (
    clinic_id = get_secretary_doctor_id() OR doctor_id = get_secretary_doctor_id()
  );

-- السكرتيرات يمكنهن إنشاء الفواتير
DROP POLICY IF EXISTS "Secretaries can create invoices" ON invoices;
CREATE POLICY "Secretaries can create invoices" ON invoices
  FOR INSERT WITH CHECK (
    clinic_id = get_secretary_doctor_id() OR doctor_id = get_secretary_doctor_id()
  );

-- السكرتيرات يمكنهن تحديث الفواتير
DROP POLICY IF EXISTS "Secretaries can update invoices" ON invoices;
CREATE POLICY "Secretaries can update invoices" ON invoices
  FOR UPDATE USING (
    clinic_id = get_secretary_doctor_id() OR doctor_id = get_secretary_doctor_id()
  );

-- ============================================================================
-- 4. Trigger لتحديث updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. دالة لتوليد رقم الفاتورة تلقائياً
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || 
                          TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                          LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء sequence لأرقام الفواتير
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Trigger لتوليد رقم الفاتورة
DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================================================
-- التحقق من النجاح
-- ============================================================================
SELECT 
  '✅ جدول الفواتير تم إنشاؤه بنجاح' as status,
  COUNT(*) as invoices_count
FROM invoices;
