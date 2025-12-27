// ============================================================================
// 🔐 SUPER ADMIN DASHBOARD - لوحة تحكم المدير العام
// ============================================================================
// صفحة مخصصة لإدارة النظام والاشتراكات
// ============================================================================

import React, { useState } from 'react';
import { Shield, CreditCard, Users, DollarSign, Settings, BarChart3, Database, Lock, Home, FileText } from 'lucide-react';
import SaaSManagement from './admin/SaaSManagement';
import ClinicsManagement from './admin/ClinicsManagement';
import UsersManagement from './admin/UsersManagement';
import AdminAnalytics from './admin/AdminAnalytics';
import LandingContentEditor from './admin/LandingContentEditor';

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'clinics' | 'users' | 'analytics' | 'landing' | 'settings'>('overview');

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
      title: 'إعدادات النظام',
      titleEn: 'System Settings',
      description: 'إعدادات عامة للنظام وقاعدة البيانات',
      icon: Settings,
      color: 'bg-orange-500',
      count: 'قريباً',
      action: () => alert('هذه الميزة قيد التطوير')
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl relative">
        {/* Switch to Normal Mode Button */}
        <button
          onClick={switchToNormalMode}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span className="hidden md:inline">العودة للنظام العادي</span>
          <span className="md:hidden">عادي</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-12 h-12" />
              <h1 className="text-4xl font-bold">لوحة تحكم المدير العام</h1>
            </div>
            <p className="text-blue-100 text-lg">Super Admin Dashboard</p>
            <p className="text-blue-200 mt-2">إدارة كاملة لنظام العيادات والاشتراكات</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <Lock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">وصول محمي</p>
              <p className="text-xs text-blue-200">Admin Only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">إجمالي العيادات</p>
              <p className="text-3xl font-bold text-gray-800">--</p>
              <p className="text-xs text-gray-500 mt-1">Total Clinics</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">الاشتراكات النشطة</p>
              <p className="text-3xl font-bold text-gray-800">--</p>
              <p className="text-xs text-gray-500 mt-1">Active Subscriptions</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-gray-800">--</p>
              <p className="text-xs text-gray-500 mt-1">Total Users</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">الإيرادات الشهرية</p>
              <p className="text-3xl font-bold text-gray-800">--</p>
              <p className="text-xs text-gray-500 mt-1">Monthly Revenue</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500"
              onClick={card.action}
            >
              <div className="flex items-start gap-6">
                <div className={`${card.color} p-4 rounded-xl`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500 font-semibold mb-2">{card.titleEn}</p>
                  <p className="text-gray-600 mb-4">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold">
                      {card.count}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
                      فتح <span className="text-xl">←</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <Shield className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-2">ملاحظة هامة للمدير</h4>
            <p className="text-gray-700 mb-2">
              • هذه الصفحة مخصصة فقط للمديرين (Admin) ومحمية بصلاحيات خاصة
            </p>
            <p className="text-gray-700 mb-2">
              • يمكنك إدارة الاشتراكات من خلال بطاقة "إدارة الاشتراكات" أعلاه
            </p>
            <p className="text-gray-700">
              • بعض الميزات قيد التطوير وستكون متاحة قريباً
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
