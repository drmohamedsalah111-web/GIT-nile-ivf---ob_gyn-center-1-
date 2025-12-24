-- Add fetal_heart_rate to antenatal_visits
ALTER TABLE antenatal_visits ADD COLUMN IF NOT EXISTS fetal_heart_rate INTEGER;

-- Ensure RLS policies exist (if not already)
-- This is a safety measure, assuming RLS is enabled on tables
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE antenatal_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometry_scans ENABLE ROW LEVEL SECURITY;

-- Policy for doctors to see their own patients' pregnancies
CREATE POLICY "Doctors can view their own patients pregnancies" ON pregnancies
    FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own patients pregnancies" ON pregnancies
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own patients pregnancies" ON pregnancies
    FOR UPDATE USING (auth.uid() = doctor_id);

-- Similar policies for visits and scans would be needed, usually linked via pregnancy -> doctor_id
-- For now, we assume the basic structure is there.
