// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - TYPESCRIPT TYPES
// ============================================================================
// Phase 2: TypeScript Type Definitions
// Date: December 26, 2025
// ============================================================================

/**
 * Subscription plan status
 */
export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'trial' | 'cancelled';

/**
 * Payment method types
 */
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'whatsapp' | 'cash' | 'other';

/**
 * Subscription action types for history tracking
 */
export type SubscriptionAction = 
  | 'created' 
  | 'renewed' 
  | 'upgraded' 
  | 'downgraded' 
  | 'suspended' 
  | 'cancelled' 
  | 'expired';

/**
 * Subscription plan interface
 * Represents available subscription tiers
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_yearly: number;
  price_monthly: number | null;
  max_users: number;
  max_patients: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Clinic subscription interface
 * Represents a clinic's active subscription
 */
export interface ClinicSubscription {
  clinic_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  trial_end_date: string | null;
  payment_reference: string | null;
  payment_method: PaymentMethod | null;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Subscription history entry interface
 * Audit log of subscription changes
 */
export interface SubscriptionHistory {
  id: string;
  clinic_id: string;
  plan_id: string;
  action: SubscriptionAction;
  old_status: string | null;
  new_status: string;
  old_end_date: string | null;
  new_end_date: string;
  payment_reference: string | null;
  amount_paid: number | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

/**
 * Extended clinic subscription with plan details
 * Joins subscription with plan information
 */
export interface ClinicSubscriptionWithPlan extends ClinicSubscription {
  plan: SubscriptionPlan;
}

/**
 * Subscription validation result
 * Returned by validation functions
 */
export interface SubscriptionValidation {
  isValid: boolean;
  status: SubscriptionStatus | null;
  daysRemaining: number;
  endDate: string | null;
  planName: string | null;
  isExpiringSoon: boolean; // Less than 7 days remaining
  isTrial: boolean;
  message: string;
}

/**
 * Subscription renewal request
 * Data needed to renew/extend a subscription
 */
export interface SubscriptionRenewalRequest {
  clinic_id: string;
  plan_id: string;
  duration_months: number;
  payment_reference?: string;
  payment_method?: PaymentMethod;
  amount_paid?: number;
  notes?: string;
}

/**
 * Subscription creation request
 * Data needed to create a new subscription
 */
export interface SubscriptionCreationRequest {
  clinic_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  trial_end_date?: string;
  payment_reference?: string;
  payment_method?: PaymentMethod;
  auto_renew?: boolean;
  notes?: string;
}

/**
 * Subscription statistics for admin dashboard
 */
export interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  expired_subscriptions: number;
  expiring_soon: number; // Expiring in next 7 days
  total_revenue_monthly: number;
  total_revenue_yearly: number;
  subscriptions_by_plan: {
    plan_name: string;
    count: number;
    revenue: number;
  }[];
}

/**
 * Subscription expiry notification
 * Used for generating alerts
 */
export interface SubscriptionExpiryNotification {
  clinic_id: string;
  clinic_name: string;
  clinic_email: string;
  plan_name: string;
  end_date: string;
  days_remaining: number;
  status: SubscriptionStatus;
}
