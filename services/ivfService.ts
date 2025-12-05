
import { supabase } from './supabaseClient';
import { Patient, IvfCycle, Visit, StimulationLog } from '../types';

// Utility Functions (Local logic)
export const calculateBMI = (weightKg: number, heightCm: number): { bmi: number; alert: boolean } => {
  if (!weightKg || !heightCm) return { bmi: 0, alert: false };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  return { bmi, alert: bmi > 30 };
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
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        husband_name: patient.husbandName,
        history: patient.history
      }])
      .select();
      
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
    const { data, error } = await supabase
      .from('ivf_cycles')
      .insert([{
        patient_id: cycle.patientId,
        protocol: cycle.protocol,
        status: cycle.status,
        start_date: cycle.startDate
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- Logs ---
  addLog: async (cycleId: string, log: Partial<StimulationLog>) => {
    const { error } = await supabase
      .from('stimulation_logs')
      .insert([{
        cycle_id: cycleId,
        cycle_day: log.cycleDay,
        date: log.date,
        fsh: log.fsh,
        hmg: log.hmg,
        e2: log.e2,
        lh: log.lh,
        rt_follicles: log.rtFollicles,
        lt_follicles: log.ltFollicles
      }]);
    if (error) throw error;
  },

  updateLog: async (logId: string, updates: Partial<StimulationLog>) => {
    const { error } = await supabase
      .from('stimulation_logs')
      .update({
        fsh: updates.fsh,
        hmg: updates.hmg,
        e2: updates.e2,
        lh: updates.lh,
        rt_follicles: updates.rtFollicles,
        lt_follicles: updates.ltFollicles
      })
      .eq('id', logId);
    if (error) throw error;
  }
};
