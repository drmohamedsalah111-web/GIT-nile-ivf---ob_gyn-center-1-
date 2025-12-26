/**
 * ReceptionDashboard.tsx
 * Main dashboard for clinic secretary/receptionist
 * Features: Waiting Queue, Today's Appointments, Quick Actions
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserPlus,
  Calendar,
  CreditCard,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  Phone,
  ChevronRight,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface ReceptionDashboardProps {
  userId?: string;
  userName?: string;
  onPageChange?: (page: string) => void;
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  status: string;
  visit_type: string;
  notes?: string;
  patients: {
    name: string;
    phone: string;
  };
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ 
  userId = '', 
  userName = 'السكرتيرة',
  onPageChange
}) => {
  const [waitingQueue, setWaitingQueue] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    scheduled: 0,
    completed: 0,
    checkedIn: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's appointments
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            name,
            phone
          )
        `)
        .gte('appointment_date', `${today}T00:00:00`)
        .lte('appointment_date', `${today}T23:59:59`)
        .order('appointment_date', { ascending: true });

      if (apptError) throw apptError;

      const appts = appointments || [];
      setTodayAppointments(appts);

      // Separate waiting queue (Checked-in but not completed)
      const waiting = appts.filter(a => a.status === 'Waiting');
      setWaitingQueue(waiting);

      // Calculate stats
      setStats({
        waiting: waiting.length,
        scheduled: appts.filter(a => a.status === 'Scheduled').length,
        completed: appts.filter(a => a.status === 'Completed').length,
        checkedIn: waiting.length
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Waiting' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('تم تسجيل الحضور بنجاح');
      fetchData();
    } catch (err) {
      console.error('Error checking in:', err);
      toast.error('فشل تسجيل الحضور');
    }
  };

  const handleSendToDoctor = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Completed' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('تم إرسال المريض للطبيب');
      fetchData();
    } catch (err) {
      console.error('Error sending to doctor:', err);
      toast.error('فشل الإرسال');
    }
  };

  // Filter appointments by search term
  const filteredAppointments = todayAppointments.filter(apt =>
    apt.patients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.patients?.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">مرحباً، {userName}! 👋</h1>
        <p className="opacity-90">إليك ملخص يوم العمل</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">{stats.waiting}</span>
          </div>
          <div className="text-sm text-gray-600">في قائمة الانتظار</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">{stats.scheduled}</span>
          </div>
          <div className="text-sm text-gray-600">مواعيد محجوزة</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
          </div>
          <div className="text-sm text-gray-600">تم الفحص</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{todayAppointments.length}</span>
          </div>
          <div className="text-sm text-gray-600">إجمالي اليوم</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              if (onPageChange) {
                onPageChange('patients');
                toast.success('جاري فتح صفحة تسجيل المريض...');
              }
            }}
            className="flex items-center gap-3 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">مريض جديد</div>
              <div className="text-sm text-gray-500">تسجيل مريض جديد</div>
            </div>
          </button>

          <button 
            onClick={() => {
              if (onPageChange) {
                onPageChange('appointments');
                toast.success('جاري فتح صفحة المواعيد...');
              }
            }}
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">حجز موعد</div>
              <div className="text-sm text-gray-500">إضافة موعد جديد</div>
            </div>
          </button>

          <button 
            onClick={() => {
              if (onPageChange) {
                onPageChange('cash');
                toast.success('جاري فتح صفحة الفواتير...');
              }
            }}
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">فاتورة سريعة</div>
              <div className="text-sm text-gray-500">إنشاء فاتورة</div>
            </div>
          </button>
        </div>
      </div>

      {/* Waiting Queue - Priority Section */}
      {waitingQueue.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">قائمة الانتظار ({waitingQueue.length})</h2>
          </div>
          <div className="space-y-3">
            {waitingQueue.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{appointment.patients?.name}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {appointment.patients?.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(appointment.appointment_date).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSendToDoctor(appointment.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال للطبيب</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">مواعيد اليوم</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد مواعيد اليوم</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAppointments.map((appointment) => {
              const statusConfig = {
                Scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'محجوز' },
                Waiting: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'في الانتظار' },
                Completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'تم' },
                Cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'ملغي' },
                'No Show': { bg: 'bg-gray-50', text: 'text-gray-700', label: 'لم يحضر' }
              }[appointment.status] || { bg: 'bg-gray-50', text: 'text-gray-700', label: appointment.status };

              return (
                <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{appointment.patients?.name}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {appointment.patients?.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(appointment.appointment_date).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                      {appointment.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCheckIn(appointment.id)}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>تسجيل حضور</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;
