// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - SUBSCRIPTION GUARD
// ============================================================================
// Phase 3: Authentication & Authorization Middleware
// Date: December 26, 2025
// ============================================================================

import React, { useEffect, useState } from 'react';
import { checkSubscriptionValidity } from '../../services/subscriptionService';
import { getCachedSubscriptionValidation, cacheSubscriptionValidation } from '../../utils/subscriptionHelpers';
import type { SubscriptionValidation } from '../../types/subscription';
import SubscriptionExpiredScreen from './SubscriptionExpiredScreen';
import SubscriptionExpiringBanner from './SubscriptionExpiringBanner';

/**
 * Props for SubscriptionGuard component
 */
interface SubscriptionGuardProps {
  /** The clinic/doctor ID to check subscription for */
  clinicId: string;
  /** Children to render when subscription is valid */
  children: React.ReactNode;
  /** Optional custom loading component */
  loadingComponent?: React.ReactNode;
  /** Optional custom expired component */
  expiredComponent?: React.ReactNode;
  /** Whether to show expiring soon banner (default: true) */
  showExpiringBanner?: boolean;
  /** Days threshold for "expiring soon" warning (default: 7) */
  expiringThreshold?: number;
  /** Callback when subscription status changes */
  onStatusChange?: (validation: SubscriptionValidation) => void;
}

/**
 * SubscriptionGuard Higher-Order Component
 * 
 * Wraps any component and ensures the user has a valid subscription before rendering.
 * Shows loading state, expired screen, or the wrapped children based on subscription status.
 * 
 * @example
 * ```tsx
 * <SubscriptionGuard clinicId={clinicId}>
 *   <DoctorDashboard />
 * </SubscriptionGuard>
 * ```
 */
const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  clinicId,
  children,
  loadingComponent,
  expiredComponent,
  showExpiringBanner = true,
  expiringThreshold = 7,
  onStatusChange
}) => {
  const [validation, setValidation] = useState<SubscriptionValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get cached validation first
        const cached = getCachedSubscriptionValidation(clinicId);
        if (cached && isMounted) {
          setValidation(cached);
          setIsLoading(false);
          onStatusChange?.(cached);
          
          // Still fetch fresh data in background
          fetchFreshValidation();
          return;
        }

        // No cache, fetch fresh data
        await fetchFreshValidation();
      } catch (err) {
        console.error('Error in subscription guard:', err);
        if (isMounted) {
          setError('Failed to verify subscription status');
          setIsLoading(false);
        }
      }
    };

    const fetchFreshValidation = async () => {
      const freshValidation = await checkSubscriptionValidity(clinicId);
      
      if (isMounted) {
        setValidation(freshValidation);
        setIsLoading(false);
        
        // Cache the result
        cacheSubscriptionValidation(clinicId, freshValidation);
        
        // Notify parent component
        onStatusChange?.(freshValidation);
      }
    };

    if (clinicId) {
      checkSubscription();
    } else {
      setError('No clinic ID provided');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [clinicId, onStatusChange]);

  // Show loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !validation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Error</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Unable to verify subscription status'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show pending approval screen for pending status
  if (validation.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 font-[Tajawal]">
            عيادتك قيد المراجعة
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed font-[Tajawal]">
            شكراً لتسجيلك! اشتراكك الآن قيد المراجعة من فريقنا.
            سيتم تفعيل حسابك خلال 24 ساعة.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-2 font-[Tajawal]">الخطوات التالية:</h3>
            <ul className="text-sm text-gray-700 space-y-2 text-right font-[Tajawal]">
              <li>✓ تم استلام طلبك بنجاح</li>
              <li>⏳ جاري مراجعة البيانات</li>
              <li>📧 سنرسل إشعار التفعيل عبر البريد</li>
              <li>🎉 ستتمكن من الدخول فوراً بعد التفعيل</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2 font-[Tajawal]">للاستفسار أو التسريع:</p>
            <a
              href="https://wa.me/201206008070"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-all font-[Tajawal]"
            >
              <span>تواصل معنا عبر واتساب</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show expired screen if subscription is not valid
  if (!validation.isValid) {
    if (expiredComponent) {
      return <>{expiredComponent}</>;
    }

    return <SubscriptionExpiredScreen validation={validation} clinicId={clinicId} />;
  }

  // Subscription is valid - show children with optional expiring banner
  return (
    <>
      {showExpiringBanner && validation.isExpiringSoon && validation.daysRemaining <= expiringThreshold && (
        <SubscriptionExpiringBanner validation={validation} clinicId={clinicId} />
      )}
      {children}
    </>
  );
};

export default SubscriptionGuard;
