import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import BottomNav from './components/BottomNav';
// import SyncStatus from './components/SyncStatus';
import { Page } from './types';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import Gynecology from './pages/Gynecology';
import IvfJourney from './pages/IvfJourney';
import PatientMasterRecord from './pages/PatientMasterRecord';
import Settings from './pages/Settings';
import ObstetricsDashboard from './pages/ObstetricsDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/authService';
import { LogOut, WifiOff, Wifi } from 'lucide-react';
import { BrandingProvider } from './context/BrandingContext';
import { initPWA } from './src/lib/pwa';
import { connectPowerSync } from './src/powersync/client';
import { useStatus } from '@powersync/react';

const App: React.FC = () => {
  const host = window.location.host;
  const isPreview = host.endsWith('.mosalahicsi.pages.dev') && host !== 'mosalahicsi.pages.dev';
  const [activePage, setActivePage] = useState<Page>(Page.HOME);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const powerSyncStatus = useStatus();

  useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // PowerSync initialization is handled once per session in auth state change

  useEffect(() => {
    // Only log status changes in development
    if (import.meta.env.DEV) {
      console.log('🔌 PowerSync Status Change:', JSON.stringify(powerSyncStatus, null, 2));
      console.log('🔌 Connected:', powerSyncStatus.connected);
      console.log('🔌 Connecting:', powerSyncStatus.connecting);
    }

    // Log connection status for debugging (no auto-retry loops)
    if (powerSyncStatus.connected) {
      console.log('✅ PowerSync is connected - offline data available');
    } else if (!powerSyncStatus.connecting) {
      console.log('⚠️ PowerSync disconnected - working in offline mode');
    }
  }, [powerSyncStatus]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setConnectionError(null);

        // 1. Initialize PWA
        initPWA().catch(console.warn);

        // 2. Check user authentication
        let currentUser;
        try {
          currentUser = await authService.getCurrentUser();
        } catch (authError: any) {
          console.warn('⚠️ Auth check failed (offline mode):', authError?.message);
          // Continue without auth error - offline mode may still work
        }
        setUser(currentUser);

        // PowerSync initialization is handled in auth state change listener

      } catch (error: any) {
        console.error('❌ Critical App Initialization Error:', error?.message);
        // Only set error if it's truly critical (auth failure with online)
        if (navigator.onLine && error?.message?.includes('auth')) {
          setConnectionError('Authentication failed. Please check your connection and reload.');
        }
      } finally {
        setLoading(false);
      }
    };

    console.log('🚀 App useEffect: Starting initialization...');
    console.log('📱 Browser online status:', navigator.onLine);

    // Suppress manifest.json 401 errors (non-critical, browser will use manifest.webmanifest)
    const suppressManifestErrors = () => {
      const originalError = window.console.error;
      window.console.error = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('manifest.json') && (message.includes('401') || message.includes('Failed to load'))) {
          // Suppress - non-critical error, manifest.webmanifest will be used instead
          return;
        }
        originalError.apply(console, args);
      };
      
      // Restore after 5 seconds
      setTimeout(() => {
        window.console.error = originalError;
      }, 5000);
    };
    suppressManifestErrors();

    // Check if worker file exists (non-blocking)
    if (navigator.onLine) {
      fetch('/powersync.worker.js')
        .then(res => {
          console.log('👷 Worker file check:', res.status, res.statusText);
          if (!res.ok) console.warn('⚠️ Worker file might not be accessible');
        })
        .catch(err => console.warn('⚠️ Could not check worker file:', err?.message));
    }

    initializeApp();

    let lastUserId: string | null = null;
    let isPowerSyncInitialized = false;
    
    const subscription = authService.onAuthStateChange(async (user) => {
      const currentUserId = user?.id || null;
      
      // Only initialize PowerSync if user actually changed (not just auth state refresh)
      if (user && currentUserId !== lastUserId) {
        lastUserId = currentUserId;

        // Only initialize once per user session
        if (!isPowerSyncInitialized) {
          isPowerSyncInitialized = true;
          console.log('📱 App: Auth state changed (new user), initializing PowerSync...');
          try {
            await connectPowerSync();
            setConnectionError(null);
          } catch (err: any) {
            console.warn('⚠️ PowerSync connection failed (offline mode will be used):', err?.message);
            // No reconnect loops here; keep failure non-fatal.
            // Manual reconnect can be triggered from Settings / debug tools.
          }
        } else {
          console.log('📱 App: Auth state changed but PowerSync already initialized, skipping...');
        }
      } else if (!user) {
        // Reset flags on logout
        lastUserId = null;
        isPowerSyncInitialized = false;
      } else {
        // Same user, just auth state refresh - don't reinitialize
        // Only log occasionally to reduce spam
        if (Math.random() < 0.1) {
          console.log('📱 App: Auth state refresh (same user), skipping PowerSync init...');
        }
      }
      
      setUser(user);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setActivePage(Page.HOME);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout locally even if server fails
      setUser(null);
      localStorage.clear();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Tajawal]">
            {isOffline ? 'جاري التحميل في وضع عدم الاتصال...' : 'جاري التحميل...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLoginSuccess={() => setActivePage(Page.HOME)} />
        <Toaster position="top-center" reverseOrder={false} />
      </>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case Page.HOME: return <Dashboard />;
      case Page.RECEPTION: return <Reception />;
      case Page.GYNECOLOGY: return <Gynecology />;
      case Page.IVF: return <IvfJourney />;
      case Page.OBSTETRICS: return <ObstetricsDashboard />;
      case Page.PATIENT_RECORD: return <PatientMasterRecord />;
      case Page.SETTINGS: return <Settings user={user} />;
      case Page.ADMIN: return <AdminDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <BrandingProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row-reverse font-[Tajawal]">
        <div className="hidden md:flex">
          <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
        </div>

        <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحباً، {user?.email}
                </h1>
                {isOffline && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                    <WifiOff size={14} />
                    المتصفح أوفلاين
                  </span>
                )}
                {powerSyncStatus.connecting && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold animate-pulse" title="جاري الاتصال بالسيرفر...">
                    <Wifi size={14} className="animate-spin" />
                    جاري الاتصال...
                  </span>
                )}
                {!powerSyncStatus.connected && !powerSyncStatus.connecting && (
                  <span 
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold cursor-help" 
                    title={`غير متصل بالسيرفر${!navigator.onLine ? ' - المتصفح أوفلاين' : ' - جاري إعادة المحاولة تلقائياً'}`}
                    onClick={async () => {
                      if (navigator.onLine) {
                        try {
                          await connectPowerSync({ force: true });
                        } catch (error: any) {
                          console.error('❌ Manual retry failed:', error?.message);
                        }
                      }
                    }}
                  >
                    <WifiOff size={14} />
                    غير متصل بالسيرفر
                  </span>
                )}
                {powerSyncStatus.connected && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold" title={`متصل بالسيرفر${powerSyncStatus.lastSyncedAt ? ` - آخر مزامنة: ${new Date(powerSyncStatus.lastSyncedAt).toLocaleTimeString('ar-EG')}` : ''}`}>
                    <Wifi size={14} />
                    متصل
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* <SyncStatus /> */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-200 font-[Tajawal]"
                >
                  <LogOut size={18} />
                  تسجيل الخروج
                </button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden mb-4 flex justify-between items-center">
              {/* <SyncStatus /> */}
              <div className="text-center flex-1">
                <h1 className="text-xl font-bold text-gray-900">
                  مرحباً، {user?.email?.split('@')[0]}
                </h1>
                {isOffline && <p className="text-xs text-gray-500 flex justify-center items-center gap-1"><WifiOff size={10} /> وضع أوفلاين</p>}
              </div>
              <div className="w-5"></div>
            </div>

            {renderContent()}
          </div>
        </main>

        <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />

        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </BrandingProvider>
  );
};

export default App;
