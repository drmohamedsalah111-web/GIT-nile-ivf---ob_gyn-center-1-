// ============================================================================
// 👤 PATIENT PROFILE - ملف المريض الشامل الذكي
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Calendar, Mail, MapPin, FileText, 
  Heart, Activity, ClipboardList, AlertCircle, Printer,
  Edit, Save, X, Plus, Clock, Baby, Syringe, TestTube,
  TrendingUp, History, Pill, Stethoscope, FileHeart,
  Microscope, Droplet, Weight, Ruler, HeartPulse
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  national_id?: string;
  address?: string;
  email?: string;
  blood_type?: string;
  husband_name?: string;
  medical_history?: any;
  created_at?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  visit_type: string;
  notes?: string;
}

interface Visit {
  id: string;
  visit_date: string;
  diagnosis?: string;
  notes?: string;
  treatment?: string;
  clinical_data?: any;
}

interface Cycle {
  id: string;
  cycle_number?: number;
  start_date?: string;
  status?: string;
  protocol?: string;
  outcome?: string;
}

interface Pregnancy {
  id: string;
  conception_date?: string;
  edd?: string;
  status?: string;
  outcome?: string;
}

const PatientProfile: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Loaded patients:', data?.length || 0);
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('فشل تحميل المرضى');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      setDataLoading(true);
      
      // Load Appointments with error handling
      const appointmentsPromise = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(res => ({ data: res.data || [], error: res.error }));
      
      // Load Visits with error handling  
      const visitsPromise = supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(res => ({ data: res.data || [], error: res.error }));
      
      // Load IVF Cycles with error handling
      const cyclesPromise = supabase
        .from('ivf_cycles')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .then(res => ({ data: res.data || [], error: res.error }));
      
      // Load Pregnancies/Antenatal Records with error handling
      const pregnanciesPromise = supabase
        .from('antenatal_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .then(res => ({ data: res.data || [], error: res.error }));

      const [appointmentsData, visitsData, cyclesData, pregnanciesData] = await Promise.all([
        appointmentsPromise,
        visitsPromise,
        cyclesPromise,
        pregnanciesPromise
      ]);

      // Set data with error logging
      if (appointmentsData.error) console.warn('Appointments error:', appointmentsData.error.message);
      if (visitsData.error) console.warn('Visits error:', visitsData.error.message);
      if (cyclesData.error) console.warn('Cycles error:', cyclesData.error.message);
      if (pregnanciesData.error) console.warn('Pregnancies error:', pregnanciesData.error.message);

      setAppointments(appointmentsData.data);
      setVisits(visitsData.data);
      setCycles(cyclesData.data);
      setPregnancies(pregnanciesData.data);

      console.log('Patient data loaded:', {
        appointments: appointmentsData.data.length,
        visits: visitsData.data.length,
        cycles: cyclesData.data.length,
        pregnancies: pregnanciesData.data.length
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('فشل تحميل بعض البيانات');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setAppointments([]);
    setVisits([]);
    setCycles([]);
    setPregnancies([]);
    loadPatientData(patient.id);
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.national_id?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <User className="w-8 h-8 text-teal-600" />
              ملفات المرضى
            </h1>
            <p className="text-gray-500 mt-1">إدارة وعرض السجلات الطبية الشاملة</p>
          </div>
          <div className="text-3xl font-bold text-teal-600">
            {patients.length}
            <span className="text-sm text-gray-500 mr-2">مريض</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Patients List - Left Side */}
        <div className="col-span-4 bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="ابحث بالاسم، التليفون، أو الرقم القومي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد نتائج</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`w-full text-right p-4 rounded-lg border-2 transition-all ${
                    selectedPatient?.id === patient.id
                      ? 'bg-teal-50 border-teal-500'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{patient.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                        {patient.age && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {patient.age} سنة
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0 mr-2"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Patient Details - Right Side */}
        <div className="col-span-8">
          {!selectedPatient ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">اختر مريض</h3>
              <p className="text-gray-500">اختر مريض من القائمة لعرض ملفه الطبي الشامل</p>
            </div>
          ) : dataLoading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient Header Card - Enhanced */}
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <User className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{selectedPatient.name}</h2>
                      {selectedPatient.husband_name && (
                        <p className="text-white/90 mb-3">زوج: {selectedPatient.husband_name}</p>
                      )}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {selectedPatient.phone}
                        </div>
                        {selectedPatient.age && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {selectedPatient.age} سنة
                          </div>
                        )}
                        {selectedPatient.national_id && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {selectedPatient.national_id}
                          </div>
                        )}
                        {selectedPatient.blood_type && (
                          <div className="flex items-center gap-2">
                            <Droplet className="w-4 h-4" />
                            {selectedPatient.blood_type}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{appointments.length}</div>
                    <div className="text-xs text-white/80">مواعيد</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{visits.length}</div>
                    <div className="text-xs text-white/80">زيارات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{cycles.length}</div>
                    <div className="text-xs text-white/80">دورات IVF</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{pregnancies.length}</div>
                    <div className="text-xs text-white/80">حمل</div>
                  </div>
                </div>
              </div>

              {/* IVF Cycles Section */}
              {cycles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Baby className="w-6 h-6 text-purple-600" />
                      دورات التلقيح الصناعي
                    </h3>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      {cycles.length} دورة
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {cycles.map((cycle) => (
                      <div
                        key={cycle.id}
                        className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg mb-1">
                              الدورة #{cycle.cycle_number || '؟'}
                            </h4>
                            {cycle.start_date && (
                              <p className="text-sm text-gray-600">
                                بداية: {new Date(cycle.start_date).toLocaleDateString('ar-EG')}
                              </p>
                            )}
                            {cycle.created_at && !cycle.start_date && (
                              <p className="text-sm text-gray-600">
                                تاريخ الإنشاء: {new Date(cycle.created_at).toLocaleDateString('ar-EG')}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              cycle.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : cycle.status === 'active'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {cycle.status || 'غير محدد'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {cycle.protocol && (
                            <div className="flex items-center gap-2">
                              <Syringe className="w-4 h-4 text-purple-600" />
                              <span className="text-gray-700">البروتوكول: {cycle.protocol}</span>
                            </div>
                          )}
                          {cycle.outcome && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                              <span className="text-gray-700">النتيجة: {cycle.outcome}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pregnancies Section */}
              {pregnancies.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-pink-600" />
                      سجل الحمل
                    </h3>
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-bold">
                      {pregnancies.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pregnancies.map((preg) => (
                      <div
                        key={preg.id}
                        className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                              <Heart className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              {preg.conception_date && (
                                <p className="font-bold text-gray-800">
                                  بداية الحمل: {new Date(preg.conception_date).toLocaleDateString('ar-EG')}
                                </p>
                              )}
                              {preg.lmp && !preg.conception_date && (
                                <p className="font-bold text-gray-800">
                                  آخر دورة: {new Date(preg.lmp).toLocaleDateString('ar-EG')}
                                </p>
                              )}
                              {preg.edd && (
                                <p className="text-sm text-gray-600">
                                  الموعد المتوقع: {new Date(preg.edd).toLocaleDateString('ar-EG')}
                                </p>
                              )}
                              {!preg.conception_date && !preg.lmp && preg.created_at && (
                                <p className="font-bold text-gray-800">
                                  تاريخ التسجيل: {new Date(preg.created_at).toLocaleDateString('ar-EG')}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              preg.status === 'ongoing'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {preg.status || 'منتهي'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Visits */}
              {visits.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                      الزيارات الطبية
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      {visits.length} زيارة
                    </span>
                  </div>
                  <div className="space-y-3">
                    {visits.slice(0, 5).map((visit) => (
                      <div
                        key={visit.id}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-bold text-gray-800">
                                {new Date(visit.visit_date || visit.created_at).toLocaleDateString('ar-EG', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'long'
                                })}
                              </p>
                              {visit.diagnosis && (
                                <p className="text-sm text-gray-600 mt-1">التشخيص: {visit.diagnosis}</p>
                              )}
                              {visit.chief_complaint && !visit.diagnosis && (
                                <p className="text-sm text-gray-600 mt-1">الشكوى: {visit.chief_complaint}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {visit.notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-blue-100">
                            {visit.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments History */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-teal-600" />
                    سجل المواعيد
                  </h3>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-bold">
                    {appointments.length}
                  </span>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد مواعيد مسجلة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 10).map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-teal-600" />
                          </div> || apt.created_at).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">{apt.visit_type || 'استشارة'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">{apt.visit_type}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            apt.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : apt.status === 'Cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {apt.status === 'Completed' && 'تم'}
                          {apt.status === 'Scheduled' && 'محجوز'}
                          {apt.status === 'Cancelled' && 'ملغي'}
                          {apt.status === 'Waiting' && 'انتظار'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Empty State */}
              {appointments.length === 0 && visits.length === 0 && cycles.length === 0 && pregnancies.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <FileHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد بيانات طبية</h3>
                  <p className="text-gray-500 mb-4">لم يتم تسجيل أي بيانات طبية لهذا المريض بعد</p>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    إضافة أول سجل
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
