import { powerSyncDb } from '../src/powersync/client';
import { authService } from './authService';
import { Patient, IvfCycle, Visit, StimulationLog } from '../types';

// Utility Functions
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

export const db = {
  // --- Patients ---
  getPatients: async (): Promise<Patient[]> => {
    const patients = await powerSyncDb.getAll('SELECT * FROM patients');
    return patients.map((p: any) => ({
      id: p.id,
      name: p.name,
      age: p.age || 0,
      phone: p.phone,
      husbandName: p.husband_name || '',
      history: p.history || '',
      createdAt: p.created_at || new Date().toISOString()
    }));
  },

  savePatient: async (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
    if (!doctor || !doctor.id) throw new Error('فشل في العثور على ملف الطبيب');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await powerSyncDb.execute(
      'INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, patient.name, patient.age, patient.phone, patient.husbandName, patient.history, doctor.id, now, now]
    );

    return { id, ...patient, createdAt: now };
  },

  // --- Cycles ---
  getCycles: async (): Promise<IvfCycle[]> => {
    const cycles = await powerSyncDb.getAll('SELECT * FROM ivf_cycles');
    const logs = await powerSyncDb.getAll('SELECT * FROM stimulation_logs');

    return cycles.map((c: any) => {
      const cycleLogs = logs
        .filter((log: any) => log.cycle_id === c.id)
        .map((l: any) => ({
          id: l.id,
          date: l.date,
          cycleDay: l.cycle_day,
          fsh: l.fsh,
          hmg: l.hmg,
          e2: l.e2,
          lh: l.lh,
          rtFollicles: l.rt_follicles,
          ltFollicles: l.lt_follicles,
          endometriumThickness: l.endometrium_thickness
        }));

      // Parse JSON fields safely
      const parseJSON = (str: string) => {
        try { return str ? JSON.parse(str) : undefined; } catch (e) { return undefined; }
      };

      return {
        id: c.id,
        patientId: c.patient_id,
        protocol: c.protocol,
        startDate: c.start_date,
        status: c.status,
        logs: cycleLogs,
        lab: parseJSON(c.lab_data),
        transfer: parseJSON(c.transfer_data),
        outcome: parseJSON(c.outcome_data),
        assessment: parseJSON(c.assessment_data)
      };
    });
  },

  saveCycle: async (cycle: Partial<IvfCycle> & { patientId: string }) => {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
    if (!doctor || !doctor.id) throw new Error('فشل في العثور على ملف الطبيب');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await powerSyncDb.execute(
      `INSERT INTO ivf_cycles (id, patient_id, doctor_id, protocol, status, start_date, assessment_data, lab_data, transfer_data, outcome_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cycle.patientId,
        doctor.id,
        cycle.protocol,
        cycle.status,
        cycle.startDate,
        JSON.stringify(cycle.assessment || {}),
        JSON.stringify(cycle.lab || {}),
        JSON.stringify(cycle.transfer || {}),
        JSON.stringify(cycle.outcome || {}),
        now,
        now
      ]
    );

    return { id, ...cycle };
  },

  // --- Logs ---
  addLog: async (cycleId: string, log: Partial<StimulationLog>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await powerSyncDb.execute(
      `INSERT INTO stimulation_logs (id, cycle_id, cycle_day, date, fsh, hmg, e2, lh, rt_follicles, lt_follicles, endometrium_thickness, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cycleId,
        log.cycleDay,
        log.date,
        log.fsh || '',
        log.hmg || '',
        log.e2 || '',
        log.lh || '',
        log.rtFollicles || '',
        log.ltFollicles || '',
        log.endometriumThickness || '',
        now,
        now
      ]
    );

    return { id, ...log };
  },

  updateLog: async (logId: string, updates: Partial<StimulationLog>) => {
    const setClauses = [];
    const values = [];
    const now = new Date().toISOString();

    if (updates.fsh !== undefined) { setClauses.push('fsh = ?'); values.push(updates.fsh); }
    if (updates.hmg !== undefined) { setClauses.push('hmg = ?'); values.push(updates.hmg); }
    if (updates.e2 !== undefined) { setClauses.push('e2 = ?'); values.push(updates.e2); }
    if (updates.lh !== undefined) { setClauses.push('lh = ?'); values.push(updates.lh); }
    if (updates.rtFollicles !== undefined) { setClauses.push('rt_follicles = ?'); values.push(updates.rtFollicles); }
    if (updates.ltFollicles !== undefined) { setClauses.push('lt_follicles = ?'); values.push(updates.ltFollicles); }
    if (updates.endometriumThickness !== undefined) { setClauses.push('endometrium_thickness = ?'); values.push(updates.endometriumThickness); }

    setClauses.push('updated_at = ?');
    values.push(now);
    values.push(logId);

    await powerSyncDb.execute(
      `UPDATE stimulation_logs SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  },

  updateCycleAssessment: async (cycleId: string, assessment: any) => {
    const now = new Date().toISOString();
    await powerSyncDb.execute(
      'UPDATE ivf_cycles SET assessment_data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(assessment), now, cycleId]
    );
  },

  updateCycleLabData: async (cycleId: string, labData: any) => {
    const now = new Date().toISOString();
    await powerSyncDb.execute(
      'UPDATE ivf_cycles SET lab_data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(labData), now, cycleId]
    );
  },

  updateCycleTransfer: async (cycleId: string, transferData: any) => {
    const now = new Date().toISOString();
    await powerSyncDb.execute(
      'UPDATE ivf_cycles SET transfer_data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(transferData), now, cycleId]
    );
  },

  updateCycleOutcome: async (cycleId: string, outcomeData: any) => {
    const now = new Date().toISOString();
    await powerSyncDb.execute(
      'UPDATE ivf_cycles SET outcome_data = ?, status = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(outcomeData), 'Completed', now, cycleId]
    );
  }
};
