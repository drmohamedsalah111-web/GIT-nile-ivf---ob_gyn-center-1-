import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  User, Phone, Calendar, Heart, Activity, Pill, FileText,
  AlertCircle, Clock, ChevronRight, Plus, Edit2, X, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientProfileProps {
  patientId: string;
  onClose?: () => void;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  husband_name?: string;
  address?: string;
  medical_history?: string;
  created_at: string;
}

interface Visit {
  id: string;
  patient_id: string;
  doctor_id?: string;
  date: string;
  department?: string;
  diagnosis?: string;
  prescription?: any; // JSONB array
  notes?: string;
  clinical_data?: any; // JSONB
  created_at: string;
}

interface PrescriptionItem {
  drug: string;
  dose?: string;
  category?: string;
}

interface LabRequest {
  id: string;
  test_name: string;
  status: string;
  request_date: string;
  result?: string;
  notes?: string;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<Array<{ visitDate: string; items: PrescriptionItem[] }>>([]);
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'prescriptions' | 'labs'>('overview');

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPatient(),
        loadVisits(),
        loadPrescriptions(),
        loadLabRequests()
      ]);
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('حدث خطأ في تحميل بيانات المريض');
    } finally {
      setLoading(false);
    }
  };

  const loadPatient = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) throw error;
    setPatient(data);
  };

  const loadVisits = async () => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .limit(50);

    if (error) throw error;
    setVisits(data || []);
  };

  const loadPrescriptions = async () => {
    // استخراج الأدوية من جميع الزيارات
    const { data, error } = await supabase
      .from('visits')
      .select('date, prescription')
      .eq('patient_id', patientId)
      .not('prescription', 'is', null)
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading prescriptions:', error);
      setAllPrescriptions([]);
      return;
    }

    // تحويل البيانات لصيغة قابلة للعرض
    const prescriptions = (data || [])
      .filter(v => v.prescription && Array.isArray(v.prescription) && v.prescription.length > 0)
      .map(v => ({
        visitDate: v.date,
        items: v.prescription
      }));

    setAllPrescriptions(prescriptions);
  };

  const loadLabRequests = async () => {
    const { data, error } = await supabase
      .from('lab_requests')
      .select('*')
      .eq('patient_id', patientId)
      .order('request_date', { ascending: false })
      .limit(20);

    if (error) throw error;
    setLabRequests(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">لم يتم العثور على المريض</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              رجوع
            </button>
          )}
        </div>
      </div>
    );
  }

  const lastVisit = visits[0];
  const recentPrescriptions = allPrescriptions.slice(0, 3);
  const totalPrescriptionItems = allPrescriptions.reduce((sum, p) => sum + p.items.length, 0);
  const pendingLabs = labRequests.filter(lab => lab.status === 'Pending');

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">رجوع</span>
          </button>

          <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{patient.name}</h1>
                  <div className="flex flex-wrap gap-4 text-teal-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{patient.age} سنة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span dir="ltr">{patient.phone}</span>
                    </div>
                    {patient.husband_name && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>الزوج: {patient.husband_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الزيارات</p>
                <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الأدوية</p>
                <p className="text-2xl font-bold text-gray-900">{totalPrescriptionItems}</p>
              </div>
              <Pill className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">تحاليل معلقة</p>
                <p className="text-2xl font-bold text-gray-900">{pendingLabs.length}</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">آخر زيارة</p>
                <p className="text-sm font-bold text-gray-900">
                  {lastVisit ? new Date(lastVisit.date).toLocaleDateString('ar-EG') : 'لا توجد'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: User },
            { id: 'visits', label: 'الزيارات', icon: Activity },
            { id: 'prescriptions', label: 'العلاجات', icon: Pill },
            { id: 'labs', label: 'التحاليل', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-teal-600" />
                  المعلومات الشخصية
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">الاسم</span>
                    <span className="font-bold text-gray-900">{patient.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">العمر</span>
                    <span className="font-bold text-gray-900">{patient.age} سنة</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">رقم الهاتف</span>
                    <span className="font-bold text-gray-900" dir="ltr">{patient.phone}</span>
                  </div>
                  {patient.husband_name && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">اسم الزوج</span>
                      <span className="font-bold text-gray-900">{patient.husband_name}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">العنوان</span>
                      <span className="font-bold text-gray-900">{patient.address}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">تاريخ التسجيل</span>
                    <span className="font-bold text-gray-900">
                      {new Date(patient.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-600" />
                  التاريخ المرضي
                </h3>
                {patient.medical_history ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {patient.medical_history}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                    <p>لا يوجد تاريخ مرضي مسجل</p>
                  </div>
                )}
              </div>

              {/* Last Visit Details */}
              {lastVisit && (
                <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-purple-600" />
                    آخر زيارة
                  </h3>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">التاريخ</p>
                        <p className="font-bold text-gray-900">
                          {new Date(lastVisit.date).toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">القسم</p>
                        <p className="font-bold text-gray-900">{lastVisit.department || 'عام'}</p>
                      </div>
                    </div>
                    {lastVisit.diagnosis && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">التشخيص</p>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-gray-900">{lastVisit.diagnosis}</p>
                        </div>
                      </div>
                    )}
                    {lastVisit.prescription && Array.isArray(lastVisit.prescription) && lastVisit.prescription.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">الأدوية الموصوفة</p>
                        <div className="bg-white rounded-lg p-3">
                          <ul className="space-y-2">
                            {lastVisit.prescription.map((med: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <div>
                                  <span className="font-semibold text-gray-900">{med.drug || med.medication_name}</span>
                                  {med.dose && <span className="text-gray-600 text-sm block">{med.dose}</span>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {lastVisit.notes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">ملاحظات</p>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-gray-700">{lastVisit.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visits Tab */}
          {activeTab === 'visits' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-teal-600" />
                  سجل الزيارات ({visits.length})
                </h3>
              </div>
              {visits.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Activity className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">لا توجد زيارات مسجلة</p>
                </div>
              ) : (
                <div className="divide-y">
                  {visits.map((visit, index) => (
                    <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 font-bold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-gray-900">
                              {new Date(visit.date).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {visit.department || 'عام'}
                            </span>
                          </div>
                          {visit.diagnosis && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-1">التشخيص:</p>
                              <p className="text-gray-900">{visit.diagnosis}</p>
                            </div>
                          )}
                          {visit.prescription && Array.isArray(visit.prescription) && visit.prescription.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-1">الأدوية الموصوفة:</p>
                              <div className="bg-green-50 border-r-4 border-green-400 p-3 rounded">
                                <ul className="space-y-1">
                                  {visit.prescription.map((med: any, idx: number) => (
                                    <li key={idx} className="text-sm text-gray-900">
                                      • <span className="font-semibold">{med.drug || med.medication_name}</span>
                                      {med.dose && <span className="text-gray-600"> - {med.dose}</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          {visit.notes && (
                            <div className="bg-yellow-50 border-r-4 border-yellow-400 p-3 rounded">
                              <p className="text-sm text-gray-700">{visit.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Pill className="w-6 h-6 text-green-600" />
                  العلاجات والأدوية ({allPrescriptions.length} روشتة - {totalPrescriptionItems} دواء)
                </h3>
              </div>
              {allPrescriptions.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Pill className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">لا توجد أدوية مسجلة</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {allPrescriptions.map((prescription, pIndex) => (
                    <div
                      key={pIndex}
                      className="border-2 border-green-200 rounded-xl p-5 hover:border-green-400 transition-colors bg-gradient-to-r from-green-50 to-teal-50"
                    >
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-200">
                        <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-green-600" />
                          روشتة بتاريخ {new Date(prescription.visitDate).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                          {prescription.items.length} دواء
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {prescription.items.map((med: PrescriptionItem, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-bold text-sm">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-1">{med.drug}</h5>
                                {med.dose && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-semibold">الجرعة:</span> {med.dose}
                                  </p>
                                )}
                                {med.category && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    {med.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lab Requests Tab */}
          {activeTab === 'labs' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-yellow-600" />
                  التحاليل والفحوصات ({labRequests.length})
                </h3>
              </div>
              {labRequests.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">لا توجد تحاليل مسجلة</p>
                </div>
              ) : (
                <div className="divide-y">
                  {labRequests.map((lab) => (
                    <div key={lab.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-lg text-gray-900">{lab.test_name}</h4>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                lab.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : lab.status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {lab.status === 'Pending' && 'قيد الانتظار'}
                              {lab.status === 'Completed' && 'مكتمل'}
                              {lab.status === 'Cancelled' && 'ملغي'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            تاريخ الطلب: {new Date(lab.request_date).toLocaleDateString('ar-EG')}
                          </p>
                          {lab.result && (
                            <div className="bg-green-50 border-r-4 border-green-400 p-3 rounded mt-3">
                              <p className="text-sm font-medium text-gray-900 mb-1">النتيجة:</p>
                              <p className="text-gray-700">{lab.result}</p>
                            </div>
                          )}
                          {lab.notes && (
                            <div className="bg-gray-50 p-3 rounded mt-2">
                              <p className="text-sm text-gray-700">{lab.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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