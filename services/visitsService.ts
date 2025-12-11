import { powerSyncDb } from '../src/powersync/client';
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
  // 1. Get all visits for a patient from PowerSync
  getVisitsByPatient: async (patientId: string) => {
    try {
      console.log(`🔍 Fetching history for Patient ID: ${patientId}`);

      // Parallel queries for all data sources
      const [generalVisits, pregnancies, ivfCycles] = await Promise.all([
        // 1. General/Gynecology Visits
        powerSyncDb.getAll('SELECT * FROM visits WHERE patient_id = ?', [patientId]) as Promise<any[]>,

        // 2. Pregnancies (for ANC visits)
        powerSyncDb.getAll('SELECT * FROM pregnancies WHERE patient_id = ?', [patientId]) as Promise<any[]>,

        // 3. IVF Cycles
        powerSyncDb.getAll('SELECT * FROM ivf_cycles WHERE patient_id = ?', [patientId]) as Promise<any[]>
      ]);

      console.log(`📊 Found: ${generalVisits.length} general visits, ${pregnancies.length} pregnancies, ${ivfCycles.length} IVF cycles`);

      // Process ANC visits from pregnancies
      const ancVisitsPromises = pregnancies.map(async (pregnancy) => {
        const ancVisits = await powerSyncDb.getAll(
          'SELECT * FROM antenatal_visits WHERE pregnancy_id = ?',
          [pregnancy.id]
        ) as any[];

        return ancVisits.map((visit: any) => ({
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

      // Create pregnancy start visits
      const pregnancyStartVisits = pregnancies.map((pregnancy) => ({
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

      // Map IVF cycles to visits
      const ivfVisits = ivfCycles.map((cycle) => {
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

      // Combine all visits
      const allVisits = [
        ...generalVisits.map(mapToAppFormat),
        ...allAncVisits,
        ...pregnancyStartVisits,
        ...ivfVisits
      ];

      console.log(`✅ Total combined history: ${allVisits.length} items`);

      // Sort by date descending (newest first)
      return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (error) {
      console.error('Error fetching patient history:', error);
      return [];
    }
  },

  // 2. Save Visit
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

    await powerSyncDb.execute(
      `INSERT INTO visits (id, patient_id, date, department, diagnosis, prescription, notes, clinical_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.patientId,
        visitDate,
        params.department,
        params.diagnosis || '',
        JSON.stringify(params.prescription || []),
        params.notes || '',
        JSON.stringify(params.clinicalData || {}),
        now,
        now
      ]
    );

    return id;
  },

  getAllVisits: async () => {
    const visits = await powerSyncDb.getAll('SELECT * FROM visits');
    return visits.map(mapToAppFormat);
  },

  deleteVisit: async (id: string) => {
    await powerSyncDb.execute('DELETE FROM visits WHERE id = ?', [id]);
  }
};