// ============================================================================
// 🏥 PROFESSIONAL APPOINTMENT SYSTEM
// نظام المواعيد الاحترافي - بدون أخطاء
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  Loader,
  CheckCheck,
  Ban,
  Eye
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES & INTERFACES
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
  priority?: 'normal' | 'urgent' | 'follow_up';
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ConflictCheck {
  hasConflict: boolean;
  conflictingAppointment?: Appointment;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProfessionalAppointmentSystem: React.FC<{
  doctorId: string;
  userRole: 'doctor' | 'secretary';
}> = ({ doctorId, userRole }) => {
  
  // State Management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    visit_type: 'consultation',
    notes: '',
    priority: 'normal' as 'normal' | 'urgent' | 'follow_up'
  });
  
  // Validation & Errors
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [conflictWarning, setConflictWarning] = useState<ConflictCheck | null>(null);
  
  // Confirmation Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'cancel' | 'update';
    appointmentId: string;
    message: string;
  } | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadData();
  }, [selectedDate, doctorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAppointments(),
        loadPatients()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone, age, national_id)
        `)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', selectedDate)
        .lte('appointment_date', selectedDate + 'T23:59:59')
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      throw error;
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, age, national_id')
        .eq('doctor_id', doctorId)
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      throw error;
    }
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    // Patient validation
    if (!formData.patient_id) {
      errors.push({ field: 'patient_id', message: 'يرجى اختيار المريض' });
    }

    // Date validation
    if (!formData.appointment_date) {
      errors.push({ field: 'appointment_date', message: 'يرجى اختيار التاريخ' });
    } else {
      const selectedDateTime = new Date(formData.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDateTime < today) {
        errors.push({ field: 'appointment_date', message: 'لا يمكن حجز موعد في تاريخ سابق' });
      }
    }

    // Time validation
    if (!formData.appointment_time) {
      errors.push({ field: 'appointment_time', message: 'يرجى اختيار الوقت' });
    } else {
      const [hours, minutes] = formData.appointment_time.split(':').map(Number);
      
      if (hours < 8 || hours > 20) {
        errors.push({ field: 'appointment_time', message: 'ساعات العمل من 8 صباحاً إلى 8 مساءً' });
      }

      // Check if time is in the past for today
      if (formData.appointment_date === new Date().toISOString().split('T')[0]) {
        const now = new Date();
        const selectedTime = new Date();
        selectedTime.setHours(hours, minutes, 0, 0);
        
        if (selectedTime < now) {
          errors.push({ field: 'appointment_time', message: 'لا يمكن حجز موعد في وقت مضى' });
        }
      }
    }

    // Visit type validation
    if (!formData.visit_type) {
      errors.push({ field: 'visit_type', message: 'يرجى اختيار نوع الزيارة' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  const checkForConflicts = async (): Promise<ConflictCheck> => {
    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      const startTime = new Date(appointmentDateTime);
      const endTime = new Date(appointmentDateTime.getTime() + 30 * 60000); // 30 minutes

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .neq('status', 'cancelled')
        .neq('status', 'no_show')
        .gte('appointment_date', startTime.toISOString())
        .lt('appointment_date', endTime.toISOString());

      if (editingAppointment) {
        query = query.neq('id', editingAppointment.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          hasConflict: true,
          conflictingAppointment: data[0] as Appointment
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return { hasConflict: false };
    }
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    // Check for conflicts
    const conflictCheck = await checkForConflicts();
    if (conflictCheck.hasConflict) {
      setConflictWarning(conflictCheck);
      toast.error('يوجد موعد آخر في نفس الوقت!');
      return;
    }

    try {
      setSaving(true);
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

      if (editingAppointment) {
        // Update existing
        const { error } = await supabase
          .from('appointments')
          .update({
            appointment_date: appointmentDateTime.toISOString(),
            visit_type: formData.visit_type,
            notes: formData.notes,
            priority: formData.priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAppointment.id);

        if (error) throw error;
        toast.success('✅ تم تحديث الموعد بنجاح');
      } else {
        // Create new
        const { error } = await supabase
          .from('appointments')
          .insert([{
            patient_id: formData.patient_id,
            doctor_id: doctorId,
            appointment_date: appointmentDateTime.toISOString(),
            status: 'scheduled',
            visit_type: formData.visit_type,
            notes: formData.notes,
            priority: formData.priority,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('✅ تم حجز الموعد بنجاح');
      }

      // Reset and reload
      resetForm();
      await loadAppointments();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.error('❌ فشل حفظ الموعد: ' + (error.message || 'خطأ غير متوقع'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    setConfirmAction({
      type: 'delete',
      appointmentId,
      message: 'هل أنت متأكد من حذف هذا الموعد نهائياً؟ لا يمكن التراجع عن هذا الإجراء.'
    });
    setShowConfirmDialog(true);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setConfirmAction({
      type: 'cancel',
      appointmentId,
      message: 'هل أنت متأكد من إلغاء هذا الموعد؟'
    });
    setShowConfirmDialog(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    try {
      setSaving(true);

      if (confirmAction.type === 'delete') {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', confirmAction.appointmentId);

        if (error) throw error;
        toast.success('✅ تم حذف الموعد');
      } else if (confirmAction.type === 'cancel') {
        const { error } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', confirmAction.appointmentId);

        if (error) throw error;
        toast.success('✅ تم إلغاء الموعد');
      }

      await loadAppointments();
    } catch (error: any) {
      console.error('Error executing action:', error);
      toast.error('❌ فشل تنفيذ العملية: ' + error.message);
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
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
      toast.success('✅ تم تحديث الحالة');
      await loadAppointments();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('❌ فشل تحديث الحالة');
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_date: selectedDate,
      appointment_time: '',
      visit_type: 'consultation',
      notes: '',
      priority: 'normal'
    });
    setEditingAppointment(null);
    setShowForm(false);
    setValidationErrors([]);
    setConflictWarning(null);
  };

  const handleEdit = (appointment: Appointment) => {
    const date = new Date(appointment.appointment_date);
    setFormData({
      patient_id: appointment.patient_id,
      appointment_date: date.toISOString().split('T')[0],
      appointment_time: date.toTimeString().substring(0, 5),
      visit_type: appointment.visit_type,
      notes: appointment.notes || '',
      priority: appointment.priority || 'normal'
    });
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'محجوز', icon: Calendar },
      waiting: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'انتظار', icon: Clock },
      in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'جاري', icon: RefreshCw },
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'مكتمل', icon: CheckCircle },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'ملغي', icon: XCircle },
      no_show: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'لم يحضر', icon: Ban }
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message;
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.patient?.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } else {
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
      setSelectedDate(current.toISOString().split('T')[0]);
    }
  };

  // ============================================================================
  // RENDER TIME SLOTS
  // ============================================================================

  const renderTimeSlots = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    return (
      <div className="space-y-3">
        {hours.map(hour => {
          const hourString = `${String(hour).padStart(2, '0')}:00`;
          const hourAppointments = filteredAppointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate.getHours() === hour;
          });

          return (
            <div key={hour} className="flex gap-4">
              {/* Time Label */}
              <div className="w-24 text-right pt-2">
                <div className="text-sm font-bold text-gray-700">{hourString}</div>
                <div className="text-xs text-gray-400">{hour < 12 ? 'صباحاً' : 'مساءً'}</div>
              </div>

              {/* Appointments */}
              <div className="flex-1 min-h-[80px]">
                {hourAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {hourAppointments.map(apt => {
                      const statusInfo = getStatusColor(apt.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={apt.id}
                          className={`${statusInfo.bg} ${statusInfo.border} border-2 rounded-xl p-4 hover:shadow-lg transition-all group`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-full ${statusInfo.bg} flex items-center justify-center`}>
                                <User size={20} className={statusInfo.text} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{apt.patient?.name}</h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} />
                                    {apt.patient?.phone}
                                  </span>
                                  <span>•</span>
                                  <span>{apt.visit_type === 'consultation' ? 'استشارة' : 'متابعة'}</span>
                                  {apt.priority === 'urgent' && (
                                    <>
                                      <span>•</span>
                                      <span className="text-red-600 font-bold">🚨 عاجل</span>
                                    </>
                                  )}
                                </div>
                                {apt.notes && (
                                  <p className="text-xs text-gray-500 mt-2 bg-white/50 p-2 rounded">
                                    {apt.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col items-end gap-2">
                              <span className={`${statusInfo.bg} ${statusInfo.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                                <StatusIcon size={12} />
                                {statusInfo.label}
                              </span>

                              {/* Actions */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(apt)}
                                  className="p-2 bg-white hover:bg-blue-50 rounded-lg transition-colors"
                                  title="تعديل"
                                >
                                  <Edit2 size={14} className="text-blue-600" />
                                </button>
                                {apt.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleCancelAppointment(apt.id)}
                                    className="p-2 bg-white hover:bg-amber-50 rounded-lg transition-colors"
                                    title="إلغاء"
                                  >
                                    <XCircle size={14} className="text-amber-600" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAppointment(apt.id)}
                                  className="p-2 bg-white hover:bg-red-50 rounded-lg transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={14} className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Status Updates */}
                          {apt.status === 'scheduled' && (
                            <div className="mt-3 pt-3 border-t border-gray-200/50 flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'waiting')}
                                className="flex-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors"
                              >
                                في الانتظار
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                                className="flex-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors"
                              >
                                بدء الكشف
                              </button>
                            </div>
                          )}

                          {apt.status === 'waiting' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                              className="mt-3 pt-3 border-t border-gray-200/50 w-full px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors"
                            >
                              بدء الكشف
                            </button>
                          )}

                          {apt.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'completed')}
                              className="mt-3 pt-3 border-t border-gray-200/50 w-full px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors"
                            >
                              إنهاء الكشف
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        appointment_date: selectedDate,
                        appointment_time: hourString
                      }));
                      setShowForm(true);
                    }}
                    className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all group"
                  >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="mr-2 text-sm font-medium">متاح - اضغط للحجز</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>

            <div className="text-center min-w-[250px]">
              <h2 className="text-xl font-bold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('ar-EG', {
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
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors mr-2"
            >
              اليوم
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus size={18} />
              موعد جديد
            </button>

            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="تحديث"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الهاتف..."
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
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {renderTimeSlots()}

        {filteredAppointments.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">لا توجد مواعيد في هذا اليوم</p>
          </div>
        )}

        {filteredAppointments.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">لا توجد نتائج للبحث</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingAppointment ? (
                  <>
                    <Edit2 size={20} className="text-blue-600" />
                    تعديل الموعد
                  </>
                ) : (
                  <>
                    <Plus size={20} className="text-green-600" />
                    حجز موعد جديد
                  </>
                )}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-6 space-y-4">
              {/* Conflict Warning */}
              {conflictWarning?.hasConflict && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-red-900 mb-1">تحذير: يوجد تعارض!</h4>
                    <p className="text-sm text-red-700">
                      يوجد موعد آخر في نفس الوقت. يرجى اختيار وقت مختلف.
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المريض <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
                  disabled={!!editingAppointment}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('patient_id') ? 'border-red-500' : 'border-gray-300'
                  } ${editingAppointment ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">اختر المريض</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
                {getFieldError('patient_id') && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {getFieldError('patient_id')}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError('appointment_date') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('appointment_date') && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {getFieldError('appointment_date')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الوقت <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError('appointment_time') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('appointment_time') && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {getFieldError('appointment_time')}
                    </p>
                  )}
                </div>
              </div>

              {/* Visit Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع الزيارة <span className="text-red-600">*</span>
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
                    <option value="urgent">عاجل 🚨</option>
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
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingAppointment ? 'حفظ التعديلات' : 'تأكيد الحجز'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">تأكيد العملية</h3>
            </div>

            <p className="text-gray-700 mb-6">{confirmAction.message}</p>

            <div className="flex gap-3">
              <button
                onClick={executeConfirmedAction}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'جاري التنفيذ...' : 'تأكيد'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalAppointmentSystem;
