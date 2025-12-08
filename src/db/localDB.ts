import Dexie, { Table } from 'dexie';

// Define the sync status enum
export enum SyncStatus {
  SYNCED = 0,        // Successfully synced with server
  PENDING_CREATE = 1, // Created locally, needs to be pushed to server
  PENDING_UPDATE = 2, // Updated locally, needs to be pushed to server
  PENDING_DELETE = 3, // Marked for deletion, needs to be pushed to server
  ERROR = 4          // Sync failed, needs retry
}

// Patient interface for local storage
export interface LocalPatient {
  id?: number; // Auto-incremented local ID
  remoteId?: string; // Supabase ID (when synced)
  name: string;
  age?: number;
  phone: string;
  husbandName?: string;
  history?: string;
  doctor_id?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  last_sync_attempt?: string;
  sync_error?: string;
}

// Visit interface for local storage
export interface LocalVisit {
  id?: number;
  remoteId?: string;
  patient_id: string;
  department: string;
  visit_date: string;
  clinical_data?: any;
  diagnosis?: string;
  prescription?: any[];
  notes?: string;
  doctor_id?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  last_sync_attempt?: string;
  sync_error?: string;
}

// IVF Cycle interface for local storage
export interface LocalIVFCycle {
  id?: number;
  remoteId?: string;
  patient_id: string;
  protocol: string;
  start_date: string;
  status: string;
  assessment_data?: any;
  lab_data?: any;
  transfer_data?: any;
  outcome_data?: any;
  doctor_id?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  last_sync_attempt?: string;
  sync_error?: string;
}

// Stimulation Log interface for local storage
export interface LocalStimulationLog {
  id?: number;
  remoteId?: string;
  cycle_id: string;
  cycle_day: number;
  date: string;
  fsh?: string;
  hmg?: string;
  e2?: string;
  lh?: string;
  rt_follicles?: string;
  lt_follicles?: string;
  endometrium_thickness?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  last_sync_attempt?: string;
  sync_error?: string;
}

// Pregnancy interface for local storage
export interface LocalPregnancy {
  id?: number;
  remoteId?: string;
  patient_id: string;
  lmp_date?: string;
  edd_date?: string;
  risk_level?: string;
  aspirin_prescribed?: boolean;
  current_status?: string;
  clinical_data?: any;
  doctor_id?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  last_sync_attempt?: string;
  sync_error?: string;
}

// Biometry Scan interface for local storage
export interface LocalBiometryScan {
  id?: number;
  remoteId?: string;
  pregnancy_id: string;
  scan_date: string;
  gestational_age_weeks: number;
  gestational_age_days: number;
  bpd_mm?: number;
  hc_mm?: number;
  ac_mm?: number;
  fl_mm?: number;
  efw_grams?: number;
  percentile?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  last_sync_attempt?: string;
  sync_error?: string;
}

// Sync Queue for tracking failed operations
export interface SyncQueueItem {
  id?: number;
  table: string;
  operation: 'create' | 'update' | 'delete';
  localId: number;
  remoteId?: string;
  payload?: any;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: string;
  nextRetry?: string;
  created_at: string;
}

// Define the database class
export class ClinicLocalDB extends Dexie {
  patients!: Table<LocalPatient>;
  visits!: Table<LocalVisit>;
  ivf_cycles!: Table<LocalIVFCycle>;
  stimulation_logs!: Table<LocalStimulationLog>;
  pregnancies!: Table<LocalPregnancy>;
  biometry_scans!: Table<LocalBiometryScan>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('ClinicLocalDB');

    this.version(1).stores({
      patients: '++id, remoteId, name, phone, created_at, [sync_status]',
      visits: '++id, remoteId, patient_id, date, [sync_status]',
      ivf_cycles: '++id, remoteId, patient_id, status, [sync_status]',
      stimulation_logs: '++id, remoteId, cycle_id, [sync_status]',
      pregnancies: '++id, remoteId, patient_id, [sync_status]',
      biometry_scans: '++id, remoteId, pregnancy_id, [sync_status]',
      syncQueue: '++id, table, operation, retryCount, created_at'
    });
  }
}

// Create and export database instance
export const db = new ClinicLocalDB();

// Initialize database
export const initLocalDB = async (): Promise<void> => {
  try {
    await db.open();
    console.log('Local database initialized successfully');
  } catch (error) {
    console.error('Failed to open local database, attempting to recreate:', error);
    try {
      // If opening fails, delete and recreate the database
      await db.delete();
      console.log('Deleted corrupted database, recreating...');
      // Recreate the database instance
      const newDb = new ClinicLocalDB();
      Object.assign(db, newDb); // Replace the db instance
      await db.open();
      console.log('Local database recreated successfully');
    } catch (recreateError) {
      console.error('Failed to recreate local database:', recreateError);
      throw recreateError;
    }
  }

  try {
    // Create indexes for better query performance
    await db.patients.hook('creating', (primKey, obj, trans) => {
      if (!obj.created_at) {
        obj.created_at = new Date().toISOString();
      }
      if (!obj.updated_at) {
        obj.updated_at = new Date().toISOString();
      }
    });

    await db.visits.hook('creating', (primKey, obj, trans) => {
      if (!obj.created_at) {
        obj.created_at = new Date().toISOString();
      }
      if (!obj.updated_at) {
        obj.updated_at = new Date().toISOString();
      }
    });

    await db.ivf_cycles.hook('creating', (primKey, obj, trans) => {
      if (!obj.created_at) {
        obj.created_at = new Date().toISOString();
      }
      if (!obj.updated_at) {
        obj.updated_at = new Date().toISOString();
      }
    });

    await db.stimulation_logs.hook('creating', (primKey, obj, trans) => {
      if (!obj.created_at) {
        obj.created_at = new Date().toISOString();
      }
      if (!obj.updated_at) {
        obj.updated_at = new Date().toISOString();
      }
    });

    await db.pregnancies.hook('creating', (primKey, obj, trans) => {
      if (!obj.created_at) {
        obj.created_at = new Date().toISOString();
      }
      if (!obj.updated_at) {
        obj.updated_at = new Date().toISOString();
      }
    });

    await db.biometry_scans.hook('creating', (primKey, obj, trans) => {
      if (!obj.created_at) {
        obj.created_at = new Date().toISOString();
      }
      if (!obj.updated_at) {
        obj.updated_at = new Date().toISOString();
      }
    });

  } catch (hookError) {
    console.error('Failed to set up database hooks:', hookError);
    // Don't throw for hook errors, as database is still usable
  }
};

// Helper functions for database operations
export const getPendingSyncItems = async (table?: string): Promise<SyncQueueItem[]> => {
  if (table) {
    return await db.syncQueue.where('table').equals(table).toArray();
  }
  return await db.syncQueue.toArray();
};

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<number> => {
  return await db.syncQueue.add({
    ...item,
    created_at: new Date().toISOString()
  });
};

export const removeFromSyncQueue = async (id: number): Promise<void> => {
  await db.syncQueue.delete(id);
};

export const updateSyncQueueItem = async (id: number, updates: Partial<SyncQueueItem>): Promise<void> => {
  await db.syncQueue.update(id, updates);
};

export const markAsSynced = async (table: string, localId: number, remoteId?: string): Promise<void> => {
  const tableMap: { [key: string]: Table } = {
    patients: db.patients,
    visits: db.visits,
    ivf_cycles: db.ivf_cycles,
    stimulation_logs: db.stimulation_logs,
    pregnancies: db.pregnancies,
    biometry_scans: db.biometry_scans
  };

  const targetTable = tableMap[table];
  if (targetTable) {
    const updateData: any = {
      sync_status: SyncStatus.SYNCED,
      last_sync_attempt: new Date().toISOString(),
      sync_error: undefined
    };

    if (remoteId) {
      updateData.remoteId = remoteId;
    }

    await targetTable.update(localId, updateData);
  }
};

export const markSyncError = async (table: string, localId: number, error: string): Promise<void> => {
  const tableMap: { [key: string]: Table } = {
    patients: db.patients,
    visits: db.visits,
    ivf_cycles: db.ivf_cycles,
    stimulation_logs: db.stimulation_logs,
    pregnancies: db.pregnancies,
    biometry_scans: db.biometry_scans
  };

  const targetTable = tableMap[table];
  if (targetTable) {
    await targetTable.update(localId, {
      sync_status: SyncStatus.ERROR,
      last_sync_attempt: new Date().toISOString(),
      sync_error: error
    });
  }
};

export const getUnsyncedRecords = async (table: string): Promise<any[]> => {
  const tableMap: { [key: string]: Table } = {
    patients: db.patients,
    visits: db.visits,
    ivf_cycles: db.ivf_cycles,
    stimulation_logs: db.stimulation_logs,
    pregnancies: db.pregnancies,
    biometry_scans: db.biometry_scans
  };

  const targetTable = tableMap[table];
  if (targetTable) {
    return await targetTable.where('sync_status').above(SyncStatus.SYNCED).toArray();
  }
  return [];
};

export const getSyncStats = async (): Promise<{
  total: number;
  synced: number;
  pending: number;
  errors: number;
}> => {
  const [patients, visits, cycles, logs, pregnancies, biometryScans] = await Promise.all([
    db.patients.toArray(),
    db.visits.toArray(),
    db.ivf_cycles.toArray(),
    db.stimulation_logs.toArray(),
    db.pregnancies.toArray(),
    db.biometry_scans.toArray()
  ]);

  const allRecords = [...patients, ...visits, ...cycles, ...logs, ...pregnancies, ...biometryScans];

  return {
    total: allRecords.length,
    synced: allRecords.filter(r => r.sync_status === SyncStatus.SYNCED).length,
    pending: allRecords.filter(r => r.sync_status > SyncStatus.SYNCED && r.sync_status < SyncStatus.ERROR).length,
    errors: allRecords.filter(r => r.sync_status === SyncStatus.ERROR).length
  };
};