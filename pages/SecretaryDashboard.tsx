import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Plus, Search, Phone, User, History, ChevronDown } from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { appointmentsService } from '../services/appointmentsService';
import toast from 'react-hot-toast';

const SecretaryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients'>('appointments');
  const [secretary, setSecretary] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    visitType: 'Consultation' as const,
    notes: ''
  });

  useEffect(() => {
    loadSecretaryData();
  }, []);

  useEffect(() => {
    if (secretary) {
      loadAppointments();
      loadPatients();
    }
  }, [secretary, selectedDate]);

  const loadSecretaryData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const profile = await authService.getSecretaryProfile(user.id);
      if (profile) {
        setSecretary(profile);
      } else {
        toast.error('فشل تحميل بيانات السكرتيرة');
      }
    } catch (error: any) {
      console.error('Load secretary data error:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      if (!secretary?.id) return;
      const data = await appointmentsService.getAppointmentsBySecretary(secretary.id);
      setAppointments(data);
    } catch (error: any) {
      console.error('Load appointments error:', error);
    }
  };

  const loadPatients = async () => {
    try {
      if (!secretary?.secretary_doctor_id) return;
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', secretary.secretary_doctor_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPatients(data);
      } else if (error) {
        console.error('Load patients error:', error);
      }
    } catch (error: any) {
      console.error('Load patients error:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentForm.patientId || !appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const toastId = toast.loading('جاري إنشاء الموعد...');

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const appointmentDateTime = new Date(`${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`).toISOString();

      await appointmentsService.createAppointment({
        doctor_id: secretary.secretary_doctor_id,
        secretary_id: secretary.id,
        patient_id: appointmentForm.patientId,
        appointment_date: appointmentDateTime,
        status: 'Scheduled',
        visit_type: appointmentForm.visitType,
        notes: appointmentForm.notes,
        created_by: user.id
      });

      toast.success('تم إنشاء الموعد بنجاح', { id: toastId });
      setShowAppointmentForm(false);
      setAppointmentForm({
        patientId: '',
        appointmentDate: '',
        appointmentTime: '09:00',
        visitType: 'Consultation',
        notes: ''
      });
      loadAppointments();
    } catch (error: any) {
      toast.error(`فشل إنشاء الموعد: ${error.message}`, { id: toastId });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;

    const toastId = toast.loading('جاري الإلغاء...');

    try {
      await appointmentsService.cancelAppointment(appointmentId);
      toast.success('تم إلغاء الموعد', { id: toastId });
      loadAppointments();
    } catch (error: any) {
      toast.error('فشل إلغاء الموعد', { id: toastId });
    }
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.appointment_date) >= new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة السكرتيرة</h1>
            <p className="text-teal-100">إدارة المرضى والمواعيد</p>
          </div>
          <div className="text-4xl">📋</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">المواعيد القادمة</p>
              <p className="text-3xl font-bold text-teal-700 mt-2">{upcomingAppointments.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-teal-100" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">عدد المرضى</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{patients.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-100" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">الموعد القادم</p>
              <p className="text-lg font-bold text-purple-700 mt-2">
                {upcomingAppointments[0]
                  ? new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('ar-EG')
                  : 'لا توجد مواعيد'}
              </p>
            </div>
            <Clock className="w-12 h-12 text-purple-100" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'appointments'
                ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="inline w-5 h-5 ml-2" />
            المواعيد
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'patients'
                ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="inline w-5 h-5 ml-2" />
            المرضى
          </button>
        </div>

        <div className="p-6">
          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-900">المواعيد القادمة</h2>
                <button
                  onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  إضافة موعد جديد
                </button>
              </div>

              {/* Appointment Form */}
              {showAppointmentForm && (
                <form onSubmit={handleCreateAppointment} className="bg-teal-50 rounded-xl p-6 space-y-4 border border-teal-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        المريضة *
                      </label>
                      <select
                        value={appointmentForm.patientId}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
                        required
                      >
                        <option value="">-- اختر مريضة --</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name} ({patient.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        التاريخ *
                      </label>
                      <input
                        type="date"
                        value={appointmentForm.appointmentDate}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        الوقت *
                      </label>
                      <input
                        type="time"
                        value={appointmentForm.appointmentTime}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        نوع الزيارة
                      </label>
                      <select
                        value={appointmentForm.visitType}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, visitType: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="Consultation">استشارة</option>
                        <option value="Follow-up">متابعة</option>
                        <option value="Procedure">إجراء</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ملاحظات
                    </label>
                    <textarea
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none h-24"
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                    >
                      حفظ الموعد
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAppointmentForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* Appointments List */}
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {apt.patient?.name || 'مريضة'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <Phone className="inline w-4 h-4 ml-1" />
                            {apt.patient?.phone}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-teal-700">
                            {new Date(apt.appointment_date).toLocaleDateString('ar-EG')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'Scheduled'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'Waiting'
                              ? 'bg-yellow-100 text-yellow-800'
                              : apt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {apt.status === 'Scheduled' ? 'موعد مؤكد' : apt.status === 'Waiting' ? 'في الانتظار' : apt.status === 'Completed' ? 'مكتمل' : 'ملغى'}
                          </span>
                          <span className="ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {apt.visit_type === 'Consultation' ? 'استشارة' : apt.visit_type === 'Follow-up' ? 'متابعة' : 'إجراء'}
                          </span>
                        </div>
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-semibold transition-colors"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>

                      {apt.notes && (
                        <p className="text-sm text-gray-600 mt-3 border-t border-gray-100 pt-3">
                          <strong>ملاحظات:</strong> {apt.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد مواعيد قادمة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">قائمة المرضى</h2>
                <div className="relative">
                  <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div key={patient.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{patient.name}</h3>
                          <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                            <span>
                              <Phone className="inline w-4 h-4 ml-1" />
                              {patient.phone}
                            </span>
                            <span>
                              <User className="inline w-4 h-4 ml-1" />
                              العمر: {patient.age || '-'} سنة
                            </span>
                          </div>
                          {patient.husband_name && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>الزوج:</strong> {patient.husband_name}
                            </p>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500">
                            تاريخ التسجيل
                          </p>
                          <p className="text-sm font-semibold text-gray-700">
                            {new Date(patient.created_at).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      {patient.history && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                          <strong>السجل الطبي:</strong> {patient.history}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {searchQuery ? 'لم يتم العثور على مرضى' : 'لا توجد مرضى مسجلين'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecretaryDashboard;
