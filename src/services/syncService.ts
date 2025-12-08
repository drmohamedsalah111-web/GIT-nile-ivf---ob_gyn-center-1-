import { supabase } from '../../services/supabaseClient';
import {
  db,
  addToSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
  markAsSynced,
  markSyncError,
  getUnsyncedRecords,
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
        try {
          console.log(`🔄 Attempting immediate sync for ${table}...`);
          await this.syncItem(table, localRecord.id!, localRecord);
          console.log(`✅ Successfully synced ${table} immediately`);
        } catch (error) {
          console.warn(`⚠️ Immediate sync failed for ${table}, will retry in background:`, error);
          // Add to sync queue for later retry
          await addToSyncQueue({
            table,
            operation: 'create',
            localId: localRecord.id!,
            payload: data,
            retryCount: 0,
            maxRetries: 3
          });
        }
      } else {
        console.log(`📴 Offline mode - ${table} queued for sync`);
        // Add to sync queue
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

      // Update local DB with pending status
      await this.updateLocal(table, localId, data);

      // Try to sync immediately if online
      if (this.isOnline) {
        try {
          console.log(`🔄 Attempting immediate sync for ${table} update...`);
          const localRecord = await this.getLocalRecord(table, localId);
          await this.syncItem(table, localId, localRecord);
          console.log(`✅ Successfully synced ${table} update immediately`);
        } catch (error) {
          console.warn(`⚠️ Immediate sync failed for ${table} update, will retry in background:`, error);
          // Add to sync queue for later retry
          await addToSyncQueue({
            table,
            operation: 'update',
            localId,
            payload: data,
            retryCount: 0,
            maxRetries: 3
          });
        }
      } else {
        console.log(`📴 Offline mode - ${table} update queued for sync`);
        // Add to sync queue
        await addToSyncQueue({
          table,
          operation: 'update',
          localId,
          payload: data,
          retryCount: 0,
          maxRetries: 3
        });
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

      // Mark as pending delete in local DB
      await this.markLocalDeleted(table, localId);

      // Try to sync immediately if online
      if (this.isOnline) {
        try {
          console.log(`🔄 Attempting immediate sync for ${table} deletion...`);
          const localRecord = await this.getLocalRecord(table, localId);
          if (localRecord.remoteId) {
            await this.syncDelete(table, localRecord.remoteId);
            // Actually delete from local DB after successful server delete
            await this.deleteFromLocal(table, localId);
          }
          console.log(`✅ Successfully synced ${table} deletion immediately`);
        } catch (error) {
          console.warn(`⚠️ Immediate sync failed for ${table} deletion, will retry in background:`, error);
          // Add to sync queue for later retry
          await addToSyncQueue({
            table,
            operation: 'delete',
            localId,
            retryCount: 0,
            maxRetries: 3
          });
        }
      } else {
        console.log(`📴 Offline mode - ${table} deletion queued for sync`);
        // Add to sync queue
        await addToSyncQueue({
          table,
          operation: 'delete',
          localId,
          retryCount: 0,
          maxRetries: 3
        });
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
      // Process sync queue
      await this.processSyncQueue();

      // Pull latest data from server
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
        console.log(`🔄 Retrying ${item.table} ${item.operation} (attempt ${item.retryCount + 1}/${item.maxRetries})`);

        const localRecord = await this.getLocalRecord(item.table, item.localId);

        switch (item.operation) {
          case 'create':
            await this.syncItem(item.table, item.localId, localRecord);
            break;
          case 'update':
            await this.syncItem(item.table, item.localId, localRecord);
            break;
          case 'delete':
            if (localRecord.remoteId) {
              await this.syncDelete(item.table, localRecord.remoteId);
              await this.deleteFromLocal(item.table, item.localId);
            }
            break;
        }

        await removeFromSyncQueue(item.id!);
        console.log(`✅ Successfully synced ${item.table} ${item.operation}`);

      } catch (error) {
        console.warn(`⚠️ Sync retry failed for ${item.table} ${item.operation}:`, error);
        await updateSyncQueueItem(item.id!, {
          retryCount: item.retryCount + 1,
          lastAttempt: new Date().toISOString(),
          nextRetry: new Date(Date.now() + Math.pow(2, item.retryCount) * 60000).toISOString() // Exponential backoff
        });
      }
    }
  }

  // Sync individual item to server
  private async syncItem(table: string, localId: number, localRecord: any): Promise<void> {
    try {
      let result;
      const serverData = this.prepareForServer(localRecord, ['id', 'remoteId', 'sync_status', 'last_sync_attempt', 'sync_error']);

      switch (table) {
        case 'patients':
          result = await supabase
            .from('patients')
            .insert([serverData])
            .select()
            .single();
          break;

        case 'visits':
          result = await supabase
            .from('antenatal_visits')
            .insert([serverData])
            .select()
            .single();
          break;

        case 'ivf_cycles':
          result = await supabase
            .from('ivf_cycles')
            .insert([serverData])
            .select()
            .single();
          break;

        case 'stimulation_logs':
          result = await supabase
            .from('stimulation_logs')
            .insert([serverData])
            .select()
            .single();
          break;

        case 'pregnancies':
          result = await supabase
            .from('pregnancies')
            .insert([serverData])
            .select()
            .single();
          break;

        case 'biometry_scans':
          result = await supabase
            .from('biometry_scans')
            .insert([serverData])
            .select()
            .single();
          break;

        default:
          throw new Error(`Unknown table: ${table}`);
      }

      if (result.error) throw result.error;

      // Mark as synced with remote ID
      await markAsSynced(table, localId, result.data.id);

    } catch (error) {
      // Self-healing: Handle duplicate key errors
      if (error instanceof Error && error.message.includes('duplicate')) {
        console.log(`⚠️ Duplicate key detected for ${table}, attempting self-healing...`);
        await this.handleDuplicateKeyError(table, localId, localRecord);
      } else {
        await markSyncError(table, localId, error instanceof Error ? error.message : 'Unknown sync error');
        throw error;
      }
    }
  }

  // Self-healing: Handle duplicate key errors by finding existing record and updating local reference
  private async handleDuplicateKeyError(table: string, localId: number, localRecord: any): Promise<void> {
    try {
      console.log(`🔍 Searching for existing record on server for ${table}...`);
      
      let existingRecord;
      let searchField = 'phone'; // Default for patients
      let searchValue = localRecord.phone;

      // Determine search criteria by table type
      if (table === 'patients' && localRecord.phone) {
        const { data } = await supabase
          .from('patients')
          .select('id')
          .eq('phone', localRecord.phone)
          .single();
        existingRecord = data;
      }

      if (existingRecord) {
        console.log(`✅ Found existing record with ID ${existingRecord.id}, marking as synced`);
        // Mark local record as synced with the remote ID
        await markAsSynced(table, localId, existingRecord.id);
      } else {
        console.warn(`❌ Could not find existing record for ${table}, marking as error`);
        throw new Error(`Duplicate key detected but could not find existing record`);
      }
    } catch (error) {
      console.error(`❌ Self-healing failed for ${table}:`, error);
      await markSyncError(table, localId, 'Duplicate key - self-healing failed');
      throw error;
    }
  }

  // Sync delete to server
  private async syncDelete(table: string, remoteId: string): Promise<void> {
    let result;

    switch (table) {
      case 'patients':
        result = await supabase.from('patients').delete().eq('id', remoteId);
        break;
      case 'visits':
        result = await supabase.from('antenatal_visits').delete().eq('id', remoteId);
        break;
      case 'ivf_cycles':
        result = await supabase.from('ivf_cycles').delete().eq('id', remoteId);
        break;
      case 'stimulation_logs':
        result = await supabase.from('stimulation_logs').delete().eq('id', remoteId);
        break;
      case 'pregnancies':
        result = await supabase.from('pregnancies').delete().eq('id', remoteId);
        break;
      case 'biometry_scans':
        result = await supabase.from('biometry_scans').delete().eq('id', remoteId);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }

    if (result.error) throw result.error;
  }

  // Pull latest data from server and update local DB
  private async pullLatestData(): Promise<void> {
    try {
      console.log('📥 Pulling latest data from server...');

      // Pull patients
      await this.pullTableData('patients');

      // Pull visits
      await this.pullTableData('antenatal_visits');

      // Pull IVF cycles
      await this.pullTableData('ivf_cycles');

      // Pull stimulation logs
      await this.pullTableData('stimulation_logs');

      // Pull pregnancies
      await this.pullTableData('pregnancies');

      // Pull biometry scans
      await this.pullTableData('biometry_scans');

      console.log('✅ Data pull completed');
    } catch (error) {
      console.error('❌ Failed to pull latest data:', error);
    }
  }

  // Pull data for a specific table
  private async pullTableData(tableName: string): Promise<void> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50); // Limit to prevent large data transfers

    if (error) throw error;

    // Update local database with server data
    for (const record of data || []) {
      await this.upsertLocalRecord(tableName, record);
    }
  }

  // Local database operations
  private async saveToLocal(table: string, data: any): Promise<any> {
    const localData = {
      ...data,
      sync_status: SyncStatus.PENDING_CREATE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    switch (table) {
      case 'patients':
        return await db.patients.add(localData);
      case 'visits':
        return await db.visits.add(localData);
      case 'ivf_cycles':
        return await db.ivf_cycles.add(localData);
      case 'stimulation_logs':
        return await db.stimulation_logs.add(localData);
      case 'pregnancies':
        return await db.pregnancies.add(localData);
      case 'biometry_scans':
        return await db.biometry_scans.add(localData);
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  private async updateLocal(table: string, localId: number, data: any): Promise<void> {
    const updateData = {
      ...data,
      sync_status: SyncStatus.PENDING_UPDATE,
      updated_at: new Date().toISOString()
    };

    switch (table) {
      case 'patients':
        await db.patients.update(localId, updateData);
        break;
      case 'visits':
        await db.visits.update(localId, updateData);
        break;
      case 'ivf_cycles':
        await db.ivf_cycles.update(localId, updateData);
        break;
      case 'stimulation_logs':
        await db.stimulation_logs.update(localId, updateData);
        break;
      case 'pregnancies':
        await db.pregnancies.update(localId, updateData);
        break;
      case 'biometry_scans':
        await db.biometry_scans.update(localId, updateData);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  private async markLocalDeleted(table: string, localId: number): Promise<void> {
    const updateData = {
      sync_status: SyncStatus.PENDING_DELETE,
      updated_at: new Date().toISOString()
    };

    switch (table) {
      case 'patients':
        await db.patients.update(localId, updateData);
        break;
      case 'visits':
        await db.visits.update(localId, updateData);
        break;
      case 'ivf_cycles':
        await db.ivf_cycles.update(localId, updateData);
        break;
      case 'stimulation_logs':
        await db.stimulation_logs.update(localId, updateData);
        break;
      case 'pregnancies':
        await db.pregnancies.update(localId, updateData);
        break;
      case 'biometry_scans':
        await db.biometry_scans.update(localId, updateData);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  private async deleteFromLocal(table: string, localId: number): Promise<void> {
    switch (table) {
      case 'patients':
        await db.patients.delete(localId);
        break;
      case 'visits':
        await db.visits.delete(localId);
        break;
      case 'ivf_cycles':
        await db.ivf_cycles.delete(localId);
        break;
      case 'stimulation_logs':
        await db.stimulation_logs.delete(localId);
        break;
      case 'pregnancies':
        await db.pregnancies.delete(localId);
        break;
      case 'biometry_scans':
        await db.biometry_scans.delete(localId);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  private async getLocalRecord(table: string, localId: number): Promise<any> {
    switch (table) {
      case 'patients':
        return await db.patients.get(localId);
      case 'visits':
        return await db.visits.get(localId);
      case 'ivf_cycles':
        return await db.ivf_cycles.get(localId);
      case 'stimulation_logs':
        return await db.stimulation_logs.get(localId);
      case 'pregnancies':
        return await db.pregnancies.get(localId);
      case 'biometry_scans':
        return await db.biometry_scans.get(localId);
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  private async upsertLocalRecord(table: string, remoteData: any): Promise<void> {
    // Check if record exists locally
    let existingRecord;

    switch (table) {
      case 'patients':
        existingRecord = await db.patients.where('remoteId').equals(remoteData.id).first();
        break;
      case 'antenatal_visits':
        existingRecord = await db.visits.where('remoteId').equals(remoteData.id).first();
        break;
      case 'ivf_cycles':
        existingRecord = await db.ivf_cycles.where('remoteId').equals(remoteData.id).first();
        break;
      case 'stimulation_logs':
        existingRecord = await db.stimulation_logs.where('remoteId').equals(remoteData.id).first();
        break;
      case 'pregnancies':
        existingRecord = await db.pregnancies.where('remoteId').equals(remoteData.id).first();
        break;
      case 'biometry_scans':
        existingRecord = await db.biometry_scans.where('remoteId').equals(remoteData.id).first();
        break;
    }

    if (existingRecord) {
      // Update existing record
      const updateData = {
        ...remoteData,
        remoteId: remoteData.id,
        sync_status: SyncStatus.SYNCED,
        updated_at: new Date().toISOString()
      };
      delete updateData.id; // Remove remote ID from update

      switch (table) {
        case 'patients':
          await db.patients.update(existingRecord.id!, updateData);
          break;
        case 'antenatal_visits':
          await db.visits.update(existingRecord.id!, updateData);
          break;
        case 'ivf_cycles':
          await db.ivf_cycles.update(existingRecord.id!, updateData);
          break;
        case 'stimulation_logs':
          await db.stimulation_logs.update(existingRecord.id!, updateData);
          break;
        case 'pregnancies':
          await db.pregnancies.update(existingRecord.id!, updateData);
          break;
        case 'biometry_scans':
          await db.biometry_scans.update(existingRecord.id!, updateData);
          break;
      }
    } else {
      // Insert new record
      const localData = {
        ...remoteData,
        remoteId: remoteData.id,
        sync_status: SyncStatus.SYNCED,
        created_at: remoteData.created_at || new Date().toISOString(),
        updated_at: remoteData.updated_at || new Date().toISOString()
      };
      delete localData.id; // Remove remote ID

      switch (table) {
        case 'patients':
          await db.patients.add(localData);
          break;
        case 'antenatal_visits':
          await db.visits.add(localData);
          break;
        case 'ivf_cycles':
          await db.ivf_cycles.add(localData);
          break;
        case 'stimulation_logs':
          await db.stimulation_logs.add(localData);
          break;
        case 'pregnancies':
          await db.pregnancies.add(localData);
          break;
        case 'biometry_scans':
          await db.biometry_scans.add(localData);
          break;
      }
    }
  }

  // Prepare data for server (remove local fields)
  private prepareForServer(data: any, fieldsToRemove: string[] = []): any {
    const serverData = { ...data };
    fieldsToRemove.forEach(field => delete serverData[field]);

    // Convert camelCase to snake_case for Supabase
    const converted: any = {};
    for (const [key, value] of Object.entries(serverData)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeKey] = value;
    }

    return converted;
  }

  // Get sync status
  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.performBackgroundSync();
  }

  // Initialize sync on app load - process pending items immediately
  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing sync on app load...');
    try {
      // Process any pending items immediately on app load
      await this.processSyncQueue();
      console.log('✅ Sync initialization completed');
    } catch (error) {
      console.error('⚠️ Error during sync initialization:', error);
      // Don't throw - let app continue even if sync fails
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // API compatibility methods for existing code
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
    } else {
      throw new Error(`Record not found for update: ${table} ${remoteId}`);
    }
  }

  async delete(table: string, remoteId: string) {
    const localRecord = await this.getLocalRecordByRemoteId(table, remoteId);
    if (localRecord) {
      await this.deleteItem(table, localRecord.id);
    } else {
      throw new Error(`Record not found for delete: ${table} ${remoteId}`);
    }
  }

  private async getLocalRecordByRemoteId(table: string, remoteId: string): Promise<any> {
    switch (table) {
      case 'patients':
        return await db.patients.where('remoteId').equals(remoteId).first();
      case 'visits':
        return await db.visits.where('remoteId').equals(remoteId).first();
      case 'ivf_cycles':
        return await db.ivf_cycles.where('remoteId').equals(remoteId).first();
      case 'stimulation_logs':
        return await db.stimulation_logs.where('remoteId').equals(remoteId).first();
      case 'pregnancies':
        return await db.pregnancies.where('remoteId').equals(remoteId).first();
      case 'biometry_scans':
        return await db.biometry_scans.where('remoteId').equals(remoteId).first();
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }
}

// Create and export singleton instance
export const syncService = new SyncService();
export const syncManager = syncService;