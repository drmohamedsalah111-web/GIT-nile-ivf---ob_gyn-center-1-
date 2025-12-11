-- ============================================================================
-- SIMPLE QUICK FIX - Direct inserts with hardcoded IDs
-- ============================================================================

-- Delete old data first if exists
DELETE FROM visits WHERE id IN ('72345678-1234-1234-1234-123456789abc', '82345678-1234-1234-1234-123456789abc');
DELETE FROM ivf_cycles WHERE id IN ('52345678-1234-1234-1234-123456789abc', '62345678-1234-1234-1234-123456789abc');
DELETE FROM patients WHERE id IN ('22345678-1234-1234-1234-123456789abc', '32345678-1234-1234-1234-123456789abc', '42345678-1234-1234-1234-123456789abc');
DELETE FROM doctors WHERE id = '12345678-1234-1234-1234-123456789abc';

-- Add doctor
INSERT INTO doctors (id, user_id, email, name, specialization, phone)
VALUES ('12345678-1234-1234-1234-123456789abc', 'test-user-001', 'test@example.com', 'د محمد صلاح', 'أخصائي الخصوبة', '01000000000');

-- Add patients
INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id)
VALUES ('22345678-1234-1234-1234-123456789abc', 'فاطمة احمد', 32, '01012345678', 'محمد علي', 'عدم الحمل 3 سنوات', '12345678-1234-1234-1234-123456789abc');

INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id)
VALUES ('32345678-1234-1234-1234-123456789abc', 'سارة محمود', 28, '01087654321', 'أحمد حسن', 'تأخر الحمل الثانوي', '12345678-1234-1234-1234-123456789abc');

INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id)
VALUES ('42345678-1234-1234-1234-123456789abc', 'ليلى خالد', 35, '01098765432', 'عمر محمد', 'أكياس على المبايض', '12345678-1234-1234-1234-123456789abc');

-- Add IVF cycles
INSERT INTO ivf_cycles (id, patient_id, doctor_id, protocol, status, start_date, assessment_data)
VALUES ('52345678-1234-1234-1234-123456789abc', '22345678-1234-1234-1234-123456789abc', '12345678-1234-1234-1234-123456789abc', 'Long Protocol', 'Active', CURRENT_DATE, '{"test": "data"}');

INSERT INTO ivf_cycles (id, patient_id, doctor_id, protocol, status, start_date, assessment_data)
VALUES ('62345678-1234-1234-1234-123456789abc', '32345678-1234-1234-1234-123456789abc', '12345678-1234-1234-1234-123456789abc', 'Short Protocol', 'Active', CURRENT_DATE, '{"test": "data"}');

-- Add visits
INSERT INTO visits (id, patient_id, date, department, diagnosis, notes)
VALUES ('72345678-1234-1234-1234-123456789abc', '22345678-1234-1234-1234-123456789abc', CURRENT_DATE, 'IVF', 'تأخر الحمل', 'بدء تحفيز المبايض');

INSERT INTO visits (id, patient_id, date, department, diagnosis, notes)
VALUES ('82345678-1234-1234-1234-123456789abc', '32345678-1234-1234-1234-123456789abc', CURRENT_DATE - INTERVAL '5 days', 'IVF', 'تأخر الحمل الثانوي', 'متابعة روتينية');

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT COUNT(*) as doctors_count FROM doctors WHERE id = '12345678-1234-1234-1234-123456789abc';
SELECT COUNT(*) as patients_count FROM patients WHERE doctor_id = '12345678-1234-1234-1234-123456789abc';
SELECT COUNT(*) as cycles_count FROM ivf_cycles WHERE doctor_id = '12345678-1234-1234-1234-123456789abc';
SELECT COUNT(*) as visits_count FROM visits WHERE id IN ('72345678-1234-1234-1234-123456789abc', '82345678-1234-1234-1234-123456789abc');
