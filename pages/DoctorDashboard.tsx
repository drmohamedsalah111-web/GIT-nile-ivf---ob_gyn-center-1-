import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, Calendar } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { patientService } from '../src/services/PatientService';
import SimpleAppointmentSystem from '../components/appointments/SimpleAppointmentSystem';
import EditPatientModal from '../src/components/patients/EditPatientModal';
import { Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientRow {
  id: string;
  name: string;
  age: number;
  phone: string;
  husband_name?: string;
}

const DoctorDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'appointments' | 'patients'>('appointments');
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);

  // Management State
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);

      const user = await authService.getCurrentUser();
      if (!user) {
        toast.error('الرجاء تسجيل الدخول');
        return;
      }

      const doctorRecord = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctorRecord) {
        toast.error('لم يتم العثور على ملف الطبيب');
        return;
      }

      setCurrentDoctorId(doctorRecord.id);
      await fetchPatients(doctorRecord.id);
    } catch (err: any) {
      console.error('Error initializing dashboard:', err);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, phone, husband_name')
        .eq('doctor_id', doctorId)
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setPatients([]);
    }
  };

  const handleDeletePatient = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المريضة "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    try {
      setIsDeleting(id);
      await patientService.deletePatient(id);
      toast.success('تم حذف المريضة بنجاح');
      if (currentDoctorId) {
        await fetchPatients(currentDoctorId);
      }
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-1">لوحة الطبيب 🩺</h1>
          <p className="text-gray-500 font-medium">إدارة المواعيد والمرضى</p>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveView('appointments')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeView === 'appointments'
              ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Calendar size={20} />
            المواعيد
          </button>
          <button
            onClick={() => setActiveView('patients')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeView === 'patients'
              ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Users size={20} />
            المرضى
          </button>
        </div>

        {/* Appointments View */}
        {activeView === 'appointments' && currentDoctorId && (
          <SimpleAppointmentSystem
            doctorId={currentDoctorId}
            userRole="doctor"
          />
        )}

        {/* Patients View */}
        {activeView === 'patients' && (
          <div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50">
                <Search className="text-gray-400 ml-3" size={20} />
                <input
                  className="bg-transparent w-full outline-none font-bold text-gray-700"
                  placeholder="بحث عن مريض..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Patients Table */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">لا يوجد مرضى</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 text-right font-bold text-gray-500 text-sm">الاسم</th>
                        <th className="p-4 text-right font-bold text-gray-500 text-sm">العمر</th>
                        <th className="p-4 text-right font-bold text-gray-500 text-sm">الهاتف</th>
                        <th className="p-4 text-right font-bold text-gray-500 text-sm">اسم الزوج</th>
                        <th className="p-4 text-center font-bold text-gray-500 text-sm">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPatients.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{p.name}</td>
                          <td className="p-4 text-gray-600">{p.age}</td>
                          <td className="p-4 text-gray-600 font-mono">{p.phone}</td>
                          <td className="p-4 text-gray-600">{p.husband_name || '-'}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPatient(p);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="تعديل"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeletePatient(p.id, p.name)}
                                disabled={isDeleting === p.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="حذف"
                              >
                                {isDeleting === p.id ? (
                                  <div className="size-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {selectedPatient && (
          <EditPatientModal
            patient={selectedPatient}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPatient(null);
            }}
            onUpdate={() => {
              if (currentDoctorId) {
                fetchPatients(currentDoctorId);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
