import { supabase } from './supabaseClient';
import { authService } from './authService';
import { Patient, IvfCycle, StimulationLog } from '../types';
import { powerSyncDb } from '../src/powersync/client';

// PowerSync handles retries and offline queuing automatically

export const dbService = {
  // --- Patients ---
  getPatients: async (): Promise<Patient[]> => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctor?.id) throw new Error('فشل في العثور على ملف الطبيب');

      const patients = await powerSyncDb.getAll(
        'SELECT * FROM patients WHERE doctor_id = ? ORDER BY name',
        [doctor.id]
      );

      return patients.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age || 0,
        phone: p.phone,
        husbandName: p.husband_name || '',
        history: p.history || '',
        createdAt: p.created_at || new Date().toISOString()
      })) || [];
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

      // Write to PowerSync (offline-first)
      await powerSyncDb.execute(
        `INSERT INTO patients (id, name, age, phone, husband_name, history, doctor_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, patient.name, patient.age, patient.phone, patient.husbandName, patient.history, doctor.id, now, now]
      );

      console.log('✅ Patient saved to PowerSync:', id);
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

      const cycles = await powerSyncDb.getAll(
        'SELECT * FROM ivf_cycles WHERE doctor_id = ? ORDER BY start_date DESC',
        [doctor.id]
      );

      const logs = await powerSyncDb.getAll(
        'SELECT * FROM stimulation_logs ORDER BY date DESC'
      );

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

      // Write to PowerSync (offline-first)
      await powerSyncDb.execute(
        `INSERT INTO ivf_cycles (id, patient_id, doctor_id, protocol, status, start_date, assessment_data, lab_data, transfer_data, outcome_data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, cycle.patientId, doctor.id, cycle.protocol, cycle.status || 'Active', cycle.startDate,
         JSON.stringify(cycle.assessment || {}), JSON.stringify(cycle.lab || {}),
         JSON.stringify(cycle.transfer || {}), JSON.stringify(cycle.outcome || {}), now, now]
      );

      console.log('✅ IVF Cycle saved to PowerSync:', id);
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

      // Write to PowerSync (offline-first)
      await powerSyncDb.execute(
        `INSERT INTO stimulation_logs (id, cycle_id, cycle_day, date, fsh, hmg, e2, lh, rt_follicles, lt_follicles, endometrium_thickness, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, cycleId, log.cycleDay, log.date, log.fsh || '', log.hmg || '', log.e2 || '',
         log.lh || '', log.rtFollicles || '', log.ltFollicles || '', log.endometriumThickness || '', now, now]
      );

      console.log('✅ Stimulation log saved to PowerSync:', id);
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

      // Build dynamic UPDATE query
      const setParts = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(logId); // Add logId at the end

      await powerSyncDb.execute(
        `UPDATE stimulation_logs SET ${setParts} WHERE id = ?`,
        values
      );

      console.log('✅ Stimulation log updated in PowerSync:', logId);
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
      await powerSyncDb.execute(
        `UPDATE ivf_cycles SET assessment_data = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(assessment), now, cycleId]
      );

      console.log('✅ Cycle assessment updated in PowerSync:', cycleId);
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
      await powerSyncDb.execute(
        `UPDATE ivf_cycles SET lab_data = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(labData), now, cycleId]
      );

      console.log('✅ Cycle lab data updated in PowerSync:', cycleId);
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
      await powerSyncDb.execute(
        `UPDATE ivf_cycles SET transfer_data = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(transferData), now, cycleId]
      );

      console.log('✅ Cycle transfer data updated in PowerSync:', cycleId);
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
      await powerSyncDb.execute(
        `UPDATE ivf_cycles SET outcome_data = ?, status = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(outcomeData), 'Completed', now, cycleId]
      );

      console.log('✅ Cycle outcome updated in PowerSync:', cycleId);
    } catch (error: any) {
      console.error('❌ updateCycleOutcome error:', error?.message);
      throw new Error(`فشل في حفظ نتيجة الدورة: ${error?.message}`);
    }
  }
};
