import { useEffect, useState } from 'react';
import { db } from '../lib/localDb';

export interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  pendingItemsCount: number;
  lastSyncTime?: Date;
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    syncInProgress: false,
    pendingItemsCount: 0,
  });

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updatePendingCount = async () => {
      const pendingItems = await db.syncQueue.where('retryCount').below(3).toArray();
      setSyncStatus(prev => ({
        ...prev,
        pendingItemsCount: pendingItems.length
      }));
    };

    const interval = setInterval(updatePendingCount, 5000);
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return syncStatus;
};

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
