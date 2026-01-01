import React, { useEffect, useState } from 'react';
import { Shield, Search, Loader, Building2, User, Mail, Phone, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  user_role: string;
  created_at: string;
  is_active?: boolean;
}

const ClinicsManagement: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClinics(data || []);
    } catch (err: any) {
      toast.error('فشل تحميل بيانات العيادات');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العيادة؟ سيتم حذف جميع البيانات المرتبطة بها!')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', clinicId);
      if (error) throw error;
      toast.success('تم حذف العيادة بنجاح');
      fetchClinics();
    } catch (err: any) {
      toast.error('فشل حذف العيادة: ' + err.message);
    }
  };

  const handleToggleActive = async (clinicId: string, currentStatus: boolean) => {
    const statusText = currentStatus ? 'تعطيل' : 'تفعيل';
    const confirmText = currentStatus 
      ? 'هل أنت متأكد من تعطيل هذه العيادة؟ لن يتمكن المستخدمون من تسجيل الدخول.'
      : 'هل تريد تفعيل هذه العيادة؟ سيتمكن المستخدمون من تسجيل الدخول والعمل.';
    
    if (!confirm(confirmText)) return;
    
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !currentStatus })
        .eq('id', clinicId);
      if (error) throw error;
      toast.success(`تم ${statusText} العيادة بنجاح`);
      fetchClinics();
    } catch (err: any) {
      toast.error(`فشل ${statusText} العيادة`);
    }
  };

  const filteredClinics = clinics.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-2xl">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">إدارة العيادات</h1>
                <p className="text-blue-100 text-sm">إدارة وتفعيل العيادات المسجلة في النظام</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Search className="w-5 h-5 text-white" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، الإيميل، أو الهاتف..."
                className="bg-transparent text-white placeholder-blue-200 outline-none w-64"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">عيادات نشطة</p>
                <p className="text-3xl font-black text-gray-800">
                  {filteredClinics.filter(c => c.is_active !== false).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">عيادات معطلة</p>
                <p className="text-3xl font-black text-gray-800">
                  {filteredClinics.filter(c => c.is_active === false).length}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">إجمالي العيادات</p>
                <p className="text-3xl font-black text-gray-800">{filteredClinics.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <span className="text-blue-700 font-bold">جاري تحميل العيادات...</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  <th className="py-4 px-6 text-right font-bold">الحالة</th>
                  <th className="py-4 px-6 text-right font-bold">اسم العيادة</th>
                  <th className="py-4 px-6 text-right font-bold">التخصص</th>
                  <th className="py-4 px-6 text-right font-bold">الإيميل</th>
                  <th className="py-4 px-6 text-right font-bold">الهاتف</th>
                  <th className="py-4 px-6 text-right font-bold">الدور</th>
                  <th className="py-4 px-6 text-right font-bold">تاريخ الإنشاء</th>
                  <th className="py-4 px-6 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-semibold">لا توجد عيادات مطابقة للبحث</p>
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map((clinic) => (
                    <tr key={clinic.id} className={`border-b hover:bg-blue-50 transition-all ${clinic.is_active === false ? 'bg-red-50' : ''}`}>
                      <td className="py-4 px-6">
                        {clinic.is_active !== false ? (
                          <span className="flex items-center gap-2 text-green-600 font-bold">
                            <CheckCircle className="w-5 h-5" />
                            نشط
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-600 font-bold">
                            <XCircle className="w-5 h-5" />
                            معطل
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-black text-gray-900">{clinic.name}</td>
                      <td className="py-4 px-6 text-gray-700">{clinic.specialization}</td>
                      <td className="py-4 px-6 text-gray-700">{clinic.email}</td>
                      <td className="py-4 px-6 text-gray-700">{clinic.phone}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          clinic.user_role === 'admin' ? 'bg-purple-600 text-white' : 
                          clinic.user_role === 'doctor' ? 'bg-teal-500 text-white' : 
                          'bg-gray-400 text-white'
                        }`}>
                          {clinic.user_role === 'admin' ? 'أدمن' : clinic.user_role === 'doctor' ? 'طبيب' : 'سكرتيرة'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(clinic.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg px-3 py-2 flex items-center gap-1 font-semibold transition-all"
                            title="عرض التفاصيل"
                            onClick={() => setSelectedClinic(clinic)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className={`${
                              clinic.is_active !== false 
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' 
                                : 'bg-green-100 hover:bg-green-200 text-green-700'
                            } rounded-lg px-3 py-2 flex items-center gap-1 font-semibold transition-all`}
                            title={clinic.is_active !== false ? 'تعطيل العيادة' : 'تفعيل العيادة'}
                            onClick={() => handleToggleActive(clinic.id, clinic.is_active !== false)}
                          >
                            {clinic.is_active !== false ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-3 py-2 flex items-center gap-1 font-semibold transition-all"
                            title="حذف العيادة"
                            onClick={() => handleDeleteClinic(clinic.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal لعرض تفاصيل العيادة */}
      {selectedClinic && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedClinic(null)}
            >
              <span className="text-xl">×</span>
            </button>
            <div className="flex items-center gap-4 mb-6">
              <Building2 className="w-10 h-10 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">{selectedClinic.name}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">التخصص:</span>
                <span>{selectedClinic.specialization}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">الإيميل:</span>
                <span>{selectedClinic.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">الهاتف:</span>
                <span>{selectedClinic.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">الدور:</span>
                <span>{selectedClinic.user_role === 'admin' ? 'أدمن' : selectedClinic.user_role === 'doctor' ? 'طبيب' : 'سكرتيرة'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">تاريخ الإنشاء:</span>
                <span>{new Date(selectedClinic.created_at).toLocaleString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicsManagement;
