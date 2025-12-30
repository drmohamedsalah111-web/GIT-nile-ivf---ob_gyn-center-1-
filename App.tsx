

import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, LogOut, Shield } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

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
import DoctorFinancialMonitor from './pages/doctor/DoctorFinancialMonitor';
import { Login } from './pages/Login';
import SaaSManagement from './pages/admin/SaaSManagement';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import LandingPage from './pages/LandingPage';
import PrescriptionPage from './pages/PrescriptionPage';
import { adminAuthService } from './services/adminAuthService';

import LabReferencesModal from './src/components/LabReferencesModal';

// Reception System Components
import { RequireRole } from './components/auth/RequireRole';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'secretary' | 'admin'>('doctor');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLabReferences, setShowLabReferences] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Clinic ID should be the `doctors.id` (not auth.user.id). Use `doctorId` state.
  const clinicId = doctorId;

  // Sync activePage with URL for Sidebar/BottomNav (backward compatibility)
  const getActivePageFromPath = (path: string): Page => {
    if (path.includes('/reception')) return Page.RECEPTION;
    if (path.includes('/patients/add')) return Page.ADD_PATIENT;
    if (path.includes('/gynecology')) return Page.GYNECOLOGY;
    if (path.includes('/ivf-journey')) return Page.IVF;
    if (path.includes('/smart-ivf')) return Page.SMART_IVF;
    if (path.includes('/infertility')) return Page.INFERTILITY_WORKUP;
    if (path.includes('/obstetrics')) return Page.OBSTETRICS;
    if (path.includes('/records')) return Page.PATIENT_RECORD;
    if (path.includes('/finance')) return Page.FINANCE;
    if (path.includes('/settings')) return Page.SETTINGS;
    if (path.includes('/admin')) return Page.ADMIN;
    if (path.includes('/saas')) return Page.SAAS_MANAGEMENT;
    if (path.includes('/super-admin')) return Page.SUPER_ADMIN;
    return Page.HOME;
  };

  const activePage = getActivePageFromPath(location.pathname);
  const setActivePage = (page: Page) => {
    switch (page) {
      case Page.HOME: navigate('/'); break;
      case Page.RECEPTION: navigate('/reception'); break;
      case Page.ADD_PATIENT: navigate('/patients/add'); break;
      case Page.GYNECOLOGY: navigate('/gynecology'); break;
      case Page.IVF: navigate('/ivf-journey'); break;
      case Page.SMART_IVF: navigate('/smart-ivf'); break;
      case Page.INFERTILITY_WORKUP: navigate('/infertility'); break;
      case Page.OBSTETRICS: navigate('/obstetrics'); break;
      case Page.PATIENT_RECORD: navigate('/records'); break;
      case Page.FINANCE: navigate('/finance'); break;
      case Page.SETTINGS: navigate('/settings'); break;
      case Page.ADMIN: navigate('/admin'); break;
      case Page.SAAS_MANAGEMENT: navigate('/saas-management'); break;
      case Page.SUPER_ADMIN: navigate('/super-admin'); break;
      default: navigate('/');
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        try {
          const currentUser = await authService.getCurrentUser();

          // Check if this is an admin login session
          const adminLoginFlag = localStorage.getItem('adminLogin');
          if (adminLoginFlag === 'true' && currentUser) {
            // Admin session logic handled by routing now
          }

          setUser(currentUser);

          if (currentUser) {
            const role = await authService.getUserRole(currentUser.id);
            console.log('Current User Role:', role); // Debug log
            setUserRole((role as any) || 'doctor');
            // Fetch the doctor's DB record (doctors.id) and store as doctorId
            try {
              const doctor = await authService.getDoctorProfile(currentUser.id);
              if (doctor && doctor.id) {
                // For secretaries, we use the linked doctor's ID as the "Clinic ID" / "Doctor ID" context
                // For doctors, we use their own ID
                const activeId = doctor.secretary_doctor_id || doctor.id;
                setDoctorId(activeId);
              } else {
                // Ensure a doctor record exists (creates one if missing)
                const ensured = await authService.ensureDoctorRecord(currentUser.id, currentUser.email || '');
                if (ensured && ensured.id) setDoctorId(ensured.id);
              }
            } catch (e) {
              console.warn('Failed to load or ensure doctor record:', e);
            }

            if (role === 'secretary') {
              toast.success('تم تسجيل الدخول كسكرتيرة', { icon: '👩‍💼' });
            }
          }
        } catch (authError: any) {
          // Session not yet initialized, this is normal on first load
          console.log('Session not yet ready:', authError?.message);
          setUser(null);
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
        }).catch(err => {
          console.log('Error fetching role on auth change:', err);
        });

        // refresh doctorId on auth state change
        authService.getDoctorProfile(nextUser.id).then(doctor => {
          if (doctor && doctor.id) {
            const activeId = doctor.secretary_doctor_id || doctor.id;
            setDoctorId(activeId);
          }
        }).catch(async () => {
          try {
            const ensured = await authService.ensureDoctorRecord(nextUser.id, nextUser.email || '');
            if (ensured && ensured.id) setDoctorId(ensured.id);
          } catch (e) {
            console.warn('Failed to ensure doctor on auth change:', e);
            setDoctorId(null);
          }
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
      if (adminAuthService.isAuthenticated()) {
        await adminAuthService.logout();
        navigate('/admin-login');
      } else {
        await authService.logout();
        localStorage.removeItem('adminLogin'); // Clear admin login flag
        setUser(null);
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('adminLogin');
      setUser(null);
      localStorage.clear();
      navigate('/');
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

  // 🔐 ADMIN LOGIN PAGE ROUTE HANDLED INSIDE ROUTES

  return (
    <ThemeProvider>
      <BrandingProvider>
        <EnvErrorBanner />
        <PreviewWarningBanner />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            !user ? (
              <Login
                onLoginSuccess={() => { window.location.href = '/'; }}
                onAdminAccess={() => { navigate('/admin-login'); }}
                onBack={() => navigate('/')}
              />
            ) : <Navigate to="/" replace />
          } />

          <Route path="/admin-login" element={
            <AdminLoginPage
              onLoginSuccess={() => {
                navigate('/super-admin');
              }}
            />
          } />

          <Route path="/landing" element={
            !user ? (
              <LandingPage
                onLogin={() => navigate('/login')}
                onAdminLogin={() => navigate('/admin-login')}
              />
            ) : <Navigate to="/" replace />
          } />

          {/* Authenticated Routes */}
          <Route path="/*" element={
            !user ? <Navigate to="/landing" replace /> : (
              // MAIN LAYOUT WRAPPER
              <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse font-[Tajawal]">

                {/* Sidebar & Navigation */}
                {userRole === 'secretary' ? (
                  // Secretary Dashboard (Full Screen usually, but can look like doctor's)
                  <div className="w-full">
                    {clinicId ? (
                      <SubscriptionGuard clinicId={clinicId}>
                        <Routes>
                          <Route path="/" element={<SecretaryDashboard />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </SubscriptionGuard>
                    ) : (
                      <SecretaryDashboard />
                    )}
                  </div>
                ) : (
                  // Doctor Layout
                  <>
                    <div className="hidden md:flex">
                      <Sidebar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
                    </div>

                    <main className="flex-1 md:mr-64 p-4 md:p-8 transition-all duration-300 no-print pb-20 md:pb-0">
                      <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="hidden md:flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-200"
                            >
                              <LogOut size={18} />
                              تسجيل الخروج
                            </button>
                            <button
                              onClick={() => setShowLabReferences(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition duration-200"
                            >
                              <BookOpen size={18} />
                              مرجع التحاليل
                            </button>
                          </div>
                          <h1 className="text-2xl font-bold text-gray-900">
                            مرحباً، {user?.email}
                          </h1>
                        </div>

                        {/* Mobile Header */}
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

                        {/* Main Content Routes */}
                        {clinicId ? (
                          <SubscriptionGuard clinicId={clinicId}>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/reception" element={<ReceptionDashboard />} />
                              <Route path="/patients/add" element={<AddPatient />} />
                              <Route path="/gynecology" element={<Gynecology />} />
                              <Route path="/ivf-journey" element={<IvfJourney />} />
                              <Route path="/smart-ivf" element={<SmartIVFJourney />} />
                              <Route path="/infertility" element={<InfertilityWorkup />} />
                              <Route path="/obstetrics" element={<ObstetricsDashboard />} />
                              <Route path="/records" element={<PatientMasterRecord />} />
                              <Route path="/finance" element={<DoctorFinancialMonitor />} />
                              <Route path="/prescription" element={<PrescriptionPage />} />
                              <Route path="/settings" element={<Settings user={user} />} />
                              <Route path="/admin" element={
                                <RequireRole allowedRoles={['admin', 'doctor']}>
                                  <AdminDashboard />
                                </RequireRole>
                              } />
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </SubscriptionGuard>
                        ) : (
                          // Fallback if no clinicId yet
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        )}
                      </div>
                    </main>

                    <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
                  </>
                )}
              </div>
            )
          } />

          {/* Super Admin Routes */}
          <Route path="/super-admin" element={
            <RequireRole allowedRoles={['admin']}>
              <div className="min-h-screen bg-background font-[Tajawal]">
                <SuperAdminDashboard
                  onLogout={handleLogout}
                  onNavigate={(page) => navigate(page === Page.SAAS_MANAGEMENT ? '/saas-management' : '/super-admin')}
                />
              </div>
            </RequireRole>
          } />

          <Route path="/saas-management" element={
            <RequireRole allowedRoles={['admin']}>
              <div className="min-h-screen bg-background font-[Tajawal]">
                <SaaSManagement />
              </div>
            </RequireRole>
          } />

        </Routes>

        <LabReferencesModal isOpen={showLabReferences} onClose={() => setShowLabReferences(false)} />
        <Toaster position="top-center" reverseOrder={false} />
      </BrandingProvider>
    </ThemeProvider>
  );
};

export default App;

