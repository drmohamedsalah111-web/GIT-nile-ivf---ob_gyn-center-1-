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
      let targetIds: string[] = [patientId];

      // If it's a local numeric ID, find the remote UUID
      if (!isNaN(Number(patientId))) {
        const patient = await db.patients.get(Number(patientId));
        if (patient?.remoteId) targetIds.push(patient.remoteId);
      }
      // If it's a UUID, try to find the local numeric ID (optional but safe)
      else {
        const patient = await db.patients.where('remoteId').equals(patientId).first();
        if (patient?.id) targetIds.push(patient.id.toString());
      }

      console.log(`🔍 Searching visits for Patient IDs: ${targetIds.join(', ')}`);

      // Query Local DB for ANY match
      const localVisits = await db.visits
        .filter(v => {
           const pId = String(v.patient_id);
           return targetIds.includes(pId);
        })
        .toArray();

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