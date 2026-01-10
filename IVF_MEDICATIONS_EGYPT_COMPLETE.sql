-- =====================================================
-- قاعدة بيانات أدوية الحقن المجهري - السوق المصري
-- IVF Medications Database - Egyptian Market
-- =====================================================

-- إنشاء جدول مرجعي لأدوية الحقن المجهري
CREATE TABLE IF NOT EXISTS ivf_medications_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- الاسم التجاري بالإنجليزية
  trade_name_en TEXT NOT NULL,
  -- الاسم التجاري بالعربية
  trade_name_ar TEXT,
  -- المادة الفعالة بالإنجليزية
  active_ingredient_en TEXT NOT NULL,
  -- المادة الفعالة بالعربية
  active_ingredient_ar TEXT,
  -- التركيز
  concentration TEXT NOT NULL,
  -- الوحدة
  unit TEXT NOT NULL,
  -- فئة الدواء (Gonadotropins, GnRH Agonist, GnRH Antagonist, Trigger, Support)
  medication_category TEXT NOT NULL,
  -- طريقة الإعطاء بالإنجليزية
  route_en TEXT NOT NULL,
  -- طريقة الإعطاء بالعربية
  route_ar TEXT NOT NULL,
  -- تعليمات الاستخدام بالعربية
  usage_instructions_ar TEXT,
  -- الشركة المصنعة
  manufacturer TEXT,
  -- متوفر في مصر
  available_in_egypt BOOLEAN DEFAULT true,
  -- السعر التقريبي (جنيه مصري)
  approximate_price_egp DECIMAL(10,2),
  -- ملاحظات
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Composite unique constraint: نفس الدواء بنفس التركيز لا يتكرر
  UNIQUE(trade_name_en, concentration, unit)
);

-- =====================================================
-- 1. Gonadotropins (أدوية التنشيط)
-- =====================================================

-- FSH Products (Follicle Stimulating Hormone)
INSERT INTO ivf_medications_reference 
(trade_name_en, trade_name_ar, active_ingredient_en, active_ingredient_ar, concentration, unit, medication_category, route_en, route_ar, usage_instructions_ar, manufacturer, approximate_price_egp)
VALUES
-- Gonal-F (Merck Serono)
('Gonal-F', 'جونال-إف', 'Follitropin Alfa', 'فوليتروبين ألفا', '75', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', 350.00),
('Gonal-F', 'جونال-إف', 'Follitropin Alfa', 'فوليتروبين ألفا', '150', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', 650.00),
('Gonal-F', 'جونال-إف', 'Follitropin Alfa', 'فوليتروبين ألفا', '300', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', 1200.00),
('Gonal-F', 'جونال-إف', 'Follitropin Alfa', 'فوليتروبين ألفا', '450', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', 1800.00),
('Gonal-F', 'جونال-إف', 'Follitropin Alfa', 'فوليتروبين ألفا', '900', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', 3500.00),

-- Puregon (Organon/MSD)
('Puregon', 'بيوريجون', 'Follitropin Beta', 'فوليتروبين بيتا', '50', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', 250.00),
('Puregon', 'بيوريجون', 'Follitropin Beta', 'فوليتروبين بيتا', '100', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', 450.00),
('Puregon', 'بيوريجون', 'Follitropin Beta', 'فوليتروبين بيتا', '300', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', 1200.00),
('Puregon', 'بيوريجون', 'Follitropin Beta', 'فوليتروبين بيتا', '600', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', 2300.00),
('Puregon', 'بيوريجون', 'Follitropin Beta', 'فوليتروبين بيتا', '900', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', 3400.00),

-- Fostimon (IBSA)
('Fostimon', 'فوستيمون', 'Urofollitropin', 'يوروفوليتروبين', '75', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', 200.00),
('Fostimon', 'فوستيمون', 'Urofollitropin', 'يوروفوليتروبين', '150', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', 380.00),

-- Bemfola (Gedeon Richter)
('Bemfola', 'بيمفولا', 'Follitropin Alfa', 'فوليتروبين ألفا', '75', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Gedeon Richter', 280.00),
('Bemfola', 'بيمفولا', 'Follitropin Alfa', 'فوليتروبين ألفا', '150', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Gedeon Richter', 520.00),

-- Ovaleap (Theramex)
('Ovaleap', 'أوفاليب', 'Follitropin Alfa', 'فوليتروبين ألفا', '300', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Theramex', 950.00),
('Ovaleap', 'أوفاليب', 'Follitropin Alfa', 'فوليتروبين ألفا', '450', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Theramex', 1400.00),

-- HMG Products (Human Menopausal Gonadotropin - FSH + LH)
('Menogon', 'مينوجون', 'Menotrophin (FSH+LH)', 'مينوتروبين', '75', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', 280.00),
('Menogon', 'مينوجون', 'Menotrophin (FSH+LH)', 'مينوتروبين', '150', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', 520.00),

('Menopur', 'مينوبور', 'Menotrophin (FSH+LH)', 'مينوتروبين', '75', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', 300.00),
('Menopur', 'مينوبور', 'Menotrophin (FSH+LH)', 'مينوتروبين', '600', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', 2200.00),
('Menopur', 'مينوبور', 'Menotrophin (FSH+LH)', 'مينوتروبين', '1200', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', 4200.00),

('Merional', 'ميريونال', 'Menotrophin (FSH+LH)', 'مينوتروبين', '75', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', 250.00),
('Merional', 'ميريونال', 'Menotrophin (FSH+LH)', 'مينوتروبين', '150', 'IU', 'Gonadotropins', 'IM/SC', 'حقن عضلي أو تحت الجلد', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', 480.00),

-- LH Products
('Luveris', 'لوفيريس', 'Lutropin Alfa', 'لوتروبين ألفا', '75', 'IU', 'Gonadotropins', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد، يستخدم مع أدوية FSH في حالات نقص LH', 'Merck Serono', 450.00),

-- =====================================================
-- 2. GnRH Agonists (أدوية كبت الغدة النخامية - منبهات)
-- =====================================================

('Decapeptyl', 'ديكابيبتيل', 'Triptorelin', 'تريبتوريلين', '0.1', 'mg', 'GnRH Agonist', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد يومياً، يبدأ من اليوم 21 من الدورة في البروتوكول الطويل', 'Ferring', 120.00),
('Decapeptyl', 'ديكابيبتيل', 'Triptorelin', 'تريبتوريلين', '3.75', 'mg', 'GnRH Agonist', 'IM', 'حقن عضلي', 'حقنة واحدة عضلي، تستمر لمدة شهر، تستخدم في البروتوكول الطويل', 'Ferring', 850.00),

('Zoladex', 'زولاديكس', 'Goserelin', 'جوسيريلين', '3.6', 'mg', 'GnRH Agonist', 'SC Implant', 'زرع تحت الجلد', 'كبسولة تزرع تحت الجلد في البطن، تستمر لمدة 28 يوم', 'AstraZeneca', 900.00),

('Lucrin', 'لوكرين', 'Leuprolide', 'ليوبروليد', '1', 'mg/0.2ml', 'GnRH Agonist', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد يومياً', 'AbbVie', 140.00),

('Suprefact', 'سوبريفاكت', 'Buserelin', 'بوسيريلين', '1', 'mg/ml', 'GnRH Agonist', 'SC/Nasal', 'حقن تحت الجلد أو بخاخ أنف', 'يحقن تحت الجلد أو يستخدم كبخاخ أنفي 3 مرات يومياً', 'Sanofi', 180.00),

('Suprefact Depot', 'سوبريفاكت ديبو', 'Buserelin', 'بوسيريلين', '6.3', 'mg', 'GnRH Agonist', 'SC', 'حقن تحت الجلد', 'حقنة واحدة تحت الجلد، تستمر لمدة شهرين', 'Sanofi', 1200.00),

-- =====================================================
-- 3. GnRH Antagonists (أدوية كبت الغدة النخامية - مضادات)
-- =====================================================

('Cetrotide', 'سيتروتايد', 'Cetrorelix', 'سيتروريليكس', '0.25', 'mg', 'GnRH Antagonist', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد يومياً، يبدأ عادة من اليوم 5-6 من التنشيط', 'Merck Serono', 280.00),
('Cetrotide', 'سيتروتايد', 'Cetrorelix', 'سيتروريليكس', '3', 'mg', 'GnRH Antagonist', 'SC', 'حقن تحت الجلد', 'حقنة واحدة تحت الجلد، تكفي لعدة أيام', 'Merck Serono', 650.00),

('Orgalutran', 'أورجالوتران', 'Ganirelix', 'جانيريليكس', '0.25', 'mg/0.5ml', 'GnRH Antagonist', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد يومياً، يبدأ عادة من اليوم 5-6 من التنشيط', 'Organon', 300.00),

('Fyremadel', 'فيريماديل', 'Ganirelix', 'جانيريليكس', '0.25', 'mg/0.5ml', 'GnRH Antagonist', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد يومياً، يبدأ عادة من اليوم 5-6 من التنشيط', 'Sun Pharma', 250.00),

-- =====================================================
-- 4. Trigger Shots (أدوية تحفيز التبويض النهائي)
-- =====================================================

-- HCG Products
('Pregnyl', 'بريجنيل', 'Human Chorionic Gonadotropin (HCG)', 'هرمون الحمل', '5000', 'IU', 'Trigger', 'IM', 'حقن عضلي', 'يحقن في العضل، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'Organon', 120.00),
('Pregnyl', 'بريجنيل', 'Human Chorionic Gonadotropin (HCG)', 'هرمون الحمل', '10000', 'IU', 'Trigger', 'IM', 'حقن عضلي', 'يحقن في العضل، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'Organon', 200.00),

('Choriomon', 'كوريومون', 'Human Chorionic Gonadotropin (HCG)', 'هرمون الحمل', '5000', 'IU', 'Trigger', 'IM', 'حقن عضلي', 'يحقن في العضل، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'IBSA', 110.00),

('Epifasi', 'ابيفاسي', 'Human Chorionic Gonadotropin (HCG)', 'هرمون الحمل', '5000', 'IU', 'Trigger', 'IM', 'حقن عضلي', 'يحقن في العضل، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'Amsa', 95.00),
('Epifasi', 'ابيفاسي', 'Human Chorionic Gonadotropin (HCG)', 'هرمون الحمل', '10000', 'IU', 'Trigger', 'IM', 'حقن عضلي', 'يحقن في العضل، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'Amsa', 150.00),

-- Recombinant HCG
('Ovitrelle', 'أوفيتريل', 'Choriogonadotropin Alfa (r-HCG)', 'هرمون الحمل المؤتلف', '250', 'mcg (6500 IU)', 'Trigger', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'Merck Serono', 280.00),

('Ovidrel', 'أوفيدريل', 'Choriogonadotropin Alfa (r-HCG)', 'هرمون الحمل المؤتلف', '250', 'mcg (6500 IU)', 'Trigger', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد، يعطى قبل سحب البويضات بـ 34-36 ساعة', 'Merck', 290.00),

-- GnRH Agonist Trigger (alternative to HCG)
('Decapeptyl (Trigger)', 'ديكابيبتيل (تحفيز)', 'Triptorelin', 'تريبتوريلين', '0.2', 'mg', 'Trigger', 'SC', 'حقن تحت الجلد', 'يستخدم كبديل لـ HCG في حالات خطر فرط التنشيط، يعطى قبل السحب بـ 34-36 ساعة', 'Ferring', 120.00),

-- =====================================================
-- 5. Luteal Phase Support (أدوية دعم الجسم الأصفر)
-- =====================================================

-- Progesterone - Vaginal
('Cyclogest', 'سيكلوجيست', 'Progesterone', 'بروجستيرون', '200', 'mg', 'Support', 'Vaginal', 'مهبلي', 'تستخدم لبوسة واحدة أو اثنتين مهبلياً مرتين يومياً', 'Actavis', 45.00),
('Cyclogest', 'سيكلوجيست', 'Progesterone', 'بروجستيرون', '400', 'mg', 'Support', 'Vaginal', 'مهبلي', 'تستخدم لبوسة واحدة مهبلياً مرة أو مرتين يومياً', 'Actavis', 65.00),

('Utrogestan', 'يوتروجستان', 'Progesterone', 'بروجستيرون', '100', 'mg', 'Support', 'Oral/Vaginal', 'بالفم أو مهبلي', 'كبسولات تؤخذ بالفم أو مهبلياً 2-3 مرات يومياً', 'Besins', 55.00),
('Utrogestan', 'يوتروجستان', 'Progesterone', 'بروجستيرون', '200', 'mg', 'Support', 'Oral/Vaginal', 'بالفم أو مهبلي', 'كبسولات تؤخذ بالفم أو مهبلياً 2-3 مرات يومياً', 'Besins', 85.00),

('Crinone', 'كرينون', 'Progesterone', 'بروجستيرون', '8%', 'gel', 'Support', 'Vaginal', 'جل مهبلي', 'يستخدم أبليكيتور واحد مهبلياً مرة أو مرتين يومياً', 'Merck', 180.00),

('Prontogest', 'برونتوجست', 'Progesterone', 'بروجستيرون', '400', 'mg', 'Support', 'Vaginal', 'مهبلي', 'تستخدم لبوسة واحدة مهبلياً مرة أو مرتين يومياً', 'IBSA', 70.00),

-- Progesterone - Injection
('Gestone', 'جيستون', 'Progesterone', 'بروجستيرون', '50', 'mg/ml', 'Support', 'IM', 'حقن عضلي', 'يحقن في العضل يومياً أو يوم بعد يوم', 'Nordic Pharma', 25.00),

('Proluton Depot', 'برولوتون ديبو', 'Hydroxyprogesterone Caproate', 'هيدروكسي بروجستيرون', '250', 'mg/ml', 'Support', 'IM', 'حقن عضلي', 'يحقن في العضل مرة أسبوعياً', 'Bayer', 45.00),

-- Estrogen Support
('Progynova', 'بروجينوفا', 'Estradiol Valerate', 'استراديول فاليرات', '2', 'mg', 'Support', 'Oral', 'بالفم', 'قرص أو اثنين مرتين يومياً', 'Bayer', 35.00),

('Estrofem', 'استروفيم', 'Estradiol', 'استراديول', '2', 'mg', 'Support', 'Oral', 'بالفم', 'قرص واحد أو اثنين يومياً', 'Novo Nordisk', 40.00),

('Climara', 'كليمارا', 'Estradiol', 'استراديول', '100', 'mcg', 'Support', 'Transdermal Patch', 'لصقة جلدية', 'لصقة واحدة تغير كل 3-4 أيام', 'Bayer', 120.00),

-- Combined Support
('Femoston', 'فيموستون', 'Estradiol + Dydrogesterone', 'استراديول + ديدروجستيرون', '2/10', 'mg', 'Support', 'Oral', 'بالفم', 'قرص واحد يومياً', 'Abbott', 55.00),

-- =====================================================
-- 6. Adjuvant Medications (أدوية مساعدة)
-- =====================================================

-- Clomiphene Citrate
('Clomid', 'كلوميد', 'Clomiphene Citrate', 'كلوميفين سترات', '50', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد أو اثنين يومياً لمدة 5 أيام من اليوم 2-5 من الدورة', 'Sanofi', 15.00),

('Serophene', 'سيروفين', 'Clomiphene Citrate', 'كلوميفين سترات', '50', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد أو اثنين يومياً لمدة 5 أيام من اليوم 2-5 من الدورة', 'Merck Serono', 18.00),

-- Letrozole (off-label use)
('Femara', 'فيمارا', 'Letrozole', 'ليتروزول', '2.5', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد أو اثنين يومياً لمدة 5 أيام من اليوم 2-5 من الدورة', 'Novartis', 180.00),

-- Metformin (for PCOS)
('Glucophage', 'جلوكوفاج', 'Metformin', 'ميتفورمين', '500', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص أو اثنين 2-3 مرات يومياً مع الطعام', 'Merck', 12.00),
('Glucophage', 'جلوكوفاج', 'Metformin', 'ميتفورمين', '850', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد أو اثنين 2-3 مرات يومياً مع الطعام', 'Merck', 18.00),
('Glucophage', 'جلوكوفاج', 'Metformin', 'ميتفورمين', '1000', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد أو اثنين مرتين يومياً مع الطعام', 'Merck', 22.00),

-- DHEA
('DHEA', 'دي اتش اي ايه', 'Dehydroepiandrosterone', 'ديهيدرو ايبي اندروستيرون', '25', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'كبسولة واحدة أو اثنتين يومياً', 'Various', 120.00),
('DHEA', 'دي اتش اي ايه', 'Dehydroepiandrosterone', 'ديهيدرو ايبي اندروستيرون', '50', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'كبسولة واحدة أو اثنتين يومياً', 'Various', 200.00),

-- Aspirin (low dose)
('Aspirin', 'أسبرين', 'Acetylsalicylic Acid', 'حمض أسيتيل ساليسيليك', '75', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد يومياً', 'Various', 5.00),
('Aspirin', 'أسبرين', 'Acetylsalicylic Acid', 'حمض أسيتيل ساليسيليك', '100', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد يومياً', 'Various', 6.00),

-- Folic Acid
('Folic Acid', 'حمض الفوليك', 'Folic Acid', 'حمض الفوليك', '5', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد يومياً', 'Various', 8.00),

-- Prenatal Vitamins
('Pregnacare', 'بريجناكير', 'Multivitamins', 'فيتامينات متعددة', 'N/A', 'Tablet', 'Adjuvant', 'Oral', 'بالفم', 'كبسولة واحدة يومياً', 'Vitabiotics', 120.00),

('Elevit', 'ايليفيت', 'Multivitamins', 'فيتامينات متعددة', 'N/A', 'Tablet', 'Adjuvant', 'Oral', 'بالفم', 'قرص واحد يومياً', 'Bayer', 180.00),

-- CoQ10
('CoQ10', 'كو كيو 10', 'Coenzyme Q10', 'إنزيم كيو 10', '100', 'mg', 'Adjuvant', 'Oral', 'بالفم', 'كبسولة واحدة 2-3 مرات يومياً', 'Various', 200.00),

-- Vitamin D
('Vitamin D3', 'فيتامين د3', 'Cholecalciferol', 'كوليكالسيفيرول', '1000', 'IU', 'Adjuvant', 'Oral', 'بالفم', 'كبسولة واحدة يومياً', 'Various', 45.00),
('Vitamin D3', 'فيتامين د3', 'Cholecalciferol', 'كوليكالسيفيرول', '50000', 'IU', 'Adjuvant', 'Oral', 'بالفم', 'كبسولة واحدة أسبوعياً', 'Various', 25.00),

-- Growth Hormone (advanced cases)
('Omnitrope', 'أومنيتروب', 'Somatropin', 'سوماتروبين', '5', 'mg', 'Adjuvant', 'SC', 'حقن تحت الجلد', 'يحقن تحت الجلد يومياً، يستخدم في حالات ضعف الاستجابة', 'Sandoz', 1800.00);

-- =====================================================
-- Create indexes for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ivf_meds_category ON ivf_medications_reference(medication_category);
CREATE INDEX IF NOT EXISTS idx_ivf_meds_trade_name ON ivf_medications_reference(trade_name_en);
CREATE INDEX IF NOT EXISTS idx_ivf_meds_active ON ivf_medications_reference(active_ingredient_en);
CREATE INDEX IF NOT EXISTS idx_ivf_meds_available ON ivf_medications_reference(available_in_egypt);

-- =====================================================
-- View للأدوية الأكثر استخداماً
-- =====================================================

CREATE OR REPLACE VIEW ivf_commonly_used_medications AS
SELECT 
  trade_name_en,
  trade_name_ar,
  active_ingredient_en,
  active_ingredient_ar,
  concentration,
  unit,
  medication_category,
  route_ar,
  usage_instructions_ar,
  approximate_price_egp
FROM ivf_medications_reference
WHERE available_in_egypt = true
ORDER BY 
  CASE medication_category
    WHEN 'Gonadotropins' THEN 1
    WHEN 'GnRH Antagonist' THEN 2
    WHEN 'GnRH Agonist' THEN 3
    WHEN 'Trigger' THEN 4
    WHEN 'Support' THEN 5
    WHEN 'Adjuvant' THEN 6
  END,
  trade_name_en,
  concentration;

-- =====================================================
-- دالة للبحث عن الأدوية
-- =====================================================

CREATE OR REPLACE FUNCTION search_ivf_medications(
  search_term TEXT,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  trade_name_en TEXT,
  trade_name_ar TEXT,
  active_ingredient_en TEXT,
  concentration TEXT,
  unit TEXT,
  category TEXT,
  route_ar TEXT,
  usage_ar TEXT,
  price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.trade_name_en,
    m.trade_name_ar,
    m.active_ingredient_en,
    m.concentration,
    m.unit,
    m.medication_category,
    m.route_ar,
    m.usage_instructions_ar,
    m.approximate_price_egp
  FROM ivf_medications_reference m
  WHERE 
    (search_term IS NULL OR 
     m.trade_name_en ILIKE '%' || search_term || '%' OR
     m.trade_name_ar ILIKE '%' || search_term || '%' OR
     m.active_ingredient_en ILIKE '%' || search_term || '%' OR
     m.active_ingredient_ar ILIKE '%' || search_term || '%')
    AND (category_filter IS NULL OR m.medication_category = category_filter)
    AND m.available_in_egypt = true
  ORDER BY m.trade_name_en;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- تعليمات الاستخدام
-- =====================================================

COMMENT ON TABLE ivf_medications_reference IS 'قاعدة بيانات شاملة لجميع أدوية الحقن المجهري المتوفرة في السوق المصري';

COMMENT ON COLUMN ivf_medications_reference.trade_name_en IS 'الاسم التجاري للدواء بالإنجليزية';
COMMENT ON COLUMN ivf_medications_reference.active_ingredient_en IS 'المادة الفعالة بالإنجليزية';
COMMENT ON COLUMN ivf_medications_reference.concentration IS 'تركيز الدواء';
COMMENT ON COLUMN ivf_medications_reference.medication_category IS 'Gonadotropins, GnRH Agonist, GnRH Antagonist, Trigger, Support, Adjuvant';
COMMENT ON COLUMN ivf_medications_reference.route_ar IS 'طريقة الإعطاء بالعربية للروشتة';
COMMENT ON COLUMN ivf_medications_reference.usage_instructions_ar IS 'تعليمات الاستخدام بالعربية للمريضة';

-- =====================================================
-- أمثلة على الاستخدام:
-- =====================================================

-- البحث عن جميع أدوية Gonal-F:
-- SELECT * FROM search_ivf_medications('Gonal-F', NULL);

-- البحث عن جميع أدوية التنشيط:
-- SELECT * FROM search_ivf_medications(NULL, 'Gonadotropins');

-- عرض جميع الأدوية الشائعة:
-- SELECT * FROM ivf_commonly_used_medications;

-- البحث عن أدوية معينة بالعربي:
-- SELECT * FROM ivf_medications_reference WHERE trade_name_ar ILIKE '%جونال%';
