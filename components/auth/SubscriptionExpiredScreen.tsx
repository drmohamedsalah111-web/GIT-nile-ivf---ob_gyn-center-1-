// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - EXPIRED SUBSCRIPTION SCREEN
// ============================================================================
// Phase 3: Subscription Expired UI Component
// Date: December 26, 2025
// ============================================================================

import React from 'react';
import type { SubscriptionValidation } from '../../types/subscription';
import { 
  getStatusMessage, 
  formatDate, 
  generateRenewalWhatsAppMessage,
  getWhatsAppURL 
} from '../../utils/subscriptionHelpers';

/**
 * Props for SubscriptionExpiredScreen component
 */
interface SubscriptionExpiredScreenProps {
  /** Subscription validation result */
  validation: SubscriptionValidation;
  /** Clinic ID for renewal */
  clinicId: string;
  /** Optional support phone number (default: +972501234567) */
  supportPhone?: string;
  /** Optional support email */
  supportEmail?: string;
  /** Optional custom message */
  customMessage?: string;
}

/**
 * SubscriptionExpiredScreen Component
 * 
 * Displays when a user's subscription has expired or is inactive.
 * Shows status, expiry date, and contact options for renewal.
 */
const SubscriptionExpiredScreen: React.FC<SubscriptionExpiredScreenProps> = ({
  validation,
  clinicId,
  supportPhone = '+972501234567',
  supportEmail = 'support@nileivf.com',
  customMessage
}) => {
  const handleWhatsAppContact = () => {
    const clinicName = 'Your Clinic'; // TODO: Get from user context
    const planName = validation.planName || 'Standard Plan';
    const endDate = validation.endDate || new Date().toISOString();
    
    const message = generateRenewalWhatsAppMessage(clinicName, planName, endDate);
    const whatsappURL = getWhatsAppURL(supportPhone, message);
    
    window.open(whatsappURL, '_blank');
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent('Subscription Renewal Request');
    const body = encodeURIComponent(
      `Hello,\n\nI would like to renew my subscription.\n\nClinic ID: ${clinicId}\nCurrent Status: ${validation.status}\n\nPlease provide renewal options.\n\nThank you.`
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  const getStatusIcon = () => {
    switch (validation.status) {
      case 'expired':
        return '⏰';
      case 'suspended':
        return '🚫';
      case 'cancelled':
        return '❌';
      default:
        return '⚠️';
    }
  };

  const getStatusColor = () => {
    switch (validation.status) {
      case 'expired':
        return 'red';
      case 'suspended':
        return 'orange';
      case 'cancelled':
        return 'gray';
      default:
        return 'yellow';
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`bg-${statusColor}-500 text-white p-8 text-center`}>
            <div className="text-6xl mb-4">{getStatusIcon()}</div>
            <h1 className="text-3xl font-bold mb-2">
              {getStatusMessage(validation.status || 'expired')}
            </h1>
            <p className="text-lg opacity-90">
              {customMessage || validation.message}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Subscription Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Subscription Details
              </h2>
              <div className="space-y-3">
                {validation.planName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Plan:</span>
                    <span className="font-medium text-gray-800">{validation.planName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium text-${statusColor}-600`}>
                    {validation.status?.toUpperCase()}
                  </span>
                </div>
                {validation.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiry Date:</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(validation.endDate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-medium text-gray-800">
                    {validation.daysRemaining} days
                  </span>
                </div>
              </div>
            </div>

            {/* What This Means */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                What This Means
              </h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  You cannot access the system until your subscription is renewed
                </p>
                <p className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Your data is safe and will be restored upon renewal
                </p>
                <p className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  All patient records and appointments remain secure
                </p>
              </div>
            </div>

            {/* Contact Options */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Renew Your Subscription
              </h2>
              <p className="text-gray-600 mb-4">
                Contact our support team to renew your subscription and restore access immediately.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* WhatsApp Button */}
                <button
                  onClick={handleWhatsAppContact}
                  className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 rounded-lg transition-colors shadow-md"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contact via WhatsApp
                </button>

                {/* Email Button */}
                <button
                  onClick={handleEmailContact}
                  className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </button>
              </div>
            </div>

            {/* Support Information */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Need Help?
              </h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Phone: {supportPhone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email: {supportEmail}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
            <p>
              Questions about plans and pricing? 
              <a href="mailto:sales@nileivf.com" className="text-blue-600 hover:underline ml-1">
                Contact Sales
              </a>
            </p>
          </div>
        </div>

        {/* Additional Note */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            🔒 Your data is encrypted and secure. We comply with HIPAA and GDPR standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredScreen;
