import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/localDB';
import { syncService } from '../src/services/syncService';
import { Visit } from '../types';

// Helper to map DB format (snake_case) to App format (camelCase)
const mapToAppFormat = (v: any): Visit => ({
  id: v.remoteId || v.id?.toString() || '',
  patientId: v.patient_id || v.patientId, // Handle both cases
  date: v.visit_date || v.date || new Date().toISOString(),
  department: v.department || 'General',
  diagnosis: v.diagnosis || '',
  prescription: v.prescription || [],
  notes: v.notes || '',
  clinical_data: v.clinical_data || {},
  vitals: v.clinical_data?.vitals // Extract vitals if nested
});

export const visitsService = {
  // 1. SMART GET: Resolves Local ID <-> Remote UUID to find ALL visits from multiple sources
  getVisitsByPatient: async (patientId: string) => {
    try {
      // Get the patient to access both ID and remoteId
      let patient: any = null;

      if (!isNaN(Number(patientId))) {
        // patientId is numeric - get from local DB
        patient = await db.patients.get(Number(patientId));
      } else {
        // patientId is UUID - find by remoteId
        patient = await db.patients.where('remoteId').equals(patientId).first();
      }

      if (!patient) {
        console.warn(`❌ Patient not found: ${patientId}`);
        return [];
      }

      // Build all possible IDs that could link to this patient
      const possibleIds = [
        String(patient.id),           // numeric ID as string
        String(patient.remoteId),     // UUID as string
        patient.id,                   // numeric ID as number
        patient.remoteId              // UUID as is
      ].filter(Boolean);

      console.log(`🔍 Searching all history for Patient: ${patient.name} (IDs: ${possibleIds.join(', ')})`);

      // Parallel queries for all data sources
      const [generalVisits, pregnancies, ivfCycles] = await Promise.all([
        // 1. General/Gynecology Visits
        db.visits
          .filter(v => {
             const pId = v.patient_id;
             return possibleIds.some(id => String(pId) === String(id));
          })
          .toArray(),

        // 2. Pregnancies (for ANC visits)
        db.pregnancies
          .filter(p => {
             const pId = p.patient_id;
             return possibleIds.some(id => String(pId) === String(id));
          })
          .toArray(),

        // 3. IVF Cycles
        db.ivf_cycles
          .filter(c => {
             const pId = c.patient_id;
             return possibleIds.some(id => String(pId) === String(id));
          })
          .toArray()
      ]);

      console.log(`📊 Found: ${generalVisits.length} general visits, ${pregnancies.length} pregnancies, ${ivfCycles.length} IVF cycles`);

      // Process ANC visits from pregnancies
      const ancVisitsPromises = pregnancies.map(async (pregnancy) => {
        const pregnancyId = pregnancy.remoteId || `local_${pregnancy.id}`;
        const ancVisits = await db.antenatal_visits
          .where('pregnancy_id').equals(pregnancyId)
          .or('pregnancy_id').equals(String(pregnancy.id))
          .toArray();

        return ancVisits.map((visit: any) => ({
          id: visit.remoteId || `local_${visit.id}`,
          patientId: patientId,
          date: visit.visit_date,
          department: 'OBS',
          diagnosis: `ANC Visit - GA ${visit.gestational_age_weeks}w+${visit.gestational_age_days}d`,
          prescription: visit.prescription || [],
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
          risk_factors: pregnancy.risk_factors
        }
      }));

      // Map IVF cycles to visits
      const ivfVisits = ivfCycles.map((cycle) => ({
        id: cycle.remoteId || `local_${cycle.id}`,
        patientId: patientId,
        date: cycle.start_date,
        department: 'IVF_STIM',
        diagnosis: `IVF Cycle - Protocol: ${cycle.protocol}`,
        prescription: [],
        notes: `Status: ${cycle.status}`,
        clinical_data: cycle.cycleData || {}
      }));

      // Combine all visits
      const allVisits = [
        ...generalVisits.map(mapToAppFormat),
        ...allAncVisits,
        ...pregnancyStartVisits,
        ...ivfVisits
      ];

      console.log(`✅ Total combined history: ${allVisits.length} items`);

      // Trigger background sync for all tables
      setTimeout(() => {
        syncService.read('visits');
        syncService.read('pregnancies');
        syncService.read('antenatal_visits');
        syncService.read('ivf_cycles');
      }, 0);

      // Sort by date descending (newest first)
      return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (error) {
      console.error('Error fetching patient history:', error);
      return [];
    }
  },

  // 2. ROBUST SAVE: Ensures correct mapping before saving
  saveVisit: async (params: {
    patientId: string;
    department: string;
    clinicalData: any;
    diagnosis?: string;
    prescription?: any[];
    notes?: string;
  }) => {
    console.log('💾 Saving Visit...', params);

    // Prepare data for DB (snake_case is preferred for Supabase/Dexie consistency)
    const visitData = {
      patient_id: params.patientId, // Save as patient_id for consistency
      visit_date: new Date().toISOString().split('T')[0], // Standardize date format
      department: params.department,
      diagnosis: params.diagnosis || '',
      prescription: params.prescription || [],
      notes: params.notes || '',
      clinical_data: params.clinicalData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to 'visits' table (which SyncService maps to 'antenatal_visits' or 'visits' depending on context)
    // Note: Ensure your SyncService handles the table mapping if needed, or save to specific tables.
    // For now, assuming 'visits' is the general table.
    return await syncService.saveItem('visits', visitData);
  },

  getAllVisits: async () => {
    const visits = await db.visits.toArray();
    return visits.map(mapToAppFormat);
  },

  deleteVisit: async (localId: number) => {
    return await syncService.deleteItem('visits', localId);
  }
};