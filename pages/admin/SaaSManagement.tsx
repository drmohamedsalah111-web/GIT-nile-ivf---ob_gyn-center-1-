// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - SUPER ADMIN DASHBOARD
// ============================================================================
// Phase 4: Super Admin Subscription Management Interface
// Date: December 26, 2025
// ============================================================================

import React, { useEffect, useState } from 'react';
import { 
  getAllClinicSubscriptions, 
  getSubscriptionStats,
  getExpiringSoonSubscriptions 
} from '../../services/subscriptionService';
import type { 
  ClinicSubscriptionWithPlan, 
  SubscriptionStats,
  SubscriptionExpiryNotification 
} from '../../types/subscription';
import SubscriptionStatsCards from './SubscriptionStatsCards';
import SubscriptionsDataTable from './SubscriptionsDataTable';
import ExpiringSubscriptionsAlert from './ExpiringSubscriptionsAlert';

/**
 * SaaSManagement Component
 * 
 * Super Admin dashboard for managing all clinic subscriptions.
 * Only accessible to users with admin role.
 * 
 * Features:
 * - View all subscriptions
 * - Statistics overview
 * - Expiring subscriptions alerts
 * - Renew/extend subscriptions
 * - Change subscription plans
 * - View subscription history
 */
const SaaSManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<ClinicSubscriptionWithPlan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [expiringNotifications, setExpiringNotifications] = useState<SubscriptionExpiryNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'trial' | 'expired' | 'expiring'>('all');

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load in parallel for better performance
      const [subscriptionsData, statsData, expiringData] = await Promise.all([
        getAllClinicSubscriptions(),
        getSubscriptionStats(),
        getExpiringSoonSubscriptions(7)
      ]);

      setSubscriptions(subscriptionsData);
      setStats(statsData);
      setExpiringNotifications(expiringData);
    } catch (err: any) {
      console.error('Error loading SaaS data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const getFilteredSubscriptions = () => {
    switch (selectedTab) {
      case 'active':
        return subscriptions.filter(s => s.status === 'active');
      case 'trial':
        return subscriptions.filter(s => s.status === 'trial');
      case 'expired':
        return subscriptions.filter(s => s.status === 'expired');
      case 'expiring':
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return subscriptions.filter(s => {
          const endDate = new Date(s.end_date);
          return s.status === 'active' && endDate >= today && endDate <= sevenDaysFromNow;
        });
      default:
        return subscriptions;
    }
  };

  const filteredSubscriptions = getFilteredSubscriptions();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                💼 SaaS Subscription Management
              </h1>
              <p className="text-gray-600">
                Manage clinic subscriptions, plans, and billing
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Expiring Subscriptions Alert */}
        {expiringNotifications.length > 0 && (
          <ExpiringSubscriptionsAlert 
            notifications={expiringNotifications}
            onRefresh={handleRefresh}
          />
        )}

        {/* Statistics Cards */}
        {stats && (
          <SubscriptionStatsCards 
            stats={stats} 
            onRefresh={handleRefresh}
          />
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6" aria-label="Tabs">
              {[
                { id: 'all', label: 'All Subscriptions', count: subscriptions.length },
                { id: 'active', label: 'Active', count: stats?.active_subscriptions || 0 },
                { id: 'trial', label: 'Trial', count: stats?.trial_subscriptions || 0 },
                { id: 'expiring', label: 'Expiring Soon', count: stats?.expiring_soon || 0 },
                { id: 'expired', label: 'Expired', count: stats?.expired_subscriptions || 0 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${selectedTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs
                    ${selectedTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Subscriptions Data Table */}
        <SubscriptionsDataTable 
          subscriptions={filteredSubscriptions}
          onSubscriptionUpdated={handleRefresh}
        />

        {/* Empty State */}
        {filteredSubscriptions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No subscriptions found
            </h3>
            <p className="text-gray-600">
              {selectedTab === 'all' 
                ? 'There are no clinic subscriptions in the system yet.'
                : `No ${selectedTab} subscriptions at this time.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaaSManagement;
