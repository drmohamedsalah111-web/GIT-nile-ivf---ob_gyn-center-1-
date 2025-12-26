// ============================================================================
// 💼 SaaS SUBSCRIPTION SYSTEM - APP.TSX INTEGRATION EXAMPLE
// ============================================================================
// Phase 3: Example integration code for App.tsx
// Date: December 26, 2025
// ============================================================================

/*
  INTEGRATION INSTRUCTIONS:
  
  1. Import the SubscriptionGuard component at the top of App.tsx:
     import SubscriptionGuard from './components/auth/SubscriptionGuard';
  
  2. Get the clinic ID from the authenticated user's doctor record
  
  3. Wrap the appropriate dashboard components with SubscriptionGuard
  
  Below are the modified sections to replace in App.tsx:
*/

// ============================================================================
// OPTION 1: Wrap Secretary Dashboard
// ============================================================================

/*
  Find this section in App.tsx (around line 158-166):
  
  if (userRole === 'secretary') {
    return (
      <ThemeProvider>
        <BrandingProvider>
          <EnvErrorBanner />
          <PreviewWarningBanner />
          <SecretaryDashboard />
          <Toaster position="top-center" reverseOrder={false} />
        </BrandingProvider>
      </ThemeProvider>
    );
  }

  Replace with:

  if (userRole === 'secretary') {
    // Get clinic ID from secretary's linked doctor
    const clinicId = user?.doctor_id; // Adjust based on your data structure
    
    return (
      <ThemeProvider>
        <BrandingProvider>
          <EnvErrorBanner />
          <PreviewWarningBanner />
          {clinicId ? (
            <SubscriptionGuard clinicId={clinicId}>
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
*/

// ============================================================================
// OPTION 2: Wrap Doctor Dashboard
// ============================================================================

/*
  Find the main return statement (around line 168-236):
  
  return (
    <ThemeProvider>
      <BrandingProvider>
      <EnvErrorBanner />
      <PreviewWarningBanner />
      <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">
        ...
      </div>
      ...
    </ThemeProvider>
  );

  Replace with:

  // Get clinic ID from doctor record
  const clinicId = user?.id; // For doctors, their ID is the clinic ID
  
  return (
    <ThemeProvider>
      <BrandingProvider>
        <EnvErrorBanner />
        <PreviewWarningBanner />
        {clinicId ? (
          <SubscriptionGuard clinicId={clinicId}>
            <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">
              <div className="hidden md:flex">
                <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
              </div>

              <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
                {renderContent()}
              </main>

              <button
                onClick={() => setShowLabReferences(true)}
                className="fixed bottom-20 md:bottom-4 left-4 bg-brand text-white p-4 rounded-full shadow-lg hover:bg-accent transition-all duration-300 z-40 print:hidden"
                title="Lab Reference Ranges"
              >
                <BookOpen size={24} />
              </button>

              {showLabReferences && (
                <LabReferencesModal onClose={() => setShowLabReferences(false)} />
              )}

              <div className="md:hidden">
                <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
              </div>
            </div>
          </SubscriptionGuard>
        ) : (
          <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">
            ... (keep existing content)
          </div>
        )}
        <Toaster position="top-center" reverseOrder={false} />
      </BrandingProvider>
    </ThemeProvider>
  );
*/

// ============================================================================
// OPTION 3: Wrap Both (Recommended)
// ============================================================================

/*
  Complete App.tsx modification example:

  import React, { useEffect, useState } from 'react';
  import toast, { Toaster } from 'react-hot-toast';
  import { BookOpen, LogOut, Shield } from 'lucide-react';
  import SubscriptionGuard from './components/auth/SubscriptionGuard'; // ADD THIS

  // ... rest of imports

  const App: React.FC = () => {
    // ... existing state variables

    // ... existing useEffect for initialization

    // ... existing handleLogout function

    // ... existing loading check

    // ... existing login check

    // ... existing renderContent function

    // Helper function to get clinic ID
    const getClinicId = (): string | null => {
      if (userRole === 'doctor') {
        return user?.id; // For doctors, their ID is the clinic ID
      } else if (userRole === 'secretary') {
        return user?.doctor_id || user?.secretary_doctor_id; // Secretary's linked doctor ID
      }
      return null;
    };

    const clinicId = getClinicId();

    // Secretary Dashboard with Subscription Guard
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
                onStatusChange={(validation) => {
                  console.log('Subscription status:', validation);
                }}
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

    // Doctor Dashboard with Subscription Guard
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
              <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">
                <div className="hidden md:flex">
                  <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
                </div>

                <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
                  {renderContent()}
                </main>

                <button
                  onClick={() => setShowLabReferences(true)}
                  className="fixed bottom-20 md:bottom-4 left-4 bg-brand text-white p-4 rounded-full shadow-lg hover:bg-accent transition-all duration-300 z-40 print:hidden"
                  title="Lab Reference Ranges"
                >
                  <BookOpen size={24} />
                </button>

                {showLabReferences && (
                  <LabReferencesModal onClose={() => setShowLabReferences(false)} />
                )}

                <div className="md:hidden">
                  <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
                </div>
              </div>
            </SubscriptionGuard>
          ) : (
            <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">
              <div className="hidden md:flex">
                <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
              </div>

              <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
                {renderContent()}
              </main>

              <button
                onClick={() => setShowLabReferences(true)}
                className="fixed bottom-20 md:bottom-4 left-4 bg-brand text-white p-4 rounded-full shadow-lg hover:bg-accent transition-all duration-300 z-40 print:hidden"
                title="Lab Reference Ranges"
              >
                <BookOpen size={24} />
              </button>

              {showLabReferences && (
                <LabReferencesModal onClose={() => setShowLabReferences(false)} />
              )}

              <div className="md:hidden">
                <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
              </div>
            </div>
          )}
          <Toaster position="top-center" reverseOrder={false} />
        </BrandingProvider>
      </ThemeProvider>
    );
  };

  export default App;
*/

// ============================================================================
// NOTES:
// ============================================================================

/*
  1. The clinicId must be retrieved from your user object based on role:
     - For doctors: user.id (the doctor's ID is the clinic ID)
     - For secretaries: user.doctor_id or user.secretary_doctor_id
  
  2. If clinicId is null/undefined, the guard is bypassed (fallback to normal rendering)
  
  3. The SubscriptionGuard will:
     - Show loading spinner while checking subscription
     - Show SubscriptionExpiredScreen if invalid
     - Show SubscriptionExpiringBanner if expiring soon (within threshold)
     - Render children normally if valid
  
  4. Props available for SubscriptionGuard:
     - clinicId: (required) The clinic ID to check
     - showExpiringBanner: (optional, default true) Show warning banner
     - expiringThreshold: (optional, default 7) Days threshold for warning
     - loadingComponent: (optional) Custom loading UI
     - expiredComponent: (optional) Custom expired UI
     - onStatusChange: (optional) Callback when status changes
  
  5. Make sure to run the SAAS_SUBSCRIPTION_SCHEMA.sql first to create the database tables!
*/

export {};
