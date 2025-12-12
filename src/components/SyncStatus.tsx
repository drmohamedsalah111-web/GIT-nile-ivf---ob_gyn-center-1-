import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';

interface SyncStatusProps {
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const { uiStatus, lastSyncTime } = useSyncStatus();

  const getStatusInfo = () => {
    if (uiStatus === 'OFFLINE') {
      return {
        icon: CloudOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        text: 'OFFLINE',
        description: 'All data saved locally',
        spin: false
      };
    }

    if (uiStatus === 'SYNCING') {
      return {
        icon: RefreshCw,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        text: 'SYNCING',
        description: 'Synchronizing data...',
        spin: true
      };
    }

    return {
      icon: Cloud,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: 'READY',
      description: lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Synced',
      spin: false
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
        <Icon
          className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`}
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

      {uiStatus === 'SYNCING' && (
        <div className="text-xs text-yellow-600">
          Auto-sync in progress...
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
