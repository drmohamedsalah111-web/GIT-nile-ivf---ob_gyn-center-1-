import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Plus, Search, Phone, User, History, ChevronDown, LogOut, Bell, Settings, FileText, CheckCircle, AlertCircle, Zap, RefreshCw, Receipt, DollarSign, LayoutDashboard } from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { appointmentsService } from '../services/appointmentsService';
import { visitsService } from '../services/visitsService';
import { InvoicesManagementPage } from '../components/invoices';
import CollectionsManagement from '../components/invoices/CollectionsManagement';
import toast from 'react-hot-toast';

const SecretaryDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'patients' | 'waiting' | 'invoices' | 'collections'>('dashboard');
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

  const loadSecretaryData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const profile = await authService.getSecretaryProfile(user.id);
      if (profile) {
        setSecretary(profile);
      } else {
        console.warn('Using fallback profile for secretary');
        setSecretary({
          id: user.id,
          user_id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'Secretary',
          user_role: 'secretary',
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
      if (!secretary?.secretary_doctor_id) {
        setAppointments([]);
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, husband_name),
          doctor_details:doctors!appointments_doctor_id_fkey(id, name, email)
        `)
        .eq('doctor_id', secretary.secretary_doctor_id)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Load appointments error:', error);
        setAppointments([]);
        return;
      }
      setAppointments(data || []);
    } catch (error: any) {
      setAppointments([]);
    }
  };

  const loadPatients = async () => {
    try {
      if (!secretary?.secretary_doctor_id) {
        setPatients([]);
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', secretary.secretary_doctor_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Load patients error:', error);
        setPatients([]);
        return;
      }

      setPatients(data || []);

      if (data && data.length > 0) {
        await loadPatientVisits(data);
      }
    } catch (error: any) {
      setPatients([]);
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
    if (!secretary?.secretary_doctor_id) {
      toast.error('⚠️ السكرتيرة غير مربوطة بطبيب!');
      return;
    }

    const toastId = toast.loading('جاري إنشاء الموعد...');
    try {
      const user = await authService.getCurrentUser();
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

      toast.success('✅ تم إنشاء الموعد بنجاح', { id: toastId });
      setShowAppointmentForm(false);
      setAppointmentForm({ patientId: '', appointmentDate: '', appointmentTime: '09:00', visitType: 'Consultation', notes: '' });
      await loadAppointments();
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
      const { error } = await supabase
        .from('patients')
        .insert([{
          doctor_id: secretary.secretary_doctor_id,
          name: patientForm.name,
          age: patientForm.age ? parseInt(patientForm.age) : null,
          phone: patientForm.phone,
          husband_name: patientForm.husbandName || null,
          medical_history: patientForm.history ? { notes: patientForm.history } : {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('تم إضافة المريضة بنجاح', { id: toastId });
      setShowPatientForm(false);
      setPatientForm({ name: '', age: '', phone: '', husbandName: '', history: '' });
      loadPatients();
    } catch (error: any) {
      toast.error(`فشل إضافة المريضة: ${error.message}`, { id: toastId });
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-textSecondary font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'calendar', label: 'المواعيد', icon: Calendar },
    { id: 'waiting', label: 'الانتظار', icon: Clock },
    { id: 'patients', label: 'المرضى', icon: Users },
    { id: 'invoices', label: 'الفواتير', icon: Receipt },
    { id: 'collections', label: 'التحصيل', icon: DollarSign },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ⚠️ Warning if not linked */}
      {!secretary?.secretary_doctor_id && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div className="flex-1">
            <h3 className="text-red-900 font-black">حساب غير مكتمل</h3>
            <p className="text-red-700 text-sm font-bold">يرجى التواصل مع الإدارة لربط حسابك بطبيب لتتمكن من إضافة بيانات.</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-zinc-800 p-2 rounded-2xl border border-borderColor/50 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black transition-all duration-300 ${isActive
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'text-textSecondary hover:bg-brand/5 hover:text-brand'
                  }`}
              >
                <Icon size={18} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Banner for Actions */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-brand to-brand/80 p-6 rounded-3xl shadow-xl shadow-brand/10 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">تسجيل مريضة جديدة</h2>
              <p className="opacity-80 font-bold mb-4">إنشاء ملف طبي وسجل زيارات بشكل سريع</p>
              <button
                onClick={() => { setActiveView('patients'); setShowPatientForm(true); }}
                className="bg-white text-brand px-6 py-2.5 rounded-xl font-black hover:scale-105 transition-all text-sm"
              >
                فتح نموذج التسجيل
              </button>
            </div>
            <Users size={120} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-6 rounded-3xl shadow-xl shadow-indigo-500/10 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">حجز موعد مريضة</h2>
              <p className="opacity-80 font-bold mb-4">تحديد موعد جديد لاستشارة أو متابعة حمل</p>
              <button
                onClick={() => { setActiveView('calendar'); setShowAppointmentForm(true); }}
                className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-black hover:scale-105 transition-all text-sm"
              >
                حجز موعد الآن
              </button>
            </div>
            <Calendar size={120} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-borderColor/50 shadow-sm min-h-[500px] overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-brand/5 p-6 rounded-3xl border border-brand/10">
                <p className="text-brand font-black text-sm uppercase tracking-widest mb-1">مواعيد اليوم</p>
                <h4 className="text-4xl font-black text-foreground">
                  {upcomingAppointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length}
                </h4>
              </div>
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <p className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-1">إجمالي المرضى</p>
                <h4 className="text-4xl font-black text-foreground">{patients.length}</h4>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <p className="text-amber-600 font-black text-sm uppercase tracking-widest mb-1">في الانتظار</p>
                <h4 className="text-4xl font-black text-foreground">
                  {upcomingAppointments.filter(a => a.status === 'Waiting').length}
                </h4>
              </div>
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                <p className="text-green-600 font-black text-sm uppercase tracking-widest mb-1">مواعيد مؤكدة</p>
                <h4 className="text-4xl font-black text-foreground">
                  {upcomingAppointments.filter(a => a.status === 'Scheduled').length}
                </h4>
              </div>
            </div>

            {/* Quick Recent List */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-foreground border-r-4 border-brand pr-4">أحدث المواعيد</h3>
              <div className="grid gap-3">
                {upcomingAppointments.slice(0, 5).map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-borderColor/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-foreground">{apt.patient?.name}</p>
                        <p className="text-xs text-textSecondary font-bold">{new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${apt.status === 'Waiting' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {apt.status === 'Waiting' ? 'انتظار' : 'مؤكد'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-foreground">جدول المواعيد</h2>
              <button
                onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-black hover:scale-105 transition-all shadow-lg shadow-brand/20"
              >
                <Plus size={18} /> حجز موعد جديد
              </button>
            </div>

            {showAppointmentForm && (
              <div className="bg-surface/50 p-6 rounded-3xl border border-borderColor shadow-inner mb-8">
                <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-textSecondary uppercase mr-2">المريضة</label>
                    <select
                      value={appointmentForm.patientId}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                      className="w-full bg-white rounded-xl border-borderColor py-3 font-bold text-sm focus:ring-brand"
                      required
                    >
                      <option value="">-- اختر مريضة --</option>
                      {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-textSecondary uppercase mr-2">التاريخ</label>
                      <input
                        type="date"
                        value={appointmentForm.appointmentDate}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                        className="w-full bg-white rounded-xl border-borderColor py-3 font-bold text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-textSecondary uppercase mr-2">الوقت</label>
                      <input
                        type="time"
                        value={appointmentForm.appointmentTime}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                        className="w-full bg-white rounded-xl border-borderColor py-3 font-bold text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setShowAppointmentForm(false)} className="px-6 py-2.5 rounded-xl font-black text-textSecondary hover:bg-surface transition-all">إلغاء</button>
                    <button type="submit" className="px-8 py-2.5 rounded-xl font-black bg-brand text-white shadow-lg">تأكيد الحجز</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {upcomingAppointments.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-borderColor/30 hover:border-brand/40 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="text-center bg-white px-4 py-2 rounded-2xl border border-borderColor shadow-sm">
                      <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">{new Date(apt.appointment_date).toLocaleDateString('ar-EG', { weekday: 'short' })}</p>
                      <p className="text-xl font-black text-brand leading-none">{new Date(apt.appointment_date).getDate()}</p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-foreground">{apt.patient?.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-textSecondary">
                          <Phone size={12} className="text-brand" /> {apt.patient?.phone}
                        </span>
                        <span className="px-3 py-1 bg-brand/5 text-[9px] font-black text-brand uppercase rounded-full border border-brand/10">
                          {apt.visit_type === 'Consultation' ? 'استشارة' : 'متابعة'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleCancelAppointment(apt.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-black transition-all">إلغاء الموعد</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting View */}
        {activeView === 'waiting' && (
          <div className="p-8">
            <h2 className="text-2xl font-black text-foreground mb-8">إدارة قاعة الانتظار</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-amber-50 rounded-3xl border border-amber-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-xl font-black text-amber-900">في الانتظار حالياً</h3>
                </div>
                <div className="space-y-3">
                  {appointments.filter(a => a.status === 'Waiting').map(apt => (
                    <div key={apt.id} className="bg-white p-4 rounded-2xl border border-amber-200/50 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900">{apt.patient?.name}</p>
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">وصل الساعة: {new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <Zap size={16} className="text-amber-400 animate-pulse" />
                    </div>
                  ))}
                  {appointments.filter(a => a.status === 'Waiting').length === 0 && (
                    <p className="text-center py-8 text-amber-600/50 font-bold">لا توجد حالات في الانتظار</p>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-3xl border border-green-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="text-xl font-black text-green-900">مواعيد مؤكدة قادمة</h3>
                </div>
                <div className="space-y-3">
                  {appointments.filter(a => a.status === 'Scheduled' && new Date(a.appointment_date).toDateString() === new Date().toDateString()).map(apt => (
                    <div key={apt.id} className="bg-white p-4 rounded-2xl border border-green-200/50 shadow-sm">
                      <p className="font-black text-gray-900">{apt.patient?.name}</p>
                      <p className="text-[10px] font-bold text-green-600 mt-0.5">الموعد: {new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patients View */}
        {activeView === 'patients' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl font-black text-foreground">سجل المرضى</h2>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute right-3 top-3 text-textSecondary" size={18} />
                  <input
                    type="text"
                    placeholder="بحث في السجلات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border-borderColor bg-surface/50 font-bold text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowPatientForm(!showPatientForm)}
                  className="bg-brand text-white px-6 py-2.5 rounded-xl font-black hover:scale-105 transition-all shadow-lg shadow-brand/20 whitespace-nowrap"
                >
                  <Plus size={18} /> مريضة جديدة
                </button>
              </div>
            </div>

            {showPatientForm && (
              <div className="bg-surface/50 p-8 rounded-3xl border border-borderColor shadow-inner mb-8 animate-fade-in-up">
                <h3 className="text-xl font-black text-brand mb-6">إنشاء ملف مريضة جديدة</h3>
                <form onSubmit={handleAddPatient} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-textSecondary uppercase mr-2">الاسم الكامل</label>
                    <input type="text" placeholder="مثال: سارة محمد علي" value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} className="w-full rounded-xl border-borderColor py-3 font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-textSecondary uppercase mr-2">رقم الهاتف</label>
                    <input type="tel" placeholder="010XXXXXXXX" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} className="w-full rounded-xl border-borderColor py-3 font-bold" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-textSecondary uppercase mr-2">العمر</label>
                      <input type="number" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })} className="w-full rounded-xl border-borderColor py-3 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-textSecondary uppercase mr-2">اسم الزوج</label>
                      <input type="text" value={patientForm.husbandName} onChange={(e) => setPatientForm({ ...patientForm, husbandName: e.target.value })} className="w-full rounded-xl border-borderColor py-3 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-textSecondary uppercase mr-2">ملاحظات أولية</label>
                    <textarea value={patientForm.history} onChange={(e) => setPatientForm({ ...patientForm, history: e.target.value })} className="w-full rounded-xl border-borderColor h-24 font-bold p-3" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setShowPatientForm(false)} className="px-6 py-2.5 rounded-xl font-black text-textSecondary">إلغاء</button>
                    <button type="submit" className="px-12 py-2.5 rounded-xl font-black bg-brand text-white shadow-lg">حفظ الملف</button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-surface text-textSecondary text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 rounded-r-2xl">الاسم</th>
                    <th className="px-6 py-4">الهاتف</th>
                    <th className="px-6 py-4">الزوج</th>
                    <th className="px-6 py-4">الزيارات</th>
                    <th className="px-6 py-4 rounded-l-2xl">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderColor/20">
                  {filteredPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-brand/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-black text-foreground">{patient.name}</td>
                      <td className="px-6 py-4 font-bold text-textSecondary">{patient.phone}</td>
                      <td className="px-6 py-4 text-xs font-bold text-textSecondary">{patient.husband_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-brand/10 text-brand px-3 py-1 rounded-lg text-xs font-black">
                          {patientVisits[patient.id]?.length || 0} زيارة
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-textSecondary">
                        {new Date(patient.created_at).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices and Collections Views - Unchanged Logic, just styled within container */}
        {activeView === 'invoices' && secretary && (
          <div className="p-4">
            <InvoicesManagementPage
              secretaryId={secretary.user_id || secretary.id}
              doctorId={secretary.secretary_doctor_id}
              secretaryName={secretary.name || secretary.email?.split('@')[0] || 'السكرتيرة'}
            />
          </div>
        )}

        {activeView === 'collections' && secretary && secretary.secretary_doctor_id && (
          <div className="p-4">
            <CollectionsManagement
              doctorId={secretary.secretary_doctor_id}
              secretaryId={secretary.user_id || secretary.id}
              secretaryName={secretary.name || secretary.email?.split('@')[0] || 'السكرتيرة'}
            />
          </div>
        )}

        {activeView === 'collections' && secretary && !secretary.secretary_doctor_id && (
          <div className="p-4">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
              <div className="text-yellow-600 mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">لم يتم ربط حساب السكرتيرة بدكتور</h3>
              <p className="text-yellow-700">يرجى التواصل مع المدير لربط حسابك بدكتور معين</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretaryDashboard;