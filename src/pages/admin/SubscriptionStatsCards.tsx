// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - STATISTICS CARDS
// ============================================================================
// Phase 4: Subscription Statistics Overview Component
// Date: December 26, 2025
// ============================================================================

import React from 'react';
import type { SubscriptionStats } from '../../types/subscription';
import { formatPrice } from '../../utils/subscriptionHelpers';

interface SubscriptionStatsCardsProps {
  stats: SubscriptionStats;
  onRefresh?: () => void;
}

/**
 * SubscriptionStatsCards Component
 * 
 * Displays key subscription metrics in card format.
 * Shows totals, revenue, and breakdown by status.
 */
const SubscriptionStatsCards: React.FC<SubscriptionStatsCardsProps> = ({ stats, onRefresh }) => {
  const cards = [
    {
      title: 'Total Subscriptions',
      value: stats.total_subscriptions,
      icon: '📊',
      color: 'blue',
      description: 'All clinic subscriptions'
    },
    {
      title: 'Active Subscriptions',
      value: stats.active_subscriptions,
      icon: '✅',
      color: 'green',
      description: 'Currently active'
    },
    {
      title: 'Trial Subscriptions',
      value: stats.trial_subscriptions,
      icon: '🆓',
      color: 'purple',
      description: 'In trial period'
    },
    {
      title: 'Expiring Soon',
      value: stats.expiring_soon,
      icon: '⚠️',
      color: stats.expiring_soon > 0 ? 'orange' : 'gray',
      description: 'Within 7 days',
      alert: stats.expiring_soon > 0
    },
    {
      title: 'Expired',
      value: stats.expired_subscriptions,
      icon: '❌',
      color: 'red',
      description: 'Requires renewal'
    },
    {
      title: 'Yearly Revenue',
      value: formatPrice(stats.total_revenue_yearly),
      icon: '💰',
      color: 'emerald',
      description: 'Annual subscription value'
    }
  ];

  return (
    <div className="mb-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`
              bg-white rounded-lg shadow-sm p-6 border-l-4 transition-all hover:shadow-md
              ${card.alert ? 'border-orange-500 animate-pulse' : `border-${card.color}-500`}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{card.icon}</span>
              {card.alert && (
                <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-1 rounded-full">
                  ACTION NEEDED
                </span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
            <p className={`text-2xl font-bold text-${card.color}-600 mb-1`}>
              {card.value}
            </p>
            <p className="text-gray-500 text-xs">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Revenue by Plan */}
      {stats.subscriptions_by_plan.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span>
            Revenue by Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.subscriptions_by_plan.map((plan, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{plan.plan_name}</h4>
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {plan.count}
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(plan.revenue)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Avg: {formatPrice(plan.count > 0 ? plan.revenue / plan.count : 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatsCards;
