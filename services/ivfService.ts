
import { supabase } from './supabaseClient';
import { Patient, IvfCycle, Visit, StimulationLog } from '../types';

// Utility Functions (Local logic)
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

// Database Service (Supabase Async)
export const db = {
  // --- Patients ---
  getPatients: async (): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
    
    // Map snake_case DB columns to camelCase types if needed, 
    // or ensure types match DB. Assuming strict match or mapping here:
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      phone: p.phone,
      husbandName: p.husband_name,
      history: p.history,
      createdAt: p.created_at
    }));
  },

  savePatient: async (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) throw new Error('يجب تسجيل الدخول أولاً');

    const { data, error } = await supabase
      .from('patients')
      .insert([{
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        husband_name: patient.husbandName,
        history: patient.history,
        doctor_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- Visits ---
  getVisits: async (): Promise<Visit[]> => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) return [];
    return data as any; // Simplified for brevity
  },

  // --- Cycles ---
  getCycles: async (): Promise<IvfCycle[]> => {
    const { data, error } = await supabase
      .from('ivf_cycles')
      .select(`
        *,
        stimulation_logs (*)
      `)
      .order('start_date', { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data.map((c: any) => ({
      id: c.id,
      patientId: c.patient_id,
      protocol: c.protocol,
      startDate: c.start_date,
      status: c.status,
      logs: c.stimulation_logs.map((l: any) => ({
        id: l.id,
        date: l.date,
        cycleDay: l.cycle_day,
        fsh: l.fsh,
        hmg: l.hmg,
        e2: l.e2,
        lh: l.lh,
        rtFollicles: l.rt_follicles,
        ltFollicles: l.lt_follicles
      })) || [],
      lab: c.lab_data
    }));
  },

  saveCycle: async (cycle: Partial<IvfCycle> & { patientId: string }) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) throw new Error('يجب تسجيل الدخول أولاً');

    const { data, error } = await supabase
      .from('ivf_cycles')
      .insert([{
        patient_id: cycle.patientId,
        protocol: cycle.protocol,
        status: cycle.status,
        start_date: cycle.startDate,
        doctor_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- Logs ---
  addLog: async (cycleId: string, log: Partial<StimulationLog>) => {
    const { data, error } = await supabase
      .from('stimulation_logs')
      .insert([{
        cycle_id: cycleId,
        cycle_day: log.cycleDay,
        date: log.date,
        fsh: log.fsh || '',
        hmg: log.hmg || '',
        e2: log.e2 || '',
        lh: log.lh || '',
        rt_follicles: log.rtFollicles || '',
        lt_follicles: log.ltFollicles || '',
        endometrium_thickness: log.endometriumThickness || ''
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateLog: async (logId: string, updates: Partial<StimulationLog>) => {
    const dbUpdates: any = {};
    if (updates.fsh !== undefined) dbUpdates.fsh = updates.fsh;
    if (updates.hmg !== undefined) dbUpdates.hmg = updates.hmg;
    if (updates.e2 !== undefined) dbUpdates.e2 = updates.e2;
    if (updates.lh !== undefined) dbUpdates.lh = updates.lh;
    if (updates.rtFollicles !== undefined) dbUpdates.rt_follicles = updates.rtFollicles;
    if (updates.ltFollicles !== undefined) dbUpdates.lt_follicles = updates.ltFollicles;
    if (updates.endometriumThickness !== undefined) dbUpdates.endometrium_thickness = updates.endometriumThickness;
    
    const { error } = await supabase
      .from('stimulation_logs')
      .update(dbUpdates)
      .eq('id', logId);
    if (error) throw error;
  },

  updateCycleAssessment: async (cycleId: string, assessment: any) => {
    const { error } = await supabase
      .from('ivf_cycles')
      .update({ assessment_data: assessment })
      .eq('id', cycleId);
    if (error) throw error;
  },

  updateCycleLabData: async (cycleId: string, labData: any) => {
    const { error } = await supabase
      .from('ivf_cycles')
      .update({ lab_data: labData })
      .eq('id', cycleId);
    if (error) throw error;
  },

  updateCycleTransfer: async (cycleId: string, transferData: any) => {
    const { error } = await supabase
      .from('ivf_cycles')
      .update({ transfer_data: transferData })
      .eq('id', cycleId);
    if (error) throw error;
  },

  updateCycleOutcome: async (cycleId: string, outcomeData: any) => {
    const { error } = await supabase
      .from('ivf_cycles')
      .update({ outcome_data: outcomeData, status: 'Completed' })
      .eq('id', cycleId);
    if (error) throw error;
  }
};
