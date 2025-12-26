// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - EXPIRING SOON BANNER
// ============================================================================
// Phase 3: Subscription Warning Banner Component
// Date: December 26, 2025
// ============================================================================

import React, { useState } from 'react';
import type { SubscriptionValidation } from '../../types/subscription';
import { 
  formatDate, 
  generateRenewalWhatsAppMessage,
  getWhatsAppURL 
} from '../../utils/subscriptionHelpers';

/**
 * Props for SubscriptionExpiringBanner component
 */
interface SubscriptionExpiringBannerProps {
  /** Subscription validation result */
  validation: SubscriptionValidation;
  /** Clinic ID for renewal */
  clinicId: string;
  /** Whether banner can be dismissed (default: true) */
  dismissible?: boolean;
  /** Position of banner (default: 'top') */
  position?: 'top' | 'bottom';
  /** Support phone number for WhatsApp */
  supportPhone?: string;
}

/**
 * SubscriptionExpiringBanner Component
 * 
 * Displays a warning banner when subscription is expiring soon.
 * Shows days remaining and provides quick renewal action.
 */
const SubscriptionExpiringBanner: React.FC<SubscriptionExpiringBannerProps> = ({
  validation,
  clinicId,
  dismissible = true,
  position = 'top',
  supportPhone = '+972501234567'
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleRenewNow = () => {
    const clinicName = 'Your Clinic'; // TODO: Get from user context
    const planName = validation.planName || 'Standard Plan';
    const endDate = validation.endDate || new Date().toISOString();
    
    const message = generateRenewalWhatsAppMessage(clinicName, planName, endDate);
    const whatsappURL = getWhatsAppURL(supportPhone, message);
    
    window.open(whatsappURL, '_blank');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store in localStorage to remember dismissal
    localStorage.setItem(`subscription_banner_dismissed_${clinicId}`, Date.now().toString());
  };

  const getUrgencyColor = () => {
    if (validation.daysRemaining <= 3) return 'red';
    if (validation.daysRemaining <= 7) return 'orange';
    return 'yellow';
  };

  const urgencyColor = getUrgencyColor();
  const isUrgent = validation.daysRemaining <= 3;

  const positionClasses = position === 'top' 
    ? 'top-0' 
    : 'bottom-0';

  return (
    <div 
      className={`${positionClasses} left-0 right-0 z-50 ${position === 'top' ? '' : 'fixed'}`}
      role="alert"
    >
      <div className={`bg-${urgencyColor}-50 border-l-4 border-${urgencyColor}-500`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Icon and Message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Warning Icon */}
              <div className={`flex-shrink-0 ${isUrgent ? 'animate-pulse' : ''}`}>
                {isUrgent ? (
                  <svg className={`w-6 h-6 text-${urgencyColor}-600`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className={`w-6 h-6 text-${urgencyColor}-600`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-${urgencyColor}-800`}>
                  {validation.isTrial ? (
                    <>
                      <span className="font-bold">Trial Period Ending:</span> Your trial expires in {validation.daysRemaining} day{validation.daysRemaining !== 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      <span className="font-bold">Subscription Expiring:</span> Your subscription expires in {validation.daysRemaining} day{validation.daysRemaining !== 1 ? 's' : ''}
                    </>
                  )}
                  {validation.endDate && (
                    <span className="ml-2">
                      (on {formatDate(validation.endDate)})
                    </span>
                  )}
                </p>
                {isUrgent && (
                  <p className={`text-xs text-${urgencyColor}-700 mt-1`}>
                    ⚠️ Urgent: Renew now to avoid service interruption
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Renew Button */}
              <button
                onClick={handleRenewNow}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-${urgencyColor}-600 hover:bg-${urgencyColor}-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Renew Now
              </button>

              {/* Dismiss Button */}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={`p-2 text-${urgencyColor}-600 hover:bg-${urgencyColor}-100 rounded-lg transition-colors`}
                  aria-label="Dismiss banner"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiringBanner;
