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


-- Drop and recreate doctor_financial_monitor_view to avoid column rename conflicts
DROP VIEW IF EXISTS doctor_financial_monitor_view;

-- Enhanced doctor-only financial monitor view (smart, with control columns)
CREATE OR REPLACE VIEW doctor_financial_monitor_view AS
SELECT 
    i.id as invoice_id,
    i.created_at as invoice_date,
    COALESCE(i.total, 0) as invoice_total,
    COALESCE(i.paid_amount, 0) as paid_amount,
    i.payment_method,
    i.status as invoice_status,
    i.is_from_service_request,
    a.id as appointment_id,
    a.appointment_date as appointment_date,
    a.appointment_date::time as appointment_time,
    a.payment_status,
    a.checked_in_at,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    d.id as doctor_id,
    d.name as doctor_name,
    d.clinic_id,
    (i.total - i.paid_amount) as outstanding_amount,
    -- Smart overdue days
    EXTRACT(DAY FROM NOW() - i.created_at) as overdue_days,
    -- Smart alert level
    CASE 
        WHEN i.paid_amount < i.total AND EXTRACT(DAY FROM NOW() - i.created_at) > 7 THEN 'urgent'
        WHEN i.paid_amount < i.total AND EXTRACT(DAY FROM NOW() - i.created_at) > 3 THEN 'high'
        WHEN i.paid_amount < i.total THEN 'normal'
        ELSE 'none'
    END as alert_level,
    CASE 
        WHEN i.paid_amount < i.total AND i.created_at < NOW() - INTERVAL '1 day' THEN true
        ELSE false
    END as needs_followup,
    sr.service_name as requested_service,
    sr.status as service_request_status,
    sr.requested_at
FROM invoices i
LEFT JOIN appointments a ON i.appointment_id = a.id
LEFT JOIN patients p ON i.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN service_requests sr ON sr.appointment_id = a.id
WHERE d.user_id = auth.uid()
ORDER BY i.created_at DESC;

-- Smart daily summary for doctor
CREATE OR REPLACE VIEW doctor_daily_summary AS
SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.clinic_id,
    CURRENT_DATE as report_date,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.id END) as checked_in_count,
    COUNT(DISTINCT CASE WHEN a.payment_status = 'paid' THEN a.id END) as fully_paid_count,
    COUNT(DISTINCT CASE WHEN a.payment_status = 'partially_paid' THEN a.id END) as partial_paid_count,
    COUNT(DISTINCT CASE WHEN a.payment_status = 'pending' THEN a.id END) as pending_payment_count,
    COALESCE(SUM(i.total), 0) as total_billed,
    COALESCE(SUM(i.paid_amount), 0) as total_collected,
    COALESCE(SUM(i.total - i.paid_amount), 0) as total_outstanding,
    COUNT(DISTINCT sr.id) as total_service_requests,
    COUNT(DISTINCT CASE WHEN sr.status = 'requested' THEN sr.id END) as pending_service_requests,
    COUNT(DISTINCT CASE WHEN sr.status = 'fulfilled' THEN sr.id END) as fulfilled_service_requests
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.id AND a.appointment_date = CURRENT_DATE
LEFT JOIN invoices i ON i.appointment_id = a.id
LEFT JOIN service_requests sr ON sr.appointment_id = a.id
WHERE d.user_id = auth.uid()
GROUP BY d.id, d.name, d.clinic_id;

GRANT SELECT ON doctor_financial_monitor_view TO authenticated;
GRANT SELECT ON doctor_daily_summary TO authenticated;

CREATE OR REPLACE VIEW daily_financial_summary AS
SELECT 
    CURRENT_DATE as report_date,
    d.id as doctor_id,
    d.name as doctor_name,
    d.clinic_id,
    -- Today's statistics
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.id END) as checked_in_count,
    COUNT(DISTINCT CASE WHEN a.payment_status = 'paid' THEN a.id END) as fully_paid_count,
    COUNT(DISTINCT CASE WHEN a.payment_status = 'partially_paid' THEN a.id END) as partial_paid_count,
    COUNT(DISTINCT CASE WHEN a.payment_status = 'pending' THEN a.id END) as pending_payment_count,
    -- Financial totals
    COALESCE(SUM(i.total), 0) as total_billed,
    COALESCE(SUM(i.paid_amount), 0) as total_collected,
    COALESCE(SUM(i.total - i.paid_amount), 0) as total_outstanding,
    -- Service requests
    COUNT(DISTINCT sr.id) as total_service_requests,
    COUNT(DISTINCT CASE WHEN sr.status = 'requested' THEN sr.id END) as pending_service_requests,
    COUNT(DISTINCT CASE WHEN sr.status = 'fulfilled' THEN sr.id END) as fulfilled_service_requests
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.id AND a.appointment_date = CURRENT_DATE
LEFT JOIN invoices i ON i.appointment_id = a.id
LEFT JOIN service_requests sr ON sr.appointment_id = a.id
GROUP BY d.id, d.name, d.clinic_id;

GRANT SELECT ON daily_financial_summary TO authenticated;

-- 4. Create function for doctor to query financial history
-- --------------------------------------------

CREATE OR REPLACE FUNCTION get_doctor_financial_report(
    p_doctor_id uuid,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS TABLE(
    date date,
    total_appointments bigint,
    total_billed numeric,
    total_collected numeric,
    outstanding numeric,
    collection_rate numeric
) AS $$
BEGIN
    -- Default to last 30 days if no dates provided
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        a.appointment_date,
        COUNT(DISTINCT a.id) as total_appointments,
        COALESCE(SUM(i.total), 0) as total_billed,
        COALESCE(SUM(i.paid_amount), 0) as total_collected,
        COALESCE(SUM(i.total - i.paid_amount), 0) as outstanding,
        CASE 
            WHEN COALESCE(SUM(i.total), 0) > 0 
            THEN ROUND((COALESCE(SUM(i.paid_amount), 0) / COALESCE(SUM(i.total), 1)) * 100, 2)
            ELSE 0
        END as collection_rate
    FROM appointments a
    LEFT JOIN invoices i ON i.appointment_id = a.id
    WHERE a.doctor_id = p_doctor_id
    AND a.appointment_date BETWEEN p_start_date AND p_end_date
    GROUP BY a.appointment_date
    ORDER BY a.appointment_date DESC;
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
    
    -- Log invoice creation
    IF TG_TABLE_NAME = 'invoices' AND TG_OP = 'INSERT' THEN
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
            NEW.total,
            jsonb_build_object(
                'payment_method', NEW.payment_method,
                'paid_amount', NEW.paid_amount,
                'total', NEW.total
            )
        );
    END IF;
    
    -- Log payment updates
    IF TG_TABLE_NAME = 'invoices' AND TG_OP = 'UPDATE' AND OLD.paid_amount != NEW.paid_amount THEN
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
            NEW.paid_amount - OLD.paid_amount,
            jsonb_build_object(
                'old_amount', OLD.paid_amount,
                'new_amount', NEW.paid_amount,
                'payment_method', NEW.payment_method
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

-- 7. Create missing collections report
-- --------------------------------------------

CREATE OR REPLACE VIEW collections_followup_report AS
SELECT 
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    i.id as invoice_id,
    i.created_at as invoice_date,
    i.total as invoice_total,
    i.paid_amount,
    (i.total - i.paid_amount) as outstanding,
    i.payment_method,
    a.appointment_date as visit_date,
    d.name as doctor_name,
    -- Days since invoice
    EXTRACT(DAY FROM NOW() - i.created_at) as days_outstanding,
    -- Priority flag
    CASE 
        WHEN EXTRACT(DAY FROM NOW() - i.created_at) > 7 THEN 'urgent'
        WHEN EXTRACT(DAY FROM NOW() - i.created_at) > 3 THEN 'high'
        ELSE 'normal'
    END as priority
FROM invoices i
JOIN patients p ON i.patient_id = p.id
LEFT JOIN appointments a ON i.appointment_id = a.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE i.paid_amount < i.total
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
