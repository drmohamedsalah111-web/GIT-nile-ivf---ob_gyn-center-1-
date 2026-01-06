/**
 * SMART IVF STIMULATION SERVICE
 * خدمة ذكية لإدارة مرحلة التنشيط في رحلة الحقن المجهري
 */

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CycleStatus = 
  | 'assessment' 
  | 'protocol' 
  | 'baseline' 
  | 'stimulation' 
  | 'trigger' 
  | 'opu' 
  | 'fertilization' 
  | 'transfer' 
  | 'waiting' 
  | 'beta' 
  | 'completed' 
  | 'cancelled';

export type OvarianPhenotype = 'poor_responder' | 'normal_responder' | 'high_responder' | 'pcos';
export type ProtocolType = 'long_agonist' | 'antagonist' | 'flare_up' | 'mini_ivf' | 'natural' | 'mdlf';
export type OHSSRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface SmartIVFCycle {
  id?: string;
  patient_id: string;
  doctor_id: string;
  clinic_id?: string;
  cycle_number: number;
  start_date: string;
  expected_opu_date?: string;
  status: CycleStatus;
  ovarian_phenotype?: OvarianPhenotype;
  poseidon_group?: number;
  predicted_response?: 'poor' | 'normal' | 'high';
  protocol_type?: ProtocolType;
  protocol_name?: string;
  initial_fsh_dose?: number;
  initial_hmg_dose?: number;
  total_dose_fsh?: number;
  total_dose_hmg?: number;
  gonadotropin_type?: string;
  antagonist_type?: string;
  trigger_type?: string;
  trigger_date?: string;
  risk_tags?: string[];
  ohss_risk_level?: OHSSRisk;
  predicted_oocytes?: number;
  predicted_quality?: string;
  confidence_score?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonitoringVisit {
  id?: string;
  cycle_id: string;
  visit_number: number;
  visit_date: string;
  visit_time?: string;
  cycle_day: number;
  stimulation_day?: number;
  
  // Hormones
  e2_level?: number;
  lh_level?: number;
  p4_level?: number;
  fsh_level?: number;
  
  // Ultrasound
  endometrium_thickness?: number;
  endometrium_pattern?: 'trilaminar' | 'homogeneous' | 'hyperechoic' | 'irregular';
  endometrium_quality?: 'excellent' | 'good' | 'acceptable' | 'poor';
  
  // Follicles
  follicles_right: number[];
  follicles_left: number[];
  total_follicles?: number;
  follicles_small?: number;
  follicles_medium?: number;
  follicles_large?: number;
  follicles_mature?: number;
  lead_follicle_size?: number;
  cohort_synchrony?: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Medications
  fsh_dose_given?: number;
  hmg_dose_given?: number;
  antagonist_given?: boolean;
  antagonist_dose?: string;
  other_medications?: Array<{drug: string, dose: string, route: string, time: string}>;
  
  // AI Recommendations
  ai_recommendations?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    action?: string;
  }>;
  recommended_fsh_dose?: number;
  recommended_hmg_dose?: number;
  dose_adjustment?: 'increase' | 'decrease' | 'maintain' | 'stop';
  dose_adjustment_reason?: string;
  
  // Alerts
  alerts?: Array<{type: string, severity: string, message: string}>;
  needs_attention?: boolean;
  
  // Clinical Decision
  next_visit_date?: string;
  next_visit_reason?: string;
  ready_for_trigger?: boolean;
  trigger_recommendation?: string;
  cancel_recommendation?: boolean;
  cancel_reason?: string;
  
  // Notes
  doctor_notes?: string;
  patient_feedback?: string;
  side_effects?: Array<{symptom: string, severity: string}>;
  
  created_at?: string;
  updated_at?: string;
}

export interface DailyAnalysis {
  id?: string;
  cycle_id: string;
  visit_id?: string;
  analysis_date: string;
  stimulation_day?: number;
  response_type?: 'poor' | 'slow' | 'normal' | 'high' | 'excessive';
  response_trajectory?: 'improving' | 'stable' | 'declining' | 'concerning';
  e2_per_follicle?: number;
  follicle_growth_rate?: number;
  endometrium_growth_rate?: number;
  synchrony_score?: number;
  predicted_opu_date?: string;
  predicted_oocyte_count?: number;
  predicted_mature_oocytes?: number;
  prediction_confidence?: number;
  ohss_risk_score?: number;
  cycle_cancellation_risk?: number;
  poor_outcome_risk?: number;
  recommendations?: any[];
  urgency_level?: 'routine' | 'monitor' | 'urgent' | 'critical';
  ai_summary?: string;
  confidence_notes?: string;
}

export interface CycleSummary {
  cycle_id: string;
  status: CycleStatus;
  stimulation_days: number;
  total_visits: number;
  latest_e2?: number;
  total_follicles?: number;
  lead_follicle?: number;
  ohss_risk?: OHSSRisk;
  predicted_oocytes?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class SmartStimulationService {
  
  // ============================================================================
  // CYCLE MANAGEMENT
  // ============================================================================
  
  /**
   * إنشاء دورة تنشيط ذكية جديدة
   */
  async createSmartCycle(cycle: Omit<SmartIVFCycle, 'id'>): Promise<SmartIVFCycle> {
    const { data, error } = await supabase
      .from('smart_ivf_cycles')
      .insert([cycle])
      .select()
      .single();
    
    if (error) throw new Error(`Error creating cycle: ${error.message}`);
    return data;
  }
  
  /**
   * تحديث دورة موجودة
   */
  async updateSmartCycle(cycleId: string, updates: Partial<SmartIVFCycle>): Promise<SmartIVFCycle> {
    const { data, error } = await supabase
      .from('smart_ivf_cycles')
      .update(updates)
      .eq('id', cycleId)
      .select()
      .single();
    
    if (error) throw new Error(`Error updating cycle: ${error.message}`);
    return data;
  }
  
  /**
   * الحصول على تفاصيل دورة معينة
   */
  async getCycle(cycleId: string): Promise<SmartIVFCycle> {
    const { data, error } = await supabase
      .from('smart_ivf_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    
    if (error) throw new Error(`Error fetching cycle: ${error.message}`);
    return data;
  }
  
  /**
   * الحصول على دورات مريض معين
   */
  async getPatientCycles(patientId: string): Promise<SmartIVFCycle[]> {
    const { data, error } = await supabase
      .from('smart_ivf_cycles')
      .select('*')
      .eq('patient_id', patientId)
      .order('start_date', { ascending: false });
    
    if (error) throw new Error(`Error fetching patient cycles: ${error.message}`);
    return data || [];
  }
  
  /**
   * الحصول على الدورات النشطة
   */
  async getActiveCycles(): Promise<any[]> {
    const { data, error } = await supabase
      .from('active_smart_cycles_summary')
      .select('*')
      .order('last_visit_date', { ascending: false });
    
    if (error) throw new Error(`Error fetching active cycles: ${error.message}`);
    return data || [];
  }
  
  /**
   * الحصول على ملخص دورة
   */
  async getCycleSummary(cycleId: string): Promise<CycleSummary> {
    const { data, error } = await supabase
      .rpc('get_cycle_summary', { p_cycle_id: cycleId });
    
    if (error) throw new Error(`Error fetching cycle summary: ${error.message}`);
    return data;
  }
  
  // ============================================================================
  // MONITORING VISITS
  // ============================================================================
  
  /**
   * إضافة زيارة متابعة جديدة
   */
  async addMonitoringVisit(visit: Omit<MonitoringVisit, 'id'>): Promise<MonitoringVisit> {
    // Auto-calculate visit number
    const { data: existingVisits } = await supabase
      .from('smart_monitoring_visits')
      .select('visit_number')
      .eq('cycle_id', visit.cycle_id)
      .order('visit_number', { ascending: false })
      .limit(1);
    
    const visitNumber = existingVisits && existingVisits.length > 0 
      ? existingVisits[0].visit_number + 1 
      : 1;
    
    const visitData = {
      ...visit,
      visit_number: visitNumber,
    };
    
    const { data, error } = await supabase
      .from('smart_monitoring_visits')
      .insert([visitData])
      .select()
      .single();
    
    if (error) throw new Error(`Error adding visit: ${error.message}`);
    
    // Generate AI recommendations after adding visit
    await this.generateAIRecommendations(data.id);
    
    return data;
  }
  
  /**
   * تحديث زيارة متابعة
   */
  async updateMonitoringVisit(visitId: string, updates: Partial<MonitoringVisit>): Promise<MonitoringVisit> {
    const { data, error } = await supabase
      .from('smart_monitoring_visits')
      .update(updates)
      .eq('id', visitId)
      .select()
      .single();
    
    if (error) throw new Error(`Error updating visit: ${error.message}`);
    
    // Regenerate AI recommendations after update
    await this.generateAIRecommendations(visitId);
    
    return data;
  }
  
  /**
   * الحصول على زيارات دورة معينة
   */
  async getCycleVisits(cycleId: string): Promise<MonitoringVisit[]> {
    const { data, error } = await supabase
      .from('smart_monitoring_visits')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('visit_number', { ascending: true });
    
    if (error) throw new Error(`Error fetching visits: ${error.message}`);
    return data || [];
  }
  
  /**
   * الحصول على آخر زيارة
   */
  async getLatestVisit(cycleId: string): Promise<MonitoringVisit | null> {
    const { data, error } = await supabase
      .from('smart_monitoring_visits')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('visit_number', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw new Error(`Error fetching latest visit: ${error.message}`);
    }
    return data;
  }
  
  /**
   * الحصول على الزيارات التي تحتاج متابعة
   */
  async getVisitsNeedingAttention(): Promise<any[]> {
    const { data, error } = await supabase
      .from('visits_needing_attention')
      .select('*')
      .order('visit_date', { ascending: false });
    
    if (error) throw new Error(`Error fetching visits needing attention: ${error.message}`);
    return data || [];
  }
  
  // ============================================================================
  // AI ANALYSIS & RECOMMENDATIONS
  // ============================================================================
  
  /**
   * توليد توصيات ذكية لزيارة معينة
   */
  async generateAIRecommendations(visitId: string): Promise<void> {
    try {
      // Get visit data
      const { data: visit, error: visitError } = await supabase
        .from('smart_monitoring_visits')
        .select('*, smart_ivf_cycles(*)')
        .eq('id', visitId)
        .single();
      
      if (visitError) throw visitError;
      
      const recommendations: any[] = [];
      const alerts: any[] = [];
      let needsAttention = false;
      let doseAdjustment: 'increase' | 'decrease' | 'maintain' | 'stop' = 'maintain';
      let recommendedFshDose = visit.fsh_dose_given || 150;
      
      // Analyze E2 levels
      if (visit.e2_level) {
        const e2PerFollicle = visit.total_follicles > 0 
          ? visit.e2_level / visit.total_follicles 
          : 0;
        
        // Low E2
        if (visit.stimulation_day && visit.stimulation_day >= 5 && visit.e2_level < 300) {
          recommendations.push({
            type: 'dose_adjustment',
            severity: 'warning',
            message: 'مستوى E2 منخفض - يُنصح بزيادة الجرعة',
            action: 'increase_dose'
          });
          doseAdjustment = 'increase';
          recommendedFshDose += 75;
          needsAttention = true;
        }
        
        // High E2 - OHSS risk
        if (visit.e2_level > 3000) {
          alerts.push({
            type: 'ohss_risk',
            severity: 'critical',
            message: 'خطر متلازمة فرط التنشيط - يُنصح بتقليل الجرعة والمتابعة الدقيقة'
          });
          doseAdjustment = 'decrease';
          recommendedFshDose = Math.max(75, recommendedFshDose - 75);
          needsAttention = true;
          
          // Update cycle OHSS risk
          await this.updateSmartCycle(visit.cycle_id, {
            ohss_risk_level: visit.e2_level > 5000 ? 'critical' : 'high'
          });
        }
        
        // Optimal E2 range
        if (visit.e2_level >= 1000 && visit.e2_level <= 2500 && visit.total_follicles >= 3) {
          recommendations.push({
            type: 'status_update',
            severity: 'info',
            message: 'الاستجابة ممتازة - استمر على نفس الجرعة',
            action: 'maintain'
          });
        }
      }
      
      // Analyze follicle development
      if (visit.lead_follicle_size && visit.stimulation_day) {
        // Ready for trigger
        if (visit.lead_follicle_size >= 18 && visit.follicles_mature && visit.follicles_mature >= 3) {
          recommendations.push({
            type: 'trigger_ready',
            severity: 'info',
            message: `جاهز للإبرة التفجيرية - ${visit.follicles_mature} حويصلات ناضجة`,
            action: 'schedule_trigger'
          });
          
          await this.updateMonitoringVisit(visitId, {
            ready_for_trigger: true,
            trigger_recommendation: `يُنصح بإعطاء الإبرة التفجيرية خلال 24-36 ساعة. عدد الحويصلات الناضجة: ${visit.follicles_mature}`
          });
          needsAttention = true;
        }
        
        // Slow growth
        if (visit.stimulation_day >= 6 && visit.lead_follicle_size < 12) {
          recommendations.push({
            type: 'slow_response',
            severity: 'warning',
            message: 'نمو بطيء للحويصلات - فكر في زيادة الجرعة أو تغيير البروتوكول',
            action: 'review_protocol'
          });
          needsAttention = true;
        }
        
        // Early LH surge risk
        if (visit.lh_level && visit.lh_level > 10 && !visit.antagonist_given) {
          alerts.push({
            type: 'lh_surge',
            severity: 'critical',
            message: 'خطر ارتفاع LH مبكر - يُنصح ببدء الأنتاجونيست فوراً'
          });
          needsAttention = true;
        }
      }
      
      // Poor response assessment
      if (visit.stimulation_day && visit.stimulation_day >= 8 && 
          visit.total_follicles && visit.total_follicles < 4) {
        recommendations.push({
          type: 'poor_response',
          severity: 'warning',
          message: 'استجابة ضعيفة - ناقش مع المريضة الخيارات المتاحة',
          action: 'counseling_required'
        });
        
        if (visit.total_follicles < 2) {
          await this.updateMonitoringVisit(visitId, {
            cancel_recommendation: true,
            cancel_reason: 'استجابة ضعيفة جداً - أقل من حويصلتين'
          });
        }
        needsAttention = true;
      }
      
      // Calculate next visit
      let nextVisitDate = null;
      let nextVisitReason = '';
      
      if (visit.ready_for_trigger) {
        nextVisitReason = 'متابعة ما قبل السحب';
      } else if (visit.stimulation_day && visit.stimulation_day < 5) {
        nextVisitDate = new Date(visit.visit_date);
        nextVisitDate.setDate(nextVisitDate.getDate() + 3);
        nextVisitReason = 'متابعة دورية';
      } else {
        nextVisitDate = new Date(visit.visit_date);
        nextVisitDate.setDate(nextVisitDate.getDate() + 2);
        nextVisitReason = 'تقييم النمو';
      }
      
      // Update visit with recommendations
      await supabase
        .from('smart_monitoring_visits')
        .update({
          ai_recommendations: recommendations,
          alerts: alerts,
          needs_attention: needsAttention,
          dose_adjustment: doseAdjustment,
          recommended_fsh_dose: recommendedFshDose,
          next_visit_date: nextVisitDate ? nextVisitDate.toISOString().split('T')[0] : null,
          next_visit_reason: nextVisitReason
        })
        .eq('id', visitId);
      
      // Create daily analysis
      await this.createDailyAnalysis(visit.cycle_id, visitId);
      
    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      // Don't throw - recommendations are not critical
    }
  }
  
  /**
   * إنشاء تحليل يومي
   */
  async createDailyAnalysis(cycleId: string, visitId?: string): Promise<void> {
    try {
      const visits = await this.getCycleVisits(cycleId);
      if (visits.length === 0) return;
      
      const latestVisit = visits[visits.length - 1];
      const previousVisit = visits.length > 1 ? visits[visits.length - 2] : null;
      
      // Calculate growth rates
      let follicleGrowthRate = 0;
      let endometriumGrowthRate = 0;
      
      if (previousVisit && latestVisit.lead_follicle_size && previousVisit.lead_follicle_size) {
        const daysDiff = latestVisit.stimulation_day! - previousVisit.stimulation_day!;
        follicleGrowthRate = daysDiff > 0 
          ? (latestVisit.lead_follicle_size - previousVisit.lead_follicle_size) / daysDiff 
          : 0;
      }
      
      if (previousVisit && latestVisit.endometrium_thickness && previousVisit.endometrium_thickness) {
        const daysDiff = latestVisit.stimulation_day! - previousVisit.stimulation_day!;
        endometriumGrowthRate = daysDiff > 0 
          ? (latestVisit.endometrium_thickness - previousVisit.endometrium_thickness) / daysDiff 
          : 0;
      }
      
      // Determine response type
      let responseType: 'poor' | 'slow' | 'normal' | 'high' | 'excessive' = 'normal';
      if (latestVisit.total_follicles) {
        if (latestVisit.total_follicles < 4) responseType = 'poor';
        else if (latestVisit.total_follicles <= 8) responseType = 'normal';
        else if (latestVisit.total_follicles <= 15) responseType = 'high';
        else responseType = 'excessive';
      }
      
      // Calculate OHSS risk
      let ohssRiskScore = 0;
      if (latestVisit.total_follicles && latestVisit.total_follicles > 15) ohssRiskScore += 30;
      if (latestVisit.e2_level && latestVisit.e2_level > 3000) ohssRiskScore += 40;
      if (latestVisit.e2_level && latestVisit.e2_level > 5000) ohssRiskScore += 30;
      
      const analysis: Omit<DailyAnalysis, 'id'> = {
        cycle_id: cycleId,
        visit_id: visitId,
        analysis_date: latestVisit.visit_date,
        stimulation_day: latestVisit.stimulation_day,
        response_type: responseType,
        response_trajectory: 'stable',
        e2_per_follicle: latestVisit.e2_level && latestVisit.total_follicles 
          ? latestVisit.e2_level / latestVisit.total_follicles 
          : undefined,
        follicle_growth_rate: follicleGrowthRate,
        endometrium_growth_rate: endometriumGrowthRate,
        synchrony_score: latestVisit.cohort_synchrony === 'excellent' ? 90 : 70,
        ohss_risk_score: ohssRiskScore,
        urgency_level: latestVisit.needs_attention ? 'urgent' : 'routine',
        ai_summary: `الاستجابة: ${responseType}. عدد الحويصلات: ${latestVisit.total_follicles || 0}. الحويصلة الأكبر: ${latestVisit.lead_follicle_size || 0}mm.`
      };
      
      await supabase
        .from('smart_daily_analysis')
        .insert([analysis]);
      
    } catch (error: any) {
      console.error('Error creating daily analysis:', error);
    }
  }
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * حساب عدد الحويصلات حسب الحجم
   */
  calculateFollicleSizes(follicles: number[]): {
    small: number;
    medium: number;
    large: number;
    mature: number;
  } {
    return {
      small: follicles.filter(f => f < 10).length,
      medium: follicles.filter(f => f >= 10 && f <= 13).length,
      large: follicles.filter(f => f >= 14 && f <= 17).length,
      mature: follicles.filter(f => f >= 18).length,
    };
  }
  
  /**
   * تحديد مستوى خطر OHSS
   */
  assessOHSSRisk(e2: number, follicleCount: number): OHSSRisk {
    if (e2 > 5000 || follicleCount > 20) return 'critical';
    if (e2 > 3500 || follicleCount > 15) return 'high';
    if (e2 > 2500 || follicleCount > 12) return 'moderate';
    return 'low';
  }
}

// Export singleton instance
export const smartStimulationService = new SmartStimulationService();
export default smartStimulationService;
