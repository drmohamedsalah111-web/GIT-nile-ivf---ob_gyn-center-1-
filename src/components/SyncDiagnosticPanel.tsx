import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Wifi, WifiOff, Database, Clock, Zap } from 'lucide-react';
import {
  getFullConnectionStatus,
  printSyncDiagnostics,
  diagnoseSync,
  ConnectionStatus
} from '../utils/connectionDiagnostics';

const SyncDiagnosticPanel: React.FC<{ expanded?: boolean }> = ({ expanded: initialExpanded = false }) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadStatus = async () => {
    setLoading(true);
    try {
      const newStatus = await getFullConnectionStatus();
      setStatus(newStatus);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status) return 'bg-gray-100';
    return status.overall.status === 'connected'
      ? 'bg-green-50 border-green-200'
      : status.overall.status === 'partial'
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';
  };

  const getStatusIcon = () => {
    if (!status) return null;
    if (status.overall.status === 'connected') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (status.overall.status === 'partial') {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  if (!status) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm">
        Loading sync diagnostics...
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()} transition-all`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:opacity-75 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-gray-900">
            {status.overall.status === 'connected'
              ? '✅ Sync Healthy'
              : status.overall.status === 'partial'
              ? '⚠️ Sync Issues'
              : '❌ Sync Offline'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {expanded ? '▼' : '▶'} {lastRefresh.toLocaleTimeString()}
        </span>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Connection Status */}
          <div className="bg-white rounded p-3 space-y-2 border border-gray-200">
            <div className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Connection Status
            </div>

            <div className="ml-6 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                {status.supabase.connected ? (
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
                <span>Supabase: {status.supabase.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {status.supabase.user && (
                <div className="text-gray-600 ml-4">👤 {status.supabase.user.email}</div>
              )}
              {status.supabase.error && (
                <div className="text-red-600 ml-4 font-mono break-words">{status.supabase.error}</div>
              )}

              <div className="flex items-center gap-2 mt-1">
                {status.powerSync.connected ? (
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
                <span>PowerSync: {status.powerSync.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {status.powerSync.error && (
                <div className="text-red-600 ml-4 font-mono break-words">{status.powerSync.error}</div>
              )}
            </div>
          </div>

          {/* Upload Queue Status */}
          <div className="bg-white rounded p-3 space-y-2 border border-gray-200">
            <div className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Upload Queue
            </div>

            <div className="ml-6 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>Pending operations:</span>
                <span className="font-mono font-bold">
                  {status.sync.uploadQueueSize}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Successful uploads:</span>
                <span className="font-mono font-bold text-green-600">
                  {status.sync.successfulUploads}
                </span>
              </div>
            </div>

            {status.sync.uploadQueueSize > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 ml-6">
                <div className="font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Data queued for upload
                </div>
                <div className="mt-1">
                  {status.sync.lastUploadError ? (
                    <>
                      <div className="text-red-700 font-semibold">❌ Upload Error:</div>
                      <div className="font-mono text-red-600 mt-1 break-words">
                        {status.sync.lastUploadError}
                      </div>
                      {status.sync.lastUploadErrorAt && (
                        <div className="text-red-600 text-xs mt-1">
                          {new Date(status.sync.lastUploadErrorAt).toLocaleString()}
                        </div>
                      )}
                    </>
                  ) : (
                    'Will sync when online or on next sync interval'
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pending Operations */}
          {status.sync.pendingOperations.length > 0 && (
            <div className="bg-white rounded p-3 space-y-2 border border-gray-200">
              <div className="font-medium text-sm text-gray-700">
                📋 Recent Operations ({status.sync.pendingOperations.length})
              </div>

              <div className="ml-2 space-y-1 text-xs font-mono max-h-40 overflow-y-auto">
                {status.sync.pendingOperations.slice(0, 10).map((op, idx) => {
                  const opTypeMap = { 1: 'INSERT', 2: 'UPDATE', 3: 'DELETE' };
                  const opType = opTypeMap[op.op as keyof typeof opTypeMap] || `Unknown(${op.op})`;
                  return (
                    <div key={idx} className="text-gray-600 p-1 bg-gray-50 rounded">
                      <span className="text-blue-600">{op.table}</span>
                      {' '}
                      <span className="text-amber-600 font-bold">{opType}</span>
                      {' '}
                      <span className="text-gray-400 text-xs">{op.id.substring(0, 8)}...</span>
                    </div>
                  );
                })}
                {status.sync.pendingOperations.length > 10 && (
                  <div className="text-gray-500 italic">
                    ... and {status.sync.pendingOperations.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostics Actions */}
          <div className="flex gap-2">
            <button
              onClick={loadStatus}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors"
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={() => printSyncDiagnostics()}
              className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
            >
              📋 Console
            </button>
            <button
              onClick={() => diagnoseSync()}
              className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
            >
              🔍 Diagnose
            </button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
            <div className="font-semibold mb-1">💡 Troubleshooting:</div>
            <ul className="list-disc list-inside space-y-1">
              {!status.supabase.connected && (
                <li>Supabase not connected - Check network and credentials</li>
              )}
              {!status.powerSync.connected && (
                <li>PowerSync not connected - Restart or check POWERSYNC_URL</li>
              )}
              {status.sync.uploadQueueSize > 0 && status.sync.lastUploadError && (
                <li>
                  {status.sync.lastUploadError.includes('UNIQUE')
                    ? 'UNIQUE constraint error - Duplicate record detected'
                    : status.sync.lastUploadError.includes('RLS')
                    ? 'RLS violation - Check permissions'
                    : 'Upload error - See details above'}
                </li>
              )}
              {status.sync.uploadQueueSize > 0 && !status.sync.lastUploadError && (
                <li>Data queued for upload - Waiting for connection</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncDiagnosticPanel;
