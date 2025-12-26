// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - RENEWAL MODAL
// ============================================================================
// Phase 4: Subscription Renewal/Management Modal Component
// Date: December 26, 2025
// ============================================================================

import React, { useState, useEffect } from 'react';
import type { 
  ClinicSubscriptionWithPlan, 
  SubscriptionPlan,
  PaymentMethod,
  SubscriptionStatus
} from '../../types/subscription';
import { 
  getSubscriptionPlans,
  renewClinicSubscription,
  updateSubscriptionStatus,
  getSubscriptionHistory
} from '../../services/subscriptionService';
import { 
  formatDate, 
  formatPrice,
  toISODateString,
  addMonths 
} from '../../utils/subscriptionHelpers';

interface RenewalModalProps {
  subscription: ClinicSubscriptionWithPlan;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * RenewalModal Component
 * 
 * Modal for managing subscription:
 * - Renew/extend subscription
 * - Change plan
 * - Update status
 * - View history
 */
const RenewalModal: React.FC<RenewalModalProps> = ({
  subscription,
  onClose,
  onSuccess
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(subscription.plan_id);
  const [durationMonths, setDurationMonths] = useState(12);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<SubscriptionStatus>(subscription.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'renew' | 'status' | 'history'>('renew');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      setError('Failed to load subscription plans');
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const currentEndDate = new Date(subscription.end_date);
  const today = new Date();
  const newStartDate = currentEndDate > today ? currentEndDate : today;
  const newEndDate = addMonths(newStartDate, durationMonths);

  const handleRenew = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await renewClinicSubscription({
        clinic_id: subscription.clinic_id,
        plan_id: selectedPlanId,
        duration_months: durationMonths,
        payment_reference: paymentReference || undefined,
        payment_method: paymentMethod,
        amount_paid: amountPaid ? parseFloat(amountPaid) : undefined,
        notes: notes || undefined
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error renewing subscription:', err);
      setError(err.message || 'Failed to renew subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await updateSubscriptionStatus(
        subscription.clinic_id,
        newStatus,
        notes || undefined
      );

      onSuccess();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const clinic = (subscription as any).clinic;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Manage Subscription
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {clinic?.name} • {clinic?.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Subscription Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Plan</p>
              <p className="font-semibold text-gray-800">{subscription.plan.display_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className={`
                px-2 py-1 inline-flex text-xs font-semibold rounded-full
                bg-${subscription.status === 'active' ? 'green' : subscription.status === 'trial' ? 'blue' : 'red'}-100
                text-${subscription.status === 'active' ? 'green' : subscription.status === 'trial' ? 'blue' : 'red'}-800
              `}>
                {subscription.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
              <p className="font-semibold text-gray-800">{formatDate(subscription.end_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Price</p>
              <p className="font-semibold text-gray-800">{formatPrice(subscription.plan.price_yearly)}/yr</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            {[
              { id: 'renew', label: 'Renew/Extend', icon: '🔄' },
              { id: 'status', label: 'Change Status', icon: '⚙️' },
              { id: 'history', label: 'History', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Renew Tab */}
          {activeTab === 'renew' && (
            <div className="space-y-6">
              {/* Plan Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`
                        p-4 border-2 rounded-lg text-left transition-all
                        ${selectedPlanId === plan.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <h4 className="font-semibold text-gray-800 mb-1">{plan.display_name}</h4>
                      <p className="text-2xl font-bold text-blue-600 mb-2">
                        {formatPrice(plan.price_yearly)}
                      </p>
                      <p className="text-xs text-gray-600">per year</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Months)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 12, 24].map(months => (
                    <button
                      key={months}
                      onClick={() => setDurationMonths(months)}
                      className={`
                        py-2 px-4 rounded-lg font-medium transition-all
                        ${durationMonths === months
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {months}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Custom months"
                />
              </div>

              {/* New End Date Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Renewal Summary</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>Current End Date: <span className="font-semibold">{formatDate(subscription.end_date)}</span></p>
                  <p>New Start Date: <span className="font-semibold">{formatDate(toISODateString(newStartDate))}</span></p>
                  <p>New End Date: <span className="font-semibold">{formatDate(toISODateString(newEndDate))}</span></p>
                  <p>Total Duration: <span className="font-semibold">{durationMonths} months</span></p>
                  {selectedPlan && (
                    <p>Total Cost: <span className="font-semibold text-lg">{formatPrice(selectedPlan.price_yearly * (durationMonths / 12))}</span></p>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice number, transaction ID, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <button
                onClick={handleRenew}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Renew Subscription'}
              </button>
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(['active', 'trial', 'expired', 'suspended', 'cancelled'] as SubscriptionStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      className={`
                        py-2 px-4 rounded-lg font-medium transition-all capitalize
                        ${newStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Required for status change)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for status change..."
                  required
                />
              </div>

              <button
                onClick={handleStatusUpdate}
                disabled={isLoading || !notes.trim()}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <p className="text-center text-gray-500 py-8">
                Subscription history feature coming soon...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenewalModal;
