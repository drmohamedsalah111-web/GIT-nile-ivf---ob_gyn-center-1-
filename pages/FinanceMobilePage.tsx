import React, { useState, useEffect } from 'react';
import { DollarSign, Receipt, TrendingUp, TrendingDown, Calendar, FileText, Users, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import CollectionsManagement from '../components/invoices/CollectionsManagement';
import { InvoicesManagementPage } from '../components/invoices';

const FinanceMobilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collections' | 'invoices' | 'reports'>('collections');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      setUser(currentUser);
      
      // Try to get profile based on role
      const role = await authService.getUserRole(currentUser.id);
      
      if (role === 'secretary') {
        const secretaryProfile = await authService.getSecretaryProfile(currentUser.id);
        setProfile(secretaryProfile || { id: currentUser.id, name: 'Secretary' });
      } else {
        const doctorProfile = await authService.getDoctorProfile(currentUser.id);
        setProfile(doctorProfile || { id: currentUser.id, name: 'Doctor' });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <FileText className="w-4 h-4" />
            <span>التقارير</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'collections' && (
          <div className="space-y-4">
            <CollectionsManagement
              doctorId={profile.secretary_doctor_id || profile.id}
              secretaryId={user?.id || ''}
              secretaryName={profile.name || 'User'}
            />
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <InvoicesManagementPage
              clinicId={profile.secretary_doctor_id || profile.id}
              secretaryId={user?.id || ''}
              secretaryName={profile.name || 'User'}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Quick Stats Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                ملخص سريع
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">إجمالي اليوم</p>
                  <p className="text-xl font-bold text-blue-900">0 ج.م</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">المحصّل اليوم</p>
                  <p className="text-xl font-bold text-green-900">0 ج.م</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-600 font-medium mb-1">المعاملات اليوم</p>
                  <p className="text-xl font-bold text-yellow-900">0</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">المتبقي</p>
                  <p className="text-xl font-bold text-purple-900">0 ج.م</p>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">التقارير المفصلة</h3>
              <p className="text-gray-600 text-sm">قريباً... تقارير مفصلة بالإحصائيات والرسوم البيانية</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceMobilePage;
