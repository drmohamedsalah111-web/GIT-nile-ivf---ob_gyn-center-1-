// ============================================================================
// 👤 COMPREHENSIVE PATIENT PROFILE - ملف المريض الشامل الاحترافي
// ============================================================================
// الوصف: نظام متكامل لعرض كل بيانات المريضة بشكل احترافي ومنظم للطبيب
// يشمل: البيانات الشخصية، التاريخ الطبي، الزيارات، التحاليل، الأدوية، 
//       دورات الحقن المجهري، متابعة الحمل، الملفات والصور
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  User, Phone, Calendar, Mail, MapPin, FileText, Heart,
  Activity, ClipboardList, AlertCircle, Printer, Edit, Save,
  X, Plus, Clock, Baby, Syringe, TestTube, TrendingUp,
  History, Pill, Stethoscope, FileHeart, Microscope, Droplet,
  Weight, Ruler, HeartPulse, Download, Image, Search, Filter,
  ChevronRight, ChevronDown, Star, AlertTriangle, CheckCircle,
  XCircle, ArrowLeft, Eye, FileImage, Paperclip, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabaseClient';

// ============================================================================
// INTERFACES
// ============================================================================

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
  husband_phone?: string;
  marital_status?: string;
  gravida?: number;
  para?: number;
  abortions?: number;
  living_children?: number;
  medical_history?: any;
  allergies?: string[];
  chronic_diseases?: string[];
  previous_surgeries?: string[];
  medications?: string[];
  created_at?: string;
  doctor_id?: string;
}

interface VitalSigns {
  weight?: number;
  height?: number;
  bmi?: number;
  blood_pressure?: string;
  pulse?: number;
  temperature?: number;
  date?: string;
}

interface Visit {
  id: string;
  visit_date: string;
  department?: string;
  diagnosis?: string;
  chief_complaint?: string;
  notes?: string;
  treatment?: string;
  prescription?: any[];
  clinical_data?: any;
  vitals?: VitalSigns;
  follow_up_date?: string;
}

interface LabResult {
  id: string;
  test_date: string;
  test_name: string;
  result?: string;
  normal_range?: string;
  unit?: string;
  status?: 'normal' | 'abnormal' | 'critical';
  notes?: string;
}

interface IVFCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  protocol?: string;
  status?: string;
  outcome?: string;
  eggs_retrieved?: number;
  embryos_transferred?: number;
  pregnancy_result?: boolean;
}

interface Pregnancy {
  id: string;
  conception_date: string;
  lmp?: string;
  edd?: string;
  gestational_age?: string;
  status?: string;
  pregnancy_type?: string;
  complications?: string[];
  delivery_date?: string;
  delivery_type?: string;
  outcome?: string;
}

interface PatientFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  category?: 'lab' | 'imaging' | 'report' | 'prescription' | 'other';
  uploaded_at: string;
  description?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ComprehensivePatientProfile: React.FC = () => {
  // States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'visits' | 'labs' | 'ivf' | 'pregnancy' | 'files'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Data States
  const [visits, setVisits] = useState<Visit[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [ivfCycles, setIVFCycles] = useState<IVFCycle[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [latestVitals, setLatestVitals] = useState<VitalSigns | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalLabs: 0,
    totalIVFCycles: 0,
    totalPregnancies: 0,
    totalFiles: 0,
    lastVisit: null as string | null,
    nextAppointment: null as string | null
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientData(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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

      // Load Visits
      const { data: visitsData } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      setVisits(visitsData || []);

      // Load Lab Results
      const { data: labsData } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      setLabResults(labsData || []);

      // Load IVF Cycles
      const { data: cyclesData } = await supabase
        .from('ivf_cycles')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_date', { ascending: false });

      setIVFCycles(cyclesData || []);

      // Load Pregnancies
      const { data: pregnanciesData } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('patient_id', patientId)
        .order('conception_date', { ascending: false });

      setPregnancies(pregnanciesData || []);

      // Load Files
      const { data: filesData } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      setFiles(filesData || []);

      // Calculate Stats
      const lastVisit = visitsData?.[0]?.visit_date || null;
      
      setStats({
        totalVisits: visitsData?.length || 0,
        totalLabs: labsData?.length || 0,
        totalIVFCycles: cyclesData?.length || 0,
        totalPregnancies: pregnanciesData?.length || 0,
        totalFiles: filesData?.length || 0,
        lastVisit,
        nextAppointment: null // TODO: Load from appointments
      });

      // Get latest vitals
      if (visitsData && visitsData.length > 0) {
        const latestVisitWithVitals = visitsData.find(v => v.vitals);
        if (latestVisitWithVitals) {
          setLatestVitals(latestVisitWithVitals.vitals);
        }
      }

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('فشل تحميل بيانات المريض');
    } finally {
      setDataLoading(false);
    }
  };

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  const filteredPatients = patients.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(searchLower) ||
      p.phone?.includes(searchTerm) ||
      p.national_id?.includes(searchTerm) ||
      p.husband_name?.toLowerCase().includes(searchLower)
    );
  });

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderPatientCard = (patient: Patient) => (
    <div
      key={patient.id}
      onClick={() => setSelectedPatient(patient)}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
        selectedPatient?.id === patient.id
          ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-500 shadow-lg'
          : 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          selectedPatient?.id === patient.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          <User className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1 truncate">{patient.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Phone className="w-4 h-4" />
            <span>{patient.phone}</span>
          </div>
          {patient.age && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{patient.age} سنة</span>
            </div>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
          selectedPatient?.id === patient.id ? 'rotate-90' : ''
        }`} />
      </div>
    </div>
  );

  const renderTabButton = (
    tab: typeof activeTab,
    label: string,
    icon: React.ReactNode,
    count?: number
  ) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
        activeTab === tab
          ? 'bg-teal-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          activeTab === tab ? 'bg-white/20' : 'bg-gray-100'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  // ============================================================================
  // TAB CONTENT RENDERERS
  // ============================================================================

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{selectedPatient?.name}</h1>
              {selectedPatient?.husband_name && (
                <p className="text-white/90 text-lg">زوج: {selectedPatient.husband_name}</p>
              )}
            </div>
          </div>
          <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            <Edit className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <Phone className="w-5 h-5 mb-2" />
            <p className="text-sm text-white/80">الهاتف</p>
            <p className="font-bold text-lg">{selectedPatient?.phone}</p>
          </div>
          {selectedPatient?.age && (
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <Calendar className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">العمر</p>
              <p className="font-bold text-lg">{selectedPatient.age} سنة</p>
            </div>
          )}
          {selectedPatient?.blood_type && (
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <Droplet className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">فصيلة الدم</p>
              <p className="font-bold text-lg">{selectedPatient.blood_type}</p>
            </div>
          )}
          {selectedPatient?.national_id && (
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <FileText className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">الرقم القومي</p>
              <p className="font-bold text-sm">{selectedPatient.national_id}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <Stethoscope className="w-8 h-8 text-teal-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalVisits}</span>
          </div>
          <p className="text-gray-600 font-semibold">إجمالي الزيارات</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <TestTube className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalLabs}</span>
          </div>
          <p className="text-gray-600 font-semibold">التحاليل</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <Microscope className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalIVFCycles}</span>
          </div>
          <p className="text-gray-600 font-semibold">دورات IVF</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-pink-500">
          <div className="flex items-center justify-between mb-2">
            <Baby className="w-8 h-8 text-pink-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalPregnancies}</span>
          </div>
          <p className="text-gray-600 font-semibold">حالات الحمل</p>
        </div>
      </div>

      {/* Obstetric History */}
      {(selectedPatient?.gravida || selectedPatient?.para) && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Baby className="w-6 h-6 text-pink-600" />
            التاريخ التوليدي
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-pink-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">مرات الحمل</p>
              <p className="text-2xl font-bold text-pink-600">{selectedPatient.gravida || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">الولادات</p>
              <p className="text-2xl font-bold text-green-600">{selectedPatient.para || 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">الإجهاضات</p>
              <p className="text-2xl font-bold text-red-600">{selectedPatient.abortions || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">الأطفال الأحياء</p>
              <p className="text-2xl font-bold text-blue-600">{selectedPatient.living_children || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Latest Vitals */}
      {latestVitals && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-red-600" />
            آخر قياسات حيوية
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestVitals.weight && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <Weight className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">الوزن</p>
                  <p className="text-xl font-bold text-gray-900">{latestVitals.weight} كجم</p>
                </div>
              </div>
            )}
            {latestVitals.height && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <Ruler className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">الطول</p>
                  <p className="text-xl font-bold text-gray-900">{latestVitals.height} سم</p>
                </div>
              </div>
            )}
            {latestVitals.bmi && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <Activity className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">BMI</p>
                  <p className="text-xl font-bold text-gray-900">{latestVitals.bmi.toFixed(1)}</p>
                </div>
              </div>
            )}
            {latestVitals.blood_pressure && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <HeartPulse className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">ضغط الدم</p>
                  <p className="text-xl font-bold text-gray-900">{latestVitals.blood_pressure}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-6 h-6 text-teal-600" />
          النشاط الأخير
        </h3>
        
        {stats.lastVisit && (
          <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-lg mb-3">
            <Clock className="w-6 h-6 text-teal-600" />
            <div>
              <p className="font-semibold text-gray-900">آخر زيارة</p>
              <p className="text-sm text-gray-600">{new Date(stats.lastVisit).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        )}

        {visits.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileHeart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>لا توجد زيارات مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMedicalTab = () => (
    <div className="space-y-6">
      {/* Medical History */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          التاريخ المرضي
        </h3>
        {selectedPatient?.medical_history ? (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-gray-700">
              {JSON.stringify(selectedPatient.medical_history, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500">لا يوجد تاريخ مرضي مسجل</p>
        )}
      </div>

      {/* Allergies */}
      {selectedPatient?.allergies && selectedPatient.allergies.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            الحساسية
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedPatient.allergies.map((allergy, idx) => (
              <span key={idx} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold">
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chronic Diseases */}
      {selectedPatient?.chronic_diseases && selectedPatient.chronic_diseases.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6 text-purple-600" />
            الأمراض المزمنة
          </h3>
          <div className="space-y-2">
            {selectedPatient.chronic_diseases.map((disease, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-gray-900 font-medium">{disease}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Surgeries */}
      {selectedPatient?.previous_surgeries && selectedPatient.previous_surgeries.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            العمليات السابقة
          </h3>
          <div className="space-y-2">
            {selectedPatient.previous_surgeries.map((surgery, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                <span className="text-gray-900 font-medium">{surgery}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Medications */}
      {selectedPatient?.medications && selectedPatient.medications.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Pill className="w-6 h-6 text-green-600" />
            الأدوية الحالية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedPatient.medications.map((med, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Pill className="w-5 h-5 text-green-600" />
                <span className="text-gray-900 font-medium">{med}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderVisitsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">سجل الزيارات</h3>
        <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-bold">
          {visits.length} زيارة
        </span>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد زيارات مسجلة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit, idx) => (
            <div key={visit.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      زيارة #{visits.length - idx}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(visit.visit_date).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {visit.department && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {visit.department}
                  </span>
                )}
              </div>

              {visit.chief_complaint && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">الشكوى الرئيسية:</p>
                  <p className="text-gray-900 font-medium">{visit.chief_complaint}</p>
                </div>
              )}

              {visit.diagnosis && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">التشخيص:</p>
                  <p className="text-gray-900 font-medium">{visit.diagnosis}</p>
                </div>
              )}

              {visit.treatment && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">العلاج:</p>
                  <p className="text-gray-900">{visit.treatment}</p>
                </div>
              )}

              {visit.prescription && visit.prescription.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">الروشتة:</p>
                  <div className="space-y-2">
                    {visit.prescription.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <Pill className="w-4 h-4 text-green-600" />
                        <span>{item.name || item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {visit.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ملاحظات:</p>
                  <p className="text-gray-700">{visit.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLabsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">نتائج التحاليل</h3>
        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold">
          {labResults.length} تحليل
        </span>
      </div>

      {labResults.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد تحاليل مسجلة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {labResults.map((lab) => (
            <div key={lab.id} className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{lab.test_name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(lab.test_date).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                {lab.status && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    lab.status === 'normal' ? 'bg-green-100 text-green-700' :
                    lab.status === 'abnormal' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {lab.status === 'normal' ? 'طبيعي' :
                     lab.status === 'abnormal' ? 'غير طبيعي' : 'حرج'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">النتيجة</p>
                  <p className="font-bold text-gray-900">{lab.result}</p>
                </div>
                {lab.normal_range && (
                  <div>
                    <p className="text-sm text-gray-600">المدى الطبيعي</p>
                    <p className="text-gray-900">{lab.normal_range}</p>
                  </div>
                )}
                {lab.unit && (
                  <div>
                    <p className="text-sm text-gray-600">الوحدة</p>
                    <p className="text-gray-900">{lab.unit}</p>
                  </div>
                )}
              </div>

              {lab.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{lab.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderIVFTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">دورات الحقن المجهري</h3>
        <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-bold">
          {ivfCycles.length} دورة
        </span>
      </div>

      {ivfCycles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد دورات IVF مسجلة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ivfCycles.map((cycle) => (
            <div key={cycle.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">دورة #{cycle.cycle_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(cycle.start_date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                {cycle.status && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    cycle.status === 'success' ? 'bg-green-100 text-green-700' :
                    cycle.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cycle.status}
                  </span>
                )}
              </div>

              {cycle.protocol && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">البروتوكول</p>
                  <p className="font-semibold text-gray-900">{cycle.protocol}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                {cycle.eggs_retrieved !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">البويضات المسحوبة</p>
                    <p className="text-xl font-bold text-blue-600">{cycle.eggs_retrieved}</p>
                  </div>
                )}
                {cycle.embryos_transferred !== undefined && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">الأجنة المنقولة</p>
                    <p className="text-xl font-bold text-green-600">{cycle.embryos_transferred}</p>
                  </div>
                )}
              </div>

              {cycle.outcome && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">النتيجة</p>
                  <p className="font-semibold text-gray-900">{cycle.outcome}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPregnancyTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">متابعة الحمل</h3>
        <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-bold">
          {pregnancies.length} حمل
        </span>
      </div>

      {pregnancies.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد حالات حمل مسجلة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pregnancies.map((pregnancy, idx) => (
            <div key={pregnancy.id} className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Baby className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">حمل #{pregnancies.length - idx}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(pregnancy.conception_date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                {pregnancy.status && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    pregnancy.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                    pregnancy.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {pregnancy.status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {pregnancy.lmp && (
                  <div>
                    <p className="text-sm text-gray-600">آخر دورة</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(pregnancy.lmp).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                )}
                {pregnancy.edd && (
                  <div>
                    <p className="text-sm text-gray-600">الولادة المتوقعة</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(pregnancy.edd).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                )}
                {pregnancy.gestational_age && (
                  <div>
                    <p className="text-sm text-gray-600">عمر الحمل</p>
                    <p className="font-semibold text-gray-900">{pregnancy.gestational_age}</p>
                  </div>
                )}
              </div>

              {pregnancy.pregnancy_type && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">نوع الحمل</p>
                  <p className="font-semibold text-gray-900">{pregnancy.pregnancy_type}</p>
                </div>
              )}

              {pregnancy.complications && pregnancy.complications.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg mb-3">
                  <p className="text-sm font-semibold text-red-700 mb-2">المضاعفات:</p>
                  <div className="space-y-1">
                    {pregnancy.complications.map((comp, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{comp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pregnancy.outcome && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">النتيجة</p>
                  <p className="font-semibold text-gray-900">{pregnancy.outcome}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">الملفات والمستندات</h3>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold">
            {files.length} ملف
          </span>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            رفع ملف
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md">
          <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">لا توجد ملفات مرفوعة</p>
          <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold">
            رفع أول ملف
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div key={file.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  file.category === 'lab' ? 'bg-blue-100' :
                  file.category === 'imaging' ? 'bg-purple-100' :
                  file.category === 'report' ? 'bg-green-100' :
                  file.category === 'prescription' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  {file.file_type.includes('image') ? (
                    <Image className={`w-6 h-6 ${
                      file.category === 'lab' ? 'text-blue-600' :
                      file.category === 'imaging' ? 'text-purple-600' :
                      file.category === 'report' ? 'text-green-600' :
                      file.category === 'prescription' ? 'text-orange-600' :
                      'text-gray-600'
                    }`} />
                  ) : (
                    <FileText className={`w-6 h-6 ${
                      file.category === 'lab' ? 'text-blue-600' :
                      file.category === 'imaging' ? 'text-purple-600' :
                      file.category === 'report' ? 'text-green-600' :
                      file.category === 'prescription' ? 'text-orange-600' :
                      'text-gray-600'
                    }`} />
                  )}
                </div>
                {file.category && (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    file.category === 'lab' ? 'bg-blue-100 text-blue-700' :
                    file.category === 'imaging' ? 'bg-purple-100 text-purple-700' :
                    file.category === 'report' ? 'bg-green-100 text-green-700' :
                    file.category === 'prescription' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {file.category === 'lab' ? 'تحليل' :
                     file.category === 'imaging' ? 'أشعة' :
                     file.category === 'report' ? 'تقرير' :
                     file.category === 'prescription' ? 'روشتة' : 'أخرى'}
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-gray-900 mb-2 truncate" title={file.file_name}>
                {file.file_name}
              </h4>
              
              <p className="text-sm text-gray-500 mb-3">
                {new Date(file.uploaded_at).toLocaleDateString('ar-EG')}
              </p>

              {file.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{file.description}</p>
              )}

              <div className="flex items-center gap-2">
                <button className="flex-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  عرض
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-[Tajawal]" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ملف المريض الشامل</h1>
                <p className="text-gray-500 mt-1">مرجع طبي متكامل واحترافي</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <Printer className="w-6 h-6 text-gray-700" />
              </button>
              <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <Download className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Patients Sidebar */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن مريضة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-teal-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">{patients.length}</p>
                <p className="text-xs text-gray-600">إجمالي المرضى</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{filteredPatients.length}</p>
                <p className="text-xs text-gray-600">نتائج البحث</p>
              </div>
            </div>

            {/* Patients List */}
            <div className="space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
              {filteredPatients.map(renderPatientCard)}
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">لا توجد نتائج</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          {!selectedPatient ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                اختر مريضة لعرض ملفها الطبي
              </h3>
              <p className="text-gray-500">
                اختر مريضة من القائمة على اليمين لعرض كامل البيانات الطبية
              </p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {renderTabButton('overview', 'نظرة عامة', <Activity className="w-5 h-5" />)}
                  {renderTabButton('medical', 'التاريخ الطبي', <Heart className="w-5 h-5" />)}
                  {renderTabButton('visits', 'الزيارات', <Stethoscope className="w-5 h-5" />, stats.totalVisits)}
                  {renderTabButton('labs', 'التحاليل', <TestTube className="w-5 h-5" />, stats.totalLabs)}
                  {renderTabButton('ivf', 'IVF', <Microscope className="w-5 h-5" />, stats.totalIVFCycles)}
                  {renderTabButton('pregnancy', 'الحمل', <Baby className="w-5 h-5" />, stats.totalPregnancies)}
                  {renderTabButton('files', 'الملفات', <FileImage className="w-5 h-5" />, stats.totalFiles)}
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {dataLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'medical' && renderMedicalTab()}
                    {activeTab === 'visits' && renderVisitsTab()}
                    {activeTab === 'labs' && renderLabsTab()}
                    {activeTab === 'ivf' && renderIVFTab()}
                    {activeTab === 'pregnancy' && renderPregnancyTab()}
                    {activeTab === 'files' && renderFilesTab()}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePatientProfile;
