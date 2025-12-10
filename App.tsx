/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import BottomNav from './components/BottomNav';
import SyncStatus from './components/SyncStatus';
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
import { LogOut, WifiOff } from 'lucide-react';
import { BrandingProvider } from './context/BrandingContext';
import { initPWA } from './src/lib/pwa';
import { initLocalDB } from './src/db/localDB';
import { syncService } from './src/services/syncService';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.HOME);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);

        // 1. Initialize Local DB (Critical for Offline)
        await initLocalDB();
        initPWA().catch(console.warn); // Non-blocking PWA init

        // 2. Check Local Storage for cached session (FAST CHECK)
        // Supabase stores session in localStorage by default with key 'sb-[project-ref]-auth-token'
        // We will try standard auth check first, but handle offline error gracefully

        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);

          // Only trigger sync if we have a user and are online
          if (currentUser && navigator.onLine) {
            syncService.initializeSync().catch(console.error);
          }
        } catch (authError) {
          console.warn('Auth check failed:', authError);
          // Real auth error: do not set user, allow app to show login
        }

      } catch (error) {
        console.error('Critical App Initialization Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const subscription = authService.onAuthStateChange((user) => {
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
                    وضع أوفلاين
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <SyncStatus />
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
              <SyncStatus />
              <div className="text-center flex-1">
                 <h1 className="text-xl font-bold text-gray-900">
                  مرحباً، {user?.email?.split('@')[0]}
                </h1>
                {isOffline && <p className="text-xs text-gray-500 flex justify-center items-center gap-1"><WifiOff size={10}/> وضع أوفلاين</p>}
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