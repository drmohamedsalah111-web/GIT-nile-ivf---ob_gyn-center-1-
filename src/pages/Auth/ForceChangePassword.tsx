// ============================================================================
// 🔒 FORCE CHANGE PASSWORD PAGE
// Requires users with must_change_password=true to set a new password
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'يرجى إدخال كلمة المرور الجديدة';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'يرجى تأكيد كلمة المرور';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Update the password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // 2. Update must_change_password flag in doctors table
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: flagError } = await supabase
          .from('doctors')
          .update({ must_change_password: false })
          .eq('user_id', user.id);

        if (flagError) {
          console.error('Error updating flag:', flagError);
          // Don't throw - password is already changed
        }
      }

      toast.success('تم تغيير كلمة المرور بنجاح! 🎉');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: 'ضعيفة', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, text: 'متوسطة', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 3, text: 'جيدة', color: 'bg-blue-500' };
    return { level: 4, text: 'قوية', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">تغيير كلمة المرور</h1>
          <p className="text-white/80 text-sm">
            يجب تغيير كلمة المرور المؤقتة للمتابعة
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Info Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <p className="text-sm text-amber-700">
                تم إنشاء حسابك بواسطة مدير النظام. يرجى اختيار كلمة مرور جديدة وآمنة للمتابعة.
              </p>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Lock className="w-4 h-4" />
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور الجديدة"
                className={`w-full p-4 pr-12 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                  errors.newPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Strength */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.level >= level ? passwordStrength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength.level <= 1 ? 'text-red-500' :
                  passwordStrength.level === 2 ? 'text-yellow-600' :
                  passwordStrength.level === 3 ? 'text-blue-500' : 'text-green-500'
                }`}>
                  قوة كلمة المرور: {passwordStrength.text}
                </p>
              </div>
            )}
            
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Lock className="w-4 h-4" />
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="أعد إدخال كلمة المرور"
                className={`w-full p-4 pr-12 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                  errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Match indicator */}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> كلمات المرور متطابقة
              </p>
            )}
            
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Tips */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-700 mb-2">نصائح لكلمة مرور قوية:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className={formData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}>✓</span>
                8 أحرف على الأقل
              </li>
              <li className="flex items-center gap-2">
                <span className={/[A-Z]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}>✓</span>
                حرف كبير واحد على الأقل
              </li>
              <li className="flex items-center gap-2">
                <span className={/[0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}>✓</span>
                رقم واحد على الأقل
              </li>
              <li className="flex items-center gap-2">
                <span className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}>✓</span>
                رمز خاص (!@#$...)
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                حفظ كلمة المرور الجديدة
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
