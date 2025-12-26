-- ============================================================
-- SMART HYBRID BILLING SYSTEM FOR OB/GYN & IVF CLINIC
-- ============================================================
-- Purpose: Complete financial management for both:
-- 1. Fee-for-Service (Simple one-off payments)
-- 2. Long-term IVF Cases (Installment-based tracking)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: SERVICES CATALOG (The Price List)
-- ============================================================
-- All billable items: consultations, procedures, lab tests, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    
    -- Service Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Outpatient', 'Procedure', 'Lab', 'Pharmacy', 'IVF', 'Antenatal')),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2) DEFAULT 0 CHECK (cost_price >= 0), -- For profit margin calculation
    
    -- Commission Rules (Optional)
    commission_type TEXT CHECK (commission_type IN ('fixed', 'percentage', 'none')),
    commission_value DECIMAL(10,2) DEFAULT 0,
    
    -- Status & Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexing
    UNIQUE(clinic_id, name)
);

CREATE INDEX idx_services_clinic ON public.services(clinic_id);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_active ON public.services(is_active) WHERE is_active = true;

-- RLS Policies for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic services"
    ON public.services FOR SELECT
    USING (clinic_id = auth.uid());

CREATE POLICY "Doctors can manage their services"
    ON public.services FOR ALL
    USING (clinic_id = auth.uid())
    WITH CHECK (clinic_id = auth.uid());

-- ============================================================
-- TABLE 2: PACKAGES (IVF Bundles)
-- ============================================================
-- Pre-defined treatment packages with fixed total costs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    
    -- Package Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'IVF' CHECK (category IN ('IVF', 'ICSI', 'Antenatal', 'Custom')),
    
    -- Pricing
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Inclusions (JSON array of service IDs or descriptions)
    included_services JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(clinic_id, name)
);

CREATE INDEX idx_packages_clinic ON public.packages(clinic_id);

-- RLS Policies for Packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic packages"
    ON public.packages FOR SELECT
    USING (clinic_id = auth.uid());

CREATE POLICY "Doctors can manage their packages"
    ON public.packages FOR ALL
    USING (clinic_id = auth.uid())
    WITH CHECK (clinic_id = auth.uid());

-- ============================================================
-- TABLE 3: FINANCIAL CASES (The IVF Ledger)
-- ============================================================
-- Tracks long-term payment plans for IVF patients
-- Links: Patient -> Medical Cycle -> Payment Plan
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    
    -- Patient & Medical Context
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES public.ivf_cycles(id) ON DELETE SET NULL, -- Optional: Link to IVF cycle
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL, -- Optional: Which package?
    
    -- Financial Summary
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    
    -- Calculated Fields
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount - discount_amount) STORED,
    
    -- Status Tracking
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Cancelled')),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_financial_cases_clinic ON public.financial_cases(clinic_id);
CREATE INDEX idx_financial_cases_patient ON public.financial_cases(patient_id);
CREATE INDEX idx_financial_cases_status ON public.financial_cases(status);

-- RLS Policies for Financial Cases
ALTER TABLE public.financial_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic cases"
    ON public.financial_cases FOR SELECT
    USING (clinic_id = auth.uid());

CREATE POLICY "Doctors can manage their cases"
    ON public.financial_cases FOR ALL
    USING (clinic_id = auth.uid())
    WITH CHECK (clinic_id = auth.uid());

-- ============================================================
-- TABLE 4: INSTALLMENTS (Payment Schedule)
-- ============================================================
-- Individual payments due for a financial case
-- ============================================================

CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.financial_cases(id) ON DELETE CASCADE,
    
    -- Installment Details
    title TEXT NOT NULL, -- e.g., "Pickup Payment", "Embryo Transfer Fee"
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    due_date DATE,
    
    -- Payment Status
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    payment_method TEXT CHECK (payment_method IN ('Cash', 'Visa', 'Bank Transfer', 'Insurance')),
    
    -- Note: invoice_id will be added after invoices table is created
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installments_case ON public.installments(case_id);
CREATE INDEX idx_installments_paid ON public.installments(is_paid);
CREATE INDEX idx_installments_due ON public.installments(due_date) WHERE is_paid = false;

-- RLS Policies for Installments
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view installments for their clinic cases"
    ON public.installments FOR SELECT
    USING (case_id IN (
        SELECT id FROM public.financial_cases WHERE clinic_id = auth.uid()
    ));

CREATE POLICY "Users can manage installments for their clinic cases"
    ON public.installments FOR ALL
    USING (case_id IN (SELECT id FROM public.financial_cases WHERE clinic_id = auth.uid()))
    WITH CHECK (case_id IN (SELECT id FROM public.financial_cases WHERE clinic_id = auth.uid()));

-- ============================================================
-- TABLE 5: INVOICES (The Master Receipt)
-- ============================================================
-- Records EVERY payment received (services OR installments)
-- Source of truth for daily cash box
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    
    -- Patient & Doctor
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    
    -- Financial Details
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
    tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    
    -- Payment Information
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Visa', 'Bank Transfer', 'Insurance', 'Deferred')),
    payment_reference TEXT, -- e.g., Transaction ID for Visa
    
    -- Invoice Type (Hybrid Logic)
    invoice_type TEXT NOT NULL CHECK (invoice_type IN ('service', 'installment', 'package')),
    
    -- Links
    case_id UUID REFERENCES public.financial_cases(id) ON DELETE SET NULL, -- If payment is for a case
    installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL, -- If payment is for an installment
    
    -- Status
    status TEXT DEFAULT 'Paid' CHECK (status IN ('Draft', 'Paid', 'Cancelled', 'Refunded')),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_clinic ON public.invoices(clinic_id);
CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_date ON public.invoices(created_at);
CREATE INDEX idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- Add invoice_id to installments now that invoices table exists
ALTER TABLE public.installments 
    ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- RLS Policies for Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic invoices"
    ON public.invoices FOR SELECT
    USING (clinic_id = auth.uid());

CREATE POLICY "Doctors can create invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (clinic_id = auth.uid());

CREATE POLICY "Doctors can update their invoices"
    ON public.invoices FOR UPDATE
    USING (clinic_id = auth.uid())
    WITH CHECK (clinic_id = auth.uid());

-- ============================================================
-- TABLE 6: INVOICE ITEMS (Line Items)
-- ============================================================
-- Breakdown of what's included in each invoice
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Item Details
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL, -- Snapshot: Name at time of invoice
    description TEXT,
    
    -- Pricing
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_service ON public.invoice_items(service_id);

-- RLS Policies for Invoice Items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items for their clinic"
    ON public.invoice_items FOR SELECT
    USING (invoice_id IN (
        SELECT id FROM public.invoices WHERE clinic_id = auth.uid()
    ));

CREATE POLICY "Users can manage invoice items for their clinic"
    ON public.invoice_items FOR ALL
    USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = auth.uid()))
    WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = auth.uid()));

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_cases_updated_at BEFORE UPDATE ON public.financial_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON public.installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Update Paid Amount in Financial Case
-- ============================================================
-- Automatically updates paid_amount when installments are marked as paid

CREATE OR REPLACE FUNCTION update_case_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_paid = true AND OLD.is_paid = false THEN
        UPDATE public.financial_cases
        SET paid_amount = paid_amount + NEW.amount
        WHERE id = NEW.case_id;
    ELSIF NEW.is_paid = false AND OLD.is_paid = true THEN
        UPDATE public.financial_cases
        SET paid_amount = paid_amount - NEW.amount
        WHERE id = NEW.case_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_paid_amount
AFTER UPDATE ON public.installments
FOR EACH ROW
WHEN (OLD.is_paid IS DISTINCT FROM NEW.is_paid)
EXECUTE FUNCTION update_case_paid_amount();

-- ============================================================
-- FUNCTION: Auto-close Financial Case
-- ============================================================
-- Automatically closes a case when fully paid

CREATE OR REPLACE FUNCTION auto_close_financial_case()
RETURNS TRIGGER AS $$
DECLARE
    calc_remaining DECIMAL(10,2);
BEGIN
    -- Calculate remaining amount manually (can't use generated column in trigger)
    calc_remaining := NEW.total_amount - NEW.paid_amount - NEW.discount_amount;
    
    IF calc_remaining <= 0 AND NEW.status = 'Open' THEN
        NEW.status := 'Closed';
        NEW.closed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_close_case
BEFORE UPDATE ON public.financial_cases
FOR EACH ROW
EXECUTE FUNCTION auto_close_financial_case();

-- ============================================================
-- VIEWS: Analytics & Reporting
-- ============================================================

-- Daily Revenue Summary
CREATE OR REPLACE VIEW public.daily_revenue AS
SELECT 
    clinic_id,
    DATE(created_at) as date,
    COUNT(*) as invoice_count,
    SUM(total_amount) as total_revenue,
    SUM(CASE WHEN invoice_type = 'service' THEN total_amount ELSE 0 END) as service_revenue,
    SUM(CASE WHEN invoice_type = 'installment' THEN total_amount ELSE 0 END) as installment_revenue,
    SUM(CASE WHEN invoice_type = 'package' THEN total_amount ELSE 0 END) as package_revenue
FROM public.invoices
WHERE status = 'Paid'
GROUP BY clinic_id, DATE(created_at);

-- Outstanding Installments
CREATE OR REPLACE VIEW public.outstanding_installments AS
SELECT 
    i.id,
    i.case_id,
    fc.patient_id,
    p.name as patient_name,
    i.title,
    i.amount,
    i.due_date,
    CASE 
        WHEN i.due_date < CURRENT_DATE THEN 'Overdue'
        WHEN i.due_date = CURRENT_DATE THEN 'Due Today'
        ELSE 'Upcoming'
    END as status
FROM public.installments i
JOIN public.financial_cases fc ON i.case_id = fc.id
JOIN public.patients p ON fc.patient_id = p.id
WHERE i.is_paid = false
ORDER BY i.due_date;

-- ============================================================
-- SAMPLE DATA (Optional - Remove in Production)
-- ============================================================

-- Sample Services
INSERT INTO public.services (clinic_id, name, category, price, cost_price, commission_type, commission_value) VALUES
    ((SELECT id FROM public.doctors LIMIT 1), 'Consultation - First Visit', 'Outpatient', 300.00, 0, 'none', 0),
    ((SELECT id FROM public.doctors LIMIT 1), 'Consultation - Follow-up', 'Outpatient', 200.00, 0, 'none', 0),
    ((SELECT id FROM public.doctors LIMIT 1), 'Ultrasound 2D', 'Procedure', 250.00, 50, 'fixed', 50),
    ((SELECT id FROM public.doctors LIMIT 1), 'Ultrasound 4D', 'Procedure', 500.00, 100, 'percentage', 15),
    ((SELECT id FROM public.doctors LIMIT 1), 'Folliculometry Scan', 'Procedure', 200.00, 40, 'fixed', 40),
    ((SELECT id FROM public.doctors LIMIT 1), 'Beta HCG Test', 'Lab', 150.00, 80, 'none', 0),
    ((SELECT id FROM public.doctors LIMIT 1), 'Progesterone Test', 'Lab', 180.00, 90, 'none', 0),
    ((SELECT id FROM public.doctors LIMIT 1), 'Ovulation Induction', 'IVF', 3000.00, 1500, 'percentage', 10),
    ((SELECT id FROM public.doctors LIMIT 1), 'IUI Procedure', 'IVF', 2000.00, 800, 'fixed', 300),
    ((SELECT id FROM public.doctors LIMIT 1), 'Egg Retrieval', 'IVF', 8000.00, 3000, 'percentage', 20)
ON CONFLICT (clinic_id, name) DO NOTHING;

-- Sample Packages
INSERT INTO public.packages (clinic_id, name, category, total_price, description) VALUES
    ((SELECT id FROM public.doctors LIMIT 1), 'ICSI Package - Standard', 'ICSI', 35000.00, 'Includes all medications, monitoring, retrieval, ICSI, and transfer'),
    ((SELECT id FROM public.doctors LIMIT 1), 'IVF Package - Basic', 'IVF', 28000.00, 'Standard IVF protocol without ICSI'),
    ((SELECT id FROM public.doctors LIMIT 1), 'Antenatal Care Package', 'Antenatal', 12000.00, 'Complete pregnancy follow-up until delivery')
ON CONFLICT (clinic_id, name) DO NOTHING;

-- ============================================================
-- END OF FINANCIAL SYSTEM SCHEMA
-- ============================================================
