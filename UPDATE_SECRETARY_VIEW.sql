-- Add doctor_id to secretary_queue_view
CREATE OR REPLACE VIEW secretary_queue_view AS
SELECT 
    a.id as appointment_id,
    a.appointment_date,
    a.appointment_date::time as appointment_time,
    a.status as appointment_status,
    a.payment_status,
    a.checked_in_at,
    a.amount_required,
    a.amount_paid,
    a.doctor_id, -- Added this column
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    d.name as doctor_name,
    -- Count pending service requests
    (SELECT COUNT(*) FROM service_requests sr 
     WHERE sr.appointment_id = a.id AND sr.status = 'requested') as pending_requests
FROM appointments a
JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE a.appointment_date::date = CURRENT_DATE
ORDER BY a.appointment_date ASC;

GRANT SELECT ON secretary_queue_view TO authenticated;
