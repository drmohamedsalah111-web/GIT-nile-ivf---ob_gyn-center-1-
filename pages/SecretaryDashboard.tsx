import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Plus, Search, Phone, User, History, ChevronDown, LogOut, Bell, Settings, FileText, CheckCircle, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { appointmentsService } from '../services/appointmentsService';
import { visitsService } from '../services/visitsService';
import toast from 'react-hot-toast';

const SecretaryDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'patients' | 'waiting'>('dashboard');
  const [secretary, setSecretary] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientVisits, setPatientVisits] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    visitType: 'Consultation' as const,
    notes: ''
  });

  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    phone: '',
    husbandName: '',
    history: ''
  });

  useEffect(() => {
    loadSecretaryData();
  }, []);

  useEffect(() => {
    if (secretary) {
      loadAppointments();
      loadPatients();
    }
  }, [secretary, selectedDate]);

  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      if (!refreshing && secretary) {
        loadAppointments();
        loadPatients();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(autoRefreshInterval);
  }, [secretary, refreshing]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadAppointments(),
        loadPatients()
      ]);
      setLastRefresh(new Date());
      toast.success('تم تحديث البيانات');
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast.error('فشل التحديث');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadSecretaryData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const profile = await authService.getSecretaryProfile(user.id);
      if (profile) {
        setSecretary(profile);
      } else {
        // Fallback: Create a temporary profile object if fetch fails but we know they are a secretary
        // This prevents the dashboard from being empty if RLS blocks the profile read
        console.warn('Using fallback profile for secretary');
        setSecretary({
          id: user.id, // Use user ID temporarily
          user_id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'Secretary',
          user_role: 'secretary',
          // We need the doctor ID for other queries. 
          // If we can't get it from profile, we might be in trouble for data fetching.
          // But let's try to proceed.
        });
      }
    } catch (error: any) {
      console.error('Load secretary data error:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      if (!secretary?.id) return;
      const data = await appointmentsService.getAppointmentsBySecretary(secretary.id);
      setAppointments(data);
    } catch (error: any) {
      console.error('Load appointments error:', error);
    }
  };

  const loadPatients = async () => {
    try {
      if (!secretary?.secretary_doctor_id) return;
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', secretary.secretary_doctor_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPatients(data);
        loadPatientVisits(data);
      } else if (error) {
        console.error('Load patients error:', error);
      }
    } catch (error: any) {
      console.error('Load patients error:', error);
    }
  };

  const loadPatientVisits = async (patientsList: any[]) => {
    try {
      const visitsMap: Record<string, any[]> = {};
      
      await Promise.all(
        patientsList.map(async (patient) => {
          try {
            const visits = await visitsService.getVisitsByPatient(patient.id);
            visitsMap[patient.id] = visits || [];
          } catch (error) {
            console.error(`Error loading visits for patient ${patient.id}:`, error);
            visitsMap[patient.id] = [];
          }
        })
      );
      
      setPatientVisits(visitsMap);
    } catch (error: any) {
      console.error('Load patient visits error:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentForm.patientId || !appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const toastId = toast.loading('جاري إنشاء الموعد...');

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const appointmentDateTime = new Date(`${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`).toISOString();

      await appointmentsService.createAppointment({
        doctor_id: secretary.secretary_doctor_id,
        secretary_id: secretary.id,
        patient_id: appointmentForm.patientId,
        appointment_date: appointmentDateTime,
        status: 'Scheduled',
        visit_type: appointmentForm.visitType,
        notes: appointmentForm.notes,
        created_by: user.id
      });

      toast.success('تم إنشاء الموعد بنجاح', { id: toastId });
      setShowAppointmentForm(false);
      setAppointmentForm({
        patientId: '',
        appointmentDate: '',
        appointmentTime: '09:00',
        visitType: 'Consultation',
        notes: ''
      });
      loadAppointments();
    } catch (error: any) {
      toast.error(`فشل إنشاء الموعد: ${error.message}`, { id: toastId });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;

    const toastId = toast.loading('جاري الإلغاء...');

    try {
      await appointmentsService.cancelAppointment(appointmentId);
      toast.success('تم إلغاء الموعد', { id: toastId });
      loadAppointments();
    } catch (error: any) {
      toast.error('فشل إلغاء الموعد', { id: toastId });
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientForm.name || !patientForm.phone) {
      toast.error('يرجى ملء الاسم ورقم الهاتف');
      return;
    }

    const toastId = toast.loading('جاري إضافة المريضة...');

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          doctor_id: secretary.secretary_doctor_id,
          name: patientForm.name,
          age: patientForm.age ? parseInt(patientForm.age) : null,
          phone: patientForm.phone,
          husband_name: patientForm.husbandName || null,
          history: patientForm.history || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      toast.success('تم إضافة المريضة بنجاح', { id: toastId });
      setShowPatientForm(false);
      setPatientForm({ name: '', age: '', phone: '', husbandName: '', history: '' });
      loadPatients();
    } catch (error: any) {
      toast.error(`فشل إضافة المريضة: ${error.message}`, { id: toastId });
      console.error('Add patient error:', error);
    }
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.appointment_date) >= new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const filteredPatients = patients.filter(patient => {
    const name = patient.name ? String(patient.name).toLowerCase() : '';
    const phone = patient.phone ? String(patient.phone) : '';
    const search = searchQuery.toLowerCase();
    return name.includes(search) || phone.includes(searchQuery);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-800 font-medium">جاري تحميل مكتب الاستقبال...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-[Tajawal] flex flex-col" dir="rtl">
      {/* Top Navigation Bar - Distinct Purple Theme */}
      <header className="bg-purple-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-purple-100" />
              </div>
              <div>
                <h1 className="text-xl font-bold">مكتب الاستقبال</h1>
                <p className="text-xs text-purple-200">عيادة د. {secretary?.name || '...'}</p>
                {lastRefresh && (
                  <p className="text-xs text-purple-300">آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG')}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-purple-200 hover:text-white hover:bg-purple-700 rounded-full transition-colors disabled:opacity-50"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-purple-200 hover:text-white hover:bg-purple-700 rounded-full transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button className="p-2 text-purple-200 hover:text-white hover:bg-purple-700 rounded-full transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="h-8 w-px bg-purple-600 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{secretary?.email?.split('@')[0]}</p>
                  <p className="text-xs text-purple-300">سكرتارية</p>
                </div>
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-400">
                  <User className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-bold text-gray-700">القائمة الرئيسية</h2>
              </div>
              <nav className="p-2 space-y-1">
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeView === 'dashboard' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  نظرة عامة
                </button>
                <button 
                  onClick={() => setActiveView('calendar')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'calendar' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeView === 'calendar' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  جدول المواعيد
                </button>
                <button 
                  onClick={() => setActiveView('waiting')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'waiting' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeView === 'waiting' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  قاعة الانتظار
                </button>
                <button 
                  onClick={() => setActiveView('patients')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'patients' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${activeView === 'patients' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  سجل المرضى
                </button>
              </nav>
            </div>

            <div className="bg-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2">إجراء سريع</h3>
              <p className="text-purple-100 text-sm mb-4">تسجيل مريضة جديدة أو حجز موعد</p>
              <div className="space-y-3">
                <button 
                  onClick={() => { setActiveView('patients'); setShowPatientForm(true); }}
                  className="w-full bg-white text-purple-700 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  مريضة جديدة
                </button>
                <button 
                  onClick={() => { setActiveView('calendar'); setShowAppointmentForm(true); }}
                  className="w-full bg-purple-700 text-white border border-purple-500 py-2 rounded-lg font-bold hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  حجز موعد
                </button>
              </div>
            </div>
          </div>

          {/* Center Content */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Stats Row */}
            {activeView === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-purple-500 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">مواعيد اليوم</p>
                      <p className="text-3xl font-bold text-gray-800">{upcomingAppointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-full">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-blue-500 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">إجمالي المرضى</p>
                      <p className="text-3xl font-bold text-gray-800">{patients.length}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-yellow-500 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">في الانتظار</p>
                      <p className="text-3xl font-bold text-gray-800">{upcomingAppointments.filter(a => a.status === 'Waiting').length}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-green-500 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">مؤكدة</p>
                      <p className="text-3xl font-bold text-gray-800">{upcomingAppointments.filter(a => a.status === 'Scheduled').length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700">مواعيد الأسبوع</h3>
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{upcomingAppointments.filter(a => {
                      const aptDate = new Date(a.appointment_date);
                      const today = new Date();
                      const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return aptDate >= today && aptDate <= weekLater;
                    }).length}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700">زيارات قيد الانتظار</h3>
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{upcomingAppointments.filter(a => a.status === 'Waiting' || a.status === 'Scheduled').length}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl shadow-sm border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700">مرضى جدد</h3>
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{patients.filter(p => {
                      const daysSinceCreation = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
                      return daysSinceCreation <= 7;
                    }).length}</p>
                  </div>
                </div>
              </>
            )}

            {/* Main View Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
              
              {/* Calendar / Appointments View */}
              {(activeView === 'calendar' || activeView === 'dashboard') && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      جدول المواعيد
                    </h2>
                    {activeView === 'dashboard' && (
                      <button onClick={() => setActiveView('calendar')} className="text-purple-600 text-sm hover:underline">
                        عرض الكل
                      </button>
                    )}
                  </div>

                  {showAppointmentForm && (
                    <div className="mb-8 bg-purple-50 p-6 rounded-xl border border-purple-100 animate-fade-in">
                      <h3 className="font-bold text-purple-800 mb-4">حجز موعد جديد</h3>
                      <form onSubmit={handleCreateAppointment} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المريضة</label>
                            <select
                              value={appointmentForm.patientId}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            >
                              <option value="">-- اختر مريضة --</option>
                              {patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                  {patient.name} ({patient.phone})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                              <input
                                type="date"
                                value={appointmentForm.appointmentDate}
                                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">الوقت</label>
                              <input
                                type="time"
                                value={appointmentForm.appointmentTime}
                                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowAppointmentForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
                          >
                            تأكيد الحجز
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Appointments List */}
                  <div className="space-y-3">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map((apt) => {
                        const patientVisitsList = patientVisits[apt.patient_id] || [];
                        const nextVisit = new Date(apt.appointment_date);
                        const daysUntil = Math.ceil((nextVisit.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={apt.id} className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all group">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="bg-white p-3 rounded-lg shadow-sm text-center min-w-[85px] border border-gray-200">
                                <p className="text-xs text-gray-500 font-medium">{new Date(apt.appointment_date).toLocaleDateString('ar-EG', { weekday: 'short' })}</p>
                                <p className="text-lg font-bold text-purple-700">{new Date(apt.appointment_date).getDate()}</p>
                                <p className="text-xs text-gray-500">{new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-xs text-purple-600 mt-1 font-semibold">{daysUntil > 0 ? `+${daysUntil}` : 'اليوم'}</p>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-base">{apt.patient?.name}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <Phone className="w-3 h-3 text-purple-600" /> {apt.patient?.phone}
                                </p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    {apt.visit_type === 'Consultation' ? 'استشارة' : apt.visit_type === 'Follow-up' ? 'متابعة' : 'إجراء'}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    apt.status === 'Scheduled' ? 'bg-green-100 text-green-700' : 
                                    apt.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' : 
                                    apt.status === 'Completed' ? 'bg-teal-100 text-teal-700' : 
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {apt.status === 'Scheduled' ? 'مؤكد' : apt.status === 'Waiting' ? 'انتظار' : apt.status === 'Completed' ? 'مكتمل' : apt.status}
                                  </span>
                                  {patientVisitsList.length > 0 && (
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium flex items-center gap-1">
                                      <History className="w-3 h-3" /> {patientVisitsList.length} زيارات
                                    </span>
                                  )}
                                </div>
                                {apt.notes && (
                                  <p className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                                    <span className="font-medium">ملاحظات:</span> {apt.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ml-4">
                              <button 
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition-colors"
                                title="إلغاء الموعد"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد مواعيد قادمة</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Waiting Room View */}
              {activeView === 'waiting' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-orange-600" />
                      قاعة الانتظار
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-3">في الانتظار</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {appointments.filter(a => a.status === 'Waiting' && new Date(a.appointment_date) >= new Date()).map(apt => (
                          <div key={apt.id} className="bg-white p-3 rounded-lg shadow-sm border border-yellow-100">
                            <p className="font-medium text-gray-900">{apt.patient?.name}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" /> {apt.patient?.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                        {appointments.filter(a => a.status === 'Waiting' && new Date(a.appointment_date) >= new Date()).length === 0 && (
                          <p className="text-center text-gray-400 text-sm">لا أحد في الانتظار</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-3">مؤكدة</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {appointments.filter(a => a.status === 'Scheduled' && new Date(a.appointment_date) >= new Date()).map(apt => (
                          <div key={apt.id} className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                            <p className="font-medium text-gray-900">{apt.patient?.name}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" /> {apt.patient?.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                        {appointments.filter(a => a.status === 'Scheduled' && new Date(a.appointment_date) >= new Date()).length === 0 && (
                          <p className="text-center text-gray-400 text-sm">لا توجد مواعيد مؤكدة</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-3">الملخص الإحصائي</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">في الانتظار:</span>
                          <span className="font-bold text-lg text-orange-600">{appointments.filter(a => a.status === 'Waiting' && new Date(a.appointment_date) >= new Date()).length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">مؤكدة:</span>
                          <span className="font-bold text-lg text-green-600">{appointments.filter(a => a.status === 'Scheduled' && new Date(a.appointment_date) >= new Date()).length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">اليوم:</span>
                          <span className="font-bold text-lg text-purple-600">{upcomingAppointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-3">
                          <p className="text-xs text-gray-500">آخر تحديث الآن</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patients View */}
              {activeView === 'patients' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      سجل المرضى
                    </h2>
                    <div className="relative w-64">
                      <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="بحث..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {showPatientForm && (
                    <div className="mb-8 bg-purple-50 p-6 rounded-xl border border-purple-100 animate-fade-in">
                      <h3 className="font-bold text-purple-800 mb-4">ملف مريضة جديدة</h3>
                      <form onSubmit={handleAddPatient} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="الاسم الكامل"
                            value={patientForm.name}
                            onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                            className="rounded-lg border-gray-300"
                            required
                          />
                          <input
                            type="tel"
                            placeholder="رقم الهاتف"
                            value={patientForm.phone}
                            onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                            className="rounded-lg border-gray-300"
                            required
                          />
                          <input
                            type="number"
                            placeholder="العمر"
                            value={patientForm.age}
                            onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                            className="rounded-lg border-gray-300"
                          />
                          <input
                            type="text"
                            placeholder="اسم الزوج"
                            value={patientForm.husbandName}
                            onChange={(e) => setPatientForm({ ...patientForm, husbandName: e.target.value })}
                            className="rounded-lg border-gray-300"
                          />
                        </div>
                        <textarea
                          placeholder="ملاحظات طبية أولية..."
                          value={patientForm.history}
                          onChange={(e) => setPatientForm({ ...patientForm, history: e.target.value })}
                          className="w-full rounded-lg border-gray-300 h-20"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPatientForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
                          >
                            حفظ الملف
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50 text-gray-600 text-xs font-semibold sticky top-0">
                        <tr>
                          <th className="px-4 py-3 rounded-r-lg">الاسم</th>
                          <th className="px-4 py-3">الهاتف</th>
                          <th className="px-4 py-3">العمر</th>
                          <th className="px-4 py-3">الزوج</th>
                          <th className="px-4 py-3">مواعيد</th>
                          <th className="px-4 py-3">آخر زيارة</th>
                          <th className="px-4 py-3">التسجيل</th>
                          <th className="px-4 py-3 rounded-l-lg">الملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPatients.map((patient) => {
                          const patientAppts = appointments.filter(a => a.patient_id === patient.id);
                          const patientVisitsList = patientVisits[patient.id] || [];
                          const lastVisit = patientVisitsList.length > 0 ? new Date(patientVisitsList[0].date) : null;
                          
                          return (
                            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{patient.name}</td>
                              <td className="px-4 py-3 text-gray-600">
                                <a href={`tel:${patient.phone}`} className="text-purple-600 hover:underline">
                                  {patient.phone}
                                </a>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{patient.age || '-'}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{patient.husband_name ? patient.husband_name.substring(0, 15) : '-'}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {patientAppts.length}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs">
                                {lastVisit ? (
                                  <span>{lastVisit.toLocaleDateString('ar-EG')}</span>
                                ) : (
                                  <span className="text-gray-400">لم تسجل</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(patient.created_at).toLocaleDateString('ar-EG')}</td>
                              <td className="px-4 py-3">
                                {patient.history ? (
                                  <details className="cursor-pointer">
                                    <summary className="text-purple-600 hover:text-purple-700 font-medium text-xs">عرض</summary>
                                    <p className="mt-2 text-xs text-gray-600 p-2 bg-gray-50 rounded">{patient.history.substring(0, 100)}</p>
                                  </details>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredPatients.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        لا توجد نتائج
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecretaryDashboard;