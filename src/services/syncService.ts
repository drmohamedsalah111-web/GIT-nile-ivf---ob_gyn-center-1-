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
    window.addEventListener('online', () => { 
      console.log('🔄 Online: Syncing...'); 
      this.isOnline = true; 
      this.forceSync(); 
    });
    window.addEventListener('offline', () => { 
      console.log('📴 Offline mode'); 
      this.isOnline = false; 
    });
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => { 
      if (this.isOnline && !this.syncInProgress) this.performBackgroundSync(); 
    }, 30000); // كل 30 ثانية
  }

  // --- دوال التعامل مع البيانات (API) ---

  async initializeSync(): Promise<void> {
    console.log('🚀 Initializing Sync Engine...');
    // 1. حاول رفع البيانات المعلقة أولاً
    await this.processSyncQueue();
    // 2. اسحب أحدث البيانات من السيرفر لتحديث الواجهة
    await this.pullLatestData();
    console.log('✅ Sync Engine Ready');
  }

  async saveItem(table: string, data: any): Promise<any> {
    // 1. الحفظ محلياً فوراً
    const localData = { ...data, sync_status: SyncStatus.PENDING_CREATE, created_at: new Date().toISOString() };
    const id = await db.table(table).add(localData) as number;
    const localRecord = { ...localData, id };
    
    // 2. إضافة لطابور المزامنة
    await addToSyncQueue({ table, operation: 'create', localId: id, payload: data, retryCount: 0, maxRetries: 3 });
    
    // 3. محاولة المزامنة الفورية إذا كان متصلاً
    if (this.isOnline) {
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

  // --- منطق المزامنة الخلفي (The Brain) ---

  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;
    try { 
      await this.processSyncQueue(); 
      await this.pullLatestData(); 
    } catch (e) { 
      console.error('Sync Error:', e); 
    } finally { 
      this.syncInProgress = false; 
    }
  }

  private async processSyncQueue(): Promise<void> {
    const items = await getPendingSyncItems();
    for (const item of items) {
        if (item.retryCount >= item.maxRetries) { await removeFromSyncQueue(item.id!); continue; }
        try {
            const rec = await db.table(item.table).get(item.localId);
            if (!rec && item.operation !== 'delete') { await removeFromSyncQueue(item.id!); continue; }

            // *** الذكاء: إصلاح الارتباطات المقطوعة (Local ID -> Remote UUID) ***
            // قبل الرفع، نتأكد أن السجل مرتبط بـ UUID السحابي وليس الرقم المحلي
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

  // دالة تحويل المعرفات المحلية إلى معرفات سحابية
  private async resolveForeignKeys(table: string, record: any): Promise<any> {
    const updatedRecord = { ...record };
    let hasChanges = false;

    // إصلاح معرف المريض
    if (updatedRecord.patient_id && !isNaN(Number(updatedRecord.patient_id))) {
        const patient = await db.patients.get(Number(updatedRecord.patient_id));
        if (patient && patient.remoteId) {
            updatedRecord.patient_id = patient.remoteId;
            hasChanges = true;
        }
    }
    // إصلاح معرف الحمل
    if (updatedRecord.pregnancy_id && !isNaN(Number(updatedRecord.pregnancy_id))) {
        const pregnancy = await db.pregnancies.get(Number(updatedRecord.pregnancy_id));
        if (pregnancy && pregnancy.remoteId) {
            updatedRecord.pregnancy_id = pregnancy.remoteId;
            hasChanges = true;
        }
    }
    // إصلاح معرف الدورة
    if (updatedRecord.cycle_id && !isNaN(Number(updatedRecord.cycle_id))) {
        const cycle = await db.ivf_cycles.get(Number(updatedRecord.cycle_id));
        if (cycle && cycle.remoteId) {
            updatedRecord.cycle_id = cycle.remoteId;
            hasChanges = true;
        }
    }

    // إذا تم التصحيح، نحدث السجل المحلي أيضاً
    if (hasChanges) {
        await db.table(table).update(record.id, updatedRecord);
    }

    return updatedRecord;
  }

  private async syncItem(table: string, localId: number, record: any): Promise<void> {
    const supabaseTable = table;
    
    const payload = { ...record };
    // تنظيف البيانات قبل الإرسال
    delete payload.id; 
    delete payload.sync_status;
    delete payload.sync_error;
    delete payload.last_sync_attempt;
    delete payload.remoteId;
    
    // حماية: لا ترسل سجل بدون معرف الأب (Foreign Key)
    if (table !== 'patients' && !payload.patient_id && !payload.pregnancy_id && !payload.cycle_id) {
       console.warn(`⚠️ Skipping sync for ${table} ${localId}: Missing Foreign Key`);
       return; 
    }

    const { data, error } = await supabase.from(supabaseTable).upsert(payload).select().single();
    if (error) throw error;
    await markAsSynced(table, localId, data.id);
  }

  private async syncDelete(table: string, remoteId: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', remoteId);
    if (error) throw error;
  }

  // --- منطق السحب (Pull) ---
  
  private async pullLatestData(): Promise<void> {
    try {
        console.log('📥 Pulling data...');
        // نسحب الجداول بالترتيب لتجنب الأخطاء
        await this.pullTable('patients');
        await this.pullTable('ivf_cycles');
        await this.pullTable('pregnancies');
        await Promise.all([
            this.pullTable('antenatal_visits'),
            this.pullTable('stimulation_logs'),
            this.pullTable('biometry_scans'),
            this.pullTable('patient_files') // تمت إضافة جدول الملفات
        ]);
        console.log('✅ Pull completed');
    } catch (e) { console.error('Pull error:', e); }
  }

  private async pullTable(remoteTable: string, localTableAlias?: string): Promise<void> {
    const localTable = localTableAlias || remoteTable;
    
    // تأكد من وجود الجدول محلياً قبل السحب
    if (!db.tables.some(t => t.name === localTable)) return;

    const { data, error } = await supabase.from(remoteTable).select('*').limit(1000);
    if (error || !data) return;

    // *** الحل لمشكلة 3-6 arguments ***
    // نمرر الجداول كمصفوفة (Array)
    await db.transaction('rw', [db.table(localTable)], async () => {
        for (const remoteRow of data) {
            const existing = await db.table(localTable).where('remoteId').equals(remoteRow.id).first();
            const cleanRow = { ...remoteRow, remoteId: remoteRow.id, sync_status: SyncStatus.SYNCED };
            delete cleanRow.id; // نحافظ على الـ ID المحلي

            if (existing) { await db.table(localTable).update(existing.id, cleanRow); } 
            else { await db.table(localTable).add(cleanRow); }
        }
    });
  }

  // دوال للتوافق مع الكود القديم
  async forceSync() { await this.performBackgroundSync(); }
  getSyncStatus() { return { isOnline: this.isOnline, syncInProgress: this.syncInProgress }; }
  async save(t: string, d: any) { return this.saveItem(t, d); }
  async read(t: string) { await this.pullLatestData(); }
  async update(t: string, rid: string, d: any) { const r = await db.table(t).where('remoteId').equals(rid).first(); if(r) await this.updateItem(t, r.id, d); }
  async delete(t: string, rid: string) { const r = await db.table(t).where('remoteId').equals(rid).first(); if(r) await this.deleteItem(t, r.id); }
}

export const syncService = new SyncService();
export const syncManager = syncService;