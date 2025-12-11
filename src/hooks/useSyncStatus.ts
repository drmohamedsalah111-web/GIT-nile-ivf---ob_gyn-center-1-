import { useEffect, useState } from 'react';
import { useStatus } from '@powersync/react';

export interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  pendingItemsCount: number;
  lastSyncTime?: Date;
}

export const useSyncStatus = (): SyncStatus => {
  const status = useStatus() as any;

  return {
    isOnline: status.connected,
    syncInProgress: status.uploading || status.downloading,
    pendingItemsCount: 0, // PowerSync handles this internally
    lastSyncTime: status.lastSyncedAt
  };
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
