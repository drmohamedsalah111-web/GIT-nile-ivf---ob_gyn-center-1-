// ============================================================================
// 📋 RECEPTION DASHBOARD - SIMPLIFIED & SMART
// لوحة الاستقبال - مبسطة وذكية
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, Users, Phone, 
  RefreshCw, UserPlus, Plus, Search, X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentService } from '../services/appointmentService';
import { supabase } from '../../services/supabaseClient';

interface Patient {
  id: string;
  name: string;
  phone: string;
  national_id?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  visit_type: string;
  patient_id: string;
  patients?: Patient;
}

const ReceptionDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00',
    visit_type: 'Consultation',
    notes: ''
  });

  // إحصائيات بسيطة
  const stats = {
    total: appointments.length,
    waiting: appointments.filter(a => a.status === 'Waiting' || a.status === 'Scheduled').length,
    completed: appointments.filter(a => a.status === 'Completed').length
  };

  const loadTodayAppointments = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      console.log('Loading appointments for:', startOfDay, 'to', endOfDay);
      
      // Get today's appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw appointmentsError;
      }
      
      console.log('Found appointments:', appointmentsData?.length || 0);
      
      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Get unique patient IDs
      const patientIds = [...new Set(appointmentsData.map(a => a.patient_id).filter(Boolean))];
      
      if (patientIds.length === 0) {
        console.log('No patient IDs found');
        setAppointments(appointmentsData);
        return;
      }
      
      // Fetch patient details
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, name, phone, national_id')
        .in('id', patientIds);

      if (patientsError) {
        console.error('Patients error:', patientsError);
        setAppointments(appointmentsData);
        return;
      }

      // Map patient data to appointments
      const patientsMap = new Map(patientsData?.map(p => [p.id, p]) || []);
      const enrichedAppointments = appointmentsData.map(apt => ({
        ...apt,
        patients: patientsMap.get(apt.patient_id)
      }));
      
      console.log('Loaded appointments with patients:', enrichedAppointments);
      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('فشل تحميل المواعيد');
      setAppointments([]); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayAppointments();
    loadPatients();
    loadDoctors();
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(loadTodayAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name')
        .eq('user_role', 'doctor')
        .order('name');
      
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentForm.patient_id || !appointmentForm.doctor_id) {
      toast.error('يرجى اختيار المريض والطبيب');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('جاري حجز الموعد...');

    try {
      const appointmentDateTime = `${appointmentForm.appointment_date}T${appointmentForm.appointment_time}:00`;

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: appointmentForm.patient_id,
          doctor_id: appointmentForm.doctor_id,
          appointment_date: appointmentDateTime,
          appointment_time: appointmentForm.appointment_time,
          visit_type: appointmentForm.visit_type,
          notes: appointmentForm.notes,
          status: 'Scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم حجز الموعد بنجاح ✓', { id: toastId });
      setShowNewModal(false);
      setAppointmentForm({
        patient_id: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00',
        visit_type: 'Consultation',
        notes: ''
      });
      loadTodayAppointments();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(`فشل حجز الموعد: ${error.message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      
      const messages: Record<string, string> = {
        'Waiting': 'تم تسجيل الحضور ✓',
        'Completed': 'تم إنهاء الكشف ✓',
        'Cancelled': 'تم الإلغاء'
      };
      
      toast.success(messages[newStatus] || 'تم التحديث');
      loadTodayAppointments();
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      apt.patients?.name?.toLowerCase().includes(search) ||
      apt.patients?.phone?.includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Scheduled': 'bg-blue-100 text-blue-700',
      'Waiting': 'bg-amber-100 text-amber-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'Scheduled': 'محجوز',
      'Waiting': 'في الانتظار',
      'Completed': 'تم',
      'Cancelled': 'ملغي'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">استقبال العيادة</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('ar-EG', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          <button
            onClick={loadTodayAppointments}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* إحصائيات بسيطة */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">المواعيد</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-gray-600">في الانتظار</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.waiting}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">مكتملة</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* البحث والإجراءات */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم التليفون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            موعد جديد
          </button>
        </div>
      </div>

      {/* قائمة المواعيد */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            مواعيد اليوم ({filteredAppointments.length})
          </h2>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد مواعيد اليوم'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* معلومات المريض */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {apt.patients?.name || 'مريض غير معروف'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {apt.patients?.phone || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {apt.appointment_time || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* الحالة والإجراءات */}
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>

                    {/* أزرار الإجراءات */}
                    {apt.status === 'Scheduled' && (
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'Waiting')}
                        className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                      >
                        تسجيل حضور
                      </button>
                    )}

                    {apt.status === 'Waiting' && (
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'Completed')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                      >
                        إنهاء
                      </button>
                    )}

                    {(apt.status === 'Scheduled' || apt.status === 'Waiting') && (
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'Cancelled')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال موعد جديد */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">حجز موعد جديد</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitAppointment} className="p-6 space-y-4">
              {/* اختيار المريض */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المريض <span className="text-red-500">*</span>
                </label>
                <select
                  value={appointmentForm.patient_id}
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === e.target.value);
                    setAppointmentForm(prev => ({
                      ...prev,
                      patient_id: e.target.value
                    }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">-- اختر المريض --</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* اختيار الطبيب */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الطبيب <span className="text-red-500">*</span>
                </label>
                <select
                  value={appointmentForm.doctor_id}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">-- اختر الطبيب --</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* التاريخ والوقت */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الوقت <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={appointmentForm.appointment_time}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="09:00">09:00 صباحاً</option>
                    <option value="10:00">10:00 صباحاً</option>
                    <option value="11:00">11:00 صباحاً</option>
                    <option value="12:00">12:00 ظهراً</option>
                    <option value="13:00">01:00 مساءً</option>
                    <option value="14:00">02:00 مساءً</option>
                    <option value="15:00">03:00 مساءً</option>
                    <option value="16:00">04:00 مساءً</option>
                    <option value="17:00">05:00 مساءً</option>
                    <option value="18:00">06:00 مساءً</option>
                    <option value="19:00">07:00 مساءً</option>
                    <option value="20:00">08:00 مساءً</option>
                  </select>
                </div>
              </div>

              {/* نوع الزيارة */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نوع الزيارة
                </label>
                <select
                  value={appointmentForm.visit_type}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, visit_type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Consultation">استشارة</option>
                  <option value="Follow-up">متابعة</option>
                  <option value="New Visit">زيارة جديدة</option>
                  <option value="Emergency">طوارئ</option>
                </select>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              {/* أزرار */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:bg-gray-400"
                >
                  {submitting ? 'جاري الحجز...' : 'حجز الموعد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;
