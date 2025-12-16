import { dbService } from './dbService';
import { Patient, IvfCycle, Visit, StimulationLog } from '../types';
import { supabase } from './supabaseClient';

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
    console.log(`🔍 Fetching full history for Patient ID: ${patientId}`);

    const [{ data: generalVisits, error: visitsError },
      { data: pregnancies, error: pregnanciesError },
      { data: ivfCycles, error: cyclesError }] = await Promise.all([
      supabase.from('visits').select('*').eq('patient_id', patientId),
      supabase.from('pregnancies').select('*').eq('patient_id', patientId),
      supabase.from('ivf_cycles').select('*').eq('patient_id', patientId)
    ]);

    if (visitsError) {
      console.error('❌ Error fetching general visits:', visitsError);
      throw visitsError;
    }
    if (pregnanciesError) {
      console.error('❌ Error fetching pregnancies:', pregnanciesError);
      throw pregnanciesError;
    }
    if (cyclesError) {
      console.error('❌ Error fetching IVF cycles:', cyclesError);
      throw cyclesError;
    }

    console.log(`📊 Found: ${generalVisits?.length || 0} general visits, ${pregnancies?.length || 0} pregnancies, ${ivfCycles?.length || 0} IVF cycles`);

    // Map general visits
    const mappedVisits = (generalVisits || []).map((v: any) => ({
      id: v.id,
      date: v.date || new Date().toISOString().split('T')[0],
      type: 'Visit' as const,
      department: v.department || 'General',
      diagnosis: v.diagnosis || '',
      summary: v.diagnosis || 'General visit',
      clinical_data: v.clinical_data ? JSON.parse(v.clinical_data) : {},
      prescription: v.prescription ? JSON.parse(v.prescription) : [],
      notes: v.notes || ''
    }));

    // Map pregnancies
    const mappedPregnancies = (pregnancies || []).map((p: any) => ({
      id: p.id,
      date: p.lmp_date || p.created_at,
      type: 'Pregnancy' as const,
      department: 'OBS',
      diagnosis: 'Pregnancy Started',
      summary: `EDD: ${p.edd_date || 'Unknown'} - Risk: ${p.risk_level || 'low'}`,
      clinical_data: {
        risk_level: p.risk_level,
        risk_factors: p.risk_factors ? JSON.parse(p.risk_factors) : []
      },
      prescription: [],
      notes: ''
    }));

    // Map IVF cycles
    const mappedIVF = (ivfCycles || []).map((c: any) => ({
      id: c.id,
      date: c.start_date,
      type: 'IVF' as const,
      department: 'IVF_STIM',
      diagnosis: `IVF Cycle - Protocol: ${c.protocol}`,
      summary: `Status: ${c.status}`,
      clinical_data: c.assessment_data ? JSON.parse(c.assessment_data) : {},
      prescription: [],
      notes: ''
    }));

    // Combine all
    const allHistory = [
      ...mappedVisits,
      ...mappedPregnancies,
      ...mappedIVF
    ];

    console.log(`✅ Total combined history: ${allHistory.length} items`);

    return allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
