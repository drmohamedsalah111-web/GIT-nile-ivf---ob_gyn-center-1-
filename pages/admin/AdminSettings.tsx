// ============================================================================
// 🔐 ADMIN SETTINGS - إعدادات حساب السوبر أدمن
// ============================================================================

import React, { useState } from 'react';
import { Shield, Lock, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { adminAuthService } from '../../services/adminAuthService';
import toast from 'react-hot-toast';

interface AdminSettingsProps {
  onBack: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onBack }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const admin = adminAuthService.getCurrentAdmin();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة');
      return;
    }

    try {
      setLoading(true);
      const success = await adminAuthService.changePassword(currentPassword, newPassword);
      
      if (success) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('كلمة المرور الحالية غير صحيحة');
      }
    } catch (error: any) {
      toast.error('فشل تغيير كلمة المرور: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
        <div className="px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">العودة للوحة التحكم</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-1">
                إعدادات الحساب
              </h1>
              <p className="text-indigo-100 text-sm">
                إدارة حساب السوبر أدمن والأمان
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Admin Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-r-4 border-indigo-500">
          <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            معلومات الحساب
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600 font-semibold">الاسم:</span>
              <span className="text-gray-900 font-bold">{admin?.name || 'غير متوفر'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600 font-semibold">البريد الإلكتروني:</span>
              <span className="text-gray-900 font-bold">{admin?.email || 'غير متوفر'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-semibold">الصلاحية:</span>
              <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-lg font-bold text-sm">
                {admin?.role === 'super_admin' ? 'مدير عام' : admin?.role || 'غير محدد'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-rose-500">
          <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-rose-600" />
            تغيير كلمة المرور
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                كلمة المرور الحالية
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                  placeholder="أدخل كلمة المرور الحالية"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                  placeholder="أدخل كلمة المرور الجديدة (8 أحرف على الأقل)"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                يجب أن تحتوي على 8 أحرف على الأقل
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                placeholder="أعد كتابة كلمة المرور الجديدة"
                required
              />
            </div>

            {/* Security Tips */}
            <div className="bg-amber-50 border-r-4 border-amber-400 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 mb-2 text-sm">نصائح الأمان:</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</li>
                <li>لا تشارك كلمة المرور مع أي شخص</li>
                <li>قم بتغيير كلمة المرور بشكل دوري</li>
                <li>لا تستخدم نفس كلمة المرور لحسابات أخرى</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التحديث...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ كلمة المرور الجديدة</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
