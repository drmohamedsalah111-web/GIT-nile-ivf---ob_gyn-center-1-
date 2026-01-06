import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { visitsService } from '../../services/visitsService';
import {
  User, Phone, Calendar, Heart, Activity, Pill, FileText,
  AlertCircle, Clock, ChevronRight, Plus, Edit2, X, ArrowLeft,
  Thermometer, Weight, Stethoscope, Eye, ChevronDown, ChevronUp
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
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  // Toggle visit expansion
  const toggleVisitExpansion = (visitId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  // Parse clinical data safely
  const parseClinicalData = (clinicalData: any) => {
    if (!clinicalData) return null;
    try {
      if (typeof clinicalData === 'string') {
        return JSON.parse(clinicalData);
      }
      return clinicalData;
    } catch (e) {
      console.error('Error parsing clinical data:', e);
      return null;
    }
  };

  // Format date safely
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'تاريخ غير محدد';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'تاريخ غير صالح';
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  // Format date short
  const formatDateShort = (dateValue: any): string => {
    if (!dateValue) return '--';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '--';
      return date.toLocaleDateString('ar-EG');
    } catch (e) {
      return '--';
    }
  };

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
    try {
      // استخدام visitsService لجلب كل الزيارات (visits + pregnancies + IVF cycles)
      const allVisits = await visitsService.getVisitsByPatient(patientId);
      
      // تحويل البيانات لصيغة Visit المتوقعة
      const formattedVisits = allVisits.map((v: any) => ({
        id: v.id,
        patient_id: v.patientId || patientId,
        date: v.date || v.created_at,
        department: v.department || 'عام',
        diagnosis: v.diagnosis || '',
        prescription: v.prescription || [],
        notes: v.notes || '',
        clinical_data: v.clinical_data || v.vitals || null
      }));
      
      setVisits(formattedVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
      // محاولة التحميل المباشر كـ fallback
      const { data, error: dbError } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(50);

      if (!dbError) {
        setVisits(data || []);
      } else {
        setVisits([]);
      }
    }
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
                  {lastVisit ? formatDateShort(lastVisit.date) : 'لا توجد'}
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
                      {formatDateShort(patient.created_at)}
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
                          {formatDate(lastVisit.date)}
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
                  {visits.map((visit, index) => {
                    const clinicalData = parseClinicalData(visit.clinical_data);
                    const isExpanded = expandedVisits.has(visit.id);
                    
                    return (
                      <div key={visit.id} className="hover:bg-gray-50 transition-colors">
                        {/* Visit Header - Always visible */}
                        <div 
                          className="p-6 cursor-pointer"
                          onClick={() => toggleVisitExpansion(visit.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                <span className="text-teal-600 font-bold">{index + 1}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-bold text-gray-900">
                                    {formatDate(visit.date)}
                                  </span>
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {visit.department || 'عام'}
                                  </span>
                                  {clinicalData && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                      تفاصيل سريرية
                                    </span>
                                  )}
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              </div>
                              {visit.diagnosis && (
                                <div className="mb-2">
                                  <p className="text-gray-700"><span className="font-semibold">التشخيص:</span> {visit.diagnosis}</p>
                                </div>
                              )}
                              {/* Quick prescription count */}
                              {visit.prescription && Array.isArray(visit.prescription) && visit.prescription.length > 0 && (
                                <p className="text-sm text-green-600">
                                  <Pill className="w-4 h-4 inline ml-1" />
                                  {visit.prescription.length} دواء موصوف
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Visit Details */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-0">
                            <div className="mr-16 space-y-4">
                              
                              {/* Vitals Section */}
                              {clinicalData?.vitals && (
                                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
                                  <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                                    <Thermometer className="w-5 h-5" />
                                    العلامات الحيوية
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {clinicalData.vitals.weight && (
                                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <Weight className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">الوزن</p>
                                        <p className="font-bold text-gray-900">{clinicalData.vitals.weight} كجم</p>
                                      </div>
                                    )}
                                    {clinicalData.vitals.height && (
                                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <User className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">الطول</p>
                                        <p className="font-bold text-gray-900">{clinicalData.vitals.height} سم</p>
                                      </div>
                                    )}
                                    {clinicalData.vitals.bmi && (
                                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <Activity className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">BMI</p>
                                        <p className="font-bold text-gray-900">{clinicalData.vitals.bmi}</p>
                                      </div>
                                    )}
                                    {(clinicalData.vitals.bpSystolic || clinicalData.vitals.bpDiastolic) && (
                                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <Heart className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">ضغط الدم</p>
                                        <p className="font-bold text-gray-900">
                                          {clinicalData.vitals.bpSystolic || '--'}/{clinicalData.vitals.bpDiastolic || '--'}
                                        </p>
                                      </div>
                                    )}
                                    {clinicalData.vitals.temperature && (
                                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <Thermometer className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">الحرارة</p>
                                        <p className="font-bold text-gray-900">{clinicalData.vitals.temperature}°C</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Assessment Section - Complaints */}
                              {clinicalData?.assessment?.complaints && clinicalData.assessment.complaints.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    الشكوى الرئيسية
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {clinicalData.assessment.complaints.map((complaint: string, idx: number) => (
                                      <span key={idx} className="px-3 py-1 bg-white text-amber-800 rounded-full text-sm border border-amber-300">
                                        {complaint}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* PV Examination */}
                              {clinicalData?.assessment?.pvExamination && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                                  <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5" />
                                    الفحص السريري (PV Examination)
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {clinicalData.assessment.pvExamination.vulva && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 mb-1">الفرج (Vulva)</p>
                                        <p className="text-gray-900">{clinicalData.assessment.pvExamination.vulva}</p>
                                      </div>
                                    )}
                                    {clinicalData.assessment.pvExamination.vagina && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 mb-1">المهبل (Vagina)</p>
                                        <p className="text-gray-900">{clinicalData.assessment.pvExamination.vagina}</p>
                                      </div>
                                    )}
                                    {clinicalData.assessment.pvExamination.cervix && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 mb-1">عنق الرحم (Cervix)</p>
                                        <p className="text-gray-900">{clinicalData.assessment.pvExamination.cervix}</p>
                                      </div>
                                    )}
                                    {clinicalData.assessment.pvExamination.adnexa && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 mb-1">الملحقات (Adnexa)</p>
                                        <p className="text-gray-900">{clinicalData.assessment.pvExamination.adnexa}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Ultrasound Findings */}
                              {clinicalData?.assessment?.ultrasound && (
                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
                                  <h4 className="font-bold text-cyan-800 mb-3 flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    نتائج السونار
                                  </h4>
                                  <div className="space-y-4">
                                    {/* Uterus */}
                                    {clinicalData.assessment.ultrasound.uterus && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="font-semibold text-cyan-700 mb-2">الرحم (Uterus)</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                          {clinicalData.assessment.ultrasound.uterus.dimensions && (
                                            <div>
                                              <span className="text-gray-500">الأبعاد:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.uterus.dimensions}</span>
                                            </div>
                                          )}
                                          {clinicalData.assessment.ultrasound.uterus.position && (
                                            <div>
                                              <span className="text-gray-500">الوضع:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.uterus.position}</span>
                                            </div>
                                          )}
                                          {clinicalData.assessment.ultrasound.uterus.myometrium && (
                                            <div>
                                              <span className="text-gray-500">عضلة الرحم:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.uterus.myometrium}</span>
                                            </div>
                                          )}
                                          {clinicalData.assessment.ultrasound.uterus.cavity && (
                                            <div>
                                              <span className="text-gray-500">التجويف:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.uterus.cavity}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Endometrium */}
                                    {clinicalData.assessment.ultrasound.endometrium && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="font-semibold text-cyan-700 mb-2">بطانة الرحم (Endometrium)</p>
                                        <div className="flex gap-4 text-sm">
                                          {clinicalData.assessment.ultrasound.endometrium.thickness && (
                                            <div>
                                              <span className="text-gray-500">السُمك:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.endometrium.thickness} mm</span>
                                            </div>
                                          )}
                                          {clinicalData.assessment.ultrasound.endometrium.pattern && (
                                            <div>
                                              <span className="text-gray-500">النمط:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.endometrium.pattern}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Adnexa (Ovaries) */}
                                    {clinicalData.assessment.ultrasound.adnexa && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="font-semibold text-cyan-700 mb-2">المبايض والملحقات (Adnexa)</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                          {clinicalData.assessment.ultrasound.adnexa.rightOvary && (
                                            <div>
                                              <span className="text-gray-500">المبيض الأيمن:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.adnexa.rightOvary}</span>
                                            </div>
                                          )}
                                          {clinicalData.assessment.ultrasound.adnexa.leftOvary && (
                                            <div>
                                              <span className="text-gray-500">المبيض الأيسر:</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.adnexa.leftOvary}</span>
                                            </div>
                                          )}
                                          {clinicalData.assessment.ultrasound.adnexa.pod && (
                                            <div>
                                              <span className="text-gray-500">السائل الحوضي (POD):</span>
                                              <span className="text-gray-900 mr-1">{clinicalData.assessment.ultrasound.adnexa.pod}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Diagnosis & Procedures */}
                              {(clinicalData?.diagnosis || clinicalData?.procedureOrder) && (
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    التشخيص والإجراءات
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {clinicalData.diagnosis && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 mb-1">التشخيص</p>
                                        <p className="text-gray-900 font-medium">{clinicalData.diagnosis}</p>
                                      </div>
                                    )}
                                    {clinicalData.procedureOrder && (
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 mb-1">الإجراءات المطلوبة</p>
                                        <p className="text-gray-900 font-medium">{clinicalData.procedureOrder}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Clinical Notes */}
                              {clinicalData?.clinicalNotes && (
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Edit2 className="w-5 h-5" />
                                    الملاحظات السريرية
                                  </h4>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="text-gray-700 whitespace-pre-wrap">{clinicalData.clinicalNotes}</p>
                                  </div>
                                </div>
                              )}

                              {/* Prescription Details */}
                              {visit.prescription && Array.isArray(visit.prescription) && visit.prescription.length > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
                                  <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                    <Pill className="w-5 h-5" />
                                    الأدوية الموصوفة ({visit.prescription.length})
                                  </h4>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-right py-2 text-gray-600">الدواء</th>
                                          <th className="text-right py-2 text-gray-600">الجرعة</th>
                                          <th className="text-right py-2 text-gray-600">التصنيف</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {visit.prescription.map((med: any, idx: number) => (
                                          <tr key={idx} className="border-b last:border-0">
                                            <td className="py-2 font-medium text-gray-900">{med.drug || med.medication_name}</td>
                                            <td className="py-2 text-gray-700">{med.dose || '-'}</td>
                                            <td className="py-2">
                                              {med.category && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                  {med.category}
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* General Notes */}
                              {visit.notes && (
                                <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg">
                                  <p className="text-sm font-semibold text-yellow-800 mb-1">ملاحظات عامة:</p>
                                  <p className="text-gray-700">{visit.notes}</p>
                                </div>
                              )}

                              {/* No clinical data message */}
                              {!clinicalData && !visit.notes && (!visit.prescription || visit.prescription.length === 0) && (
                                <div className="text-center py-4 text-gray-400">
                                  <p>لا توجد تفاصيل سريرية إضافية لهذه الزيارة</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                          روشتة بتاريخ {formatDate(prescription.visitDate)}
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
                            تاريخ الطلب: {formatDateShort(lab.request_date)}
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