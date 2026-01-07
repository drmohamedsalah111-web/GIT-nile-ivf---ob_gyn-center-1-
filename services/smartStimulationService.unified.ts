/**
 * ============================================================================
 * SMART STIMULATION SERVICE - UNIFIED VERSION
 * خدمة التنشيط الذكي المتكامل - نسخة موحدة
 * ============================================================================
 * يدعم: النظام الجديد المدمج مع الأدوية والتحاليل داخل الزيارات
 * يطابق: SMART_IVF_STIMULATION_SCHEMA.sql
 * تاريخ: 2026-01-07
 * ============================================================================
 */

import { supabase } from '../src/lib/supabase';
import type {
  SmartIVFCycle,
  SmartMonitoringVisit,
  StimulationProtocol,
  MedicationReference,
  LabTestReference,
  SmartDailyAnalysis,
  ClinicalDecision,
  CreateCycleInput,
  AddVisitInput,
  ApiResponse,
  ProtocolSuggestion,
  IVFJourneyComplete,
  CompleteVisitView
} from '../types/smartStimulation.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCurrentDoctorId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return doctor?.id || null;
  } catch (error) {
    console.error('Error getting doctor ID:', error);
    return null;
  }
};

const getCurrentClinicId = async (): Promise<string | null> => {
  try {
    const doctorId = await getCurrentDoctorId();
    if (!doctorId) return null;

    const { data: doctor } = await supabase
      .from('doctors')
      .select('clinic_id')
      .eq('id', doctorId)
      .single();

    return doctor?.clinic_id || null;
  } catch (error) {
    console.error('Error getting clinic ID:', error);
    return null;
  }
};

// ============================================================================
// CYCLES MANAGEMENT
// ============================================================================

export const smartStimulationService = {
  /**
   * إنشاء دورة جديدة
   */
  async createCycle(input: CreateCycleInput): Promise<ApiResponse<SmartIVFCycle>> {
    try {
      const doctorId = await getCurrentDoctorId();
      if (!doctorId) {
        return { data: null, error: 'Doctor ID not found' };
      }

      const clinicId = await getCurrentClinicId();

      const cycleData = {
        ...input,
        doctor_id: doctorId,
        clinic_id: clinicId,
        status: 'assessment',
        total_dose_fsh: 0,
        total_dose_hmg: 0,
        risk_tags: []
      };

      const { data, error } = await supabase
        .from('smart_ivf_cycles')
        .insert([cycleData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على دورة محددة
   */
  async getCycle(cycleId: string): Promise<ApiResponse<SmartIVFCycle>> {
    try {
      const { data, error } = await supabase
        .from('smart_ivf_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching cycle:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث دورة
   */
  async updateCycle(
    cycleId: string,
    updates: Partial<SmartIVFCycle>
  ): Promise<ApiResponse<SmartIVFCycle>> {
    try {
      const { data, error } = await supabase
        .from('smart_ivf_cycles')
        .update(updates)
        .eq('id', cycleId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating cycle:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على دورات المريض
   */
  async getPatientCycles(patientId: string): Promise<ApiResponse<SmartIVFCycle[]>> {
    try {
      const { data, error } = await supabase
        .from('smart_ivf_cycles')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching patient cycles:', error);
      return { data: null, error };
    }
  },

  /**
   * جلب آخر دورة نشطة أو أحدث دورة للمريض
   */
  async getActiveOrLastCycle(patientId: string): Promise<ApiResponse<SmartIVFCycle | null>> {
    try {
      // جلب آخر دورة نشطة (stimulation/assessment/trigger/active)
      const { data: activeCycles, error: activeError } = await supabase
        .from('smart_ivf_cycles')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['assessment', 'stimulation', 'trigger', 'active'])
        .order('start_date', { ascending: false })
        .limit(1);
      if (activeError) throw activeError;
      if (activeCycles && activeCycles.length > 0) {
        return { data: activeCycles[0], error: null };
      }
      // إذا لم توجد دورة نشطة، جلب أحدث دورة فقط
      const { data: lastCycles, error: lastError } = await supabase
        .from('smart_ivf_cycles')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_date', { ascending: false })
        .limit(1);
      if (lastError) throw lastError;
      if (lastCycles && lastCycles.length > 0) {
        return { data: lastCycles[0], error: null };
      }
      return { data: null, error: null };
    } catch (error: any) {
      console.error('Error fetching active/last cycle:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // MONITORING VISITS - UNIFIED (with integrated medications & labs)
  // ============================================================================

  /**
   * إضافة زيارة متابعة متكاملة
   * تشمل: الهرمونات + السونار + الأدوية + التحاليل
   */
  async addVisit(input: AddVisitInput): Promise<ApiResponse<SmartMonitoringVisit>> {
    try {
      // Get visit number
      const { data: existingVisits } = await supabase
        .from('smart_monitoring_visits')
        .select('visit_number')
        .eq('cycle_id', input.cycle_id)
        .order('visit_number', { ascending: false })
        .limit(1);

      const visitNumber = (existingVisits?.[0]?.visit_number || 0) + 1;

      const visitData = {
        ...input,
        visit_number: visitNumber,
        needs_attention: false,
        ready_for_trigger: false,
        cancel_recommendation: false
      };

      const { data, error } = await supabase
        .from('smart_monitoring_visits')
        .insert([visitData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding visit:', error);
      return { data: null, error };
    }
  },

  /**
   * استخدام الدالة المدمجة لإضافة زيارة كاملة
   */
  async addCompleteVisit(
    cycleId: string,
    visitData: any
  ): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase.rpc('add_complete_visit', {
        p_cycle_id: cycleId,
        p_data: visitData
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding complete visit:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على زيارة متكاملة
   */
  async getCompleteVisit(visitId: string): Promise<ApiResponse<CompleteVisitView>> {
    try {
      const { data, error } = await supabase.rpc('get_complete_visit', {
        p_visit_id: visitId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching complete visit:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على جميع زيارات الدورة
   */
  async getCycleVisits(cycleId: string): Promise<ApiResponse<SmartMonitoringVisit[]>> {
    try {
      const { data, error } = await supabase
        .from('smart_monitoring_visits')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('visit_number', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching cycle visits:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث زيارة
   */
  async updateVisit(
    visitId: string,
    updates: Partial<SmartMonitoringVisit>
  ): Promise<ApiResponse<SmartMonitoringVisit>> {
    try {
      const { data, error } = await supabase
        .from('smart_monitoring_visits')
        .update(updates)
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating visit:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // COMPLETE IVF JOURNEY VIEW
  // ============================================================================

  /**
   * الحصول على رحلة IVF الكاملة المدمجة
   */
  async getIVFJourneyComplete(cycleId: string): Promise<ApiResponse<IVFJourneyComplete>> {
    try {
      const { data, error } = await supabase
        .from('ivf_journey_complete')
        .select('*')
        .eq('cycle_id', cycleId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching IVF journey:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // PROTOCOLS
  // ============================================================================

  /**
   * الحصول على بروتوكولات التنشيط المتاحة
   */
  async getProtocols(): Promise<ApiResponse<StimulationProtocol[]>> {
    try {
      const clinicId = await getCurrentClinicId();

      let query = supabase
        .from('stimulation_protocols_library')
        .select('*')
        .eq('is_active', true);

      if (clinicId) {
        query = query.or(`clinic_id.is.null,clinic_id.eq.${clinicId}`);
      }

      const { data, error } = await query.order('protocol_name');

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching protocols:', error);
      return { data: null, error };
    }
  },

  /**
   * اقتراح بروتوكول ذكي
   */
  async suggestProtocol(
    age: number,
    amh: number,
    afc: number,
    bmi?: number,
    previousCycles: number = 0
  ): Promise<ApiResponse<ProtocolSuggestion[]>> {
    try {
      const { data, error } = await supabase.rpc('suggest_protocol', {
        p_patient_age: age,
        p_amh: amh,
        p_afc: afc,
        p_bmi: bmi,
        p_previous_cycles: previousCycles
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error suggesting protocol:', error);
      return { data: null, error };
    }
  },

  /**
   * إنشاء بروتوكول مخصص
   */
  async createCustomProtocol(
    protocol: Omit<StimulationProtocol, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<StimulationProtocol>> {
    try {
      const doctorId = await getCurrentDoctorId();
      const clinicId = await getCurrentClinicId();

      const protocolData = {
        ...protocol,
        clinic_id: clinicId,
        is_custom: true,
        created_by: doctorId
      };

      const { data, error } = await supabase
        .from('stimulation_protocols_library')
        .insert([protocolData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating custom protocol:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // MEDICATIONS REFERENCE
  // ============================================================================

  /**
   * الحصول على الأدوية المرجعية
   */
  async getMedicationsReference(): Promise<ApiResponse<MedicationReference[]>> {
    try {
      const { data, error } = await supabase
        .from('medications_reference')
        .select('*')
        .eq('is_active', true)
        .order('medication_name');

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      return { data: null, error };
    }
  },

  /**
   * البحث عن دواء
   */
  async searchMedication(query: string): Promise<ApiResponse<MedicationReference[]>> {
    try {
      const { data, error } = await supabase
        .from('medications_reference')
        .select('*')
        .eq('is_active', true)
        .or(`medication_name.ilike.%${query}%,medication_name_ar.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error searching medication:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // LAB TESTS REFERENCE
  // ============================================================================

  /**
   * الحصول على التحاليل المرجعية
   */
  async getLabTestsReference(): Promise<ApiResponse<LabTestReference[]>> {
    try {
      const { data, error } = await supabase
        .from('lab_tests_reference')
        .select('*')
        .eq('is_active', true)
        .order('test_name');

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching lab tests:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // DAILY ANALYSIS
  // ============================================================================

  /**
   * الحصول على التحليل اليومي
   */
  async getDailyAnalysis(cycleId: string): Promise<ApiResponse<SmartDailyAnalysis[]>> {
    try {
      const { data, error } = await supabase
        .from('smart_daily_analysis')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('analysis_date', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching daily analysis:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // CLINICAL DECISIONS
  // ============================================================================

  /**
   * تسجيل قرار سريري
   */
  async logClinicalDecision(
    decision: Omit<ClinicalDecision, 'id' | 'decision_timestamp'>
  ): Promise<ApiResponse<ClinicalDecision>> {
    try {
      const doctorId = await getCurrentDoctorId();

      const decisionData = {
        ...decision,
        doctor_id: doctorId
      };

      const { data, error } = await supabase
        .from('clinical_decision_log')
        .insert([decisionData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error logging decision:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على سجل القرارات
   */
  async getCycleDecisions(cycleId: string): Promise<ApiResponse<ClinicalDecision[]>> {
    try {
      const { data, error } = await supabase
        .from('clinical_decision_log')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('decision_timestamp', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching decisions:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * حساب معدل نمو الحويصلات
   */
  async calculateFollicleGrowthRate(
    cycleId: string
  ): Promise<ApiResponse<{ avg_growth_rate: number; max_growth_rate: number; min_growth_rate: number }>> {
    try {
      const { data, error } = await supabase.rpc('calculate_follicle_growth_rate', {
        p_cycle_id: cycleId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error calculating growth rate:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على ملخص الدورة
   */
  async getCycleSummary(cycleId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_cycle_summary', {
        p_cycle_id: cycleId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching cycle summary:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // LEGACY SUPPORT - للدعم التراجعي
  // ============================================================================

  /**
   * الحصول على سجل الأدوية (يدمج من الجدول القديم والزيارات الجديدة)
   */
  async getCycleMedicationsHistory(cycleId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_cycle_medications_history', {
        p_cycle_id: cycleId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching medications history:', error);
      return { data: null, error };
    }
  },

  /**
   * الحصول على ملخص التحاليل (يدمج من الجدول القديم والزيارات الجديدة)
   */
  async getCycleLabsSummary(cycleId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_cycle_labs_summary', {
        p_cycle_id: cycleId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching labs summary:', error);
      return { data: null, error };
    }
  }
};

export default smartStimulationService;
