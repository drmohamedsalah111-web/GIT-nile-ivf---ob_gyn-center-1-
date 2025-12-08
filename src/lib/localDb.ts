import Dexie, { Table } from 'dexie';

// Types for local database
export interface LocalPatient {
  id?: number; // Auto-incremented local ID
  remoteId: string; // Supabase ID
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
  createdAt: Date;
}

export interface LocalVisit {
  id?: number;
  remoteId: string;
  patientId: string;
  department: string;
  visitDate: string;
  clinicalData: any;
  diagnosis?: string;
  prescription?: any[];
  notes?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
  createdAt: Date;
}

export interface LocalPregnancy {
  id?: number;
  remoteId: string;
  patientId: string;
  lmpDate?: string;
  eddDate?: string;
  riskLevel?: string;
  aspirinPrescribed?: boolean;
  currentStatus?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
  createdAt: Date;
}

export interface LocalCycle {
  id?: number;
  remoteId: string;
  patientId: string;
  protocol: string;
  startDate: string;
  status: string;
  assessment?: any;
  logs?: any[];
  lab?: any;
  transfer?: any;
  outcome?: any;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
  createdAt: Date;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  action: 'insert' | 'update' | 'delete';
  payload: any;
  remoteId?: string;
  retryCount: number;
  lastAttempt?: Date;
  createdAt: Date;
}

export class ClinicDatabase extends Dexie {
  patients!: Table<LocalPatient>;
  visits!: Table<LocalVisit>;
  pregnancies!: Table<LocalPregnancy>;
  cycles!: Table<LocalCycle>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('ClinicDB');

    this.version(1).stores({
      patients: '++id, remoteId, name, phone, syncStatus, lastModified',
      visits: '++id, remoteId, patientId, visitDate, syncStatus, lastModified',
      pregnancies: '++id, remoteId, patientId, syncStatus, lastModified',
      cycles: '++id, remoteId, patientId, syncStatus, lastModified',
      syncQueue: '++id, table, action, retryCount, createdAt'
    });
  }
}

// Create and export database instance
export const db = new ClinicDatabase();

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    await db.open();
    console.log('Local database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize local database:', error);
    throw error;
  }
};

// Helper functions for database operations
export const getPendingSyncItems = async (): Promise<SyncQueueItem[]> => {
  return await db.syncQueue.where('retryCount').below(3).toArray();
};

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> => {
  await db.syncQueue.add({
    ...item,
    createdAt: new Date()
  });
};

export const removeFromSyncQueue = async (id: number): Promise<void> => {
  await db.syncQueue.delete(id);
};

export const updateSyncQueueRetry = async (id: number): Promise<void> => {
  await db.syncQueue.update(id, {
    retryCount: await db.syncQueue.get(id).then(item => (item?.retryCount || 0) + 1),
    lastAttempt: new Date()
  });
};

export const markAsSynced = async (table: string, localId: number): Promise<void> => {
  const tableMap: { [key: string]: Table } = {
    patients: db.patients,
    visits: db.visits,
    pregnancies: db.pregnancies,
    cycles: db.cycles
  };

  const targetTable = tableMap[table];
  if (targetTable) {
    await targetTable.update(localId, { syncStatus: 'synced' });
  }
};

export const getUnsyncedRecords = async (table: string): Promise<any[]> => {
  const tableMap: { [key: string]: Table } = {
    patients: db.patients,
    visits: db.visits,
    pregnancies: db.pregnancies,
    cycles: db.cycles
  };

  const targetTable = tableMap[table];
  if (targetTable) {
    return await targetTable.where('syncStatus').equals('pending').toArray();
  }
  return [];
};