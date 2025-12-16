import { supabase } from './supabaseClient';
import { authService } from './authService';
import { Pregnancy, AntenatalVisit, BiometryScan } from '../types';

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export const calculateGestationalAge = (lmpDate: string | null | undefined): { weeks: number; days: number } => {
  if (!lmpDate || typeof lmpDate !== 'string' || lmpDate.trim() === '') {
    return { weeks: 0, days: 0 };
  }

  try {
    const timestamp = new Date(lmpDate).getTime();
    if (isNaN(timestamp)) {
      return { weeks: 0, days: 0 };
    }

    const today = new Date();
    const lmp = new Date(timestamp);
    const diffTime = Math.abs(today.getTime() - lmp.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.max(0, Math.floor(diffDays / 7));
    const days = Math.max(0, diffDays % 7);

    if (isNaN(weeks) || isNaN(days)) {
      return { weeks: 0, days: 0 };
    }

    return { weeks, days };
  } catch (error) {
    console.warn('Invalid LMP date provided to calculateGestationalAge:', lmpDate);
    return { weeks: 0, days: 0 };
  }
};

export const calculateEDD = (lmpDate: string | null | undefined): string => {
  if (!lmpDate || typeof lmpDate !== 'string' || lmpDate.trim() === '') {
    return '';
  }

  try {
    const timestamp = new Date(lmpDate).getTime();
    if (isNaN(timestamp)) {
      return '';
    }

    const lmp = new Date(timestamp);
    if (!lmp || isNaN(lmp.getTime())) {
      return '';
    }

    lmp.setDate(lmp.getDate() + 280);
    const eddString = lmp.toISOString().split('T')[0];

    if (!eddString) {
      return '';
    }

    return eddString;
  } catch (error) {
    console.warn('Invalid LMP date provided to calculateEDD:', lmpDate);
    return '';
  }
};

export const calculateGAFromEDD = (eddDate: string): { weeks: number; days: number } => {
  const today = new Date();
  const edd = new Date(eddDate);
  const diffTime = edd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalDaysToEDD = Math.max(0, diffDays);
  const totalGADays = 40 * 7 - totalDaysToEDD;
  const gaWeeks = Math.floor(totalGADays / 7);
  const gaDays = totalGADays % 7;
  return { weeks: Math.max(0, gaWeeks), days: Math.max(0, gaDays) };
};

// Hadlock formula for Estimated Fetal Weight (EFW)
export const calculateEFW = (
  bpdMm: number | null | undefined,
  hcMm: number | null | undefined,
  acMm: number | null | undefined,
  flMm: number | null | undefined
): number => {
  const inputs = [bpdMm, hcMm, acMm, flMm];

  if (inputs.some(input => input === null || input === undefined || isNaN(Number(input)))) {
    return 0;
  }

  const bpd = Number(bpdMm);
  const hc = Number(hcMm);
  const ac = Number(acMm);
  const fl = Number(flMm);

  if (bpd <= 0 || hc <= 0 || ac <= 0 || fl <= 0) {
    return 0;
  }

  try {
    const log10EFW =
      1.3404 +
      0.0438 * hc +
      0.158 * ac +
      0.0061 * bpd -
      0.002322 * ac * bpd;

    if (isNaN(log10EFW) || !isFinite(log10EFW)) {
      return 0;
    }

    const efw = Math.pow(10, log10EFW);

    if (isNaN(efw) || !isFinite(efw) || efw < 100 || efw > 5000) {
      return 0;
    }

    return Math.round(efw);
  } catch (error) {
    console.warn('Error calculating EFW with inputs:', { bpdMm, hcMm, acMm, flMm });
    return 0;
  }
};

// Calculate percentile based on RCOG/NICE standards (simplified)
export const calculatePercentile = (efwGrams: number, gaWeeks: number): number => {
  const expectedWeights: { [key: number]: { p10: number; p50: number; p90: number } } = {
    20: { p10: 300, p50: 330, p90: 370 },
    22: { p10: 430, p50: 475, p90: 540 },
    24: { p10: 600, p50: 660, p90: 750 },
    26: { p10: 760, p50: 850, p90: 980 },
    28: { p10: 1000, p50: 1100, p90: 1270 },
    30: { p10: 1300, p50: 1440, p90: 1680 },
    32: { p10: 1600, p50: 1840, p90: 2150 },
    34: { p10: 2100, p50: 2450, p90: 2850 },
    36: { p10: 2600, p50: 3000, p90: 3500 },
    38: { p10: 3000, p50: 3400, p90: 3900 },
    40: { p10: 3200, p50: 3500, p90: 3900 },
  };

  const weights = expectedWeights[gaWeeks];
  if (!weights) return 50;

  if (efwGrams <= weights.p10) return 10;
  if (efwGrams >= weights.p90) return 90;
  if (efwGrams <= weights.p50) {
    return 10 + ((efwGrams - weights.p10) / (weights.p50 - weights.p10)) * 40;
  }
  return 50 + ((efwGrams - weights.p50) / (weights.p90 - weights.p50)) * 40;
};

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export interface RiskFactors {
  age_over_40: boolean;
  bmi_over_30: boolean;
  previous_preeclampsia: boolean;
  twins: boolean;
  autoimmune: boolean;
  hypertension: boolean;
  diabetes: boolean;
  kidney_disease: boolean;
}

export const assessRiskLevel = (
  riskFactors: RiskFactors | null | undefined
): {
  level: 'low' | 'moderate' | 'high';
  riskFactorsList: string[];
  aspirinNeeded: boolean;
  thromboprophylaxisNeeded: boolean;
} => {
  // Provide safe defaults if riskFactors is null/undefined
  const safeRiskFactors = riskFactors || {
    age_over_40: false,
    bmi_over_30: false,
    previous_preeclampsia: false,
    twins: false,
    autoimmune: false,
    hypertension: false,
    diabetes: false,
    kidney_disease: false,
  };

  const highRiskFactors = [
    safeRiskFactors.previous_preeclampsia,
    safeRiskFactors.hypertension,
    safeRiskFactors.kidney_disease,
    safeRiskFactors.diabetes,
    safeRiskFactors.autoimmune,
  ].filter(Boolean).length;

  const moderateRiskFactors = [
    safeRiskFactors.age_over_40,
    safeRiskFactors.bmi_over_30,
    safeRiskFactors.twins,
  ].filter(Boolean).length;

  let level: 'low' | 'moderate' | 'high' = 'low';
  let aspirinNeeded = false;
  let thromboprophylaxisNeeded = false;
  const riskFactorsList: string[] = [];

  if (highRiskFactors >= 1) {
    level = 'high';
    aspirinNeeded = true;
  } else if (moderateRiskFactors >= 2) {
    level = 'high';
    aspirinNeeded = true;
  } else if (moderateRiskFactors >= 1 || highRiskFactors === 0) {
    level = 'moderate';
  }

  if (safeRiskFactors.twins) {
    thromboprophylaxisNeeded = true;
  }

  if (safeRiskFactors.age_over_40) riskFactorsList.push('Age > 40');
  if (safeRiskFactors.bmi_over_30) riskFactorsList.push('BMI > 30');
  if (safeRiskFactors.previous_preeclampsia) riskFactorsList.push('Previous Pre-eclampsia');
  if (safeRiskFactors.twins) riskFactorsList.push('Multiple Pregnancy');
  if (safeRiskFactors.autoimmune) riskFactorsList.push('Autoimmune Disease');
  if (safeRiskFactors.hypertension) riskFactorsList.push('Hypertension');
  if (safeRiskFactors.diabetes) riskFactorsList.push('Diabetes');
  if (safeRiskFactors.kidney_disease) riskFactorsList.push('Kidney Disease');

  return { level, riskFactorsList, aspirinNeeded, thromboprophylaxisNeeded };
};

// ============================================================================
// DUE ACTIONS / ALERTS
// ============================================================================

export const getDueActions = (gaWeeks: number): string[] => {
  const actions: string[] = [];

  // Early pregnancy actions
  if (gaWeeks >= 11 && gaWeeks <= 13) {
    actions.push('⚠️ Nuchal Translucency (NT) Scan Due');
  }
  if (gaWeeks >= 15 && gaWeeks <= 20) {
    actions.push('⚠️ Quad Screen / NIPT Results Expected');
  }
  if (gaWeeks >= 20 && gaWeeks <= 22) {
    actions.push('⚠️ Mid-Trimester Anomaly Scan Due');
  }
  if (gaWeeks === 28) {
    actions.push('💉 Anti-D Prophylaxis Due (if Rh negative)');
    actions.push('🧪 Glucose Tolerance Test (GTT) Due');
    actions.push('💉 Tetanus Booster if needed');
  }
  if (gaWeeks >= 34 && gaWeeks <= 36) {
    actions.push('⚠️ Growth Scan Recommended');
    actions.push('🧪 Full Blood Count (FBC)');
  }
  if (gaWeeks >= 36 && gaWeeks < 40) {
    actions.push('👶 Position Check (Cephalic/Breech)');
    actions.push('📋 Discuss Birth Plan');
  }

  // CRITICAL: Post-term pregnancy alerts
  if (gaWeeks >= 40 && gaWeeks < 42) {
    actions.push('⚠️ Patient Overdue: Discuss Membrane Sweep / Induction - مناقشة تمزيق الأغشية / الحث على الولادة');
  }
  if (gaWeeks >= 41 && gaWeeks < 42) {
    actions.push('🟠 Late Term: Schedule Induction of Labor - جدولة الحث على الولادة');
  }
  if (gaWeeks >= 42) {
    actions.push('🔴 POST TERM: CRITICAL - Immediate Delivery/Admission Required - حمل متأخر عن الموعد - ولادة فورية مطلوبة');
  }

  return actions;
};

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export const obstetricsService = {
  createPregnancy: async (pregnancy: Omit<Pregnancy, 'id' | 'created_at' | 'updated_at'>) => {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
    if (!doctor || !doctor.id) throw new Error('Doctor profile missing');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('pregnancies')
      .insert([{
        id,
        patient_id: pregnancy.patient_id,
        doctor_id: doctor.id,
        lmp_date: pregnancy.lmp_date,
        edd_date: pregnancy.edd_date,
        edd_by_scan: pregnancy.edd_by_scan,
        risk_level: pregnancy.risk_level,
        risk_factors: JSON.stringify(pregnancy.risk_factors || []),
        aspirin_prescribed: pregnancy.aspirin_prescribed ? true : false,
        thromboprophylaxis_needed: pregnancy.thromboprophylaxis_needed ? true : false,
        created_at: now,
        updated_at: now
      }]);

    if (error) throw error;

    return { id, ...pregnancy, created_at: now, updated_at: now };
  },

  getPregnancyByPatient: async (patientId: string) => {
    const { data: pregnancies, error } = await supabase
      .from('pregnancies')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!pregnancies || pregnancies.length === 0) return null;

    const p = pregnancies[0];
    return {
      ...p,
      risk_factors: p.risk_factors ? JSON.parse(p.risk_factors) : [],
      aspirin_prescribed: p.aspirin_prescribed === true,
      thromboprophylaxis_needed: p.thromboprophylaxis_needed === true
    };
  },

  updatePregnancy: async (pregnancyId: string, updates: Partial<Pregnancy>) => {
    const updateData: any = {};
    const now = new Date().toISOString();

    if (updates.lmp_date !== undefined) updateData.lmp_date = updates.lmp_date;
    if (updates.edd_date !== undefined) updateData.edd_date = updates.edd_date;
    if (updates.edd_by_scan !== undefined) updateData.edd_by_scan = updates.edd_by_scan;
    if (updates.risk_level !== undefined) updateData.risk_level = updates.risk_level;
    if (updates.risk_factors !== undefined) updateData.risk_factors = JSON.stringify(updates.risk_factors);
    if (updates.aspirin_prescribed !== undefined) updateData.aspirin_prescribed = updates.aspirin_prescribed;
    if (updates.thromboprophylaxis_needed !== undefined) updateData.thromboprophylaxis_needed = updates.thromboprophylaxis_needed;

    updateData.updated_at = now;

    const { error } = await supabase
      .from('pregnancies')
      .update(updateData)
      .eq('id', pregnancyId);

    if (error) throw error;
  },

  createANCVisit: async (visit: Omit<AntenatalVisit, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('antenatal_visits')
      .insert([{
        id,
        pregnancy_id: visit.pregnancy_id,
        visit_date: visit.visit_date,
        gestational_age_weeks: visit.gestational_age_weeks,
        gestational_age_days: visit.gestational_age_days,
        systolic_bp: visit.systolic_bp,
        diastolic_bp: visit.diastolic_bp,
        weight_kg: visit.weight_kg,
        urine_albuminuria: visit.urine_albuminuria,
        urine_glycosuria: visit.urine_glycosuria,
        fetal_heart_sound: visit.fetal_heart_sound,
        fundal_height_cm: visit.fundal_height_cm,
        edema: visit.edema ? true : false,
        edema_grade: visit.edema_grade,
        notes: visit.notes,
        next_visit_date: visit.next_visit_date,
        prescription: JSON.stringify(visit.prescription || []),
        created_at: now,
        updated_at: now
      }]);

    if (error) throw error;

    return { id, ...visit, created_at: now };
  },

  getANCVisits: async (pregnancyId: string) => {
    const { data: visits, error } = await supabase
      .from('antenatal_visits')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .order('visit_date', { ascending: false });

    if (error) throw error;

    return (visits || []).map((v: any) => ({
      ...v,
      edema: v.edema === true,
      prescription: v.prescription ? JSON.parse(v.prescription) : []
    }));
  },

  updateANCVisit: async (visitId: string, updates: Partial<AntenatalVisit>) => {
    const updateData: any = {};
    const now = new Date().toISOString();

    if (updates.visit_date !== undefined) updateData.visit_date = updates.visit_date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.systolic_bp !== undefined) updateData.systolic_bp = updates.systolic_bp;
    if (updates.diastolic_bp !== undefined) updateData.diastolic_bp = updates.diastolic_bp;
    if (updates.weight_kg !== undefined) updateData.weight_kg = updates.weight_kg;
    if (updates.urine_albuminuria !== undefined) updateData.urine_albuminuria = updates.urine_albuminuria;
    if (updates.urine_glycosuria !== undefined) updateData.urine_glycosuria = updates.urine_glycosuria;
    if (updates.fetal_heart_sound !== undefined) updateData.fetal_heart_sound = updates.fetal_heart_sound;
    if (updates.fundal_height_cm !== undefined) updateData.fundal_height_cm = updates.fundal_height_cm;
    if (updates.edema !== undefined) updateData.edema = updates.edema;
    if (updates.edema_grade !== undefined) updateData.edema_grade = updates.edema_grade;
    if (updates.next_visit_date !== undefined) updateData.next_visit_date = updates.next_visit_date;
    if (updates.prescription !== undefined) updateData.prescription = JSON.stringify(updates.prescription);
    if (updates.gestational_age_weeks !== undefined) updateData.gestational_age_weeks = updates.gestational_age_weeks;
    if (updates.gestational_age_days !== undefined) updateData.gestational_age_days = updates.gestational_age_days;

    updateData.updated_at = now;

    const { error } = await supabase
      .from('antenatal_visits')
      .update(updateData)
      .eq('id', visitId);

    if (error) throw error;
  },

  deleteANCVisit: async (visitId: string) => {
    const { error } = await supabase
      .from('antenatal_visits')
      .delete()
      .eq('id', visitId);

    if (error) throw error;
  },

  createBiometryScan: async (scan: Omit<BiometryScan, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('biometry_scans')
      .insert([{
        id,
        pregnancy_id: scan.pregnancy_id,
        scan_date: scan.scan_date,
        gestational_age_weeks: scan.gestational_age_weeks,
        gestational_age_days: scan.gestational_age_days,
        bpd_mm: scan.bpd_mm,
        hc_mm: scan.hc_mm,
        ac_mm: scan.ac_mm,
        fl_mm: scan.fl_mm,
        efw_grams: scan.efw_grams,
        percentile: scan.percentile,
        notes: scan.notes,
        created_at: now,
        updated_at: now
      }]);

    if (error) throw error;

    return { id, ...scan, created_at: now };
  },

  getBiometryScans: async (pregnancyId: string) => {
    const { data: scans, error } = await supabase
      .from('biometry_scans')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .order('scan_date', { ascending: false });

    if (error) throw error;

    return scans as BiometryScan[];
  },

  updateBiometryScan: async (scanId: string, updates: Partial<BiometryScan>) => {
    const updateData: any = {};
    const now = new Date().toISOString();

    if (updates.scan_date !== undefined) updateData.scan_date = updates.scan_date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.gestational_age_weeks !== undefined) updateData.gestational_age_weeks = updates.gestational_age_weeks;
    if (updates.gestational_age_days !== undefined) updateData.gestational_age_days = updates.gestational_age_days;
    if (updates.bpd_mm !== undefined) updateData.bpd_mm = updates.bpd_mm;
    if (updates.hc_mm !== undefined) updateData.hc_mm = updates.hc_mm;
    if (updates.ac_mm !== undefined) updateData.ac_mm = updates.ac_mm;
    if (updates.fl_mm !== undefined) updateData.fl_mm = updates.fl_mm;
    if (updates.efw_grams !== undefined) updateData.efw_grams = updates.efw_grams;
    if (updates.percentile !== undefined) updateData.percentile = updates.percentile;

    updateData.updated_at = now;

    const { error } = await supabase
      .from('biometry_scans')
      .update(updateData)
      .eq('id', scanId);

    if (error) throw error;
  },

  deleteBiometryScan: async (scanId: string) => {
    const { error } = await supabase
      .from('biometry_scans')
      .delete()
      .eq('id', scanId);

    if (error) throw error;
  },
};
