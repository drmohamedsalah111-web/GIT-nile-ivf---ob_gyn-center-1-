-- RECEPTION POS & QUEUE SCHEMA
-- Adds POS/invoice tables and appointment financial_status

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add financial_status to appointments
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS financial_status TEXT DEFAULT 'pending' CHECK (financial_status IN ('pending','paid','credit'));

-- 2) POS invoices (secretary-managed)
CREATE TABLE IF NOT EXISTS public.pos_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  subtotal DECIMAL(12,2) DEFAULT 0 CHECK (subtotal >= 0),
  discount DECIMAL(12,2) DEFAULT 0 CHECK (discount >= 0),
  tax DECIMAL(12,2) DEFAULT 0 CHECK (tax >= 0),
  total_amount DECIMAL(12,2) DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','partial','paid','cancelled')),
  created_by UUID REFERENCES auth.users(id), -- secretary user id
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pos_invoices_clinic ON public.pos_invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_patient ON public.pos_invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_status ON public.pos_invoices(status);

-- 3) POS invoice items
CREATE TABLE IF NOT EXISTS public.pos_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.pos_invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) DEFAULT 0 CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) DEFAULT 0 CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_invoice_items_invoice ON public.pos_invoice_items(invoice_id);

-- 4) Pending orders created by doctor (doctor requests service, secretary collects)
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id), -- doctor user id
  request_type TEXT NOT NULL, -- e.g., 'lab', 'extra_service'
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','collected','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_app ON public.pending_orders(appointment_id);

-- 5) Invoice payments (POS)
CREATE TABLE IF NOT EXISTS public.pos_invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.pos_invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  created_by UUID REFERENCES auth.users(id), -- secretary
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_invoice_payments_invoice ON public.pos_invoice_payments(invoice_id);

-- 6) Simple view for daily report
CREATE OR REPLACE VIEW public.pos_daily_summary AS
SELECT
  clinic_id,
  date_trunc('day', created_at)::date AS day,
  SUM(CASE WHEN status IN ('paid','partial') THEN paid_amount ELSE 0 END) AS total_collected,
  SUM(discount) AS total_discounts
FROM public.pos_invoices
GROUP BY clinic_id, date_trunc('day', created_at)::date;

-- Grant execute/select where necessary (to authenticated role)
GRANT SELECT ON public.pos_daily_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_invoice_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_orders TO authenticated;

-- Note: RLS policies should be added aligned with get_doctor_id/get_secretary_doctor_id functions in your environment.

RAISE NOTICE '✅ POS schema created/updated.';