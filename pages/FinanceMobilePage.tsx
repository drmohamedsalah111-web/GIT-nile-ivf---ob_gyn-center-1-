import React, { useState, useEffect } from 'react';
import { DollarSign, Receipt, TrendingUp, TrendingDown, Calendar, FileText, Users, CheckCircle, Package, BarChart3 } from 'lucide-react';
import { authService } from '../services/authService';
import CollectionsManagement from '../components/invoices/CollectionsManagement';
import { InvoicesManagementPage } from '../components/invoices';
import FinanceReports from '../components/finance/FinanceReports';
import ServicesManagementPage from '../components/finance/ServicesManagementPage';

const FinanceMobilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collections' | 'invoices' | 'reports' | 'services'>('collections');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('doctor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.error('❌ No current user found');
        return;
      }

      console.log('✅ Current user:', currentUser.id);
      setUser(currentUser);
      
      // Try to get profile based on role
      const role = await authService.getUserRole(currentUser.id);
      console.log('✅ User role:', role);
      setUserRole(role || 'doctor');
      
      if (role === 'secretary') {
        const secretaryProfile = await authService.getSecretaryProfile(currentUser.id);
        if (secretaryProfile) {
          console.log('✅ Secretary profile loaded:', secretaryProfile);
          setProfile(secretaryProfile);
        } else {
          console.warn('⚠️ No secretary profile found, using fallback');
          // Fallback: use secretary's own ID as doctor ID if not found
          setProfile({ id: currentUser.id, name: 'Secretary', secretary_doctor_id: currentUser.id });
        }
      } else {
        const doctorProfile = await authService.getDoctorProfile(currentUser.id);
        if (doctorProfile) {
          console.log('✅ Doctor profile loaded:', doctorProfile);
          setProfile(doctorProfile);
        } else {
          console.warn('⚠️ No doctor profile found, using fallback');
          // Fallback: use current user's ID
          setProfile({ id: currentUser.id, name: 'Doctor' });
        }
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDoctorId = () => profile?.secretary_doctor_id || profile?.id || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4" dir="rtl">
        <div className="text-center bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-md">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">لا يمكن تحميل البيانات</h2>
          <p className="text-gray-600">يرجى التأكد من تسجيل الدخول</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe" dir="rtl">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-green-600 to-green-700 text-white px-4 py-4 safe-area-inset-top shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">النظام المالي</h1>
              <p className="text-xs text-green-100">إدارة الفواتير والمقبوضات</p>
            </div>
          </div>
        </div>

        {/* Tabs - Scrollable */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'collections'
                ? 'bg-white text-green-700 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>التحصيل</span>
          </button>
          
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'invoices'
                ? 'bg-white text-green-700 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>الفواتير</span>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-green-700 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>التقارير</span>
          </button>

          {/* Services Tab - Only for Doctors */}
          {userRole === 'doctor' && (
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'services'
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>الخدمات</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'collections' && (
          <div className="space-y-4">
            <CollectionsManagement
              doctorId={getDoctorId()}
              secretaryId={user?.id || ''}
              secretaryName={profile?.name || 'User'}
            />
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <InvoicesManagementPage
              doctorId={getDoctorId()}
              secretaryId={user?.id || ''}
              secretaryName={profile?.name || 'User'}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <FinanceReports doctorId={getDoctorId()} />
          </div>
        )}

        {activeTab === 'services' && userRole === 'doctor' && (
          <div className="space-y-4">
            <ServicesManagementPage doctorId={getDoctorId()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceMobilePage;
