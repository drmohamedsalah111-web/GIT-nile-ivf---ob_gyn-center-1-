import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/localDB';
import { syncService } from '../src/services/syncService';
import { Visit } from '../types';

// React hook for reactive visits data
export const useVisitsByPatient = (patientId: string) => {
  return useLiveQuery(async () => {
    if (!patientId) return [];
    return await db.visits.where('patient_id').equals(patientId).toArray();
  }, [patientId]);
};

// React hook for all visits (reactive)
export const useAllVisits = () => {
  return useLiveQuery(async () => {
    return await db.visits.toArray();
  }, []);
};

export const visitsService = {
  // READ: Get visits for a patient (from local DB - reactive via hooks)
  getVisitsByPatient: async (patientId: string) => {
    return await db.visits.where('patient_id').equals(patientId).toArray();
  },

  // READ: Get all visits (from local DB)
  getAllVisits: async () => {
    return await db.visits.toArray();
  },

  // WRITE: Save new visit (offline-first)
  saveVisit: async (params: {
    patientId: string;
    department: string;
    clinicalData: any;
    diagnosis?: string;
    prescription?: any[];
    notes?: string;
  }) => {
    const visitData = {
      patient_id: params.patientId,
      date: new Date().toISOString().split('T')[0],
      department: params.department,
      diagnosis: params.diagnosis || '',
      prescription: params.prescription || [],
      notes: params.notes || '',
      clinical_data: params.clinicalData,
    };

    return await syncService.saveItem('visits', visitData);
  },

  // WRITE: Update existing visit (offline-first)
  updateVisit: async (localId: number, updates: Partial<{
    patient_id: string;
    department: string;
    diagnosis: string;
    prescription: any[];
    notes: string;
    clinical_data: any;
  }>) => {
    return await syncService.updateItem('visits', localId, updates);
  },

  // WRITE: Delete visit (offline-first)
  deleteVisit: async (localId: number) => {
    return await syncService.deleteItem('visits', localId);
  },

  // Utility: Find local visit by remote ID
  findVisitByRemoteId: async (remoteId: string) => {
    return await db.visits.where('remoteId').equals(remoteId).first();
  },

  // Utility: Get visit by local ID
  getVisitById: async (localId: number) => {
    return await db.visits.get(localId);
  },

  // Legacy compatibility: Create visit (maps to saveVisit)
  createVisit: async (visit: Omit<Visit, 'id'>) => {
    return await syncService.saveItem('visits', {
      patient_id: visit.patientId,
      date: visit.date,
      department: visit.department,
      diagnosis: visit.diagnosis || '',
      prescription: visit.prescription || [],
      notes: visit.notes || '',
      clinical_data: visit.clinical_data || {}
    });
  },
};