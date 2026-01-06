-- ============================================================================
-- SMART IVF COPILOT - ENHANCED STIMULATION TRACKING SCHEMA
-- نظام ذكي لمتابعة رحلة الحقن المجهري خلال مرحلة التنشيط
-- ============================================================================
-- يغطي: تتبع دقيق للتنشيط، التحليل الذكي، التوصيات الآلية، التنبؤات
-- ============================================================================

-- ============================================================================
-- 1. جدول الدورات الذكية (Smart IVF Cycles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS smart_ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID, -- Optional, no foreign key constraint
  
  -- معلومات الدورة
  cycle_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_opu_date DATE,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'assessment' CHECK (
    status IN (
      'assessment',      -- التقييم الأولي
      'protocol',        -- اختيار البروتوكول
      'baseline',        -- الفحص الأساسي قبل التنشيط
      'stimulation',     -- مرحلة التنشيط (ACTIVE)
      'trigger',         -- الإبرة التفجيرية
      'opu',            -- سحب البويضات
      'fertilization',  -- التخصيب
      'transfer',       -- الترجيع
      'waiting',        -- فترة الانتظار
      'beta',           -- اختبار الحمل
      'completed',      -- مكتملة
      'cancelled'       -- ملغاة
    )
  ),
  
  -- تصنيف الحالة (AI Phenotyping)
  ovarian_phenotype TEXT CHECK (ovarian_phenotype IN ('poor_responder', 'normal_responder', 'high_responder', 'pcos')),
  poseidon_group INTEGER CHECK (poseidon_group BETWEEN 1 AND 4),
  predicted_response TEXT CHECK (predicted_response IN ('poor', 'normal', 'high')),
  
  -- البروتوكول
  protocol_type TEXT CHECK (protocol_type IN ('long_agonist', 'antagonist', 'flare_up', 'mini_ivf', 'natural', 'mdlf')),
  protocol_name TEXT,
  
  -- جرعات التنشيط
  initial_fsh_dose INTEGER, -- IU
  initial_hmg_dose INTEGER, -- IU
  total_dose_fsh INTEGER DEFAULT 0, -- مجموع جرعات FSH
  total_dose_hmg INTEGER DEFAULT 0, -- مجموع جرعات HMG
  
  -- الأدوية المستخدمة
  gonadotropin_type TEXT, -- recombinant FSH, urinary FSH, HP-HMG
  antagonist_type TEXT,   -- Cetrotide, Orgalutran
  trigger_type TEXT,      -- HCG, dual trigger, GnRH agonist
  trigger_date TIMESTAMPTZ,
  
  -- علامات التحذير (Risk Tags)
  risk_tags TEXT[] DEFAULT '{}',
  ohss_risk_level TEXT CHECK (ohss_risk_level IN ('low', 'moderate', 'high', 'critical')),
  
  -- نتائج متوقعة (AI Predictions)
  predicted_oocytes INTEGER,
  predicted_quality TEXT,
  confidence_score DECIMAL(3,2), -- 0-1
  
  -- ملاحظات
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_smart_cycles_patient ON smart_ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_smart_cycles_doctor ON smart_ivf_cycles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_smart_cycles_status ON smart_ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_smart_cycles_start_date ON smart_ivf_cycles(start_date DESC);

-- ============================================================================
-- 2. جدول زيارات المتابعة الذكية (Smart Monitoring Visits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS smart_monitoring_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  
  -- معلومات الزيارة
  visit_number INTEGER NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_time TIME DEFAULT CURRENT_TIME,
  
  -- اليوم في الدورة
  cycle_day INTEGER NOT NULL, -- اليوم من بداية الدورة
  stimulation_day INTEGER,    -- اليوم من بداية التنشيط (بعد Baseline)
  
  -- الهرمونات (Hormones)
  e2_level DECIMAL(8,2),      -- Estradiol (pg/mL)
  lh_level DECIMAL(6,2),      -- LH (mIU/mL)
  p4_level DECIMAL(6,2),      -- Progesterone (ng/mL)
  fsh_level DECIMAL(6,2),     -- FSH (mIU/mL)
  
  -- السونار (Ultrasound)
  endometrium_thickness DECIMAL(4,2), -- mm
  endometrium_pattern TEXT CHECK (endometrium_pattern IN ('trilaminar', 'homogeneous', 'hyperechoic', 'irregular')),
  endometrium_quality TEXT CHECK (endometrium_quality IN ('excellent', 'good', 'acceptable', 'poor')),
  
  -- الحويصلات - المبيض الأيمن (Right Ovary Follicles)
  follicles_right JSONB DEFAULT '[]', -- مصفوفة أحجام: [10, 12, 14, 15, 18, ...]
  follicles_right_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(follicles_right)) STORED,
  
  -- الحويصلات - المبيض الأيسر (Left Ovary Follicles)
  follicles_left JSONB DEFAULT '[]',
  follicles_left_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(follicles_left)) STORED,
  
  -- تحليل الحويصلات (Follicle Analysis)
  total_follicles INTEGER,
  follicles_small INTEGER,    -- < 10mm
  follicles_medium INTEGER,   -- 10-13mm
  follicles_large INTEGER,    -- 14-17mm
  follicles_mature INTEGER,   -- >= 18mm
  lead_follicle_size DECIMAL(4,2),
  cohort_synchrony TEXT CHECK (cohort_synchrony IN ('excellent', 'good', 'fair', 'poor')),
  
  -- الجرعات المعطاة (Medications Given)
  fsh_dose_given INTEGER,     -- IU
  hmg_dose_given INTEGER,     -- IU
  antagonist_given BOOLEAN DEFAULT false,
  antagonist_dose TEXT,
  other_medications JSONB DEFAULT '[]', -- [{drug, dose, route, time}]
  
  -- التوصيات الذكية (AI Recommendations)
  ai_recommendations JSONB DEFAULT '[]', -- مصفوفة من التوصيات
  recommended_fsh_dose INTEGER,
  recommended_hmg_dose INTEGER,
  dose_adjustment TEXT CHECK (dose_adjustment IN ('increase', 'decrease', 'maintain', 'stop')),
  dose_adjustment_reason TEXT,
  
  -- التنبيهات (Alerts)
  alerts JSONB DEFAULT '[]', -- [{type, severity, message}]
  needs_attention BOOLEAN DEFAULT false,
  
  -- القرار السريري (Clinical Decision)
  next_visit_date DATE,
  next_visit_reason TEXT,
  ready_for_trigger BOOLEAN DEFAULT false,
  trigger_recommendation TEXT,
  cancel_recommendation BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  
  -- الملاحظات
  doctor_notes TEXT,
  patient_feedback TEXT,
  side_effects JSONB DEFAULT '[]', -- [{symptom, severity}]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_smart_visits_cycle ON smart_monitoring_visits(cycle_id, visit_number);
CREATE INDEX IF NOT EXISTS idx_smart_visits_date ON smart_monitoring_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_smart_visits_needs_attention ON smart_monitoring_visits(needs_attention) WHERE needs_attention = true;

-- ============================================================================
-- 3. جدول التحليل الذكي اليومي (Daily AI Analysis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS smart_daily_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES smart_monitoring_visits(id) ON DELETE CASCADE,
  
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stimulation_day INTEGER,
  
  -- تحليل الاستجابة (Response Analysis)
  response_type TEXT CHECK (response_type IN ('poor', 'slow', 'normal', 'high', 'excessive')),
  response_trajectory TEXT CHECK (response_trajectory IN ('improving', 'stable', 'declining', 'concerning')),
  
  -- مؤشرات الجودة (Quality Indicators)
  e2_per_follicle DECIMAL(8,2), -- E2/follicle ratio
  follicle_growth_rate DECIMAL(4,2), -- mm/day
  endometrium_growth_rate DECIMAL(4,2), -- mm/day
  synchrony_score INTEGER CHECK (synchrony_score BETWEEN 0 AND 100),
  
  -- التنبؤات (Predictions)
  predicted_opu_date DATE,
  predicted_oocyte_count INTEGER,
  predicted_mature_oocytes INTEGER,
  prediction_confidence DECIMAL(3,2), -- 0-1
  
  -- تقييم المخاطر (Risk Assessment)
  ohss_risk_score INTEGER CHECK (ohss_risk_score BETWEEN 0 AND 100),
  cycle_cancellation_risk INTEGER CHECK (cycle_cancellation_risk BETWEEN 0 AND 100),
  poor_outcome_risk INTEGER CHECK (poor_outcome_risk BETWEEN 0 AND 100),
  
  -- التوصيات (Recommendations)
  recommendations JSONB DEFAULT '[]',
  urgency_level TEXT CHECK (urgency_level IN ('routine', 'monitor', 'urgent', 'critical')),
  
  -- AI Insights
  ai_summary TEXT,
  confidence_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_analysis_cycle ON smart_daily_analysis(cycle_id, analysis_date DESC);

-- ============================================================================
-- 4. جدول بروتوكولات التنشيط (Stimulation Protocols Library)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stimulation_protocols_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID, -- Optional, no foreign key constraint
  
  -- معلومات البروتوكول
  protocol_name TEXT NOT NULL,
  protocol_type TEXT NOT NULL,
  description TEXT,
  
  -- مؤشرات الاستخدام (Indications)
  suitable_for TEXT[], -- ['normal_responder', 'high_amh', etc.]
  age_range TEXT, -- '25-35'
  amh_range TEXT, -- '1.5-4.0'
  afc_range TEXT, -- '8-15'
  
  -- الأدوية (Medications)
  medications JSONB NOT NULL, -- [{drug, starting_dose, adjustments}]
  
  -- خطة المتابعة (Monitoring Plan)
  baseline_checks JSONB,
  monitoring_schedule JSONB, -- [{day, tests_required}]
  trigger_criteria JSONB,
  
  -- المعايير السريرية (Clinical Parameters)
  expected_stim_days INTEGER,
  expected_oocytes TEXT,
  success_rate DECIMAL(5,2),
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES doctors(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocols_clinic ON stimulation_protocols_library(clinic_id);
CREATE INDEX IF NOT EXISTS idx_protocols_type ON stimulation_protocols_library(protocol_type);

-- ============================================================================
-- 5. جدول المعرفة السريرية (Clinical Knowledge Base)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- التصنيف
  category TEXT NOT NULL CHECK (category IN (
    'protocol_selection',
    'dose_adjustment',
    'trigger_timing',
    'ohss_prevention',
    'poor_response',
    'quality_improvement'
  )),
  
  -- المحتوى
  rule_name TEXT NOT NULL,
  description TEXT,
  
  -- الشروط (Conditions)
  conditions JSONB NOT NULL, -- [{parameter, operator, value}]
  
  -- الإجراءات (Actions)
  actions JSONB NOT NULL, -- [{action_type, details}]
  
  -- الأولوية والتفعيل
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- المصدر
  evidence_level TEXT CHECK (evidence_level IN ('expert_opinion', 'guideline', 'study', 'meta_analysis')),
  source_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON clinical_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON clinical_knowledge_base(is_active) WHERE is_active = true;

-- ============================================================================
-- 6. جدول سجل القرارات السريرية (Clinical Decision Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_decision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES smart_monitoring_visits(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  
  -- القرار
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'dose_adjustment',
    'add_medication',
    'continue_monitoring',
    'trigger_timing',
    'cancel_cycle',
    'protocol_change'
  )),
  
  decision_details TEXT NOT NULL,
  
  -- السياق (Context)
  clinical_indicators JSONB, -- البيانات السريرية وقت القرار
  ai_recommendation TEXT,    -- ما اقترحه الذكاء الاصطناعي
  doctor_reasoning TEXT,     -- سبب قرار الطبيب
  
  -- النتيجة (Outcome)
  followed_ai BOOLEAN,       -- هل تبع الطبيب توصية الAI
  outcome TEXT,              -- النتيجة بعد القرار
  
  decision_timestamp TIMESTAMPTZ DEFAULT now(),
  outcome_timestamp TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_decision_log_cycle ON clinical_decision_log(cycle_id, decision_timestamp DESC);

-- ============================================================================
-- FUNCTIONS: دوال مساعدة لحساب المؤشرات
-- ============================================================================

-- دالة لحساب معدل نمو الحويصلات
CREATE OR REPLACE FUNCTION calculate_follicle_growth_rate(
  p_cycle_id UUID
) RETURNS TABLE (
  avg_growth_rate DECIMAL,
  max_growth_rate DECIMAL,
  min_growth_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH follicle_sizes AS (
    SELECT 
      visit_number,
      visit_date,
      lead_follicle_size,
      LAG(lead_follicle_size) OVER (ORDER BY visit_number) as prev_size,
      LAG(visit_date) OVER (ORDER BY visit_number) as prev_date
    FROM smart_monitoring_visits
    WHERE cycle_id = p_cycle_id
      AND lead_follicle_size IS NOT NULL
    ORDER BY visit_number
  )
  SELECT 
    ROUND(AVG((lead_follicle_size - prev_size) / NULLIF(EXTRACT(DAY FROM visit_date - prev_date), 0)), 2) as avg_growth_rate,
    ROUND(MAX((lead_follicle_size - prev_size) / NULLIF(EXTRACT(DAY FROM visit_date - prev_date), 0)), 2) as max_growth_rate,
    ROUND(MIN((lead_follicle_size - prev_size) / NULLIF(EXTRACT(DAY FROM visit_date - prev_date), 0)), 2) as min_growth_rate
  FROM follicle_sizes
  WHERE prev_size IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على ملخص الدورة الحالية
CREATE OR REPLACE FUNCTION get_cycle_summary(p_cycle_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'cycle_id', c.id,
    'status', c.status,
    'stimulation_days', (
      SELECT COUNT(*) 
      FROM smart_monitoring_visits 
      WHERE cycle_id = c.id AND stimulation_day IS NOT NULL
    ),
    'total_visits', (
      SELECT COUNT(*) 
      FROM smart_monitoring_visits 
      WHERE cycle_id = c.id
    ),
    'latest_e2', (
      SELECT e2_level 
      FROM smart_monitoring_visits 
      WHERE cycle_id = c.id 
      ORDER BY visit_date DESC 
      LIMIT 1
    ),
    'total_follicles', (
      SELECT total_follicles 
      FROM smart_monitoring_visits 
      WHERE cycle_id = c.id 
      ORDER BY visit_date DESC 
      LIMIT 1
    ),
    'lead_follicle', (
      SELECT lead_follicle_size 
      FROM smart_monitoring_visits 
      WHERE cycle_id = c.id 
      ORDER BY visit_date DESC 
      LIMIT 1
    ),
    'ohss_risk', c.ohss_risk_level,
    'predicted_oocytes', c.predicted_oocytes
  ) INTO v_result
  FROM smart_ivf_cycles c
  WHERE c.id = p_cycle_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES: Row Level Security
-- ============================================================================

-- تفعيل RLS
ALTER TABLE smart_ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_monitoring_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_daily_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_decision_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للدورات
CREATE POLICY "doctors_view_own_clinic_smart_cycles" ON smart_ivf_cycles
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "doctors_insert_own_smart_cycles" ON smart_ivf_cycles
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "doctors_update_own_smart_cycles" ON smart_ivf_cycles
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- سياسات الأمان للزيارات
CREATE POLICY "view_visits_for_accessible_cycles" ON smart_monitoring_visits
  FOR SELECT USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "insert_visits_for_own_cycles" ON smart_monitoring_visits
  FOR INSERT WITH CHECK (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "update_visits_for_own_cycles" ON smart_monitoring_visits
  FOR UPDATE USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- TRIGGERS: محفزات لتحديث البيانات تلقائياً
-- ============================================================================

-- محفز لتحديث updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_smart_cycles_modtime
  BEFORE UPDATE ON smart_ivf_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_smart_visits_modtime
  BEFORE UPDATE ON smart_monitoring_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- محفز لحساب إحصائيات الحويصلات تلقائياً
CREATE OR REPLACE FUNCTION calculate_follicle_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_all_follicles JSONB;
  v_size NUMERIC;
BEGIN
  -- دمج الحويصلات من الجانبين
  v_all_follicles := NEW.follicles_right || NEW.follicles_left;
  
  -- حساب الإحصائيات
  NEW.total_follicles := jsonb_array_length(v_all_follicles);
  NEW.follicles_small := (
    SELECT COUNT(*) FROM jsonb_array_elements_text(v_all_follicles) WHERE CAST(value AS NUMERIC) < 10
  );
  NEW.follicles_medium := (
    SELECT COUNT(*) FROM jsonb_array_elements_text(v_all_follicles) WHERE CAST(value AS NUMERIC) BETWEEN 10 AND 13
  );
  NEW.follicles_large := (
    SELECT COUNT(*) FROM jsonb_array_elements_text(v_all_follicles) WHERE CAST(value AS NUMERIC) BETWEEN 14 AND 17
  );
  NEW.follicles_mature := (
    SELECT COUNT(*) FROM jsonb_array_elements_text(v_all_follicles) WHERE CAST(value AS NUMERIC) >= 18
  );
  
  -- أكبر حويصلة
  SELECT MAX(CAST(value AS NUMERIC)) INTO v_size
  FROM jsonb_array_elements_text(v_all_follicles);
  NEW.lead_follicle_size := v_size;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_visit_follicle_stats
  BEFORE INSERT OR UPDATE ON smart_monitoring_visits
  FOR EACH ROW
  WHEN (NEW.follicles_right IS NOT NULL OR NEW.follicles_left IS NOT NULL)
  EXECUTE FUNCTION calculate_follicle_stats();

-- ============================================================================
-- VIEWS: عروض للوصول السريع للبيانات
-- ============================================================================

-- عرض ملخص الدورات النشطة
CREATE OR REPLACE VIEW active_smart_cycles_summary AS
SELECT 
  c.id,
  c.patient_id,
  p.name as patient_name,
  p.age as patient_age,
  c.doctor_id,
  d.name as doctor_name,
  c.status,
  c.cycle_number,
  c.start_date,
  c.protocol_type,
  c.ovarian_phenotype,
  c.ohss_risk_level,
  -- آخر زيارة
  (SELECT visit_date FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as last_visit_date,
  (SELECT stimulation_day FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as current_stim_day,
  (SELECT total_follicles FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as current_follicle_count,
  (SELECT e2_level FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as current_e2,
  -- العد
  (SELECT COUNT(*) FROM smart_monitoring_visits WHERE cycle_id = c.id) as total_visits,
  c.created_at
FROM smart_ivf_cycles c
LEFT JOIN patients p ON c.patient_id = p.id
LEFT JOIN doctors d ON c.doctor_id = d.id
WHERE c.status IN ('stimulation', 'baseline', 'trigger')
ORDER BY c.start_date DESC;

-- عرض الزيارات التي تحتاج متابعة
CREATE OR REPLACE VIEW visits_needing_attention AS
SELECT 
  v.id,
  v.cycle_id,
  c.patient_id,
  p.name as patient_name,
  v.visit_date,
  v.stimulation_day,
  v.total_follicles,
  v.lead_follicle_size,
  v.e2_level,
  v.alerts,
  v.ai_recommendations,
  v.ready_for_trigger,
  v.cancel_recommendation,
  v.next_visit_date
FROM smart_monitoring_visits v
JOIN smart_ivf_cycles c ON v.cycle_id = c.id
JOIN patients p ON c.patient_id = p.id
WHERE v.needs_attention = true
  AND c.status = 'stimulation'
ORDER BY v.visit_date DESC;

-- ============================================================================
-- SAMPLE DATA: بيانات تجريبية للاختبار
-- ============================================================================

-- إدراج بروتوكول تجريبي
INSERT INTO stimulation_protocols_library (
  protocol_name,
  protocol_type,
  description,
  suitable_for,
  medications,
  monitoring_schedule,
  expected_stim_days,
  is_active
) VALUES (
  'Antagonist Protocol - Standard',
  'antagonist',
  'بروتوكول الأنتاجونيست القياسي للمستجيبين الطبيعيين',
  ARRAY['normal_responder'],
  '[
    {"drug": "FSH", "starting_dose": "150-225 IU", "route": "SC", "frequency": "daily"},
    {"drug": "GnRH Antagonist", "starting_dose": "0.25mg", "start_day": "Day 5-6", "route": "SC"}
  ]'::JSONB,
  '[
    {"day": 0, "tests": ["E2", "LH", "P4", "US"]},
    {"day": 5, "tests": ["E2", "LH", "US"]},
    {"day": 7, "tests": ["E2", "LH", "US"]},
    {"day": 9, "tests": ["E2", "LH", "P4", "US"]}
  ]'::JSONB,
  10,
  true
);

-- إدراج قواعد معرفية
INSERT INTO clinical_knowledge_base (
  category,
  rule_name,
  description,
  conditions,
  actions,
  priority,
  evidence_level
) VALUES (
  'dose_adjustment',
  'زيادة الجرعة للاستجابة البطيئة',
  'إذا كان النمو بطيء في اليوم 5-6 من التنشيط',
  '[
    {"parameter": "stimulation_day", "operator": ">=", "value": 5},
    {"parameter": "lead_follicle", "operator": "<", "value": 12},
    {"parameter": "e2_level", "operator": "<", "value": 300}
  ]'::JSONB,
  '[
    {"action": "increase_dose", "amount": "25-50 IU"},
    {"action": "alert", "message": "استجابة بطيئة - يُنصح بزيادة الجرعة"}
  ]'::JSONB,
  1,
  'guideline'
);

-- ============================================================================
-- نهاية السكريبت
-- ============================================================================

COMMENT ON TABLE smart_ivf_cycles IS 'جدول الدورات الذكية لمتابعة رحلة الحقن المجهري';
COMMENT ON TABLE smart_monitoring_visits IS 'جدول زيارات المتابعة مع التحليل الذكي والتوصيات';
COMMENT ON TABLE smart_daily_analysis IS 'التحليل اليومي الذكي للدورة';
COMMENT ON TABLE stimulation_protocols_library IS 'مكتبة بروتوكولات التنشيط';
COMMENT ON TABLE clinical_knowledge_base IS 'قاعدة المعرفة السريرية للقرارات الذكية';
COMMENT ON TABLE clinical_decision_log IS 'سجل القرارات السريرية ومقارنتها بتوصيات AI';
