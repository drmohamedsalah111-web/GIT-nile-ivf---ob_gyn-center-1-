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
import { NavigationButtons } from './components/common/NavigationButtons';

import { Page } from './types';
import { authService } from './services/authService';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SecretaryDashboard = React.lazy(() => import('./pages/SecretaryDashboard'));
const ReceptionDashboard = React.lazy(() => import('./src/pages/ReceptionDashboard'));
const AddPatient = React.lazy(() => import('./pages/AddPatient'));
const Gynecology = React.lazy(() => import('./pages/Gynecology'));
const IvfJourney = React.lazy(() => import('./pages/IvfJourney'));
const SmartIVFJourney = React.lazy(() => import('./pages/SmartIVFJourney'));
const SmartStimulationCopilot = React.lazy(() => import('./pages/SmartStimulationCopilot'));
const ObstetricsDashboard = React.lazy(() => import('./pages/ObstetricsDashboard'));
const PatientMasterRecord = React.lazy(() => import('./pages/PatientMasterRecord'));
const PatientProfile = React.lazy(() => import('./src/pages/PatientProfile'));
const CompleteMedicalRecord = React.lazy(() => import('./components/patients/CompleteMedicalRecord'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const InfertilityWorkup = React.lazy(() => import('./src/pages/InfertilityWorkup'));
import FinancePage from './components/pages/FinancePage';
const DoctorFinancialMonitor = React.lazy(() => import('./pages/doctor/DoctorFinancialMonitor'));
const FinanceMobilePage = React.lazy(() => import('./pages/FinanceMobilePage'));
import { Login } from './pages/Login';
const SaaSManagement = React.lazy(() => import('./pages/admin/SaaSManagement'));
const SuperAdminDashboard = React.lazy(() => import('./pages/SuperAdminDashboard'));
const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const PrescriptionPage = React.lazy(() => import('./pages/PrescriptionPage'));
const DoctorRegistration = React.lazy(() => import('./src/pages/Auth/DoctorRegistration'));
const SubscriptionPending = React.lazy(() => import('./src/pages/Auth/SubscriptionPending'));
const ForceChangePassword = React.lazy(() => import('./src/pages/Auth/ForceChangePassword'));
import { adminAuthService } from './services/adminAuthService';

import LabReferencesModal from './src/components/LabReferencesModal';

// Reception System Components
import { RequireRole } from './components/auth/RequireRole';
import { useParams } from 'react-router-dom';

// Wrapper for CompleteMedicalRecord to get patientId from URL
const CompleteMedicalRecordWrapper: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  if (!patientId) {
    return <div className="text-center py-20 text-red-500">معرف المريض مطلوب</div>;
  }
  
  return (
    <React.Suspense fallback={<div className="text-center py-20">جاري التحميل...</div>}>
      <CompleteMedicalRecord patientId={patientId} onClose={() => navigate(-1)} />
    </React.Suspense>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'secretary' | 'admin'>('doctor');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
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
    if (path.includes('/patient-profile')) return Page.PATIENT_PROFILE;
    if (path.includes('/finance')) return Page.FINANCE;
    if (path.includes('/settings')) return Page.SETTINGS;
    if (path.includes('/admin')) return Page.ADMIN;
    if (path.includes('/saas')) return Page.SAAS_MANAGEMENT;
    if (path.includes('/super-admin')) return Page.SUPER_ADMIN;
    return Page.HOME;
  };

  const activePage = getActivePageFromPath(location.pathname);
  const setActivePage = React.useCallback((page: Page) => {
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
      case Page.PATIENT_PROFILE: navigate('/patient-profile'); break;
      case Page.FINANCE: navigate('/finance'); break;
      case Page.SETTINGS: navigate('/settings'); break;
      case Page.ADMIN: navigate('/admin'); break;
      case Page.SAAS_MANAGEMENT: navigate('/saas-management'); break;
      case Page.SUPER_ADMIN: navigate('/super-admin'); break;
      default: navigate('/');
    }
  }, [navigate]);

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
                
                // Check if user must change password (provisioned accounts)
                if (doctor.must_change_password === true) {
                  setMustChangePassword(true);
                }
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

  const handleLogout = React.useCallback(async () => {
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
  }, [navigate]);

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

  return (
    <ThemeProvider>
      <BrandingProvider>
        <EnvErrorBanner />
        <PreviewWarningBanner />

        <Routes>
          {/* 1. Public Routes */}
          <Route path="/login" element={!user ? <Login onLoginSuccess={() => window.location.href = '/'} onAdminAccess={() => navigate('/admin-login')} onBack={() => navigate('/')} /> : <Navigate to="/" replace />} />
          <Route path="/admin-login" element={<AdminLoginPage onLoginSuccess={() => navigate('/super-admin')} />} />
          <Route path="/landing" element={!user ? <LandingPage onLogin={() => navigate('/login')} onAdminLogin={() => navigate('/admin-login')} /> : <Navigate to="/" replace />} />
          <Route path="/register" element={<DoctorRegistration />} />
          <Route path="/subscription-pending" element={<SubscriptionPending />} />
          <Route path="/force-change-password" element={user ? <ForceChangePassword /> : <Navigate to="/login" replace />} />

          {/* 2. Super Admin Routes */}
          <Route path="/super-admin" element={<RequireRole allowedRoles={['admin']}><div className="min-h-screen bg-background font-[Tajawal]"><SuperAdminDashboard onLogout={handleLogout} onNavigate={(p) => navigate(p === Page.SAAS_MANAGEMENT ? '/saas-management' : '/super-admin')} /></div></RequireRole>} />
          <Route path="/saas-management" element={<RequireRole allowedRoles={['admin']}><div className="min-h-screen bg-background font-[Tajawal]"><SaaSManagement /></div></RequireRole>} />

          {/* 3. Main Application with Sidebar Layout */}
          <Route path="/*" element={
            !user ? <Navigate to="/landing" replace /> : 
            mustChangePassword ? <Navigate to="/force-change-password" replace /> : (
              <div className="min-h-screen bg-background flex flex-col md:flex-row font-[Tajawal] overflow-hidden">
                {/* Global Navigation Buttons - Fixed Left Side */}
                <div className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-[60]">
                  <NavigationButtons showHome={true} homeRoute="/" className="flex-col" />
                </div>

                {/* Sidebar Navigation */}
                <div className="hidden md:flex flex-none z-[100] relative">
                  <Sidebar
                    activePage={activePage}
                    setPage={setActivePage}
                    onLogout={handleLogout}
                    userRole={userRole}
                  />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 h-screen overflow-y-auto no-print pb-20 md:pb-0 relative z-0">
                  <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
                    {/* PC Header Bar */}
                    <div className="hidden md:flex justify-between items-center mb-6 bg-surface/50 p-4 rounded-2xl border border-borderColor/30">
                      <h1 className="text-xl font-black text-foreground">
                        {userRole === 'admin' ? 'إدارة النظام' : `مرحباً بك، ${user?.email?.split('@')[0]}`}
                      </h1>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setShowLabReferences(true)} className="flex items-center gap-2 px-6 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl font-bold transition-all duration-300">
                          <BookOpen size={18} /> مرجع التحاليل
                        </button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="relative">
                      {clinicId ? (
                        <SubscriptionGuard clinicId={clinicId}>
                          <React.Suspense fallback={
                            <div className="flex flex-col items-center justify-center py-20">
                              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                              <p className="mt-4 text-textSecondary font-bold">جاري تحميل الصفحة...</p>
                            </div>
                          }>
                            <Routes>
                              <Route path="/" element={userRole === 'secretary' ? <SecretaryDashboard /> : <Dashboard />} />
                              <Route path="/reception" element={<ReceptionDashboard />} />
                              <Route path="/patients/add" element={<AddPatient />} />
                              <Route path="/patient-profile" element={<PatientProfile />} />
                              <Route path="/medical-record/:patientId" element={<CompleteMedicalRecordWrapper />} />
                              <Route path="/gynecology" element={<Gynecology />} />
                              <Route path="/ivf-journey" element={<IvfJourney />} />
                              <Route path="/smart-ivf" element={<SmartIVFJourney />} />
                              <Route path="/smart-stimulation" element={<SmartStimulationCopilot />} />
                              <Route path="/infertility" element={<InfertilityWorkup />} />
                              <Route path="/obstetrics" element={<ObstetricsDashboard />} />
                              <Route path="/records" element={<PatientMasterRecord />} />
                              <Route path="/finance" element={<FinanceMobilePage />} />
                              <Route path="/prescription" element={<PrescriptionPage />} />
                              <Route path="/settings" element={<Settings user={user} />} />
                              <Route path="/admin" element={<RequireRole allowedRoles={['admin', 'doctor']}><AdminDashboard /></RequireRole>} />
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </React.Suspense>
                        </SubscriptionGuard>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                          <p className="mt-4 text-textSecondary font-bold text-lg">جاري تحميل البيانات...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </main>

                {/* Mobile Navigation */}
                <BottomNav activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
              </div>
            )
          } />
        </Routes>

        <LabReferencesModal isOpen={showLabReferences} onClose={() => setShowLabReferences(false)} />
        <Toaster position="top-center" reverseOrder={false} />
      </BrandingProvider>
    </ThemeProvider>
  );
};

export default App;
