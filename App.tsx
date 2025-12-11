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
import { initPowerSync } from './src/powersync/client';
import { useStatus } from '@powersync/react';

const App: React.FC = () => {
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

  // Track retry attempts to prevent infinite loops
  const retryAttemptsRef = useRef(0);
  const lastRetryTimeRef = useRef(0);
  const hasGivenUpRef = useRef(false); // Flag to stop retrying after max attempts
  const MAX_RETRIES = 2; // Reduced to 2 attempts
  const RETRY_COOLDOWN = 60000; // 60 seconds cooldown between retry attempts

  useEffect(() => {
    // Only log status changes in development
    if (import.meta.env.DEV) {
      console.log('🔌 PowerSync Status Change:', JSON.stringify(powerSyncStatus, null, 2));
      console.log('🔌 Connected:', powerSyncStatus.connected);
      console.log('🔌 Connecting:', powerSyncStatus.connecting);
    }
    
    // Stop retrying if we've given up
    if (hasGivenUpRef.current) {
      return;
    }
    
    // Auto-retry connection if disconnected but online
    if (!powerSyncStatus.connected && !powerSyncStatus.connecting && navigator.onLine && user) {
      const now = Date.now();
      const timeSinceLastRetry = now - lastRetryTimeRef.current;
      
      // Check if we should retry (cooldown period passed and haven't exceeded max retries)
      if (timeSinceLastRetry > RETRY_COOLDOWN && retryAttemptsRef.current < MAX_RETRIES) {
        retryAttemptsRef.current++;
        lastRetryTimeRef.current = now;
        
        const timeoutId = setTimeout(async () => {
          console.log(`🔄 Auto-retrying PowerSync connection (attempt ${retryAttemptsRef.current}/${MAX_RETRIES})...`);
          try {
            await initPowerSync();
            // Reset retry counter on success
            if (powerSyncStatus.connected) {
              retryAttemptsRef.current = 0;
              hasGivenUpRef.current = false;
            }
          } catch (error: any) {
            console.warn('⚠️ Auto-retry failed:', error?.message);
            if (retryAttemptsRef.current >= MAX_RETRIES) {
              hasGivenUpRef.current = true;
              console.warn('⚠️ Max retry attempts reached. PowerSync will work in offline mode.');
              console.warn('⚠️ البيانات القديمة متاحة من Supabase مباشرة حتى يتم الاتصال.');
            }
          }
        }, 10000); // Retry after 10 seconds
        
        return () => clearTimeout(timeoutId);
      } else if (retryAttemptsRef.current >= MAX_RETRIES) {
        if (!hasGivenUpRef.current) {
          hasGivenUpRef.current = true;
          console.warn('⚠️ Max retry attempts reached. PowerSync will work in offline mode.');
          console.warn('⚠️ البيانات القديمة متاحة من Supabase مباشرة حتى يتم الاتصال.');
        }
      }
    } else if (powerSyncStatus.connected) {
      // Reset retry counter when connected
      retryAttemptsRef.current = 0;
      hasGivenUpRef.current = false;
    }
  }, [powerSyncStatus, user]);

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

        // 3. Initialize PowerSync (non-blocking)
        if (currentUser) {
          console.log('📱 App: User authenticated, initializing PowerSync...');
          try {
            await initPowerSync();
          } catch (syncError: any) {
            console.warn('⚠️ PowerSync init failed (app will work offline):', syncError?.message);
            // Log detailed error for debugging
            if (syncError?.message?.includes('متغيرات البيئة')) {
              console.error('❌ Environment variables missing. Please check .env file');
            }
            // Don't set error - app can work offline
          }
        }

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

    const subscription = authService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        // Reset retry flags on new login
        retryAttemptsRef.current = 0;
        hasGivenUpRef.current = false;
        
        console.log('📱 App: Auth state changed (login), initializing PowerSync...');
        try {
          await initPowerSync();
          setConnectionError(null);
        } catch (err: any) {
          console.warn('⚠️ PowerSync connection failed (offline mode will be used):', err?.message);
          // Log detailed error for debugging
          if (err?.message?.includes('متغيرات البيئة')) {
            console.error('❌ Please check your .env file for missing variables');
          }
          // Don't set error for PowerSync failures - offline mode is expected
          // Data will be available directly from Supabase
        }
      } else {
        // Reset flags on logout
        retryAttemptsRef.current = 0;
        hasGivenUpRef.current = false;
      }
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
                          await initPowerSync();
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