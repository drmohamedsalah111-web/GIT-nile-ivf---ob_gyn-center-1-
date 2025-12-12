import { useEffect, useState } from 'react';
import { useStatus } from '@powersync/react';

export type PowerSyncUiStatus = 'OFFLINE' | 'SYNCING' | 'READY';

export interface SyncStatus {
  uiStatus: PowerSyncUiStatus;
  lastSyncTime?: Date;
}

function mapUiStatus(status: any): PowerSyncUiStatus {
  if (!status?.connected) return 'OFFLINE';
  if (status?.uploading || status?.downloading || status?.connecting) return 'SYNCING';
  return 'READY';
}

export const useSyncStatus = (): SyncStatus => {
  const status = useStatus() as any;

  return {
    uiStatus: mapUiStatus(status),
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
