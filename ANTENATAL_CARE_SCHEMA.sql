-- =====================================================
-- ANTENATAL CARE CARD - DATABASE SCHEMA UPDATE
-- Add Risk Assessment & Obstetric History fields
-- =====================================================

-- Add new columns to pregnancies table for comprehensive risk assessment
ALTER TABLE pregnancies 
ADD COLUMN IF NOT EXISTS obstetric_history JSONB DEFAULT '{"gravida": 0, "parity_fullterm": 0, "parity_preterm": 0, "abortions": 0, "living": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '{"hypertension": false, "diabetes": false, "thyroid": false, "cardiac": false, "dvt_vte": false, "other": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS past_obs_history JSONB DEFAULT '{"preeclampsia": false, "pph": false, "previous_cs": false, "recurrent_abortion": false, "other": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS current_risk_factors JSONB DEFAULT '{"smoking": false, "bmi_over_30": false, "rh_negative": false, "twin_pregnancy": false, "advanced_maternal_age": false, "other": ""}'::jsonb;

-- Add presentation column to antenatal_visits (for tracking fetal position after 28 weeks)
ALTER TABLE antenatal_visits
ADD COLUMN IF NOT EXISTS presentation TEXT CHECK (presentation IN ('Cephalic', 'Breech', 'Transverse', 'Oblique', NULL));

-- Add comment for documentation
COMMENT ON COLUMN pregnancies.obstetric_history IS 'GPA code data: Gravida, Parity (fullterm/preterm), Abortions, Living children';
COMMENT ON COLUMN pregnancies.medical_history IS 'Medical conditions: HTN, DM, Thyroid, Cardiac, DVT/VTE';
COMMENT ON COLUMN pregnancies.past_obs_history IS 'Past obstetric complications: Pre-eclampsia, PPH, Previous C/S, Recurrent abortion';
COMMENT ON COLUMN pregnancies.current_risk_factors IS 'Current pregnancy risk factors: Smoking, Obesity, Rh-, Twins, Advanced age';
COMMENT ON COLUMN antenatal_visits.presentation IS 'Fetal presentation (relevant from 28 weeks onwards)';

-- Create index for faster querying of high-risk pregnancies
CREATE INDEX IF NOT EXISTS idx_pregnancies_risk_level ON pregnancies(risk_level);

-- Update RLS policies to ensure access to new columns (if not already covered)
-- No changes needed as existing policies cover all columns

-- Function to auto-calculate risk level based on history
CREATE OR REPLACE FUNCTION calculate_pregnancy_risk_level(pregnancy_record pregnancies)
RETURNS TEXT AS $$
DECLARE
  risk_score INTEGER := 0;
BEGIN
  -- Check medical history
  IF (pregnancy_record.medical_history->>'hypertension')::boolean THEN risk_score := risk_score + 3; END IF;
  IF (pregnancy_record.medical_history->>'diabetes')::boolean THEN risk_score := risk_score + 3; END IF;
  IF (pregnancy_record.medical_history->>'cardiac')::boolean THEN risk_score := risk_score + 4; END IF;
  IF (pregnancy_record.medical_history->>'dvt_vte')::boolean THEN risk_score := risk_score + 3; END IF;
  
  -- Check past obstetric history
  IF (pregnancy_record.past_obs_history->>'previous_cs')::boolean THEN risk_score := risk_score + 3; END IF;
  IF (pregnancy_record.past_obs_history->>'preeclampsia')::boolean THEN risk_score := risk_score + 3; END IF;
  IF (pregnancy_record.past_obs_history->>'pph')::boolean THEN risk_score := risk_score + 2; END IF;
  IF (pregnancy_record.past_obs_history->>'recurrent_abortion')::boolean THEN risk_score := risk_score + 2; END IF;
  
  -- Check current risk factors
  IF (pregnancy_record.current_risk_factors->>'twin_pregnancy')::boolean THEN risk_score := risk_score + 3; END IF;
  IF (pregnancy_record.current_risk_factors->>'advanced_maternal_age')::boolean THEN risk_score := risk_score + 2; END IF;
  IF (pregnancy_record.current_risk_factors->>'bmi_over_30')::boolean THEN risk_score := risk_score + 1; END IF;
  IF (pregnancy_record.current_risk_factors->>'smoking')::boolean THEN risk_score := risk_score + 2; END IF;
  IF (pregnancy_record.current_risk_factors->>'rh_negative')::boolean THEN risk_score := risk_score + 1; END IF;

  -- Return risk level based on score
  IF risk_score >= 5 THEN
    RETURN 'high';
  ELSIF risk_score >= 2 THEN
    RETURN 'moderate';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update risk_level when history is updated
CREATE OR REPLACE FUNCTION update_risk_level_on_history_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.risk_level := calculate_pregnancy_risk_level(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_risk_level ON pregnancies;
CREATE TRIGGER trigger_update_risk_level
  BEFORE INSERT OR UPDATE OF obstetric_history, medical_history, past_obs_history, current_risk_factors
  ON pregnancies
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_level_on_history_change();

-- Grant necessary permissions
GRANT ALL ON pregnancies TO authenticated;
GRANT ALL ON antenatal_visits TO authenticated;

-- Sample data update query (optional - for testing)
-- UPDATE pregnancies SET 
--   obstetric_history = '{"gravida": 2, "parity_fullterm": 1, "parity_preterm": 0, "abortions": 0, "living": 1}',
--   medical_history = '{"hypertension": false, "diabetes": false, "thyroid": false, "cardiac": false, "dvt_vte": false, "other": ""}',
--   past_obs_history = '{"preeclampsia": false, "pph": false, "previous_cs": false, "recurrent_abortion": false, "other": ""}',
--   current_risk_factors = '{"smoking": false, "bmi_over_30": false, "rh_negative": false, "twin_pregnancy": false, "advanced_maternal_age": false, "other": ""}'
-- WHERE id = 'YOUR_PREGNANCY_ID';
