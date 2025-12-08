import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, AlertCircle, RotateCw } from 'lucide-react';
import { syncService } from '../src/services/syncService';
import toast from 'react-hot-toast';

interface SyncStatusState {
  isOnline: boolean;
  syncInProgress: boolean;
  pendingCount: number;
  hasErrors: boolean;
}

const SyncStatus: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusState>({
    isOnline: navigator.onLine,
    syncInProgress: false,
    pendingCount: 0,
    hasErrors: false
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const syncStatus = syncService.getSyncStatus();
      setStatus(prev => ({
        ...prev,
        isOnline: syncStatus.isOnline,
        syncInProgress: syncStatus.syncInProgress
      }));
    };

    // Check status every 2 seconds
    const interval = setInterval(updateStatus, 2000);
    
    // Listen for network changes
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      toast.success('🔄 Connection restored - syncing...');
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      toast.error('📴 Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await syncService.forceSync();
      toast.success('✅ Sync completed');
    } catch (error) {
      toast.error('❌ Sync failed - check your connection');
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine status color and icon
  const getStatusDisplay = () => {
    if (!status.isOnline) {
      return {
        color: 'text-gray-400',
        bgColor: 'bg-gray-100 hover:bg-gray-200',
        icon: <CloudOff className="w-5 h-5" />,
        label: 'Offline',
        description: 'Waiting for connection...'
      };
    }

    if (status.hasErrors) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-100 hover:bg-red-200',
        icon: <AlertCircle className="w-5 h-5" />,
        label: 'Sync Error',
        description: 'Click to retry'
      };
    }

    if (status.syncInProgress || status.pendingCount > 0) {
      return {
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 hover:bg-amber-200',
        icon: (
          <Cloud className={`w-5 h-5 ${status.syncInProgress ? 'animate-pulse' : ''}`} />
        ),
        label: 'Syncing...',
        description: `${status.pendingCount} pending items`
      };
    }

    return {
      color: 'text-green-500',
      bgColor: 'bg-green-100 hover:bg-green-200',
      icon: <Cloud className="w-5 h-5" />,
      label: 'All Synced',
      description: 'Everything is up to date'
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
              <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-gray-700">
                {status.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.syncInProgress ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
              <span className="text-gray-700">
                {status.syncInProgress ? 'Syncing' : 'Idle'}
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
