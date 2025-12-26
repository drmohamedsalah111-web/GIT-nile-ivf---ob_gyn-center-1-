import React, { useEffect, useState } from 'react';
import { Shield, Search, Loader, Building2, User, Mail, Phone, Edit, Trash2, Eye } from 'lucide-react';
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
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !currentStatus })
        .eq('id', clinicId);
      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل العيادة' : 'تم تفعيل العيادة');
      fetchClinics();
    } catch (err: any) {
      toast.error('فشل تحديث حالة العيادة');
    }
  };

  const filteredClinics = clinics.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-[Tajawal]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">إدارة العيادات</h1>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم أو إيميل أو هاتف..."
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-4 text-purple-700 font-bold">جاري تحميل العيادات...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md">
            <thead>
              <tr className="bg-purple-100 text-purple-800">
                <th className="py-3 px-4 text-right">اسم العيادة</th>
                <th className="py-3 px-4 text-right">التخصص</th>
                <th className="py-3 px-4 text-right">الإيميل</th>
                <th className="py-3 px-4 text-right">الهاتف</th>
                <th className="py-3 px-4 text-right">الدور</th>
                <th className="py-3 px-4 text-right">تاريخ الإنشاء</th>
                <th className="py-3 px-4 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد عيادات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="border-b hover:bg-purple-50 transition-all">
                    <td className="py-3 px-4 font-bold text-gray-800">{clinic.name}</td>
                    <td className="py-3 px-4">{clinic.specialization}</td>
                    <td className="py-3 px-4">{clinic.email}</td>
                    <td className="py-3 px-4">{clinic.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${clinic.user_role === 'admin' ? 'bg-purple-600 text-white' : clinic.user_role === 'doctor' ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {clinic.user_role === 'admin' ? 'أدمن' : clinic.user_role === 'doctor' ? 'طبيب' : 'سكرتيرة'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{new Date(clinic.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg px-3 py-1 flex items-center gap-1"
                        title="عرض التفاصيل"
                        onClick={() => setSelectedClinic(clinic)}
                      >
                        <Eye className="w-4 h-4" /> تفاصيل
                      </button>
                      <button
                        className={`${clinic.is_active !== false ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-green-100 hover:bg-green-200 text-green-700'} rounded-lg px-3 py-1 flex items-center gap-1`}
                        title={clinic.is_active !== false ? 'تعطيل' : 'تفعيل'}
                        onClick={() => handleToggleActive(clinic.id, clinic.is_active !== false)}
                      >
                        {clinic.is_active !== false ? '🔒 تعطيل' : '✅ تفعيل'}
                      </button>
                      <button
                        className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-3 py-1 flex items-center gap-1"
                        title="حذف"
                        onClick={() => handleDeleteClinic(clinic.id)}
                      >
                        <Trash2 className="w-4 h-4" /> حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
