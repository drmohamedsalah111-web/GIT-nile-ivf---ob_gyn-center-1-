// ============================================================================
// 🔐 SUPER ADMIN DASHBOARD - لوحة تحكم المدير العام المحسّنة
// ============================================================================
// Dashboard ذكية وبسيطة لإدارة العيادات
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Shield, CreditCard, Users, DollarSign, Settings, BarChart3, Database, Lock, Home, FileText, TrendingUp, Activity, AlertCircle, CheckCircle, Clock, RefreshCw, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminAuthService } from '../services/adminAuthService';
import toast from 'react-hot-toast';
import SaaSManagement from './admin/SaaSManagement';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'clinics' | 'users' | 'analytics' | 'landing' | 'settings'>('overview');
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

      // العيادات = عدد الدكاترة (كل دكتور عنده عيادة)
      const totalClinics = doctorsData.count || 0;
      const totalDoctors = doctorsData.count || 0;
      const totalSecretaries = secretariesData.count || 0;

      setStats({
        totalClinics: totalClinics,
        activeSubscriptions: totalClinics, // كل عيادة (دكتور) عنده اشتراك
        totalUsers: totalDoctors + totalSecretaries,
        totalDoctors: totalDoctors,
        totalSecretaries: totalSecretaries,
        monthlyRevenue: 0, // يتم حسابه من جدول الاشتراكات
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

  const adminCards = [
    {
      id: 'subscriptions',
      title: 'إدارة الاشتراكات',
      titleEn: 'Subscription Management',
      description: 'إدارة اشتراكات العيادات والخطط والتجديد',
      icon: CreditCard,
      color: 'bg-blue-500',
      count: 'إدارة كاملة',
      action: () => setActiveTab('subscriptions')
    },
    {
      id: 'clinics',
      title: 'إدارة العيادات',
      titleEn: 'Clinics Management',
      description: 'عرض وإدارة جميع العيادات المسجلة في النظام',
      icon: Database,
      color: 'bg-teal-500',
      count: 'إدارة كاملة',
      action: () => setActiveTab('clinics')
    },
    {
      id: 'users',
      title: 'إدارة المستخدمين',
      titleEn: 'User Management',
      description: 'عرض وإدارة جميع المستخدمين في النظام',
      icon: Users,
      color: 'bg-green-500',
      count: 'إدارة كاملة',
      action: () => setActiveTab('users')
    },
    {
      id: 'analytics',
      title: 'التقارير والإحصائيات',
      titleEn: 'Analytics & Reports',
      description: 'إحصائيات مفصلة عن استخدام النظام',
      icon: BarChart3,
      color: 'bg-purple-500',
      count: 'إدارة كاملة',
      action: () => setActiveTab('analytics')
    },
    {
      id: 'landing',
      title: 'محتوى صفحة الهبوط',
      titleEn: 'Landing Page Content',
      description: 'تعديل محتوى ونصوص صفحة الهبوط',
      icon: FileText,
      color: 'bg-pink-500',
      count: 'إدارة كاملة',
      action: () => setActiveTab('landing')
    },
    {
      id: 'settings',
      title: 'إعدادات الحساب',
      titleEn: 'Account Settings',
      description: 'تغيير كلمة المرور وإدارة الحساب الشخصي',
      icon: Settings,
      color: 'bg-orange-500',
      count: 'إدارة',
      action: () => setActiveTab('settings')
    }
  ];

  if (activeTab === 'clinics') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold"
          >
            ← العودة للوحة التحكم
          </button>
        </div>
        <ClinicsManagement />
      </div>
    );
  }

  if (activeTab === 'users') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
          >
            ← العودة للوحة التحكم
          </button>
        </div>
        <UsersManagement />
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
          >
            ← العودة للوحة التحكم
          </button>
        </div>
        <AdminAnalytics />
      </div>
    );
  }

  if (activeTab === 'landing') {
    return <LandingContentEditor onBack={() => setActiveTab('overview')} />;
  }

  if (activeTab === 'settings') {
    return <AdminSettings onBack={() => setActiveTab('overview')} />;
  }

  if (activeTab === 'subscriptions') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← العودة للوحة التحكم
          </button>
        </div>
        <SaaSManagement />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      {/* Modern Header with Admin Info */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left Side - Title & Welcome */}
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl">
                <Shield className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1">
                  لوحة تحكم المدير العام
                </h1>
                <p className="text-blue-100 text-sm sm:text-base font-medium">
                  مرحباً {adminInfo?.name || 'المدير'}
                </p>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              
              <button
                onClick={async () => {
                  if (onLogout) await onLogout();
                }}
                className="flex items-center gap-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-bold transition-all duration-300"
              >
                <Lock className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 text-lg font-semibold">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats - Smart & Simple */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {/* Total Clinics */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-r-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-black text-gray-800 mb-1">
                  {stats.totalClinics}
                </div>
                <p className="text-gray-600 font-semibold text-sm">إجمالي العيادات</p>
                <p className="text-xs text-gray-400 mt-1">Total Clinics</p>
              </div>

              {/* Active Subscriptions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-r-4 border-green-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-black text-gray-800 mb-1">
                  {stats.activeSubscriptions}
                </div>
                <p className="text-gray-600 font-semibold text-sm">اشتراكات نشطة</p>
                <p className="text-xs text-gray-400 mt-1">Active Subscriptions</p>
              </div>

              {/* Total Users */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-r-4 border-purple-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">{stats.totalDoctors} طبيب</span>
                    <span className="text-xs text-gray-500">{stats.totalSecretaries} سكرتير</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-gray-800 mb-1">
                  {stats.totalUsers}
                </div>
                <p className="text-gray-600 font-semibold text-sm">إجمالي المستخدمين</p>
                <p className="text-xs text-gray-400 mt-1">Total Users</p>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-r-4 border-amber-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-amber-50 p-3 rounded-xl">
                    <DollarSign className="w-8 h-8 text-amber-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-black text-gray-800 mb-1">
                  {stats.monthlyRevenue.toLocaleString('ar-EG')} ج.م
                </div>
                <p className="text-gray-600 font-semibold text-sm">الإيرادات الشهرية</p>
                <p className="text-xs text-gray-400 mt-1">Monthly Revenue</p>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {/* Today's Appointments */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Clock className="w-10 h-10 mb-3 opacity-90" />
                    <div className="text-4xl font-black mb-2">{stats.todayAppointments}</div>
                    <p className="font-semibold text-cyan-100">مواعيد اليوم</p>
                    <p className="text-xs text-cyan-200 mt-1">Today's Appointments</p>
                  </div>
                  <Activity className="w-16 h-16 opacity-20" />
                </div>
              </div>

              {/* Total Patients */}
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Users className="w-10 h-10 mb-3 opacity-90" />
                    <div className="text-4xl font-black mb-2">{stats.totalPatients}</div>
                    <p className="font-semibold text-rose-100">إجمالي المرضى</p>
                    <p className="text-xs text-rose-200 mt-1">Total Patients</p>
                  </div>
                  <TrendingUp className="w-16 h-16 opacity-20" />
                </div>
              </div>
            </div>
          </>
        )}

      {/* Main Admin Cards - Smart & Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500 transform hover:-translate-y-1"
              onClick={card.action}
            >
              <div className="flex items-start gap-4">
                <div className={`${card.color} p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold mb-2">{card.titleEn}</p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {card.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {card.count && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">
                        {card.count}
                      </span>
                    )}
                    <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all mr-auto">
                      <span>فتح</span>
                      <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box - Simplified */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-r-4 border-blue-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-gray-800 mb-3 text-lg">ملاحظات هامة</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">لوحة تحكم محمية - مخصصة للمديرين فقط</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">البيانات يتم تحديثها تلقائياً من قاعدة البيانات</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">بعض الميزات المتقدمة قيد التطوير</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
