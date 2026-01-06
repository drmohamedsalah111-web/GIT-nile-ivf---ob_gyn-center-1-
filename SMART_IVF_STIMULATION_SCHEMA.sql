-- ============================================================================
-- SMART IVF COPILOT - ENHANCED STIMULATION TRACKING SCHEMA
-- نظام ذكي متكامل لمتابعة رحلة الحقن المجهري خلال مرحلة التنشيط
-- ============================================================================
-- يغطي: اختيار البروتوكول، تتبع دقيق للتنشيط، التحليل الذكي، 
--       الأدوية، التحاليل، التوصيات الآلية، نظام تسجيل احترافي
-- ============================================================================

-- ============================================================================
-- SECTION 1: الجداول المرجعية (Reference Tables)
-- ============================================================================

-- ============================================================================
-- 1.1 جدول الأدوية المرجعي (Medications Reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medications_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات الدواء
  medication_name TEXT NOT NULL UNIQUE,
  medication_name_ar TEXT NOT NULL,
  medication_type TEXT NOT NULL CHECK (medication_type IN (
    'gonadotropin_fsh',
    'gonadotropin_hmg',
    'gonadotropin_lh',
    'gnrh_agonist',
    'gnrh_antagonist',
    'trigger_hcg',
    'trigger_gnrh',
    'estrogen',
    'progesterone',
    'other'
  )),
  
  -- الجرعات
  available_doses TEXT[], -- ['75 IU', '150 IU', '300 IU']
  unit TEXT NOT NULL, -- 'IU', 'mg', 'mcg'
  route TEXT[] DEFAULT '{"SC"}', -- ['SC', 'IM']
  
  -- معلومات الاستخدام
  typical_starting_dose TEXT,
  dose_range TEXT, -- '75-450 IU'
  frequency TEXT DEFAULT 'daily',
  timing_instructions TEXT,
  
  -- معلومات طبية
  indications TEXT,
  contraindications TEXT,
  side_effects TEXT[],
  storage_conditions TEXT,
  
  -- معلومات إضافية
  manufacturer TEXT,
  cost_per_unit DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_type ON medications_reference(medication_type);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications_reference(is_active) WHERE is_active = true;

-- ============================================================================
-- 1.2 جدول التحاليل المرجعي (Lab Tests Reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_tests_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات التحليل
  test_name TEXT NOT NULL UNIQUE,
  test_name_ar TEXT NOT NULL,
  test_code TEXT,
  test_category TEXT NOT NULL CHECK (test_category IN (
    'hormones',
    'ovarian_reserve',
    'thyroid',
    'metabolic',
    'infectious',
    'genetic',
    'other'
  )),
  
  -- القيم المرجعية
  reference_range_min DECIMAL(10,4),
  reference_range_max DECIMAL(10,4),
  unit TEXT NOT NULL, -- 'pg/mL', 'mIU/mL', 'ng/mL'
  optimal_range TEXT,
  
  -- معلومات التحليل
  sample_type TEXT, -- 'serum', 'plasma', 'urine'
  fasting_required BOOLEAN DEFAULT false,
  timing_in_cycle TEXT, -- 'Day 2-3', 'Any time'
  turnaround_time TEXT, -- 'Same day', '24 hours'
  
  -- التفسير
  interpretation_low TEXT,
  interpretation_normal TEXT,
  interpretation_high TEXT,
  
  -- معلومات إضافية
  cost DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests_reference(test_category);
CREATE INDEX IF NOT EXISTS idx_lab_tests_active ON lab_tests_reference(is_active) WHERE is_active = true;

-- ============================================================================
-- 1.3 جدول بروتوكولات التنشيط الذكية (Smart Stimulation Protocols)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stimulation_protocols_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID, -- Optional, no foreign key constraint
  
  -- معلومات البروتوكول
  protocol_name TEXT NOT NULL,
  protocol_name_ar TEXT NOT NULL,
  protocol_type TEXT NOT NULL CHECK (protocol_type IN (
    'long_agonist',
    'antagonist',
    'flare_up',
    'mini_ivf',
    'natural',
    'mdlf',
    'short_agonist'
  )),
  description TEXT,
  description_ar TEXT,
  
  -- معايير الاختيار الذكية (Smart Selection Criteria)
  selection_criteria JSONB NOT NULL DEFAULT '{}', -- {
    -- "age": {"min": 25, "max": 35},
    -- "amh": {"min": 1.5, "max": 4.0},
    -- "afc": {"min": 8, "max": 15},
    -- "bmi": {"min": 18, "max": 30},
    -- "previous_cycles": {"max": 2},
    -- "ovarian_phenotype": ["normal_responder"]
  -- }
  
  -- مؤشرات الاستخدام
  suitable_for TEXT[], -- ['normal_responder', 'high_amh', etc.]
  not_suitable_for TEXT[], -- ['poor_responder', 'low_amh']
  
  -- خطة الأدوية (Medication Plan)
  medications_plan JSONB NOT NULL, -- [
    -- {
    --   "medication_id": "uuid",
    --   "medication_name": "FSH",
    --   "starting_dose": "150",
    --   "unit": "IU",
    --   "start_day": "Day 2",
    --   "route": "SC",
    --   "frequency": "daily",
    --   "adjustment_rules": {"based_on": "e2_and_follicles"}
    -- }
  -- ]
  
  -- خطة المتابعة الذكية (Smart Monitoring Plan)
  monitoring_plan JSONB NOT NULL, -- [
    -- {
    --   "day": 0,
    --   "day_label": "Baseline",
    --   "required_tests": ["E2", "LH", "P4", "FSH"],
    --   "ultrasound": true,
    --   "decision_points": ["confirm_suppression", "start_stimulation"]
    -- }
  -- ]
  
  -- معايير القرارات (Decision Criteria)
  trigger_criteria JSONB, -- {
    -- "lead_follicle_min": 18,
    -- "mature_follicles_min": 3,
    -- "e2_min": 500,
    -- "endometrium_min": 7
  -- }
  
  cancellation_criteria JSONB, -- {
    -- "follicles_max": 3,
    -- "no_response_by_day": 10,
    -- "ohss_risk": "critical"
  -- }
  
  -- النتائج المتوقعة (Expected Outcomes)
  expected_stim_days INTEGER,
  expected_stim_days_range TEXT, -- '8-12 days'
  expected_oocytes_range TEXT, -- '8-15 oocytes'
  expected_fsh_total_dose_range TEXT, -- '1500-2500 IU'
  success_rate DECIMAL(5,2), -- معدل النجاح ٪
  
  -- معلومات إضافية
  advantages TEXT,
  disadvantages TEXT,
  special_considerations TEXT,
  evidence_level TEXT CHECK (evidence_level IN ('expert_opinion', 'guideline', 'study', 'meta_analysis', 'rct')),
  source_reference TEXT,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES doctors(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocols_clinic ON stimulation_protocols_library(clinic_id);
CREATE INDEX IF NOT EXISTS idx_protocols_type ON stimulation_protocols_library(protocol_type);
CREATE INDEX IF NOT EXISTS idx_protocols_active ON stimulation_protocols_library(is_active) WHERE is_active = true;

-- إضافة الأعمدة الجديدة إلى جدول البروتوكولات إذا لم تكن موجودة
DO $$ 
BEGIN
  -- التعامل مع الأعمدة القديمة (medications -> medications_plan)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'stimulation_protocols_library' 
             AND column_name = 'medications') THEN
    -- إزالة قيد NOT NULL من العمود القديم
    ALTER TABLE stimulation_protocols_library ALTER COLUMN medications DROP NOT NULL;
    -- إضافة العمود الجديد إذا لم يكن موجودًا
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stimulation_protocols_library' 
                   AND column_name = 'medications_plan') THEN
      ALTER TABLE stimulation_protocols_library ADD COLUMN medications_plan JSONB;
      -- نسخ البيانات من العمود القديم إلى الجديد
      UPDATE stimulation_protocols_library SET medications_plan = medications WHERE medications IS NOT NULL;
    END IF;
  END IF;
  
  -- التعامل مع العمود القديم (monitoring -> monitoring_plan)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'stimulation_protocols_library' 
             AND column_name = 'monitoring') THEN
    ALTER TABLE stimulation_protocols_library ALTER COLUMN monitoring DROP NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stimulation_protocols_library' 
                   AND column_name = 'monitoring_plan') THEN
      ALTER TABLE stimulation_protocols_library ADD COLUMN monitoring_plan JSONB;
      UPDATE stimulation_protocols_library SET monitoring_plan = monitoring WHERE monitoring IS NOT NULL;
    END IF;
  END IF;
  
  -- إضافة الأعمدة الجديدة
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'protocol_name_ar') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN protocol_name_ar TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'description_ar') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN description_ar TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'selection_criteria') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN selection_criteria JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'not_suitable_for') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN not_suitable_for TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'medications_plan') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN medications_plan JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'monitoring_plan') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN monitoring_plan JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'trigger_criteria') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN trigger_criteria JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'cancellation_criteria') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN cancellation_criteria JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'expected_stim_days_range') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN expected_stim_days_range TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'expected_oocytes_range') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN expected_oocytes_range TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'expected_fsh_total_dose_range') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN expected_fsh_total_dose_range TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'advantages') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN advantages TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'disadvantages') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN disadvantages TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stimulation_protocols_library' 
                 AND column_name = 'special_considerations') THEN
    ALTER TABLE stimulation_protocols_library ADD COLUMN special_considerations TEXT;
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: الدورات والمتابعة (Cycles & Monitoring)
-- ============================================================================

-- ============================================================================
-- 2.1 جدول الدورات الذكية المحسّن (Smart IVF Cycles - Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS smart_ivf_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID, -- Optional, no foreign key constraint
  
  -- معلومات الدورة
  cycle_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  baseline_date DATE,
  stimulation_start_date DATE,
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
  
  -- البروتوكول المختار (Selected Protocol)
  protocol_id UUID REFERENCES stimulation_protocols_library(id),
  protocol_type TEXT CHECK (protocol_type IN ('long_agonist', 'antagonist', 'flare_up', 'mini_ivf', 'natural', 'mdlf', 'short_agonist')),
  protocol_name TEXT,
  protocol_selection_reason TEXT, -- سبب اختيار هذا البروتوكول
  protocol_ai_score DECIMAL(3,2), -- درجة الذكاء الاصطناعي للبروتوكول (0-1)
  
  -- التقييم الأولي (Initial Assessment)
  initial_assessment JSONB DEFAULT '{}', -- {
    -- "age": 30,
    -- "bmi": 24,
    -- "amh": 2.5,
    -- "afc": 12,
    -- "previous_cycles": 0,
    -- "previous_response": null
  -- }
  
  -- جرعات التنشيط المخططة والفعلية
  planned_fsh_dose INTEGER, -- IU - الجرعة المخططة
  planned_hmg_dose INTEGER, -- IU
  actual_initial_fsh_dose INTEGER, -- IU - الجرعة الفعلية المستخدمة
  actual_initial_hmg_dose INTEGER, -- IU
  total_dose_fsh INTEGER DEFAULT 0, -- مجموع جرعات FSH الفعلية
  total_dose_hmg INTEGER DEFAULT 0, -- مجموع جرعات HMG الفعلية
  
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

-- إضافة الأعمدة الجديدة إذا لم تكن موجودة (للدعم التراجعي)
DO $$ 
BEGIN
  -- إضافة baseline_date إذا لم يكن موجودًا
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'baseline_date') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN baseline_date DATE;
  END IF;
  
  -- إضافة stimulation_start_date إذا لم يكن موجودًا
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'stimulation_start_date') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN stimulation_start_date DATE;
  END IF;
  
  -- إضافة الأعمدة الأخرى المحدثة
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'protocol_id') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN protocol_id UUID REFERENCES stimulation_protocols_library(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'protocol_selection_reason') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN protocol_selection_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'protocol_ai_score') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN protocol_ai_score DECIMAL(3,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'initial_assessment') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN initial_assessment JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'planned_fsh_dose') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN planned_fsh_dose INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'planned_hmg_dose') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN planned_hmg_dose INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'actual_initial_fsh_dose') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN actual_initial_fsh_dose INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'smart_ivf_cycles' 
                 AND column_name = 'actual_initial_hmg_dose') THEN
    ALTER TABLE smart_ivf_cycles ADD COLUMN actual_initial_hmg_dose INTEGER;
  END IF;
END $$;

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
-- 2.3 جدول الأدوية المعطاة (Medications Administered)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cycle_medications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES smart_monitoring_visits(id),
  
  -- معلومات الدواء
  medication_id UUID REFERENCES medications_reference(id),
  medication_name TEXT NOT NULL,
  medication_type TEXT NOT NULL,
  
  -- الجرعة
  dose DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT 'SC',
  
  -- التوقيت
  administration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  administration_time TIME DEFAULT CURRENT_TIME,
  cycle_day INTEGER,
  stimulation_day INTEGER,
  
  -- السبب والقرار
  reason TEXT,
  prescribed_by UUID REFERENCES doctors(id),
  administered_by TEXT, -- nurse, patient self, etc.
  
  -- الملاحظات
  notes TEXT,
  side_effects_reported TEXT,
  
  -- التتبع
  batch_number TEXT,
  expiry_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_log_cycle ON cycle_medications_log(cycle_id, administration_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_log_visit ON cycle_medications_log(visit_id);
CREATE INDEX IF NOT EXISTS idx_medications_log_type ON cycle_medications_log(medication_type);

-- ============================================================================
-- 2.4 جدول التحاليل المسجلة (Lab Results Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cycle_lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES smart_monitoring_visits(id),
  
  -- معلومات التحليل
  test_id UUID REFERENCES lab_tests_reference(id),
  test_name TEXT NOT NULL,
  test_code TEXT,
  
  -- النتيجة
  result_value DECIMAL(10,4),
  result_text TEXT, -- للنتائج النصية
  unit TEXT,
  
  -- المرجع
  reference_range_min DECIMAL(10,4),
  reference_range_max DECIMAL(10,4),
  is_normal BOOLEAN,
  interpretation TEXT,
  
  -- التوقيت
  sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sample_time TIME,
  result_date DATE,
  cycle_day INTEGER,
  stimulation_day INTEGER,
  
  -- المعلومات الإضافية
  ordered_by UUID REFERENCES doctors(id),
  lab_name TEXT,
  notes TEXT,
  
  -- التتبع
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES doctors(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_cycle ON cycle_lab_results(cycle_id, sample_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_visit ON cycle_lab_results(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test ON cycle_lab_results(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_unverified ON cycle_lab_results(verified) WHERE verified = false;

-- ============================================================================
-- SECTION 3: التحليل الذكي والتوصيات (AI Analysis & Recommendations)
-- ============================================================================

-- ============================================================================
-- 3.1 جدول التحليل الذكي اليومي (Daily AI Analysis)
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
-- 3.2 جدول قاعدة المعرفة السريرية (Clinical Knowledge Base)
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
-- 3.3 جدول سجل القرارات السريرية (Clinical Decision Log)
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
-- SECTION 4: الدوال والعروض المساعدة (Helper Functions & Views)
-- ============================================================================

-- ============================================================================
-- 4.1 دوال حساب المؤشرات (Calculation Functions)
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

-- دالة للحصول على سجل الأدوية الكامل للدورة
CREATE OR REPLACE FUNCTION get_cycle_medications_history(p_cycle_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', administration_date,
      'day', stimulation_day,
      'medication', medication_name,
      'dose', dose || ' ' || unit,
      'route', route
    ) ORDER BY administration_date
  ) INTO v_result
  FROM cycle_medications_log
  WHERE cycle_id = p_cycle_id;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على ملخص التحاليل
CREATE OR REPLACE FUNCTION get_cycle_labs_summary(p_cycle_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', sample_date,
      'day', stimulation_day,
      'test', test_name,
      'value', result_value,
      'unit', unit,
      'normal', is_normal
    ) ORDER BY sample_date, test_name
  ) INTO v_result
  FROM cycle_lab_results
  WHERE cycle_id = p_cycle_id;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- دالة ذكية لاختيار البروتوكول المناسب
CREATE OR REPLACE FUNCTION suggest_protocol(
  p_patient_age INTEGER,
  p_amh DECIMAL,
  p_afc INTEGER,
  p_bmi DECIMAL DEFAULT NULL,
  p_previous_cycles INTEGER DEFAULT 0
) RETURNS TABLE (
  protocol_id UUID,
  protocol_name TEXT,
  match_score DECIMAL,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH scored_protocols AS (
    SELECT 
      p.id,
      p.protocol_name,
      p.protocol_name_ar,
      -- حساب درجة التطابق بناءً على المعايير
      (
        CASE 
          WHEN p.selection_criteria->>'age' IS NOT NULL THEN
            CASE WHEN p_patient_age BETWEEN 
              CAST(p.selection_criteria->'age'->>'min' AS INTEGER) AND 
              CAST(p.selection_criteria->'age'->>'max' AS INTEGER)
            THEN 25 ELSE 0 END
          ELSE 25
        END +
        CASE 
          WHEN p.selection_criteria->>'amh' IS NOT NULL THEN
            CASE WHEN p_amh BETWEEN 
              CAST(p.selection_criteria->'amh'->>'min' AS DECIMAL) AND 
              CAST(p.selection_criteria->'amh'->>'max' AS DECIMAL)
            THEN 25 ELSE 0 END
          ELSE 25
        END +
        CASE 
          WHEN p.selection_criteria->>'afc' IS NOT NULL THEN
            CASE WHEN p_afc BETWEEN 
              CAST(p.selection_criteria->'afc'->>'min' AS INTEGER) AND 
              CAST(p.selection_criteria->'afc'->>'max' AS INTEGER)
            THEN 25 ELSE 0 END
          ELSE 25
        END +
        CASE 
          WHEN p.selection_criteria->>'bmi' IS NOT NULL AND p_bmi IS NOT NULL THEN
            CASE WHEN p_bmi BETWEEN 
              CAST(p.selection_criteria->'bmi'->>'min' AS DECIMAL) AND 
              CAST(p.selection_criteria->'bmi'->>'max' AS DECIMAL)
            THEN 25 ELSE 0 END
          ELSE 25
        END
      ) as score,
      CASE
        WHEN p_amh < 1.0 THEN 'AMH منخفض - يحتاج بروتوكول خاص'
        WHEN p_amh > 4.0 THEN 'AMH مرتفع - خطر OHSS'
        WHEN p_afc < 5 THEN 'استجابة ضعيفة متوقعة'
        WHEN p_afc > 20 THEN 'استجابة عالية - حذر من OHSS'
        ELSE 'مستجيب طبيعي'
      END as rationale
    FROM stimulation_protocols_library p
    WHERE p.is_active = true
  )
  SELECT 
    sp.id,
    sp.protocol_name,
    sp.score,
    sp.rationale
  FROM scored_protocols sp
  ORDER BY sp.score DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: سياسات الأمان (Security Policies)
-- ============================================================================

-- ============================================================================
-- 5.1 RLS POLICIES: Row Level Security
-- ============================================================================

-- تفعيل RLS
ALTER TABLE smart_ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_monitoring_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_daily_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_decision_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للدورات
DROP POLICY IF EXISTS "doctors_view_own_clinic_smart_cycles" ON smart_ivf_cycles;
CREATE POLICY "doctors_view_own_clinic_smart_cycles" ON smart_ivf_cycles
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "doctors_insert_own_smart_cycles" ON smart_ivf_cycles;
CREATE POLICY "doctors_insert_own_smart_cycles" ON smart_ivf_cycles
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "doctors_update_own_smart_cycles" ON smart_ivf_cycles;
CREATE POLICY "doctors_update_own_smart_cycles" ON smart_ivf_cycles
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- سياسات الأمان للزيارات
DROP POLICY IF EXISTS "view_visits_for_accessible_cycles" ON smart_monitoring_visits;
CREATE POLICY "view_visits_for_accessible_cycles" ON smart_monitoring_visits
  FOR SELECT USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_visits_for_own_cycles" ON smart_monitoring_visits;
CREATE POLICY "insert_visits_for_own_cycles" ON smart_monitoring_visits
  FOR INSERT WITH CHECK (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "update_visits_for_own_cycles" ON smart_monitoring_visits;
CREATE POLICY "update_visits_for_own_cycles" ON smart_monitoring_visits
  FOR UPDATE USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- تفعيل RLS للجداول الجديدة
ALTER TABLE cycle_medications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_lab_results ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للأدوية
DROP POLICY IF EXISTS "view_medications_for_accessible_cycles" ON cycle_medications_log;
CREATE POLICY "view_medications_for_accessible_cycles" ON cycle_medications_log
  FOR SELECT USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_medications_for_own_cycles" ON cycle_medications_log;
CREATE POLICY "insert_medications_for_own_cycles" ON cycle_medications_log
  FOR INSERT WITH CHECK (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- سياسات الأمان للتحاليل
DROP POLICY IF EXISTS "view_lab_results_for_accessible_cycles" ON cycle_lab_results;
CREATE POLICY "view_lab_results_for_accessible_cycles" ON cycle_lab_results
  FOR SELECT USING (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_lab_results_for_own_cycles" ON cycle_lab_results;
CREATE POLICY "insert_lab_results_for_own_cycles" ON cycle_lab_results
  FOR INSERT WITH CHECK (
    cycle_id IN (
      SELECT id FROM smart_ivf_cycles 
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- SECTION 6: المحفزات التلقائية (Automated Triggers)
-- ============================================================================

-- ============================================================================
-- 6.1 TRIGGERS: محفزات لتحديث البيانات تلقائياً
-- ============================================================================

-- محفز لتحديث updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_smart_cycles_modtime ON smart_ivf_cycles;
CREATE TRIGGER update_smart_cycles_modtime
  BEFORE UPDATE ON smart_ivf_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_smart_visits_modtime ON smart_monitoring_visits;
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

DROP TRIGGER IF EXISTS calculate_visit_follicle_stats ON smart_monitoring_visits;
CREATE TRIGGER calculate_visit_follicle_stats
  BEFORE INSERT OR UPDATE ON smart_monitoring_visits
  FOR EACH ROW
  WHEN (NEW.follicles_right IS NOT NULL OR NEW.follicles_left IS NOT NULL)
  EXECUTE FUNCTION calculate_follicle_stats();

-- محفز لتحديث إجمالي الجرعات في الدورة
CREATE OR REPLACE FUNCTION update_cycle_total_doses()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث إجمالي FSH
  IF NEW.medication_type = 'gonadotropin_fsh' THEN
    UPDATE smart_ivf_cycles
    SET total_dose_fsh = total_dose_fsh + NEW.dose
    WHERE id = NEW.cycle_id;
  END IF;
  
  -- تحديث إجمالي HMG
  IF NEW.medication_type = 'gonadotropin_hmg' THEN
    UPDATE smart_ivf_cycles
    SET total_dose_hmg = total_dose_hmg + NEW.dose
    WHERE id = NEW.cycle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cycle_doses_on_medication_log ON cycle_medications_log;
CREATE TRIGGER update_cycle_doses_on_medication_log
  AFTER INSERT ON cycle_medications_log
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_total_doses();

-- ============================================================================
-- SECTION 7: العروض للوصول السريع (Quick Access Views)
-- ============================================================================

-- ============================================================================
-- 7.1 VIEWS: عروض للوصول السريع للبيانات
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

-- عرض مفصل للدورة مع كل المعلومات
CREATE OR REPLACE VIEW cycle_complete_details AS
SELECT 
  c.id as cycle_id,
  c.patient_id,
  p.name as patient_name,
  p.age,
  c.doctor_id,
  d.name as doctor_name,
  c.status,
  c.protocol_name,
  c.protocol_type,
  c.start_date,
  c.stimulation_start_date,
  -- ملخص الزيارات
  (SELECT COUNT(*) FROM smart_monitoring_visits WHERE cycle_id = c.id) as total_visits,
  -- آخر قراءات
  (SELECT e2_level FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as latest_e2,
  (SELECT total_follicles FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as latest_follicles,
  (SELECT lead_follicle_size FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as latest_lead_follicle,
  (SELECT endometrium_thickness FROM smart_monitoring_visits WHERE cycle_id = c.id ORDER BY visit_date DESC LIMIT 1) as latest_endometrium,
  -- الجرعات
  c.total_dose_fsh,
  c.total_dose_hmg,
  -- عدد الأدوية والتحاليل
  (SELECT COUNT(*) FROM cycle_medications_log WHERE cycle_id = c.id) as total_medications_given,
  (SELECT COUNT(*) FROM cycle_lab_results WHERE cycle_id = c.id) as total_lab_tests,
  -- المخاطر
  c.ohss_risk_level,
  c.predicted_oocytes,
  c.created_at
FROM smart_ivf_cycles c
LEFT JOIN patients p ON c.patient_id = p.id
LEFT JOIN doctors d ON c.doctor_id = d.id;

-- عرض للأدوية اليومية
CREATE OR REPLACE VIEW daily_medications_schedule AS
SELECT 
  m.cycle_id,
  c.patient_id,
  p.name as patient_name,
  m.administration_date,
  m.stimulation_day,
  m.medication_name,
  m.dose || ' ' || m.unit as dose_display,
  m.route,
  m.prescribed_by,
  d.name as doctor_name,
  m.notes
FROM cycle_medications_log m
JOIN smart_ivf_cycles c ON m.cycle_id = c.id
JOIN patients p ON c.patient_id = p.id
LEFT JOIN doctors d ON m.prescribed_by = d.id
WHERE c.status IN ('stimulation', 'trigger')
ORDER BY m.administration_date DESC, m.administration_time DESC;

-- عرض للتحاليل الحديثة
CREATE OR REPLACE VIEW recent_lab_results AS
SELECT 
  l.cycle_id,
  c.patient_id,
  p.name as patient_name,
  l.sample_date,
  l.stimulation_day,
  l.test_name,
  l.result_value,
  l.unit,
  l.reference_range_min || '-' || l.reference_range_max as reference_range,
  l.is_normal,
  l.interpretation,
  l.verified,
  l.notes
FROM cycle_lab_results l
JOIN smart_ivf_cycles c ON l.cycle_id = c.id
JOIN patients p ON c.patient_id = p.id
WHERE c.status IN ('stimulation', 'trigger', 'baseline')
ORDER BY l.sample_date DESC, l.test_name;

-- ============================================================================
-- SECTION 8: بيانات مرجعية تجريبية (Sample Reference Data)
-- ============================================================================

-- ============================================================================
-- 8.1 SAMPLE DATA: بيانات تجريبية للاختبار
-- ============================================================================

-- إدراج أدوية مرجعية
INSERT INTO medications_reference (medication_name, medication_name_ar, medication_type, available_doses, unit, typical_starting_dose, dose_range) VALUES
('Gonal-F', 'جونال إف', 'gonadotropin_fsh', ARRAY['75 IU', '150 IU', '300 IU', '450 IU', '900 IU'], 'IU', '150-225 IU', '75-450 IU'),
('Fostimon', 'فوستيمون', 'gonadotropin_fsh', ARRAY['75 IU', '150 IU'], 'IU', '150-225 IU', '75-450 IU'),
('Menopur', 'مينوبور', 'gonadotropin_hmg', ARRAY['75 IU', '150 IU'], 'IU', '75-150 IU', '75-300 IU'),
('Cetrotide', 'سيتروتايد', 'gnrh_antagonist', ARRAY['0.25 mg', '3 mg'], 'mg', '0.25 mg', '0.25-3 mg'),
('Orgalutran', 'أورجالوتران', 'gnrh_antagonist', ARRAY['0.25 mg'], 'mg', '0.25 mg', '0.25 mg'),
('Decapeptyl', 'ديكابيبتيل', 'gnrh_agonist', ARRAY['0.1 mg', '3 mg', '3.75 mg'], 'mg', '0.1 mg', '0.1-3.75 mg'),
('Pregnyl', 'بريجنيل', 'trigger_hcg', ARRAY['5000 IU', '10000 IU'], 'IU', '5000-10000 IU', '5000-10000 IU'),
('Ovitrelle', 'أوفيتريل', 'trigger_hcg', ARRAY['250 mcg'], 'mcg', '250 mcg', '250 mcg')
ON CONFLICT (medication_name) DO NOTHING;

-- إدراج تحاليل مرجعية
INSERT INTO lab_tests_reference (test_name, test_name_ar, test_category, unit, optimal_range, timing_in_cycle) VALUES
('Estradiol (E2)', 'استراديول', 'hormones', 'pg/mL', '50-500 (varies by cycle day)', 'Any time during stimulation'),
('Luteinizing Hormone (LH)', 'الهرمون المنشط للجسم الأصفر', 'hormones', 'mIU/mL', '< 10 during stimulation', 'Baseline and during stimulation'),
('Progesterone (P4)', 'البروجستيرون', 'hormones', 'ng/mL', '< 1.5 during stimulation', 'Baseline and trigger day'),
('FSH', 'الهرمون المنشط للحويصلات', 'hormones', 'mIU/mL', '3-10', 'Day 2-3 of cycle'),
('AMH', 'الهرمون المضاد لمولر', 'ovarian_reserve', 'ng/mL', '1.5-4.0', 'Any time'),
('TSH', 'الهرمون المنشط للغدة الدرقية', 'thyroid', 'mIU/L', '0.5-2.5', 'Any time'),
('Prolactin', 'البرولاكتين', 'hormones', 'ng/mL', '< 25', 'Any time')
ON CONFLICT (test_name) DO NOTHING;

-- إدراج بروتوكول تجريبي محسّن
INSERT INTO stimulation_protocols_library (
  protocol_name,
  protocol_name_ar,
  protocol_type,
  description,
  description_ar,
  selection_criteria,
  suitable_for,
  medications_plan,
  monitoring_plan,
  trigger_criteria,
  expected_stim_days,
  expected_stim_days_range,
  expected_oocytes_range,
  is_active
) VALUES (
  'Antagonist Protocol - Standard',
  'بروتوكول الأنتاجونيست القياسي',
  'antagonist',
  'Standard antagonist protocol for normal responders',
  'بروتوكول الأنتاجونيست القياسي للمستجيبين الطبيعيين مع مراقبة دقيقة',
  '{"age": {"min": 25, "max": 38}, "amh": {"min": 1.5, "max": 4.0}, "afc": {"min": 8, "max": 15}, "bmi": {"min": 18, "max": 32}}'::JSONB,
  ARRAY['normal_responder'],
  '[
    {"medication_name": "FSH", "starting_dose": "150-225", "unit": "IU", "start_day": "Day 2", "route": "SC", "frequency": "daily", "notes": "Adjust based on response"},
    {"medication_name": "GnRH Antagonist", "starting_dose": "0.25", "unit": "mg", "start_day": "Day 5-6 of stimulation", "route": "SC", "frequency": "daily", "notes": "Start when lead follicle reaches 13-14mm"}
  ]'::JSONB,
  '[
    {"day": 0, "day_label": "Baseline", "required_tests": ["E2", "LH", "P4", "FSH"], "ultrasound": true, "decision_points": ["Confirm no cysts", "Start stimulation"]},
    {"day": 5, "day_label": "First Check", "required_tests": ["E2", "LH"], "ultrasound": true, "decision_points": ["Assess response", "Consider antagonist start"]},
    {"day": 7, "day_label": "Mid Stimulation", "required_tests": ["E2", "LH"], "ultrasound": true, "decision_points": ["Adjust doses", "Continue antagonist"]},
    {"day": 9, "day_label": "Late Stimulation", "required_tests": ["E2", "LH", "P4"], "ultrasound": true, "decision_points": ["Consider trigger timing"]}
  ]'::JSONB,
  '{"lead_follicle_min": 18, "mature_follicles_min": 3, "e2_per_follicle": "200-300", "endometrium_min": 7, "lh_max": 10, "p4_max": 1.5}'::JSONB,
  10,
  '8-12 days',
  '8-15 oocytes',
  true
)
ON CONFLICT DO NOTHING;

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
