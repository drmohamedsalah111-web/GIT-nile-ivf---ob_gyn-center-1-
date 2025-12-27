import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, LogOut, Shield } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import BottomNav from './components/BottomNav';
import EnvErrorBanner from './components/EnvErrorBanner';
import PreviewWarningBanner from './components/PreviewWarningBanner';
import { BrandingProvider } from './context/BrandingContext';
import { ThemeProvider } from './context/ThemeContext';
import SubscriptionGuard from './components/auth/SubscriptionGuard';

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
import InfertilityWorkup from './src/pages/InfertilityWorkup';
import FinancePage from './components/pages/FinancePage';
import { Login } from './pages/Login';
import SaaSManagement from './pages/admin/SaaSManagement';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import LandingPage from './pages/LandingPage';
import { adminAuthService } from './services/adminAuthService';

import LabReferencesModal from './src/components/LabReferencesModal';

// Reception System Components
import { ReceptionLayout } from './components/layout/ReceptionLayout';
import { ReceptionDashboard as NewReceptionDashboard } from './components/reception/ReceptionDashboard';
import { DailyCashPage } from './components/reception/DailyCashPage';
import { RequireRole } from './components/auth/RequireRole';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.HOME);
  const [receptionPage, setReceptionPage] = useState<'dashboard' | 'appointments' | 'patients' | 'cash'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'secretary' | 'admin'>('doctor');
  const [loading, setLoading] = useState(true);
  const [showLabReferences, setShowLabReferences] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showLanding, setShowLanding] = useState(true); // Show landing page initially

  // Helper function to get clinic ID based on user role
  const getClinicId = (): string | null => {
    if (!user) return null;
    if (userRole === 'doctor') return user.id;
    if (userRole === 'secretary') return user.doctor_id || user.secretary_doctor_id || null;
    return null;
  };
  
  const clinicId = getClinicId();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        
        // Check if this is an admin login session
        const adminLoginFlag = localStorage.getItem('adminLogin');
        if (adminLoginFlag === 'true' && currentUser) {
          setIsAdminLogin(true);
          setActivePage(Page.SUPER_ADMIN);
        }
        
        setUser(currentUser);
        
        if (currentUser) {
          const role = await authService.getUserRole(currentUser.id);
          console.log('Current User Role:', role); // Debug log
          setUserRole((role as any) || 'doctor');
          
          if (role === 'secretary') {
            toast.success('تم تسجيل الدخول كسكرتيرة', { icon: '👩‍💼' });
          } else {
            // toast('تم تسجيل الدخول كطبيب', { icon: '👨‍⚕️' });
          }
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
          console.log('Auth State Change Role:', role); // Debug log
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
      // Check if this is an admin session
      if (adminAuthService.isAuthenticated()) {
        await adminAuthService.logout();
        setShowAdminLogin(false);
        setIsAdminLogin(false);
        setActivePage(Page.HOME);
      } else {
        await authService.logout();
        localStorage.removeItem('adminLogin'); // Clear admin login flag
        setUser(null);
        setActivePage(Page.HOME);
        setIsAdminLogin(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('adminLogin');
      setUser(null);
      localStorage.clear();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-[Tajawal]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" />
          <p className="text-textSecondary">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // 🔐 إذا كانت صفحة دخول الأدمن مفتوحة
  if (showAdminLogin) {
    return (
      <>
        <AdminLoginPage 
          onLoginSuccess={() => {
            setShowAdminLogin(false);
            setIsAdminLogin(true);
            setActivePage(Page.SUPER_ADMIN);
          }} 
        />
        <Toaster position="top-center" reverseOrder={false} />
      </>
    );
  }

  // إذا كان الأدمن مسجل دخول
  if (isAdminLogin && adminAuthService.isAuthenticated()) {
    return (
      <ThemeProvider>
        <BrandingProvider clinicId={null}>
          <div className="min-h-screen bg-background font-[Tajawal]">
            <EnvErrorBanner />
            <PreviewWarningBanner />
            
            {activePage === Page.SUPER_ADMIN ? (
              <SuperAdminDashboard 
                onLogout={handleLogout}
                onNavigate={(page) => setActivePage(page)}
              />
            ) : activePage === Page.SAAS_MANAGEMENT ? (
              <SaaSManagement 
                onBack={() => setActivePage(Page.SUPER_ADMIN)}
              />
            ) : null}

            <Toaster position="top-center" reverseOrder={false} />
          </div>
        </BrandingProvider>
      </ThemeProvider>
    );
  }

  // صفحة دخول المستخدم العادي
  if (!user) {
    // عرض صفحة الهبوط أولاً
    if (showLanding) {
      return (
        <>
          <LandingPage 
            onLogin={() => setShowLanding(false)}
            onAdminLogin={() => {
              setShowLanding(false);
              setShowAdminLogin(true);
            }}
          />
          <Toaster position="top-center" reverseOrder={false} />
        </>
      );
    }
    
    // صفحة تسجيل الدخول العادية
    return (
      <>
        <Login 
          onLoginSuccess={() => window.location.reload()}
          onAdminAccess={() => setShowAdminLogin(true)}
          onBack={() => setShowLanding(true)}
        />
        <Toaster position="top-center" reverseOrder={false} />
      </>
    );
  }

  const renderContent = () => {
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
      case Page.INFERTILITY_WORKUP:
        return <InfertilityWorkup />;
      case Page.OBSTETRICS:
        return <ObstetricsDashboard />;
      case Page.PATIENT_RECORD:
        return <PatientMasterRecord />;
      case Page.FINANCE:
        return <FinancePage doctorId={user?.id} />;
      case Page.SETTINGS:
        return <Settings user={user} />;
      case Page.ADMIN:
        return (
          <RequireRole allowedRoles={['admin', 'doctor']}>
            <AdminDashboard />
          </RequireRole>
        );
      case Page.SAAS_MANAGEMENT:
        return (
          <RequireRole allowedRoles={['admin']}>
            <SaaSManagement />
          </RequireRole>
        );
      case Page.SUPER_ADMIN:
        return (
          <RequireRole allowedRoles={['admin']}>
            <SuperAdminDashboard />
          </RequireRole>
        );
      default:
        return <Dashboard />;
    }
  };

  if (userRole === 'secretary') {
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
          <div className="max-w-7xl mx-auto">
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

            {renderContent()}
          </div>
        </main>

        <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />

        <LabReferencesModal isOpen={showLabReferences} onClose={() => setShowLabReferences(false)} />

        <Toaster position="top-center" reverseOrder={false} />
      </div>
        </SubscriptionGuard>
      ) : (
        <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">
          <div className="hidden md:flex">
            <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
          </div>
          <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
          <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
        </div>
      )}
    </BrandingProvider>
  </ThemeProvider>
  );
};

export default App;

