// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - EXPIRING SUBSCRIPTIONS ALERT
// ============================================================================
// Phase 4: Expiring Subscriptions Alert Component
// Date: December 26, 2025
// ============================================================================

import React, { useState } from 'react';
import type { SubscriptionExpiryNotification } from '../../types/subscription';
import { formatDate } from '../../utils/subscriptionHelpers';

interface ExpiringSubscriptionsAlertProps {
  notifications: SubscriptionExpiryNotification[];
  onRefresh?: () => void;
}

/**
 * ExpiringSubscriptionsAlert Component
 * 
 * Displays an alert banner with list of subscriptions expiring soon.
 * Allows admin to quickly see which clinics need attention.
 */
const ExpiringSubscriptionsAlert: React.FC<ExpiringSubscriptionsAlertProps> = ({
  notifications,
  onRefresh
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (notifications.length === 0) {
    return null;
  }

  const urgentCount = notifications.filter(n => n.days_remaining <= 3).length;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-orange-800 font-semibold text-lg mb-1">
                ⚠️ {notifications.length} Subscription{notifications.length !== 1 ? 's' : ''} Expiring Soon
              </h3>
              <p className="text-orange-700 text-sm">
                {urgentCount > 0 && (
                  <span className="font-bold">{urgentCount} urgent (≤3 days) • </span>
                )}
                These clinics need renewal attention within the next 7 days
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 text-orange-600 hover:text-orange-800 transition-colors"
          >
            <svg 
              className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-2">
            {notifications.map((notification, index) => {
              const isUrgent = notification.days_remaining <= 3;
              return (
                <div
                  key={index}
                  className={`
                    bg-white rounded-lg p-4 border-l-4 
                    ${isUrgent ? 'border-red-500' : 'border-orange-300'}
                  `}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {notification.clinic_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {notification.clinic_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {notification.plan_name}
                      </p>
                      <p className={`
                        text-xs font-semibold
                        ${isUrgent ? 'text-red-600' : 'text-orange-600'}
                      `}>
                        {notification.days_remaining} day{notification.days_remaining !== 1 ? 's' : ''} left
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {formatDate(notification.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiringSubscriptionsAlert;
