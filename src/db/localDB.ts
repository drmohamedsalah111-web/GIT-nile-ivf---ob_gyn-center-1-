import Dexie, { Table } from 'dexie';

export enum SyncStatus { SYNCED = 0, PENDING_CREATE = 1, PENDING_UPDATE = 2, PENDING_DELETE = 3, ERROR = 4 }

export class ClinicLocalDB extends Dexie {
  patients!: Table<any>;
  visits!: Table<any>;
  ivf_cycles!: Table<any>;
  stimulation_logs!: Table<any>;
  pregnancies!: Table<any>;
  biometry_scans!: Table<any>;
  antenatal_visits!: Table<any>; // هذا الجدول كان غالباً ناقصاً
  patient_files!: Table<any>;    // وهذا أيضاً ظهر له خطأ 404
  syncQueue!: Table<any>;

  constructor() {
    super('ClinicLocalDB');

    // قمنا برفع الإصدار إلى 4 لإجبار المتصفح على التحديث
    this.version(4).stores({
      patients: '++id, remoteId, name, phone, created_at, [sync_status]',
      visits: '++id, remoteId, patient_id, pregnancy_id, date, [sync_status]',
      ivf_cycles: '++id, remoteId, patient_id, status, [sync_status]',
      stimulation_logs: '++id, remoteId, cycle_id, [sync_status]',
      pregnancies: '++id, remoteId, patient_id, [sync_status]',
      biometry_scans: '++id, remoteId, pregnancy_id, [sync_status]',
      antenatal_visits: '++id, remoteId, pregnancy_id, visit_date, [sync_status]',
      patient_files: '++id, remoteId, patient_id, [sync_status]',
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
    // إذا حدث خطأ في الإصدار، احذف القاعدة وأعد إنشاءها
    if ((error as any).name === 'VersionError' || (error as any).name === 'NotFoundError') {
        console.warn('Old database version detected. Recreating...');
        await db.delete();
        await db.open();
    }
  }
};

// ... (ابقِ على باقي الدوال المساعدة كما هي: addToSyncQueue, markAsSynced, etc.)
export const getPendingSyncItems = async (table?: string) => { if (table) { return await db.syncQueue.where('table').equals(table).toArray(); } return await db.syncQueue.toArray(); };
export const addToSyncQueue = async (item: any) => { return await db.syncQueue.add({ ...item, created_at: new Date().toISOString() }); };
export const removeFromSyncQueue = async (id: number) => { await db.syncQueue.delete(id); };
export const updateSyncQueueItem = async (id: number, updates: any) => { await db.syncQueue.update(id, updates); };
export const markAsSynced = async (table: string, localId: number, remoteId?: string) => { const targetTable = db.table(table); if (targetTable) { const updateData: any = { sync_status: SyncStatus.SYNCED }; if (remoteId) { updateData.remoteId = remoteId; } await targetTable.update(localId, updateData); } };
export const getSyncStats = async () => { return { total: 0, synced: 0, pending: 0, errors: 0 }; }; // Simplified for now