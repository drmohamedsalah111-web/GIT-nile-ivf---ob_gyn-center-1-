import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, AlertCircle, RotateCw } from 'lucide-react';
import { useSyncStatus } from '../src/hooks/useSyncStatus';
import { initPowerSync } from '../src/powersync/client';
import toast from 'react-hot-toast';

interface SyncStatusState {
  isOnline: boolean;
  syncInProgress: boolean;
  pendingCount: number;
  hasErrors: boolean;
}

const SyncStatus: React.FC = () => {
  // Use PowerSync status as single source of truth
  const { isOnline, syncInProgress, lastSyncTime } = useSyncStatus();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Map PowerSync status to component state
  const status: SyncStatusState = {
    isOnline,
    syncInProgress,
    pendingCount: 0, // PowerSync handles this internally
    hasErrors: false // Will be determined by connection state
  };

  useEffect(() => {
    // Listen for network changes and show toasts
    const handleOnline = () => {
      toast.success('🔄 Connection restored - PowerSync will sync automatically');
    };

    const handleOffline = () => {
      toast.error('📴 Connection lost - working offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await initPowerSync(3, 2000, true); // Force reconnection
      toast.success('✅ PowerSync reconnected');
    } catch (error) {
      toast.error('❌ Reconnection failed - check your connection');
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine status color and icon based on PowerSync status
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        color: 'text-gray-400',
        bgColor: 'bg-gray-100 hover:bg-gray-200',
        icon: <CloudOff className="w-5 h-5" />,
        label: 'Offline Mode',
        description: 'Data available locally'
      };
    }

    if (syncInProgress) {
      return {
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 hover:bg-amber-200',
        icon: <Cloud className="w-5 h-5 animate-pulse" />,
        label: 'Syncing...',
        description: 'Synchronizing data...'
      };
    }

    return {
      color: 'text-green-500',
      bgColor: 'bg-green-100 hover:bg-green-200',
      icon: <Cloud className="w-5 h-5" />,
      label: 'Connected',
      description: lastSyncTime ? `Synced: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'All synced'
    };
  };

  const display = getStatusDisplay();
  const isError = status.hasErrors;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowTooltip(!showTooltip);
          if (isError) handleRetrySync();
        }}
        disabled={isRetrying}
        className={`${display.bgColor} ${display.color} p-2 rounded-full transition-all duration-200 relative group cursor-pointer disabled:opacity-50`}
        title={display.label}
      >
        {isRetrying ? (
          <RotateCw className="w-5 h-5 animate-spin" />
        ) : (
          display.icon
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-3 z-50 border border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {display.label}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {display.description}
          </div>
          
          {/* Status indicators */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-gray-700">
                {isOnline ? 'PowerSync Connected' : 'Offline Mode'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${syncInProgress ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
              <span className="text-gray-700">
                {syncInProgress ? 'Syncing' : 'Synced'}
              </span>
            </div>
          </div>

          {/* Retry button */}
          {isError && (
            <button
              onClick={handleRetrySync}
              disabled={isRetrying}
              className="mt-3 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium py-1 rounded transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Retry Sync'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
