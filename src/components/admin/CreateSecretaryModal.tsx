// ============================================================================
// 🎨 CREATE SECRETARY MODAL - Super Admin Component
// Creates new secretary accounts and links them to clinics
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building2, Mail, Lock, Phone, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

interface Clinic {
  id: string;
  name: string;
  clinic_name: string;
  email: string;
}

interface CreateSecretaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateSecretaryModal: React.FC<CreateSecretaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  
  const [formData, setFormData] = useState({
    clinicId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '123456', // Default password
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load clinics on mount
  useEffect(() => {
    if (isOpen) {
      loadClinics();
    }
  }, [isOpen]);

  const loadClinics = async () => {
    setLoadingClinics(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, clinic_name, email')
        .eq('user_role', 'doctor')
        .order('name');

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error loading clinics:', error);
      toast.error('فشل تحميل قائمة العيادات');
    } finally {
      setLoadingClinics(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clinicId) {
      newErrors.clinicId = 'يرجى اختيار العيادة';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get the current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('create-secretary', {
        body: {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          clinicId: formData.clinicId,
          phone: formData.phone.trim() || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || 'فشل إنشاء الحساب');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'فشل إنشاء الحساب');
      }

      // Success!
      toast.success('تم إنشاء حساب السكرتارية بنجاح! ✅', { duration: 4000 });
      toast.success(`البريد: ${formData.email} | كلمة المرور: ${formData.password}`, { duration: 6000 });
      
      // Reset form
      setFormData({
        clinicId: '',
        fullName: '',
        email: '',
        phone: '',
        password: '123456',
      });
      
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Error creating secretary:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">إنشاء حساب سكرتارية</h2>
                <p className="text-white/70 text-sm">إضافة سكرتير/ة جديد/ة لعيادة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Clinic Select */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              العيادة
            </label>
            {loadingClinics ? (
              <div className="flex items-center gap-2 text-gray-500 p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري تحميل العيادات...
              </div>
            ) : (
              <select
                name="clinicId"
                value={formData.clinicId}
                onChange={handleChange}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                  errors.clinicId ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
              >
                <option value="">-- اختر العيادة --</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} {clinic.clinic_name ? `(${clinic.clinic_name})` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.clinicId && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.clinicId}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <User className="w-4 h-4" />
              الاسم الكامل
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="مثال: أحمد محمد"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              dir="ltr"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Phone className="w-4 h-4" />
              رقم الهاتف <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              dir="ltr"
            />
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Lock className="w-4 h-4" />
              كلمة المرور المؤقتة
            </label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono ${
                errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              dir="ltr"
            />
            <p className="text-gray-500 text-xs mt-1">
              ⚠️ سيُطلب من السكرتير/ة تغيير كلمة المرور عند أول تسجيل دخول
            </p>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-bold mb-1">ماذا سيحدث؟</p>
                <ul className="space-y-1 text-blue-600">
                  <li>• سيتم إنشاء حساب جديد للسكرتير/ة</li>
                  <li>• سيتم ربط الحساب بالعيادة المختارة</li>
                  <li>• سيحتاج السكرتير/ة لتغيير كلمة المرور عند الدخول</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || loadingClinics}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  إنشاء الحساب
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSecretaryModal;
