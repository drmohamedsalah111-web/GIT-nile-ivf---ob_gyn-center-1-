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
    this.syncInterval = setInterval(() => { if (this.isOnline && !this.syncInProgress) this.performBackgroundSync(); }, 30000);
  }

  // --- PUBLIC API ---

  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing Sync...');
    await this.processSyncQueue();
    await this.pullLatestData();
    console.log('✅ Sync Ready');
  }

  async saveItem(table: string, data: any): Promise<any> {
    const localData = { ...data, sync_status: SyncStatus.PENDING_CREATE, created_at: new Date().toISOString() };
    const id = await db.table(table).add(localData) as number;
    const localRecord = { ...localData, id };
    
    // Queue immediately
    await addToSyncQueue({ table, operation: 'create', localId: id, payload: data, retryCount: 0, maxRetries: 3 });
    
    if (this.isOnline) {
       // Trigger background sync without awaiting
       this.performBackgroundSync();
    }
    return localRecord;
  }

  async updateItem(table: string, localId: number, data: any): Promise<void> {
    await db.table(table).update(localId, { ...data, sync_status: SyncStatus.PENDING_UPDATE, updated_at: new Date().toISOString() });
    await addToSyncQueue({ table, operation: 'update', localId, payload: data, retryCount: 0, maxRetries: 3 });
    if (this.isOnline) this.performBackgroundSync();
  }

  async deleteItem(table: string, localId: number): Promise<void> {
    await db.table(table).update(localId, { sync_status: SyncStatus.PENDING_DELETE });
    await addToSyncQueue({ table, operation: 'delete', localId, retryCount: 0, maxRetries: 3 });
    if (this.isOnline) this.performBackgroundSync();
  }

  // --- CORE SYNC LOGIC ---

  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;
    try { await this.processSyncQueue(); await this.pullLatestData(); } 
    catch (e) { console.error('Sync Error:', e); } 
    finally { this.syncInProgress = false; }
  }

  private async processSyncQueue(): Promise<void> {
    const items = await getPendingSyncItems();
    for (const item of items) {
        if (item.retryCount >= item.maxRetries) { await removeFromSyncQueue(item.id!); continue; }
        try {
            const rec = await db.table(item.table).get(item.localId);
            if (!rec && item.operation !== 'delete') { await removeFromSyncQueue(item.id!); continue; }

            // *** CRITICAL FIX: Resolve Foreign Keys (Local ID -> Remote UUID) ***
            const payload = item.operation === 'create' || item.operation === 'update' 
                ? await this.resolveForeignKeys(item.table, rec) 
                : null;

            if (item.operation === 'create') await this.syncItem(item.table, item.localId, payload);
            else if (item.operation === 'update') await this.syncItem(item.table, item.localId, payload);
            else if (item.operation === 'delete' && rec?.remoteId) { 
                await this.syncDelete(item.table, rec.remoteId); 
                await db.table(item.table).delete(item.localId); 
            }
            
            await removeFromSyncQueue(item.id!);
        } catch (error) { 
            console.error(`Failed to sync item ${item.id}:`, error);
            await updateSyncQueueItem(item.id!, { retryCount: item.retryCount + 1 }); 
        }
    }
  }

  // *** NEW METHOD: FIXES ORPHANED RECORDS ***
  private async resolveForeignKeys(table: string, record: any): Promise<any> {
    const updatedRecord = { ...record };
    let hasChanges = false;

    // 1. Fix Patient ID (if it's a number, find the remote UUID)
    if (updatedRecord.patient_id && !isNaN(Number(updatedRecord.patient_id))) {
        const patient = await db.patients.get(Number(updatedRecord.patient_id));
        if (patient && patient.remoteId) {
            console.log(`🔗 Linking orphan ${table} to Patient UUID: ${patient.remoteId}`);
            updatedRecord.patient_id = patient.remoteId;
            hasChanges = true;
        }
    }
    // Also check camelCase 'patientId' just in case
    if (updatedRecord.patientId && !isNaN(Number(updatedRecord.patientId))) {
        const patient = await db.patients.get(Number(updatedRecord.patientId));
        if (patient && patient.remoteId) {
            updatedRecord.patient_id = patient.remoteId; // Standardize to snake_case
            delete updatedRecord.patientId;
            hasChanges = true;
        }
    }

    // 2. Fix Pregnancy ID (for Visits & Scans)
    if (updatedRecord.pregnancy_id && !isNaN(Number(updatedRecord.pregnancy_id))) {
        const pregnancy = await db.pregnancies.get(Number(updatedRecord.pregnancy_id));
        if (pregnancy && pregnancy.remoteId) {
            console.log(`🔗 Linking orphan ${table} to Pregnancy UUID: ${pregnancy.remoteId}`);
            updatedRecord.pregnancy_id = pregnancy.remoteId;
            hasChanges = true;
        }
    }

    // 3. Fix Cycle ID (for Logs)
    if (updatedRecord.cycle_id && !isNaN(Number(updatedRecord.cycle_id))) {
        const cycle = await db.ivf_cycles.get(Number(updatedRecord.cycle_id));
        if (cycle && cycle.remoteId) {
            updatedRecord.cycle_id = cycle.remoteId;
            hasChanges = true;
        }
    }

    // Apply updates locally if we found the UUIDs
    if (hasChanges) {
        await db.table(table).update(record.id, updatedRecord);
    }

    return updatedRecord;
  }

  private async syncItem(table: string, localId: number, record: any): Promise<void> {
    // Map local table names to Supabase
    const supabaseTable = table === 'visits' ? 'antenatal_visits' : table;
    
    // Clean payload
    const payload = { ...record };
    delete payload.id; // Don't send local ID
    delete payload.sync_status;
    delete payload.sync_error;
    delete payload.last_sync_attempt;
    delete payload.remoteId;
    delete payload.created_at; // Let server handle timestamp conflicts if needed, or keep if crucial
    
    // Ensure patient_id is present if required (sometimes it's missing in payload but present in local DB)
    if (table !== 'patients' && !payload.patient_id && !payload.pregnancy_id && !payload.cycle_id) {
       console.warn(`⚠️ Skipping sync for ${table} ${localId}: Missing Foreign Key`);
       return; 
    }

    const { data, error } = await supabase.from(supabaseTable).upsert(payload).select().single();
    if (error) throw error;
    await markAsSynced(table, localId, data.id);
  }

  private async syncDelete(table: string, remoteId: string): Promise<void> {
    const supabaseTable = table === 'visits' ? 'antenatal_visits' : table;
    const { error } = await supabase.from(supabaseTable).delete().eq('id', remoteId);
    if (error) throw error;
  }

  // --- PULL LOGIC ---
  private async pullLatestData(): Promise<void> {
    try {
        console.log('📥 Pulling data...');
        await this.pullTable('patients');
        await this.pullTable('ivf_cycles');
        await this.pullTable('pregnancies');
        await Promise.all([
            this.pullTable('antenatal_visits', 'visits'),
            this.pullTable('stimulation_logs'),
            this.pullTable('biometry_scans')
        ]);
    } catch (e) { console.error('Pull error:', e); }
  }

  private async pullTable(remoteTable: string, localTableAlias?: string): Promise<void> {
    const localTable = localTableAlias || remoteTable;
    const { data, error } = await supabase.from(remoteTable).select('*').limit(1000);
    if (error || !data) return;

    await db.transaction('rw', [db.table(localTable)], async () => {
        for (const remoteRow of data) {
            const existing = await db.table(localTable).where('remoteId').equals(remoteRow.id).first();
            const cleanRow = { ...remoteRow, remoteId: remoteRow.id, sync_status: SyncStatus.SYNCED };
            delete cleanRow.id; 
            
            // Map legacy fields if needed
            if (localTable === 'visits' && cleanRow.pregnancy_id) {
                // Ensure visits are linked correctly
            }

            if (existing) { await db.table(localTable).update(existing.id, cleanRow); } 
            else { await db.table(localTable).add(cleanRow); }
        }
    });
  }

  // Compat & Additional Methods
  async fetch(table: string, query: (sb: any) => any): Promise<any> {
    if (this.isOnline) {
      try {
        const result = await query(supabase);
        if (result.error) throw result.error;
        return result.data || [];
      } catch (e) {
        console.warn(`Fetch failed for ${table}, using local cache:`, e);
        return await db.table(table).toArray();
      }
    } else {
      return await db.table(table).toArray();
    }
  }

  async forceSync() { await this.performBackgroundSync(); }
  getSyncStatus() { return { isOnline: this.isOnline, syncInProgress: this.syncInProgress }; }
  async save(t: string, d: any) { return this.saveItem(t, d); }
  async read(t: string) { await this.pullLatestData(); }
  async update(t: string, rid: string, d: any) { const r = await db.table(t).where('remoteId').equals(rid).first(); if(r) await this.updateItem(t, r.id, d); }
  async delete(t: string, rid: string) { const r = await db.table(t).where('remoteId').equals(rid).first(); if(r) await this.deleteItem(t, r.id); }
}

export const syncService = new SyncService();
export const syncManager = syncService;