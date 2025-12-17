import { dbService } from './dbService';
import { Patient, IvfCycle, Visit, StimulationLog } from '../types';
import { supabase } from './supabaseClient';

const parseJsonSafe = (value: any, fallback: any) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

export const calculateBMI = (weightKg: number, heightCm: number): { bmi: number; alert: boolean } => {
  if (!weightKg || !heightCm) return { bmi: 0, alert: false };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  return { bmi, alert: bmi > 30 };
};

export const calculateTMSC = (volume: number, concentration: number, motility: number): number => {
  if (!volume || !concentration || !motility) return 0;
  return parseFloat(((volume * concentration * motility) / 100).toFixed(2));
};

export const analyzeSemenAnalysis = (vol: number, conc: number, motility: number, morph: number): string => {
  const findings: string[] = [];
  if (vol < 1.5) findings.push("Hypospermia");
  if (conc < 15) findings.push("Oligozoospermia");
  if (motility < 40) findings.push("Asthenozoospermia");
  if (morph < 4) findings.push("Teratozoospermia");
  
  if (findings.length === 0) return "Normozoospermia (WHO 2021)";
  return findings.join(" + ");
};

export const classifyOvarianReserve = (amh?: number, afc?: number): 'Poor Responder' | 'Normal' | 'High Responder' => {
  if (!amh && !afc) return 'Normal';
  
  if ((amh && amh < 0.4) || (afc && afc < 5)) {
    return 'Poor Responder';
  }
  if ((amh && amh > 4.5) || (afc && afc > 25)) {
    return 'High Responder';
  }
  return 'Normal';
};

export const calculateMaturationRate = (totalOocytes: number, mii: number): number => {
  if (!totalOocytes || totalOocytes === 0) return 0;
  return parseFloat(((mii / totalOocytes) * 100).toFixed(1));
};

export const calculateFertilizationRate = (fertilized: number, mii: number): number => {
  if (!mii || mii === 0) return 0;
  return parseFloat(((fertilized / mii) * 100).toFixed(1));
};

export const getPatientFullHistory = async (patientId: string) => {
  try {
    const [visitsResult, pregnanciesResult, ivfCyclesResult] = await Promise.all([
      supabase.from('visits').select('*').eq('patient_id', patientId),
      supabase.from('pregnancies').select('*').eq('patient_id', patientId),
      supabase.from('ivf_cycles').select('*').eq('patient_id', patientId)
    ]);

    if (visitsResult.error) console.error('Error fetching visits:', visitsResult.error);
    if (pregnanciesResult.error) console.error('Error fetching pregnancies:', pregnanciesResult.error);
    if (ivfCyclesResult.error) console.error('Error fetching IVF cycles:', ivfCyclesResult.error);

    const visits = visitsResult.error ? [] : (visitsResult.data || []);
    const pregnancies = pregnanciesResult.error ? [] : (pregnanciesResult.data || []);
    const ivfCycles = ivfCyclesResult.error ? [] : (ivfCyclesResult.data || []);

    const parsedVisits = visits.map((visit: any) => ({
      id: visit.id,
      date: visit.date || visit.visit_date || visit.created_at,
      type: 'Visit' as const,
      department: visit.department || 'GYNA',
      diagnosis: visit.diagnosis || 'Visit',
      summary: visit.diagnosis || 'General visit',
      clinical_data: parseJsonSafe(visit.clinical_data, {}),
      prescription: parseJsonSafe(visit.prescription, []),
      notes: visit.notes || ''
    }));

    const parsedPregnancies = pregnancies.map((pregnancy: any) => ({
      id: pregnancy.id,
      date: pregnancy.lmp_date || pregnancy.created_at,
      type: 'Pregnancy' as const,
      department: 'OBS',
      diagnosis: 'Pregnancy',
      summary: `EDD: ${pregnancy.edd_date || 'Unknown'} | Risk: ${pregnancy.risk_level || 'low'}`,
      clinical_data: {
        risk_level: pregnancy.risk_level,
        risk_factors: parseJsonSafe(pregnancy.risk_factors, [])
      },
      prescription: [],
      notes: ''
    }));

    const parsedIvfCycles = ivfCycles.map((cycle: any) => ({
      id: cycle.id,
      date: cycle.start_date || cycle.created_at,
      type: 'IVF' as const,
      department: 'IVF_STIM',
      diagnosis: `IVF Cycle - Protocol: ${cycle.protocol}`,
      summary: `Status: ${cycle.status}`,
      clinical_data: parseJsonSafe(cycle.assessment_data, {}),
      prescription: [],
      notes: ''
    }));

    const ancVisitsPromises = pregnancies.map(async (pregnancy: any) => {
      const { data: ancVisits, error: ancError } = await supabase
        .from('antenatal_visits')
        .select('*')
        .eq('pregnancy_id', pregnancy.id);

      if (ancError) {
        console.error('Error fetching ANC visits:', ancError);
        return [];
      }

      return (ancVisits || []).map((visit: any) => ({
        id: visit.id,
        date: visit.visit_date,
        type: 'Visit' as const,
        department: 'OBS',
        diagnosis: `ANC Visit - GA ${visit.gestational_age_weeks}w+${visit.gestational_age_days}d`,
        summary: visit.notes || `ANC Visit - GA ${visit.gestational_age_weeks}w+${visit.gestational_age_days}d`,
        clinical_data: {
          systolic_bp: visit.systolic_bp,
          diastolic_bp: visit.diastolic_bp,
          weight_kg: visit.weight_kg,
          urine_albuminuria: visit.urine_albuminuria,
          urine_glycosuria: visit.urine_glycosuria,
          fetal_heart_sound: visit.fetal_heart_sound,
          fundal_height_cm: visit.fundal_height_cm,
          edema: visit.edema,
          edema_grade: visit.edema_grade,
          next_visit_date: visit.next_visit_date
        },
        prescription: parseJsonSafe(visit.prescription, []),
        notes: visit.notes || ''
      }));
    });

    const parsedAncVisits = (await Promise.all(ancVisitsPromises)).flat();

    const unifiedHistory = [
      ...parsedVisits,
      ...parsedPregnancies,
      ...parsedAncVisits,
      ...parsedIvfCycles
    ].filter(item => item.date);

    return unifiedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (error) {
    console.error('Error fetching patient full history:', error);
    return [];
  }
};

export const ivfService = {
  getPatientFullHistory,
  calculateBMI,
  calculateTMSC,
  analyzeSemenAnalysis,
  classifyOvarianReserve,
  calculateMaturationRate,
  calculateFertilizationRate,
  db: dbService
};

export const db = dbService;
