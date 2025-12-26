// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - SERVICE LAYER
// ============================================================================
// Phase 2: TypeScript Service Functions
// Date: December 26, 2025
// ============================================================================

import { supabase } from './supabaseClient';
import type {
  SubscriptionPlan,
  ClinicSubscription,
  ClinicSubscriptionWithPlan,
  SubscriptionHistory,
  SubscriptionValidation,
  SubscriptionRenewalRequest,
  SubscriptionCreationRequest,
  SubscriptionStats,
  SubscriptionExpiryNotification,
  SubscriptionStatus
} from '../types/subscription';

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

/**
 * Get all active subscription plans
 * @returns Array of active subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error(`Failed to fetch subscription plans: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific subscription plan by ID
 * @param planId - The plan ID
 * @returns Subscription plan or null
 */
export async function getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }

  return data;
}

/**
 * Get a subscription plan by name
 * @param planName - The plan name (basic, standard, enterprise)
 * @returns Subscription plan or null
 */
export async function getSubscriptionPlanByName(planName: string): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', planName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }

  return data;
}

// ============================================================================
// CLINIC SUBSCRIPTIONS
// ============================================================================

/**
 * Get clinic subscription by clinic ID
 * @param clinicId - The clinic/doctor ID
 * @returns Clinic subscription or null
 */
export async function getClinicSubscription(clinicId: string): Promise<ClinicSubscription | null> {
  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .select('*')
    .eq('clinic_id', clinicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No subscription found
      return null;
    }
    console.error('Error fetching clinic subscription:', error);
    throw new Error(`Failed to fetch clinic subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get clinic subscription with plan details
 * @param clinicId - The clinic/doctor ID
 * @returns Clinic subscription with plan details or null
 */
export async function getClinicSubscriptionWithPlan(
  clinicId: string
): Promise<ClinicSubscriptionWithPlan | null> {
  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('clinic_id', clinicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching clinic subscription with plan:', error);
    throw new Error(`Failed to fetch clinic subscription: ${error.message}`);
  }

  return data as ClinicSubscriptionWithPlan;
}

/**
 * Check if a clinic's subscription is valid
 * @param clinicId - The clinic/doctor ID
 * @returns Subscription validation result
 */
export async function checkSubscriptionValidity(
  clinicId: string
): Promise<SubscriptionValidation> {
  try {
    const subscription = await getClinicSubscriptionWithPlan(clinicId);

    if (!subscription) {
      return {
        isValid: false,
        status: null,
        daysRemaining: 0,
        endDate: null,
        planName: null,
        isExpiringSoon: false,
        isTrial: false,
        message: 'No active subscription found'
      };
    }

    const today = new Date();
    const endDate = new Date(subscription.end_date);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const isValid = 
      (subscription.status === 'active' || subscription.status === 'trial') &&
      daysRemaining > 0;

    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
    const isTrial = subscription.status === 'trial';

    let message = '';
    if (!isValid) {
      message = subscription.status === 'expired' 
        ? 'Subscription has expired' 
        : `Subscription is ${subscription.status}`;
    } else if (isExpiringSoon) {
      message = `Subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
    } else if (isTrial) {
      message = `Trial period - ${daysRemaining} days remaining`;
    } else {
      message = `Active - ${daysRemaining} days remaining`;
    }

    return {
      isValid,
      status: subscription.status,
      daysRemaining,
      endDate: subscription.end_date,
      planName: subscription.plan.display_name,
      isExpiringSoon,
      isTrial,
      message
    };
  } catch (error) {
    console.error('Error checking subscription validity:', error);
    return {
      isValid: false,
      status: null,
      daysRemaining: 0,
      endDate: null,
      planName: null,
      isExpiringSoon: false,
      isTrial: false,
      message: 'Error checking subscription'
    };
  }
}

/**
 * Get subscription days remaining using database function
 * @param clinicId - The clinic/doctor ID
 * @returns Number of days remaining or 0
 */
export async function getSubscriptionDaysRemaining(clinicId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_subscription_days_remaining', { p_clinic_id: clinicId });

  if (error) {
    console.error('Error getting subscription days remaining:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Check if subscription is valid using database function
 * @param clinicId - The clinic/doctor ID
 * @returns Boolean indicating if subscription is valid
 */
export async function isSubscriptionValid(clinicId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_subscription_valid', { p_clinic_id: clinicId });

  if (error) {
    console.error('Error checking subscription validity:', error);
    return false;
  }

  return data || false;
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT (ADMIN ONLY)
// ============================================================================

/**
 * Create a new clinic subscription
 * Note: This requires service role permissions
 * @param request - Subscription creation data
 * @returns Created subscription or null
 */
export async function createClinicSubscription(
  request: SubscriptionCreationRequest
): Promise<ClinicSubscription | null> {
  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .insert({
      clinic_id: request.clinic_id,
      plan_id: request.plan_id,
      status: request.trial_end_date ? 'trial' : 'active',
      start_date: request.start_date,
      end_date: request.end_date,
      trial_end_date: request.trial_end_date,
      payment_reference: request.payment_reference,
      payment_method: request.payment_method,
      auto_renew: request.auto_renew || false,
      notes: request.notes
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating clinic subscription:', error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return data;
}

/**
 * Renew or extend a clinic subscription
 * Note: This requires service role permissions
 * @param request - Renewal request data
 * @returns Updated subscription or null
 */
export async function renewClinicSubscription(
  request: SubscriptionRenewalRequest
): Promise<ClinicSubscription | null> {
  const subscription = await getClinicSubscription(request.clinic_id);
  
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate new end date
  const currentEndDate = new Date(subscription.end_date);
  const today = new Date();
  const startDate = currentEndDate > today ? currentEndDate : today;
  const newEndDate = new Date(startDate);
  newEndDate.setMonth(newEndDate.getMonth() + request.duration_months);

  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .update({
      plan_id: request.plan_id,
      status: 'active',
      end_date: newEndDate.toISOString().split('T')[0],
      payment_reference: request.payment_reference,
      payment_method: request.payment_method,
      notes: request.notes,
      updated_at: new Date().toISOString()
    })
    .eq('clinic_id', request.clinic_id)
    .select()
    .single();

  if (error) {
    console.error('Error renewing subscription:', error);
    throw new Error(`Failed to renew subscription: ${error.message}`);
  }

  return data;
}

/**
 * Update subscription status
 * @param clinicId - The clinic ID
 * @param status - New status
 * @param notes - Optional notes
 * @returns Updated subscription or null
 */
export async function updateSubscriptionStatus(
  clinicId: string,
  status: SubscriptionStatus,
  notes?: string
): Promise<ClinicSubscription | null> {
  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .update({
      status,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) {
    console.error('Error updating subscription status:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  return data;
}

// ============================================================================
// SUBSCRIPTION HISTORY
// ============================================================================

/**
 * Get subscription history for a clinic
 * @param clinicId - The clinic ID
 * @param limit - Maximum number of records to return
 * @returns Array of subscription history entries
 */
export async function getSubscriptionHistory(
  clinicId: string,
  limit: number = 10
): Promise<SubscriptionHistory[]> {
  const { data, error } = await supabase
    .from('subscription_history')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching subscription history:', error);
    throw new Error(`Failed to fetch history: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all clinic subscriptions (admin only)
 * @returns Array of all subscriptions with plan details
 */
export async function getAllClinicSubscriptions(): Promise<ClinicSubscriptionWithPlan[]> {
  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*),
      clinic:doctors(id, name, email, phone)
    `)
    .order('end_date', { ascending: true });

  if (error) {
    console.error('Error fetching all subscriptions:', error);
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }

  return data as ClinicSubscriptionWithPlan[];
}

/**
 * Get subscriptions expiring soon (admin only)
 * @param days - Number of days to look ahead (default 7)
 * @returns Array of subscriptions expiring soon
 */
export async function getExpiringSoonSubscriptions(
  days: number = 7
): Promise<SubscriptionExpiryNotification[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .select(`
      clinic_id,
      end_date,
      status,
      plan:subscription_plans(display_name),
      clinic:doctors(name, email)
    `)
    .in('status', ['active', 'trial'])
    .gte('end_date', today.toISOString().split('T')[0])
    .lte('end_date', futureDate.toISOString().split('T')[0])
    .order('end_date', { ascending: true });

  if (error) {
    console.error('Error fetching expiring subscriptions:', error);
    throw new Error(`Failed to fetch expiring subscriptions: ${error.message}`);
  }

  return (data || []).map((item: any) => {
    const endDate = new Date(item.end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      clinic_id: item.clinic_id,
      clinic_name: item.clinic.name,
      clinic_email: item.clinic.email,
      plan_name: item.plan.display_name,
      end_date: item.end_date,
      days_remaining: daysRemaining,
      status: item.status
    };
  });
}

/**
 * Get subscription statistics (admin only)
 * @returns Subscription statistics
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const { data: subscriptions, error } = await supabase
    .from('clinic_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `);

  if (error) {
    console.error('Error fetching subscription stats:', error);
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }

  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const stats: SubscriptionStats = {
    total_subscriptions: subscriptions?.length || 0,
    active_subscriptions: 0,
    trial_subscriptions: 0,
    expired_subscriptions: 0,
    expiring_soon: 0,
    total_revenue_monthly: 0,
    total_revenue_yearly: 0,
    subscriptions_by_plan: []
  };

  const planStats: Map<string, { count: number; revenue: number }> = new Map();

  subscriptions?.forEach((sub: any) => {
    // Count by status
    if (sub.status === 'active') stats.active_subscriptions++;
    if (sub.status === 'trial') stats.trial_subscriptions++;
    if (sub.status === 'expired') stats.expired_subscriptions++;

    // Check if expiring soon
    const endDate = new Date(sub.end_date);
    if (sub.status === 'active' && endDate >= today && endDate <= sevenDaysFromNow) {
      stats.expiring_soon++;
    }

    // Calculate revenue (only for active subscriptions)
    if (sub.status === 'active' || sub.status === 'trial') {
      stats.total_revenue_yearly += parseFloat(sub.plan.price_yearly) || 0;
      stats.total_revenue_monthly += parseFloat(sub.plan.price_monthly) || 0;

      // Aggregate by plan
      const planName = sub.plan.display_name;
      const current = planStats.get(planName) || { count: 0, revenue: 0 };
      planStats.set(planName, {
        count: current.count + 1,
        revenue: current.revenue + (parseFloat(sub.plan.price_yearly) || 0)
      });
    }
  });

  stats.subscriptions_by_plan = Array.from(planStats.entries()).map(([plan_name, { count, revenue }]) => ({
    plan_name,
    count,
    revenue
  }));

  return stats;
}

/**
 * Run expired subscriptions check
 * Note: This should be called via cron job or scheduled task
 * @returns Number of subscriptions that were expired
 */
export async function updateExpiredSubscriptions(): Promise<number> {
  const { data, error } = await supabase
    .rpc('update_expired_subscriptions');

  if (error) {
    console.error('Error updating expired subscriptions:', error);
    throw new Error(`Failed to update expired subscriptions: ${error.message}`);
  }

  return data || 0;
}
