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
        // Pull parents first
        await this.pullTable('patients');
        await this.pullTable('pregnancies');
        await this.pullTable('ivf_cycles');
        
        // Pull children - they can now resolve parent references
        await Promise.all([
            this.pullTable('antenatal_visits', 'visits'),
            this.pullTable('stimulation_logs'),
            this.pullTable('biometry_scans')
        ]);
        
        // Clean up orphaned records (visits/cycles with wrong patient_id format)
        await this.cleanupOrphanedRecords();
    } catch (e) { console.error('Pull error:', e); }
  }

  private async cleanupOrphanedRecords(): Promise<void> {
    try {
      console.log('🧹 Cleaning up orphaned records...');
      
      // Get all patients with both ID formats
      const patients = await db.patients.toArray();
      const idMap = new Map<number | string, { numeric: number; uuid: string }>();
      
      for (const p of patients) {
        if (p.id && p.remoteId) {
          idMap.set(p.id, { numeric: p.id, uuid: p.remoteId });
          idMap.set(p.remoteId, { numeric: p.id, uuid: p.remoteId });
        }
      }

      // Update visits with numeric patient_id to use UUID
      const visits = await db.visits.toArray();
      let updatedCount = 0;
      
      for (const visit of visits) {
        if (visit.patient_id && !isNaN(Number(visit.patient_id))) {
          const mapping = idMap.get(Number(visit.patient_id));
          if (mapping && mapping.uuid !== visit.patient_id) {
            console.log(`🔗 Updating visit ${visit.id}: patient_id ${visit.patient_id} -> ${mapping.uuid}`);
            await db.visits.update(visit.id!, { patient_id: mapping.uuid });
            updatedCount++;
          }
        }
      }

      // Update cycles with numeric patient_id to use UUID
      const cycles = await db.ivf_cycles.toArray();
      for (const cycle of cycles) {
        if (cycle.patient_id && !isNaN(Number(cycle.patient_id))) {
          const mapping = idMap.get(Number(cycle.patient_id));
          if (mapping && mapping.uuid !== cycle.patient_id) {
            console.log(`🔗 Updating cycle ${cycle.id}: patient_id ${cycle.patient_id} -> ${mapping.uuid}`);
            await db.ivf_cycles.update(cycle.id!, { patient_id: mapping.uuid });
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ Cleaned up ${updatedCount} orphaned records`);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }

  private async pullTable(remoteTable: string, localTableAlias?: string): Promise<void> {
    const localTable = localTableAlias || remoteTable;
    const { data, error } = await supabase.from(remoteTable).select('*').limit(1000);
    if (error || !data) {
      console.warn(`⚠️ Error pulling ${remoteTable}:`, error?.message);
      return;
    }

    console.log(`📥 Pulling ${remoteTable}: ${data.length} records`);

    await db.transaction('rw', [db.table(localTable)], async () => {
        for (const remoteRow of data) {
            const existing = await db.table(localTable).where('remoteId').equals(remoteRow.id).first();
            const cleanRow = { ...remoteRow, remoteId: remoteRow.id, sync_status: SyncStatus.SYNCED };
            delete cleanRow.id; 
            
            // CRITICAL: Ensure foreign keys are properly resolved (convert any local IDs to remote UUIDs)
            // This ensures consistency when visits/cycles reference patients
            
            if (cleanRow.patient_id) {
                // If patient_id is numeric, convert to UUID
                if (!isNaN(Number(cleanRow.patient_id))) {
                    const patient = await db.patients.get(Number(cleanRow.patient_id));
                    if (patient?.remoteId) {
                        console.log(`🔗 Converting patient_id ${cleanRow.patient_id} -> ${patient.remoteId}`);
                        cleanRow.patient_id = patient.remoteId;
                    }
                }
                // If it's already a UUID, verify it exists
                else {
                    const patient = await db.patients.where('remoteId').equals(cleanRow.patient_id).first();
                    if (!patient) {
                        console.warn(`⚠️ Record references unknown patient: ${cleanRow.patient_id}`);
                    }
                }
            }
            
            if (cleanRow.pregnancy_id) {
                if (!isNaN(Number(cleanRow.pregnancy_id))) {
                    const pregnancy = await db.pregnancies.get(Number(cleanRow.pregnancy_id));
                    if (pregnancy?.remoteId) {
                        cleanRow.pregnancy_id = pregnancy.remoteId;
                    }
                } else {
                    const pregnancy = await db.pregnancies.where('remoteId').equals(cleanRow.pregnancy_id).first();
                    if (!pregnancy) {
                        console.warn(`⚠️ Record references unknown pregnancy: ${cleanRow.pregnancy_id}`);
                    }
                }
            }

            if (cleanRow.cycle_id) {
                if (!isNaN(Number(cleanRow.cycle_id))) {
                    const cycle = await db.ivf_cycles.get(Number(cleanRow.cycle_id));
                    if (cycle?.remoteId) {
                        cleanRow.cycle_id = cycle.remoteId;
                    }
                }
            }

            if (existing) {
                await db.table(localTable).update(existing.id, cleanRow);
                console.log(`♻️ Updated existing record: ${localTable}/${existing.id}`);
            } else {
                await db.table(localTable).add(cleanRow);
                console.log(`✅ Added new record: ${localTable}`);
            }
        }
    });
    console.log(`✅ Finished pulling ${remoteTable}`);
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

  // Diagnostic & Manual Repair
  async diagnoseOrphanedData(): Promise<{
    patients: number;
    orphanedVisits: any[];
    orphanedCycles: any[];
    orphanedPregnancies: any[];
  }> {
    console.log('🔍 Diagnosing data integrity...');
    
    const patients = await db.patients.toArray();
    const visits = await db.visits.toArray();
    const cycles = await db.ivf_cycles.toArray();
    const pregnancies = await db.pregnancies.toArray();

    // Find orphaned records
    const patientIds = new Set<string | number>();
    patients.forEach(p => {
      if (p.id) patientIds.add(p.id);
      if (p.remoteId) patientIds.add(p.remoteId);
    });

    const orphanedVisits = visits.filter(v => v.patient_id && !patientIds.has(v.patient_id));
    const orphanedCycles = cycles.filter(c => c.patient_id && !patientIds.has(c.patient_id));

    const pregnancyIds = new Set<string | number>();
    pregnancies.forEach(p => {
      if (p.id) pregnancyIds.add(p.id);
      if (p.remoteId) pregnancyIds.add(p.remoteId);
    });

    const orphanedPregnancies = pregnancies.filter(p => p.patient_id && !patientIds.has(p.patient_id));

    const report = {
      patients: patients.length,
      orphanedVisits: orphanedVisits.length,
      orphanedCycles: orphanedCycles.length,
      orphanedPregnancies: orphanedPregnancies.length,
      orphanedVisitsData: orphanedVisits,
      orphanedCyclesData: orphanedCycles,
      orphanedPregnanciesData: orphanedPregnancies
    };

    console.table(report);
    return {
      patients: patients.length,
      orphanedVisits: orphanedVisits,
      orphanedCycles: orphanedCycles,
      orphanedPregnancies: orphanedPregnancies
    };
  }

  async repairAllData(): Promise<void> {
    console.log('🔧 Starting comprehensive data repair...');
    
    // Step 1: Force pull latest from Supabase
    console.log('Step 1/3: Pulling latest data from Supabase...');
    await this.pullLatestData();
    
    // Step 2: Run cleanup
    console.log('Step 2/3: Cleaning up orphaned records...');
    await this.cleanupOrphanedRecords();
    
    // Step 3: Force sync any pending items
    console.log('Step 3/3: Syncing pending changes...');
    await this.processSyncQueue();
    
    console.log('✅ Data repair completed!');
    
    // Show final diagnosis
    const diagnosis = await this.diagnoseOrphanedData();
    console.log('📊 Final Data Status:');
    console.log(`   Patients: ${diagnosis.patients}`);
    console.log(`   Orphaned Visits: ${diagnosis.orphanedVisits.length}`);
    console.log(`   Orphaned Cycles: ${diagnosis.orphanedCycles.length}`);
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