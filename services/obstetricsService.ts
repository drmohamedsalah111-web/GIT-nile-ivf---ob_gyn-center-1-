import { supabase } from './supabaseClient';
import { syncManager } from '../src/services/syncService';
import { db as localDB } from '../src/db/localDB';
import { networkStatus } from '../src/lib/networkStatus';
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
  // PREGNANCIES
  createPregnancy: async (pregnancy: Omit<Pregnancy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Get current user and ensure doctor record exists
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const doctor = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctor.error || !doctor.data) {
        throw new Error('Doctor profile missing. Please log out and sign in again.');
      }

      const pregnancyData = {
        ...pregnancy,
        doctor_id: doctor.data.id
      };

      try {
        // Save using sync manager for offline-first support
        return await syncManager.save('pregnancies', pregnancyData);
      } catch (error) {
        console.error('Failed to save pregnancy via sync manager:', error);
        // Fallback to direct Supabase if online
        if (networkStatus.getStatus()) {
          const { data, error: supabaseError } = await supabase
            .from('pregnancies')
            .insert([pregnancyData])
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase error inserting pregnancy:', supabaseError);
            throw new Error(`Failed to create pregnancy: ${supabaseError.message}`);
          }
          return data;
        }
        throw error;
      }
    } catch (err: any) {
      console.error('Exception in createPregnancy:', err);
      throw err;
    }
  },

  getPregnancyByPatient: async (patientId: string) => {
    try {
      // Try local DB first
      const localPregnancies = await localDB.pregnancies.where('patientId').equals(patientId).toArray();
      
      // Background sync if online
      if (networkStatus.getStatus()) {
        setTimeout(() => syncManager.read('pregnancies'), 0);
      }

      if (localPregnancies.length > 0 && localPregnancies[0].remoteId) {
        return localPregnancies[0];
      }
    } catch (error) {
      console.error('Error fetching local pregnancy, falling back to Supabase:', error);
    }
    
    // Fallback to Supabase
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
    try {
      // Save using sync manager for offline-first support
      return await syncManager.save('antenatal_visits', visit);
    } catch (error) {
      console.error('Failed to save ANC visit via sync manager:', error);
      // Fallback to direct Supabase if online
      if (networkStatus.getStatus()) {
        const { data, error: supabaseError } = await supabase
          .from('antenatal_visits')
          .insert([visit])
          .select()
          .single();

        if (supabaseError) throw supabaseError;
        return data;
      }
      throw error;
    }
  },

  getANCVisits: async (pregnancyId: string) => {
    try {
      // Try local DB first
      const localVisits = await localDB.visits.where('patientId').equals(pregnancyId).toArray();
      
      // Background sync
      setTimeout(() => syncManager.read('antenatal_visits'), 0);

      return localVisits.map((v: any) => ({
        id: v.remoteId || `local_${v.id}`,
        patient_id: v.patient_id,
        department: v.department,
        visit_date: v.visit_date,
        clinical_data: v.clinical_data,
        diagnosis: v.diagnosis,
        prescription: v.prescription,
        notes: v.notes,
        doctor_id: v.doctor_id,
        created_at: v.created_at,
        updated_at: v.updated_at
      }));
    } catch (error) {
      console.error('Error fetching local ANC visits, falling back to Supabase:', error);
      
      // Fallback to Supabase
      const { data, error: supabaseError } = await supabase
        .from('antenatal_visits')
        .select('*')
        .eq('pregnancy_id', pregnancyId)
        .order('visit_date', { ascending: false });

      if (supabaseError) throw supabaseError;
      return data;
    }
  },

  updateANCVisit: async (visitId: string, updates: Partial<AntenatalVisit>) => {
    try {
      // Try sync manager for update
      await syncManager.update('antenatal_visits', visitId, updates);
      return updates;
    } catch (error) {
      console.error('Failed to update ANC visit via sync manager:', error);
      // Fallback to direct Supabase if online
      if (networkStatus.getStatus()) {
        const { data, error: supabaseError } = await supabase
          .from('antenatal_visits')
          .update(updates)
          .eq('id', visitId)
          .select()
          .single();

        if (supabaseError) throw supabaseError;
        return data;
      }
      throw error;
    }
  },

  deleteANCVisit: async (visitId: string) => {
    try {
      // Try sync manager for delete
      await syncManager.update('antenatal_visits', visitId, { deleted: true });
    } catch (error) {
      console.error('Failed to delete ANC visit via sync manager:', error);
      // Fallback to direct Supabase if online
      if (networkStatus.getStatus()) {
        const { error: supabaseError } = await supabase
          .from('antenatal_visits')
          .delete()
          .eq('id', visitId);

        if (supabaseError) throw supabaseError;
      } else {
        throw error;
      }
    }
  },

  // BIOMETRY SCANS
  createBiometryScan: async (scan: Omit<BiometryScan, 'id' | 'created_at'>) => {
    try {
      // Save using sync manager for offline-first support
      return await syncManager.save('biometry_scans', scan);
    } catch (error) {
      console.error('Failed to save biometry scan via sync manager:', error);
      // Fallback to direct Supabase if online
      if (networkStatus.getStatus()) {
        const { data, error: supabaseError } = await supabase
          .from('biometry_scans')
          .insert([scan])
          .select()
          .single();

        if (supabaseError) throw supabaseError;
        return data;
      }
      throw error;
    }
  },

  getBiometryScans: async (pregnancyId: string) => {
    try {
      const localScans = await localDB.biometry_scans
        .where('pregnancy_id')
        .equals(pregnancyId)
        .toArray();
      
      if (networkStatus.getStatus()) {
        setTimeout(() => syncManager.read('biometry_scans'), 0);
      }

      if (localScans.length > 0) {
        return localScans.map((scan: any) => ({
          id: scan.remoteId || `local_${scan.id}`,
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
          created_at: scan.created_at,
          updated_at: scan.updated_at
        }));
      }
    } catch (error) {
      console.error('Error fetching local biometry scans, falling back to Supabase:', error);
    }
    
    const { data, error } = await supabase
      .from('biometry_scans')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .order('scan_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  updateBiometryScan: async (scanId: string, updates: Partial<BiometryScan>) => {
    try {
      // Try sync manager for update
      await syncManager.update('biometry_scans', scanId, updates);
      return updates;
    } catch (error) {
      console.error('Failed to update biometry scan via sync manager:', error);
      // Fallback to direct Supabase if online
      if (networkStatus.getStatus()) {
        const { data, error: supabaseError } = await supabase
          .from('biometry_scans')
          .update(updates)
          .eq('id', scanId)
          .select()
          .single();

        if (supabaseError) throw supabaseError;
        return data;
      }
      throw error;
    }
  },

  deleteBiometryScan: async (scanId: string) => {
    try {
      // Try sync manager for delete
      await syncManager.update('biometry_scans', scanId, { deleted: true });
    } catch (error) {
      console.error('Failed to delete biometry scan via sync manager:', error);
      // Fallback to direct Supabase if online
      if (networkStatus.getStatus()) {
        const { error: supabaseError } = await supabase
          .from('biometry_scans')
          .delete()
          .eq('id', scanId);

        if (supabaseError) throw supabaseError;
      } else {
        throw error;
      }
    }
  },
};
