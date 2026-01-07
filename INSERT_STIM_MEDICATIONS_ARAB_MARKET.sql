-- أشهر أدوية التنشيط المتوفرة في الأسواق العربية (اسم تجاري إنجليزي فقط)
-- يمكنك تعديل الجرعات/الأسعار لاحقاً حسب الحاجة

INSERT INTO medications_reference (
  medication_name, medication_name_ar, medication_type, available_doses, unit, route, is_active
) VALUES
-- FSH Recombinant
('Gonal-F', '', 'gonadotropin_fsh', '{75 IU, 150 IU, 225 IU, 300 IU}', 'IU', '{SC}', true),
('Puregon', '', 'gonadotropin_fsh', '{50 IU, 100 IU, 200 IU, 300 IU}', 'IU', '{SC}', true),
('Ovaleap', '', 'gonadotropin_fsh', '{75 IU, 150 IU, 225 IU}', 'IU', '{SC}', true),
('Bemfola', '', 'gonadotropin_fsh', '{75 IU, 150 IU, 225 IU}', 'IU', '{SC}', true),
('Fostimon', '', 'gonadotropin_fsh', '{75 IU, 150 IU}', 'IU', '{SC}', true),
('Recagon', '', 'gonadotropin_fsh', '{50 IU, 100 IU, 200 IU}', 'IU', '{SC}', true),
-- HMG
('Menopur', '', 'gonadotropin_hmg', '{75 IU, 150 IU, 225 IU}', 'IU', '{SC,IM}', true),
('Merional', '', 'gonadotropin_hmg', '{75 IU, 150 IU}', 'IU', '{SC,IM}', true),
('Pergoveris', '', 'gonadotropin_hmg', '{75/150 IU}', 'IU', '{SC}', true),
-- LH
('Luveris', '', 'gonadotropin_lh', '{75 IU}', 'IU', '{SC}', true),
-- Long Agonist
('Decapeptyl', '', 'gnrh_agonist', '{0.1 mg, 3.75 mg}', 'mg', '{SC,IM}', true),
('Suprefact', '', 'gnrh_agonist', '{0.1 mg}', 'mg', '{SC}', true),
-- Antagonist
('Cetrotide', '', 'gnrh_antagonist', '{0.25 mg}', 'mg', '{SC}', true),
('Orgalutran', '', 'gnrh_antagonist', '{0.25 mg}', 'mg', '{SC}', true),
-- Trigger
('Ovitrelle', '', 'trigger_hcg', '{250 mcg}', 'mcg', '{SC}', true),
('Choragon', '', 'trigger_hcg', '{5000 IU}', 'IU', '{IM}', true),
('Pregnyl', '', 'trigger_hcg', '{5000 IU, 10000 IU}', 'IU', '{IM}', true),
-- Estrogen
('Estrofem', '', 'estrogen', '{2 mg}', 'mg', '{PO}', true),
('Progynova', '', 'estrogen', '{2 mg}', 'mg', '{PO}', true),
('Cyclogest', '', 'progesterone', '{200 mg, 400 mg}', 'mg', '{PV,PR}', true),
('Utrogestan', '', 'progesterone', '{100 mg, 200 mg}', 'mg', '{PO,PV}', true),
('Crinone', '', 'progesterone', '{8%}', '%', '{PV}', true)
ON CONFLICT (medication_name) DO NOTHING;
-- يمكنك إضافة المزيد حسب السوق المحلي