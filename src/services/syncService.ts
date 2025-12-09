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

  private async pullLatestData(): Promise<void> {
    try {
        console.log('📥 Pulling data...');
        await this.pullTable('patients');
        await this.pullTable('antenatal_visits', 'visits');
        await this.pullTable('ivf_cycles');
        await this.pullTable('stimulation_logs');
        await this.pullTable('pregnancies');
        await this.pullTable('biometry_scans');
    } catch (e) { console.error('Pull error:', e); }
  }

  private async pullTable(remoteTable: string, localTableAlias?: string): Promise<void> {
    const localTable = localTableAlias || remoteTable;
    const { data, error } = await supabase.from(remoteTable).select('*').limit(1000);
    if (error || !data) return;

    // FIX: Using array for transaction
    await db.transaction('rw', [db.table(localTable)], async () => {
        for (const remoteRow of data) {
            const existing = await db.table(localTable).where('remoteId').equals(remoteRow.id).first();
            const cleanRow = { ...remoteRow, remoteId: remoteRow.id, sync_status: SyncStatus.SYNCED };
            delete cleanRow.id;
            // For visits table, ensure pregnancy_id is used instead of patient_id
            if (localTable === 'visits' && cleanRow.patient_id) {
                cleanRow.pregnancy_id = cleanRow.patient_id;
                delete cleanRow.patient_id;
            }
            if (existing) { await db.table(localTable).update(existing.id, cleanRow); }
            else { await db.table(localTable).add(cleanRow); }
        }
    });
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