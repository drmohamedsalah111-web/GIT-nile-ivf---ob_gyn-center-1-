import React, { useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, Stethoscope, Shield, Eye, EyeOff, LayoutGrid, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLoginSuccess: () => void;
  onAdminAccess?: () => void;
  onBack?: () => void;
}

type UserRole = 'doctor' | 'secretary';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onAdminAccess, onBack }) => {
  const [email, setEmail] = useState('');
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
      await authService.login(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-['Cairo']" dir="rtl">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Super Admin Button - Glassmorphism */}
        {onAdminAccess && (
          <button
            onClick={onAdminAccess}
            className="absolute top-8 left-8 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 group z-10"
          >
            <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Super Admin</span>
          </button>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Heart className="w-12 h-12 text-white" fill="currentColor" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              مركز د. صلاح<br />للخصوبة
            </h1>
            
            <p className="text-2xl text-teal-100 mb-8 font-light">
              معكم خطوة بخطوة 💙
            </p>

            <div className="flex items-center justify-center gap-3 text-teal-100">
              <Sparkles className="w-5 h-5" />
              <span className="text-lg">نظام إدارة متكامل وحديث</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 right-6 lg:right-auto lg:left-6 text-gray-500 hover:text-gray-700 transition-colors z-20"
          >
            ← العودة
          </button>
        )}

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">مركز د. صلاح للخصوبة</h2>
            </div>

            {/* Welcome Text */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">مرحباً بك</h3>
              <p className="text-gray-600">سجل دخولك للمتابعة</p>
            </div>

            {/* Role Switcher */}
            <div className="mb-6">
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1 relative">
                {/* Animated Background */}
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-y-1 bg-white rounded-lg shadow-md"
                  initial={false}
                  animate={{
                    x: selectedRole === 'doctor' ? 4 : '50%',
                    width: 'calc(50% - 8px)'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                {/* Doctor Option */}
                <button
                  onClick={() => setSelectedRole('doctor')}
                  className={`relative flex-1 py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                    selectedRole === 'doctor' ? 'text-teal-700' : 'text-gray-500'
                  }`}
                >
                  <Stethoscope className="w-5 h-5" />
                  <span>طبيب</span>
                </button>

                {/* Secretary Option */}
                <button
                  onClick={() => setSelectedRole('secretary')}
                  className={`relative flex-1 py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                    selectedRole === 'secretary' ? 'text-teal-700' : 'text-gray-500'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span>سكرتارية</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="example@clinic.com"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-11 pl-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <a href="#" className="text-teal-600 hover:text-teal-700 font-semibold">
                  نسيت كلمة المرور؟
                </a>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" />
                  <span className="text-gray-600">تذكرني</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-bold text-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>

            {/* Signup Link */}
            <p className="text-center text-gray-600 mt-6">
              ليس لديك حساب؟{' '}
              <a href="#" className="text-teal-600 hover:text-teal-700 font-bold">
                سجل الآن
              </a>
            </p>
          </motion.div>
        </div>

        {/* Footer - Developer Rights */}
        <div className="py-6 px-8 border-t border-gray-100 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">
              © 2025 Dr. Salah Fertility Center. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-600 font-bold">
              تم التطوير بواسطة د. محمد صلاح جبر
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
