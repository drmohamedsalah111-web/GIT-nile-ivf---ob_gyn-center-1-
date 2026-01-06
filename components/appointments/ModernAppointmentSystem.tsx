import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Calendar, Clock, User, Phone, FileText, Search, Filter,
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Check, X,
  AlertCircle, Info, TrendingUp, Users, CalendarDays, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// ==================== Types ====================
interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'normal' | 'urgent' | 'follow_up';
  notes?: string;
  reminder_sent: boolean;
  created_at: string;
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

interface Stats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  todayAppointments: number;
}

type ViewMode = 'day' | 'week' | 'month' | 'list';

// ==================== Modern Appointment System Component ====================
interface ModernAppointmentSystemProps {
  doctorId: string;
  userRole: 'secretary' | 'doctor';
}

const ModernAppointmentSystem: React.FC<ModernAppointmentSystemProps> = ({ doctorId, userRole }) => {
  // ==================== State ====================
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    todayAppointments: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    priority: 'normal' as 'normal' | 'urgent' | 'follow_up',
    notes: ''
  });

  // ==================== Load Data ====================
  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, [doctorId, selectedDate, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAppointments(),
        loadPatients(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    const { startDate, endDate } = getDateRange();
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        throw error;
      }

      // Load patient and doctor details separately
      if (data && data.length > 0) {
        const patientIds = [...new Set(data.map(apt => apt.patient_id))];
        
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, name, phone')
          .in('id', patientIds);

        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id, full_name')
          .eq('id', doctorId)
          .single();

        const patientsMap = new Map(patientsData?.map(p => [p.id, p]) || []);

        const formattedAppointments = data.map(apt => ({
          ...apt,
          patient_name: patientsMap.get(apt.patient_id)?.name,
          patient_phone: patientsMap.get(apt.patient_id)?.phone,
          doctor_name: doctorData?.full_name,
          priority: apt.priority || 'normal',
          reminder_sent: apt.reminder_sent || false
        }));

        setAppointments(formattedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error: any) {
      console.error('❌ Error in loadAppointments:', error);
      toast.error('حدث خطأ في تحميل المواعيد: ' + (error.message || 'خطأ غير معروف'));
      setAppointments([]);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone')
        .order('name');

      if (error) {
        console.error('Error loading patients:', error);
        throw error;
      }
      
      setPatients(data || []);
    } catch (error: any) {
      console.error('❌ Error in loadPatients:', error);
      toast.error('حدث خطأ في تحميل المرضى: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('status, appointment_date')
        .eq('doctor_id', doctorId);

      if (error) {
        console.error('Error loading stats:', error);
        throw error;
      }

      const total = data?.length || 0;
      const scheduled = data?.filter(a => a.status === 'scheduled' || a.status === 'Scheduled' || a.status === 'confirmed').length || 0;
      const completed = data?.filter(a => a.status === 'completed' || a.status === 'Completed').length || 0;
      const cancelled = data?.filter(a => a.status === 'cancelled' || a.status === 'Cancelled').length || 0;
      const todayAppointments = data?.filter(a => a.appointment_date === today).length || 0;

      setStats({ total, scheduled, completed, cancelled, todayAppointments });
    } catch (error: any) {
      console.error('❌ Error in loadStats:', error);
      // Don't show error toast for stats, just log it
      setStats({ total: 0, scheduled: 0, completed: 0, cancelled: 0, todayAppointments: 0 });
    }
  };

  // ==================== Real-time Subscription ====================
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // ==================== Date Range Helper ====================
  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === 'day') {
      // Same day
    } else if (viewMode === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(start.getDate() + 6);
    } else if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // ==================== CRUD Operations ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error('برجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', formData.appointment_date)
        .eq('appointment_time', formData.appointment_time)
        .in('status', ['scheduled', 'Scheduled', 'confirmed', 'in_progress']);

      if (conflicts && conflicts.length > 0 && !editingAppointment) {
        toast.error('يوجد موعد آخر في نفس الوقت');
        setLoading(false);
        return;
      }

      const appointmentData: any = {
        patient_id: formData.patient_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        notes: formData.notes
      };

      // Only add priority if the column exists (optional field)
      if (formData.priority) {
        appointmentData.priority = formData.priority;
      }

      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingAppointment.id);

        if (error) throw error;
        toast.success('تم تحديث الموعد بنجاح');
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([{
            doctor_id: doctorId,
            ...appointmentData,
            status: 'Scheduled',
            reminder_sent: false
          }]);

        if (error) throw error;
        toast.success('تم إضافة الموعد بنجاح');
      }

      closeModal();
      loadData();
    } catch (error: any) {
      console.error('❌ Error saving appointment:', error);
      toast.error('حدث خطأ في حفظ الموعد: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف الموعد بنجاح');
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('حدث خطأ في حذف الموعد');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    try {
      // Map modern statuses to existing database statuses
      const statusMap: Record<string, string> = {
        'scheduled': 'Scheduled',
        'confirmed': 'Scheduled',
        'in_progress': 'Waiting',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'no_show': 'Cancelled'
      };

      const dbStatus = statusMap[newStatus] || newStatus;

      const { error } = await supabase
        .from('appointments')
        .update({ status: dbStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('تم تحديث حالة الموعد');
      loadData();
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      toast.error('حدث خطأ في تحديث الحالة: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  // ==================== Modal Handlers ====================
  const openModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        priority: appointment.priority,
        notes: appointment.notes || ''
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        patient_id: '',
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: '',
        priority: 'normal',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setFormData({
      patient_id: '',
      appointment_date: '',
      appointment_time: '',
      priority: 'normal',
      notes: ''
    });
  };

  // ==================== Navigation ====================
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // ==================== Time Slots Generator ====================
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 20;
    const interval = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const dateString = selectedDate.toISOString().split('T')[0];
        
        const appointment = appointments.find(
          apt => apt.appointment_date === dateString && apt.appointment_time === timeString
        );

        slots.push({
          time: timeString,
          available: !appointment,
          appointment
        });
      }
    }

    return slots;
  };

  // ==================== Filtered Appointments ====================
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = searchTerm === '' || 
        apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient_phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // ==================== Status Badge ====================
  const getStatusBadge = (status: Appointment['status']) => {
    // Normalize status to handle both old and new formats
    const normalizedStatus = status?.toLowerCase();
    
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'محجوز', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      confirmed: { label: 'مؤكد', className: 'bg-green-100 text-green-800 border-green-300' },
      waiting: { label: 'في الانتظار', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      in_progress: { label: 'جاري', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      completed: { label: 'مكتمل', className: 'bg-gray-100 text-gray-800 border-gray-300' },
      cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800 border-red-300' },
      no_show: { label: 'لم يحضر', className: 'bg-orange-100 text-orange-800 border-orange-300' }
    };

    const config = statusConfig[normalizedStatus] || statusConfig['scheduled'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: Appointment['priority']) => {
    const priorityConfig = {
      normal: { label: 'عادي', className: 'bg-gray-100 text-gray-700' },
      urgent: { label: 'عاجل', className: 'bg-red-100 text-red-700' },
      follow_up: { label: 'متابعة', className: 'bg-blue-100 text-blue-700' }
    };

    const config = priorityConfig[priority];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // ==================== Date Display ====================
  const getDateRangeDisplay = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };

    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('ar-EG', options);
    } else if (viewMode === 'week') {
      const { startDate, endDate } = getDateRange();
      return `${new Date(startDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} - ${new Date(endDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
    }
  };

  // ==================== Render ====================
  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">نظام المواعيد الحديث</h2>
            <p className="text-teal-100">إدارة احترافية للمواعيد والحجوزات</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            موعد جديد
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                <div className="text-sm text-teal-100">اليوم</div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
                <div className="text-sm text-teal-100">قادم</div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-teal-100">مكتمل</div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <X className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
                <div className="text-sm text-teal-100">ملغي</div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-teal-100">إجمالي</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* View Mode Selector */}
          <div className="flex gap-2">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode === 'day' && 'يومي'}
                {mode === 'week' && 'أسبوعي'}
                {mode === 'month' && 'شهري'}
                {mode === 'list' && 'قائمة'}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          {viewMode !== 'list' && (
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center font-semibold text-gray-800">
                {getDateRangeDisplay()}
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium"
              >
                اليوم
              </button>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex gap-2 flex-1 md:flex-initial">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">كل الحالات</option>
              <option value="scheduled">محجوز</option>
              <option value="confirmed">مؤكد</option>
              <option value="in_progress">جاري</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {viewMode === 'day' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generateTimeSlots().map((slot, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                    slot.available
                      ? 'border-gray-200 hover:border-teal-300 hover:bg-teal-50 cursor-pointer'
                      : slot.appointment?.status === 'completed'
                      ? 'border-gray-300 bg-gray-50'
                      : slot.appointment?.status === 'cancelled'
                      ? 'border-red-300 bg-red-50'
                      : 'border-teal-300 bg-teal-50'
                  }`}
                  onClick={() => slot.available && openModal()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                      <Clock className="w-4 h-4" />
                      {slot.time}
                    </div>
                    {slot.appointment && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(slot.appointment);
                          }}
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(slot.appointment!.id);
                          }}
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  {slot.appointment ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{slot.appointment.patient_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {slot.appointment.patient_phone}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(slot.appointment.status)}
                        {getPriorityBadge(slot.appointment.priority)}
                      </div>
                      {slot.appointment.status !== 'completed' && slot.appointment.status !== 'cancelled' && (
                        <div className="flex gap-1 mt-3">
                          {slot.appointment.status === 'scheduled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(slot.appointment!.id, 'confirmed');
                              }}
                              className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                            >
                              تأكيد
                            </button>
                          )}
                          {(slot.appointment.status === 'confirmed' || slot.appointment.status === 'scheduled') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(slot.appointment!.id, 'in_progress');
                              }}
                              className="flex-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
                            >
                              بدء
                            </button>
                          )}
                          {slot.appointment.status === 'in_progress' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(slot.appointment!.id, 'completed');
                              }}
                              className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              إنهاء
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <Plus className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs">متاح</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">لا توجد مواعيد</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-800">
                            {new Date(appointment.appointment_date).toLocaleDateString('ar-EG', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-800">{appointment.appointment_time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{appointment.patient_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          {appointment.patient_phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        {getPriorityBadge(appointment.priority)}
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4 mt-0.5" />
                          <span>{appointment.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(appointment)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                  {editingAppointment ? 'تعديل موعد' : 'موعد جديد'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  المريض *
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">اختر المريض</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الوقت *
                  </label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الأولوية
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['normal', 'urgent', 'follow_up'] as const).map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        formData.priority === priority
                          ? priority === 'urgent'
                            ? 'bg-red-600 text-white shadow-lg'
                            : priority === 'follow_up'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {priority === 'normal' && 'عادي'}
                      {priority === 'urgent' && 'عاجل'}
                      {priority === 'follow_up' && 'متابعة'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="أضف ملاحظات إضافية..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? 'جاري الحفظ...' : editingAppointment ? 'تحديث' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernAppointmentSystem;