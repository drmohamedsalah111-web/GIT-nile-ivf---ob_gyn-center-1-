-- ============================================
-- STRICT SEPARATION BILLING SYSTEM MIGRATION
-- Part 1: Database Schema Updates
-- ============================================

-- 1. Update appointments table with payment tracking
-- --------------------------------------------

-- Add payment_status enum type
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'partially_paid', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS checked_in_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS amount_required numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2) DEFAULT 0;

-- Add index for faster queries on payment status
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_checked_in ON appointments(checked_in_at) WHERE checked_in_at IS NOT NULL;

-- 2. Create service_requests table (Doctor → Secretary Flow)
-- --------------------------------------------

CREATE TABLE IF NOT EXISTS service_requests (
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

-- Indexes for service_requests
CREATE INDEX IF NOT EXISTS idx_service_requests_appointment ON service_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_requested_by ON service_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);

-- Enable RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_requests
CREATE POLICY "Doctors can insert service requests"
    ON service_requests FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM doctors WHERE id = requested_by)
    );

CREATE POLICY "Doctors can view their own requests"
    ON service_requests FOR SELECT
    USING (
        auth.uid() IN (SELECT user_id FROM doctors WHERE id = requested_by)
    );

CREATE POLICY "Secretary can view all service requests"
    ON service_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

CREATE POLICY "Secretary can update service requests"
    ON service_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- 3. Update invoices table to link with appointments
-- --------------------------------------------

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_from_service_request boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id);

-- 4. Create function to auto-update appointment amounts
-- --------------------------------------------

CREATE OR REPLACE FUNCTION update_appointment_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update appointment totals when invoice is created/updated
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE appointments
        SET 
            amount_required = (
                SELECT COALESCE(SUM(total), 0)
                FROM invoices
                WHERE appointment_id = NEW.appointment_id
            ),
            amount_paid = (
                SELECT COALESCE(SUM(paid_amount), 0)
                FROM invoices
                WHERE appointment_id = NEW.appointment_id
            ),
            payment_status = CASE
                WHEN (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE appointment_id = NEW.appointment_id) >= 
                     (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE appointment_id = NEW.appointment_id)
                THEN 'paid'::payment_status_enum
                WHEN (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE appointment_id = NEW.appointment_id) > 0
                THEN 'partially_paid'::payment_status_enum
                ELSE 'pending'::payment_status_enum
            END
        WHERE id = NEW.appointment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invoice updates
DROP TRIGGER IF EXISTS trg_update_appointment_totals ON invoices;
CREATE TRIGGER trg_update_appointment_totals
    AFTER INSERT OR UPDATE OF paid_amount, total
    ON invoices
    FOR EACH ROW
    WHEN (NEW.appointment_id IS NOT NULL)
    EXECUTE FUNCTION update_appointment_payment_totals();

-- 5. Create function to check-in patient (Secretary action)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION secretary_check_in_patient(
    p_appointment_id uuid,
    p_override_password text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    v_appointment record;
    v_override_valid boolean := false;
    v_result json;
BEGIN
    -- Get appointment details
    SELECT * INTO v_appointment
    FROM appointments
    WHERE id = p_appointment_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Appointment not found');
    END IF;
    
    -- Check if override password is provided and valid (admin feature)
    IF p_override_password IS NOT NULL THEN
        -- Check if password matches admin override (you can customize this)
        IF p_override_password = 'ADMIN_OVERRIDE_2025' THEN
            v_override_valid := true;
        END IF;
    END IF;
    
    -- Verify payment is complete (unless override)
    IF NOT v_override_valid AND v_appointment.amount_paid < v_appointment.amount_required THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Payment incomplete',
            'required', v_appointment.amount_required,
            'paid', v_appointment.amount_paid
        );
    END IF;
    
    -- Check-in the patient
    UPDATE appointments
    SET 
        payment_status = 'paid'::payment_status_enum,
        checked_in_at = now(),
        status = 'checked_in'
    WHERE id = p_appointment_id;
    
    v_result := json_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'checked_in_at', now(),
        'override_used', v_override_valid
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create view for secretary dashboard
-- --------------------------------------------

CREATE OR REPLACE VIEW secretary_queue_view AS
SELECT 
    a.id as appointment_id,
    a.date as appointment_date,
    a.time as appointment_time,
    a.status as appointment_status,
    a.payment_status,
    a.checked_in_at,
    a.amount_required,
    a.amount_paid,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    p.total_debt as patient_old_debt,
    d.name as doctor_name,
    -- Count pending service requests
    (SELECT COUNT(*) FROM service_requests sr 
     WHERE sr.appointment_id = a.id AND sr.status = 'requested') as pending_requests
FROM appointments a
JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE a.date = CURRENT_DATE
ORDER BY a.time ASC;

-- Grant access to secretary role
GRANT SELECT ON secretary_queue_view TO authenticated;

-- 7. Create view for doctor queue
-- --------------------------------------------

CREATE OR REPLACE VIEW doctor_queue_view AS
SELECT 
    a.id as appointment_id,
    a.date as appointment_date,
    a.time as appointment_time,
    a.status as appointment_status,
    a.payment_status,
    a.checked_in_at,
    a.doctor_id,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    p.date_of_birth as patient_dob,
    -- Lock status (can doctor access this patient?)
    CASE 
        WHEN a.payment_status = 'paid' AND a.checked_in_at IS NOT NULL THEN 'unlocked'
        ELSE 'locked'
    END as access_status
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.date = CURRENT_DATE
ORDER BY a.time ASC;

GRANT SELECT ON doctor_queue_view TO authenticated;

-- 8. Create notification function for realtime
-- --------------------------------------------

CREATE OR REPLACE FUNCTION notify_service_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Send realtime notification when doctor creates service request
    PERFORM pg_notify(
        'service_request_channel',
        json_build_object(
            'type', 'new_service_request',
            'appointment_id', NEW.appointment_id,
            'service_name', NEW.service_name,
            'patient_id', NEW.patient_id,
            'requested_by', NEW.requested_by
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_service_request ON service_requests;
CREATE TRIGGER trg_notify_service_request
    AFTER INSERT ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_service_request();

-- 9. Create notification for payment completion
-- --------------------------------------------

CREATE OR REPLACE FUNCTION notify_payment_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify when patient is checked in (payment complete)
    IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
        PERFORM pg_notify(
            'appointment_checkin_channel',
            json_build_object(
                'type', 'patient_checked_in',
                'appointment_id', NEW.id,
                'patient_id', NEW.patient_id,
                'doctor_id', NEW.doctor_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_payment_complete ON appointments;
CREATE TRIGGER trg_notify_payment_complete
    AFTER UPDATE OF checked_in_at
    ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_complete();

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================

COMMENT ON TABLE service_requests IS 'Doctor requests for additional services during consultation';
COMMENT ON FUNCTION secretary_check_in_patient IS 'Secretary function to check-in patient after payment verification';
COMMENT ON VIEW secretary_queue_view IS 'Real-time queue view for secretary dashboard';
COMMENT ON VIEW doctor_queue_view IS 'Real-time queue view for doctor dashboard with access control';
