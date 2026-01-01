// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - HELPER UTILITIES
// ============================================================================
// Phase 2: Validation, Error Handling & Helper Functions
// Date: December 26, 2025
// ============================================================================

import type { SubscriptionStatus, SubscriptionValidation } from '../types/subscription';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a subscription status is considered active
 * @param status - The subscription status
 * @returns True if status allows system access
 */
export function isActiveStatus(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trial';
}

/**
 * Check if a subscription status is expired or inactive
 * @param status - The subscription status
 * @returns True if status blocks system access
 */
export function isInactiveStatus(status: SubscriptionStatus): boolean {
  return status === 'expired' || status === 'suspended' || status === 'cancelled';
}

/**
 * Calculate days between two dates
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @returns Number of days difference
 */
export function calculateDaysBetween(
  startDate: string | Date,
  endDate: string | Date
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days remaining until date
 * @param endDate - End date (ISO string or Date)
 * @returns Number of days remaining (negative if past)
 */
export function calculateDaysRemaining(endDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return calculateDaysBetween(today, endDate);
}

/**
 * Check if date is within X days from now
 * @param date - Date to check
 * @param days - Number of days to look ahead
 * @returns True if date is within range
 */
export function isWithinDays(date: string | Date, days: number): boolean {
  const daysRemaining = calculateDaysRemaining(date);
  return daysRemaining >= 0 && daysRemaining <= days;
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Add months to a date
 * @param date - Starting date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get ISO date string (YYYY-MM-DD)
 * @param date - Date to convert
 * @returns ISO date string
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// SUBSCRIPTION STATUS HELPERS
// ============================================================================

/**
 * Get user-friendly status message
 * @param status - Subscription status
 * @returns Friendly status message
 */
export function getStatusMessage(status: SubscriptionStatus): string {
  const messages: Record<SubscriptionStatus, string> = {
    active: 'Active Subscription',
    trial: 'Trial Period',
    expired: 'Subscription Expired',
    suspended: 'Subscription Suspended',
    cancelled: 'Subscription Cancelled'
  };
  return messages[status] || 'Unknown Status';
}

/**
 * Get status badge color for UI
 * @param status - Subscription status
 * @returns Tailwind color class
 */
export function getStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'green',
    trial: 'blue',
    expired: 'red',
    suspended: 'orange',
    cancelled: 'gray'
  };
  return colors[status] || 'gray';
}

/**
 * Get validation message based on validation result
 * @param validation - Subscription validation result
 * @returns User-friendly message
 */
export function getValidationMessage(validation: SubscriptionValidation): string {
  if (!validation.isValid) {
    return validation.message || 'Your subscription is not active. Please contact support.';
  }

  if (validation.isExpiringSoon) {
    return `⚠️ Your subscription expires in ${validation.daysRemaining} day${validation.daysRemaining !== 1 ? 's' : ''}. Please renew soon.`;
  }

  if (validation.isTrial) {
    return `Trial period active - ${validation.daysRemaining} days remaining`;
  }

  return `Subscription active - ${validation.daysRemaining} days remaining`;
}

// ============================================================================
// PRICING HELPERS
// ============================================================================

/**
 * Format price in EGP (Egyptian Pounds)
 * @param amount - Amount in EGP
 * @returns Formatted price string
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه`;
}

/**
 * Calculate monthly price from yearly
 * @param yearlyPrice - Yearly price
 * @returns Monthly equivalent
 */
export function calculateMonthlyPrice(yearlyPrice: number): number {
  return Math.round((yearlyPrice / 12) * 100) / 100;
}

/**
 * Calculate total cost for duration
 * @param monthlyPrice - Price per month
 * @param months - Number of months
 * @returns Total cost
 */
export function calculateTotalCost(monthlyPrice: number, months: number): number {
  return monthlyPrice * months;
}

/**
 * Calculate discount percentage
 * @param regularPrice - Regular price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 */
export function calculateDiscountPercentage(
  regularPrice: number,
  discountedPrice: number
): number {
  return Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
}

// ============================================================================
// FEATURE COMPARISON HELPERS
// ============================================================================

/**
 * Check if plan includes a specific feature
 * @param features - Array of feature strings
 * @param featureName - Feature to check for
 * @returns True if feature is included
 */
export function hasFeature(features: string[], featureName: string): boolean {
  return features.some(f => 
    f.toLowerCase().includes(featureName.toLowerCase())
  );
}

/**
 * Parse max users from features
 * @param maxUsers - Max users number
 * @returns Formatted string
 */
export function formatMaxUsers(maxUsers: number): string {
  return maxUsers >= 999 ? 'Unlimited' : `Up to ${maxUsers}`;
}

/**
 * Parse max patients from features
 * @param maxPatients - Max patients number or null
 * @returns Formatted string
 */
export function formatMaxPatients(maxPatients: number | null): string {
  return maxPatients === null ? 'Unlimited' : `Up to ${maxPatients}`;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for subscription-related errors
 */
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

/**
 * Handle subscription service errors
 * @param error - Error object
 * @returns User-friendly error message
 */
export function handleSubscriptionError(error: any): string {
  console.error('Subscription error:', error);

  if (error instanceof SubscriptionError) {
    return error.message;
  }

  if (error?.message?.includes('not found')) {
    return 'Subscription not found. Please contact support.';
  }

  if (error?.message?.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }

  if (error?.message?.includes('expired')) {
    return 'Your subscription has expired. Please renew to continue.';
  }

  return 'An error occurred while processing your subscription. Please try again or contact support.';
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Generate WhatsApp message for subscription renewal
 * @param clinicName - Name of the clinic
 * @param planName - Current plan name
 * @param endDate - Subscription end date
 * @returns WhatsApp message text
 */
export function generateRenewalWhatsAppMessage(
  clinicName: string,
  planName: string,
  endDate: string
): string {
  return encodeURIComponent(
    `Hello! I would like to renew the subscription for ${clinicName}.\n\n` +
    `Current Plan: ${planName}\n` +
    `Expiry Date: ${formatDate(endDate)}\n\n` +
    `Please provide renewal options.`
  );
}

/**
 * Generate support WhatsApp message
 * @param clinicName - Name of the clinic
 * @param issue - Description of the issue
 * @returns WhatsApp message text
 */
export function generateSupportWhatsAppMessage(
  clinicName: string,
  issue: string
): string {
  return encodeURIComponent(
    `Hello! I need assistance with subscription for ${clinicName}.\n\n` +
    `Issue: ${issue}\n\n` +
    `Please help.`
  );
}

/**
 * Get WhatsApp support URL
 * @param phoneNumber - Support phone number (with country code)
 * @param message - Pre-filled message
 * @returns WhatsApp URL
 */
export function getWhatsAppURL(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

const SUBSCRIPTION_CACHE_KEY = 'clinic_subscription_cache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface SubscriptionCache {
  data: SubscriptionValidation;
  timestamp: number;
}

/**
 * Cache subscription validation result
 * @param clinicId - Clinic ID
 * @param validation - Validation result to cache
 */
export function cacheSubscriptionValidation(
  clinicId: string,
  validation: SubscriptionValidation
): void {
  try {
    const cache: SubscriptionCache = {
      data: validation,
      timestamp: Date.now()
    };
    localStorage.setItem(`${SUBSCRIPTION_CACHE_KEY}_${clinicId}`, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache subscription validation:', error);
  }
}

/**
 * Get cached subscription validation result
 * @param clinicId - Clinic ID
 * @returns Cached validation or null if expired/not found
 */
export function getCachedSubscriptionValidation(
  clinicId: string
): SubscriptionValidation | null {
  try {
    const cached = localStorage.getItem(`${SUBSCRIPTION_CACHE_KEY}_${clinicId}`);
    if (!cached) return null;

    const cache: SubscriptionCache = JSON.parse(cached);
    const isExpired = Date.now() - cache.timestamp > CACHE_DURATION_MS;

    if (isExpired) {
      localStorage.removeItem(`${SUBSCRIPTION_CACHE_KEY}_${clinicId}`);
      return null;
    }

    return cache.data;
  } catch (error) {
    console.warn('Failed to get cached subscription validation:', error);
    return null;
  }
}

/**
 * Clear subscription cache
 * @param clinicId - Clinic ID (optional, clears all if not provided)
 */
export function clearSubscriptionCache(clinicId?: string): void {
  try {
    if (clinicId) {
      localStorage.removeItem(`${SUBSCRIPTION_CACHE_KEY}_${clinicId}`);
    } else {
      // Clear all subscription caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(SUBSCRIPTION_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to clear subscription cache:', error);
  }
}
