import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, Clock, Stethoscope, Save, Loader, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  doctor_id: string;
}

interface Doctor {
  id: string;
  name: string;
}

interface AppointmentForm {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  notes: string;
}

const BookAppointment: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Partial<AppointmentForm>>({});

  const [formData, setFormData] = useState<AppointmentForm>({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '09:00',
    visit_type: 'Consultation',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      await Promise.all([fetchPatients(), fetchDoctors()]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setFetching(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, doctor_id')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const handlePatientChange = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    setFormData(prev => ({
      ...prev,
      patient_id: patientId,
      doctor_id: selectedPatient?.doctor_id || prev.doctor_id
    }));

    if (errors.patient_id) {
      setErrors(prev => ({ ...prev, patient_id: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AppointmentForm> = {};

    if (!formData.patient_id) {
      newErrors.patient_id = 'Patient selection is required';
    }
    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Doctor selection is required';
    }
    if (!formData.appointment_date) {
      newErrors.appointment_date = 'Appointment date is required';
    }
    if (!formData.visit_type) {
      newErrors.visit_type = 'Visit type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Booking appointment...');

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          appointment_date: appointmentDateTime.toISOString(),
          visit_type: formData.visit_type,
          notes: formData.notes,
          status: 'Scheduled',
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Appointment booked successfully!', { id: toastId });
      
      // Reset form
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '09:00',
        visit_type: 'Consultation',
        notes: ''
      });
      setErrors({});

    } catch (error: any) {
      console.error('❌ Failed to book appointment:', error);
      const errorMsg = error?.message || 'An error occurred while booking the appointment';
      toast.error(`Failed to book appointment: ${errorMsg}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof AppointmentForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading appointment booking form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 md:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">حجز موعد جديد</h1>
          </div>
          <p className="text-gray-600">حجز موعد لمريضة مع الطبيب المختص</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 md:px-8 py-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">بيانات الحجز</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                المريضة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">-- اختر المريضة --</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.patient_id && (
                <p className="text-red-600 text-sm mt-1">{errors.patient_id}</p>
              )}
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الطبيب <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={handleInputChange}
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">-- اختر الطبيب --</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      د. {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.doctor_id && (
                <p className="text-red-600 text-sm mt-1">{errors.doctor_id}</p>
              )}
              <p className="text-gray-600 text-sm mt-2">
                ⚠️ سيتم تعيين الطبيب المسؤول تلقائياً عند اختيار المريضة
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  التاريخ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleInputChange}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.appointment_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.appointment_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الوقت
                </label>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleInputChange}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="09:00">09:00 ص</option>
                    <option value="10:00">10:00 ص</option>
                    <option value="11:00">11:00 ص</option>
                    <option value="12:00">12:00 م</option>
                    <option value="13:00">01:00 م</option>
                    <option value="14:00">02:00 م</option>
                    <option value="15:00">03:00 م</option>
                    <option value="16:00">04:00 م</option>
                    <option value="17:00">05:00 م</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                نوع الزيارة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  name="visit_type"
                  value={formData.visit_type}
                  onChange={handleInputChange}
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="Consultation">استشارة</option>
                  <option value="New Visit">زيارة جديدة</option>
                  <option value="Follow-up">متابعة</option>
                </select>
              </div>
              {errors.visit_type && (
                <p className="text-red-600 text-sm mt-1">{errors.visit_type}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="ملاحظات إضافية حول الموعد..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حجز الموعد
                  </>
                )}
              </button>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">ملاحظة:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>يجب ملء جميع الحقول المشار إليها بـ <span className="text-red-500">*</span></li>
                <li>سيتم تعيين الطبيب المسؤول تلقائياً عند اختيار المريضة</li>
                <li>يمكن تغيير الطبيب يدوياً إذا لزم الأمر</li>
                <li>سيتم إرسال تأكيد الحجز بعد الضغط على "حجز الموعد"</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;