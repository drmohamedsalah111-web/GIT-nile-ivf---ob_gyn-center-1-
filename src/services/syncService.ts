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

/**
 * NETWORK-FIRST SYNC STRATEGY
 * 
 * Write Strategy (saveItem/updateItem):
 * 1. Online: Try Supabase first
 * 2. If success: Save locally with SYNCED status
 * 3. If error or offline: Queue for retry + Save locally with PENDING status
 * 
 * Read Strategy (fetch):
 * 1. Online: Get from Supabase → Update local cache → Return Supabase data
 * 2. Offline: Return local cache
 * 
 * Init Strategy (app load):
 * 1. Try Supabase first (Network-First)
 * 2. Push any pending items
 * 3. Pull latest data to refresh cache
 * 4. Fallback to local if network unavailable
 */
export class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private tableMap: any = {
    'patients': db.patients,
    'visits': db.visits,
    'antenatal_visits': db.visits,
    'ivf_cycles': db.ivf_cycles,
    'stimulation_logs': db.stimulation_logs,
    'pregnancies': db.pregnancies,
    'biometry_scans': db.biometry_scans
  };

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('🔄 Network connection restored - syncing...');
      this.isOnline = true;
      this.performBackgroundSync();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost - using local cache');
      this.isOnline = false;
    });
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performBackgroundSync();
      }
    }, 30000);
  }

  // ==============================================================================
  // WRITE OPERATIONS: NETWORK-FIRST STRATEGY
  // ==============================================================================

  /**
   * Save new item - Network-First with offline fallback
   * 1. Try Supabase immediately if online
   * 2. On success: Save locally with SYNCED status
   * 3. On error/offline: Queue + Save locally with PENDING status
   */
  async saveItem(table: string, data: any): Promise<any> {
    try {
      // IF ONLINE: Try Supabase first
      if (this.isOnline) {
        console.log(`🌐 Attempting direct Supabase save for ${table}...`);
        try {
          const serverData = this.prepareForServer(data);
          const { data: remoteData, error } = await supabase
            .from(table)
            .insert([serverData])
            .select()
            .single();

          if (error) throw error;

          console.log(`✅ Successfully saved to Supabase, updating local cache...`);
          
          // Save to local with SYNCED status
          const localData = {
            ...data,
            remoteId: remoteData.id,
            sync_status: SyncStatus.SYNCED,
            created_at: remoteData.created_at || new Date().toISOString(),
            updated_at: remoteData.updated_at || new Date().toISOString()
          };

          const localId = await this.tableMap[table].add(localData);
          return { ...localData, id: localId, remoteId: remoteData.id };
        } catch (supabaseError) {
          console.warn(`⚠️ Supabase save failed, falling back to local queue:`, supabaseError);
          // Fall through to offline logic
        }
      }

      // IF OFFLINE OR SUPABASE FAILED: Save locally with pending status
      console.log(`📴 Saving ${table} locally with PENDING status...`);
      const localData = {
        ...data,
        sync_status: SyncStatus.PENDING_CREATE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const localId = await this.tableMap[table].add(localData);
      
      // Queue for retry
      await addToSyncQueue({
        table,
        operation: 'create',
        localId,
        payload: data,
        retryCount: 0,
        maxRetries: 3
      });

      console.log(`✅ Queued for sync (local ID: ${localId})`);
      return { ...localData, id: localId };
    } catch (error) {
      console.error(`❌ Failed to save ${table}:`, error);
      throw error;
    }
  }

  /**
   * Update existing item - Network-First with offline fallback
   */
  async updateItem(table: string, localId: number, data: any): Promise<void> {
    try {
      const localRecord = await this.getLocalRecord(table, localId);
      if (!localRecord) throw new Error(`Record not found: ${table} ${localId}`);

      // IF ONLINE: Try Supabase first
      if (this.isOnline && localRecord.remoteId) {
        console.log(`🌐 Attempting direct Supabase update for ${table}...`);
        try {
          const serverData = this.prepareForServer({ ...localRecord, ...data });
          const { error } = await supabase
            .from(table)
            .update(serverData)
            .eq('id', localRecord.remoteId)
            .select()
            .single();

          if (error) throw error;

          console.log(`✅ Successfully updated on Supabase, updating local cache...`);
          
          // Update local with SYNCED status
          await this.tableMap[table].update(localId, {
            ...data,
            sync_status: SyncStatus.SYNCED,
            updated_at: new Date().toISOString()
          });
          return;
        } catch (supabaseError) {
          console.warn(`⚠️ Supabase update failed, falling back to local queue:`, supabaseError);
        }
      }

      // IF OFFLINE OR SUPABASE FAILED: Update locally with pending status
      console.log(`📴 Updating ${table} locally with PENDING status...`);
      await this.tableMap[table].update(localId, {
        ...data,
        sync_status: SyncStatus.PENDING_UPDATE,
        updated_at: new Date().toISOString()
      });

      // Queue for retry
      await addToSyncQueue({
        table,
        operation: 'update',
        localId,
        payload: data,
        retryCount: 0,
        maxRetries: 3
      });

      console.log(`✅ Queued for sync`);
    } catch (error) {
      console.error(`❌ Failed to update ${table}:`, error);
      throw error;
    }
  }

  /**
   * Delete item - Network-First with offline fallback
   */
  async deleteItem(table: string, localId: number): Promise<void> {
    try {
      const localRecord = await this.getLocalRecord(table, localId);
      if (!localRecord) throw new Error(`Record not found: ${table} ${localId}`);

      // IF ONLINE: Try Supabase first
      if (this.isOnline && localRecord.remoteId) {
        console.log(`🌐 Attempting direct Supabase delete for ${table}...`);
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', localRecord.remoteId);

          if (error) throw error;

          console.log(`✅ Successfully deleted from Supabase, removing locally...`);
          await this.tableMap[table].delete(localId);
          return;
        } catch (supabaseError) {
          console.warn(`⚠️ Supabase delete failed, falling back to local queue:`, supabaseError);
        }
      }

      // IF OFFLINE OR SUPABASE FAILED: Mark for deletion
      console.log(`📴 Marking ${table} for deletion...`);
      await this.tableMap[table].update(localId, {
        sync_status: SyncStatus.PENDING_DELETE,
        updated_at: new Date().toISOString()
      });

      // Queue for retry
      await addToSyncQueue({
        table,
        operation: 'delete',
        localId,
        retryCount: 0,
        maxRetries: 3
      });

      console.log(`✅ Queued for deletion sync`);
    } catch (error) {
      console.error(`❌ Failed to delete ${table}:`, error);
      throw error;
    }
  }

  // ==============================================================================
  // READ OPERATIONS: NETWORK-FIRST STRATEGY
  // ==============================================================================

  /**
   * Fetch data from Supabase with local cache fallback
   * 1. Online: Get from Supabase → Update local → Return Supabase data
   * 2. Offline: Return local cache
   * 
   * Usage example:
   * const patients = await syncService.fetch('patients', async (sb) => {
   *   return sb.from('patients').select('*').order('created_at', { ascending: false });
   * });
   */
  async fetch<T>(
    table: string,
    queryFn: (sb: any) => Promise<{ data: T[] | null; error: any }>
  ): Promise<T[]> {
    // IF ONLINE: Try Supabase first
    if (this.isOnline) {
      try {
        console.log(`🌐 Fetching ${table} from Supabase...`);
        const result = await queryFn(supabase);
        
        if (result.error) throw result.error;
        if (!result.data) return [];

        console.log(`✅ Got ${result.data.length} records from Supabase, updating local cache...`);
        
        // Update local cache with Supabase data
        await this.updateLocalCache(table, result.data);
        
        return result.data as T[];
      } catch (error) {
        console.warn(`⚠️ Supabase fetch failed, falling back to local cache:`, error);
        // Fall through to offline logic
      }
    }

    // IF OFFLINE: Return local cache
    console.log(`📴 Returning local cache for ${table}...`);
    const localRecords = await this.tableMap[table].toArray();
    return localRecords.map((r: any) => ({
      ...r,
      id: r.remoteId || r.id
    })) as T[];
  }

  /**
   * Update local cache with remote data
   * Applies same conflict resolution rules as upsertLocalRecord
   */
  private async updateLocalCache(table: string, remoteData: any[]): Promise<void> {
    const dexieTable = this.tableMap[table];
    if (!dexieTable) return;

    for (const record of remoteData) {
      await this.upsertLocalRecord(table, record);
    }
  }

  // ==============================================================================
  // BACKGROUND SYNC
  // ==============================================================================

  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('🔄 Starting background sync...');

    try {
      // 1. Push pending changes to Supabase
      await this.processSyncQueue();
      
      // 2. Pull latest data from Supabase to refresh cache
      await this.pullLatestData();

      console.log('✅ Background sync completed');
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncQueue(): Promise<void> {
    const pendingItems = await getPendingSyncItems();
    console.log(`📋 Processing ${pendingItems.length} pending items...`);

    for (const item of pendingItems) {
      if (item.retryCount >= item.maxRetries) {
        console.warn(`🚫 Max retries exceeded for ${item.table} ${item.operation}`);
        await removeFromSyncQueue(item.id!);
        continue;
      }

      try {
        const localRecord = await this.getLocalRecord(item.table, item.localId);
        
        if (!localRecord && item.operation !== 'delete') {
          await removeFromSyncQueue(item.id!);
          continue;
        }

        switch (item.operation) {
          case 'create':
          case 'update':
            await this.syncItemToServer(item.table, item.localId, localRecord);
            break;
          case 'delete':
            if (localRecord?.remoteId) {
              await this.syncDelete(item.table, localRecord.remoteId);
              await this.deleteFromLocal(item.table, item.localId);
            }
            break;
        }

        await removeFromSyncQueue(item.id!);
        console.log(`✅ Synced ${item.table} ${item.operation}`);
      } catch (error) {
        console.warn(`⚠️ Sync failed for ${item.table} ${item.operation}:`, error);
        await updateSyncQueueItem(item.id!, {
          retryCount: item.retryCount + 1,
          lastAttempt: new Date().toISOString(),
          nextRetry: new Date(Date.now() + Math.pow(2, item.retryCount) * 60000).toISOString()
        });
      }
    }
  }

  private async syncItemToServer(table: string, localId: number, localRecord: any): Promise<void> {
    const serverData = this.prepareForServer(localRecord);

    let result;
    if (localRecord.remoteId) {
      // Update existing
      result = await supabase
        .from(table)
        .update(serverData)
        .eq('id', localRecord.remoteId)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from(table)
        .insert([serverData])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Mark as synced
    await markAsSynced(table, localId, result.data.id);
  }

  private async syncDelete(table: string, remoteId: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', remoteId);
    if (error) throw error;
  }

  private async pullLatestData(): Promise<void> {
    try {
      console.log('📥 Pulling latest data from Supabase...');

      await this.pullTableData('patients');
      
      await Promise.all([
        this.pullTableData('antenatal_visits'),
        this.pullTableData('ivf_cycles'),
        this.pullTableData('stimulation_logs'),
        this.pullTableData('pregnancies'),
        this.pullTableData('biometry_scans')
      ]);

      console.log('✅ Data pull completed');
    } catch (error) {
      console.error('❌ Failed to pull data:', error);
    }
  }

  private async pullTableData(tableName: string): Promise<void> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000);

    if (error) {
      console.error(`❌ Error pulling ${tableName}:`, error);
      return;
    }

    if (data && data.length > 0) {
      await db.transaction('rw', [
        db.patients, db.visits, db.ivf_cycles, 
        db.stimulation_logs, db.pregnancies, db.biometry_scans
      ], async () => {
        for (const record of data) {
          await this.upsertLocalRecord(tableName, record);
        }
      });
    }
  }

  // ==============================================================================
  // LOCAL DB HELPERS
  // ==============================================================================

  private async upsertLocalRecord(table: string, remoteData: any): Promise<void> {
    const dexieTable = this.tableMap[table];
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
      // Conflict resolution: Protect pending changes
      if (existingRecord.sync_status !== SyncStatus.SYNCED) {
        console.log(`⚠️ Local has pending changes, preserving...`);
        return;
      }

      // Timestamp-based resolution
      const localTime = new Date(existingRecord.updated_at || 0).getTime();
      const remoteTime = new Date(remoteData.updated_at || 0).getTime();
      
      if (remoteTime < localTime) {
        console.log(`⚠️ Local is newer, preserving...`);
        return;
      }

      await dexieTable.update(existingRecord.id, localData);
    } else {
      await dexieTable.add(localData);
    }
  }

  private async getLocalRecord(table: string, localId: number): Promise<any> {
    const tbl = this.tableMap[table];
    return tbl ? await tbl.get(localId) : null;
  }

  private async deleteFromLocal(table: string, localId: number): Promise<void> {
    const tbl = this.tableMap[table];
    if (tbl) await tbl.delete(localId);
  }

  private prepareForServer(data: any, fieldsToRemove: string[] = []): any {
    const serverData = { ...data };
    fieldsToRemove.forEach(field => delete serverData[field]);
    delete serverData.id;
    return serverData;
  }

  // ==============================================================================
  // PUBLIC API
  // ==============================================================================

  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing sync on app load...');
    try {
      // Push any pending items first
      await this.processSyncQueue();
      
      // Pull latest data from Supabase
      if (this.isOnline) {
        await this.pullLatestData();
      }
      
      console.log('✅ Sync initialization completed');
    } catch (error) {
      console.error('⚠️ Sync initialization error:', error);
    }
  }

  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return { isOnline: this.isOnline, syncInProgress: this.syncInProgress };
  }

  async forceSync(): Promise<void> {
    await this.performBackgroundSync();
  }

  destroy(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  // Legacy compatibility
  async save(table: string, data: any) {
    return await this.saveItem(table, data);
  }

  async read(table: string) {
    await this.forceSync();
  }

  async update(table: string, remoteId: string, data: any) {
    const localRecord = await this.getLocalRecordByRemoteId(table, remoteId);
    if (localRecord) {
      await this.updateItem(table, localRecord.id, data);
    }
  }

  async delete(table: string, remoteId: string) {
    const localRecord = await this.getLocalRecordByRemoteId(table, remoteId);
    if (localRecord) {
      await this.deleteItem(table, localRecord.id);
    }
  }

  private async getLocalRecordByRemoteId(table: string, remoteId: string): Promise<any> {
    const tbl = this.tableMap[table];
    return tbl ? await tbl.where('remoteId').equals(remoteId).first() : null;
  }
}

export const syncService = new SyncService();
export const syncManager = syncService;
