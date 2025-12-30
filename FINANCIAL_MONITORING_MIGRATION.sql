-- ============================================
-- 0) Ensure POS Schema exists (Dependency resolution)
-- ============================================

-- POS invoices (secretary-managed)
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
  payment_method TEXT DEFAULT 'Cash',
  created_by UUID REFERENCES auth.users(id), -- secretary user id
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pos_invoices_clinic ON public.pos_invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_patient ON public.pos_invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_status ON public.pos_invoices(status);

-- POS invoice items
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

-- Pending orders created by doctor
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

-- Invoice payments (POS)
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_invoice_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_orders TO authenticated;

-- ============================================
-- MODIFIED BILLING SYSTEM: Doctor Financial Monitoring
-- الدكتور يشوف كل حاجة مالية بس ما يعدلش
-- ============================================

-- Ensure invoices table has appointment_id column (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure invoices table has total, paid_amount and is_from_service_request columns (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'total'
    ) THEN
        ALTER TABLE invoices ADD COLUMN total numeric(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'paid_amount'
    ) THEN
        ALTER TABLE invoices ADD COLUMN paid_amount numeric(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'is_from_service_request'
    ) THEN
        ALTER TABLE invoices ADD COLUMN is_from_service_request boolean DEFAULT false;
    END IF;
END $$;

-- Ensure pos_invoices table has payment_method column (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pos_invoices' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE pos_invoices ADD COLUMN payment_method TEXT DEFAULT 'Cash';
    END IF;
END $$;

-- Ensure appointments table has payment_status and checked_in_at columns (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE appointments ADD COLUMN payment_status text DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'checked_in_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN checked_in_at timestamptz;
    END IF;
END $$;

-- Ensure appointments table has appointment_status column (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'appointment_status'
    ) THEN
        ALTER TABLE appointments ADD COLUMN appointment_status text DEFAULT 'scheduled';
    END IF;
END $$;

-- Ensure doctors table has role column (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'role'
    ) THEN
        ALTER TABLE doctors ADD COLUMN role text;
    END IF;
END $$;

-- ============================================
-- Ensure service_requests table exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'service_requests'
    ) THEN
        CREATE TABLE service_requests (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
            patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            service_id uuid NULL REFERENCES services(id) ON DELETE SET NULL,
            service_name text NOT NULL,
            service_price numeric(10,2) DEFAULT 0,
            status text DEFAULT 'requested' CHECK (status IN ('requested', 'fulfilled', 'cancelled')),
            requested_by uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
            requested_at timestamptz DEFAULT now(),
            fulfilled_at timestamptz NULL,
            notes text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
    END IF;
END $$;

DROP POLICY IF EXISTS "Doctors can view clinic invoices" ON invoices;
CREATE POLICY "Doctors can view clinic invoices"
    ON invoices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.id = invoices.appointment_id
            AND d.user_id = auth.uid()
        )
        OR
        -- Or if invoice is directly linked to a patient under their care
        EXISTS (
            SELECT 1 FROM doctors
            WHERE user_id = auth.uid()
            AND clinic_id = invoices.clinic_id
        )
    );

DROP POLICY IF EXISTS "Doctors can view invoice items" ON invoice_items;
CREATE POLICY "Doctors can view invoice items"
    ON invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM invoices i
            JOIN appointments a ON i.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE i.id = invoice_items.invoice_id
            AND d.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can view all clinic service requests" ON service_requests;
CREATE POLICY "Doctors can view all clinic service requests"
    ON service_requests FOR SELECT
    USING (
        -- Can view their own requests
        auth.uid() IN (SELECT user_id FROM doctors WHERE id = requested_by)
        OR
        -- Can view all requests in their clinic
        EXISTS (
            SELECT 1 FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.id = service_requests.appointment_id
            AND d.user_id = auth.uid()
        )
    );


-- Drop and recreate financial monitoring system
DROP VIEW IF EXISTS unified_invoices_view CASCADE;
DROP VIEW IF EXISTS doctor_financial_monitor_view CASCADE;
DROP VIEW IF EXISTS doctor_audit_log_view CASCADE;
DROP VIEW IF EXISTS doctor_daily_summary CASCADE;
DROP VIEW IF EXISTS daily_financial_summary CASCADE;
DROP VIEW IF EXISTS collections_followup_report CASCADE;
DROP VIEW IF EXISTS pos_daily_summary CASCADE;

-- 1) Unified Invoices View (Standard + POS)
-- Modified to ensure proper schema introspection for Supabase
CREATE OR REPLACE VIEW unified_invoices_view AS
SELECT
    i.id,
    -- Use first 8 chars of UUID as a readable invoice number for standard invoices
    'INV-' || UPPER(SUBSTRING(i.id::text FROM 1 FOR 8)) as invoice_number,
    i.clinic_id,
    i.patient_id,
    i.doctor_id,
    -- Use GREATEST to pick the non-zero value between 'total' and 'total_amount'
    GREATEST(COALESCE(i.total, 0), COALESCE(i.total_amount, 0)) as total_amount,
    -- Handle paid_amount and fallback to total if status is Paid but paid_amount is 0
    GREATEST(
        COALESCE(i.paid_amount, 0),
        CASE WHEN i.status IN ('paid', 'Paid') THEN GREATEST(COALESCE(i.total, 0), COALESCE(i.total_amount, 0)) ELSE 0 END
    ) as paid_amount,
    i.status,
    i.payment_method,
    i.created_at,
    i.appointment_id,
    p.name as patient_name,
    p.phone as patient_phone,
    d.name as doctor_name,
    'standard' as source_type
FROM invoices i
LEFT JOIN patients p ON i.patient_id = p.id
LEFT JOIN doctors d ON i.doctor_id = d.id
UNION ALL
SELECT
    pi.id,
    pi.invoice_number,
    pi.clinic_id,
    pi.patient_id,
    NULL as doctor_id,
    pi.total_amount,
    pi.paid_amount,
    pi.status,
    pi.payment_method,
    pi.created_at,
    pi.appointment_id,
    p.name as patient_name,
    p.phone as patient_phone,
    NULL as doctor_name,
    'pos' as source_type
FROM pos_invoices pi
LEFT JOIN patients p ON pi.patient_id = p.id;

-- Add comment to help with schema introspection
COMMENT ON VIEW unified_invoices_view IS 'Unified view of standard and POS invoices with patient information';
COMMENT ON COLUMN unified_invoices_view.patient_id IS 'References patients.id';
COMMENT ON COLUMN unified_invoices_view.patient_name IS 'Patient name from patients table';
COMMENT ON COLUMN unified_invoices_view.patient_phone IS 'Patient phone from patients table';

-- 2) Complete financial monitoring for doctors
CREATE OR REPLACE VIEW doctor_financial_monitor_view AS
SELECT 
    v.id as invoice_id,
    v.created_at as invoice_date,
    v.total_amount as invoice_total,
    v.paid_amount as paid_amount,
    v.payment_method,
    v.status as invoice_status,
    v.source_type,
    a.id as appointment_id,
    a.appointment_date as appointment_date,
    a.appointment_date::time as appointment_time,
    a.payment_status,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    d.id as doctor_id,
    d.name as doctor_name,
    d.clinic_id,
    (v.total_amount - v.paid_amount) as outstanding_amount,
    -- Compatibility columns for the UI
    CASE 
        WHEN v.paid_amount < v.total_amount AND v.created_at < NOW() - INTERVAL '1 day' THEN true
        ELSE false
    END as needs_followup,
    CASE 
        WHEN v.paid_amount < v.total_amount AND EXTRACT(DAY FROM NOW() - v.created_at) > 7 THEN 'urgent'
        WHEN v.paid_amount < v.total_amount AND EXTRACT(DAY FROM NOW() - v.created_at) > 3 THEN 'high'
        WHEN v.paid_amount < v.total_amount THEN 'normal'
        ELSE 'none'
    END as alert_level
FROM unified_invoices_view v
LEFT JOIN appointments a ON v.appointment_id = a.id
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN doctors d ON (a.doctor_id = d.id OR v.clinic_id = d.clinic_id OR v.doctor_id = d.id)
WHERE (
    d.user_id = auth.uid() OR 
    v.clinic_id IN (SELECT clinic_id FROM doctors WHERE user_id = auth.uid())
);

-- 3) Doctor can see all audit logs for his clinic
CREATE OR REPLACE VIEW doctor_audit_log_view AS
SELECT l.*
FROM financial_audit_log l
JOIN doctors d ON d.id = l.performed_by
WHERE d.clinic_id = (SELECT clinic_id FROM doctors WHERE user_id = auth.uid());

-- 4) Smart daily summary for doctor
CREATE OR REPLACE VIEW doctor_daily_summary AS
SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.clinic_id,
    CURRENT_DATE as report_date,
    COUNT(DISTINCT v.appointment_id) as total_appointments,
    COUNT(DISTINCT CASE WHEN v.status IN ('paid', 'Paid') THEN v.id END) as fully_paid_count,
    COALESCE(SUM(v.total_amount), 0) as total_billed,
    COALESCE(SUM(v.paid_amount), 0) as total_collected,
    COALESCE(SUM(v.total_amount - v.paid_amount), 0) as total_outstanding,
    (SELECT COUNT(*) FROM service_requests sr WHERE sr.requested_at::date = CURRENT_DATE AND sr.requested_by = d.id) as total_service_requests,
    (SELECT COUNT(*) FROM service_requests sr WHERE sr.requested_at::date = CURRENT_DATE AND sr.requested_by = d.id AND sr.status = 'requested') as pending_service_requests,
    (SELECT COUNT(*) FROM service_requests sr WHERE sr.requested_at::date = CURRENT_DATE AND sr.requested_by = d.id AND sr.status = 'fulfilled') as fulfilled_service_requests
FROM doctors d
LEFT JOIN unified_invoices_view v ON (v.clinic_id = d.clinic_id OR v.doctor_id = d.id) AND v.created_at::date = CURRENT_DATE
WHERE d.user_id = auth.uid()
GROUP BY d.id, d.name, d.clinic_id;

GRANT SELECT ON doctor_financial_monitor_view TO authenticated;
GRANT SELECT ON doctor_audit_log_view TO authenticated;
GRANT SELECT ON doctor_daily_summary TO authenticated;

CREATE OR REPLACE VIEW daily_financial_summary AS
SELECT 
    CURRENT_DATE as report_date,
    d.id as doctor_id,
    d.name as doctor_name,
    d.clinic_id,
    -- Today's statistics from unified view
    COUNT(DISTINCT v.appointment_id) as total_appointments,
    COUNT(DISTINCT CASE WHEN v.status IN ('paid', 'Paid') THEN v.id END) as fully_paid_count,
    COALESCE(SUM(v.total_amount), 0) as total_billed,
    COALESCE(SUM(v.paid_amount), 0) as total_collected,
    COALESCE(SUM(v.total_amount - v.paid_amount), 0) as total_outstanding,
    -- Service requests (still from table)
    (SELECT COUNT(*) FROM service_requests sr WHERE sr.requested_at::date = CURRENT_DATE AND sr.requested_by = d.id) as total_service_requests,
    (SELECT COUNT(*) FROM service_requests sr WHERE sr.requested_at::date = CURRENT_DATE AND sr.requested_by = d.id AND sr.status = 'requested') as pending_service_requests,
    (SELECT COUNT(*) FROM service_requests sr WHERE sr.requested_at::date = CURRENT_DATE AND sr.requested_by = d.id AND sr.status = 'fulfilled') as fulfilled_service_requests
FROM doctors d
LEFT JOIN unified_invoices_view v ON (v.clinic_id = d.clinic_id OR v.doctor_id = d.id) AND v.created_at::date = CURRENT_DATE
WHERE d.user_id = auth.uid()
GROUP BY d.id, d.name, d.clinic_id;

GRANT SELECT ON daily_financial_summary TO authenticated;

-- 4. Create function for doctor to query financial history
-- --------------------------------------------

DROP FUNCTION IF EXISTS get_doctor_financial_report(uuid, date, date);
CREATE OR REPLACE FUNCTION get_doctor_financial_report(
    p_doctor_id uuid,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS TABLE(
    report_date date,
    total_appointments bigint,
    total_billed numeric,
    total_collected numeric,
    outstanding numeric,
    collection_rate numeric
) AS $$
DECLARE
    v_target_clinic_id uuid;
    v_actual_doctor_id uuid;
BEGIN
    -- Resolve doctor_id and clinic_id
    SELECT id, clinic_id INTO v_actual_doctor_id, v_target_clinic_id 
    FROM doctors 
    WHERE user_id = p_doctor_id OR id = p_doctor_id 
    LIMIT 1;
    
    -- If not found as doctor, maybe it's a clinic_id directly
    IF v_actual_doctor_id IS NULL THEN
        v_target_clinic_id := p_doctor_id;
    END IF;

    -- Default to last 30 days if no dates provided
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date::timestamp, p_end_date::timestamp, '1 day')::date as d
    )
    SELECT 
        ds.d as report_date,
        COUNT(DISTINCT i.appointment_id) FILTER (WHERE i.appointment_id IS NOT NULL) as total_appointments,
        COALESCE(SUM(i.total_amount), 0) as total_billed,
        COALESCE(SUM(i.paid_amount), 0) as total_collected,
        COALESCE(SUM(i.total_amount - i.paid_amount), 0) as outstanding,
        CASE 
            WHEN COALESCE(SUM(i.total_amount), 0) > 0 
            THEN ROUND((COALESCE(SUM(i.paid_amount), 0) / COALESCE(SUM(i.total_amount), 1)) * 100, 2)
            ELSE 0
        END as collection_rate
    FROM date_series ds
    LEFT JOIN unified_invoices_view i ON i.created_at::date = ds.d AND (i.clinic_id = v_target_clinic_id OR i.doctor_id = v_actual_doctor_id)
    GROUP BY ds.d
    ORDER BY ds.d DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create audit log view for doctor to see secretary actions
-- --------------------------------------------

CREATE TABLE IF NOT EXISTS financial_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type text NOT NULL, -- 'invoice_created', 'payment_received', 'check_in', 'refund', etc.
    performed_by uuid NOT NULL REFERENCES doctors(id),
    performed_by_name text,
    performed_by_role text,
    appointment_id uuid REFERENCES appointments(id),
    invoice_id uuid REFERENCES invoices(id),
    patient_id uuid REFERENCES patients(id),
    patient_name text,
    amount numeric(10,2),
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- 6) Performance Indexes for reporting
CREATE INDEX IF NOT EXISTS idx_invoices_created_at_desc ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_created_at_desc ON pos_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_created_at ON invoices(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_clinic_created_at ON pos_invoices(clinic_id, created_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_created_at ON financial_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_performed_by ON financial_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_action_type ON financial_audit_log(action_type);

-- Enable RLS
ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

-- Doctors can view audit logs for their clinic
DROP POLICY IF EXISTS "Doctors can view clinic audit logs" ON financial_audit_log;
CREATE POLICY "Doctors can view clinic audit logs"
    ON financial_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors d1
            JOIN doctors d2 ON d1.clinic_id = d2.clinic_id
            WHERE d1.user_id = auth.uid()
            AND d2.id = financial_audit_log.performed_by
        )
    );

-- Secretary actions are logged
DROP POLICY IF EXISTS "Secretary can insert audit logs" ON financial_audit_log;
CREATE POLICY "Secretary can insert audit logs"
    ON financial_audit_log FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM doctors WHERE id = performed_by)
    );

-- 6. Create trigger to auto-log financial actions
-- --------------------------------------------

CREATE OR REPLACE FUNCTION log_financial_action()
RETURNS TRIGGER AS $$
DECLARE
    v_actor record;
    v_patient record;
    v_total numeric;
    v_paid numeric;
    v_old_paid numeric;
BEGIN
    -- Get actor info
    SELECT d.id, d.name, d.role INTO v_actor
    FROM doctors d
    WHERE d.user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Get patient info
    SELECT p.id, p.name INTO v_patient
    FROM patients p
    WHERE p.id = NEW.patient_id;
    
    -- Resolve total and paid amounts based on table
    IF TG_TABLE_NAME = 'invoices' THEN
        v_total := COALESCE(NEW.total, NEW.total_amount, 0);
        v_paid := COALESCE(NEW.paid_amount, 0);
        v_old_paid := COALESCE(OLD.paid_amount, 0);
    ELSE -- pos_invoices
        v_total := COALESCE(NEW.total_amount, 0);
        v_paid := COALESCE(NEW.paid_amount, 0);
        v_old_paid := COALESCE(OLD.paid_amount, 0);
    END IF;

    -- Log invoice creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO financial_audit_log (
            action_type,
            performed_by,
            performed_by_name,
            performed_by_role,
            appointment_id,
            invoice_id,
            patient_id,
            patient_name,
            amount,
            details
        ) VALUES (
            'invoice_created',
            v_actor.id,
            v_actor.name,
            v_actor.role,
            NEW.appointment_id,
            NEW.id,
            NEW.patient_id,
            v_patient.name,
            v_total,
            jsonb_build_object(
                'payment_method', NEW.payment_method,
                'paid_amount', v_paid,
                'total', v_total,
                'source', TG_TABLE_NAME
            )
        );
    END IF;
    
    -- Log payment updates
    IF TG_OP = 'UPDATE' AND v_old_paid != v_paid THEN
        INSERT INTO financial_audit_log (
            action_type,
            performed_by,
            performed_by_name,
            performed_by_role,
            appointment_id,
            invoice_id,
            patient_id,
            patient_name,
            amount,
            details
        ) VALUES (
            'payment_updated',
            v_actor.id,
            v_actor.name,
            v_actor.role,
            NEW.appointment_id,
            NEW.id,
            NEW.patient_id,
            v_patient.name,
            v_paid - v_old_paid,
            jsonb_build_object(
                'old_amount', v_old_paid,
                'new_amount', v_paid,
                'payment_method', NEW.payment_method,
                'source', TG_TABLE_NAME
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_invoice_actions ON invoices;
CREATE TRIGGER trg_log_invoice_actions
    AFTER INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_financial_action();

DROP TRIGGER IF EXISTS trg_log_pos_invoice_actions ON pos_invoices;
CREATE TRIGGER trg_log_pos_invoice_actions
    AFTER INSERT OR UPDATE ON pos_invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_financial_action();

-- 7. Create missing collections report
-- --------------------------------------------

-- 7. Create missing collections report
-- --------------------------------------------

DROP VIEW IF EXISTS collections_followup_report;
CREATE OR REPLACE VIEW collections_followup_report AS
SELECT 
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    v.id as invoice_id,
    v.created_at as invoice_date,
    v.total_amount as invoice_total,
    v.paid_amount,
    (v.total_amount - v.paid_amount) as outstanding,
    v.payment_method,
    v.source_type,
    a.appointment_date as visit_date,
    d.name as doctor_name,
    -- Days since invoice
    EXTRACT(DAY FROM NOW() - v.created_at) as days_outstanding,
    -- Priority flag
    CASE 
        WHEN EXTRACT(DAY FROM NOW() - v.created_at) > 7 THEN 'urgent'
        WHEN EXTRACT(DAY FROM NOW() - v.created_at) > 3 THEN 'high'
        ELSE 'normal'
    END as priority
FROM unified_invoices_view v
JOIN patients p ON v.patient_id = p.id
LEFT JOIN appointments a ON v.appointment_id = a.id
LEFT JOIN doctors d ON (a.doctor_id = d.id OR v.doctor_id = d.id)
WHERE v.paid_amount < v.total_amount AND v.status != 'cancelled'
ORDER BY days_outstanding DESC, outstanding DESC;

GRANT SELECT ON collections_followup_report TO authenticated;

-- ============================================
-- MIGRATION COMPLETE ✅
-- Doctor can now VIEW everything financial
-- Secretary still performs all actions
-- Full audit trail maintained
-- ============================================

COMMENT ON VIEW doctor_financial_monitor_view IS 'Complete financial monitoring for doctors - READ ONLY';
COMMENT ON VIEW daily_financial_summary IS 'Daily financial summary by doctor/clinic';
COMMENT ON FUNCTION get_doctor_financial_report IS 'Historical financial report generator for doctors';
COMMENT ON TABLE financial_audit_log IS 'Audit log of all financial actions performed';
COMMENT ON VIEW collections_followup_report IS 'Outstanding collections that need follow-up';
