import Dexie, { Table } from 'dexie';

export enum SyncStatus { SYNCED = 0, PENDING_CREATE = 1, PENDING_UPDATE = 2, PENDING_DELETE = 3, ERROR = 4 }

// Interfaces
export interface LocalPatient { id?: number; remoteId?: string; name: string; age?: number; phone: string; husbandName?: string; history?: string; doctor_id?: string; created_at?: string; updated_at?: string; sync_status: SyncStatus; }
export interface LocalVisit { id?: number; remoteId?: string; patient_id: string; pregnancy_id?: string; department: string; visit_date: string; clinical_data?: any; diagnosis?: string; prescription?: any[]; notes?: string; doctor_id?: string; created_at?: string; updated_at?: string; sync_status: SyncStatus; }
export interface LocalIVFCycle { id?: number; remoteId?: string; patient_id: string; protocol: string; start_date: string; status: string; assessment_data?: any; lab_data?: any; transfer_data?: any; outcome_data?: any; doctor_id?: string; created_at?: string; updated_at?: string; sync_status: SyncStatus; }
export interface LocalStimulationLog { id?: number; remoteId?: string; cycle_id: string; cycle_day: number; date: string; fsh?: string; hmg?: string; e2?: string; lh?: string; rt_follicles?: string; lt_follicles?: string; endometrium_thickness?: string; created_at?: string; updated_at?: string; sync_status: SyncStatus; }
export interface LocalPregnancy { id?: number; remoteId?: string; patient_id: string; lmp_date?: string; edd_date?: string; risk_level?: string; aspirin_prescribed?: boolean; current_status?: string; clinical_data?: any; doctor_id?: string; created_at?: string; updated_at?: string; sync_status: SyncStatus; }
export interface LocalBiometryScan { id?: number; remoteId?: string; pregnancy_id: string; scan_date: string; gestational_age_weeks: number; gestational_age_days: number; bpd_mm?: number; hc_mm?: number; ac_mm?: number; fl_mm?: number; efw_grams?: number; percentile?: number; notes?: string; created_at?: string; updated_at?: string; sync_status: SyncStatus; }
export interface SyncQueueItem { id?: number; table: string; operation: 'create' | 'update' | 'delete'; localId: number; remoteId?: string; payload?: any; retryCount: number; maxRetries: number; lastAttempt?: string; nextRetry?: string; created_at: string; }

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

    // Unified Schema Definition (Version 3)
    // Removed dangerous upgrade logic
    this.version(3).stores({
      patients: '++id, remoteId, name, phone, created_at, [sync_status]',
      visits: '++id, remoteId, patient_id, pregnancy_id, date, [sync_status]',
      ivf_cycles: '++id, remoteId, patient_id, status, [sync_status]',
      stimulation_logs: '++id, remoteId, cycle_id, [sync_status]',
      pregnancies: '++id, remoteId, patient_id, [sync_status]',
      biometry_scans: '++id, remoteId, pregnancy_id, [sync_status]',
      syncQueue: '++id, table, operation, retryCount, created_at'
    });
  }
}

export const db = new ClinicLocalDB();

export const initLocalDB = async (): Promise<void> => {
  try {
    if (!db.isOpen()) {
       await db.open();
       console.log('✅ Local database initialized successfully');
    }
  } catch (error) {
    console.error('⚠️ Local DB Error:', error);
    // Do NOT automatically delete the DB on error
  }
};

// Exports helper functions
export const getPendingSyncItems = async (table?: string): Promise<SyncQueueItem[]> => { if (table) { return await db.syncQueue.where('table').equals(table).toArray(); } return await db.syncQueue.toArray(); };
export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<number> => { return await db.syncQueue.add({ ...item, created_at: new Date().toISOString() }); };
export const removeFromSyncQueue = async (id: number): Promise<void> => { await db.syncQueue.delete(id); };
export const updateSyncQueueItem = async (id: number, updates: Partial<SyncQueueItem>): Promise<void> => { await db.syncQueue.update(id, updates); };
export const markAsSynced = async (table: string, localId: number, remoteId?: string): Promise<void> => { const targetTable = db.table(table); if (targetTable) { const updateData: any = { sync_status: SyncStatus.SYNCED, last_sync_attempt: new Date().toISOString(), sync_error: undefined }; if (remoteId) { updateData.remoteId = remoteId; } await targetTable.update(localId, updateData); } };
export const getSyncStats = async (): Promise<{ total: number; synced: number; pending: number; errors: number; }> => {
    let total = 0, synced = 0, pending = 0, errors = 0;
    const tables = ['patients', 'visits', 'ivf_cycles', 'stimulation_logs', 'pregnancies', 'biometry_scans'];
    for (const tbl of tables) {
        const records = await db.table(tbl).toArray();
        total += records.length;
        synced += records.filter((r:any) => r.sync_status === SyncStatus.SYNCED).length;
        pending += records.filter((r:any) => r.sync_status > SyncStatus.SYNCED && r.sync_status < SyncStatus.ERROR).length;
        errors += records.filter((r:any) => r.sync_status === SyncStatus.ERROR).length;
    }
    return { total, synced, pending, errors };
};