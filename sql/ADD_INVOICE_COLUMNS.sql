-- Add missing columns to support financial analytics
-- Run in Supabase SQL Editor (public schema assumed)

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS profit_share numeric(12,2) DEFAULT 0;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Optional: add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices (created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices (created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
