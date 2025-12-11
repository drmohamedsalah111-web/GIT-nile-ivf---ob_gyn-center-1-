import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from '../db/localDB';

// Temporary sync stats function
const getSyncStats = async () => ({ synced: 0, pending: 0, errors: 0 });

interface SyncStatusProps {
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  // Get sync statistics from local database
  const syncStats = useLiveQuery(async () => {
    return await getSyncStats();
  }, []);

  // Check online status
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!syncStats) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const { synced, pending, errors } = syncStats;
  const hasPendingItems = pending > 0;
  const hasErrors = errors > 0;

  // Determine status and styling
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        text: 'Offline Mode',
        description: hasPendingItems ? `${pending} items pending` : 'All data saved locally'
      };
    }

    if (hasErrors) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        text: 'Sync Issues',
        description: `${errors} items failed to sync`
      };
    }

    if (hasPendingItems) {
      return {
        icon: RefreshCw,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        text: 'Syncing...',
        description: `${pending} items pending`
      };
    }

    return {
      icon: Cloud,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: 'All Synced',
      description: `${synced} items synced`
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
        <Icon
          className={`w-4 h-4 ${statusInfo.color} ${hasPendingItems && isOnline ? 'animate-spin' : ''}`}
        />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          <span className="text-xs text-gray-600">
            {statusInfo.description}
          </span>
        </div>
      </div>

      {/* Additional info for pending items */}
      {hasPendingItems && isOnline && (
        <div className="text-xs text-yellow-600">
          Auto-sync in progress...
        </div>
      )}

      {/* Error indicator */}
      {hasErrors && (
        <div className="text-xs text-red-600">
          Check connection
        </div>
      )}
    </div>
  );
};

export default SyncStatus;