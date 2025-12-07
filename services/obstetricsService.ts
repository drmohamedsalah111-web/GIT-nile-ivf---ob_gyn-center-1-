import { supabase } from './supabaseClient';
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
  const weeksRemaining = Math.floor(diffDays / 7);
  const daysRemaining = diffDays % 7;
  const gaWeeks = 40 - weeksRemaining;
  const gaDays = 7 - daysRemaining;
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
  if (gaWeeks >= 36) {
    actions.push('👶 Position Check (Cephalic/Breech)');
    actions.push('📋 Discuss Birth Plan');
  }

  return actions;
};

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export const obstetricsService = {
  // PREGNANCIES
  createPregnancy: async (pregnancy: Omit<Pregnancy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pregnancies')
        .insert([pregnancy])
        .select()
        .single();

      if (error) {
        console.error('Supabase error inserting pregnancy:', error);
        throw new Error(`Failed to create pregnancy: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error('Exception in createPregnancy:', err);
      throw err;
    }
  },

  getPregnancyByPatient: async (patientId: string) => {
    const { data, error } = await supabase
      .from('pregnancies')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  updatePregnancy: async (pregnancyId: string, updates: Partial<Pregnancy>) => {
    const { data, error } = await supabase
      .from('pregnancies')
      .update(updates)
      .eq('id', pregnancyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ANTENATAL VISITS
  createANCVisit: async (visit: Omit<AntenatalVisit, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('antenatal_visits')
      .insert([visit])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getANCVisits: async (pregnancyId: string) => {
    const { data, error } = await supabase
      .from('antenatal_visits')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .order('visit_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  updateANCVisit: async (visitId: string, updates: Partial<AntenatalVisit>) => {
    const { data, error } = await supabase
      .from('antenatal_visits')
      .update(updates)
      .eq('id', visitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteANCVisit: async (visitId: string) => {
    const { error } = await supabase
      .from('antenatal_visits')
      .delete()
      .eq('id', visitId);

    if (error) throw error;
  },

  // BIOMETRY SCANS
  createBiometryScan: async (scan: Omit<BiometryScan, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('biometry_scans')
      .insert([scan])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getBiometryScans: async (pregnancyId: string) => {
    const { data, error } = await supabase
      .from('biometry_scans')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .order('scan_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  updateBiometryScan: async (scanId: string, updates: Partial<BiometryScan>) => {
    const { data, error } = await supabase
      .from('biometry_scans')
      .update(updates)
      .eq('id', scanId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteBiometryScan: async (scanId: string) => {
    const { error } = await supabase
      .from('biometry_scans')
      .delete()
      .eq('id', scanId);

    if (error) throw error;
  },
};
