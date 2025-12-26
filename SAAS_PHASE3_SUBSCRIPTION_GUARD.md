# 💼 SaaS Subscription System - Phase 3: Subscription Guard Middleware

## 📋 Overview

Phase 3 provides the authentication and authorization layer that protects your application routes with subscription validation. It includes guard components, expired screens, and warning banners that work together to manage subscription-based access control.

---

## 📁 Files Created

### 1. **[src/components/auth/SubscriptionGuard.tsx](src/components/auth/SubscriptionGuard.tsx)**
Higher-Order Component that wraps protected routes and validates subscription status.

### 2. **[src/components/auth/SubscriptionExpiredScreen.tsx](src/components/auth/SubscriptionExpiredScreen.tsx)**
Full-screen component displayed when subscription is expired, suspended, or cancelled.

### 3. **[src/components/auth/SubscriptionExpiringBanner.tsx](src/components/auth/SubscriptionExpiringBanner.tsx)**
Warning banner displayed when subscription is expiring soon.

### 4. **[APP_INTEGRATION_EXAMPLE.tsx](APP_INTEGRATION_EXAMPLE.tsx)**
Complete integration guide with code examples for App.tsx.

---

## 🎯 Features

### SubscriptionGuard Component
- ✅ Automatic subscription validation on mount
- ✅ Loading state with spinner
- ✅ Error handling with retry option
- ✅ Cache-first strategy (5-minute cache)
- ✅ Background refresh after cache hit
- ✅ Callback support for status changes
- ✅ Custom loading/expired component support
- ✅ Configurable expiring threshold

### SubscriptionExpiredScreen
- ✅ Beautiful, professional UI with gradient background
- ✅ Status-specific icons and colors
- ✅ Subscription details display (plan, expiry date, days remaining)
- ✅ WhatsApp integration for quick renewal
- ✅ Email contact option
- ✅ Support information (phone, email)
- ✅ Data security reassurance message
- ✅ HIPAA/GDPR compliance notice

### SubscriptionExpiringBanner
- ✅ Sticky top/bottom positioning
- ✅ Color-coded urgency (red ≤3 days, orange ≤7 days, yellow >7 days)
- ✅ Animated pulse for urgent warnings
- ✅ Dismissible with localStorage persistence
- ✅ Quick renewal action via WhatsApp
- ✅ Days remaining countdown
- ✅ Trial vs. paid subscription differentiation
- ✅ Responsive design (mobile + desktop)

---

## 🚀 Integration Guide

### Step 1: Import the Guard

Add to the top of **App.tsx**:

```typescript
import SubscriptionGuard from './components/auth/SubscriptionGuard';
```

### Step 2: Get Clinic ID

Add helper function to get the clinic ID based on user role:

```typescript
const getClinicId = (): string | null => {
  if (userRole === 'doctor') {
    return user?.id; // For doctors, their ID is the clinic ID
  } else if (userRole === 'secretary') {
    return user?.doctor_id || user?.secretary_doctor_id; // Secretary's linked doctor
  }
  return null;
};

const clinicId = getClinicId();
```

### Step 3: Wrap Dashboard Components

**For Secretary Dashboard:**

```typescript
if (userRole === 'secretary') {
  return (
    <ThemeProvider>
      <BrandingProvider>
        <EnvErrorBanner />
        <PreviewWarningBanner />
        {clinicId ? (
          <SubscriptionGuard 
            clinicId={clinicId}
            showExpiringBanner={true}
            expiringThreshold={7}
          >
            <SecretaryDashboard />
          </SubscriptionGuard>
        ) : (
          <SecretaryDashboard />
        )}
        <Toaster position="top-center" reverseOrder={false} />
      </BrandingProvider>
    </ThemeProvider>
  );
}
```

**For Doctor Dashboard:**

```typescript
return (
  <ThemeProvider>
    <BrandingProvider>
      <EnvErrorBanner />
      <PreviewWarningBanner />
      {clinicId ? (
        <SubscriptionGuard 
          clinicId={clinicId}
          showExpiringBanner={true}
          expiringThreshold={7}
        >
          <div className="min-h-screen bg-background...">
            {/* Your existing dashboard content */}
          </div>
        </SubscriptionGuard>
      ) : (
        <div className="min-h-screen bg-background...">
          {/* Fallback content */}
        </div>
      )}
      <Toaster position="top-center" reverseOrder={false} />
    </BrandingProvider>
  </ThemeProvider>
);
```

---

## 📊 Component Props Reference

### SubscriptionGuard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `clinicId` | `string` | Required | The clinic/doctor ID to validate |
| `children` | `ReactNode` | Required | Content to render when valid |
| `showExpiringBanner` | `boolean` | `true` | Show warning banner when expiring |
| `expiringThreshold` | `number` | `7` | Days threshold for warning |
| `loadingComponent` | `ReactNode` | Default spinner | Custom loading UI |
| `expiredComponent` | `ReactNode` | SubscriptionExpiredScreen | Custom expired UI |
| `onStatusChange` | `(validation) => void` | - | Callback when status changes |

### SubscriptionExpiredScreen Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `validation` | `SubscriptionValidation` | Required | Validation result |
| `clinicId` | `string` | Required | Clinic ID for renewal |
| `supportPhone` | `string` | `+972501234567` | Support WhatsApp number |
| `supportEmail` | `string` | `support@nileivf.com` | Support email address |
| `customMessage` | `string` | - | Override default message |

### SubscriptionExpiringBanner Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `validation` | `SubscriptionValidation` | Required | Validation result |
| `clinicId` | `string` | Required | Clinic ID for renewal |
| `dismissible` | `boolean` | `true` | Allow banner dismissal |
| `position` | `'top' \| 'bottom'` | `'top'` | Banner position |
| `supportPhone` | `string` | `+972501234567` | Support WhatsApp number |

---

## 🎨 UI/UX Features

### Loading State
- Centered spinner with brand color
- "Verifying subscription..." message
- Smooth fade-in animation
- Full-screen overlay

### Expired Screen
- **Gradient Background:** Professional gray gradient
- **Status Icons:** Dynamic based on status (⏰ expired, 🚫 suspended, ❌ cancelled)
- **Color Coding:** Red for expired, orange for suspended, gray for cancelled
- **Subscription Details Card:** 
  - Plan name
  - Status badge
  - Expiry date
  - Days remaining
- **Information Section:** What the expiration means
- **Contact Options:** 
  - WhatsApp button (green with icon)
  - Email button (blue with icon)
  - Phone & email display
- **Reassurance:** Data security and compliance notices

### Expiring Banner
- **Urgency Levels:**
  - ≤3 days: Red with pulse animation
  - ≤7 days: Orange
  - \>7 days: Yellow
- **Content:**
  - Warning icon
  - Days remaining
  - Expiry date
  - Trial/paid indicator
- **Actions:**
  - "Renew Now" button (opens WhatsApp)
  - Dismiss button (×)
- **Responsive:** Adapts to mobile and desktop

---

## 🔄 Subscription Flow

```
User Login
    ↓
SubscriptionGuard Mounts
    ↓
Check Cache (5 min TTL)
    ↓
┌─────────────────────────────────┐
│ Cache Hit?                       │
├─────────────────────────────────┤
│ YES → Show Cached Result         │
│       Fetch Fresh in Background  │
│                                  │
│ NO  → Fetch Fresh Data           │
│       Cache Result               │
└─────────────────────────────────┘
    ↓
Validate Subscription
    ↓
┌─────────────────────────────────┐
│ Valid?                           │
├─────────────────────────────────┤
│ NO  → Show Expired Screen        │
│                                  │
│ YES → Is Expiring Soon?          │
│       ├─ YES → Show Banner       │
│       └─ NO  → Show Content      │
└─────────────────────────────────┘
```

---

## 🛡️ Security Considerations

### RLS Policies
The subscription check is protected by Row Level Security:
- Clinics can only view their own subscription
- Super admins can view all subscriptions
- Service role required for modifications

### Cache Strategy
- **Duration:** 5 minutes (configurable)
- **Storage:** localStorage with timestamp
- **Invalidation:** Automatic on expiry
- **Background Refresh:** Updates cache after render

### Error Handling
- Network errors show retry option
- Missing clinic ID bypasses guard (fallback)
- Invalid responses trigger error state
- Console logging for debugging

---

## 📱 Responsive Design

### Mobile (< 768px)
- Full-width cards and buttons
- Stacked button layout
- Touch-friendly sizes (44px min)
- Dismissible banner with × button

### Tablet (768px - 1024px)
- 2-column button grid
- Optimized spacing
- Banner spans full width

### Desktop (> 1024px)
- Centered content (max-width: 2xl)
- Horizontal button layout
- Sticky banner at top
- Shadow effects for depth

---

## 🎯 Usage Examples

### Example 1: Basic Integration

```typescript
<SubscriptionGuard clinicId={clinicId}>
  <DoctorDashboard />
</SubscriptionGuard>
```

### Example 2: Custom Loading

```typescript
<SubscriptionGuard 
  clinicId={clinicId}
  loadingComponent={
    <div className="loading-spinner">
      <img src="/logo.png" alt="Loading" />
      <p>Loading your clinic...</p>
    </div>
  }
>
  <DoctorDashboard />
</SubscriptionGuard>
```

### Example 3: Status Change Callback

```typescript
<SubscriptionGuard 
  clinicId={clinicId}
  onStatusChange={(validation) => {
    console.log('Subscription:', validation);
    
    if (!validation.isValid) {
      // Log to analytics
      analytics.track('subscription_expired', {
        clinic_id: clinicId,
        plan: validation.planName
      });
    }
    
    if (validation.isExpiringSoon) {
      // Show reminder notification
      showNotification('Subscription expiring soon!');
    }
  }}
>
  <DoctorDashboard />
</SubscriptionGuard>
```

### Example 4: Custom Expiring Threshold

```typescript
<SubscriptionGuard 
  clinicId={clinicId}
  showExpiringBanner={true}
  expiringThreshold={14} // Show warning 14 days before expiry
>
  <DoctorDashboard />
</SubscriptionGuard>
```

### Example 5: Hide Expiring Banner

```typescript
<SubscriptionGuard 
  clinicId={clinicId}
  showExpiringBanner={false} // Don't show warning banner
>
  <DoctorDashboard />
</SubscriptionGuard>
```

---

## 🧪 Testing

### Test Scenarios

**1. Valid Subscription (Active)**
```typescript
// Expected: Dashboard renders with no banner
// Subscription: status='active', days_remaining=30
```

**2. Valid Subscription (Expiring Soon)**
```typescript
// Expected: Dashboard renders with yellow/orange banner
// Subscription: status='active', days_remaining=5
```

**3. Valid Subscription (Urgent)**
```typescript
// Expected: Dashboard renders with red pulsing banner
// Subscription: status='active', days_remaining=2
```

**4. Trial Period (Active)**
```typescript
// Expected: Dashboard renders with blue trial banner
// Subscription: status='trial', days_remaining=20
```

**5. Expired Subscription**
```typescript
// Expected: SubscriptionExpiredScreen with red theme
// Subscription: status='expired', days_remaining=0
```

**6. Suspended Subscription**
```typescript
// Expected: SubscriptionExpiredScreen with orange theme
// Subscription: status='suspended'
```

**7. No Subscription**
```typescript
// Expected: SubscriptionExpiredScreen with error message
// Subscription: null
```

**8. Loading State**
```typescript
// Expected: Loading spinner for 1-2 seconds
// Then transitions to appropriate state
```

---

## ✅ Phase 3 Complete

### What Was Created:
- ✅ SubscriptionGuard HOC with caching
- ✅ SubscriptionExpiredScreen with WhatsApp/email
- ✅ SubscriptionExpiringBanner with urgency levels
- ✅ Complete integration guide
- ✅ Responsive design for all screen sizes
- ✅ Error handling and retry logic
- ✅ localStorage caching (5 min TTL)
- ✅ Status change callbacks
- ✅ Custom component support

### Integration Checklist:
- [ ] Add SubscriptionGuard import to App.tsx
- [ ] Create getClinicId() helper function
- [ ] Wrap SecretaryDashboard with guard
- [ ] Wrap DoctorDashboard with guard
- [ ] Test with valid subscription
- [ ] Test with expiring subscription (≤7 days)
- [ ] Test with expired subscription
- [ ] Test WhatsApp renewal flow
- [ ] Test email renewal flow
- [ ] Test banner dismissal

### Next Steps:
1. ✅ Review this documentation
2. ✅ Follow integration guide in [APP_INTEGRATION_EXAMPLE.tsx](APP_INTEGRATION_EXAMPLE.tsx)
3. ✅ Test subscription guard flows
4. ⏳ **Ready for Phase 4: Super Admin Dashboard**

---

## 📞 Support

For questions or issues with Phase 3 implementation, refer to:
- [APP_INTEGRATION_EXAMPLE.tsx](APP_INTEGRATION_EXAMPLE.tsx) - Complete integration code
- Phase 2 documentation for service functions
- Phase 1 documentation for database schema

**Confirm Phase 3 completion and request Phase 4 when ready! 🚀**
