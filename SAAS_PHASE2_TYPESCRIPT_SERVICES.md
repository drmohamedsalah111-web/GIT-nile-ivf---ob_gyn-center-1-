# 💼 SaaS Subscription System - Phase 2: TypeScript Services

## 📋 Overview

Phase 2 provides a complete TypeScript service layer for managing clinic subscriptions, including type definitions, API functions, validation helpers, and error handling.

---

## 📁 Files Created

### 1. **src/types/subscription.ts**
Complete TypeScript type definitions for the subscription system.

### 2. **src/services/subscriptionService.ts**
Service functions for interacting with subscription data via Supabase.

### 3. **src/utils/subscriptionHelpers.ts**
Helper utilities for validation, formatting, and error handling.

---

## 🚀 Usage Examples

### Example 1: Check if User Can Access System

```typescript
import { checkSubscriptionValidity } from '../services/subscriptionService';
import { getValidationMessage } from '../utils/subscriptionHelpers';

async function checkAccess(clinicId: string) {
  const validation = await checkSubscriptionValidity(clinicId);
  
  if (!validation.isValid) {
    console.log('❌ Access Denied:', validation.message);
    // Redirect to subscription expired page
    return false;
  }
  
  if (validation.isExpiringSoon) {
    console.log('⚠️ Warning:', getValidationMessage(validation));
    // Show renewal banner
  }
  
  console.log('✅ Access Granted');
  return true;
}

// Usage
await checkAccess('clinic-uuid-here');
```

### Example 2: Display Subscription Plans

```typescript
import { getSubscriptionPlans } from '../services/subscriptionService';
import { formatPrice, formatMaxUsers, formatMaxPatients } from '../utils/subscriptionHelpers';

async function displayPlans() {
  const plans = await getSubscriptionPlans();
  
  plans.forEach(plan => {
    console.log(`
      ${plan.display_name}
      Price: ${formatPrice(plan.price_yearly)}/year
      Users: ${formatMaxUsers(plan.max_users)}
      Patients: ${formatMaxPatients(plan.max_patients)}
      Features:
      ${plan.features.map(f => `  • ${f}`).join('\n')}
    `);
  });
}
```

### Example 3: Get Current Subscription Details

```typescript
import { getClinicSubscriptionWithPlan } from '../services/subscriptionService';
import { formatDate, calculateDaysRemaining } from '../utils/subscriptionHelpers';

async function showSubscriptionDetails(clinicId: string) {
  const subscription = await getClinicSubscriptionWithPlan(clinicId);
  
  if (!subscription) {
    console.log('No active subscription found');
    return;
  }
  
  console.log(`
    Plan: ${subscription.plan.display_name}
    Status: ${subscription.status}
    End Date: ${formatDate(subscription.end_date)}
    Days Remaining: ${calculateDaysRemaining(subscription.end_date)}
  `);
}
```

### Example 4: Display Subscription Status Badge (React Component)

```typescript
import { checkSubscriptionValidity } from '../services/subscriptionService';
import { getStatusColor, getValidationMessage } from '../utils/subscriptionHelpers';

function SubscriptionStatusBadge({ clinicId }: { clinicId: string }) {
  const [validation, setValidation] = useState<SubscriptionValidation | null>(null);
  
  useEffect(() => {
    checkSubscriptionValidity(clinicId).then(setValidation);
  }, [clinicId]);
  
  if (!validation) return <div>Loading...</div>;
  
  const color = validation.status ? getStatusColor(validation.status) : 'gray';
  
  return (
    <div className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded`}>
      {getValidationMessage(validation)}
    </div>
  );
}
```

### Example 5: Check Before Performing Action

```typescript
import { isSubscriptionValid } from '../services/subscriptionService';

async function createPatient(clinicId: string, patientData: any) {
  // Check subscription before allowing action
  const isValid = await isSubscriptionValid(clinicId);
  
  if (!isValid) {
    throw new Error('Cannot create patient: Subscription expired');
  }
  
  // Proceed with patient creation
  // ... create patient logic
}
```

### Example 6: Admin - View All Subscriptions

```typescript
import { getAllClinicSubscriptions } from '../services/subscriptionService';
import { formatDate } from '../utils/subscriptionHelpers';

async function adminDashboard() {
  const subscriptions = await getAllClinicSubscriptions();
  
  subscriptions.forEach(sub => {
    console.log(`
      Clinic: ${sub.clinic.name}
      Plan: ${sub.plan.display_name}
      Status: ${sub.status}
      Expires: ${formatDate(sub.end_date)}
      Days Left: ${calculateDaysRemaining(sub.end_date)}
    `);
  });
}
```

### Example 7: Admin - Get Expiring Subscriptions

```typescript
import { getExpiringSoonSubscriptions } from '../services/subscriptionService';

async function checkExpiringSubscriptions() {
  const expiring = await getExpiringSoonSubscriptions(7); // Next 7 days
  
  if (expiring.length > 0) {
    console.log(`⚠️ ${expiring.length} subscriptions expiring soon:`);
    
    expiring.forEach(notification => {
      console.log(`
        Clinic: ${notification.clinic_name}
        Email: ${notification.clinic_email}
        Plan: ${notification.plan_name}
        Days Left: ${notification.days_remaining}
      `);
      
      // Send notification email/SMS
      // sendRenewalReminder(notification);
    });
  }
}
```

### Example 8: Admin - Renew Subscription

```typescript
import { renewClinicSubscription } from '../services/subscriptionService';
import type { SubscriptionRenewalRequest } from '../types/subscription';

async function renewSubscription(clinicId: string) {
  const renewalRequest: SubscriptionRenewalRequest = {
    clinic_id: clinicId,
    plan_id: 'standard-plan-uuid',
    duration_months: 12,
    payment_reference: 'INV-2025-001',
    payment_method: 'bank_transfer',
    amount_paid: 9999.00,
    notes: 'Renewed for 12 months'
  };
  
  const updated = await renewClinicSubscription(renewalRequest);
  console.log('✅ Subscription renewed:', updated);
}
```

### Example 9: Admin - Get Statistics

```typescript
import { getSubscriptionStats } from '../services/subscriptionService';
import { formatPrice } from '../utils/subscriptionHelpers';

async function showStats() {
  const stats = await getSubscriptionStats();
  
  console.log(`
    📊 Subscription Statistics
    
    Total Subscriptions: ${stats.total_subscriptions}
    Active: ${stats.active_subscriptions}
    Trial: ${stats.trial_subscriptions}
    Expired: ${stats.expired_subscriptions}
    Expiring Soon: ${stats.expiring_soon}
    
    Revenue:
    - Monthly: ${formatPrice(stats.total_revenue_monthly)}
    - Yearly: ${formatPrice(stats.total_revenue_yearly)}
    
    By Plan:
    ${stats.subscriptions_by_plan.map(p => 
      `  ${p.plan_name}: ${p.count} (${formatPrice(p.revenue)})`
    ).join('\n')}
  `);
}
```

### Example 10: Generate WhatsApp Renewal Link

```typescript
import { 
  generateRenewalWhatsAppMessage, 
  getWhatsAppURL 
} from '../utils/subscriptionHelpers';

function RenewalButton({ clinicName, planName, endDate }: any) {
  const handleRenewal = () => {
    const message = generateRenewalWhatsAppMessage(clinicName, planName, endDate);
    const whatsappURL = getWhatsAppURL('+972501234567', message);
    window.open(whatsappURL, '_blank');
  };
  
  return (
    <button onClick={handleRenewal}>
      💬 Renew via WhatsApp
    </button>
  );
}
```

### Example 11: Cache Subscription Validation

```typescript
import { checkSubscriptionValidity } from '../services/subscriptionService';
import { 
  cacheSubscriptionValidation, 
  getCachedSubscriptionValidation 
} from '../utils/subscriptionHelpers';

async function getSubscriptionWithCache(clinicId: string) {
  // Try cache first
  const cached = getCachedSubscriptionValidation(clinicId);
  if (cached) {
    console.log('Using cached validation');
    return cached;
  }
  
  // Fetch fresh data
  console.log('Fetching fresh validation');
  const validation = await checkSubscriptionValidity(clinicId);
  
  // Cache for future use
  cacheSubscriptionValidation(clinicId, validation);
  
  return validation;
}
```

### Example 12: Error Handling

```typescript
import { getClinicSubscription } from '../services/subscriptionService';
import { handleSubscriptionError, SubscriptionError } from '../utils/subscriptionHelpers';

async function safeGetSubscription(clinicId: string) {
  try {
    return await getClinicSubscription(clinicId);
  } catch (error) {
    const message = handleSubscriptionError(error);
    console.error(message);
    
    // Show user-friendly error to user
    alert(message);
    
    return null;
  }
}
```

---

## 🔧 Integration with Existing Code

### Step 1: Update `src/lib/supabaseClient.ts`

Ensure you have the Supabase client configured:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 2: Add to Existing Dashboard Components

In `SecretaryDashboard.tsx` or `DoctorDashboard.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { checkSubscriptionValidity } from '../services/subscriptionService';
import type { SubscriptionValidation } from '../types/subscription';

function Dashboard() {
  const [subscription, setSubscription] = useState<SubscriptionValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const clinicId = 'your-clinic-id'; // Get from auth context
        const validation = await checkSubscriptionValidity(clinicId);
        setSubscription(validation);
      } catch (error) {
        console.error('Failed to check subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSubscription();
  }, []);
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!subscription?.isValid) {
    return <SubscriptionExpiredScreen />;
  }
  
  return (
    <div>
      {subscription.isExpiringSoon && (
        <RenewalBanner validation={subscription} />
      )}
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

## 📊 Key Functions Reference

### Subscription Service Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `getSubscriptionPlans()` | Get all active plans | `SubscriptionPlan[]` |
| `getClinicSubscription(clinicId)` | Get clinic's subscription | `ClinicSubscription \| null` |
| `checkSubscriptionValidity(clinicId)` | Check if subscription is valid | `SubscriptionValidation` |
| `isSubscriptionValid(clinicId)` | Quick validity check (DB function) | `boolean` |
| `getSubscriptionDaysRemaining(clinicId)` | Get days remaining (DB function) | `number` |
| `renewClinicSubscription(request)` | Renew subscription (admin) | `ClinicSubscription` |
| `getAllClinicSubscriptions()` | Get all subscriptions (admin) | `ClinicSubscriptionWithPlan[]` |
| `getExpiringSoonSubscriptions(days)` | Get expiring subscriptions (admin) | `SubscriptionExpiryNotification[]` |
| `getSubscriptionStats()` | Get statistics (admin) | `SubscriptionStats` |

### Helper Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `isActiveStatus(status)` | Check if status is active | `boolean` |
| `calculateDaysRemaining(endDate)` | Calculate days until date | `number` |
| `formatDate(date)` | Format date as DD/MM/YYYY | `string` |
| `formatPrice(amount)` | Format price in ILS (₪) | `string` |
| `getStatusColor(status)` | Get color for status badge | `string` |
| `getValidationMessage(validation)` | Get user-friendly message | `string` |
| `generateRenewalWhatsAppMessage()` | Generate WhatsApp renewal message | `string` |
| `cacheSubscriptionValidation()` | Cache validation result | `void` |
| `getCachedSubscriptionValidation()` | Get cached validation | `SubscriptionValidation \| null` |

---

## ✅ Phase 2 Complete

### What Was Created:
- ✅ Complete TypeScript type definitions
- ✅ Service layer with 15+ API functions
- ✅ Helper utilities with 30+ helper functions
- ✅ Error handling and validation
- ✅ Caching mechanisms
- ✅ WhatsApp integration helpers
- ✅ Comprehensive usage examples

### Next Steps:
1. ✅ Review this documentation
2. ✅ Test service functions with your Supabase instance
3. ⏳ **Ready for Phase 3: Subscription Guard Middleware**

---

## 📞 Support

For questions or issues with Phase 2 implementation, please refer to this documentation or request Phase 3 to continue with the subscription guard middleware.

**Confirm Phase 2 completion and request Phase 3 when ready! 🚀**
