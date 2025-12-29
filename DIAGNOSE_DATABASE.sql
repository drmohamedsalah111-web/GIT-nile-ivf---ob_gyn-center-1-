/* 
   � CHECKUP REPORT (تقرير الفحص)
   ================================================================
   Run this file to see your account and subscription details.
   This helps confirm that your data is safe.
   ================================================================
*/

-- 1. CHECK YOUR ACCOUNT (تفاصيل الحساب)
SELECT id, email, name, user_role, secretary_doctor_id, is_active, updated_at 
FROM doctors 
WHERE email = 'dr.mohamed.salah.gabr@gmail.com';

-- 2. CHECK YOUR SUBSCRIPTION (تفاصيل الاشتراك)
SELECT s.id as sub_id, s.status, s.start_date, s.end_date, s.clinic_id
FROM clinic_subscriptions s
WHERE s.clinic_id = (
    SELECT id FROM doctors WHERE email = 'dr.mohamed.salah.gabr@gmail.com' LIMIT 1
);
