import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Calendar, Mail, MapPin, FileText, 
  Heart, Activity, ClipboardList, AlertCircle, Printer,
  Edit, Save, X, Plus, Clock, Baby, Syringe, TestTube,
  TrendingUp, History, Pill, Stethoscope, FileHeart,
  Microscope, Droplet, Weight, Ruler, HeartPulse,
  ChevronDown, ChevronUp, Search, Filter, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabaseClient';
import { labService, LabRequest, LabResult } from '../../services/labService';
import { PageHeader } from '../../components/layout/PageHeader';

// --- Types ---
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
  prescription?: any[];
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
  lmp?: string;
  created_at?: string;
}

// --- Components ---

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  colorClass: string;
}> = ({ active, onClick, icon, label, count, colorClass }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-bold text-sm whitespace-nowrap
      ${active 
        ? `bg-white shadow-md ${colorClass} ring-1 ring-opacity-20 ring-current` 
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }
    `}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && (
      <span className={`
        px-2 py-0.5 rounded-full text-xs
        ${active ? 'bg-opacity-10 bg-current' : 'bg-gray-200 text-gray-600'}
      `}>
        {count}
      </span>
    )}
  </button>
);

const PatientProfile: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [labRequests, setLabRequests] = useState<(LabRequest & { items: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'pregnancy' | 'visits' | 'medications' | 'labs'>('overview');

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
      
      // Load Appointments
      const appointmentsPromise = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(res => ({ data: res.data || [], error: res.error }));
      
      // Load Visits
      const visitsPromise = supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(res => ({ data: res.data || [], error: res.error }));
      
      // Load IVF Cycles
      const cyclesPromise = supabase
        .from('ivf_cycles')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .then(res => ({ data: res.data || [], error: res.error }));
      
      // Load Pregnancies
      const pregnanciesPromise = supabase
        .from('pregnancies')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .then(res => ({ data: res.data || [], error: res.error }));

      // Load Lab Requests
      const labsPromise = labService.getPatientRequests(patientId)
        .then(data => ({ data, error: null }))
        .catch(err => ({ data: [], error: err }));

      const [appointmentsData, visitsData, cyclesData, pregnanciesData, labsData] = await Promise.all([
        appointmentsPromise,
        visitsPromise,
        cyclesPromise,
        pregnanciesPromise,
        labsPromise
      ]);

      setAppointments(appointmentsData.data);
      setVisits(visitsData.data);
      setCycles(cyclesData.data);
      setPregnancies(pregnanciesData.data);
      setLabRequests(labsData.data);

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
    setLabRequests([]);
    setActiveTab('overview');
    loadPatientData(patient.id);
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.national_id?.includes(searchTerm)
  );

  // --- Render Content Based on Tab ---
  const renderContent = () => {
    if (!selectedPatient) return null;

    switch (activeTab) {
      case 'pregnancy':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-600" />
                سجل الحمل والمتابعة
              </h3>
              <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 text-sm font-bold">
                <Plus className="w-4 h-4" />
                تسجيل حمل جديد
              </button>
            </div>

            {pregnancies.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد سجلات حمل</h3>
                <p className="text-gray-500">لم يتم تسجيل أي حالات حمل لهذا المريض</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pregnancies.map((preg) => (
                  <div key={preg.id} className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-50 to-white p-4 border-b border-pink-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                          <Baby className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {preg.conception_date 
                              ? `حمل بتاريخ ${new Date(preg.conception_date).toLocaleDateString('ar-EG')}`
                              : 'سجل حمل جديد'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            EDD: {preg.edd ? new Date(preg.edd).toLocaleDateString('ar-EG') : 'غير محدد'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        preg.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {preg.status === 'ongoing' ? 'جاري' : 'منتهي'}
                      </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 block mb-1">تاريخ آخر دورة (LMP)</span>
                        <span className="font-bold text-gray-800">
                          {preg.lmp ? new Date(preg.lmp).toLocaleDateString('ar-EG') : '-'}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 block mb-1">النتيجة</span>
                        <span className="font-bold text-gray-800">{preg.outcome || '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 block mb-1">تاريخ التسجيل</span>
                        <span className="font-bold text-gray-800">
                          {preg.created_at ? new Date(preg.created_at).toLocaleDateString('ar-EG') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'visits':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                سجل الكشوفات والزيارات
              </h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-bold">
                <Plus className="w-4 h-4" />
                زيارة جديدة
              </button>
            </div>

            {visits.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد زيارات مسجلة</h3>
                <p className="text-gray-500">لم يتم تسجيل أي زيارات طبية لهذا المريض</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit) => (
                  <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold flex-col leading-none">
                            <span className="text-lg">{new Date(visit.visit_date).getDate()}</span>
                            <span className="text-[10px] uppercase">{new Date(visit.visit_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">
                              {visit.diagnosis || 'زيارة عامة'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(visit.visit_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>

                      {visit.notes && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3 text-gray-700 text-sm leading-relaxed">
                          {visit.notes}
                        </div>
                      )}

                      {visit.treatment && (
                        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100">
                          <Pill className="w-4 h-4 text-teal-600 mt-1" />
                          <div>
                            <span className="text-xs font-bold text-gray-500 block">العلاج الموصوف:</span>
                            <p className="text-sm text-gray-800">{visit.treatment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'medications':
        // Extract medications from visits
        const allMedications = visits.flatMap(v => {
          if (Array.isArray(v.prescription)) {
            return v.prescription.map(p => ({ ...p, date: v.visit_date }));
          }
          return [];
        });

        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Pill className="w-6 h-6 text-teal-600" />
                سجل الأدوية والعلاجات
              </h3>
            </div>

            {allMedications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد أدوية مسجلة</h3>
                <p className="text-gray-500">لم يتم وصف أي أدوية في الزيارات المسجلة</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">الدواء</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">الجرعة</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">تاريخ الوصف</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">الفئة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allMedications.map((med, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{med.drug}</td>
                        <td className="px-6 py-4 text-gray-600">{med.dose}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(med.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-bold">
                            {med.category || 'عام'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'labs':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Microscope className="w-6 h-6 text-purple-600" />
                التحاليل والفحوصات
              </h3>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-bold">
                <Plus className="w-4 h-4" />
                طلب تحليل جديد
              </button>
            </div>

            {labRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد تحاليل</h3>
                <p className="text-gray-500">لم يتم طلب أي تحاليل لهذا المريض</p>
              </div>
            ) : (
              <div className="space-y-4">
                {labRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">طلب تحاليل</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(req.requestDate).toLocaleDateString('ar-EG', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status === 'Completed' ? 'مكتمل' : req.status === 'Pending' ? 'قيد الانتظار' : req.status}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid gap-2">
                        {req.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                              <span className="font-medium text-gray-700">{item.testName || 'تحليل غير مسمى'}</span>
                            </div>
                            {item.priority === 'Urgent' && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">عاجل</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {req.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                          <span className="font-bold text-gray-700">ملاحظات:</span> {req.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default: // Overview
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('pregnancy')}>
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mb-2">
                  <Baby className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{pregnancies.length}</span>
                <span className="text-xs text-gray-500 font-medium">حالات حمل</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('visits')}>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{visits.length}</span>
                <span className="text-xs text-gray-500 font-medium">زيارات</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('medications')}>
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-2">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  {visits.reduce((acc, v) => acc + (Array.isArray(v.prescription) ? v.prescription.length : 0), 0)}
                </span>
                <span className="text-xs text-gray-500 font-medium">أدوية</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('labs')}>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2">
                  <Microscope className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{labRequests.length}</span>
                <span className="text-xs text-gray-500 font-medium">تحاليل</span>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                آخر النشاطات
              </h3>
              
              <div className="relative border-r-2 border-gray-100 mr-3 space-y-6 pr-6">
                {/* Combine and sort recent items */}
                {[
                  ...visits.map(v => ({ type: 'visit', date: v.visit_date, data: v })),
                  ...pregnancies.map(p => ({ type: 'pregnancy', date: p.created_at || p.conception_date, data: p })),
                  ...labRequests.map(l => ({ type: 'lab', date: l.requestDate, data: l }))
                ]
                .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
                .slice(0, 5)
                .map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -right-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                      item.type === 'visit' ? 'bg-blue-500' : 
                      item.type === 'pregnancy' ? 'bg-pink-500' : 'bg-purple-500'
                    }`}></div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded mb-1 inline-block ${
                            item.type === 'visit' ? 'bg-blue-100 text-blue-700' : 
                            item.type === 'pregnancy' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {item.type === 'visit' ? 'زيارة' : item.type === 'pregnancy' ? 'حمل' : 'تحليل'}
                          </span>
                          <p className="font-bold text-gray-800 text-sm">
                            {item.type === 'visit' ? (item.data as Visit).diagnosis || 'زيارة عيادة' :
                             item.type === 'pregnancy' ? 'تسجيل حمل جديد' :
                             'طلب تحاليل معملية'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.date || '').toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {visits.length === 0 && pregnancies.length === 0 && labRequests.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">لا توجد نشاطات حديثة</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <PageHeader 
        title="ملفات المرضى" 
        subtitle="السجل الطبي الشامل"
        icon={<User className="w-6 h-6" />}
        showNavigation={true}
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        {/* Patients List - Left Side */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-140px)] flex flex-col">
          <div className="mb-4 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث عن مريض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">لا توجد نتائج</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`w-full text-right p-3 rounded-lg border transition-all group ${
                    selectedPatient?.id === patient.id
                      ? 'bg-teal-50 border-teal-500 shadow-sm'
                      : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className={`font-bold truncate text-sm ${selectedPatient?.id === patient.id ? 'text-teal-800' : 'text-gray-700'}`}>
                        {patient.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                      </div>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0 mr-2"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Patient Details - Right Side */}
        <div className="col-span-12 lg:col-span-9 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
          {!selectedPatient ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <User className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">اختر مريض</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                قم باختيار مريض من القائمة الجانبية لعرض الملف الطبي الكامل، بما في ذلك سجلات الحمل، الزيارات، الأدوية، والتحاليل.
              </p>
            </div>
          ) : dataLoading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient Header Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"></div>
                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm">
                      <User className="w-8 h-8 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedPatient.name}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                        {selectedPatient.husband_name && (
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                            <User className="w-3 h-3" /> الزوج: {selectedPatient.husband_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {selectedPatient.phone}
                        </span>
                        {selectedPatient.age && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {selectedPatient.age} سنة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="تعديل البيانات">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="طباعة الملف">
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
                <TabButton 
                  active={activeTab === 'overview'} 
                  onClick={() => setActiveTab('overview')} 
                  icon={<Activity className="w-4 h-4" />} 
                  label="نظرة عامة" 
                  colorClass="text-teal-600"
                />
                <TabButton 
                  active={activeTab === 'pregnancy'} 
                  onClick={() => setActiveTab('pregnancy')} 
                  icon={<Baby className="w-4 h-4" />} 
                  label="الحمل" 
                  count={pregnancies.length}
                  colorClass="text-pink-600"
                />
                <TabButton 
                  active={activeTab === 'visits'} 
                  onClick={() => setActiveTab('visits')} 
                  icon={<Stethoscope className="w-4 h-4" />} 
                  label="الكشوفات" 
                  count={visits.length}
                  colorClass="text-blue-600"
                />
                <TabButton 
                  active={activeTab === 'medications'} 
                  onClick={() => setActiveTab('medications')} 
                  icon={<Pill className="w-4 h-4" />} 
                  label="الأدوية" 
                  colorClass="text-teal-600"
                />
                <TabButton 
                  active={activeTab === 'labs'} 
                  onClick={() => setActiveTab('labs')} 
                  icon={<Microscope className="w-4 h-4" />} 
                  label="التحاليل" 
                  count={labRequests.length}
                  colorClass="text-purple-600"
                />
              </div>

              {/* Content Area */}
              <div className="min-h-[400px]">
                {renderContent()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
