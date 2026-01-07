/**
 * ============================================================================
 * SMART IVF STIMULATION - TypeScript Type Definitions
 * تعريفات الأنواع لنظام التنشيط الذكي المتكامل
 * ============================================================================
 * يطابق تماماً: SMART_IVF_STIMULATION_SCHEMA.sql
 * تاريخ التحديث: 2026-01-07
 * ============================================================================
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type CycleStatus =
  | 'assessment'      // التقييم الأولي
  | 'protocol'        // اختيار البروتوكول
  | 'baseline'        // الفحص الأساسي قبل التنشيط
  | 'stimulation'     // مرحلة التنشيط (ACTIVE)
  | 'trigger'         // الإبرة التفجيرية
  | 'opu'            // سحب البويضات
  | 'fertilization'  // التخصيب
  | 'transfer'       // الترجيع
  | 'waiting'        // فترة الانتظار
  | 'beta'           // اختبار الحمل
  | 'completed'      // مكتملة
  | 'cancelled';     // ملغاة

export type OvarianPhenotype = 
  | 'poor_responder' 
  | 'normal_responder' 
  | 'high_responder' 
  | 'pcos';

export type ProtocolType = 
  | 'long_agonist' 
  | 'antagonist' 
  | 'flare_up' 
  | 'mini_ivf' 
  | 'natural' 
  | 'mdlf' 
  | 'short_agonist';

export type MedicationType =
  | 'gonadotropin_fsh'
  | 'gonadotropin_hmg'
  | 'gonadotropin_lh'
  | 'gnrh_agonist'
  | 'gnrh_antagonist'
  | 'trigger_hcg'
  | 'trigger_gnrh'
  | 'estrogen'
  | 'progesterone'
  | 'other';

export type OHSSRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type EndometriumPattern = 
  | 'trilaminar' 
  | 'homogeneous' 
  | 'hyperechoic' 
  | 'irregular';

export type EndometriumQuality = 
  | 'excellent' 
  | 'good' 
  | 'acceptable' 
  | 'poor';

export type DoseAdjustment = 
  | 'increase' 
  | 'decrease' 
  | 'maintain' 
  | 'stop';

export type CohortSynchrony = 
  | 'excellent' 
  | 'good' 
  | 'fair' 
  | 'poor';

export type ResponseType = 
  | 'poor' 
  | 'slow' 
  | 'normal' 
  | 'high' 
  | 'excessive';

export type ResponseTrajectory = 
  | 'improving' 
  | 'stable' 
  | 'declining' 
  | 'concerning';

// ============================================================================
// MEDICATIONS REFERENCE
// ============================================================================

export interface MedicationReference {
  id: string;
  medication_name: string;
  medication_name_ar: string;
  medication_type: MedicationType;
  available_doses: string[];
  unit: string; // 'IU', 'mg', 'mcg'
  route: string[]; // ['SC', 'IM']
  typical_starting_dose?: string;
  dose_range?: string; // '75-450 IU'
  frequency?: string;
  timing_instructions?: string;
  indications?: string;
  contraindications?: string;
  side_effects?: string[];
  storage_conditions?: string;
  manufacturer?: string;
  cost_per_unit?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LAB TESTS REFERENCE
// ============================================================================

export type LabTestCategory = 
  | 'hormones'
  | 'ovarian_reserve'
  | 'thyroid'
  | 'metabolic'
  | 'infectious'
  | 'genetic'
  | 'other';

export interface LabTestReference {
  id: string;
  test_name: string;
  test_name_ar: string;
  test_code?: string;
  test_category: LabTestCategory;
  reference_range_min?: number;
  reference_range_max?: number;
  unit: string; // 'pg/mL', 'mIU/mL', 'ng/mL'
  optimal_range?: string;
  sample_type?: string; // 'serum', 'plasma', 'urine'
  fasting_required: boolean;
  timing_in_cycle?: string; // 'Day 2-3', 'Any time'
  turnaround_time?: string; // 'Same day', '24 hours'
  interpretation_low?: string;
  interpretation_normal?: string;
  interpretation_high?: string;
  cost?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STIMULATION PROTOCOLS LIBRARY
// ============================================================================

export interface SelectionCriteria {
  age?: { min: number; max: number };
  amh?: { min: number; max: number };
  afc?: { min: number; max: number };
  bmi?: { min: number; max: number };
  previous_cycles?: { max: number };
  ovarian_phenotype?: OvarianPhenotype[];
}

export interface MedicationPlanItem {
  medication_id?: string;
  medication_name: string;
  starting_dose: string;
  unit: string;
  start_day: string; // 'Day 2', 'Day 5-6'
  route: string;
  frequency: string;
  adjustment_rules?: any;
  notes?: string;
}

export interface MonitoringPlanItem {
  day: number;
  day_label: string; // 'Baseline', 'First Check'
  required_tests: string[]; // ['E2', 'LH', 'P4']
  ultrasound: boolean;
  decision_points: string[]; // ['confirm_suppression', 'start_stimulation']
}

export interface TriggerCriteria {
  lead_follicle_min?: number; // 18
  mature_follicles_min?: number; // 3
  e2_per_follicle?: string; // '200-300'
  e2_min?: number; // 500
  endometrium_min?: number; // 7
  lh_max?: number;
  p4_max?: number;
}

export interface CancellationCriteria {
  follicles_max?: number;
  no_response_by_day?: number;
  ohss_risk?: string;
}

export interface StimulationProtocol {
  id: string;
  clinic_id?: string;
  protocol_name: string;
  protocol_name_ar: string;
  protocol_type: ProtocolType;
  description?: string;
  description_ar?: string;
  selection_criteria: SelectionCriteria;
  suitable_for?: string[];
  not_suitable_for?: string[];
  medications_plan: MedicationPlanItem[];
  monitoring_plan: MonitoringPlanItem[];
  trigger_criteria?: TriggerCriteria;
  cancellation_criteria?: CancellationCriteria;
  expected_stim_days?: number;
  expected_stim_days_range?: string; // '8-12 days'
  expected_oocytes_range?: string; // '8-15 oocytes'
  expected_fsh_total_dose_range?: string; // '1500-2500 IU'
  success_rate?: number;
  advantages?: string;
  disadvantages?: string;
  special_considerations?: string;
  evidence_level?: 'expert_opinion' | 'guideline' | 'study' | 'meta_analysis' | 'rct';
  source_reference?: string;
  is_active: boolean;
  is_custom: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SMART IVF CYCLES
// ============================================================================

export interface InitialAssessment {
  age?: number;
  bmi?: number;
  amh?: number;
  afc?: number;
  previous_cycles?: number;
  previous_response?: string;
}

export interface SmartIVFCycle {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id?: string;
  
  // معلومات الدورة
  cycle_number: number;
  start_date: string;
  baseline_date?: string;
  stimulation_start_date?: string;
  expected_opu_date?: string;
  
  // الحالة
  status: CycleStatus;
  
  // تصنيف الحالة (AI Phenotyping)
  ovarian_phenotype?: OvarianPhenotype;
  poseidon_group?: number; // 1-4
  predicted_response?: 'poor' | 'normal' | 'high';
  
  // البروتوكول المختار
  protocol_id?: string;
  protocol_type?: ProtocolType;
  protocol_name?: string;
  protocol_selection_reason?: string;
  protocol_ai_score?: number; // 0-1
  
  // التقييم الأولي
  initial_assessment?: InitialAssessment;
  
  // جرعات التنشيط
  planned_fsh_dose?: number;
  planned_hmg_dose?: number;
  actual_initial_fsh_dose?: number;
  actual_initial_hmg_dose?: number;
  total_dose_fsh: number;
  total_dose_hmg: number;
  
  // الأدوية المستخدمة
  gonadotropin_type?: string;
  antagonist_type?: string;
  trigger_type?: string;
  trigger_date?: string;
  
  // علامات التحذير
  risk_tags: string[];
  ohss_risk_level?: OHSSRiskLevel;
  
  // نتائج متوقعة
  predicted_oocytes?: number;
  predicted_quality?: string;
  confidence_score?: number;
  
  // ملاحظات
  notes?: string;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================================================
// MONITORING VISITS - UNIFIED WITH MEDICATIONS & LAB RESULTS
// ============================================================================

export interface MedicationGiven {
  medication_id?: string;
  medication_name: string;
  medication_name_ar?: string;
  medication_type: MedicationType;
  dose: number;
  unit: string;
  route: string;
  time?: string;
  prescribed_by?: string;
  administered_by?: string;
  batch_number?: string;
  notes?: string;
}

export interface LabResult {
  test_id?: string;
  test_name: string;
  test_name_ar?: string;
  result_value: number;
  unit: string;
  reference_min?: number;
  reference_max?: number;
  is_normal?: boolean;
  interpretation?: string;
  ordered_by?: string;
  verified?: boolean;
  verified_at?: string;
}

export interface AIRecommendation {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
}

export interface Alert {
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
}

export interface SideEffect {
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
}

/**
 * UNIFIED MONITORING VISIT
 * يحتوي على الهرمونات + السونار + الأدوية + التحاليل كلها في سجل واحد
 */
export interface SmartMonitoringVisit {
  id: string;
  cycle_id: string;
  
  // معلومات الزيارة
  visit_number: number;
  visit_date: string;
  visit_time?: string;
  
  // اليوم في الدورة
  cycle_day: number;
  stimulation_day?: number;
  
  // الهرمونات
  e2_level?: number;  // pg/mL
  lh_level?: number;  // mIU/mL
  p4_level?: number;  // ng/mL
  fsh_level?: number; // mIU/mL
  
  // السونار
  endometrium_thickness?: number; // mm
  endometrium_pattern?: EndometriumPattern;
  endometrium_quality?: EndometriumQuality;
  
  // الحويصلات
  follicles_right: number[];  // [10, 12, 14, 15, 18]
  follicles_left: number[];   // [11, 13, 16, 17]
  follicles_right_count?: number; // Auto-calculated
  follicles_left_count?: number;  // Auto-calculated
  
  // تحليل الحويصلات
  total_follicles?: number;
  follicles_small?: number;    // < 10mm
  follicles_medium?: number;   // 10-13mm
  follicles_large?: number;    // 14-17mm
  follicles_mature?: number;   // >= 18mm
  lead_follicle_size?: number;
  cohort_synchrony?: CohortSynchrony;
  
  // ✅ الأدوية المعطاة (INTEGRATED)
  medications_given?: MedicationGiven[];
  
  // ✅ نتائج التحاليل (INTEGRATED)
  lab_results?: LabResult[];
  
  // الجرعات المعطاة (Legacy support)
  fsh_dose_given?: number;
  hmg_dose_given?: number;
  antagonist_given?: boolean;
  antagonist_dose?: string;
  other_medications?: any[];
  
  // التوصيات الذكية
  ai_recommendations?: AIRecommendation[];
  recommended_fsh_dose?: number;
  recommended_hmg_dose?: number;
  dose_adjustment?: DoseAdjustment;
  dose_adjustment_reason?: string;
  
  // التنبيهات
  alerts?: Alert[];
  needs_attention: boolean;
  
  // القرار السريري
  next_visit_date?: string;
  next_visit_reason?: string;
  ready_for_trigger: boolean;
  trigger_recommendation?: string;
  cancel_recommendation: boolean;
  cancel_reason?: string;
  
  // الملاحظات
  doctor_notes?: string;
  patient_feedback?: string;
  side_effects?: SideEffect[];
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DAILY ANALYSIS
// ============================================================================

export interface SmartDailyAnalysis {
  id: string;
  cycle_id: string;
  visit_id?: string;
  analysis_date: string;
  stimulation_day?: number;
  
  // تحليل الاستجابة
  response_type?: ResponseType;
  response_trajectory?: ResponseTrajectory;
  
  // مؤشرات الجودة
  e2_per_follicle?: number;
  follicle_growth_rate?: number; // mm/day
  endometrium_growth_rate?: number; // mm/day
  synchrony_score?: number; // 0-100
  
  // التنبؤات
  predicted_opu_date?: string;
  predicted_oocyte_count?: number;
  predicted_mature_oocytes?: number;
  prediction_confidence?: number; // 0-1
  
  // تقييم المخاطر
  ohss_risk_score?: number; // 0-100
  cycle_cancellation_risk?: number; // 0-100
  poor_outcome_risk?: number; // 0-100
  
  // التوصيات
  recommendations?: any[];
  urgency_level?: 'routine' | 'monitor' | 'urgent' | 'critical';
  
  // AI Insights
  ai_summary?: string;
  confidence_notes?: string;
  
  created_at: string;
}

// ============================================================================
// CLINICAL DECISION LOG
// ============================================================================

export type DecisionType = 
  | 'dose_adjustment'
  | 'add_medication'
  | 'continue_monitoring'
  | 'trigger_timing'
  | 'cancel_cycle'
  | 'protocol_change';

export interface ClinicalDecision {
  id: string;
  cycle_id: string;
  visit_id?: string;
  doctor_id: string;
  
  decision_type: DecisionType;
  decision_details: string;
  
  // السياق
  clinical_indicators?: any;
  ai_recommendation?: string;
  doctor_reasoning?: string;
  
  // النتيجة
  followed_ai?: boolean;
  outcome?: string;
  
  decision_timestamp: string;
  outcome_timestamp?: string;
}

// ============================================================================
// VIEWS & AGGREGATED DATA
// ============================================================================

/**
 * COMPLETE VISIT VIEW - Returns all data for a visit in one unified object
 */
export interface CompleteVisitView {
  visit_id: string;
  cycle_id: string;
  visit_number: number;
  visit_date: string;
  cycle_day: number;
  stimulation_day?: number;
  
  // Hormones
  hormones: {
    e2?: number;
    lh?: number;
    p4?: number;
    fsh?: number;
  };
  
  // Ultrasound
  ultrasound: {
    endometrium_thickness?: number;
    endometrium_pattern?: EndometriumPattern;
    follicles_right: number[];
    follicles_left: number[];
    total_follicles?: number;
    lead_follicle?: number;
  };
  
  // Medications (integrated)
  medications: MedicationGiven[];
  
  // Lab Results (integrated)
  labs: LabResult[];
  
  // Recommendations
  recommendations: AIRecommendation[];
  alerts: Alert[];
  
  // Clinical Decision
  ready_for_trigger: boolean;
  next_visit_date?: string;
  doctor_notes?: string;
}

/**
 * IVF JOURNEY COMPLETE - Complete timeline view
 */
export interface IVFJourneyComplete {
  cycle_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  status: CycleStatus;
  protocol_name: string;
  start_date: string;
  stimulation_start_date?: string;
  
  // Complete journey timeline with all visits
  journey_timeline: CompleteVisitView[];
  
  // Latest stats
  latest_e2?: number;
  latest_follicles?: number;
  latest_lead_follicle?: number;
  latest_endometrium?: number;
  
  // Totals
  total_visits: number;
  total_medications_given: number;
  total_lab_tests: number;
  total_dose_fsh: number;
  total_dose_hmg: number;
  
  // Risk
  ohss_risk_level?: OHSSRiskLevel;
  predicted_oocytes?: number;
  
  created_at: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: any;
}

export interface ProtocolSuggestion {
  protocol_id: string;
  protocol_name: string;
  match_score: number;
  reason: string;
}

// ============================================================================
// FORM INPUTS
// ============================================================================

export interface CreateCycleInput {
  patient_id: string;
  doctor_id: string;
  clinic_id?: string;
  cycle_number: number;
  start_date: string;
  initial_assessment?: InitialAssessment;
  protocol_id?: string;
  planned_fsh_dose?: number;
  planned_hmg_dose?: number;
}

export interface AddVisitInput {
  cycle_id: string;
  visit_date: string;
  cycle_day: number;
  stimulation_day?: number;
  
  // Hormones
  e2_level?: number;
  lh_level?: number;
  p4_level?: number;
  
  // Ultrasound
  endometrium_thickness?: number;
  endometrium_pattern?: EndometriumPattern;
  follicles_right: number[];
  follicles_left: number[];
  
  // Medications given
  medications_given?: MedicationGiven[];
  
  // Lab results
  lab_results?: LabResult[];
  
  // Clinical notes
  doctor_notes?: string;
}

// ============================================================================
// LEGACY SUPPORT TYPES (for backward compatibility)
// ============================================================================

export interface LegacyMedicationLog {
  id: string;
  cycle_id: string;
  visit_id?: string;
  medication_id?: string;
  medication_name: string;
  medication_type: MedicationType;
  dose: number;
  unit: string;
  route: string;
  administration_date: string;
  administration_time?: string;
  cycle_day?: number;
  stimulation_day?: number;
  reason?: string;
  prescribed_by?: string;
  administered_by?: string;
  notes?: string;
  side_effects_reported?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
}

export interface LegacyLabResult {
  id: string;
  cycle_id: string;
  visit_id?: string;
  test_id?: string;
  test_name: string;
  test_code?: string;
  result_value?: number;
  result_text?: string;
  unit?: string;
  reference_range_min?: number;
  reference_range_max?: number;
  is_normal?: boolean;
  interpretation?: string;
  sample_date: string;
  sample_time?: string;
  result_date?: string;
  cycle_day?: number;
  stimulation_day?: number;
  ordered_by?: string;
  lab_name?: string;
  notes?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}
