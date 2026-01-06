import { supabase } from './supabaseClient';
import { Visit } from '../types';

const parseJsonSafe = <T,>(value: any, fallback: T): T => {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    return fallback;
  }
};

const mapToAppFormat = (row: any): Visit => {
  const clinicalData = parseJsonSafe<any>(row.clinical_data, {});
  const prescription = parseJsonSafe<any[]>(row.prescription, []);

  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date || row.visit_date || row.created_at || new Date().toISOString(),
    department: row.department || 'General',
    diagnosis: row.diagnosis || '',
    prescription,
    notes: row.notes || '',
    clinical_data: clinicalData,
    vitals: clinicalData?.vitals
  };
};

export const visitsService = {
  getVisitsByPatient: async (patientId: string) => {
    try {
      const [visitsResult, pregnanciesResult, cyclesResult] = await Promise.all([
        supabase.from('visits').select('*').eq('patient_id', patientId),
        supabase.from('pregnancies').select('*').eq('patient_id', patientId),
        supabase.from('ivf_cycles').select('*').eq('patient_id', patientId)
      ]);

      if (visitsResult.error) console.error('Error fetching visits:', visitsResult.error);
      if (pregnanciesResult.error) console.error('Error fetching pregnancies:', pregnanciesResult.error);
      if (cyclesResult.error) console.error('Error fetching IVF cycles:', cyclesResult.error);

      const visits = visitsResult.error ? [] : (visitsResult.data || []);
      const pregnancies = pregnanciesResult.error ? [] : (pregnanciesResult.data || []);
      const ivfCycles = cyclesResult.error ? [] : (cyclesResult.data || []);

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
          patientId,
          date: visit.visit_date,
          department: 'OBS',
          diagnosis: `ANC Visit - GA ${visit.gestational_age_weeks}w+${visit.gestational_age_days}d`,
          prescription: parseJsonSafe<any[]>(visit.prescription, []),
          notes: visit.notes || '',
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
          }
        }));
      });

      const allAncVisits = (await Promise.all(ancVisitsPromises)).flat();

      const pregnancyStartVisits = pregnancies.map((pregnancy: any) => ({
        id: `pregnancy_${pregnancy.id}`,
        patientId,
        date: pregnancy.lmp_date || pregnancy.created_at,
        department: 'OBS',
        diagnosis: 'Pregnancy Started',
        prescription: [],
        notes: `EDD: ${pregnancy.edd_date || 'Unknown'}`,
        clinical_data: {
          risk_level: pregnancy.risk_level,
          risk_factors: parseJsonSafe<any[]>(pregnancy.risk_factors, [])
        }
      }));

      const ivfVisits = ivfCycles.map((cycle: any) => ({
        id: cycle.id,
        patientId,
        date: cycle.start_date || cycle.created_at,
        department: 'IVF_STIM',
        diagnosis: `IVF Cycle - Protocol: ${cycle.protocol}`,
        prescription: [],
        notes: `Status: ${cycle.status}`,
        clinical_data: parseJsonSafe<any>(cycle.assessment_data, {})
      }));

      const allVisits: Visit[] = [
        ...visits.map(mapToAppFormat),
        ...allAncVisits,
        ...pregnancyStartVisits,
        ...ivfVisits
      ].filter(v => v.date) as Visit[];

      return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching patient history:', error);
      return [];
    }
  },

  saveVisit: async (params: {
    patientId: string;
    department: string;
    clinicalData: any;
    diagnosis?: string;
    prescription?: any[];
    notes?: string;
  }) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const visitDate = now.split('T')[0];

    // Get doctor_id from patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('doctor_id')
      .eq('id', params.patientId)
      .single();

    if (patientError || !patient) {
      throw new Error('Patient not found or no doctor assigned');
    }

    const { error } = await supabase
      .from('visits')
      .insert([{
        id,
        patient_id: params.patientId,
        doctor_id: patient.doctor_id,
        date: visitDate,
        department: params.department,
        diagnosis: params.diagnosis || '',
        prescription: JSON.stringify(params.prescription || []),
        notes: params.notes || '',
        clinical_data: JSON.stringify(params.clinicalData || {}),
        created_at: now,
        updated_at: now
      }]);

    if (error) throw error;

    return id;
  },

  getAllVisits: async () => {
    const { data: visits, error } = await supabase
      .from('visits')
      .select('*');

    if (error) throw error;

    return (visits || []).map(mapToAppFormat);
  },

  deleteVisit: async (id: string) => {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
