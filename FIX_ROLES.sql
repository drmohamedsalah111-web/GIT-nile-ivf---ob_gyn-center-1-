-- ============================================================================
-- FORCE FIX: UPDATE ALL SECRETARY USERS
-- ============================================================================
-- If you know the email of the secretary, replace 'secretary@example.com'
-- Otherwise, this script tries to fix potential data issues
-- ============================================================================

-- 1. Ensure user_role is 'secretary' for any user that has a secretary_doctor_id
UPDATE doctors 
SET user_role = 'secretary' 
WHERE secretary_doctor_id IS NOT NULL 
AND (user_role IS NULL OR user_role = 'doctor');

-- 2. Ensure user_role is 'doctor' for any user that has NO secretary_doctor_id
-- Be careful with this one, only run if you are sure admins are handled differently
-- UPDATE doctors 
-- SET user_role = 'doctor' 
-- WHERE secretary_doctor_id IS NULL 
-- AND (user_role IS NULL OR user_role = 'secretary');

-- 3. Verify the update
SELECT email, user_role, secretary_doctor_id FROM doctors;
