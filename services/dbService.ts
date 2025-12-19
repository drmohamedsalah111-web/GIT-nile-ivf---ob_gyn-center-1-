import { supabase } from './supabaseClient';
import { authService } from './authService';
import { Patient, IvfCycle, StimulationLog } from '../types';

const parseAnyJson = <T,>(value: any, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return (value ? JSON.parse(value) : fallback) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const getDoctorIdOrThrow = async (): Promise<{ userId: string; doctorId: string }> => {
  const user = await authService.getCurrentUser();
  if (!user) throw new Error('غير مسجل الدخول');

  const { data: existingDoctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (doctorError) {
    console.error('Error checking doctor:', doctorError);
    throw doctorError;
  }

  if (existingDoctor?.id) {
    return { userId: user.id, doctorId: existingDoctor.id };
  }

  const created = await authService.ensureDoctorRecord(user.id, user.email || '');
  if (created?.id) {
    return { userId: user.id, doctorId: created.id };
  }

  throw new Error('فشل إنشاء ملف الطبيب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى');
};

export const dbService = {
  // --- Patients ---
  getPatients: async (searchQuery?: string): Promise<Patient[]> => {
    const query = (searchQuery || '').trim();
    const escapedQuery = query.replace(/,/g, '\\,');

    let supabaseQuery = supabase
      .from('patients')
      .select('*');

    if (escapedQuery) {
      const like = `%${escapedQuery}%`;
      supabaseQuery = supabaseQuery.or(`name.ilike.${like},phone.ilike.${like}`);
    }

    const { data, error } = await supabaseQuery.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      age: p.age || 0,
      phone: p.phone || p.mobile || '',
      husbandName: p.husband_name || '',
      history: p.history || '',
      createdAt: p.created_at || new Date().toISOString()
    }));
  },

  savePatient: async (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    try {
      const { doctorId } = await getDoctorIdOrThrow();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('patients')
        .insert([{
          id,
          name: patient.name,
          age: patient.age,
          phone: patient.phone,
          husband_name: patient.husbandName || null,
          history: patient.history || null,
          doctor_id: doctorId,
          created_at: now,
          updated_at: now
        }]);

      if (error) throw error;
      return { id, ...patient, createdAt: now };
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل حفظ بيانات المريضة${details}`);
    }
  },

  // --- Cycles ---
  getCycles: async (): Promise<IvfCycle[]> => {
    const { data: cycles, error: cyclesError } = await supabase
      .from('ivf_cycles')
      .select('*')
      .order('start_date', { ascending: false });

    if (cyclesError) throw cyclesError;

    const { data: logs, error: logsError } = await supabase
      .from('stimulation_logs')
      .select('*')
      .order('date', { ascending: false });

    if (logsError) throw logsError;

    return (cycles || []).map((c: any) => ({
      id: c.id,
      patientId: c.patient_id,
      protocol: c.protocol,
      startDate: c.start_date,
      status: c.status,
      logs: (logs || [])
        .filter((l: any) => l.cycle_id === c.id)
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
        })),
      lab: parseAnyJson<any>(c.lab_data, undefined),
      transfer: parseAnyJson<any>(c.transfer_data, undefined),
      outcome: parseAnyJson<any>(c.outcome_data, undefined),
      assessment: parseAnyJson<any>(c.assessment_data, undefined)
    }));
  },

  saveCycle: async (cycle: Partial<IvfCycle> & { patientId: string }) => {
    try {
      const { doctorId } = await getDoctorIdOrThrow();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('ivf_cycles')
        .insert([{
          id,
          patient_id: cycle.patientId,
          doctor_id: doctorId,
          protocol: cycle.protocol,
          status: cycle.status || 'Active',
          start_date: cycle.startDate,
          assessment_data: JSON.stringify(cycle.assessment || {}),
          lab_data: JSON.stringify(cycle.lab || {}),
          transfer_data: JSON.stringify(cycle.transfer || {}),
          outcome_data: JSON.stringify(cycle.outcome || {}),
          created_at: now,
          updated_at: now
        }]);

      if (error) throw error;
      return { id, ...cycle };
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      const code = error?.code ? ` (code: ${error.code})` : '';
      throw new Error(`فشل إنشاء دورة IVF${details}${code}`);
    }
  },

  // --- Logs ---
  addLog: async (cycleId: string, log: Partial<StimulationLog>) => {
    try {
      if (!cycleId) throw new Error('رقم الدورة غير صالح');
      if (!log.date || !log.cycleDay) throw new Error('من فضلك أدخل اليوم وتاريخ الزيارة');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('stimulation_logs')
        .insert([{
          id,
          cycle_id: cycleId,
          cycle_day: log.cycleDay,
          date: log.date,
          fsh: log.fsh || '',
          hmg: log.hmg || '',
          e2: log.e2 || '',
          lh: log.lh || '',
          rt_follicles: log.rtFollicles || '',
          lt_follicles: log.ltFollicles || '',
          endometrium_thickness: log.endometriumThickness || '',
          created_at: now,
          updated_at: now
        }]);

      if (error) throw error;
      return { id, ...log };
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل إضافة يوم جديد${details}`);
    }
  },

  updateLog: async (logId: string, updates: Partial<StimulationLog>) => {
    try {
      if (!logId) throw new Error('رقم اليوم غير صالح');

      const updateData: any = {};
      if (updates.fsh !== undefined) updateData.fsh = updates.fsh;
      if (updates.hmg !== undefined) updateData.hmg = updates.hmg;
      if (updates.e2 !== undefined) updateData.e2 = updates.e2;
      if (updates.lh !== undefined) updateData.lh = updates.lh;
      if (updates.rtFollicles !== undefined) updateData.rt_follicles = updates.rtFollicles;
      if (updates.ltFollicles !== undefined) updateData.lt_follicles = updates.ltFollicles;
      if (updates.endometriumThickness !== undefined) updateData.endometrium_thickness = updates.endometriumThickness;

      if (Object.keys(updateData).length === 0) return;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('stimulation_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) throw error;
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل تحديث بيانات اليوم${details}`);
    }
  },

  updateCycleAssessment: async (cycleId: string, assessment: any) => {
    try {
      if (!cycleId) throw new Error('رقم الدورة غير صالح');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ivf_cycles')
        .update({
          assessment_data: JSON.stringify(assessment || {}),
          updated_at: now
        })
        .eq('id', cycleId);

      if (error) throw error;
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل تحديث بيانات التقييم${details}`);
    }
  },

  updateCycleLabData: async (cycleId: string, labData: any) => {
    try {
      if (!cycleId) throw new Error('رقم الدورة غير صالح');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ivf_cycles')
        .update({
          lab_data: JSON.stringify(labData || {}),
          updated_at: now
        })
        .eq('id', cycleId);

      if (error) throw error;
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل تحديث بيانات المعمل${details}`);
    }
  },

  updateCycleTransfer: async (cycleId: string, transferData: any) => {
    try {
      if (!cycleId) throw new Error('رقم الدورة غير صالح');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ivf_cycles')
        .update({
          transfer_data: JSON.stringify(transferData || {}),
          updated_at: now
        })
        .eq('id', cycleId);

      if (error) throw error;
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل تحديث بيانات النقل${details}`);
    }
  },

  updateCycleOutcome: async (cycleId: string, outcomeData: any) => {
    try {
      if (!cycleId) throw new Error('رقم الدورة غير صالح');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ivf_cycles')
        .update({
          outcome_data: JSON.stringify(outcomeData || {}),
          status: 'Completed',
          updated_at: now
        })
        .eq('id', cycleId);

      if (error) throw error;
    } catch (error: any) {
      const details = error?.message ? `: ${error.message}` : '';
      throw new Error(`فشل تحديث نتيجة الدورة${details}`);
    }
  }
};

