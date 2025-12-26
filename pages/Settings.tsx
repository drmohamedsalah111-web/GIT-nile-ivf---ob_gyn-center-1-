import React, { useState, useEffect } from 'react';
import { User, Palette, FileText, Lock, Upload, Save, AlertCircle, CheckCircle, Facebook, MessageCircle, Loader, Database, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useBranding } from '../context/BrandingContext';
import { prescriptionService } from '../services/prescriptionService';
import { Doctor } from '../types';
import { ThemeSwitcher } from '../components/theme/ThemeSwitcher';

interface SettingsProps {
  user: any;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const { branding, updateBranding, loading: brandingLoading } = useBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'prescription' | 'profile' | 'password' | 'data'>('branding');

  const [brandingFormData, setBrandingFormData] = useState({
    clinic_name: '',
    primary_color: '',
    secondary_color: '',
    accent_color: '',
    background_color: '',
    text_color: '',
    header_font: 'Tajawal',
    body_font: 'Tajawal',
    button_style: 'rounded',
    card_style: 'shadow',
    logo_url: '' as string | null,
  });

  const [prescriptionFormData, setPrescriptionFormData] = useState({
    clinic_address: '',
    clinic_phone: '',
    default_rx_notes: '',
  });

  const [prescriptionStyleData, setPrescriptionStyleData] = useState({
    template_type: 'modern' as 'modern' | 'classic' | 'minimal' | 'elegant',
    primary_color: '#0891B2',
    secondary_color: '#06B6D4',
    accent_color: '#22D3EE',
    header_text: 'عيادة متخصصة',
    footer_text: 'العنوان | الهاتف',
    font_family: 'tajawal' as 'tajawal' | 'cairo' | 'almarai' | 'inter',
    font_size: 'medium' as 'small' | 'medium' | 'large',
    paper_size: 'A4' as 'A4' | 'A5' | 'Letter',
    show_watermark: false,
    show_clinic_address: true,
    show_clinic_phone: true,
    show_doctor_signature: true,
  });

  const [profileFormData, setProfileFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    doctor_image: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.id) {
          await authService.ensureDoctorRecord(user.id, user.email);
          const doctorProfile = await authService.getDoctorProfile(user.id);
          setDoctor(doctorProfile);
          setProfileFormData({
            name: doctorProfile.name || '',
            email: doctorProfile.email || '',
            phone: doctorProfile.phone || '',
            specialization: doctorProfile.specialization || '',
            doctor_image: doctorProfile.doctor_image || '',
          });

          // Load prescription style settings
          const prescriptionSettings = await prescriptionService.getSettings(1);
          setPrescriptionStyleData({
            template_type: prescriptionSettings.template_type,
            primary_color: prescriptionSettings.primary_color,
            secondary_color: prescriptionSettings.secondary_color,
            accent_color: prescriptionSettings.accent_color,
            header_text: prescriptionSettings.header_text,
            footer_text: prescriptionSettings.footer_text,
            font_family: prescriptionSettings.font_family,
            font_size: prescriptionSettings.font_size,
            paper_size: prescriptionSettings.paper_size,
            show_watermark: prescriptionSettings.show_watermark,
            show_clinic_address: prescriptionSettings.show_clinic_address,
            show_clinic_phone: prescriptionSettings.show_clinic_phone,
            show_doctor_signature: prescriptionSettings.show_doctor_signature,
          });
        }
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error);
        // No toast.error - using default profile silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);



  useEffect(() => {
    if (branding) {
      setBrandingFormData({
        clinic_name: branding.clinic_name || '',
        primary_color: branding.primary_color || '#2d5a6b',
        secondary_color: branding.secondary_color || '#00838f',
        accent_color: branding.accent_color || '#00bcd4',
        background_color: branding.background_color || '#ffffff',
        text_color: branding.text_color || '#1f2937',
        header_font: branding.header_font || 'Tajawal',
        body_font: branding.body_font || 'Tajawal',
        button_style: branding.button_style || 'rounded',
        card_style: branding.card_style || 'shadow',
        logo_url: branding.logo_url || null,
      });
      setPrescriptionFormData({
        clinic_address: branding.clinic_address || '',
        clinic_phone: branding.clinic_phone || '',
        default_rx_notes: branding.default_rx_notes || '',
      });
      setLogoPreview(branding.logo_url);
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogoUploadLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      await updateBranding({ clinic_name: brandingFormData.clinic_name }, file);
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الشعار. تأكد من إنشاء bucket "branding" في Supabase');
      setLogoPreview(branding?.logo_url || null);
    } finally {
      setLogoUploadLoading(false);
    }
  };

  const handleBrandingSave = async () => {
    try {
      setSaving(true);
      await updateBranding({
        clinic_name: brandingFormData.clinic_name,
        primary_color: brandingFormData.primary_color,
        secondary_color: brandingFormData.secondary_color,
        accent_color: brandingFormData.accent_color,
        background_color: brandingFormData.background_color,
        text_color: brandingFormData.text_color,
        header_font: brandingFormData.header_font,
        body_font: brandingFormData.body_font,
        button_style: brandingFormData.button_style,
        card_style: brandingFormData.card_style,
      });
      toast.success('تم تحديث بيانات الهوية البصرية بنجاح');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل تحديث بيانات الهوية البصرية');
    } finally {
      setSaving(false);
    }
  };

  const handlePrescriptionSave = async () => {
    try {
      setSaving(true);
      
      // Save content settings to branding
      await updateBranding({
        clinic_address: prescriptionFormData.clinic_address,
        clinic_phone: prescriptionFormData.clinic_phone,
        default_rx_notes: prescriptionFormData.default_rx_notes,
      });

      // Save style settings to clinic_print_settings
      await prescriptionService.saveSettings({
        clinic_id: 1,
        ...prescriptionStyleData,
      });

      toast.success('تم تحديث إعدادات الروشتة بنجاح');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل تحديث إعدادات الروشتة');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      await authService.updateDoctorProfile(user.id, {
        name: profileFormData.name,
        phone: profileFormData.phone,
        specialization: profileFormData.specialization,
        doctor_image: profileFormData.doctor_image,
      });
      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('فشل تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  const handleDoctorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const imageUrl = await authService.uploadImage(user.id, file, 'doctor_images');
      setProfileFormData(prev => ({ ...prev, doctor_image: imageUrl }));
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الصورة');
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

  // Unused handlers removed



  if (loading || brandingLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">لوحة التحكم الإدارية</h1>
          <p className="text-gray-600 font-[Tajawal]">تحكم في إعدادات التطبيق والهوية البصرية والروشتات الطبية</p>
        </div>
        <ThemeSwitcher variant="modal" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'branding'
            ? 'border-teal-600 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Palette size={20} />
          المظهر والهوية
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'prescription'
            ? 'border-teal-600 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <FileText size={20} />
          إعدادات الروشتة
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'profile'
            ? 'border-teal-600 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <User size={20} />
          الملف الشخصي
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'password'
            ? 'border-teal-600 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Lock size={20} />
          كلمة المرور
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'data'
            ? 'border-teal-600 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Database size={20} />
          إدارة البيانات
        </button>
      </div>

      {activeTab === 'branding' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">المظهر والهوية</h3>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">اسم العيادة</label>
                <input
                  type="text"
                  value={brandingFormData.clinic_name}
                  onChange={(e) => setBrandingFormData(prev => ({ ...prev, clinic_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                  placeholder="سيظهر في الشريط الجانبي وصفحة تسجيل الدخول"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">اللون الأساسي</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={brandingFormData.primary_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingFormData.primary_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="#2d5a6b"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">سيظهر في الأزرار والعناوين والروابط</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">اللون الثانوي</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={brandingFormData.secondary_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingFormData.secondary_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="#00838f"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">لون مكمل للهوية البصرية</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">لون التمييز</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={brandingFormData.accent_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingFormData.accent_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="#00bcd4"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">لون للعناصر البارزة</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">لون الخلفية</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={brandingFormData.background_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingFormData.background_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="#ffffff"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">خلفية التطبيق</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">لون النص</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={brandingFormData.text_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingFormData.text_color}
                    onChange={(e) => setBrandingFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="#1f2937"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">لون النصوص الرئيسية</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">خط العناوين</label>
                <select
                  value={brandingFormData.header_font}
                  onChange={(e) => setBrandingFormData(prev => ({ ...prev, header_font: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                >
                  <option value="Tajawal">تجهول</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">خط النصوص</label>
                <select
                  value={brandingFormData.body_font}
                  onChange={(e) => setBrandingFormData(prev => ({ ...prev, body_font: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                >
                  <option value="Tajawal">تجهول</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">شكل الأزرار</label>
                <select
                  value={brandingFormData.button_style}
                  onChange={(e) => setBrandingFormData(prev => ({ ...prev, button_style: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                >
                  <option value="rounded">دائرية</option>
                  <option value="square">مربعة</option>
                  <option value="pill">حبوية</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">شكل البطاقات</label>
                <select
                  value={brandingFormData.card_style}
                  onChange={(e) => setBrandingFormData(prev => ({ ...prev, card_style: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                >
                  <option value="shadow">مع ظل</option>
                  <option value="border">مع إطار</option>
                  <option value="minimal">بسيطة</option>
                </select>
              </div>

              <button
                onClick={handleBrandingSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
              >
                <Save size={18} />
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">شعار العيادة</h3>

              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                {logoPreview ? (
                  <div className="mb-4">
                    <img
                      src={logoPreview}
                      alt="Clinic logo"
                      className="w-40 h-40 rounded-lg mx-auto object-cover border-4 border-teal-600 mb-4"
                    />
                  </div>
                ) : (
                  <Palette size={64} className="mx-auto text-gray-400 mb-4" />
                )}

                <label className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg cursor-pointer font-[Tajawal] font-semibold transition-colors">
                  {logoUploadLoading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      اختر شعار
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploadLoading}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 mt-4 font-[Tajawal]">PNG, JPG حتى 10MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescription' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal] flex items-center gap-2">
            <FileText className="w-6 h-6" />
            إعدادات الروشتة الطبية
          </h3>

          <div className="space-y-8">
            {/* Content Settings Section */}
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 font-[Tajawal]">محتوى الروشتة</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">عنوان العيادة</label>
                  <textarea
                    value={prescriptionFormData.clinic_address}
                    onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, clinic_address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="سيظهر في الجزء السفلي من الروشتة المطبوعة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">رقم هاتف العيادة</label>
                  <input
                    type="tel"
                    value={prescriptionFormData.clinic_phone}
                    onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, clinic_phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="مثال: 201003418068"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">تعليمات الروشتة الافتراضية</label>
                  <textarea
                    value={prescriptionFormData.default_rx_notes}
                    onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, default_rx_notes: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                    placeholder="أدخل التعليمات الافتراضية التي ستظهر في كل روشتة..."
                  />
                  <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">ستظهر هذه التعليمات تلقائياً في جميع الروشتات الجديدة</p>
                </div>
              </div>
            </div>

            {/* Style Settings Section */}
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 font-[Tajawal] flex items-center gap-2">
                <Palette className="w-5 h-5" />
                ستايل وتصميم الروشتة
              </h4>

              {/* Template Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-[Tajawal]">قالب الروشتة</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'modern', name: 'عصري', icon: '🎨', desc: 'تصميم عصري بألوان متدرجة' },
                    { id: 'classic', name: 'كلاسيكي', icon: '📜', desc: 'تصميم تقليدي أنيق' },
                    { id: 'minimal', name: 'بسيط', icon: '⚪', desc: 'تصميم بسيط ونظيف' },
                    { id: 'elegant', name: 'أنيق', icon: '✨', desc: 'تصميم راقي ومميز' },
                  ].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setPrescriptionStyleData(prev => ({ ...prev, template_type: template.id as any }))}
                      className={`p-4 border-2 rounded-lg transition-all text-center ${
                        prescriptionStyleData.template_type === template.id
                          ? 'border-teal-600 bg-teal-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <div className="font-semibold text-sm font-[Tajawal]">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1 font-[Tajawal]">{template.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-[Tajawal]">ألوان الروشتة</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">اللون الأساسي</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={prescriptionStyleData.primary_color}
                        onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={prescriptionStyleData.primary_color}
                        onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">اللون الثانوي</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={prescriptionStyleData.secondary_color}
                        onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={prescriptionStyleData.secondary_color}
                        onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">لون التمييز</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={prescriptionStyleData.accent_color}
                        onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, accent_color: e.target.value }))}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={prescriptionStyleData.accent_color}
                        onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, accent_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header & Footer Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-[Tajawal]">نصوص الرأس والذيل</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">نص الرأس</label>
                    <input
                      type="text"
                      value={prescriptionStyleData.header_text}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, header_text: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[Tajawal]"
                      placeholder="مثال: عيادة متخصصة"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">نص الذيل</label>
                    <input
                      type="text"
                      value={prescriptionStyleData.footer_text}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, footer_text: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[Tajawal]"
                      placeholder="مثال: العنوان | الهاتف"
                    />
                  </div>
                </div>
              </div>

              {/* Font & Paper Settings */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-[Tajawal]">الخط وحجم الورقة</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">نوع الخط</label>
                    <select
                      value={prescriptionStyleData.font_family}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, font_family: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[Tajawal]"
                    >
                      <option value="tajawal">تجول (Tajawal)</option>
                      <option value="cairo">كايرو (Cairo)</option>
                      <option value="almarai">المرعي (Almarai)</option>
                      <option value="inter">إنتر (Inter)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">حجم الخط</label>
                    <select
                      value={prescriptionStyleData.font_size}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, font_size: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[Tajawal]"
                    >
                      <option value="small">صغير</option>
                      <option value="medium">متوسط</option>
                      <option value="large">كبير</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 font-[Tajawal]">حجم الورقة</label>
                    <select
                      value={prescriptionStyleData.paper_size}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, paper_size: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[Tajawal]"
                    >
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-[Tajawal]">خيارات العرض</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prescriptionStyleData.show_clinic_address}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, show_clinic_address: e.target.checked }))}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 font-[Tajawal]">إظهار عنوان العيادة</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prescriptionStyleData.show_clinic_phone}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, show_clinic_phone: e.target.checked }))}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 font-[Tajawal]">إظهار رقم هاتف العيادة</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prescriptionStyleData.show_doctor_signature}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, show_doctor_signature: e.target.checked }))}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 font-[Tajawal]">إظهار توقيع الطبيب</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prescriptionStyleData.show_watermark}
                      onChange={(e) => setPrescriptionStyleData(prev => ({ ...prev, show_watermark: e.target.checked }))}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 font-[Tajawal]">إظهار علامة مائية (Watermark)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-[Tajawal] flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>سيتم تطبيق هذه الإعدادات على جميع الروشتات الجديدة في النظام</span>
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handlePrescriptionSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
            >
              <Save size={18} />
              {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">بيانات الملف الشخصي</h3>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">الاسم</label>
                <input
                  type="text"
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={profileFormData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">الهاتف</label>
                <input
                  type="tel"
                  value={profileFormData.phone}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">التخصص</label>
                <input
                  type="text"
                  value={profileFormData.specialization}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
                />
              </div>

              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
              >
                <Save size={18} />
                {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">صورة الملف الشخصي</h3>

              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                {profileFormData.doctor_image ? (
                  <div className="mb-4">
                    <img
                      src={profileFormData.doctor_image}
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
                    onChange={handleDoctorImageUpload}
                    disabled={saving}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 mt-4 font-[Tajawal]">PNG, JPG حتى 10MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow-md p-8 max-w-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 font-[Tajawal]">
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



      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">إدارة البيانات</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-2 font-[Tajawal]">البيانات السحابية</h4>
            <p className="text-sm text-blue-800 font-[Tajawal]">
              جميع بيانات التطبيق مخزنة بشكل آمن في Supabase ويتم الوصول إليها عبر الإنترنت.
              يتم حفظ كل التغييرات مباشرة على السيرفر.
            </p>
          </div>
        </div>
      )}


    </div>

  );
};

export default Settings;
