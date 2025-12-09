import { supabase } from '../../services/supabaseClient';
import { db, addToSyncQueue, removeFromSyncQueue, updateSyncQueueItem, markAsSynced, getPendingSyncItems, SyncStatus } from '../db/localDB';

export class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => { console.log('🔄 Online: Syncing...'); this.isOnline = true; this.forceSync(); });
    window.addEventListener('offline', () => { console.log('📴 Offline mode'); this.isOnline = false; });
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => { if (this.isOnline && !this.syncInProgress) this.performBackgroundSync(); }, 60000);
  }

  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing Sync...');
    await this.processSyncQueue();
    await this.pullLatestData(); // PULLS DATA ON STARTUP
    console.log('✅ Sync Ready');
  }

  async saveItem(table: string, data: any): Promise<any> {
    const localData = { ...data, sync_status: SyncStatus.PENDING_CREATE, created_at: new Date().toISOString() };
    const id = await db.table(table).add(localData) as number;
    const localRecord = { ...localData, id };
    if (this.isOnline) {
        this.syncItem(table, id, localRecord).catch(() => addToSyncQueue({ table, operation: 'create', localId: id, payload: data, retryCount: 0, maxRetries: 3 }));
    } else {
        await addToSyncQueue({ table, operation: 'create', localId: id, payload: data, retryCount: 0, maxRetries: 3 });
    }
    return localRecord;
  }

  // (Include updateItem and deleteItem following similar pattern...)
  async updateItem(table: string, localId: number, data: any): Promise<void> {
    await db.table(table).update(localId, { ...data, sync_status: SyncStatus.PENDING_UPDATE, updated_at: new Date().toISOString() });
    if (this.isOnline) {
        const record = await db.table(table).get(localId);
        this.syncItem(table, localId, record).catch(() => addToSyncQueue({ table, operation: 'update', localId, payload: data, retryCount: 0, maxRetries: 3 }));
    } else {
        await addToSyncQueue({ table, operation: 'update', localId, payload: data, retryCount: 0, maxRetries: 3 });
    }
  }

  async deleteItem(table: string, localId: number): Promise<void> {
    await db.table(table).update(localId, { sync_status: SyncStatus.PENDING_DELETE });
    if (this.isOnline) {
        const record = await db.table(table).get(localId);
        if (record?.remoteId) {
            this.syncDelete(table, record.remoteId).then(() => db.table(table).delete(localId))
            .catch(() => addToSyncQueue({ table, operation: 'delete', localId, retryCount: 0, maxRetries: 3 }));
        } else { await db.table(table).delete(localId); }
    } else {
        await addToSyncQueue({ table, operation: 'delete', localId, retryCount: 0, maxRetries: 3 });
    }
  }

  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;
    try { await this.processSyncQueue(); await this.pullLatestData(); }
    catch (e) { console.error(e); } finally { this.syncInProgress = false; }
  }

  private async processSyncQueue(): Promise<void> {
    const items = await getPendingSyncItems();
    for (const item of items) {
        if (item.retryCount >= item.maxRetries) { await removeFromSyncQueue(item.id!); continue; }
        try {
            const rec = await db.table(item.table).get(item.localId);
            if (!rec && item.operation !== 'delete') { await removeFromSyncQueue(item.id!); continue; }
            if (item.operation === 'create') await this.syncItem(item.table, item.localId, rec);
            else if (item.operation === 'update') await this.syncItem(item.table, item.localId, rec);
            else if (item.operation === 'delete' && rec?.remoteId) { await this.syncDelete(item.table, rec.remoteId); await db.table(item.table).delete(item.localId); }
            await removeFromSyncQueue(item.id!);
        } catch { await updateSyncQueueItem(item.id!, { retryCount: item.retryCount + 1 }); }
    }
  }

  private async syncItem(table: string, localId: number, record: any): Promise<void> {
    const supabaseTable = table === 'visits' ? 'antenatal_visits' : table;
    const payload = { ...record };
    delete payload.id; delete payload.sync_status; delete payload.sync_error; delete payload.last_sync_attempt; delete payload.remoteId;
    const { data, error } = await supabase.from(supabaseTable).upsert(payload).select().single();
    if (error) throw error;
    await markAsSynced(table, localId, data.id);
  }

  private async syncDelete(table: string, remoteId: string): Promise<void> {
    const supabaseTable = table === 'visits' ? 'antenatal_visits' : table;
    const { error } = await supabase.from(supabaseTable).delete().eq('id', remoteId);
    if (error) throw error;
  }

  // UPDATED PULL LOGIC
  private async pullLatestData(): Promise<void> {
    try {
      console.log('📥 Pulling latest data from server...');

      // 1. Pull Patients first (Parent table)
      await this.pullTableData('patients');

      // 2. Pull all related tables in parallel
      await Promise.all([
        this.pullTableData('visits'),           // General & Gyna Visits
        this.pullTableData('ivf_cycles'),       // IVF Cycles
        this.pullTableData('stimulation_logs'), // IVF Logs
        this.pullTableData('pregnancies'),      // Obstetrics Pregnancies
        this.pullTableData('antenatal_visits'), // OBS Visits
        this.pullTableData('biometry_scans')    // Fetal Growth
      ]);

      console.log('✅ Data pull completed');
    } catch (error) {
      console.error('❌ Failed to pull latest data:', error);
    }
  }

  private async pullTableData(tableName: string): Promise<void> {
    // Map remote table names to local Dexie table names if they differ
    const localTableName = tableName === 'antenatal_visits' ? 'visits' : tableName;

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000);

    if (error) {
        console.error(`Error pulling ${tableName}:`, error);
        return;
    }

    if (data && data.length > 0) {
      // Use array notation for transaction to avoid arguments error
      await db.transaction('rw', [db.table(localTableName)], async () => {
        for (const record of data) {
           // Logic to merge remote data into local DB
           const localTable = db.table(localTableName);
           const existing = await localTable.where('remoteId').equals(record.id).first();

           const cleanRecord = {
             ...record,
             remoteId: record.id,
             sync_status: SyncStatus.SYNCED
           };
           delete cleanRecord.id; // Don't overwrite local auto-increment ID

           if (existing) {
             await localTable.update(existing.id, cleanRecord);
           } else {
             await localTable.add(cleanRecord);
           }
        }
      });
    }
  }

  getSyncStatus() { return { isOnline: this.isOnline, syncInProgress: this.syncInProgress }; }
  async forceSync() { await this.performBackgroundSync(); }
  destroy() { if (this.syncInterval) clearInterval(this.syncInterval); }
  async save(t: string, d: any) { return this.saveItem(t, d); }
  async read(t: string) { await this.pullLatestData(); }
  async update(t: string, rid: string, d: any) { const r = await db.table(t).where('remoteId').equals(rid).first(); if(r) await this.updateItem(t, r.id, d); }
  async delete(t: string, rid: string) { const r = await db.table(t).where('remoteId').equals(rid).first(); if(r) await this.deleteItem(t, r.id); }
}

export const syncService = new SyncService();
export const syncManager = syncService;