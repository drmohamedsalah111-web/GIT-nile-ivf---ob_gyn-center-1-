import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BookOpen, LogOut } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import BottomNav from './components/BottomNav';
import EnvErrorBanner from './components/EnvErrorBanner';
import PreviewWarningBanner from './components/PreviewWarningBanner';
import { BrandingProvider } from './context/BrandingContext';

import { Page } from './types';
import { authService } from './services/authService';

import Dashboard from './pages/Dashboard';
import SecretaryDashboard from './pages/SecretaryDashboard';
import ReceptionDashboard from './src/pages/ReceptionDashboard';
import AddPatient from './pages/AddPatient';
import Gynecology from './pages/Gynecology';
import IvfJourney from './pages/IvfJourney';
import SmartIVFJourney from './pages/SmartIVFJourney';
import ObstetricsDashboard from './pages/ObstetricsDashboard';
import PatientMasterRecord from './pages/PatientMasterRecord';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { Login } from './pages/Login';

import LabReferencesModal from './src/components/LabReferencesModal';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.HOME);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'secretary' | 'admin'>('doctor');
  const [loading, setLoading] = useState(true);
  const [showLabReferences, setShowLabReferences] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const role = await authService.getUserRole(currentUser.id);
          setUserRole((role as any) || 'doctor');
        }
      } catch (error: any) {
        console.error('App init error:', error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const subscription = authService.onAuthStateChange((nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        authService.getUserRole(nextUser.id).then(role => {
          setUserRole((role as any) || 'doctor');
        });
      }
    });

    return () => {
      if (subscription && typeof (subscription as any).unsubscribe === 'function') {
        (subscription as any).unsubscribe();
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
      setUser(null);
      localStorage.clear();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-[Tajawal]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
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
    if (userRole === 'secretary') {
      return <SecretaryDashboard />;
    }

    switch (activePage) {
      case Page.HOME:
        return <Dashboard />;
      case Page.RECEPTION:
        return <ReceptionDashboard />;
      case Page.ADD_PATIENT:
        return <AddPatient />;
      case Page.GYNECOLOGY:
        return <Gynecology />;
      case Page.IVF:
        return <IvfJourney />;
      case Page.SMART_IVF:
        return <SmartIVFJourney />;
      case Page.OBSTETRICS:
        return <ObstetricsDashboard />;
      case Page.PATIENT_RECORD:
        return <PatientMasterRecord />;
      case Page.SETTINGS:
        return <Settings user={user} />;
      case Page.ADMIN:
        return <AdminDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <BrandingProvider>
      <EnvErrorBanner />
      <PreviewWarningBanner />
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row-reverse font-[Tajawal]">
        {userRole !== 'secretary' && (
          <div className="hidden md:flex">
            <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
          </div>
        )}

        <main className={`flex-1 ${userRole !== 'secretary' ? 'md:mr-64' : ''} p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0`}>
          <div className="max-w-7xl mx-auto">
            {userRole !== 'secretary' && (
              <>
                <div className="hidden md:flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    مرحباً، {user?.email}
                  </h1>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLabReferences(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition duration-200"
                    >
                      <BookOpen size={18} />
                      مرجع التحاليل
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-200"
                    >
                      <LogOut size={18} />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>

                <div className="md:hidden mb-4 text-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    مرحباً، {user?.email?.split('@')[0]}
                  </h1>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowLabReferences(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition duration-200"
                    >
                      <BookOpen size={16} />
                      مرجع التحاليل
                    </button>
                  </div>
                </div>
              </>
            )}

            {userRole === 'secretary' && (
              <>
                <div className="hidden md:flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">لوحة السكرتيرة</h1>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-200"
                  >
                    <LogOut size={18} />
                    تسجيل الخروج
                  </button>
                </div>
                <div className="flex justify-between items-center mb-6 md:hidden">
                  <h1 className="text-lg font-bold text-gray-900">لوحة السكرتيرة</h1>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 text-sm font-semibold"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </>
            )}

            {renderContent()}
          </div>
        </main>

        {userRole !== 'secretary' && (
          <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
        )}

        <LabReferencesModal isOpen={showLabReferences} onClose={() => setShowLabReferences(false)} />

        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </BrandingProvider>
  );
};

export default App;

