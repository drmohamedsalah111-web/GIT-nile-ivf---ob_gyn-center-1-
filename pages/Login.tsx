import React, { useState } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { LogIn, AlertCircle, Mail, Lock, User, Phone, Stethoscope, Facebook, MessageCircle, UserCheck, Shield } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onAdminAccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onAdminAccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isSecretary, setIsSecretary] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [signupData, setSignupData] = useState({
    name: '',
    specialization: '',
    phone: '',
    doctorId: '',
  });

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !signupData.name) {
      toast.error('الرجاء ملء البيانات المطلوبة');
      return;
    }

    if (isSecretary && !signupData.doctorId) {
      toast.error('يرجى اختيار الطبيب المسؤول');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const role = isSecretary ? 'secretary' : 'doctor';
      const { session } = await authService.signup(email, password, signupData, role, signupData.doctorId);
      
      if (session) {
        toast.success('تم التسجيل بنجاح!');
        // Force reload to ensure user role is correctly loaded
        window.location.reload();
      } else {
        toast.success('تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني');
        setShowSignup(false);
        setIsSecretary(false);
        setEmail('');
        setPassword('');
        setSignupData({ name: '', specialization: '', phone: '', doctorId: '' });
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      // استخدام الدالة الآمنة التي تعمل حتى للمستخدمين غير المسجلين
      const { data: doctorsData, error } = await supabase
        .rpc('get_doctors_list');

      if (!error && doctorsData) {
        setDoctors(doctorsData);
      } else if (error) {
        console.error('Failed to load doctors via RPC:', error);
        // محاولة بديلة باستخدام الطريقة التقليدية
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('doctors')
          .select('id, name, email')
          .eq('user_role', 'doctor');
        
        if (!fallbackError && fallbackData) {
          setDoctors(fallbackData);
        } else {
          toast.error('فشل تحميل قائمة الأطباء');
        }
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('حدث خطأ في تحميل قائمة الأطباء');
    }
  };

  // Fallback branding for login page
  const branding = {
    clinic_name: 'Nile IVF Center',
    logo_url: null
  };

  return (
    <div className="min-h-screen flex font-[Tajawal]" dir="rtl">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white md:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Branding */}
          <div className="text-center">
            {/* Admin Button - زر الأدمن المنفصل - واضح جداً */}
            <div className="fixed top-4 left-4 z-50">
              <button
                onClick={() => {
                  if (onAdminAccess) {
                    onAdminAccess();
                  }
                }}
                className="group flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 animate-pulse"
              >
                <Shield className="w-6 h-6" />
                <span>🔐 دخول الأدمن</span>
              </button>
            </div>

            <div className="flex justify-center mb-6">
              {branding?.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt="Nile IVF Center Logo"
                  className="w-20 h-20 rounded-full object-cover border-4 border-teal-100"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Stethoscope className="text-white" size={32} />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              مركز د صلاح للخصوبة
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              معاكم خطوة بخطوة
            </p>
            <p className="text-gray-500 text-base">
              {showSignup ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </p>
          </div>

          {/* Login Form */}
          {!showSignup ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                    placeholder="doctor@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري التسجيل...
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsSecretary(false)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      !isSecretary
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    <Stethoscope className="inline w-4 h-4 ml-2" />
                    طبيب
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSecretary(true);
                      loadDoctors();
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      isSecretary
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    <UserCheck className="inline w-4 h-4 ml-2" />
                    سكرتيرة
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  الاسم الكامل *
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                    placeholder={isSecretary ? "آية محمد" : "د. أحمد محمد"}
                    disabled={loading}
                  />
                </div>
              </div>

              {!isSecretary && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    التخصص
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={signupData.specialization}
                      onChange={(e) => setSignupData({ ...signupData, specialization: e.target.value })}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                      placeholder="أمراض النساء والتوليد"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {isSecretary && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    اختر الطبيب المسؤول *
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    <select
                      value={signupData.doctorId}
                      onChange={(e) => setSignupData({ ...signupData, doctorId: e.target.value })}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white"
                      disabled={loading || doctors.length === 0}
                    >
                      <option value="">-- اختر طبيب --</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          د. {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                    placeholder="+966501234567"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                    placeholder="doctor@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800">
                  تأكد من أن كلمة المرور قوية وسهلة الحفظ
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري التسجيل...
                  </div>
                ) : (
                  isSecretary ? 'إنشاء حساب السكرتيرة' : 'إنشاء حساب'
                )}
              </button>
            </form>
          )}

          {/* Toggle between Login/Signup */}
          <div className="text-center space-y-4">
            <button
              onClick={() => {
                setShowSignup(!showSignup);
                setEmail('');
                setPassword('');
                setSignupData({ name: '', specialization: '', phone: '', doctorId: '' });
              }}
              className="text-teal-600 hover:text-teal-700 font-semibold transition-colors duration-200"
              disabled={loading}
            >
              {showSignup ? 'هل لديك حساب؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب'}
            </button>
          </div>

          {/* Footer with Copyright and Developer Credits */}
          <div className="pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>Copyright © 2025 مركز د صلاح للخصوبة. All Rights Reserved.</p>
            <p className="mt-1">تم التطوير بواسطة د. محمد صلاح جبر</p>
            
            <div className="mt-4 flex items-center justify-center gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=100000785193419"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                <Facebook size={16} />
                <span>تابعنا على فيسبوك</span>
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://wa.me/201003418068"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors font-medium"
              >
                <MessageCircle size={16} />
                <span>راسلنا على واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative Banner */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-teal-600 to-cyan-700 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-cyan-700/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              نرافقكم في رحلة الأمل
            </h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              نحن هنا لمساعدتكم في تحقيق أحلامكم في بناء أسرة سعيدة
            </p>
            <div className="flex items-center justify-center gap-2 text-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>مركز د صلاح للخصوبة</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-12 h-12 border border-white/30 rounded-full"></div>
      </div>
    </div>
  );
};
