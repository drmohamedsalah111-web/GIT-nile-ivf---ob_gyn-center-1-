import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Calendar, Clock, User, Phone, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface SimpleAppointmentSystemProps {
  doctorId: string;
  userRole: 'secretary' | 'doctor';
}

const SimpleAppointmentSystem: React.FC<SimpleAppointmentSystemProps> = ({ doctorId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [doctorId, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAppointments(), loadPatients()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      console.log(`🔍 Loading appointments for doctor ${doctorId} on date ${selectedDate}`);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', selectedDate)
        .order('appointment_time');

      if (error) throw error;

      console.log(`✅ Found ${data?.length || 0} appointments`);

      if (data && data.length > 0) {
        const patientIds = [...new Set(data.map(apt => apt.patient_id))];
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, name, phone')
          .in('id', patientIds);

        const patientsMap = new Map(patientsData?.map(p => [p.id, p]) || []);

        const formattedAppointments = data.map(apt => ({
          ...apt,
          patient_name: patientsMap.get(apt.patient_id)?.name || 'مريض غير معروف',
          patient_phone: patientsMap.get(apt.patient_id)?.phone || ''
        }));

        console.log(`✅ Formatted ${formattedAppointments.length} appointments with patient details`);
        setAppointments(formattedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading appointments:', error);
      toast.error('حدث خطأ في تحميل المواعيد');
      setAppointments([]);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone')
        .eq('doctor_id', doctorId)
        .order('name');

      if (error) {
        console.error('Error loading patients:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} patients for doctor ${doctorId}`);
      setPatients(data || []);
    } catch (error: any) {
      console.error('❌ Error loading patients:', error);
      toast.error('حدث خطأ في تحميل المرضى');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error('برجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (editingId) {
        const { error } = await supabase
          .from('appointments')
          .update({
            patient_id: formData.patient_id,
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            notes: formData.notes
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('تم تحديث الموعد بنجاح');
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([{
            doctor_id: doctorId,
            patient_id: formData.patient_id,
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            status: 'Scheduled',
            notes: formData.notes,
            created_by: user?.id || doctorId
          }]);

        if (error) throw error;
        toast.success('تم إضافة الموعد بنجاح');
      }

      closeModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.error('حدث خطأ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف الموعد');
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('حدث خطأ في الحذف');
    }
  };

  const openModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingId(appointment.id);
      setFormData({
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        notes: appointment.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        patient_id: '',
        appointment_date: selectedDate,
        appointment_time: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.patient_phone?.includes(searchTerm)
  );

  const todayStats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'Scheduled').length,
    completed: appointments.filter(a => a.status === 'Completed').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">المواعيد</h2>
            <p className="text-teal-100 mt-1">إدارة المواعيد اليومية</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-white text-teal-600 px-6 py-3 rounded-xl font-bold hover:bg-teal-50 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            موعد جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{todayStats.total}</div>
            <div className="text-sm text-teal-100">إجمالي المواعيد</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{todayStats.scheduled}</div>
            <div className="text-sm text-teal-100">قادم</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{todayStats.completed}</div>
            <div className="text-sm text-teal-100">مكتمل</div>
          </div>
        </div>
      </div>

      {/* Date Navigator & Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg font-bold text-center focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium"
            >
              اليوم
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-3 text-center text-gray-600 font-medium">
          {new Date(selectedDate).toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">لا توجد مواعيد لهذا اليوم</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              إضافة موعد جديد
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Time */}
                    <div className="bg-teal-100 rounded-xl p-3 text-center min-w-[80px]">
                      <Clock className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-teal-900">
                        {appointment.appointment_time}
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-bold text-lg text-gray-900">
                          {appointment.patient_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{appointment.patient_phone}</span>
                      </div>
                      {appointment.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {appointment.notes}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          appointment.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {appointment.status === 'Scheduled' && 'محجوز'}
                        {appointment.status === 'Completed' && 'مكتمل'}
                        {appointment.status === 'Cancelled' && 'ملغي'}
                        {appointment.status === 'Waiting' && 'في الانتظار'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mr-4">
                    <button
                      onClick={() => openModal(appointment)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                  {editingId ? 'تعديل موعد' : 'موعد جديد'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Patient */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المريض *
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                  required
                >
                  <option value="">اختر المريض</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الوقت *
                  </label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="ملاحظات إضافية (اختياري)"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAppointmentSystem;