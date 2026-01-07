-- إضافة عمود المادة الفعالة إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications_reference' AND column_name = 'active_ingredient') THEN
    ALTER TABLE medications_reference ADD COLUMN active_ingredient TEXT;
  END IF;
END $$;

-- تحديث خطة العلاج (medications_plan) لكل بروتوكول بخطة منظمة (اسم تجاري، مادة فعالة، جرعة، طريقة إعطاء)

-- Antagonist Protocol - Standard
UPDATE stimulation_protocols_library
SET medications_plan = '{
  "protocol_name": "Antagonist Protocol - Standard",
  "medications": [
    {"medication_name": "Gonal-F", "active_ingredient": "follitropin alfa", "dose": "150", "unit": "IU", "start_day": 2, "duration": 10, "route": "SC"},
    {"medication_name": "Cetrotide", "active_ingredient": "cetrorelix", "dose": "0.25", "unit": "mg", "start_day": 6, "duration": 5, "route": "SC"},
    {"medication_name": "Ovitrelle", "active_ingredient": "choriogonadotropin alfa", "dose": "250", "unit": "mcg", "start_day": 12, "duration": 1, "route": "SC"}
  ]
}'
WHERE protocol_name ILIKE '%Antagonist%';

-- Long Agonist Protocol
UPDATE stimulation_protocols_library
SET medications_plan = '{
  "protocol_name": "Long Agonist Protocol",
  "medications": [
    {"medication_name": "Decapeptyl", "active_ingredient": "triptorelin", "dose": "0.1", "unit": "mg", "start_day": 21, "duration": 14, "route": "SC"},
    {"medication_name": "Gonal-F", "active_ingredient": "follitropin alfa", "dose": "225", "unit": "IU", "start_day": 2, "duration": 10, "route": "SC"},
    {"medication_name": "Ovitrelle", "active_ingredient": "choriogonadotropin alfa", "dose": "250", "unit": "mcg", "start_day": 12, "duration": 1, "route": "SC"}
  ]
}'
WHERE protocol_name ILIKE '%Long Agonist%';

-- Short Agonist Protocol
UPDATE stimulation_protocols_library
SET medications_plan = '{
  "protocol_name": "Short Agonist Protocol",
  "medications": [
    {"medication_name": "Suprefact", "active_ingredient": "buserelin", "dose": "0.1", "unit": "mg", "start_day": 2, "duration": 14, "route": "SC"},
    {"medication_name": "Menopur", "active_ingredient": "menotrophin", "dose": "225", "unit": "IU", "start_day": 2, "duration": 10, "route": "SC"},
    {"medication_name": "Ovitrelle", "active_ingredient": "choriogonadotropin alfa", "dose": "250", "unit": "mcg", "start_day": 12, "duration": 1, "route": "SC"}
  ]
}'
WHERE protocol_name ILIKE '%Short Agonist%';

-- Flare-up Protocol
UPDATE stimulation_protocols_library
SET medications_plan = '{
  "protocol_name": "Flare-up Protocol",
  "medications": [
    {"medication_name": "Suprefact", "active_ingredient": "buserelin", "dose": "0.05", "unit": "mg", "start_day": 2, "duration": 14, "route": "SC"},
    {"medication_name": "Menopur", "active_ingredient": "menotrophin", "dose": "300", "unit": "IU", "start_day": 2, "duration": 10, "route": "SC"},
    {"medication_name": "Ovitrelle", "active_ingredient": "choriogonadotropin alfa", "dose": "250", "unit": "mcg", "start_day": 12, "duration": 1, "route": "SC"}
  ]
}'
WHERE protocol_name ILIKE '%Flare%';

-- Mini IVF Protocol
UPDATE stimulation_protocols_library
SET medications_plan = '{
  "protocol_name": "Mini IVF Protocol",
  "medications": [
    {"medication_name": "Clomiphene", "active_ingredient": "clomiphene citrate", "dose": "50", "unit": "mg", "start_day": 2, "duration": 5, "route": "PO"},
    {"medication_name": "Menopur", "active_ingredient": "menotrophin", "dose": "75", "unit": "IU", "start_day": 5, "duration": 7, "route": "SC"},
    {"medication_name": "Ovitrelle", "active_ingredient": "choriogonadotropin alfa", "dose": "250", "unit": "mcg", "start_day": 12, "duration": 1, "route": "SC"}
  ]
}'
WHERE protocol_name ILIKE '%Mini%';

-- PCOS Modified Antagonist
UPDATE stimulation_protocols_library
SET medications_plan = '{
  "protocol_name": "PCOS Modified Antagonist",
  "medications": [
    {"medication_name": "Gonal-F", "active_ingredient": "follitropin alfa", "dose": "112.5", "unit": "IU", "start_day": 2, "duration": 10, "route": "SC"},
    {"medication_name": "Cetrotide", "active_ingredient": "cetrorelix", "dose": "0.25", "unit": "mg", "start_day": 6, "duration": 5, "route": "SC"},
    {"medication_name": "Ovitrelle", "active_ingredient": "choriogonadotropin alfa", "dose": "250", "unit": "mcg", "start_day": 12, "duration": 1, "route": "SC"}
  ]
}'
WHERE protocol_name ILIKE '%PCOS%';
