import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { adminAuthService } from '../services/adminAuthService';
import toast from 'react-hot-toast';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

/**
 * 🔐 صفحة دخول الأدمن - منفصلة تماماً عن نظام العيادات
 */
const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('الرجاء ملء جميع الحقول');
      return;
    }

    setLoading(true);

    try {
      const result = await adminAuthService.login(email, password);

      if (result.success) {
        toast.success(`مرحباً بك يا ${result.admin?.name}! 🎉`);
        onLoginSuccess();
      } else {
        setError(result.error || 'فشل تسجيل الدخول');
        toast.error(result.error || 'فشل تسجيل الدخول');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl mb-4 animate-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            لوحة تحكم الأدمن
          </h1>
          <p className="text-purple-200 text-lg">Admin Control Panel</p>
          <div className="mt-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-lg inline-block">
            <p className="text-sm text-purple-200">
              🔒 نظام منفصل تماماً عن العيادات
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3.5 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                  disabled={loading}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3.5 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <p className="text-blue-200 text-sm text-center">
              💡 هذا النظام مخصص للمديرين فقط
              <br />
              للدخول كمستخدم عيادة، استخدم صفحة الدخول العادية
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            © 2025 Nile IVF Center - نظام إدارة العيادات
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
