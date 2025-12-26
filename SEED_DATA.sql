-- ============================================================================
-- 🌱 بيانات تجريبية لاختبار لوحة تحكم الأدمن
-- ============================================================================
-- نسخ والصق في Supabase SQL Editor
-- ============================================================================

-- 1️⃣ إضافة عيادات تجريبية (5 أطباء)
DO $$
DECLARE
  doctor1_id UUID;
  doctor2_id UUID;
  doctor3_id UUID;
  doctor4_id UUID;
  doctor5_id UUID;
BEGIN
  -- إضافة الطبيب الأول
  INSERT INTO doctors (name, email, phone, specialization, user_role, is_active, created_at)
  VALUES ('د. أحمد محمد', 'ahmed@clinic.com', '0501234567', 'أمراض نساء وتوليد', 'doctor', true, NOW() - INTERVAL '3 months')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO doctor1_id;

  -- إضافة الطبيب الثاني
  INSERT INTO doctors (name, email, phone, specialization, user_role, is_active, created_at)
  VALUES ('د. سارة علي', 'sara@clinic.com', '0509876543', 'أطفال أنابيب', 'doctor', true, NOW() - INTERVAL '2 months')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO doctor2_id;

  -- إضافة الطبيب الثالث
  INSERT INTO doctors (name, email, phone, specialization, user_role, is_active, created_at)
  VALUES ('د. محمود حسن', 'mahmoud@clinic.com', '0505551234', 'طب النساء', 'doctor', true, NOW() - INTERVAL '1 month')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO doctor3_id;

  -- إضافة الطبيب الرابع (معطل)
  INSERT INTO doctors (name, email, phone, specialization, user_role, is_active, created_at)
  VALUES ('د. فاطمة خالد', 'fatima@clinic.com', '0507778899', 'أمراض نساء وتوليد', 'doctor', false, NOW() - INTERVAL '15 days')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO doctor4_id;

  -- إضافة الطبيب الخامس
  INSERT INTO doctors (name, email, phone, specialization, user_role, is_active, created_at)
  VALUES ('د. عمر سعيد', 'omar@clinic.com', '0502223344', 'أطفال أنابيب', 'doctor', true, NOW() - INTERVAL '5 days')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO doctor5_id;

  -- إضافة سكرتيرات
  INSERT INTO doctors (name, email, phone, specialization, user_role, doctor_id, is_active, created_at)
  VALUES 
    ('نور الهدى', 'nour@secretary.com', '0508881111', 'سكرتارية', 'secretary', doctor1_id, true, NOW()),
    ('ريم أحمد', 'reem@secretary.com', '0508882222', 'سكرتارية', 'secretary', doctor2_id, true, NOW()),
    ('هدى محمد', 'hoda@secretary.com', '0508883333', 'سكرتارية', 'secretary', doctor3_id, true, NOW())
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'تم إضافة % أطباء و % سكرتيرات', 5, 3;
END $$;

-- 2️⃣ إضافة خطط الاشتراك
INSERT INTO subscription_plans (name, name_en, price, duration_days, features, is_active)
VALUES
  ('أساسية', 'Basic', 4999.00, 30, '{"patients": 50, "storage": "1GB", "support": "بريد"}', true),
  ('متقدمة', 'Standard', 9999.00, 30, '{"patients": 200, "storage": "5GB", "support": "أولوية"}', true),
  ('احترافية', 'Enterprise', 19999.00, 30, '{"patients": "unlimited", "storage": "unlimited", "support": "24/7"}', true)
ON CONFLICT (name) DO NOTHING;

-- 3️⃣ إضافة اشتراكات للعيادات
INSERT INTO clinic_subscriptions (clinic_id, plan_id, start_date, end_date, status)
SELECT 
  d.id,
  (SELECT id FROM subscription_plans ORDER BY RANDOM() LIMIT 1),
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '20 days',
  CASE WHEN d.is_active THEN 'active' ELSE 'expired' END
FROM doctors d
WHERE d.user_role = 'doctor'
ON CONFLICT DO NOTHING;

-- 4️⃣ إضافة مرضى تجريبيين
INSERT INTO patients (doctor_id, name, national_id, phone, gender, birth_date, address)
SELECT 
  d.id,
  'مريض تجريبي ' || gs,
  '29' || LPAD((RANDOM() * 99999999)::BIGINT::TEXT, 10, '0'),
  '050' || LPAD((RANDOM() * 9999999)::INT::TEXT, 7, '0'),
  CASE WHEN RANDOM() > 0.5 THEN 'female' ELSE 'male' END,
  NOW() - INTERVAL '25 years' - (RANDOM() * INTERVAL '15 years'),
  'عنوان تجريبي - الخليل، فلسطين'
FROM doctors d
CROSS JOIN generate_series(1, 3) gs
WHERE d.user_role = 'doctor' AND d.is_active = true;

-- ============================================
-- ✅ التحقق من البيانات
-- ============================================

SELECT '===== 📊 إحصائيات النظام =====' as "نتيجة";

SELECT 'إجمالي العيادات' as "البند", COUNT(*)::TEXT as "العدد" 
FROM doctors WHERE user_role = 'doctor'
UNION ALL
SELECT 'العيادات النشطة', COUNT(*)::TEXT 
FROM doctors WHERE user_role = 'doctor' AND is_active = true
UNION ALL
SELECT 'السكرتارية', COUNT(*)::TEXT 
FROM doctors WHERE user_role = 'secretary'
UNION ALL
SELECT 'خطط الاشتراك', COUNT(*)::TEXT 
FROM subscription_plans
UNION ALL
SELECT 'الاشتراكات النشطة', COUNT(*)::TEXT 
FROM clinic_subscriptions WHERE status = 'active'
UNION ALL
SELECT 'المرضى', COUNT(*)::TEXT 
FROM patients;

-- عرض العيادات
SELECT '===== 🏥 العيادات =====' as "نتيجة";
SELECT name as "الاسم", email as "الإيميل", specialization as "التخصص", 
       CASE WHEN is_active THEN '✅ نشط' ELSE '🔒 معطل' END as "الحالة"
FROM doctors WHERE user_role = 'doctor';

-- ============================================
-- 🎉 تم! افتح لوحة تحكم الأدمن الآن
-- ============================================-- ============================================================================
-- DONE!
-- Data should now be visible in the app
-- ============================================================================
