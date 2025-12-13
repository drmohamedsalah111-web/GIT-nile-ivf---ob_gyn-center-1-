import React, { useState, useEffect } from 'react';
import { User, Palette, FileText, Lock, Upload, Save, AlertCircle, CheckCircle, Facebook, MessageCircle, Loader, Database, RefreshCw, Wifi, WifiOff, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useBranding } from '../context/BrandingContext';
import { Doctor } from '../types';
import { powerSyncDb } from '../src/powersync/client';
import RefreshButton from '../components/RefreshButton';
import { useStatus } from '@powersync/react';
import { supabase } from '../services/supabaseClient';
import { connectPowerSync } from '../src/powersync/client';

interface SettingsProps {
  user: any;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const { branding, updateBranding, loading: brandingLoading } = useBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'prescription' | 'profile' | 'password' | 'data' | 'connection' | 'debug'>('branding');

  const [brandingFormData, setBrandingFormData] = useState({
    clinic_name: '',
    primary_color: '',
    logo_url: '' as string | null,
  });

  const [prescriptionFormData, setPrescriptionFormData] = useState({
    clinic_address: '',
    clinic_phone: '',
    default_rx_notes: '',
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
  const [hardResetLoading, setHardResetLoading] = useState(false);
  const [rowCounts, setRowCounts] = useState<Record<string, number | string>>({});
  
  // Connection status
  const powerSyncStatus = useStatus();
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    url: string;
    error?: string;
    user?: any;
  }>({ connected: false, url: '' });
  const [checkingConnection, setCheckingConnection] = useState(false);

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
        }
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error);
        toast.error('فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    checkConnections();
    if (import.meta.env.DEV) {
      fetchRowCounts();
    }
  }, [user]);

  const checkConnections = async () => {
    setCheckingConnection(true);
    try {
      // Check Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        setSupabaseStatus({
          connected: false,
          url: 'Not configured',
          error: 'VITE_SUPABASE_URL not found'
        });
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setSupabaseStatus({
            connected: false,
            url: supabaseUrl,
            error: sessionError?.message || 'No active session'
          });
        } else {
          // In PowerSync-only dev mode, Supabase is used ONLY for auth/token.
          // Do not query Supabase tables from the UI.
          setSupabaseStatus({
            connected: true,
            url: supabaseUrl,
            user: session.user
          });
        }
      }
    } catch (error: any) {
      setSupabaseStatus({
        connected: false,
        url: import.meta.env.VITE_SUPABASE_URL || 'Unknown',
        error: error?.message || 'Unknown error'
      });
    } finally {
      setCheckingConnection(false);
    }
  };

  const fetchRowCounts = async () => {
    const tables = ['patients', 'visits', 'clinical_stations', 'obstetrics', 'ivf_cycles', 'doctors'];
    const counts: Record<string, number | string> = {};
    for (const table of tables) {
      try {
        const result = await powerSyncDb.getOptional(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = result?.count || 0;
      } catch (e) {
        counts[table] = 'error';
      }
    }
    setRowCounts(counts);
  };

  const handleReconnectPowerSync = async () => {
    try {
      setCheckingConnection(true);
      toast.loading('جاري إعادة الاتصال...', { id: 'reconnect' });
      
      // Force reconnection
      await connectPowerSync({ force: true });
      
      // Wait a bit for status to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if connected now
      if (powerSyncStatus.connected) {
        toast.success('✅ تم الاتصال بنجاح!', { id: 'reconnect' });
      } else {
        toast.error('⚠️ فشل الاتصال - تحقق من Console للتفاصيل', { id: 'reconnect', duration: 5000 });
      }
    } catch (error: any) {
      console.error('❌ Reconnection error:', error);
      toast.error(`❌ فشل الاتصال: ${error?.message || 'خطأ غير معروف'}`, { id: 'reconnect', duration: 5000 });
    } finally {
      setCheckingConnection(false);
      // Refresh connection status
      setTimeout(() => checkConnections(), 2000);
    }
  };

  // Legacy sync stats effects removed

  useEffect(() => {
    if (branding) {
      setBrandingFormData({
        clinic_name: branding.clinic_name || '',
        primary_color: branding.primary_color || '#2d5a6b',
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
      await updateBranding({
        clinic_address: prescriptionFormData.clinic_address,
        clinic_phone: prescriptionFormData.clinic_phone,
        default_rx_notes: prescriptionFormData.default_rx_notes,
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

  const handleHardReset = async () => {
    const confirmed = window.confirm('⚠️ تحذير: سيتم حذف جميع البيانات المحلية وإعادة تحميلها من السيرفر. هل أنت متأكد؟');
    if (!confirmed) return;

    try {
      setHardResetLoading(true);
      toast.loading('جاري حذف قاعدة البيانات المحلية...', { id: 'hard-reset' });

      // TODO: Implement PowerSync database reset
      // await db.delete();

      toast.loading('جاري إعادة إنشاء قاعدة البيانات...', { id: 'hard-reset' });

      // TODO: Implement PowerSync database initialization
      // await initLocalDB();

      toast.loading('جاري تحميل البيانات من السيرفر...', { id: 'hard-reset' });

      // Disconnect to allow clean reconnection (data preserved for offline-first)
      await powerSyncDb.disconnect();

      toast.success('تم إعادة تحميل البيانات بنجاح! سيتم إعادة تحميل الصفحة...', { id: 'hard-reset' });

      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Hard reset error:', error);
      toast.error('فشل إعادة تحميل البيانات. تحقق من اتصال الإنترنت وحاول مرة أخرى.', { id: 'hard-reset' });
    } finally {
      setHardResetLoading(false);
    }
  };

  const handleClearLocalDB = async () => {
    const currentHost = window.location.host;
    const confirmed = window.confirm(
      `⚠️ تحذير: سيتم حذف جميع البيانات المحلية لهذا الموقع فقط (${currentHost}).\n\n` +
      'لن يؤثر على بيانات المواقع الأخرى أو الخادم. هل أنت متأكد؟'
    );
    if (!confirmed) return;

    try {
      setHardResetLoading(true);
      toast.loading('جاري حذف قاعدة البيانات المحلية...', { id: 'clear-db' });

      // Get all IndexedDB database names
      const dbs = await (window.indexedDB as any).databases?.() || [];
      
      // Delete PowerSync database
      const powerSyncDbNames = ['powersync', 'powersync.db'];
      for (const dbName of [...dbs.map((db: any) => db.name), ...powerSyncDbNames]) {
        try {
          await new Promise<void>((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          console.log(`✅ Deleted database: ${dbName}`);
        } catch (error) {
          console.warn(`⚠️ Could not delete database ${dbName}:`, error);
        }
      }

      // Clear LocalStorage for this origin
      localStorage.clear();
      console.log('✅ Cleared localStorage');

      // Clear SessionStorage for this origin
      sessionStorage.clear();
      console.log('✅ Cleared sessionStorage');

      toast.success('تم حذف البيانات المحلية بنجاح! سيتم إعادة تحميل الصفحة...', { id: 'clear-db' });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Clear local DB error:', error);
      toast.error('فشل حذف البيانات المحلية. قد تحتاج إلى إعادة فتح المتصفح.', { id: 'clear-db' });
    } finally {
      setHardResetLoading(false);
    }
  };

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
        <RefreshButton />
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
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'connection'
            ? 'border-teal-600 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Server size={20} />
          حالة الاتصال
        </button>
        {import.meta.env.DEV && (
          <button
            onClick={() => setActiveTab('debug')}
            className={`flex items-center gap-2 px-4 py-3 font-[Tajawal] font-semibold border-b-2 transition-colors ${activeTab === 'debug'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Database size={20} />
            Debug (DEV)
          </button>
        )}
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
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">إعدادات الروشتة الطبية</h3>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">عنوان العيادة</label>
            <textarea
              value={prescriptionFormData.clinic_address}
              onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, clinic_address: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
              placeholder="سيظهر في الجزء السفلي من الروشتة المطبوعة"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">رقم هاتف العيادة</label>
            <input
              type="tel"
              value={prescriptionFormData.clinic_phone}
              onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, clinic_phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
              placeholder="مثال: 201003418068"
            />
          </div>

          <div className="mb-6">
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

          <button
            onClick={handlePrescriptionSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
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

      {activeTab === 'connection' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 font-[Tajawal]">حالة الاتصال</h3>
            <button
              onClick={checkConnections}
              disabled={checkingConnection}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg font-[Tajawal] transition-colors"
            >
              <RefreshCw size={18} className={checkingConnection ? 'animate-spin' : ''} />
              تحديث
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Supabase Status */}
            <div className={`border-2 rounded-lg p-6 ${supabaseStatus.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 font-[Tajawal]">Supabase</h4>
                {supabaseStatus.connected ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 font-[Tajawal]">الحالة:</span>
                  <span className={`text-sm font-bold ${supabaseStatus.connected ? 'text-green-700' : 'text-red-700'} font-[Tajawal]`}>
                    {supabaseStatus.connected ? '✅ متصل' : '❌ غير متصل'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 font-[Tajawal]">الرابط:</span>
                  <span className="text-xs text-gray-600 font-mono break-all">{supabaseStatus.url}</span>
                </div>
                {supabaseStatus.user && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 font-[Tajawal]">المستخدم:</span>
                    <span className="text-sm text-gray-600">{supabaseStatus.user.email}</span>
                  </div>
                )}
                {supabaseStatus.error && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700 font-[Tajawal]">
                    {supabaseStatus.error}
                  </div>
                )}
              </div>
            </div>

            {/* PowerSync Status */}
            <div className={`border-2 rounded-lg p-6 ${powerSyncStatus.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 font-[Tajawal]">PowerSync</h4>
                {powerSyncStatus.connected ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 font-[Tajawal]">الحالة:</span>
                  <span className={`text-sm font-bold ${powerSyncStatus.connected ? 'text-green-700' : 'text-red-700'} font-[Tajawal]`}>
                    {powerSyncStatus.connected ? '✅ متصل' : powerSyncStatus.connecting ? '🔄 جاري الاتصال...' : '❌ غير متصل'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 font-[Tajawal]">الرابط:</span>
                  <span className="text-xs text-gray-600 font-mono break-all">
                    {import.meta.env.VITE_POWERSYNC_URL || 'Not configured'}
                  </span>
                </div>
                {powerSyncStatus.lastSyncedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 font-[Tajawal]">آخر مزامنة:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(powerSyncStatus.lastSyncedAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                )}
                {!powerSyncStatus.connected && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={handleReconnectPowerSync}
                      disabled={checkingConnection || powerSyncStatus.connecting}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-[Tajawal] transition-colors"
                    >
                      <RefreshCw size={16} className={checkingConnection ? 'animate-spin' : ''} />
                      {checkingConnection ? 'جاري الاتصال...' : 'إعادة الاتصال'}
                    </button>
                    <p className="text-xs text-gray-600 text-center font-[Tajawal]">
                      اضغط F12 وافتح Console لرؤية تفاصيل الخطأ
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`border-2 rounded-lg p-6 ${
            supabaseStatus.connected && powerSyncStatus.connected
              ? 'border-green-300 bg-green-50'
              : supabaseStatus.connected || powerSyncStatus.connected
              ? 'border-yellow-300 bg-yellow-50'
              : 'border-red-300 bg-red-50'
          }`}>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 font-[Tajawal]">الحالة العامة</h4>
            <p className={`text-sm font-[Tajawal] ${
              supabaseStatus.connected && powerSyncStatus.connected
                ? 'text-green-800'
                : supabaseStatus.connected || powerSyncStatus.connected
                ? 'text-yellow-800'
                : 'text-red-800'
            }`}>
              {supabaseStatus.connected && powerSyncStatus.connected
                ? '✅ جميع الاتصالات تعمل بشكل صحيح - البيانات متزامنة'
                : supabaseStatus.connected
                ? '⚠️ Supabase متصل، لكن PowerSync غير متصل'
                : powerSyncStatus.connected
                ? '⚠️ PowerSync متصل، لكن Supabase غير متصل'
                : '❌ جميع الاتصالات فاشلة - يرجى التحقق من الإعدادات'}
            </p>
          </div>

          {/* Environment Variables Check */}
          <div className="mt-6 border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 font-[Tajawal]">متغيرات البيئة</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 font-[Tajawal]">VITE_SUPABASE_URL:</span>
                <span className={`text-xs font-mono ${import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
                  {import.meta.env.VITE_SUPABASE_URL ? '✓ موجود' : '✗ غير موجود'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 font-[Tajawal]">VITE_SUPABASE_ANON_KEY:</span>
                <span className={`text-xs font-mono ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}`}>
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ موجود' : '✗ غير موجود'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 font-[Tajawal]">VITE_POWERSYNC_URL:</span>
                <span className={`text-xs font-mono ${import.meta.env.VITE_POWERSYNC_URL ? 'text-green-600' : 'text-red-600'}`}>
                  {import.meta.env.VITE_POWERSYNC_URL ? '✓ موجود' : '✗ غير موجود'}
                </span>
              </div>
            </div>
            
            {/* Troubleshooting Tips */}
            {!powerSyncStatus.connected && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="text-sm font-semibold text-yellow-900 mb-2 font-[Tajawal]">نصائح لحل المشكلة:</h5>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside font-[Tajawal]">
                  <li>تأكد من وجود جميع متغيرات البيئة في ملف .env</li>
                  <li>أعد تشغيل سيرفر التطوير بعد تعديل .env</li>
                  <li>تحقق من Console (F12) لرؤية تفاصيل الخطأ</li>
                  <li>تأكد من أن PowerSync URL صحيح من Dashboard</li>
                  <li>تأكد من أنك مسجل دخول بشكل صحيح</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">إدارة البيانات والمزامنة</h3>

          <div className="grid md:grid-cols-1 gap-8 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-2 font-[Tajawal]">حالة المزامنة</h4>
              <p className="text-sm text-blue-800 font-[Tajawal]">
                يتم مزامنة البيانات تلقائياً مع السيرفر باستخدام PowerSync.
                تعمل هذه التقنية في الخلفية لضمان توفر بياناتك دائماً، حتى بدون اتصال بالإنترنت.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 font-[Tajawal]">أدوات المطور</h4>
              <p className="text-sm text-gray-600 mb-4 font-[Tajawal]">
                استخدم هذه الأداة عندما تكون البيانات المحلية غير متزامنة مع السيرفر أو عند وجود مشاكل في العرض.
              </p>
              <button
                onClick={handleHardReset}
                disabled={hardResetLoading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
              >
                {hardResetLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    جاري إعادة التحميل...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    إعادة تحميل قاعدة البيانات (Hard Reset)
                  </>
                )}
              </button>
              <p className="text-xs text-red-600 mt-2 font-[Tajawal]">
                تحذير: سيتم حذف جميع البيانات المحلية وإعادة تحميلها من السيرفر
              </p>

              <button
                onClick={handleClearLocalDB}
                disabled={hardResetLoading}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors mt-4"
              >
                {hardResetLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    جاري المسح...
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    مسح البيانات المحلية فقط (لهذا الموقع)
                  </>
                )}
              </button>
              <p className="text-xs text-orange-600 mt-2 font-[Tajawal]">
                تحذير: سيتم حذف جميع البيانات المحلية لهذا الموقع فقط (IndexedDB, LocalStorage). لن يؤثر على الخادم أو مواقع أخرى.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'debug' && import.meta.env.DEV && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-[Tajawal]">Debug Panel (DEV Only)</h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* PowerSync Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 font-[Tajawal]">PowerSync Status</h4>
              <div className="space-y-1 text-sm">
                <div>Connected: {powerSyncStatus.connected ? 'Yes' : 'No'}</div>
                <div>Connecting: {powerSyncStatus.connecting ? 'Yes' : 'No'}</div>
                <div>Last Synced: {powerSyncStatus.lastSyncedAt ? new Date(powerSyncStatus.lastSyncedAt).toLocaleString() : 'Never'}</div>
              </div>
            </div>

            {/* Row Counts */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 font-[Tajawal]">Local Row Counts</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(rowCounts).map(([table, count]) => (
                  <div key={table}>{table}: {count}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-2 font-[Tajawal]">Profile</h4>
            <div className="text-sm">
              <div>Doctor ID: {doctor?.id}</div>
              <div>Clinic ID: Not available</div>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                await connectPowerSync({ force: true });
                toast.success('Force resync initiated');
              } catch (e) {
                toast.error('Force resync failed');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-[Tajawal] transition-colors"
          >
            Force Resync
          </button>
        </div>
      )}
    </div>

  );
};

export default Settings;
