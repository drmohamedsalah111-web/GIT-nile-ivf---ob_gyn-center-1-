import React, { useState, useEffect } from 'react';
import { User, Building2, Lock, Upload, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { Doctor } from '../types';

interface SettingsProps {
  user: any;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'doctor' | 'clinic' | 'password' | 'about'>('doctor');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    doctor_image: '',
  });

  const [clinicData, setClinicData] = useState({
    clinic_name: '',
    clinic_address: '',
    clinic_phone: '',
    clinic_latitude: '',
    clinic_longitude: '',
    clinic_image: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        if (user?.id) {
          await authService.ensureDoctorRecord(user.id, user.email);
          const doctorProfile = await authService.getDoctorProfile(user.id);
          setDoctor(doctorProfile);
          setFormData({
            name: doctorProfile.name || '',
            email: doctorProfile.email || '',
            phone: doctorProfile.phone || '',
            specialization: doctorProfile.specialization || '',
            doctor_image: doctorProfile.doctor_image || '',
          });
          setClinicData({
            clinic_name: doctorProfile.clinic_name || '',
            clinic_address: doctorProfile.clinic_address || '',
            clinic_phone: doctorProfile.clinic_phone || '',
            clinic_latitude: doctorProfile.clinic_latitude || '',
            clinic_longitude: doctorProfile.clinic_longitude || '',
            clinic_image: doctorProfile.clinic_image || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error);
        toast.error('فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'doctor' | 'clinic') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const imageUrl = await authService.uploadImage(user.id, file, type === 'doctor' ? 'doctor_images' : 'clinic_images');
      
      if (type === 'doctor') {
        setFormData(prev => ({ ...prev, doctor_image: imageUrl }));
      } else {
        setClinicData(prev => ({ ...prev, clinic_image: imageUrl }));
      }
      
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الصورة');
    } finally {
      setSaving(false);
    }
  };

  const handleDoctorSave = async () => {
    try {
      setSaving(true);
      await authService.updateDoctorProfile(user.id, {
        name: formData.name,
        phone: formData.phone,
        specialization: formData.specialization,
        doctor_image: formData.doctor_image,
      });
      toast.success('تم تحديث البيانات الشخصية بنجاح');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل تحديث البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleClinicSave = async () => {
    try {
      setSaving(true);
      await authService.updateDoctorProfile(user.id, clinicData);
      toast.success('تم تحديث بيانات المركز بنجاح');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل تحديث بيانات المركز');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      setSaving(true);
      await authService.updatePassword(passwordData.newPassword);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      toast.success('تم تحديث كلمة المرور بنجاح');
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('فشل تحديث كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">الإعدادات</h2>

      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${
            activeTab === 'doctor'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={20} />
          الملف الشخصي
        </button>
        <button
          onClick={() => setActiveTab('clinic')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${
            activeTab === 'clinic'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 size={20} />
          المركز
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${
            activeTab === 'password'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock size={20} />
          كلمة المرور
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${
            activeTab === 'about'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Info size={20} />
          عن النظام
        </button>
      </div>

      {activeTab === 'doctor' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">بيانات الطبيب</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">التخصص</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <button
                onClick={handleDoctorSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
              >
                <Save size={18} />
                {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">صورة الملف الشخصي</h3>
              
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                {formData.doctor_image ? (
                  <div className="mb-4">
                    <img
                      src={formData.doctor_image}
                      alt="Doctor profile"
                      className="w-40 h-40 rounded-full mx-auto object-cover border-4 border-teal-600 mb-4"
                    />
                  </div>
                ) : (
                  <User size={64} className="mx-auto text-gray-400 mb-4" />
                )}
                
                <label className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg cursor-pointer font-[Tajawal] font-semibold transition-colors">
                  <Upload size={18} />
                  اختر صورة
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'doctor')}
                    disabled={saving}
                    className="hidden"
                  />
                </label>
                
                <p className="text-xs text-gray-500 mt-4">PNG, JPG حتى 10MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clinic' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">بيانات المركز</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المركز</label>
                <input
                  type="text"
                  value={clinicData.clinic_name}
                  onChange={(e) => setClinicData(prev => ({ ...prev, clinic_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان</label>
                <textarea
                  value={clinicData.clinic_address}
                  onChange={(e) => setClinicData(prev => ({ ...prev, clinic_address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={clinicData.clinic_phone}
                  onChange={(e) => setClinicData(prev => ({ ...prev, clinic_phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">خط العرض</label>
                  <input
                    type="text"
                    value={clinicData.clinic_latitude}
                    onChange={(e) => setClinicData(prev => ({ ...prev, clinic_latitude: e.target.value }))}
                    placeholder="30.0444"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">خط الطول</label>
                  <input
                    type="text"
                    value={clinicData.clinic_longitude}
                    onChange={(e) => setClinicData(prev => ({ ...prev, clinic_longitude: e.target.value }))}
                    placeholder="31.2357"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                  />
                </div>
              </div>

              <button
                onClick={handleClinicSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
              >
                <Save size={18} />
                {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">شعار/صورة المركز</h3>
              
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                {clinicData.clinic_image ? (
                  <div className="mb-4">
                    <img
                      src={clinicData.clinic_image}
                      alt="Clinic logo"
                      className="w-40 h-40 rounded-lg mx-auto object-cover border-4 border-teal-600 mb-4"
                    />
                  </div>
                ) : (
                  <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
                )}
                
                <label className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg cursor-pointer font-[Tajawal] font-semibold transition-colors">
                  <Upload size={18} />
                  اختر صورة
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'clinic')}
                    disabled={saving}
                    className="hidden"
                  />
                </label>
                
                <p className="text-xs text-gray-500 mt-4">PNG, JPG حتى 10MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow-md p-8 max-w-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle size={24} className="text-orange-500" />
            تغيير كلمة المرور
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
              placeholder="أدخل كلمة المرور الجديدة"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
              placeholder="أعد إدخال كلمة المرور"
            />
          </div>

          <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
            <AlertCircle size={16} />
            كلمة المرور يجب أن تكون 6 أحرف على الأقل
          </p>

          <button
            onClick={handlePasswordSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
          >
            <Save size={18} />
            {saving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="bg-teal-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Info size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-[Tajawal]">نظام د. محمد صلاح جبر</h3>
            <p className="text-gray-600 font-[Tajawal]">نظام إدارة عيادة الخصوبة والتوليد</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 font-[Tajawal]">معلومات النظام</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-[Tajawal]">الإصدار:</span>
                  <span className="font-semibold">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-[Tajawal]">تاريخ الإصدار:</span>
                  <span className="font-semibold">2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-[Tajawal]">المنصة:</span>
                  <span className="font-semibold">Web Application</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 font-[Tajawal]">المطور</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="bg-teal-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <User size={24} className="text-teal-600" />
                  </div>
                  <h5 className="font-bold text-gray-900 font-[Tajawal]">د. محمد صلاح جبر</h5>
                  <p className="text-sm text-gray-600 font-[Tajawal]">مطور البرمجيات الطبية</p>
                  <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">
                    برمجة وتطوير النظام المتكامل لإدارة عيادات الخصوبة والتوليد
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[Tajawal]">التقنيات المستخدمة</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-blue-700">React</div>
                <div className="text-xs text-blue-600">Frontend Framework</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-green-700">TypeScript</div>
                <div className="text-xs text-green-600">Programming Language</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-purple-700">Supabase</div>
                <div className="text-xs text-purple-600">Database & Auth</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-orange-700">Tailwind CSS</div>
                <div className="text-xs text-orange-600">Styling Framework</div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-[Tajawal]">
              Copyright © 2025 Nile IVF Center. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2 font-[Tajawal]">
              تم التطوير بواسطة د. محمد صلاح جبر
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
