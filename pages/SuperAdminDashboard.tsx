// ============================================================================
// 🔐 SUPER ADMIN DASHBOARD - لوحة تحكم المدير العام المُعاد تصميمها
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Shield, CreditCard, Users, DollarSign, Settings, BarChart3, 
  Database, Home, FileText, Activity, UserPlus,
  CheckCircle, Clock, RefreshCw, 
  Building2, Menu, X, ChevronRight, LogOut, AlertCircle,
  TrendingUp, Calendar, Eye, Edit, Trash2, Search, Filter,
  Mail, Phone, MoreVertical
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminAuthService } from '../services/adminAuthService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import LandingContentEditor from './admin/LandingContentEditor';
import AdminSettings from './admin/AdminSettings';
import { CreateSecretaryModal } from '../src/components/admin/CreateSecretaryModal';

interface SuperAdminDashboardProps {
  onLogout?: () => Promise<void>;
  onNavigate?: (page: string) => void;
}

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string;
  clinic_name: string;
  user_role: string;
  created_at: string;
  subscription?: {
    id: string;
    status: string;
    plan_name: string;
    end_date: string;
    paid_amount: number;
  };
}

interface DashboardStats {
  totalClinics: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiredSubscriptions: number;
  totalSecretaries: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPatients: number;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clinics' | 'secretaries' | 'analytics' | 'landing' | 'settings'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClinics: 0,
    activeSubscriptions: 0,
    pendingSubscriptions: 0,
    expiredSubscriptions: 0,
    totalSecretaries: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPatients: 0
  });
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [secretaries, setSecretaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'expired'>('all');
  const [showCreateSecretary, setShowCreateSecretary] = useState(false);

  useEffect(() => {
    loadDashboardData();
    setAdminInfo(adminAuthService.getCurrentAdmin());
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Load Clinics with Subscriptions
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, name, email, phone, clinic_name, user_role, created_at, secretary_doctor_id')
        .order('created_at', { ascending: false });

      if (doctorsError) throw doctorsError;

      const allDoctors = doctorsData || [];
      const doctorsOnly = allDoctors.filter(d => d.user_role === 'doctor');
      const secretariesOnly = allDoctors.filter(d => d.user_role === 'secretary');

      // 2. Load Subscriptions
      const { data: subsData } = await supabase
        .from('clinic_subscriptions')
        .select(`
          id, clinic_id, status, start_date, end_date, paid_amount,
          subscription_plans!plan_id(display_name_ar, monthly_price)
        `)
        .order('created_at', { ascending: false });

      // Map subscriptions to clinics
      const subsMap = new Map();
      (subsData || []).forEach(sub => {
        if (!subsMap.has(sub.clinic_id)) {
          subsMap.set(sub.clinic_id, {
            id: sub.id,
            status: sub.status,
            plan_name: sub.subscription_plans?.display_name_ar || 'غير محدد',
            end_date: sub.end_date,
            paid_amount: sub.paid_amount || 0
          });
        }
      });

      const clinicsWithSubs: Clinic[] = doctorsOnly.map(doc => ({
        ...doc,
        subscription: subsMap.get(doc.id)
      }));

      setClinics(clinicsWithSubs);

      // Map secretaries with their doctor info
      const secretariesWithDoctor = secretariesOnly.map(sec => {
        const doctor = doctorsOnly.find(d => d.id === sec.secretary_doctor_id);
        return {
          ...sec,
          doctor_name: doctor?.name || 'غير مرتبط',
          doctor_clinic: doctor?.clinic_name || ''
        };
      });
      setSecretaries(secretariesWithDoctor);

      // 3. Calculate Stats
      const activeCount = clinicsWithSubs.filter(c => c.subscription?.status === 'active').length;
      const pendingCount = clinicsWithSubs.filter(c => c.subscription?.status === 'suspended').length;
      const expiredCount = clinicsWithSubs.filter(c => c.subscription?.status === 'expired').length;
      const totalRevenue = (subsData || []).reduce((sum, s) => sum + (s.paid_amount || 0), 0);

      // Get patients count
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true });

      setStats({
        totalClinics: doctorsOnly.length,
        activeSubscriptions: activeCount,
        pendingSubscriptions: pendingCount,
        expiredSubscriptions: expiredCount,
        totalSecretaries: secretariesOnly.length,
        totalRevenue: totalRevenue,
        monthlyRevenue: totalRevenue,
        totalPatients: patientsCount || 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubscription = async (clinicId: string, subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('clinic_subscriptions')
        .update({ 
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('تم تفعيل الاشتراك بنجاح');
      loadDashboardData();
    } catch (error) {
      toast.error('فشل تفعيل الاشتراك');
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العيادة؟ سيتم حذف جميع البيانات!')) return;
    
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', clinicId);
      if (error) throw error;
      toast.success('تم حذف العيادة');
      loadDashboardData();
    } catch (error) {
      toast.error('فشل حذف العيادة');
    }
  };

  const handleDeleteSecretary = async (secretaryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السكرتير؟')) return;
    
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', secretaryId);
      if (error) throw error;
      toast.success('تم حذف السكرتير');
      loadDashboardData();
    } catch (error) {
      toast.error('فشل حذف السكرتير');
    }
  };

  const switchToNormalMode = () => {
    localStorage.removeItem('adminLogin');
    window.location.reload();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">نشط ✓</span>;
      case 'suspended':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">قيد المراجعة ⏳</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">منتهي ✗</span>;
      case 'trial':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">تجريبي</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">بدون اشتراك</span>;
    }
  };

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = 
      clinic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      clinic.subscription?.status === filterStatus ||
      (!clinic.subscription && filterStatus === 'suspended');

    return matchesSearch && matchesFilter;
  });

  const menuItems = [
    { id: 'overview', title: 'نظرة عامة', icon: Home, color: 'text-blue-600' },
    { id: 'clinics', title: 'العيادات والاشتراكات', icon: Building2, color: 'text-purple-600' },
    { id: 'secretaries', title: 'السكرتارية', icon: Users, color: 'text-green-600' },
    { id: 'analytics', title: 'التقارير والإحصائيات', icon: BarChart3, color: 'text-orange-600' },
    { id: 'landing', title: 'صفحة الهبوط', icon: FileText, color: 'text-pink-600' },
    { id: 'settings', title: 'الإعدادات', icon: Settings, color: 'text-gray-600' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-50 p-2.5 rounded-xl">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">العيادات</span>
                </div>
                <h3 className="text-3xl font-black text-gray-800">{stats.totalClinics}</h3>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-50 p-2.5 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">اشتراكات نشطة</span>
                </div>
                <h3 className="text-3xl font-black text-green-600">{stats.activeSubscriptions}</h3>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-50 p-2.5 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-500">قيد المراجعة</span>
                </div>
                <h3 className="text-3xl font-black text-amber-600">{stats.pendingSubscriptions}</h3>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-50 p-2.5 rounded-xl">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">إجمالي الإيرادات</span>
                </div>
                <h3 className="text-2xl font-black text-gray-800">{stats.totalRevenue.toLocaleString()} ج.م</h3>
              </div>
            </div>

            {/* Pending Approvals Alert */}
            {stats.pendingSubscriptions > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-800">يوجد {stats.pendingSubscriptions} طلب اشتراك في انتظار الموافقة</h4>
                  <p className="text-sm text-amber-600">راجع طلبات الاشتراك الجديدة وقم بتفعيلها</p>
                </div>
                <button 
                  onClick={() => { setActiveTab('clinics'); setFilterStatus('suspended'); }}
                  className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors"
                >
                  مراجعة الطلبات
                </button>
              </div>
            )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
                <Users className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-2xl font-black">{stats.totalSecretaries}</h3>
                <p className="text-sm opacity-80">سكرتارية</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
                <Activity className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-2xl font-black">{stats.totalPatients}</h3>
                <p className="text-sm opacity-80">مريض</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
                <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-2xl font-black">{stats.expiredSubscriptions}</h3>
                <p className="text-sm opacity-80">اشتراك منتهي</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
                <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-2xl font-black">{Math.round((stats.activeSubscriptions / (stats.totalClinics || 1)) * 100)}%</h3>
                <p className="text-sm opacity-80">معدل التفعيل</p>
              </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">الوصول السريع</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('clinics')}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right flex-1">
                  <h4 className="font-bold text-gray-800">إدارة العيادات</h4>
                  <p className="text-xs text-gray-500 mt-1">{stats.totalClinics} عيادة</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500" />
              </button>

              <button
                onClick={() => setShowCreateSecretary(true)}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className="p-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right flex-1">
                  <h4 className="font-bold text-gray-800">إضافة سكرتير/ة</h4>
                  <p className="text-xs text-gray-500 mt-1">إنشاء حساب جديد</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500" />
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className="p-3 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-right flex-1">
                  <h4 className="font-bold text-gray-800">التقارير</h4>
                  <p className="text-xs text-gray-500 mt-1">إحصائيات مفصلة</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500" />
              </button>
            </div>
          </div>
        );

      case 'clinics':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-800">العيادات والاشتراكات</h2>
                <p className="text-gray-500 mt-1">إدارة جميع العيادات المسجلة وحالة اشتراكاتها</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 pl-4 py-2 border border-gray-200 rounded-xl w-64 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="suspended">قيد المراجعة</option>
                  <option value="expired">منتهي</option>
                </select>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`p-4 rounded-xl border transition-all ${filterStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-2xl font-black">{clinics.length}</div>
                <div className="text-sm opacity-80">إجمالي</div>
              </button>
              <button 
                onClick={() => setFilterStatus('active')}
                className={`p-4 rounded-xl border transition-all ${filterStatus === 'active' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 hover:border-green-300'}`}
              >
                <div className="text-2xl font-black">{stats.activeSubscriptions}</div>
                <div className="text-sm opacity-80">نشط</div>
              </button>
              <button 
                onClick={() => setFilterStatus('suspended')}
                className={`p-4 rounded-xl border transition-all ${filterStatus === 'suspended' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-200 hover:border-amber-300'}`}
              >
                <div className="text-2xl font-black">{stats.pendingSubscriptions}</div>
                <div className="text-sm opacity-80">قيد المراجعة</div>
              </button>
              <button 
                onClick={() => setFilterStatus('expired')}
                className={`p-4 rounded-xl border transition-all ${filterStatus === 'expired' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 hover:border-red-300'}`}
              >
                <div className="text-2xl font-black">{stats.expiredSubscriptions}</div>
                <div className="text-sm opacity-80">منتهي</div>
              </button>
            </div>

            {/* Clinics Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">العيادة</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">التواصل</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الاشتراك</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الباقة</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">المدفوع</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                          <p className="mt-2 text-gray-500">جاري التحميل...</p>
                        </td>
                      </tr>
                    ) : filteredClinics.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <Building2 className="w-12 h-12 mx-auto text-gray-300" />
                          <p className="mt-2 text-gray-500">لا توجد عيادات</p>
                        </td>
                      </tr>
                    ) : (
                      filteredClinics.map((clinic) => (
                        <tr key={clinic.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold">
                                {(clinic.name?.[0] || 'د').toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{clinic.name || 'غير محدد'}</div>
                                <div className="text-xs text-gray-500">{clinic.clinic_name || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{clinic.email}</div>
                            <div className="text-xs text-gray-400">{clinic.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(clinic.subscription?.status)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">{clinic.subscription?.plan_name || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800">
                              {(clinic.subscription?.paid_amount || 0).toLocaleString()} ج.م
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {clinic.subscription?.status === 'suspended' && (
                                <button
                                  onClick={() => handleApproveSubscription(clinic.id, clinic.subscription!.id)}
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                  title="تفعيل الاشتراك"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteClinic(clinic.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'secretaries':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-800">إدارة السكرتارية</h2>
                <p className="text-gray-500 mt-1">جميع حسابات السكرتارية المرتبطة بالعيادات</p>
              </div>
              
              <button
                onClick={() => setShowCreateSecretary(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                <UserPlus className="w-5 h-5" />
                إضافة سكرتير/ة جديد/ة
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-3xl font-black text-gray-800">{secretaries.length}</div>
                <div className="text-sm text-gray-500">إجمالي السكرتارية</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-3xl font-black text-green-600">
                  {new Set(secretaries.map(s => s.secretary_doctor_id)).size}
                </div>
                <div className="text-sm text-gray-500">عيادات لديها سكرتارية</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-3xl font-black text-purple-600">
                  {clinics.length - new Set(secretaries.map(s => s.secretary_doctor_id)).size}
                </div>
                <div className="text-sm text-gray-500">عيادات بدون سكرتارية</div>
              </div>
            </div>

            {/* Secretaries List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {secretaries.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 mx-auto text-gray-200" />
                  <h3 className="mt-4 text-lg font-bold text-gray-600">لا يوجد سكرتارية</h3>
                  <p className="text-gray-400 mt-1">قم بإضافة سكرتير جديد للبدء</p>
                  <button
                    onClick={() => setShowCreateSecretary(true)}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    إضافة سكرتير/ة
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">السكرتير/ة</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">البريد الإلكتروني</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الهاتف</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">تابع للعيادة</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">تاريخ الإنشاء</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secretaries.map((sec) => (
                        <tr key={sec.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold">
                                {(sec.name?.[0] || 'س').toUpperCase()}
                              </div>
                              <div className="font-bold text-gray-800">{sec.name || 'غير محدد'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{sec.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{sec.phone || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
                              {sec.doctor_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {sec.created_at ? format(new Date(sec.created_at), 'dd/MM/yyyy', { locale: ar }) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteSecretary(sec.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black text-gray-800">التقارير والإحصائيات</h2>
            
            {/* Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <DollarSign className="w-10 h-10 mb-4 opacity-80" />
                <div className="text-3xl font-black">{stats.totalRevenue.toLocaleString()} ج.م</div>
                <p className="opacity-80 mt-1">إجمالي الإيرادات</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <Building2 className="w-10 h-10 mb-4 opacity-80" />
                <div className="text-3xl font-black">{stats.totalClinics}</div>
                <p className="opacity-80 mt-1">عيادة مسجلة</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <Activity className="w-10 h-10 mb-4 opacity-80" />
                <div className="text-3xl font-black">{stats.totalPatients}</div>
                <p className="opacity-80 mt-1">مريض في النظام</p>
              </div>
            </div>

            {/* Subscription Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">توزيع الاشتراكات</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">نشط</div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(stats.activeSubscriptions / (stats.totalClinics || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-left font-bold text-gray-800">{stats.activeSubscriptions}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">قيد المراجعة</div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${(stats.pendingSubscriptions / (stats.totalClinics || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-left font-bold text-gray-800">{stats.pendingSubscriptions}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">منتهي</div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(stats.expiredSubscriptions / (stats.totalClinics || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-left font-bold text-gray-800">{stats.expiredSubscriptions}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'landing':
        return <LandingContentEditor onBack={() => setActiveTab('overview')} />;
      
      case 'settings':
        return <AdminSettings onBack={() => setActiveTab('overview')} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none w-72 border-l border-gray-100 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2.5 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-gray-800 text-lg">لوحة المدير</h1>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-purple-50 text-purple-700 font-bold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-purple-600' : 'text-gray-400'}`} />
                <span>{item.title}</span>
                {item.id === 'clinics' && stats.pendingSubscriptions > 0 && (
                  <span className="mr-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {stats.pendingSubscriptions}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <button
              onClick={switchToNormalMode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>العودة للموقع</span>
            </button>
            <button
              onClick={async () => {
                if (onLogout) await onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {menuItems.find(i => i.id === activeTab)?.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={loadDashboardData}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{adminInfo?.name || 'المدير العام'}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold border-2 border-white shadow-sm">
                {(adminInfo?.name?.[0] || 'A').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Create Secretary Modal */}
      <CreateSecretaryModal 
        isOpen={showCreateSecretary}
        onClose={() => setShowCreateSecretary(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default SuperAdminDashboard;
