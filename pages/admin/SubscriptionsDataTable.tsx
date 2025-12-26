// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - SUBSCRIPTIONS DATA TABLE
// ============================================================================
// Phase 4: Subscriptions Management Table Component
// Date: December 26, 2025
// ============================================================================

import React, { useState } from 'react';
import type { ClinicSubscriptionWithPlan } from '../../types/subscription';
import { 
  formatDate, 
  calculateDaysRemaining,
  getStatusColor,
  formatPrice 
} from '../../utils/subscriptionHelpers';
import RenewalModal from './RenewalModal';

interface SubscriptionsDataTableProps {
  subscriptions: ClinicSubscriptionWithPlan[];
  onSubscriptionUpdated?: () => void;
}

/**
 * SubscriptionsDataTable Component
 * 
 * Displays all subscriptions in a sortable, searchable table.
 * Allows admin to renew, suspend, or modify subscriptions.
 */
const SubscriptionsDataTable: React.FC<SubscriptionsDataTableProps> = ({
  subscriptions,
  onSubscriptionUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'clinic_name' | 'end_date' | 'status'>('end_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSubscription, setSelectedSubscription] = useState<ClinicSubscriptionWithPlan | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Filter subscriptions by search term
  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (sub as any).clinic?.name?.toLowerCase().includes(searchLower) ||
      (sub as any).clinic?.email?.toLowerCase().includes(searchLower) ||
      sub.plan.display_name.toLowerCase().includes(searchLower) ||
      sub.status.toLowerCase().includes(searchLower)
    );
  });

  // Sort subscriptions
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'clinic_name':
        aValue = (a as any).clinic?.name || '';
        bValue = (b as any).clinic?.name || '';
        break;
      case 'end_date':
        aValue = new Date(a.end_date).getTime();
        bValue = new Date(b.end_date).getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRenewClick = (subscription: ClinicSubscriptionWithPlan) => {
    setSelectedSubscription(subscription);
    setShowRenewalModal(true);
  };

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false);
    setSelectedSubscription(null);
    onSubscriptionUpdated?.();
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by clinic name, email, plan, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-3 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('clinic_name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Clinic
                    <SortIcon field="clinic_name" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('end_date')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Expiry Date
                    <SortIcon field="end_date" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSubscriptions.map((subscription) => {
                const daysRemaining = calculateDaysRemaining(subscription.end_date);
                const statusColor = getStatusColor(subscription.status);
                const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
                const clinic = (subscription as any).clinic;

                return (
                  <tr key={subscription.clinic_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {clinic?.name || 'Unknown Clinic'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {clinic?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscription.plan.display_name}</div>
                      <div className="text-xs text-gray-500">
                        {subscription.plan.max_users === 999 ? 'Unlimited' : subscription.plan.max_users} users
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        bg-${statusColor}-100 text-${statusColor}-800
                      `}>
                        {subscription.status.toUpperCase()}
                      </span>
                      {subscription.status === 'trial' && (
                        <div className="text-xs text-gray-500 mt-1">Trial Period</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(subscription.end_date)}
                      {subscription.start_date && (
                        <div className="text-xs text-gray-500">
                          Started: {formatDate(subscription.start_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`
                        text-sm font-semibold
                        ${isExpiringSoon && subscription.status === 'active' ? 'text-orange-600' : 'text-gray-900'}
                        ${daysRemaining <= 3 && subscription.status === 'active' ? 'text-red-600 animate-pulse' : ''}
                      `}>
                        {daysRemaining} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{formatPrice(subscription.plan.price_yearly)}/yr</div>
                      {subscription.plan.price_monthly && (
                        <div className="text-xs text-gray-500">
                          {formatPrice(subscription.plan.price_monthly)}/mo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRenewClick(subscription)}
                        className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedSubscriptions.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No subscriptions match your search "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Results Count */}
        {sortedSubscriptions.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Showing {sortedSubscriptions.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Renewal Modal */}
      {showRenewalModal && selectedSubscription && (
        <RenewalModal
          subscription={selectedSubscription}
          onClose={() => {
            setShowRenewalModal(false);
            setSelectedSubscription(null);
          }}
          onSuccess={handleRenewalSuccess}
        />
      )}
    </>
  );
};

export default SubscriptionsDataTable;
