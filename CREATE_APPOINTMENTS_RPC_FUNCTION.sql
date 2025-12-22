-- ========================================
-- Create RPC Function to Fetch Appointments with Joins
-- ========================================
-- This function does the JOIN in the database and returns
-- appointments with patient and doctor data included

-- Drop function if exists
DROP FUNCTION IF EXISTS get_appointments_with_details(date, date);
DROP FUNCTION IF EXISTS get_doctor_appointments_with_details(uuid, date, date);
DROP FUNCTION IF EXISTS get_all_doctor_appointments_with_details(uuid);

-- Function 1: Get appointments by date range
CREATE OR REPLACE FUNCTION get_appointments_with_details(
    start_date timestamp with time zone,
    end_date timestamp with time zone
)
RETURNS TABLE (
    id uuid,
    patient_id uuid,
    doctor_id uuid,
    appointment_date timestamp with time zone,
    status text,
    visit_type text,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_by uuid,
    patient jsonb,
    doctor jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.status,
        a.visit_type,
        a.notes,
        a.created_at,
        a.updated_at,
        a.created_by,
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'phone', p.phone,
            'email', p.email
        ) as patient,
        jsonb_build_object(
            'id', d.id,
            'name', d.name,
            'email', d.email
        ) as doctor
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.appointment_date >= start_date 
      AND a.appointment_date <= end_date
    ORDER BY a.appointment_date ASC;
END;
$$;

-- Function 2: Get doctor appointments by date range
CREATE OR REPLACE FUNCTION get_doctor_appointments_with_details(
    p_doctor_id uuid,
    start_date timestamp with time zone,
    end_date timestamp with time zone
)
RETURNS TABLE (
    id uuid,
    patient_id uuid,
    doctor_id uuid,
    appointment_date timestamp with time zone,
    status text,
    visit_type text,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_by uuid,
    patient jsonb,
    doctor jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.status,
        a.visit_type,
        a.notes,
        a.created_at,
        a.updated_at,
        a.created_by,
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'phone', p.phone,
            'email', p.email
        ) as patient,
        jsonb_build_object(
            'id', d.id,
            'name', d.name,
            'email', d.email
        ) as doctor
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.doctor_id = p_doctor_id
      AND a.appointment_date >= start_date 
      AND a.appointment_date <= end_date
    ORDER BY a.appointment_date ASC;
END;
$$;

-- Function 3: Get all doctor appointments (no date filter)
CREATE OR REPLACE FUNCTION get_all_doctor_appointments_with_details(
    p_doctor_id uuid
)
RETURNS TABLE (
    id uuid,
    patient_id uuid,
    doctor_id uuid,
    appointment_date timestamp with time zone,
    status text,
    visit_type text,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_by uuid,
    patient jsonb,
    doctor jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.status,
        a.visit_type,
        a.notes,
        a.created_at,
        a.updated_at,
        a.created_by,
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'phone', p.phone,
            'email', p.email
        ) as patient,
        jsonb_build_object(
            'id', d.id,
            'name', d.name,
            'email', d.email
        ) as doctor
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.doctor_id = p_doctor_id
      AND a.status != 'cancelled'
    ORDER BY a.appointment_date ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_appointments_with_details(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_appointments_with_details(uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_doctor_appointments_with_details(uuid) TO authenticated;

-- Test the functions
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RPC Functions created successfully!';
    RAISE NOTICE 'Functions available:';
    RAISE NOTICE '  - get_appointments_with_details(start_date, end_date)';
    RAISE NOTICE '  - get_doctor_appointments_with_details(doctor_id, start_date, end_date)';
    RAISE NOTICE '  - get_all_doctor_appointments_with_details(doctor_id)';
    RAISE NOTICE '========================================';
END $$;
