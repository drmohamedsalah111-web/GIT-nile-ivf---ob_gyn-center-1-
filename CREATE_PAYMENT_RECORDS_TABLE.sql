-- ============================================================================
-- جدول تسجيل المدفوعات (Payment Records)
-- ============================================================================
-- يحفظ تاريخ كل دفعة من المريضة مع تفاصيل الدفع

CREATE TABLE IF NOT EXISTS public.invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Visa', 'Bank Transfer', 'Insurance')),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_date ON public.invoice_payments(payment_date);
CREATE INDEX idx_invoice_payments_method ON public.invoice_payments(payment_method);

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view payments for their clinic invoices
CREATE POLICY "Users can view invoice payments for their clinic"
    ON public.invoice_payments FOR SELECT
    USING (invoice_id IN (
        SELECT id FROM public.invoices WHERE clinic_id = auth.uid()
    ));

-- RLS Policy: Users can create payments for their clinic invoices
CREATE POLICY "Users can create invoice payments for their clinic"
    ON public.invoice_payments FOR INSERT
    WITH CHECK (invoice_id IN (
        SELECT id FROM public.invoices WHERE clinic_id = auth.uid()
    ));

-- ============================================================================
-- تحديث جدول الفواتير لإضافة حقول دعم المدفوعات المتعددة
-- ============================================================================

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0);

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - COALESCE(paid_amount, 0)) STORED;

-- ============================================================================
-- دالة لتحديث المبلغ المدفوع تلقائياً
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث المبلغ المدفوع من إجمالي الدفعات
    UPDATE public.invoices
    SET paid_amount = COALESCE((
        SELECT SUM(amount) FROM public.invoice_payments 
        WHERE invoice_id = NEW.invoice_id
    ), 0),
    status = CASE 
        WHEN COALESCE((
            SELECT SUM(amount) FROM public.invoice_payments 
            WHERE invoice_id = NEW.invoice_id
        ), 0) >= total_amount THEN 'Paid'
        ELSE 'Draft'
    END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث المبلغ المدفوع عند إضافة دفعة جديدة
DROP TRIGGER IF EXISTS trigger_update_invoice_paid_amount ON public.invoice_payments;
CREATE TRIGGER trigger_update_invoice_paid_amount
AFTER INSERT ON public.invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_paid_amount();

-- ============================================================================
-- View لعرض ملخص المدفوعات لكل فاتورة
-- ============================================================================

CREATE OR REPLACE VIEW public.invoice_payment_summary AS
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.patient_id,
    i.total_amount,
    COALESCE(SUM(ip.amount), 0) as total_paid,
    i.total_amount - COALESCE(SUM(ip.amount), 0) as remaining_amount,
    COUNT(ip.id) as payment_count,
    MAX(ip.payment_date) as last_payment_date,
    CASE 
        WHEN COALESCE(SUM(ip.amount), 0) = 0 THEN 'لم تدفع'
        WHEN COALESCE(SUM(ip.amount), 0) < i.total_amount THEN 'دفع جزئي'
        ELSE 'مدفوعة بالكامل'
    END as payment_status
FROM public.invoices i
LEFT JOIN public.invoice_payments ip ON i.id = ip.invoice_id
GROUP BY i.id, i.invoice_number, i.patient_id, i.total_amount;

-- ============================================================================
-- Report: Daily Collection Summary
-- ============================================================================

CREATE OR REPLACE VIEW public.daily_collections AS
SELECT 
    DATE(ip.payment_date) as collection_date,
    COUNT(DISTINCT ip.invoice_id) as invoices_collected,
    SUM(ip.amount) as total_collected,
    COUNT(ip.payment_method) as transaction_count,
    SUM(CASE WHEN ip.payment_method = 'Cash' THEN ip.amount ELSE 0 END) as cash_total,
    SUM(CASE WHEN ip.payment_method = 'Visa' THEN ip.amount ELSE 0 END) as visa_total,
    SUM(CASE WHEN ip.payment_method = 'Bank Transfer' THEN ip.amount ELSE 0 END) as bank_transfer_total,
    SUM(CASE WHEN ip.payment_method = 'Insurance' THEN ip.amount ELSE 0 END) as insurance_total
FROM public.invoice_payments ip
GROUP BY DATE(ip.payment_date)
ORDER BY collection_date DESC;

-- ============================================================================
-- ✅ تم الانتهاء!
-- ============================================================================
-- الخطوات التالية:
-- 1. ✅ جدول invoice_payments تم إنشاؤه
-- 2. ✅ حقول دعم المدفوعات أضيفت للفواتير
-- 3. ✅ دالة تلقائية لتحديث المبلغ المدفوع
-- 4. ✅ Views للتقارير
-- ============================================================================
