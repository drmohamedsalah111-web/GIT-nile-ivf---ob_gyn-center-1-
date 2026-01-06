import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { labService } from '../../services/labService';
import { visitsService } from '../../services/visitsService';
import {
  User, Phone, Calendar, Heart, Activity, Pill, FileText,
  AlertCircle, Clock, ChevronRight, ArrowLeft, Printer,
  Thermometer, Weight, Stethoscope, Eye, ChevronDown, ChevronUp,
  Beaker, Baby, Clipboard, History, Search, Filter, X,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CompleteMedicalRecordProps {
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
  date?: string;
  visit_date?: string;
  created_at?: string;
  department?: string;
  diagnosis?: string;
  prescription?: any[];
  notes?: string;
  clinical_data?: any;
}

interface LabRequest {
  id: string;
  requestDate: string;
  status: string;
  notes?: string;
  items: LabRequestItem[];
}

interface LabRequestItem {
  id: string;
  testName?: string;
  testUnit?: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  referenceRangeText?: string;
  result?: {
    resultValue?: number;
    resultText?: string;
    isAbnormal?: boolean;
    abnormalType?: string;
  };
}

interface Pregnancy {
  id: string;
  lmp_date?: string;
  edd_date?: string;
  status?: string;
  risk_level?: string;
  created_at?: string;
}

// Safe date formatting
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'غير محدد';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'غير صالح';
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return 'غير صالح';
  }
};

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

const getVisitDate = (visit: Visit): string | null => {
  return visit.date || visit.visit_date || visit.created_at || null;
};

const CompleteMedicalRecord: React.FC<CompleteMedicalRecordProps> = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'timeline' | 'visits' | 'labs' | 'prescriptions' | 'diagnoses'>('timeline');
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllData();
  }, [patientId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPatient(),
        loadVisits(),
        loadLabRequests(),
        loadPregnancies()
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
    if (!error && data) setPatient(data);
  };

  const loadVisits = async () => {
    try {
      const allVisits = await visitsService.getVisitsByPatient(patientId);
      const formattedVisits = allVisits.map((v: any) => ({
        id: v.id,
        date: v.date || v.created_at,
        department: v.department || 'عام',
        diagnosis: v.diagnosis || '',
        prescription: v.prescription || [],
        notes: v.notes || '',
        clinical_data: v.clinical_data || null
      }));
      setVisits(formattedVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
      setVisits([]);
    }
  };

  const loadLabRequests = async () => {
    try {
      const data = await labService.getPatientRequests(patientId);
      setLabRequests(data);
    } catch (error) {
      console.error('Error loading labs:', error);
      setLabRequests([]);
    }
  };

  const loadPregnancies = async () => {
    const { data, error } = await supabase
      .from('pregnancies')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (!error) setPregnancies(data || []);
  };

  const toggleVisitExpansion = (visitId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  const parseClinicalData = (clinicalData: any) => {
    if (!clinicalData) return null;
    try {
      if (typeof clinicalData === 'string') {
        return JSON.parse(clinicalData);
      }
      return clinicalData;
    } catch (e) {
      return null;
    }
  };

  // Extract all prescriptions from visits
  const allPrescriptions = visits
    .filter(v => v.prescription && Array.isArray(v.prescription) && v.prescription.length > 0)
    .map(v => ({
      visitDate: getVisitDate(v),
      department: v.department,
      items: v.prescription || []
    }));

  // Extract all diagnoses from visits
  const allDiagnoses = visits
    .filter(v => v.diagnosis)
    .map(v => ({
      date: getVisitDate(v),
      department: v.department,
      diagnosis: v.diagnosis,
      clinicalData: parseClinicalData(v.clinical_data)
    }));

  // Build timeline
  const timelineItems = [
    ...visits.map(v => ({
      type: 'visit' as const,
      date: getVisitDate(v),
      data: v
    })),
    ...labRequests.map(l => ({
      type: 'lab' as const,
      date: l.requestDate,
      data: l
    })),
    ...pregnancies.map(p => ({
      type: 'pregnancy' as const,
      date: p.created_at || p.lmp_date,
      data: p
    }))
  ].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 font-bold">جاري تحميل السجل الطبي...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20 text-gray-500">
        <AlertCircle className="w-16 h-16 mx-auto mb-4" />
        <p className="text-lg">لم يتم العثور على بيانات المريض</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {patient.age} سنة
                </span>
                <span className="flex items-center gap-1" dir="ltr">
                  <Phone className="w-4 h-4" />
                  {patient.phone}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <Printer className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{visits.length}</p>
            <p className="text-sm text-blue-600">زيارة</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Pill className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">
              {allPrescriptions.reduce((sum, p) => sum + p.items.length, 0)}
            </p>
            <p className="text-sm text-green-600">دواء</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <Beaker className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{labRequests.length}</p>
            <p className="text-sm text-purple-600">تحليل</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <Clipboard className="w-6 h-6 text-pink-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-700">{allDiagnoses.length}</p>
            <p className="text-sm text-pink-600">تشخيص</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex gap-2 overflow-x-auto">
        {[
          { id: 'timeline', label: 'الجدول الزمني', icon: History },
          { id: 'visits', label: 'الكشوفات', icon: Stethoscope },
          { id: 'labs', label: 'التحاليل', icon: Beaker },
          { id: 'prescriptions', label: 'الأدوية', icon: Pill },
          { id: 'diagnoses', label: 'التشخيصات', icon: Clipboard }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 min-w-[100px] py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* ========== Timeline Section ========== */}
        {activeSection === 'timeline' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-teal-600" />
              السجل الطبي الكامل - ترتيب زمني
            </h2>
            
            {timelineItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">لا توجد سجلات طبية بعد</p>
                <p className="text-sm mt-2">ستظهر هنا جميع الزيارات والتحاليل والتشخيصات</p>
              </div>
            ) : (
              <div className="relative border-r-4 border-gray-200 mr-4 space-y-6 pr-8">
                {timelineItems.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -right-[42px] top-2 w-5 h-5 rounded-full border-4 border-white shadow ${
                      item.type === 'visit' ? 'bg-blue-500' :
                      item.type === 'lab' ? 'bg-purple-500' : 'bg-pink-500'
                    }`} />
                    
                    {/* Card */}
                    <div className={`rounded-xl p-4 border-2 ${
                      item.type === 'visit' ? 'bg-blue-50 border-blue-200' :
                      item.type === 'lab' ? 'bg-purple-50 border-purple-200' : 'bg-pink-50 border-pink-200'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.type === 'visit' && <Stethoscope className="w-5 h-5 text-blue-600" />}
                          {item.type === 'lab' && <Beaker className="w-5 h-5 text-purple-600" />}
                          {item.type === 'pregnancy' && <Baby className="w-5 h-5 text-pink-600" />}
                          <span className="font-bold text-gray-900">
                            {item.type === 'visit' ? 'كشف طبي' :
                             item.type === 'lab' ? 'طلب تحاليل' : 'تسجيل حمل'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                      </div>
                      
                      {/* Visit Details */}
                      {item.type === 'visit' && (
                        <div className="space-y-2">
                          {(item.data as Visit).department && (
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {(item.data as Visit).department}
                            </span>
                          )}
                          {(item.data as Visit).diagnosis && (
                            <p className="text-gray-700">
                              <span className="font-semibold">التشخيص:</span> {(item.data as Visit).diagnosis}
                            </p>
                          )}
                          {(item.data as Visit).prescription && (item.data as Visit).prescription!.length > 0 && (
                            <p className="text-green-700 text-sm">
                              <Pill className="w-4 h-4 inline ml-1" />
                              {(item.data as Visit).prescription!.length} دواء موصوف
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Lab Details */}
                      {item.type === 'lab' && (
                        <div className="space-y-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                            (item.data as LabRequest).status === 'Completed' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {(item.data as LabRequest).status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
                          </span>
                          <p className="text-sm text-gray-600">
                            {(item.data as LabRequest).items?.length || 0} تحليل
                          </p>
                        </div>
                      )}
                      
                      {/* Pregnancy Details */}
                      {item.type === 'pregnancy' && (
                        <div className="space-y-1">
                          {(item.data as Pregnancy).edd_date && (
                            <p className="text-sm text-gray-700">
                              EDD: {formatDateShort((item.data as Pregnancy).edd_date)}
                            </p>
                          )}
                          {(item.data as Pregnancy).risk_level && (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                              (item.data as Pregnancy).risk_level === 'High' 
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              مخاطر: {(item.data as Pregnancy).risk_level}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Visits Section ========== */}
        {activeSection === 'visits' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-teal-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                سجل الكشوفات والفحوصات ({visits.length})
              </h2>
            </div>
            
            {visits.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Stethoscope className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">لا توجد كشوفات مسجلة</p>
              </div>
            ) : (
              <div className="divide-y">
                {visits.map((visit, index) => {
                  const clinicalData = parseClinicalData(visit.clinical_data);
                  const isExpanded = expandedVisits.has(visit.id);
                  
                  return (
                    <div key={visit.id} className="hover:bg-gray-50 transition-colors">
                      {/* Visit Header */}
                      <div 
                        className="p-6 cursor-pointer"
                        onClick={() => toggleVisitExpansion(visit.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-gray-900">
                                  {formatDate(getVisitDate(visit))}
                                </span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {visit.department || 'عام'}
                                </span>
                                {clinicalData && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                    بيانات سريرية
                                  </span>
                                )}
                              </div>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </div>
                            {visit.diagnosis && (
                              <p className="text-gray-700">
                                <span className="font-semibold">التشخيص:</span> {visit.diagnosis}
                              </p>
                            )}
                            {visit.prescription && visit.prescription.length > 0 && (
                              <p className="text-sm text-green-600 mt-1">
                                <Pill className="w-4 h-4 inline ml-1" />
                                {visit.prescription.length} دواء
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-0">
                          <div className="mr-16 space-y-4">
                            
                            {/* Vitals */}
                            {clinicalData?.vitals && (
                              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                                <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                                  <Thermometer className="w-5 h-5" />
                                  العلامات الحيوية
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  {clinicalData.vitals.weight && (
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500">الوزن</p>
                                      <p className="font-bold text-gray-900">{clinicalData.vitals.weight} كجم</p>
                                    </div>
                                  )}
                                  {clinicalData.vitals.height && (
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500">الطول</p>
                                      <p className="font-bold text-gray-900">{clinicalData.vitals.height} سم</p>
                                    </div>
                                  )}
                                  {clinicalData.vitals.bmi && (
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500">BMI</p>
                                      <p className="font-bold text-gray-900">{clinicalData.vitals.bmi}</p>
                                    </div>
                                  )}
                                  {(clinicalData.vitals.bpSystolic || clinicalData.vitals.bpDiastolic) && (
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500">ضغط الدم</p>
                                      <p className="font-bold text-gray-900">
                                        {clinicalData.vitals.bpSystolic || '--'}/{clinicalData.vitals.bpDiastolic || '--'}
                                      </p>
                                    </div>
                                  )}
                                  {clinicalData.vitals.temperature && (
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500">الحرارة</p>
                                      <p className="font-bold text-gray-900">{clinicalData.vitals.temperature}°C</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Complaints */}
                            {clinicalData?.assessment?.complaints && clinicalData.assessment.complaints.length > 0 && (
                              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5" />
                                  الشكوى الرئيسية
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {clinicalData.assessment.complaints.map((c: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-white text-amber-800 rounded-full text-sm border border-amber-300">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* PV Examination */}
                            {clinicalData?.assessment?.pvExamination && (
                              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                  <Stethoscope className="w-5 h-5" />
                                  الفحص السريري
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {Object.entries(clinicalData.assessment.pvExamination).map(([key, val]) => val && (
                                    <div key={key} className="bg-white rounded-lg p-3">
                                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                                      <p className="text-gray-900">{val as string}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Ultrasound */}
                            {clinicalData?.assessment?.ultrasound && (
                              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                                <h4 className="font-bold text-cyan-800 mb-3 flex items-center gap-2">
                                  <Eye className="w-5 h-5" />
                                  نتائج السونار
                                </h4>
                                <div className="space-y-3">
                                  {clinicalData.assessment.ultrasound.uterus && (
                                    <div className="bg-white rounded-lg p-3">
                                      <p className="font-semibold text-cyan-700 mb-2">الرحم</p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        {Object.entries(clinicalData.assessment.ultrasound.uterus).map(([key, val]) => val && (
                                          <div key={key}>
                                            <span className="text-gray-500">{key}:</span>
                                            <span className="text-gray-900 mr-1">{val as string}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {clinicalData.assessment.ultrasound.endometrium && (
                                    <div className="bg-white rounded-lg p-3">
                                      <p className="font-semibold text-cyan-700 mb-2">بطانة الرحم</p>
                                      <div className="flex gap-4 text-sm">
                                        {clinicalData.assessment.ultrasound.endometrium.thickness && (
                                          <div>السُمك: {clinicalData.assessment.ultrasound.endometrium.thickness} mm</div>
                                        )}
                                        {clinicalData.assessment.ultrasound.endometrium.pattern && (
                                          <div>النمط: {clinicalData.assessment.ultrasound.endometrium.pattern}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {clinicalData.assessment.ultrasound.adnexa && (
                                    <div className="bg-white rounded-lg p-3">
                                      <p className="font-semibold text-cyan-700 mb-2">المبايض</p>
                                      <div className="grid grid-cols-3 gap-2 text-sm">
                                        {Object.entries(clinicalData.assessment.ultrasound.adnexa).map(([key, val]) => val && (
                                          <div key={key}>{key}: {val as string}</div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Prescription */}
                            {visit.prescription && visit.prescription.length > 0 && (
                              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                  <Pill className="w-5 h-5" />
                                  الأدوية الموصوفة ({visit.prescription.length})
                                </h4>
                                <div className="bg-white rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-green-100">
                                      <tr>
                                        <th className="text-right py-2 px-3">الدواء</th>
                                        <th className="text-right py-2 px-3">الجرعة</th>
                                        <th className="text-right py-2 px-3">التصنيف</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {visit.prescription.map((med: any, idx: number) => (
                                        <tr key={idx} className="border-t">
                                          <td className="py-2 px-3 font-medium">{med.drug || med.medication_name}</td>
                                          <td className="py-2 px-3">{med.dose || '-'}</td>
                                          <td className="py-2 px-3">
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

                            {/* Notes */}
                            {(visit.notes || clinicalData?.clinicalNotes) && (
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-2">ملاحظات</h4>
                                <p className="text-gray-700">{visit.notes || clinicalData?.clinicalNotes}</p>
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

        {/* ========== Labs Section ========== */}
        {activeSection === 'labs' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Beaker className="w-6 h-6 text-purple-600" />
                سجل التحاليل المعملية ({labRequests.length})
              </h2>
            </div>
            
            {labRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Beaker className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">لا توجد تحاليل مسجلة</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {labRequests.map((request) => (
                  <div key={request.id} className="border-2 border-purple-200 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{formatDate(request.requestDate)}</p>
                        <p className="text-sm text-gray-600">{request.items?.length || 0} تحليل</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-bold ${
                        request.status === 'Completed' 
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'Cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {request.status === 'Completed' && <CheckCircle className="w-4 h-4 inline ml-1" />}
                        {request.status === 'Pending' && <Clock className="w-4 h-4 inline ml-1" />}
                        {request.status === 'Cancelled' && <XCircle className="w-4 h-4 inline ml-1" />}
                        {request.status === 'Completed' ? 'مكتمل' : 
                         request.status === 'Cancelled' ? 'ملغي' : 'قيد الانتظار'}
                      </span>
                    </div>
                    
                    {request.items && request.items.length > 0 && (
                      <div className="p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-2">التحليل</th>
                              <th className="text-right py-2">النتيجة</th>
                              <th className="text-right py-2">المرجعي</th>
                              <th className="text-right py-2">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {request.items.map((item) => (
                              <tr key={item.id} className="border-b last:border-0">
                                <td className="py-2 font-medium">{item.testName}</td>
                                <td className="py-2">
                                  {item.result?.resultValue ?? item.result?.resultText ?? '--'}
                                  {item.testUnit && <span className="text-gray-500 mr-1">{item.testUnit}</span>}
                                </td>
                                <td className="py-2 text-gray-500">
                                  {item.referenceRangeText || 
                                   (item.referenceRangeMin !== undefined && item.referenceRangeMax !== undefined 
                                    ? `${item.referenceRangeMin} - ${item.referenceRangeMax}` 
                                    : '--')}
                                </td>
                                <td className="py-2">
                                  {item.result?.isAbnormal ? (
                                    <span className="flex items-center gap-1 text-red-600">
                                      {item.result.abnormalType === 'High' && <TrendingUp className="w-4 h-4" />}
                                      {item.result.abnormalType === 'Low' && <TrendingDown className="w-4 h-4" />}
                                      {item.result.abnormalType === 'Critical' && <AlertTriangle className="w-4 h-4" />}
                                      غير طبيعي
                                    </span>
                                  ) : item.result ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      طبيعي
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">--</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {request.notes && (
                      <div className="bg-gray-50 p-3 text-sm text-gray-600 border-t">
                        ملاحظات: {request.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Prescriptions Section ========== */}
        {activeSection === 'prescriptions' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-teal-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-6 h-6 text-green-600" />
                سجل الأدوية والروشتات ({allPrescriptions.length} روشتة)
              </h2>
            </div>
            
            {allPrescriptions.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Pill className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">لا توجد أدوية مسجلة</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {allPrescriptions.map((prescription, idx) => (
                  <div key={idx} className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-r from-green-50 to-teal-50">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-200">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        {formatDate(prescription.visitDate)}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {prescription.department}
                        </span>
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold">
                          {prescription.items.length} دواء
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {prescription.items.map((med: any, medIdx: number) => (
                        <div key={medIdx} className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{med.drug || med.medication_name}</p>
                            {med.dose && <p className="text-gray-600">الجرعة: {med.dose}</p>}
                            {med.frequency && <p className="text-gray-500 text-sm">التكرار: {med.frequency}</p>}
                            {med.duration && <p className="text-gray-500 text-sm">المدة: {med.duration}</p>}
                            {med.notes && <p className="text-gray-400 text-sm italic mt-1">{med.notes}</p>}
                          </div>
                          {med.category && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {med.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Diagnoses Section ========== */}
        {activeSection === 'diagnoses' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-red-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clipboard className="w-6 h-6 text-orange-600" />
                سجل التشخيصات ({allDiagnoses.length})
              </h2>
            </div>
            
            {allDiagnoses.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Clipboard className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">لا توجد تشخيصات مسجلة</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {allDiagnoses.map((item, idx) => (
                  <div key={idx} className="border-2 border-orange-200 rounded-xl p-5 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clipboard className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{formatDate(item.date)}</p>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {item.department}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-lg text-gray-900">{item.diagnosis}</p>
                      {item.clinicalData?.procedureOrder && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-500">الإجراءات:</p>
                          <p className="text-gray-700">{item.clinicalData.procedureOrder}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteMedicalRecord;
