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
  // 1. SMART GET: Resolves Local ID <-> Remote UUID to find ALL visits
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

      console.log(`🔍 Searching visits for Patient: ${patient.name} (IDs: ${possibleIds.join(', ')})`);

      // Query Local DB - check all possible ID formats
      const localVisits = await db.visits
        .filter(v => {
           const pId = v.patient_id;
           // Check if visit's patient_id matches ANY of the possible IDs
           return possibleIds.some(id => String(pId) === String(id));
        })
        .toArray();

      console.log(`✅ Found ${localVisits.length} visits for this patient`);

      // Trigger background sync to ensure we have latest data
      setTimeout(() => syncService.read('visits'), 0);

      return localVisits
        .map(mapToAppFormat)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (error) {
      console.error('Error fetching visits:', error);
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