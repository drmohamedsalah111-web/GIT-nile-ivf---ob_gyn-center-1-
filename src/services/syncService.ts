// ⚠️ Legacy sync system disabled
// ده Stub بسيط عشان الكود القديم يشتغل من غير ما نستخدم Dexie sync

export class SyncService {
  getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      syncInProgress: false,
    };
  }

  async initializeSync(): Promise<void> {
    console.log('Legacy SyncService.initializeSync() called – no-op (PowerSync in use).');
  }

  async forceSync(): Promise<void> {
    console.log('Legacy SyncService.forceSync() called – no-op.');
  }

  fireAndForgetSync(): void {
    console.log('Legacy SyncService.fireAndForgetSync() called – no-op.');
  }

  async saveItem(_table: string, _data: any): Promise<any> {
    console.log('Legacy SyncService.saveItem() called – no-op (use Supabase / PowerSync instead).');
    return null;
  }

  async updateItem(_table: string, _localId: number, _data: any): Promise<void> {
    console.log('Legacy SyncService.updateItem() called – no-op (use Supabase / PowerSync instead).');
  }

  async deleteItem(_table: string, _localId: number): Promise<void> {
    console.log('Legacy SyncService.deleteItem() called – no-op (use Supabase / PowerSync instead).');
  }

  async pushPendingItems(): Promise<{ success: number; failed: number; errors: string[] }> {
    console.log('Legacy SyncService.pushPendingItems() called – no-op.');
    return { success: 0, failed: 0, errors: [] };
  }

  async retryFailedItems(): Promise<number> {
    console.log('Legacy SyncService.retryFailedItems() called – no-op.');
    return 0;
  }

  async save(_table: string, _data: any) {
    throw new Error('Legacy sync disabled – use Supabase / PowerSync instead.');
  }

  async read(_table: string) {
    throw new Error('Legacy sync disabled – use Supabase / PowerSync instead.');
  }

  async update(_table: string, _remoteId: string, _data: any) {
    throw new Error('Legacy sync disabled – use Supabase / PowerSync instead.');
  }

  async delete(_table: string, _remoteId: string) {
    throw new Error('Legacy sync disabled – use Supabase / PowerSync instead.');
  }
}

export const syncService = new SyncService();

// alias للكود القديم اللي بيستخدم syncManager
export const syncManager = syncService;
