import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncManager } from '../src/services/syncService';
import toast from 'react-hot-toast';

interface RefreshButtonProps {
  onRefreshComplete?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefreshComplete,
  showLabel = true,
  size = 'md',
  variant = 'primary'
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncManager.forceSync();
      toast.success('Data refreshed successfully');
      onRefreshComplete?.();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm gap-1',
    md: 'px-4 py-2 gap-2',
    lg: 'px-6 py-3 gap-2'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`flex items-center ${sizeClasses[size]} ${variantClasses[variant]} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      title="Refresh data from server"
    >
      <RefreshCw className={`${iconSizes[size]} ${isRefreshing ? 'animate-spin' : ''}`} />
      {showLabel && <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>}
    </button>
  );
};

export default RefreshButton;
