import { supabase } from './supabaseClient';
import { authService } from './authService';
import { Patient, IvfCycle, StimulationLog } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const executeWithRetry = async (fn: () => Promise<any>, context: string, retries = MAX_RETRIES): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === retries;
      console.error(`❌ [${context}] Attempt ${attempt}/${retries} failed:`, error?.message);
      
      if (isLastAttempt) {
        throw new Error(`${context} failed after ${retries} attempts: ${error?.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
};

export const dbService = {
  // --- Patients ---
  getPatients: async (): Promise<Patient[]> => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctor?.id) throw new Error('فشل في العثور على ملف الطبيب');

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', doctor.id);

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age || 0,
        phone: p.phone,
        husbandName: p.husband_name || '',
        history: p.history || '',
        createdAt: p.created_at || new Date().toISOString()
      }));
    } catch (error: any) {
      console.error('❌ getPatients error:', error?.message);
      throw new Error(`فشل في جلب قائمة المرضى: ${error?.message}`);
    }
  },

  savePatient: async (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctor?.id) throw new Error('فشل في العثور على ملف الطبيب');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await executeWithRetry(
        () => supabase.from('patients').insert({
          id,
          name: patient.name,
          age: patient.age,
          phone: patient.phone,
          husband_name: patient.husbandName,
          history: patient.history,
          doctor_id: doctor.id,
          created_at: now,
          updated_at: now
        }),
        'Save Patient'
      );

      return { id, ...patient, createdAt: now };
    } catch (error: any) {
      console.error('❌ savePatient error:', error?.message);
      throw new Error(`فشل في حفظ بيانات المريض: ${error?.message}`);
    }
  },

  // --- Cycles ---
  getCycles: async (): Promise<IvfCycle[]> => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctor?.id) throw new Error('فشل في العثور على ملف الطبيب');

      const [cyclesData, logsData] = await Promise.all([
        supabase.from('ivf_cycles').select('*').eq('doctor_id', doctor.id),
        supabase.from('stimulation_logs').select('*')
      ]);

      if (cyclesData.error) throw cyclesData.error;
      if (logsData.error) throw logsData.error;

      const cycles = cyclesData.data || [];
      const logs = logsData.data || [];

      const parseJSON = (str: string) => {
        try { return str ? JSON.parse(str) : undefined; } catch (e) { return undefined; }
      };

      return cycles.map((c: any) => ({
        id: c.id,
        patientId: c.patient_id,
        protocol: c.protocol,
        startDate: c.start_date,
        status: c.status,
        logs: logs
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
        lab: parseJSON(c.lab_data),
        transfer: parseJSON(c.transfer_data),
        outcome: parseJSON(c.outcome_data),
        assessment: parseJSON(c.assessment_data)
      }));
    } catch (error: any) {
      console.error('❌ getCycles error:', error?.message);
      throw new Error(`فشل في جلب دورات الحقن المجهري: ${error?.message}`);
    }
  },

  saveCycle: async (cycle: Partial<IvfCycle> & { patientId: string }) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctor?.id) throw new Error('فشل في العثور على ملف الطبيب');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await executeWithRetry(
        () => supabase.from('ivf_cycles').insert({
          id,
          patient_id: cycle.patientId,
          doctor_id: doctor.id,
          protocol: cycle.protocol,
          status: cycle.status || 'Active',
          start_date: cycle.startDate,
          assessment_data: JSON.stringify(cycle.assessment || {}),
          lab_data: JSON.stringify(cycle.lab || {}),
          transfer_data: JSON.stringify(cycle.transfer || {}),
          outcome_data: JSON.stringify(cycle.outcome || {}),
          created_at: now,
          updated_at: now
        }),
        'Save IVF Cycle'
      );

      return { id, ...cycle };
    } catch (error: any) {
      console.error('❌ saveCycle error:', error?.message);
      throw new Error(`فشل في حفظ دورة الحقن المجهري: ${error?.message}`);
    }
  },

  // --- Logs ---
  addLog: async (cycleId: string, log: Partial<StimulationLog>) => {
    try {
      if (!cycleId) throw new Error('معرف الدورة مطلوب');
      if (!log.date || !log.cycleDay) throw new Error('التاريخ ورقم اليوم مطلوب');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await executeWithRetry(
        () => supabase.from('stimulation_logs').insert({
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
        }),
        'Add Stimulation Log'
      );

      return { id, ...log };
    } catch (error: any) {
      console.error('❌ addLog error:', error?.message);
      throw new Error(`فشل في إضافة سجل التحفيز: ${error?.message}`);
    }
  },

  updateLog: async (logId: string, updates: Partial<StimulationLog>) => {
    try {
      if (!logId) throw new Error('معرف السجل مطلوب');

      const updateData: any = {};
      if (updates.fsh !== undefined) updateData.fsh = updates.fsh;
      if (updates.hmg !== undefined) updateData.hmg = updates.hmg;
      if (updates.e2 !== undefined) updateData.e2 = updates.e2;
      if (updates.lh !== undefined) updateData.lh = updates.lh;
      if (updates.rtFollicles !== undefined) updateData.rt_follicles = updates.rtFollicles;
      if (updates.ltFollicles !== undefined) updateData.lt_follicles = updates.ltFollicles;
      if (updates.endometriumThickness !== undefined) updateData.endometrium_thickness = updates.endometriumThickness;

      if (Object.keys(updateData).length === 0) throw new Error('لا توجد تحديثات للتطبيق');

      updateData.updated_at = new Date().toISOString();

      await executeWithRetry(
        () => supabase.from('stimulation_logs').update(updateData).eq('id', logId),
        'Update Stimulation Log'
      );
    } catch (error: any) {
      console.error('❌ updateLog error:', error?.message);
      throw new Error(`فشل في تحديث سجل التحفيز: ${error?.message}`);
    }
  },

  updateCycleAssessment: async (cycleId: string, assessment: any) => {
    try {
      if (!cycleId) throw new Error('معرف الدورة مطلوب');
      if (!assessment) throw new Error('بيانات التقييم مطلوبة');

      const now = new Date().toISOString();
      await executeWithRetry(
        () => supabase.from('ivf_cycles').update({
          assessment_data: JSON.stringify(assessment),
          updated_at: now
        }).eq('id', cycleId),
        'Update IVF Cycle Assessment'
      );
    } catch (error: any) {
      console.error('❌ updateCycleAssessment error:', error?.message);
      throw new Error(`فشل في حفظ التقييم: ${error?.message}`);
    }
  },

  updateCycleLabData: async (cycleId: string, labData: any) => {
    try {
      if (!cycleId) throw new Error('معرف الدورة مطلوب');
      if (!labData) throw new Error('بيانات المختبر مطلوبة');

      const now = new Date().toISOString();
      await executeWithRetry(
        () => supabase.from('ivf_cycles').update({
          lab_data: JSON.stringify(labData),
          updated_at: now
        }).eq('id', cycleId),
        'Update IVF Lab Data'
      );
    } catch (error: any) {
      console.error('❌ updateCycleLabData error:', error?.message);
      throw new Error(`فشل في حفظ بيانات المختبر: ${error?.message}`);
    }
  },

  updateCycleTransfer: async (cycleId: string, transferData: any) => {
    try {
      if (!cycleId) throw new Error('معرف الدورة مطلوب');
      if (!transferData) throw new Error('بيانات النقل مطلوبة');

      const now = new Date().toISOString();
      await executeWithRetry(
        () => supabase.from('ivf_cycles').update({
          transfer_data: JSON.stringify(transferData),
          updated_at: now
        }).eq('id', cycleId),
        'Update IVF Transfer Data'
      );
    } catch (error: any) {
      console.error('❌ updateCycleTransfer error:', error?.message);
      throw new Error(`فشل في حفظ بيانات النقل: ${error?.message}`);
    }
  },

  updateCycleOutcome: async (cycleId: string, outcomeData: any) => {
    try {
      if (!cycleId) throw new Error('معرف الدورة مطلوب');
      if (!outcomeData) throw new Error('بيانات النتيجة مطلوبة');

      const now = new Date().toISOString();
      await executeWithRetry(
        () => supabase.from('ivf_cycles').update({
          outcome_data: JSON.stringify(outcomeData),
          status: 'Completed',
          updated_at: now
        }).eq('id', cycleId),
        'Update IVF Cycle Outcome'
      );
    } catch (error: any) {
      console.error('❌ updateCycleOutcome error:', error?.message);
      throw new Error(`فشل في حفظ نتيجة الدورة: ${error?.message}`);
    }
  }
};
