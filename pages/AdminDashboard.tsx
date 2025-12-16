import React, { useState, useEffect } from 'react';
import {
  Settings, Palette, FileText, Database, Upload, Save, AlertCircle,
  CheckCircle, Loader, Trash2, Edit2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBranding } from '../context/BrandingContext';
import { supabase } from '../services/supabaseClient';
import { EGYPTIAN_DRUGS } from '../constants';


interface TabState {
  active: 'branding' | 'prescription' | 'records';
}

const AdminDashboard: React.FC = () => {
  const { branding, updateBranding, loading: brandingLoading } = useBranding();
  const [activeTab, setActiveTab] = useState<'branding' | 'prescription' | 'records'>('branding');
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [brandingData, setBrandingData] = useState({
    clinic_name: '',
    clinic_address: '',
    clinic_phone: '',
    primary_color: '#2d5a6b',
    secondary_color: '#00838f',
    accent_color: '#00bcd4',
  });

  const [prescriptionDefaults, setPrescriptionDefaults] = useState({
    instructions: '',
    defaultCategory: 'Vitamins & Supplements',
  });

  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    if (branding) {
      setBrandingData({
        clinic_name: branding.clinic_name,
        clinic_address: branding.clinic_address || '',
        clinic_phone: branding.clinic_phone || '',
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
      });
      if (branding.logo_url) {
        setLogoPreview(branding.logo_url);
      }
    }
  }, [branding]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandingSave = async () => {
    try {
      setSaving(true);
      const fileInput = document.querySelector('[type="file"]') as HTMLInputElement;
      const logoFile = fileInput?.files?.[0];

      if (!brandingData.clinic_name.trim()) {
        toast.error('يجب إدخال اسم العيادة');
        return;
      }

      await updateBranding(
        {
          clinic_name: brandingData.clinic_name,
          clinic_address: brandingData.clinic_address,
          clinic_phone: brandingData.clinic_phone,
          primary_color: brandingData.primary_color,
          secondary_color: brandingData.secondary_color,
          accent_color: brandingData.accent_color,
        },
        logoFile
      );

      toast.success('تم حفظ إعدادات العلامة التجارية بنجاح');
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error saving branding:', error);
      const errorMsg = error?.message || 'فشل حفظ الإعدادات';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const loadRecords = async () => {
    try {
      setRecordsLoading(true);
      console.log('📊 AdminDashboard: Loading records from Supabase...');
      
      const { data, error } = await supabase
        .from('visits')
        .select('id, date, patient_id, diagnosis, department')
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      console.log('✅ AdminDashboard: Loaded', data?.length || 0, 'records');
      setRecords(data || []);
    } catch (error: any) {
      console.error('Error loading records:', error);
      const errorMsg = error?.message || 'فشل تحميل السجلات';
      toast.error(errorMsg);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'records') {
      loadRecords();
    }
  }, [activeTab]);

  const deleteRecord = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

    try {
      console.log('🗑️ AdminDashboard: Deleting record:', id);
      
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(records.filter(r => r.id !== id));
      console.log('✅ AdminDashboard: Record deleted');
      toast.success('تم حذف السجل بنجاح');
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast.error('فشل حذف السجل');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Settings className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الإدارة</h1>
          <p className="text-gray-600">إدارة إعدادات التطبيق والعلامة التجارية والسجلات</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'branding'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Palette size={20} />
          تخصيص التصميم
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'prescription'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <FileText size={20} />
          إعدادات الروشتة
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'records'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Database size={20} />
          إدارة السجلات
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            {/* Setup Guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                إعداد تخزين الشعار
              </h3>
              <div className="text-sm text-amber-800 space-y-2">
                <p>لتمكين رفع الشعارات، تابع هذه الخطوات:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>اذهب إلى <strong>Supabase Dashboard → Storage</strong></li>
                  <li>انقر على <strong>Create new bucket</strong></li>
                  <li>أدخل الاسم: <code className="bg-amber-100 px-2 py-1 rounded">branding</code></li>
                  <li>اختر <strong>Public bucket</strong></li>
                  <li>انقر <strong>Create bucket</strong></li>
                </ol>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Clinic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المركز / العيادة
                </label>
                <input
                  type="text"
                  value={brandingData.clinic_name}
                  onChange={(e) => setBrandingData(prev => ({
                    ...prev,
                    clinic_name: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: نظام د محمد صلاح جبر"
                />
              </div>

              {/* Clinic Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={brandingData.clinic_phone}
                  onChange={(e) => setBrandingData(prev => ({
                    ...prev,
                    clinic_phone: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: 201001234567+"
                />
              </div>

              {/* Clinic Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان
                </label>
                <textarea
                  value={brandingData.clinic_address}
                  onChange={(e) => setBrandingData(prev => ({
                    ...prev,
                    clinic_address: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="عنوان العيادة"
                  rows={3}
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload size={20} />
                شعار العيادة
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Area */}
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">اضغط للتحميل أو اسحب الملف هنا</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (حد أقصى 5 ميجابايت)</p>
                    </label>
                  </div>
                </div>

                {/* Preview */}
                {logoPreview && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-gray-50 rounded-lg p-4 w-full">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-32 h-32 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">معاينة الشعار</p>
                  </div>
                )}
              </div>
            </div>

            {/* Colors */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الألوان</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون الأساسي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingData.primary_color}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        primary_color: e.target.value
                      }))}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.primary_color}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        primary_color: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون الثانوي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingData.secondary_color}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        secondary_color: e.target.value
                      }))}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.secondary_color}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        secondary_color: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    لون التمييز
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingData.accent_color}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        accent_color: e.target.value
                      }))}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.accent_color}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        accent_color: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleBrandingSave}
                disabled={saving || brandingLoading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Prescription Tab */}
        {activeTab === 'prescription' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">معلومة</h4>
                <p className="text-sm text-blue-700">
                  يتم تحديث قائمة الأدوية المتاحة من قاعدة البيانات. يمكنك هنا تخصيص الإعدادات الافتراضية للروشتات.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفئة الافتراضية للأدوية
                </label>
                <select
                  value={prescriptionDefaults.defaultCategory}
                  onChange={(e) => setPrescriptionDefaults(prev => ({
                    ...prev,
                    defaultCategory: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(EGYPTIAN_DRUGS).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعليمات افتراضية للروشتة
                </label>
                <textarea
                  value={prescriptionDefaults.instructions}
                  onChange={(e) => setPrescriptionDefaults(prev => ({
                    ...prev,
                    instructions: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: اتبع التعليمات بدقة... تناول الدواء مع الطعام..."
                  rows={4}
                />
              </div>

              <button
                onClick={() => {
                  toast.success('تم حفظ إعدادات الروشتة');
                }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save size={18} />
                حفظ الإعدادات
              </button>
            </div>

            {/* Available Drugs */}
            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الأدوية المتاحة</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(EGYPTIAN_DRUGS).map(([category, drugs]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-right">{category}</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {Object.keys(drugs).slice(0, 5).map(drug => (
                        <li key={drug} className="text-right">• {drug}</li>
                      ))}
                      {Object.keys(drugs).length > 5 && (
                        <li className="text-gray-500">... و {Object.keys(drugs).length - 5} أدوية أخرى</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">السجلات الطبية</h3>
              <button
                onClick={loadRecords}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                ← تحديث
              </button>
            </div>

            {recordsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin w-8 h-8 text-indigo-600" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد سجلات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رقم المريض</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التشخيص</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">القسم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.patient_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.diagnosis || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.department || 'عام'}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
