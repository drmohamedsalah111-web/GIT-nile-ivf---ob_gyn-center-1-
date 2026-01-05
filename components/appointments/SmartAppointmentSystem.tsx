// ============================================================================
// 📅 SMART APPOINTMENT SYSTEM
// نظام المواعيد الذكي - منظم ومتقدم
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  MoreVertical,
  Eye,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  national_id?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  visit_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  priority?: 'normal' | 'urgent' | 'follow_up';
  reminder_sent?: boolean;
}

interface AppointmentFormData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'follow_up';
}

type ViewMode = 'day' | 'week' | 'month' | 'list';
type DisplayMode = 'grid' | 'timeline' | 'compact';

interface SmartAppointmentSystemProps {
  doctorId?: string;
  userRole: 'doctor' | 'secretary';
  onAppointmentClick?: (appointment: Appointment) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SmartAppointmentSystem: React.FC<SmartAppointmentSystemProps> = ({
  doctorId,
  userRole,
  onAppointmentClick
}) => {
  // State Management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('timeline');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Form State
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: '',
    doctor_id: doctorId || '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00',
    visit_type: 'consultation',
    notes: '',
    priority: 'normal'
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [selectedDate, viewMode, doctorId]);

  useEffect(() => {
    // Real-time subscription
    const channel = supabase
      .channel('appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      const startDate = getDateRange().start;
      const endDate = getDateRange().end;

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id)
        `)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast.error('فشل تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, age, national_id')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  // ============================================================================
  // APPOINTMENT CRUD OPERATIONS
  // ============================================================================

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            ...formData,
            appointment_date: appointmentDateTime.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم حجز الموعد بنجاح');
      setShowForm(false);
      resetForm();
      loadAppointments();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error('فشل إنشاء الموعد: ' + error.message);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAppointment) return;

    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

      const { error } = await supabase
        .from('appointments')
        .update({
          ...formData,
          appointment_date: appointmentDateTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAppointment.id);

      if (error) throw error;

      toast.success('تم تحديث الموعد بنجاح');
      setShowForm(false);
      setEditingAppointment(null);
      resetForm();
      loadAppointments();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error('فشل تحديث الموعد: ' + error.message);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('تم حذف الموعد');
      loadAppointments();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error('فشل حذف الموعد');
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('تم تحديث حالة الموعد');
      loadAppointments();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('فشل تحديث الحالة');
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (viewMode) {
      case 'day':
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'list':
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() + 2);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'محجوز' },
      waiting: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'انتظار' },
      in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'جاري' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'مكتمل' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'ملغي' },
      no_show: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'لم يحضر' }
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      normal: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '📋' },
      urgent: { bg: 'bg-red-100', text: 'text-red-700', icon: '🚨' },
      follow_up: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔄' }
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: doctorId || '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:00',
      visit_type: 'consultation',
      notes: '',
      priority: 'normal'
    });
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(selectedDate);

    if (direction === 'today') {
      setSelectedDate(new Date());
      return;
    }

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setSelectedDate(newDate);
  };

  // ============================================================================
  // RENDER VIEWS
  // ============================================================================

  const renderDayView = () => {
    const dayAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
      const selDate = selectedDate.toISOString().split('T')[0];
      return aptDate === selDate;
    });

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

    if (displayMode === 'timeline') {
      return (
        <div className="relative space-y-2">
          {hours.map(hour => {
            const hourString = `${String(hour).padStart(2, '0')}:00`;
            const hourAppointments = dayAppointments.filter(apt => {
              const time = apt.appointment_time?.substring(0, 2);
              return parseInt(time || '0') === hour;
            });

            return (
              <div key={hour} className="flex gap-4 min-h-[80px]">
                {/* Time Label */}
                <div className="w-20 text-right">
                  <div className="text-sm font-bold text-gray-700">{hourString}</div>
                  <div className="text-xs text-gray-400">
                    {hour < 12 ? 'صباحاً' : 'مساءً'}
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative flex-1">
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="absolute -right-2 top-2 w-4 h-4 rounded-full bg-gray-300 border-2 border-white" />

                  {/* Appointments */}
                  <div className="pr-6 space-y-2">
                    {hourAppointments.length > 0 ? (
                      hourAppointments.map(apt => renderAppointmentCard(apt))
                    ) : (
                      <div 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            appointment_date: selectedDate.toISOString().split('T')[0],
                            appointment_time: hourString
                          }));
                          setShowForm(true);
                        }}
                        className="h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 cursor-pointer transition-all group"
                      >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="mr-2 text-sm font-medium">حجز موعد</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Grid/Compact View
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dayAppointments.map(apt => renderAppointmentCard(apt))}
        {dayAppointments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">لا توجد مواعيد في هذا اليوم</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              حجز موعد جديد
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAppointmentCard = (apt: Appointment) => {
    const status = getStatusColor(apt.status);
    const priority = getPriorityColor(apt.priority || 'normal');

    return (
      <div
        key={apt.id}
        className={`${status.bg} ${status.border} border-2 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group`}
        onClick={() => onAppointmentClick?.(apt)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <User size={20} className={status.text} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{apt.patient?.name || 'غير محدد'}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock size={12} />
                <span>{apt.appointment_time?.substring(0, 5)}</span>
              </div>
            </div>
          </div>

          {/* Priority Badge */}
          {apt.priority && apt.priority !== 'normal' && (
            <span className={`${priority.bg} ${priority.text} px-2 py-1 rounded-lg text-xs font-bold`}>
              {priority.icon}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {apt.patient?.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={14} />
              <span>{apt.patient.phone}</span>
            </div>
          )}

          {apt.visit_type && (
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare size={14} />
              <span>{apt.visit_type}</span>
            </div>
          )}

          {apt.notes && (
            <div className="text-xs text-gray-500 bg-white/50 p-2 rounded-lg">
              {apt.notes}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-bold`}>
              {status.label}
            </span>

            {/* Actions */}
            {(userRole === 'doctor' || userRole === 'secretary') && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAppointment(apt);
                    setFormData({
                      patient_id: apt.patient_id,
                      doctor_id: apt.doctor_id,
                      appointment_date: new Date(apt.appointment_date).toISOString().split('T')[0],
                      appointment_time: apt.appointment_time?.substring(0, 5) || '09:00',
                      visit_type: apt.visit_type,
                      notes: apt.notes || '',
                      priority: apt.priority
                    });
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <Edit2 size={14} className="text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAppointment(apt.id);
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Status Updates */}
        {apt.status === 'scheduled' && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(apt.id, 'waiting');
              }}
              className="flex-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors"
            >
              في الانتظار
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(apt.id, 'cancelled');
              }}
              className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        )}

        {apt.status === 'waiting' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(apt.id, 'in_progress');
            }}
            className="mt-2 w-full px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors"
          >
            بدء الكشف
          </button>
        )}

        {apt.status === 'in_progress' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(apt.id, 'completed');
            }}
            className="mt-2 w-full px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors"
          >
            إنهاء الكشف
          </button>
        )}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-2">
        {filteredAppointments.map(apt => {
          const status = getStatusColor(apt.status);
          return (
            <div
              key={apt.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${status.bg} flex items-center justify-center`}>
                    <User size={20} className={status.text} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{apt.patient?.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{new Date(apt.appointment_date).toLocaleDateString('ar-EG')}</span>
                      <span>•</span>
                      <span>{apt.appointment_time?.substring(0, 5)}</span>
                      <span>•</span>
                      <span>{apt.visit_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`${status.bg} ${status.text} px-4 py-1.5 rounded-full text-sm font-bold`}>
                    {status.label}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAppointment(apt);
                        setFormData({
                          patient_id: apt.patient_id,
                          doctor_id: apt.doctor_id,
                          appointment_date: new Date(apt.appointment_date).toISOString().split('T')[0],
                          appointment_time: apt.appointment_time?.substring(0, 5) || '09:00',
                          visit_type: apt.visit_type,
                          notes: apt.notes || '',
                          priority: apt.priority
                        });
                        setShowForm(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(apt.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">لا توجد مواعيد</p>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Top Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>

            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAppointments.length} موعد
              </p>
            </div>

            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => navigateDate('today')}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              اليوم
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingAppointment(null);
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              موعد جديد
            </button>

            <button
              onClick={loadAppointments}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Second Row - Filters & View Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث عن مريض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">كل الحالات</option>
            <option value="scheduled">محجوز</option>
            <option value="waiting">انتظار</option>
            <option value="in_progress">جاري</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'day' && 'يوم'}
                {mode === 'week' && 'أسبوع'}
                {mode === 'month' && 'شهر'}
                {mode === 'list' && 'قائمة'}
              </button>
            ))}
          </div>

          {/* Display Mode */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setDisplayMode('timeline')}
                className={`p-2 rounded-lg transition-colors ${
                  displayMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  displayMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid3x3 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {viewMode === 'list' ? renderListView() : renderDayView()}
      </div>

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAppointment ? 'تعديل الموعد' : 'حجز موعد جديد'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAppointment(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment} className="p-6 space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المريض *
                </label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الوقت *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Visit Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع الزيارة *
                  </label>
                  <select
                    required
                    value={formData.visit_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, visit_type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="consultation">استشارة</option>
                    <option value="follow_up">متابعة</option>
                    <option value="procedure">إجراء</option>
                    <option value="emergency">طوارئ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الأولوية
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل</option>
                    <option value="follow_up">متابعة</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  {editingAppointment ? 'تحديث' : 'حجز'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAppointment(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
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

export default SmartAppointmentSystem;
