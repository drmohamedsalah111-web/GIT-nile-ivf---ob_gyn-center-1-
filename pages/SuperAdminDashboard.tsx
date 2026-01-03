// ============================================================================
// 🔐 SUPER ADMIN DASHBOARD - لوحة تحكم المدير العام المحسّنة
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Shield, CreditCard, Users, DollarSign, Settings, BarChart3, 
  Database, Lock, Home, FileText, TrendingUp, Activity, 
  AlertCircle, CheckCircle, Clock, RefreshCw, ArrowLeft, 
  Building2, Menu, X, ChevronRight, LogOut
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminAuthService } from '../services/adminAuthService';
import toast from 'react-hot-toast';
import SaaSManagement from './admin/SaaSManagement';
import SmartSubscriptionManagement from './admin/SmartSubscriptionManagement';
import ClinicsManagement from './admin/ClinicsManagement';
import UsersManagement from './admin/UsersManagement';
import AdminAnalytics from './admin/AdminAnalytics';
import LandingContentEditor from './admin/LandingContentEditor';
import AdminSettings from './admin/AdminSettings';

interface SuperAdminDashboardProps {
  onLogout?: () => Promise<void>;
  onNavigate?: (page: string) => void;
}

interface DashboardStats {
  totalClinics: number;
  activeSubscriptions: number;
  totalUsers: number;
  totalDoctors: number;
  totalSecretaries: number;
  monthlyRevenue: number;
  todayAppointments: number;
  totalPatients: number;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'smart-subscriptions' | 'clinics' | 'users' | 'analytics' | 'landing' | 'settings'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClinics: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalSecretaries: 0,
    monthlyRevenue: 0,
    todayAppointments: 0,
    totalPatients: 0
  });
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    setAdminInfo(adminAuthService.getCurrentAdmin());
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all stats in parallel
      const [
        doctorsData,
        secretariesData,
        patientsData,
        todayAppointmentsData
      ] = await Promise.all([
        supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('user_role', 'doctor'),
        supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('user_role', 'secretary'),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .lt('appointment_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
      ]);

      const totalClinics = doctorsData.count || 0;
      const totalDoctors = doctorsData.count || 0;
      const totalSecretaries = secretariesData.count || 0;

      setStats({
        totalClinics: totalClinics,
        activeSubscriptions: totalClinics,
        totalUsers: totalDoctors + totalSecretaries,
        totalDoctors: totalDoctors,
        totalSecretaries: totalSecretaries,
        monthlyRevenue: 0,
        todayAppointments: todayAppointmentsData.count || 0,
        totalPatients: patientsData.count || 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const switchToNormalMode = () => {
    localStorage.removeItem('adminLogin');
    window.location.reload();
  };

  const menuItems = [
    {
      id: 'overview',
      title: 'نظرة عامة',
      icon: Home,
      color: 'text-blue-600'
    },
    {
      id: 'smart-subscriptions',
      title: 'الاشتراكات الذكية',
      icon: CreditCard,
      color: 'text-purple-600'
    },
    {
      id: 'clinics',
      title: 'إدارة العيادات',
      icon: Database,
      color: 'text-teal-600'
    },
    {
      id: 'users',
      title: 'المستخدمين',
      icon: Users,
      color: 'text-green-600'
    },
    {
      id: 'analytics',
      title: 'التقارير',
      icon: BarChart3,
      color: 'text-orange-600'
    },
    {
      id: 'landing',
      title: 'صفحة الهبوط',
      icon: FileText,
      color: 'text-pink-600'
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      icon: Settings,
      color: 'text-gray-600'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-1">{stats.totalClinics}</h3>
                <p className="text-gray-500 text-sm">إجمالي العيادات</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+5%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-1">{stats.activeSubscriptions}</h3>
                <p className="text-gray-500 text-sm">اشتراكات نشطة</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+8%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-1">{stats.totalUsers}</h3>
                <p className="text-gray-500 text-sm">إجمالي المستخدمين</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-amber-50 p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+15%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-1">{stats.monthlyRevenue.toLocaleString()}</h3>
                <p className="text-gray-500 text-sm">الإيرادات الشهرية</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">الوصول السريع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.slice(1).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group text-right"
                >
                  <div className={`p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">انقر للفتح</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 mr-auto group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        );
      case 'smart-subscriptions': return <SmartSubscriptionManagement />;
      case 'subscriptions': return <SaaSManagement />;
      case 'clinics': return <ClinicsManagement />;
      case 'users': return <UsersManagement />;
      case 'analytics': return <AdminAnalytics />;
      case 'landing': return <LandingContentEditor onBack={() => setActiveTab('overview')} />;
      case 'settings': return <AdminSettings onBack={() => setActiveTab('overview')} />;
      default: return null;
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
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg">
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
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.title}</span>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 mr-auto text-blue-600" />
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
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
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
    </div>
  );
};

export default SuperAdminDashboard;
