-- Check Aya's profile and linkage
SELECT 
    id, 
    email, 
    user_role, 
    secretary_doctor_id, 
    specialty 
FROM doctors 
WHERE email LIKE '%aya%'; -- Searching by name/email fragment if exact email is unknown, or assume user knows it.

-- Let's check all secretaries to be safe
SELECT * FROM doctors WHERE user_role = 'secretary';
