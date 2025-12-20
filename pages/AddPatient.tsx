import React, { useState, useEffect } from 'react';
import { User, Phone, Stethoscope, Save, AlertCircle, Loader, Calendar, FileText } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface Doctor {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  age: string;
  phone: string;
  husband_name: string;
  history: string;
  doctor_id: string;
}

const AddPatient: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    phone: '',
    husband_name: '',
    history: '',
    doctor_id: ''
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setFetchingDoctors(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name')
        .eq('user_role', 'doctor')
        .order('name');

      if (error) throw error;

      setDoctors(data || []);
      if (!data || data.length === 0) {
        toast.error('No doctors available in the system');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch doctors:', error);
      toast.error(`Failed to load doctors: ${error.message}`);
      setDoctors([]);
    } finally {
      setFetchingDoctors(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Doctor selection is mandatory';
    }

    if (formData.age && isNaN(parseInt(formData.age))) {
      newErrors.age = 'Age must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Adding patient...');

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const payload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : 0,
        phone: formData.phone.trim(),
        husband_name: formData.husband_name.trim(),
        history: formData.history.trim(),
        doctor_id: formData.doctor_id,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success('Patient added successfully!', { id: toastId });
      setFormData({
        name: '',
        age: '',
        phone: '',
        husband_name: '',
        history: '',
        doctor_id: ''
      });
      setErrors({});
    } catch (error: any) {
      console.error('❌ Failed to add patient:', error);
      const errorMsg = error?.message || 'An error occurred while adding the patient';
      toast.error(`Failed to add patient: ${errorMsg}`, { id: toastId });
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
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 md:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">إضافة مريضة جديدة</h1>
          </div>
          <p className="text-gray-600">تسجيل مريضة جديدة وربطها بالطبيب المسؤول</p>
        </div>

        {/* Loading State */}
        {fetchingDoctors ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
            <p className="text-gray-600">جاري تحميل قائمة الأطباء...</p>
          </div>
        ) : (
          /* Form Card */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 md:px-8 py-6">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">بيانات المريضة</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* Alert for doctors not available */}
              {doctors.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">لا توجد أطباء متاحون</p>
                    <p className="text-sm text-red-700 mt-1">يجب أن يكون هناك طبيب واحد على الأقل مسجل في النظام</p>
                  </div>
                </div>
              )}

              {/* Name and Age Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المريضة <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="الاسم الكامل"
                      className={`w-full pr-12 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    السن
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="سنة"
                      min="0"
                      max="150"
                      className={`w-full pr-12 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.age && (
                    <p className="text-red-600 text-sm mt-1">{errors.age}</p>
                  )}
                </div>
              </div>

              {/* Phone and Husband Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="01xxxxxxxxx"
                      className={`w-full pr-12 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم الزوج
                  </label>
                  <input
                    type="text"
                    name="husband_name"
                    value={formData.husband_name}
                    onChange={handleInputChange}
                    placeholder="اسم الزوج"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Doctor Selection - CRITICAL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الطبيب المسؤول <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Stethoscope className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    className={`w-full pr-12 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white appearance-none ${
                      errors.doctor_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={loading || doctors.length === 0}
                  >
                    <option value="">-- اختر الطبيب المسؤول --</option>
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
                  ⚠️ يجب اختيار الطبيب الذي ستتابع المريضة معه
                </p>
              </div>

              {/* Medical History */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  السجل الطبي
                </label>
                <div className="relative">
                  <FileText className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                  <textarea
                    name="history"
                    value={formData.history}
                    onChange={handleInputChange}
                    placeholder="التاريخ الطبي، العمليات السابقة، الحساسيات، إلخ..."
                    rows={4}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || doctors.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-white transition-all shadow-lg ${
                    loading || doctors.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ المريضة
                    </>
                  )}
                </button>
              </div>

              {/* Info Message */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm text-teal-800">
                <p className="font-semibold mb-1">ملاحظة:</p>
                <ul className="list-disc list-inside space-y-1 text-teal-700">
                  <li>يجب ملء جميع الحقول المشار إليها بـ <span className="text-red-500">*</span></li>
                  <li>اختيار الطبيب المسؤول إلزامي لربط المريضة بملف الطبيب</li>
                  <li>سيتم حفظ البيانات بنجاح بعد الضغط على "حفظ المريضة"</li>
                </ul>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPatient;
