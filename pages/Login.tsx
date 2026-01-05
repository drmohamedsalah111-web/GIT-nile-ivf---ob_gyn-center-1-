import React, { useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { Mail, Lock, Heart, Eye, EyeOff, Shield, Stethoscope, Users } from 'lucide-react';
import { DeveloperCard } from '../components/common/DeveloperCard';
import { NavigationButtons } from '../components/common/NavigationButtons';

interface LoginProps {
  onLoginSuccess: () => void;
  onAdminAccess?: () => void;
  onBack?: () => void;
}

type UserRole = 'doctor' | 'secretary';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onAdminAccess, onBack }) => {
  const [email, setEmail] = useState('admin@nileivf.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(email, password);

      if (data && data.user) {
        const actualRole = await authService.getUserRole(data.user.id);

        if (actualRole !== selectedRole) {
          // Show user-friendly message and auto-switch role
          toast.error(`هذا الحساب مسجل كـ ${actualRole === 'doctor' ? 'طبيب' : 'سكرتيرة'}. جاري التبديل...`);
          setSelectedRole(actualRole as UserRole);
          setLoading(false);

          // Try login again with correct role after a short delay
          setTimeout(() => {
            setLoading(true);
            onLoginSuccess();
          }, 1500);
          return;
        }

        toast.success(`✅ مرحباً! تم تسجيل الدخول`);
        onLoginSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col lg:flex-row font-['Tajawal']" dir="rtl">
      {/* Navigation Buttons - Fixed Top */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <NavigationButtons showHome={true} homeRoute="/" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 relative overflow-hidden items-center justify-center px-12">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

        {/* Admin Button */}
        {onAdminAccess && (
          <button
            onClick={onAdminAccess}
            className="absolute top-20 right-8 flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
          >
            <Shield className="w-5 h-5" />
            <span className="font-bold">دخول الإدارة</span>
          </button>
        )}

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-20 left-8 text-white hover:text-teal-100 transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span className="text-sm font-medium">عودة</span>
          </button>
        )}

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
              <Heart className="w-12 h-12 text-white animate-pulse" fill="currentColor" />
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-4">نظام Nile</h1>
          <p className="text-xl text-teal-100 mb-2">لإدارة عيادات النساء والتوليد</p>

          <div className="my-6 h-1 w-16 bg-white/40 mx-auto rounded-full" />

          <p className="text-lg text-teal-50 leading-relaxed">
            نظام متكامل وحديث لإدارة الحقن المجهري والعقم وأمراض النساء والتوليد
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-center gap-3 text-teal-100">
              <Heart className="w-5 h-5" />
              <span>رعاية شاملة للمرضى</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-teal-100">
              <Shield className="w-5 h-5" />
              <span>أمان وحماية البيانات</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-teal-100">
              <Stethoscope className="w-5 h-5" />
              <span>إدارة احترافية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="inline-flex w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl items-center justify-center mb-4 shadow-xl">
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mt-4">نظام Nile</h2>
            <p className="text-sm text-gray-600 mt-2">نظام إدارة عيادات النساء والتوليد</p>
          </div>

          {/* Welcome Section */}
          <div className="text-center mb-10">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">مرحباً بعودتك</h3>
            <p className="text-gray-600 text-lg">سجل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <p className="text-sm font-bold text-gray-700 mb-3">نوع الحساب</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`py-4 px-4 rounded-2xl font-bold transition-all duration-300 flex flex-col items-center gap-2 border-2 ${selectedRole === 'doctor'
                  ? 'bg-teal-500 text-white border-teal-500 shadow-lg scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Stethoscope className="w-6 h-6" />
                <span className="text-sm">طبيب</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('secretary')}
                className={`py-4 px-4 rounded-2xl font-bold transition-all duration-300 flex flex-col items-center gap-2 border-2 ${selectedRole === 'secretary'
                  ? 'bg-teal-500 text-white border-teal-500 shadow-lg scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">سكرتيرة</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full pr-12 pl-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 mt-8 ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl hover:scale-105'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحميل...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-3">ليس لديك حساب؟</p>
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-5 h-5" />
                <span>سجّل كطبيب جديد</span>
              </a>
            </div>
          </form>

          {/* Unified Developer Copyright Section */}
          <DeveloperCard />
        </div>
      </div>
    </div>
  );
};

export default Login;
