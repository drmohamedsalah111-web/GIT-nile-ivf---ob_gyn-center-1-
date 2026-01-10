-- ============================================================================
-- POPULATE EGYPTIAN IVF MEDICATIONS
-- تهيئة قائمة أدوية الحقن المجهري في السوق المصري
-- ============================================================================

-- تنظيف البيانات القديمة (اختياري - يفضل التحديث)
-- TRUNCATE medications_reference CASCADE;

INSERT INTO medications_reference (
    medication_name,
    medication_name_ar,
    medication_type,
    available_doses,
    unit,
    route,
    typical_starting_dose,
    timing_instructions,
    manufacturer,
    is_active
) VALUES
-- 1. Gonadotropins (أدوية التنشيط)
-- Gonal-F
('Gonal-F 75 IU', 'جونال-إف ٧٥', 'gonadotropin_fsh', '{"75"}', 'IU', '{"SC"}', '75', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', true),
('Gonal-F 150 IU', 'جونال-إف ١٥٠', 'gonadotropin_fsh', '{"150"}', 'IU', '{"SC"}', '150', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', true),
('Gonal-F 300 IU (Pen)', 'جونال-إف ٣٠٠ (قلم)', 'gonadotropin_fsh', '{"300"}', 'IU', '{"SC"}', '300', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', true),
('Gonal-F 450 IU (Pen)', 'جونال-إف ٤٥٠ (قلم)', 'gonadotropin_fsh', '{"450"}', 'IU', '{"SC"}', '450', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', true),
('Gonal-F 900 IU (Pen)', 'جونال-إف ٩٠٠ (قلم)', 'gonadotropin_fsh', '{"900"}', 'IU', '{"SC"}', '900', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Merck Serono', true),

-- Puregon
('Puregon 50 IU', 'بيوريجون ٥٠', 'gonadotropin_fsh', '{"50"}', 'IU', '{"SC"}', '50', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', true),
('Puregon 100 IU', 'بيوريجون ١٠٠', 'gonadotropin_fsh', '{"100"}', 'IU', '{"SC"}', '100', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', true),
('Puregon 300 IU (Pen)', 'بيوريجون ٣٠٠ (قلم)', 'gonadotropin_fsh', '{"300"}', 'IU', '{"SC"}', '300', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', true),
('Puregon 600 IU (Pen)', 'بيوريجون ٦٠٠ (قلم)', 'gonadotropin_fsh', '{"600"}', 'IU', '{"SC"}', '600', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', true),
('Puregon 900 IU (Pen)', 'بيوريجون ٩٠٠ (قلم)', 'gonadotropin_fsh', '{"900"}', 'IU', '{"SC"}', '900', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Organon', true),

-- Fostimon
('Fostimon 75 IU', 'فوستيمون ٧٥', 'gonadotropin_fsh', '{"75"}', 'IU', '{"SC", "IM"}', '75', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', true),
('Fostimon 150 IU', 'فوستيمون ١٥٠', 'gonadotropin_fsh', '{"150"}', 'IU', '{"SC", "IM"}', '150', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', true),

-- Bemfola
('Bemfola 75 IU', 'بيمفولا ٧٥', 'gonadotropin_fsh', '{"75"}', 'IU', '{"SC"}', '75', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Gedeon Richter', true),
('Bemfola 150 IU', 'بيمفولا ١٥٠', 'gonadotropin_fsh', '{"150"}', 'IU', '{"SC"}', '150', 'يحقن تحت الجلد في البطن أو الفخذ، يفضل في نفس الوقت يومياً', 'Gedeon Richter', true),

-- Menogon
('Menogon 75 IU', 'مينوجون ٧٥', 'gonadotropin_hmg', '{"75"}', 'IU', '{"SC", "IM"}', '75', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', true),
('Menogon 150 IU', 'مينوجون ١٥٠', 'gonadotropin_hmg', '{"150"}', 'IU', '{"SC", "IM"}', '150', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', true),

-- Menopur
('Menopur 75 IU', 'مينوبور ٧٥', 'gonadotropin_hmg', '{"75"}', 'IU', '{"SC", "IM"}', '75', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', true),
('Menopur 600 IU', 'مينوبور ٦٠٠', 'gonadotropin_hmg', '{"600"}', 'IU', '{"SC", "IM"}', '600', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', true),
('Menopur 1200 IU', 'مينوبور ١٢٠٠', 'gonadotropin_hmg', '{"1200"}', 'IU', '{"SC", "IM"}', '1200', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'Ferring', true),

-- Merional
('Merional 75 IU', 'ميريونال ٧٥', 'gonadotropin_hmg', '{"75"}', 'IU', '{"SC", "IM"}', '75', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', true),
('Merional 150 IU', 'ميريونال ١٥٠', 'gonadotropin_hmg', '{"150"}', 'IU', '{"SC", "IM"}', '150', 'يحقن في العضل أو تحت الجلد، يحضر بإضافة السائل المرفق للبودرة', 'IBSA', true),

-- Luveris
('Luveris 75 IU', 'لوفيريس ٧٥', 'gonadotropin_lh', '{"75"}', 'IU', '{"SC"}', '75', 'يحقن تحت الجلد، يستخدم مع أدوية FSH في حالات نقص LH', 'Merck Serono', true),

-- 2. GnRH Agonists
('Decapeptyl 0.1 mg', 'ديكابيبتيل ٠.١', 'gnrh_agonist', '{"0.1"}', 'mg', '{"SC"}', '0.1', 'يحقن تحت الجلد يومياً، يبدأ من اليوم 21 من الدورة في البروتوكول الطويل', 'Ferring', true),
('Decapeptyl 3.75 mg', 'ديكابيبتيل ٣.٧٥', 'gnrh_agonist', '{"3.75"}', 'mg', '{"IM"}', '3.75', 'حقنة واحدة عضلي، تستمر لمدة شهر، تستخدم في البروتوكول الطويل', 'Ferring', true),
('Zoladex 3.6 mg', 'زولاديكس ٣.٦', 'gnrh_agonist', '{"3.6"}', 'mg', '{"SC"}', '3.6', 'كبسولة تزرع تحت الجلد في البطن، تستمر لمدة 28 يوم', 'AstraZeneca', true),
('Lucrin 1 mg/0.2ml', 'لوكرين ١ ملجم', 'gnrh_agonist', '{"1"}', 'mg', '{"SC"}', '1', 'يحقن تحت الجلد يومياً', 'AbbVie', true),
('Suprefact 1 mg/ml', 'سوبريفاكت ١ ملجم', 'gnrh_agonist', '{"1"}', 'mg', '{"SC"}', '1', 'يحقن تحت الجلد أو يستخدم كبخاخ أنفي 3 مرات يومياً', 'Sanofi', true),

-- 3. GnRH Antagonists
('Cetrotide 0.25 mg', 'سيتروتايد ٠.٢٥', 'gnrh_antagonist', '{"0.25"}', 'mg', '{"SC"}', '0.25', 'يحقن تحت الجلد يومياً، يبدأ عادة من اليوم ٥-٦ من التنشيط', 'Merck Serono', true),
('Orgalutran 0.25 mg', 'أورجالوتران ٠.٢٥', 'gnrh_antagonist', '{"0.25"}', 'mg', '{"SC"}', '0.25', 'يحقن تحت الجلد يومياً، يبدأ عادة من اليوم ٥-٦ من التنشيط', 'Organon', true),
('Fyremadel 0.25 mg', 'فيريماديل ٠.٢٥', 'gnrh_antagonist', '{"0.25"}', 'mg', '{"SC"}', '0.25', 'يحقن تحت الجلد يومياً، يبدأ عادة من اليوم ٥-٦ من التنشيط', 'Sun Pharma', true),

-- 4. Trigger
('Pregnyl 5000 IU', 'بريجنيل ٥٠٠٠', 'trigger_hcg', '{"5000"}', 'IU', '{"IM"}', '5000', 'يحقن في العضل، يعطى قبل سحب البويضات بـ ٣٤-٣٦ ساعة', 'Organon', true),
('Pregnyl 10000 IU', 'بريجنيل ١٠٠٠٠', 'trigger_hcg', '{"10000"}', 'IU', '{"IM"}', '10000', 'يحقن في العضل، يعطى قبل سحب البويضات بـ ٣٤-٣٦ ساعة', 'Organon', true),
('Choriomon 5000 IU', 'كوريومون ٥٠٠٠', 'trigger_hcg', '{"5000"}', 'IU', '{"IM"}', '5000', 'يحقن في العضل، يعطى قبل سحب البويضات بـ ٣٤-٣٦ ساعة', 'IBSA', true),
('Ovitrelle 250 mcg', 'أوفيتريل ٢٥٠', 'trigger_hcg', '{"250"}', 'mcg', '{"SC"}', '250', 'يحقن تحت الجلد، يعطى قبل سحب البويضات بـ ٣٤-٣٦ ساعة', 'Merck Serono', true),
('Decapeptyl 0.2 mg (Trigger)', 'ديكابيبتيل ٠.٢ (تحفيز)', 'trigger_gnrh', '{"0.2"}', 'mg', '{"SC"}', '0.2', 'يستخدم كبديل لـ HCG في حالات خطر فرط التنشيط، يعطى قبل السحب بـ ٣٤-٣٦ ساعة', 'Ferring', true),

-- 5. Support
('Cyclogest 200 mg', 'سيكلوجيست ٢٠٠', 'progesterone', '{"200"}', 'mg', '{"PV", "PR"}', '200', 'تستخدم لبوسة واحدة أو اثنتين مهبلياً أو شرجياً حسب تعليمات الطبيب', 'Actavis', true),
('Cyclogest 400 mg', 'سيكلوجيست ٤٠٠', 'progesterone', '{"400"}', 'mg', '{"PV", "PR"}', '400', 'تستخدم لبوسة واحدة مهبلياً أو شرجياً مرة أو مرتين يومياً', 'Actavis', true),
('Utrogestan 100 mg', 'يوتروجستان ١٠٠', 'progesterone', '{"100"}', 'mg', '{"PO", "PV"}', '100', 'كبسولات تؤخذ بالفم أو مهبلياً ٢-٣ مرات يومياً', 'Besins', true),
('Utrogestan 200 mg', 'يوتروجستان ٢٠٠', 'progesterone', '{"200"}', 'mg', '{"PO", "PV"}', '200', 'كبسولات تؤخذ بالفم أو مهبلياً ٢-٣ مرات يومياً', 'Besins', true),
('Prontogest 400 mg', 'برونتوجست ٤٠٠', 'progesterone', '{"400"}', 'mg', '{"PV"}', '400', 'تستخدم لبوسة واحدة مهبلياً مرة أو مرتين يومياً', 'IBSA', true),
('Gestone 50 mg/ml', 'جيستون ٥٠ ملجم', 'progesterone', '{"50"}', 'mg', '{"IM"}', '50', 'يحقن في العضل يومياً أو يوم بعد يوم', 'Nordic Pharma', true),
('Progynova 2 mg', 'بروجينوفا ٢ ملجم', 'estrogen', '{"2"}', 'mg', '{"PO"}', '2', 'قرص أو اثنين مرتين يومياً حسب تعليمات الطبيب', 'Bayer', true),
('Estrofem 2 mg', 'استروفيم ٢ ملجم', 'estrogen', '{"2"}', 'mg', '{"PO"}', '2', 'قرص واحد أو اثنين يومياً حسب تعليمات الطبيب', 'Novo Nordisk', true),

-- 6. Adjuvants
('Clomid 50 mg', 'كلوميد ٥٠', 'other', '{"50"}', 'mg', '{"PO"}', '50', 'قرص واحد أو اثنين يومياً لمدة ٥ أيام من اليوم ٢-٥ من الدورة', 'Sanofi', true),
('Femara 2.5 mg', 'فيمارا ٢.٥', 'other', '{"2.5"}', 'mg', '{"PO"}', '2.5', 'قرص واحد أو اثنين يومياً لمدة ٥ أيام من اليوم ٢-٥ من الدورة', 'Novartis', true),
('Glucophage 500 mg', 'جلوكوفاج ٥٠٠', 'other', '{"500"}', 'mg', '{"PO"}', '500', 'قرص أو اثنين ٢-٣ مرات يومياً مع الطعام', 'Merck', true),
('Glucophage 1000 mg', 'جلوكوفاج ١٠٠٠', 'other', '{"1000"}', 'mg', '{"PO"}', '1000', 'قرص واحد أو اثنين مرتين يومياً مع الطعام', 'Merck', true),
('Aspirin 75 mg', 'أسبرين ٧٥', 'other', '{"75"}', 'mg', '{"PO"}', '75', 'قرص واحد يومياً', 'Various', true),
('Folic Acid 5 mg', 'حمض الفوليك ٥ ملجم', 'other', '{"5"}', 'mg', '{"PO"}', '5', 'قرص واحد يومياً', 'Various', true)
ON CONFLICT (medication_name) DO UPDATE SET
    medication_name_ar = EXCLUDED.medication_name_ar,
    medication_type = EXCLUDED.medication_type,
    available_doses = EXCLUDED.available_doses,
    unit = EXCLUDED.unit,
    route = EXCLUDED.route,
    typical_starting_dose = EXCLUDED.typical_starting_dose,
    timing_instructions = EXCLUDED.timing_instructions,
    manufacturer = EXCLUDED.manufacturer,
    is_active = EXCLUDED.is_active;
