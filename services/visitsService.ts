import { supabase } from './supabaseClient';
import { Visit } from '../types';

// Helper to map DB format to App format
const mapToAppFormat = (v: any): Visit => {
  let clinicalData = {};
  try {
    clinicalData = v.clinical_data ? JSON.parse(v.clinical_data) : {};
  } catch (e) {
    console.error('Error parsing clinical_data:', e);
  }

  let prescription = [];
  try {
    prescription = v.prescription ? JSON.parse(v.prescription) : [];
  } catch (e) {
    console.error('Error parsing prescription:', e);
  }

  return {
    id: v.id,
    patientId: v.patient_id,
    date: v.date || v.visit_date || new Date().toISOString(),
    department: v.department || 'General',
    diagnosis: v.diagnosis || '',
    prescription: prescription,
    notes: v.notes || '',
    clinical_data: clinicalData,
    vitals: (clinicalData as any)?.vitals
  };
};

export const visitsService = {
  getVisitsByPatient: async (patientId: string) => {
    try {
      console.log(`🔍 Fetching history for Patient ID: ${patientId}`);

      const [{ data: generalVisits, error: visitsError },
        { data: pregnancies, error: pregnanciesError },
        { data: ivfCycles, error: cyclesError }] = await Promise.all([
        supabase.from('visits').select('*').eq('patient_id', patientId),
        supabase.from('pregnancies').select('*').eq('patient_id', patientId),
        supabase.from('ivf_cycles').select('*').eq('patient_id', patientId)
      ]);

      if (visitsError) throw visitsError;
      if (pregnanciesError) throw pregnanciesError;
      if (cyclesError) throw cyclesError;

      console.log(`📊 Found: ${generalVisits?.length || 0} general visits, ${pregnancies?.length || 0} pregnancies, ${ivfCycles?.length || 0} IVF cycles`);

      const ancVisitsPromises = (pregnancies || []).map(async (pregnancy) => {
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
          patientId: patientId,
          date: visit.visit_date,
          department: 'OBS',
          diagnosis: `ANC Visit - GA ${visit.gestational_age_weeks}w+${visit.gestational_age_days}d`,
          prescription: visit.prescription ? JSON.parse(visit.prescription) : [],
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

      const ancVisitsArrays = await Promise.all(ancVisitsPromises);
      const allAncVisits = ancVisitsArrays.flat();

      const pregnancyStartVisits = (pregnancies || []).map((pregnancy) => ({
        id: `pregnancy_${pregnancy.id}`,
        patientId: patientId,
        date: pregnancy.lmp_date || pregnancy.created_at,
        department: 'OBS',
        diagnosis: 'Pregnancy Started',
        prescription: [],
        notes: `EDD: ${pregnancy.edd_date || 'Unknown'}`,
        clinical_data: {
          risk_level: pregnancy.risk_level,
          risk_factors: pregnancy.risk_factors ? JSON.parse(pregnancy.risk_factors) : []
        }
      }));

      const ivfVisits = (ivfCycles || []).map((cycle) => {
        let cycleData = {};
        try {
          cycleData = cycle.assessment_data ? JSON.parse(cycle.assessment_data) : {};
        } catch (e) { }

        return {
          id: cycle.id,
          patientId: patientId,
          date: cycle.start_date,
          department: 'IVF_STIM',
          diagnosis: `IVF Cycle - Protocol: ${cycle.protocol}`,
          prescription: [],
          notes: `Status: ${cycle.status}`,
          clinical_data: cycleData
        };
      });

      const allVisits = [
        ...(generalVisits || []).map(mapToAppFormat),
        ...allAncVisits,
        ...pregnancyStartVisits,
        ...ivfVisits
      ];

      console.log(`✅ Total combined history: ${allVisits.length} items`);

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
    console.log('💾 Saving Visit...', params);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const visitDate = now.split('T')[0];

    const { error } = await supabase
      .from('visits')
      .insert([{
        id,
        patient_id: params.patientId,
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