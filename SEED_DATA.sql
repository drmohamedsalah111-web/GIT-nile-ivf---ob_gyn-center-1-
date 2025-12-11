-- ============================================================================
-- NILE IVF - SEED DATA (SAMPLE DATA FOR TESTING)
-- ============================================================================
-- Run this in Supabase SQL Editor to populate with sample data

-- Note: Replace 'YOUR_DOCTOR_USER_ID' with actual user ID from auth.users table

-- ============================================================================
-- 1. ADD SAMPLE DOCTOR (if not exists)
-- ============================================================================
-- This will use the first user from auth.users table

INSERT INTO doctors (user_id, email, name, specialization, phone)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'doctor@example.com',
  'د محمد صلاح جبر',
  'أخصائي الخصوبة',
  '01000000000'
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
);

-- ============================================================================
-- 2. ADD SAMPLE PATIENTS
-- ============================================================================
INSERT INTO patients (name, age, phone, husband_name, history, doctor_id)
VALUES 
  ('فاطمة احمد', 32, '01012345678', 'محمد علي', 'عدم الحمل لمدة 3 سنوات', (SELECT id FROM doctors LIMIT 1)),
  ('سارة محمود', 28, '01087654321', 'أحمد حسن', 'تأخر الحمل الثانوي', (SELECT id FROM doctors LIMIT 1)),
  ('ليلى خالد', 35, '01098765432', 'عمر محمد', 'أكياس على المبايض', (SELECT id FROM doctors LIMIT 1));

-- ============================================================================
-- 3. ADD SAMPLE IVF CYCLES
-- ============================================================================
INSERT INTO ivf_cycles (patient_id, doctor_id, protocol, status, start_date, assessment_data)
VALUES 
  (
    (SELECT id FROM patients WHERE name = 'فاطمة احمد'),
    (SELECT id FROM doctors LIMIT 1),
    'Long Protocol',
    'Active',
    CURRENT_DATE,
    jsonb_build_object(
      'coupleProfile', jsonb_build_object('duration', '3 years', 'type', 'primary'),
      'maleFactorData', jsonb_build_object('spermCount', 50, 'motility', 40),
      'femaleFactorData', jsonb_build_object('amh', 3.5, 'follicleCount', 15)
    )
  ),
  (
    (SELECT id FROM patients WHERE name = 'سارة محمود'),
    (SELECT id FROM doctors LIMIT 1),
    'Short Protocol',
    'Active',
    CURRENT_DATE + INTERVAL '1 week',
    jsonb_build_object(
      'coupleProfile', jsonb_build_object('duration', '2 years', 'type', 'secondary')
    )
  );

-- ============================================================================
-- 4. ADD SAMPLE VISITS
-- ============================================================================
INSERT INTO visits (patient_id, date, department, diagnosis, prescription, notes)
VALUES 
  (
    (SELECT id FROM patients WHERE name = 'فاطمة احمد'),
    CURRENT_DATE,
    'IVF',
    'تأخر الحمل',
    jsonb_build_array(jsonb_build_object('drug', 'Gonal-F', 'dose', '300 IU')),
    'بدء تحفيز المبايض'
  ),
  (
    (SELECT id FROM patients WHERE name = 'سارة محمود'),
    CURRENT_DATE - INTERVAL '5 days',
    'IVF',
    'تأخر الحمل الثانوي',
    jsonb_build_array(jsonb_build_object('drug', 'Menopur', 'dose', '75 IU')),
    'متابعة روتينية'
  );

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================
-- Run these to confirm data was inserted:

SELECT '📊 DOCTORS' as section;
SELECT id, name, email, specialization FROM doctors;

SELECT '👥 PATIENTS' as section;
SELECT id, name, age, doctor_id FROM patients;

SELECT '🔄 IVF CYCLES' as section;
SELECT id, patient_id, protocol, status, start_date FROM ivf_cycles;

SELECT '📋 VISITS' as section;
SELECT id, patient_id, date, department, diagnosis FROM visits;

-- ============================================================================
-- DONE!
-- Data should now be visible in the app
-- ============================================================================
