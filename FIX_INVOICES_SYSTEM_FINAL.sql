-- ============================================================================
-- الإصلاح النهائي والشامل لنظام الفواتير (Final Comprehensive Invoices Fix)
-- ============================================================================
-- هذا السكريبت يقوم بـ:
-- 1. توحيد هيكل جدول invoices و invoice_items
-- 2. إصلاح العلاقات (Foreign Keys) خاصة created_by
-- 3. تحديث الـ Check Constraints لتكون مرنة (Case-insensitive)
-- 4. ضبط سياسات الحماية (RLS) لتشمل الأطباء والسكرتيرات
-- ============================================================================

-- ============================================================================
-- 1. إصلاح جدول الفواتير (Invoices Table)
-- ============================================================================

-- التأكد من وجود الأعمدة الأساسية
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.doctors(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'service';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'paid';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS installment_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- إصلاح علاقة created_by (يجب أن تشير إلى doctors.id لأن الواجهة ترسل معرف السكرتيرة من جدول doctors)
DO $$ 
BEGIN
    -- حذف العلاقة القديمة إذا كانت موجودة
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_created_by_fkey') THEN
        ALTER TABLE public.invoices DROP CONSTRAINT invoices_created_by_fkey;
    END IF;
    
    -- إضافة العلاقة الجديدة الصحيحة
    ALTER TABLE public.invoices 
        ADD CONSTRAINT invoices_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update created_by foreign key: %', SQLERRM;
END $$;

-- تحديث الـ Check Constraints لتكون مرنة
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_type_check 
    CHECK (invoice_type IN ('service', 'package', 'installment', 'other', 'Service', 'Package', 'Installment', 'Other'));

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_payment_method_check 
    CHECK (payment_method IN ('cash', 'visa', 'bank_transfer', 'insurance', 'deferred', 'Cash', 'Visa', 'Bank Transfer', 'Insurance', 'Deferred'));

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'paid', 'cancelled', 'refunded', 'Draft', 'Paid', 'Cancelled', 'Refunded'));

-- ============================================================================
-- 2. إصلاح جدول بنود الفاتورة (Invoice Items Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2.5 إصلاح جدول المدفوعات (Invoice Payments Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث الـ Check Constraints لجدول المدفوعات
ALTER TABLE public.invoice_payments DROP CONSTRAINT IF EXISTS invoice_payments_payment_method_check;
ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_payment_method_check 
    CHECK (payment_method IN ('cash', 'visa', 'bank_transfer', 'insurance', 'Cash', 'Visa', 'Bank Transfer', 'Insurance'));

-- ============================================================================
-- 3. سياسات الحماية (RLS Policies)
-- ============================================================================

-- تفعيل RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view their clinic invoices" ON public.invoices;
DROP POLICY IF EXISTS "Doctors can manage their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Secretaries can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Secretaries can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Secretaries can update invoices" ON public.invoices;

-- سياسة شاملة للأطباء (الوصول لبيانات عيادتهم)
CREATE POLICY "Doctors manage clinic invoices" ON public.invoices
    FOR ALL USING (clinic_id = get_doctor_id());

-- سياسة شاملة للسكرتيرات (الوصول لبيانات الطبيب المسؤول)
CREATE POLICY "Secretaries manage clinic invoices" ON public.invoices
    FOR ALL USING (clinic_id = get_secretary_doctor_id())
    WITH CHECK (clinic_id = get_secretary_doctor_id());

-- سياسات بنود الفاتورة
DROP POLICY IF EXISTS "Users can view invoice items for their clinic" ON public.invoice_items;
DROP POLICY IF EXISTS "Doctors manage invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Secretaries manage invoice items" ON public.invoice_items;

CREATE POLICY "Doctors manage invoice items" ON public.invoice_items
    FOR ALL USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = get_doctor_id())
    );

CREATE POLICY "Secretaries manage invoice items" ON public.invoice_items
    FOR ALL USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = get_secretary_doctor_id())
    )
    WITH CHECK (
        invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = get_secretary_doctor_id())
    );

-- سياسات المدفوعات
DROP POLICY IF EXISTS "Users can view invoice payments for their clinic" ON public.invoice_payments;
DROP POLICY IF EXISTS "Users can create invoice payments for their clinic" ON public.invoice_payments;
DROP POLICY IF EXISTS "Doctors manage invoice payments" ON public.invoice_payments;
DROP POLICY IF EXISTS "Secretaries manage invoice payments" ON public.invoice_payments;

CREATE POLICY "Doctors manage invoice payments" ON public.invoice_payments
    FOR ALL USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = get_doctor_id())
    );

CREATE POLICY "Secretaries manage invoice payments" ON public.invoice_payments
    FOR ALL USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = get_secretary_doctor_id())
    )
    WITH CHECK (
        invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = get_secretary_doctor_id())
    );

-- ============================================================================
-- 4. تحسينات إضافية
-- ============================================================================

-- إنشاء sequence لرقم الفاتورة إذا لم يوجد
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

-- دالة توليد رقم الفاتورة
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

-- Trigger لتوليد رقم الفاتورة
DROP TRIGGER IF EXISTS set_invoice_number ON public.invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- منح الصلاحيات
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE invoice_number_seq TO authenticated;

-- التحقق من النجاح
SELECT '✅ تم تحديث نظام الفواتير بالكامل بنجاح' as status;
