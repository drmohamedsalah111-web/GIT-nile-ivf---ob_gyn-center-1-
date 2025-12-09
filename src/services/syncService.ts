import { supabase } from '../../services/supabaseClient';
import {
  db,
  addToSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
  markAsSynced,
  markSyncError,
  getPendingSyncItems,
  SyncStatus,
  SyncQueueItem
} from '../db/localDB';

export class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('🔄 Network connection restored - starting sync');
      this.isOnline = true;
      this.performBackgroundSync();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost');
      this.isOnline = false;
    });
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performBackgroundSync();
      }
    }, 30000);
  }

  // Main save function - saves to local DB first, then attempts sync
  async saveItem(table: string, data: any): Promise<any> {
    try {
      console.log(`💾 Saving ${table} locally first...`, data);

      // Save to local DB with pending status
      const localRecord = await this.saveToLocal(table, data);
      console.log(`✅ Saved ${table} locally with ID: ${localRecord.id}`);

      // Try to sync immediately if online
      if (this.isOnline) {
        // Don't await to keep UI snappy, catch errors in background
        this.syncItem(table, localRecord.id!, localRecord).catch(err => {
            console.warn(`⚠️ Immediate sync failed for ${table}, queued:`, err);
            addToSyncQueue({
                table,
                operation: 'create',
                localId: localRecord.id!,
                payload: data,
                retryCount: 0,
                maxRetries: 3
            });
        });
      } else {
        console.log(`📴 Offline mode - ${table} queued for sync`);
        await addToSyncQueue({
          table,
          operation: 'create',
          localId: localRecord.id!,
          payload: data,
          retryCount: 0,
          maxRetries: 3
        });
      }

      return localRecord;
    } catch (error) {
      console.error(`❌ Failed to save ${table}:`, error);
      throw error;
    }
  }

  // Update existing item
  async updateItem(table: string, localId: number, data: any): Promise<void> {
    try {
      console.log(`📝 Updating ${table} locally...`, data);
      await this.updateLocal(table, localId, data);

      if (this.isOnline) {
        const localRecord = await this.getLocalRecord(table, localId);
        this.syncItem(table, localId, localRecord).catch(() => {
             addToSyncQueue({ table, operation: 'update', localId, payload: data, retryCount: 0, maxRetries: 3 });
        });
      } else {
        await addToSyncQueue({ table, operation: 'update', localId, payload: data, retryCount: 0, maxRetries: 3 });
      }
    } catch (error) {
      console.error(`❌ Failed to update ${table}:`, error);
      throw error;
    }
  }

  // Delete item
  async deleteItem(table: string, localId: number): Promise<void> {
    try {
      console.log(`🗑️ Marking ${table} for deletion...`);
      await this.markLocalDeleted(table, localId);

      if (this.isOnline) {
        const localRecord = await this.getLocalRecord(table, localId);
        if (localRecord.remoteId) {
            this.syncDelete(table, localRecord.remoteId)
                .then(() => this.deleteFromLocal(table, localId))
                .catch(() => addToSyncQueue({ table, operation: 'delete', localId, retryCount: 0, maxRetries: 3 }));
        }
      } else {
        await addToSyncQueue({ table, operation: 'delete', localId, retryCount: 0, maxRetries: 3 });
      }
    } catch (error) {
      console.error(`❌ Failed to delete ${table}:`, error);
      throw error;
    }
  }

  // Background sync function
  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('🔄 Starting background sync...');

    try {
      // 1. Push changes
      await this.processSyncQueue();
      // 2. Pull latest data
      await this.pullLatestData();

      console.log('✅ Background sync completed');
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process items in sync queue
  private async processSyncQueue(): Promise<void> {
    const pendingItems = await getPendingSyncItems();

    for (const item of pendingItems) {
      if (item.retryCount >= item.maxRetries) {
        console.warn(`🚫 Max retries exceeded for ${item.table} ${item.operation}, giving up`);
        await removeFromSyncQueue(item.id!);
        continue;
      }

      try {
        const localRecord = await this.getLocalRecord(item.table, item.localId);
        
        // If record deleted locally but queue says update/create, just remove from queue
        if (!localRecord && item.operation !== 'delete') {
             await removeFromSyncQueue(item.id!);
             continue;
        }

        switch (item.operation) {
          case 'create':
            await this.syncItem(item.table, item.localId, localRecord);
            break;
          case 'update':
            await this.syncItem(item.table, item.localId, localRecord);
            break;
          case 'delete':
            if (localRecord?.remoteId) {
              await this.syncDelete(item.table, localRecord.remoteId);
              await this.deleteFromLocal(item.table, item.localId);
            }
            break;
        }

        await removeFromSyncQueue(item.id!);
      } catch (error) {
        console.warn(`⚠️ Sync retry failed for ${item.table} ${item.operation}:`, error);
        await updateSyncQueueItem(item.id!, {
          retryCount: item.retryCount + 1,
          lastAttempt: new Date().toISOString(),
          nextRetry: new Date(Date.now() + Math.pow(2, item.retryCount) * 60000).toISOString()
        });
      }
    }
  }

  private async syncItem(table: string, localId: number, localRecord: any): Promise<void> {
    const serverData = this.prepareForServer(localRecord, ['id', 'remoteId', 'sync_status', 'last_sync_attempt', 'sync_error']);
    
    // Remove undefined ID to allow Supabase to generate/handle it
    if (serverData.id === undefined) delete serverData.id;

    const { data, error } = await supabase
      .from(table)
      .upsert(serverData)
      .select()
      .single();

    if (error) throw error;

    // Mark as synced with remote ID
    await markAsSynced(table, localId, data.id);
  }

  private async syncDelete(table: string, remoteId: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', remoteId);
    if (error) throw error;
  }

  // ==============================================================================
  // PULL DATA (FIXED)
  // ==============================================================================
  private async pullLatestData(): Promise<void> {
    try {
      console.log('📥 Pulling latest data from server...');

      await this.pullTableData('patients');
      
      // Pull other tables in parallel
      await Promise.all([
        this.pullTableData('antenatal_visits'),
        this.pullTableData('ivf_cycles'),
        this.pullTableData('stimulation_logs'),
        this.pullTableData('pregnancies'),
        this.pullTableData('biometry_scans')
      ]);

      console.log('✅ Data pull completed');
    } catch (error) {
      console.error('❌ Failed to pull latest data:', error);
    }
  }

  private async pullTableData(tableName: string): Promise<void> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000); 

    if (error) {
        console.error(`Error pulling ${tableName}:`, error);
        return;
    }

    if (data && data.length > 0) {
      // FIX: Pass tables as an ARRAY [] to avoid "Expected 3-6 arguments" error
      await db.transaction('rw', [db.patients, db.visits, db.ivf_cycles, db.stimulation_logs, db.pregnancies, db.biometry_scans], async () => {
        for (const record of data) {
            await this.upsertLocalRecord(tableName, record);
        }
      });
    }
  }

  // ==============================================================================
  // HELPERS
  // ==============================================================================

  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing sync on app load...');
    try {
      await this.processSyncQueue();
      await this.pullLatestData(); // Pull data on load
      console.log('✅ Sync initialization completed');
    } catch (error) {
      console.error('⚠️ Error during sync initialization:', error);
    }
  }

  private async upsertLocalRecord(table: string, remoteData: any): Promise<void> {
    const tableMap: any = {
        'patients': db.patients,
        'antenatal_visits': db.visits,
        'ivf_cycles': db.ivf_cycles,
        'stimulation_logs': db.stimulation_logs,
        'pregnancies': db.pregnancies,
        'biometry_scans': db.biometry_scans
    };
    
    const dexieTable = tableMap[table];
    if (!dexieTable) return;

    const existingRecord = await dexieTable.where('remoteId').equals(remoteData.id).first();

    const localData = {
        ...remoteData,
        remoteId: remoteData.id,
        sync_status: SyncStatus.SYNCED,
        created_at: remoteData.created_at || new Date().toISOString(),
        updated_at: remoteData.updated_at || new Date().toISOString()
    };
    delete localData.id;

    if (existingRecord) {
      console.log(`🔍 Found existing local record for ${table} (remoteId: ${remoteData.id}), checking conflict resolution...`);
      
      // Conflict resolution: Don't overwrite if local has pending changes
      if (existingRecord.sync_status !== SyncStatus.SYNCED) {
        console.log(`⚠️ Local record has pending changes (status: ${existingRecord.sync_status}), preserving local data`);
        return;
      }

      // If both are synced, use timestamp-based conflict resolution
      const localUpdatedAt = new Date(existingRecord.updated_at || 0).getTime();
      const remoteUpdatedAt = new Date(remoteData.updated_at || 0).getTime();
      
      if (remoteUpdatedAt < localUpdatedAt) {
        console.log(`⚠️ Local data is newer than remote, preserving local version`);
        return;
      }

      console.log(`✅ Updating with remote data (remote is newer or same)`);
      await dexieTable.update(existingRecord.id, localData);
    } else {
      console.log(`✅ New record from server for ${table}, adding to local DB`);
      await dexieTable.add(localData);
    }
  }

  private prepareForServer(data: any, fieldsToRemove: string[] = []): any {
    const serverData = { ...data };
    fieldsToRemove.forEach(field => delete serverData[field]);
    // Also remove local-only ID if present
    delete serverData.id;
    return serverData;
  }

  // ... Legacy/Helper implementations for local DB interaction ...
  
  private async saveToLocal(table: string, data: any): Promise<any> {
    const localData = { ...data, sync_status: SyncStatus.PENDING_CREATE, created_at: new Date().toISOString() };
    const tableMap: any = { 'patients': db.patients, 'visits': db.visits, 'antenatal_visits': db.visits, 'ivf_cycles': db.ivf_cycles, 'stimulation_logs': db.stimulation_logs, 'pregnancies': db.pregnancies, 'biometry_scans': db.biometry_scans };
    const tbl = tableMap[table];
    if(tbl) return await tbl.add(localData).then((id: any) => ({...localData, id}));
  }

  private async updateLocal(table: string, localId: number, data: any): Promise<void> {
    const tableMap: any = { 'patients': db.patients, 'visits': db.visits, 'antenatal_visits': db.visits, 'ivf_cycles': db.ivf_cycles, 'stimulation_logs': db.stimulation_logs, 'pregnancies': db.pregnancies, 'biometry_scans': db.biometry_scans };
    const tbl = tableMap[table];
    if(tbl) await tbl.update(localId, { ...data, sync_status: SyncStatus.PENDING_UPDATE, updated_at: new Date().toISOString() });
  }

  private async markLocalDeleted(table: string, localId: number): Promise<void> {
    const tableMap: any = { 'patients': db.patients, 'visits': db.visits, 'antenatal_visits': db.visits, 'ivf_cycles': db.ivf_cycles, 'stimulation_logs': db.stimulation_logs, 'pregnancies': db.pregnancies, 'biometry_scans': db.biometry_scans };
    const tbl = tableMap[table];
    if(tbl) await tbl.update(localId, { sync_status: SyncStatus.PENDING_DELETE, updated_at: new Date().toISOString() });
  }

  private async deleteFromLocal(table: string, localId: number): Promise<void> {
    const tableMap: any = { 'patients': db.patients, 'visits': db.visits, 'antenatal_visits': db.visits, 'ivf_cycles': db.ivf_cycles, 'stimulation_logs': db.stimulation_logs, 'pregnancies': db.pregnancies, 'biometry_scans': db.biometry_scans };
    const tbl = tableMap[table];
    if(tbl) await tbl.delete(localId);
  }

  private async getLocalRecord(table: string, localId: number): Promise<any> {
    const tableMap: any = { 'patients': db.patients, 'visits': db.visits, 'antenatal_visits': db.visits, 'ivf_cycles': db.ivf_cycles, 'stimulation_logs': db.stimulation_logs, 'pregnancies': db.pregnancies, 'biometry_scans': db.biometry_scans };
    const tbl = tableMap[table];
    return tbl ? await tbl.get(localId) : null;
  }

  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return { isOnline: this.isOnline, syncInProgress: this.syncInProgress };
  }

  async forceSync(): Promise<void> { await this.performBackgroundSync(); }
  destroy(): void { if (this.syncInterval) clearInterval(this.syncInterval); }

  async save(table: string, data: any) { return await this.saveItem(table, data); }
  async read(table: string) { await this.forceSync(); }
  async update(table: string, remoteId: string, data: any) {
    const localRecord = await this.getLocalRecordByRemoteId(table, remoteId);
    if (localRecord) { await this.updateItem(table, localRecord.id, data); }
  }
  async delete(table: string, remoteId: string) {
    const localRecord = await this.getLocalRecordByRemoteId(table, remoteId);
    if (localRecord) { await this.deleteItem(table, localRecord.id); }
  }

  private async getLocalRecordByRemoteId(table: string, remoteId: string): Promise<any> {
    const tableMap: any = { 'patients': db.patients, 'visits': db.visits, 'antenatal_visits': db.visits, 'ivf_cycles': db.ivf_cycles, 'stimulation_logs': db.stimulation_logs, 'pregnancies': db.pregnancies, 'biometry_scans': db.biometry_scans };
    const tbl = tableMap[table];
    return tbl ? await tbl.where('remoteId').equals(remoteId).first() : null;
  }
}

export const syncService = new SyncService();
export const syncManager = syncService;