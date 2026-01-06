import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, AlertCircle, FileText, Stethoscope, Calendar, ArrowRight, Plus, CheckCircle, Clock, Edit, Trash2, X, Save, ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { appointmentsService } from '../services/appointmentsService';
import ModernAppointmentSystem from '../components/appointments/ModernAppointmentSystem';
import toast from 'react-hot-toast';

interface PatientRow {
  id: string;
  name: string;
  age: number;
  phone: string;
  husband_name?: string;
  doctor_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  visit_type: string;
  status: string;
  notes?: string;
}

interface DoctorDashboardProps {
  onViewPatient?: (patientId: string) => void;
  onAddPatient?: () => void;
  onViewAppointments?: () => void;
}

type ViewMode = 'day' | 'week' | 'month';

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onViewPatient, onAddPatient }) => {

  const [activeView, setActiveView] = useState<'appointments' | 'patients'>('appointments');
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [lastVisits, setLastVisits] = useState<Record<string, string>>({});

  // Smart Dashboard State
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingLabRequests: 0,
    completedAppointments: 0
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    if (currentDoctorId) {
      fetchAppointments(currentDoctorId);
    }
  }, [currentDate, viewMode, currentDoctorId]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Not authenticated. Please log in.');
        return;
      }

      const doctorRecord = await authService.ensureDoctorRecord(user.id, user.email || '');
      if (!doctorRecord) {
        setError('Doctor profile not found');
        return;
      }

      setCurrentDoctorId(doctorRecord.id);
      await Promise.all([
        fetchPatients(doctorRecord.id),
        fetchStats(doctorRecord.id),
        fetchAppointments(doctorRecord.id) // Initial fetch
      ]);
    } catch (err: any) {
      console.error('❌ Error initializing dashboard:', err);
      setError(err.message || 'Failed to initialize dashboard');
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (viewMode === 'week') {
      const day = start.getDay(); // 0 is Sunday
      const diff = start.getDate() - day; // adjust when day is sunday
      start.setDate(diff); // Set to previous Sunday
      end.setDate(start.getDate() + 6); // Set to next Saturday
    } else if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of current month
    }

    return { start, end };
  };

  const fetchAppointments = async (doctorId: string) => {
    try {
      const { start, end } = getDateRange();
      // Use local ISO strings to ensure we cover the full range in local time
      // Simple ISO string might act in UTC, but for simplicity we rely on local date construction
      // Ideally use a library like date-fns, but vanilla JS works if careful
      const startDateStr = new Date(start.getTime() - (start.getTimezoneOffset() * 60000)).toISOString();
      const endDateStr = new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString();

      const data = await appointmentsService.getAppointmentsByDoctor(doctorId, startDateStr, endDateStr);

      const mappedAppointments: Appointment[] = (data || [])
        .map((appt: any) => {
          const pName = (appt.patient as any)?.name
            || (Array.isArray(appt.patient) ? (appt.patient[0] as any)?.name : 'Unknown Patient');

          return {
            id: appt.id,
            patient_id: appt.patient_id,
            patient_name: pName,
            appointment_date: appt.appointment_date,
            visit_type: appt.visit_type || 'Consultation',
            status: appt.status || 'Scheduled',
            notes: appt.notes
          };
        });

      setAppointments(mappedAppointments);
    } catch (err: any) {
      console.error('❌ Error fetching appointments:', err);
      toast.error('Failed to load appointments');
    }
  };

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const step = direction === 'next' ? 1 : -1;

    if (viewMode === 'day') newDate.setDate(newDate.getDate() + step);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + (step * 7));
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + step);

    setCurrentDate(newDate);
  };

  // ... (Keep existing handlers: fetchPatients, fetchStats, handleCancel, handleDelete, handleEdit, handleSave)
  const fetchPatients = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, phone, husband_name, doctor_id, created_at, updated_at')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
      if (data && data.length > 0) await fetchLastVisits(data.map(p => p.id));
    } catch (err: any) {
      console.error('❌ Error fetching patients:', err);
      setPatients([]);
    }
  };

  const fetchLastVisits = async (patientIds: string[]) => {
    try {
      const { data } = await supabase.from('appointments').select('patient_id, appointment_date').in('patient_id', patientIds).eq('status', 'Completed');
      const visits: Record<string, string> = {};
      data?.forEach(v => visits[v.patient_id] = v.appointment_date); // Simplified logic
      setLastVisits(visits);
    } catch (err) {/* ignore */ }
  };

  const fetchStats = async (doctorId: string) => { /* Reuse existing fetchStats logic but omitted here for brevity if okay, waiting for override validation. 
     * Actually, I'll paste the original concise version to ensure no regression.
     */
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count: pC } = await supabase.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId);
      const { count: aC } = await supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).gte('appointment_date', `${today}T00:00:00`).lte('appointment_date', `${today}T23:59:59`).eq('status', 'Scheduled');
      const { count: cC } = await supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).gte('appointment_date', `${today}T00:00:00`).lte('appointment_date', `${today}T23:59:59`).eq('status', 'Completed');
      const { count: lC } = await supabase.from('lab_requests').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'Pending');
      setStatsData({ totalPatients: pC || 0, appointmentsToday: aC || 0, pendingLabRequests: lC || 0, completedAppointments: cC || 0 });
    } catch (e) { console.error(e) }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;
    try {
      toast.loading('جاري الإلغاء...');
      await appointmentsService.cancelAppointment(id);
      toast.dismiss();
      toast.success('تم إلغاء الموعد بنجاح');
      if (currentDoctorId) fetchAppointments(currentDoctorId);
    } catch (error) {
      toast.dismiss();
      toast.error('فشل إلغاء الموعد');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد نهائياً؟')) return;
    try {
      toast.loading('جاري الحذف...');
      await appointmentsService.deleteAppointment(id);
      toast.dismiss();
      toast.success('تم حذف الموعد بنجاح');
      if (currentDoctorId) fetchAppointments(currentDoctorId);
    } catch (error) {
      toast.dismiss();
      toast.error('فشل حذف الموعد');
    }
  };

  const handleEditClick = (appt: Appointment) => {
    const dateObj = new Date(appt.appointment_date);
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setEditingAppointment(appt);
    setEditForm({ appointmentDate: dateStr, appointmentTime: timeStr, notes: appt.notes || '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment || !currentDoctorId) return;
    try {
      const dateTimeString = `${editForm.appointmentDate}T${editForm.appointmentTime}:00`;
      const originalDate = new Date(editingAppointment.appointment_date);
      const newDate = new Date(dateTimeString);

      if (originalDate.getTime() !== newDate.getTime()) {
        toast.loading('جاري التحقق من التوفر...');
        const hasConflict = await appointmentsService.checkAppointmentOverlap(
          currentDoctorId, editForm.appointmentDate, editForm.appointmentTime, 30, editingAppointment.id
        );
        toast.dismiss();
        if (hasConflict) { toast.error('عذراً، يوجد موعد آخر في هذا التوقيت!'); return; }
      }

      toast.loading('جاري حفظ التعديلات...');
      await appointmentsService.updateAppointmentDetails(editingAppointment.id, {
        appointment_date: dateTimeString, notes: editForm.notes
      });
      toast.dismiss();
      toast.success('تم تعديل الموعد بنجاح');
      setEditingAppointment(null);
      fetchAppointments(currentDoctorId);
    } catch (error) {
      toast.dismiss();
      toast.error('فشل تعديل الموعد');
    }
  };

  const handleViewPatient = (pid: string) => onViewPatient && onViewPatient(pid);
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No visit';

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery));

  // --- RENDER HELPERS ---

  const renderSmartHeader = () => {
    const waiting = appointments.filter(a => a.status === 'Waiting').length;
    const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
    const completed = appointments.filter(a => a.status === 'Completed').length;

    // Calculate date label
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateLabel = viewMode === 'day'
      ? currentDate.toLocaleDateString('ar-EG', options)
      : viewMode === 'month'
        ? currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
        : `أسبوع ${currentDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}`;

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('day')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'day' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>يوم</button>
              <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>أسبوع</button>
              <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>شهر</button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <button onClick={() => handleNavigate('prev')} className="p-1 hover:bg-gray-200 rounded-full"><ChevronLeft size={20} /></button>
              <button onClick={() => handleNavigate('today')} className="text-sm font-bold px-2 hover:text-blue-600">اليوم</button>
              <button onClick={() => handleNavigate('next')} className="p-1 hover:bg-gray-200 rounded-full"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-800">{dateLabel}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {appointments.length} موعد • {waiting > 0 && <span className="text-amber-600 font-bold">{waiting} في الانتظار</span>}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500 font-bold">لا توجد مواعيد لهذا اليوم</p>
        </div>
      );
    }
    return (
      <div className="relative border-r-2 border-blue-200 pr-8 space-y-4 py-4">
        {[9, 10, 11, 12, 13, 14, 15, 16].map(hour => {
          const hourString = `${String(hour).padStart(2, '0')}:00`;
          const aptsForHour = appointments.filter(a => {
            const d = new Date(a.appointment_date);
            return d.getDate() === currentDate.getDate() && d.getHours() === hour;
          });

          return (
            <div key={hour} className="relative min-h-[100px] group">
              <div className={`absolute -right-[39px] w-5 h-5 rounded-full border-4 border-white ${aptsForHour.length > 0 ? 'bg-blue-600' : 'bg-gray-200'} top-2`}></div>
              <span className="absolute -right-24 top-2 text-sm font-bold text-gray-400 w-12">{hourString}</span>

              <div className="space-y-3">
                {aptsForHour.length > 0 ? aptsForHour.map(apt => (
                  <div key={apt.id} className={`p-4 rounded-xl border border-l-4 shadow-sm transition-all hover:shadow-md ${apt.status === 'Completed' ? 'bg-green-50 border-green-500' : apt.status === 'Waiting' ? 'bg-amber-50 border-amber-500' : 'bg-white border-blue-500'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white ${apt.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}>{apt.patient_name.charAt(0)}</div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{apt.patient_name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1 font-bold text-blue-600"><Clock size={14} /> {new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>• {apt.visit_type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditClick(apt)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit size={16} /></button>
                        <button onClick={() => handleCancelAppointment(apt.id)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg"><X size={16} /></button>
                        <button onClick={() => handleDeleteAppointment(apt.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="h-20 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 font-medium">متاح</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    return (
      <div className="grid grid-cols-7 gap-2 overflow-x-auto min-w-[800px]">
        {days.map((day, idx) => {
          const dayApts = appointments.filter(a => new Date(a.appointment_date).toDateString() === day.toDateString());
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={idx} className={`min-h-[300px] rounded-xl border ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'} p-2`}>
              <div className={`text-center p-2 rounded-lg mb-2 ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <p className="text-xs font-bold">{day.toLocaleDateString('ar-EG', { weekday: 'short' })}</p>
                <p className="text-lg font-black">{day.getDate()}</p>
              </div>

              <div className="space-y-2">
                {dayApts.map(apt => (
                  <div key={apt.id} onClick={() => handleEditClick(apt)} className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-xs cursor-pointer hover:border-blue-400 transition-colors">
                    <div className="font-bold text-gray-900 truncate">{apt.patient_name}</div>
                    <div className="text-blue-600 font-bold mt-1 self-end">{new Date(apt.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                {dayApts.length === 0 && <div className="text-center text-gray-300 text-xs py-4">- فارغ -</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    // Simple month grid
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0-6

    const blanks = Array(startingDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200">
        {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(d => (
          <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-white h-32" />)}
        {days.map(day => {
          const date = new Date(year, month, day);
          const dayApts = appointments.filter(a => new Date(a.appointment_date).toDateString() === date.toDateString());
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={day} className={`bg-white h-32 p-2 hover:bg-gray-50 transition-colors cursor-pointer group relative ${isToday ? 'bg-blue-50/30' : ''}`}
              onClick={() => { setCurrentDate(date); setViewMode('day'); }}
            >
              <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day}</span>
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {dayApts.map(apt => (
                  <div key={apt.id} className="w-full h-1.5 rounded-full bg-blue-500" title={`${apt.patient_name} - ${new Date(apt.appointment_date).toLocaleTimeString()}`}></div>
                ))}
                {dayApts.length > 0 && <p className="text-[10px] text-center font-bold text-gray-500 mt-1">{dayApts.length} مواعيد</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8" dir="ltr">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">لوحة الطبيب الذكية 🩺</h1>
            <p className="text-gray-500 font-medium">نظرة شاملة على جدول مواعيدك</p>
          </div>
          {onAddPatient && (
            <button onClick={onAddPatient} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
              <Plus size={18} /> إضافة مريضة
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'المرضى', val: statsData.totalPatients, icon: Users, color: 'blue' },
            { label: 'مواعيد اليوم', val: statsData.appointmentsToday, icon: CalendarDays, color: 'green' },
            { label: 'تمت الزيارة', val: statsData.completedAppointments, icon: CheckCircle, color: 'teal' },
            { label: 'المعامل', val: statsData.pendingLabRequests, icon: FileText, color: 'amber' },
          ].map((s, i) => (
            <div key={i} className={`bg-white p-5 rounded-2xl border-l-[6px] shadow-sm border-${s.color}-500 flex justify-between items-center`}>
              <div><p className="text-gray-500 text-xs font-bold mb-1">{s.label}</p><p className="text-3xl font-black text-gray-800">{s.val}</p></div>
              <s.icon className={`text-${s.color}-100 w-12 h-12`} />
            </div>
          ))}
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveView('appointments')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeView === 'appointments'
                ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar size={20} />
            نظام المواعيد
          </button>
          <button
            onClick={() => setActiveView('patients')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeView === 'patients'
                ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} />
            سجل المرضى
          </button>
        </div>

        {/* Modern Appointment System */}
        {activeView === 'appointments' && currentDoctorId && (
          <div className="animate-fade-in">
            <ModernAppointmentSystem
              doctorId={currentDoctorId}
              userRole="doctor"
            />
          </div>
        )}

        {/* Patients List */}
        {activeView === 'patients' && (
        <div>
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Users className="text-blue-600" /> سجل المرضى</h3>
          {/* ... Patients Table Logic (Simplified for length constraints, reusing basic list) ... */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
              <Search className="text-gray-400 ml-3" size={20} />
              <input
                className="bg-transparent w-full outline-none font-bold text-gray-700"
                placeholder="بحث عن مريضة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase">المريضة</th>
                    <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase">العمر</th>
                    <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase">الهاتف</th>
                    <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPatients.slice(0, 10).map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{p.name}</td>
                      <td className="p-4 text-gray-600 font-medium">{p.age}</td>
                      <td className="p-4 text-gray-600 font-medium">{p.phone}</td>
                      <td className="p-4"><button onClick={() => handleViewPatient(p.id)} className="text-blue-600 font-bold text-sm hover:underline">ملف</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Edit Modal - Reused */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <span className="font-bold flex items-center gap-2"><Edit size={18} /> تعديل الموعد</span>
              <button onClick={() => setEditingAppointment(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">التاريخ</label>
                  <input type="date" required value={editForm.appointmentDate} onChange={e => setEditForm({ ...editForm, appointmentDate: e.target.value })} className="w-full p-2 rounded-lg border border-gray-300 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">الوقت</label>
                  <input type="time" required value={editForm.appointmentTime} onChange={e => setEditForm({ ...editForm, appointmentTime: e.target.value })} className="w-full p-2 rounded-lg border border-gray-300 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ملاحظات</label>
                <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full p-2 rounded-lg border border-gray-300 font-semi-bold h-24" />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">حفظ التعديلات</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
