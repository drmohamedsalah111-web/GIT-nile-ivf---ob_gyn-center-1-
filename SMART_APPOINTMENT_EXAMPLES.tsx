// ============================================================================
// EXAMPLE: INTEGRATING SMART APPOINTMENT SYSTEM
// مثال: دمج نظام المواعيد الذكي
// ============================================================================

import React, { useState, useEffect } from 'react';
import SmartAppointmentSystem from '../components/appointments/SmartAppointmentSystem';
import { smartAppointmentService } from '../services/smartAppointmentService';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';

// ============================================================================
// FOR DOCTOR DASHBOARD
// للوحة تحكم الطبيب
// ============================================================================

export const DoctorAppointmentsPage: React.FC = () => {
  const [doctorId, setDoctorId] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      // Get current user's doctor ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctor) {
        setDoctorId(doctor.id);
        loadStats(doctor.id);
      }
    } catch (error) {
      console.error('Error loading doctor:', error);
    }
  };

  const loadStats = async (docId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const result = await smartAppointmentService.getStats(docId, today, today);
    setStats(result);
  };

  const handleAppointmentClick = (appointment: any) => {
    // Open appointment details or patient file
    console.log('Opening appointment:', appointment);
    toast.success(`فتح موعد: ${appointment.patient?.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total_appointments}</div>
            <div className="text-sm text-gray-600">إجمالي المواعيد</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">{stats.waiting_count}</div>
            <div className="text-sm text-gray-600">في الانتظار</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.in_progress_count}</div>
            <div className="text-sm text-gray-600">جاري الكشف</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.completed_count}</div>
            <div className="text-sm text-gray-600">مكتمل</div>
          </div>
        </div>
      )}

      {/* Smart Appointment System */}
      {doctorId && (
        <SmartAppointmentSystem
          doctorId={doctorId}
          userRole="doctor"
          onAppointmentClick={handleAppointmentClick}
        />
      )}
    </div>
  );
};

// ============================================================================
// FOR SECRETARY DASHBOARD
// للوحة تحكم السكرتير
// ============================================================================

export const SecretaryAppointmentsPage: React.FC = () => {
  const [linkedDoctorId, setLinkedDoctorId] = useState<string>('');
  const [secretaryName, setSecretaryName] = useState<string>('');

  useEffect(() => {
    loadSecretaryData();
  }, []);

  const loadSecretaryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get secretary info
      const { data: secretary } = await supabase
        .from('doctors')
        .select('secretary_doctor_id, name')
        .eq('user_id', user.id)
        .single();

      if (secretary) {
        setLinkedDoctorId(secretary.secretary_doctor_id);
        setSecretaryName(secretary.name);
      }
    } catch (error) {
      console.error('Error loading secretary:', error);
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    // Open appointment details
    console.log('Secretary viewing:', appointment);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إدارة المواعيد</h1>
        <p className="text-gray-600 mt-1">مرحباً {secretaryName}</p>
      </div>

      {/* Smart Appointment System */}
      {linkedDoctorId && (
        <SmartAppointmentSystem
          doctorId={linkedDoctorId}
          userRole="secretary"
          onAppointmentClick={handleAppointmentClick}
        />
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE: USING THE SERVICE DIRECTLY
// مثال: استخدام الخدمة مباشرة
// ============================================================================

export const AppointmentExamples = () => {
  
  // Create new appointment
  const createExample = async () => {
    const result = await smartAppointmentService.createAppointment({
      patient_id: 'patient-uuid-here',
      doctor_id: 'doctor-uuid-here',
      appointment_date: '2026-01-10',
      appointment_time: '10:00',
      visit_type: 'consultation',
      notes: 'فحص روتيني',
      priority: 'normal'
    });

    if (result.success) {
      toast.success('تم حجز الموعد بنجاح');
      console.log('New appointment:', result.data);
    } else {
      toast.error(result.error);
    }
  };

  // Update appointment status
  const updateStatusExample = async (appointmentId: string) => {
    const result = await smartAppointmentService.markAsWaiting(appointmentId);
    
    if (result.success) {
      toast.success('تم تحديث الحالة');
    }
  };

  // Get today's appointments
  const getTodayExample = async (doctorId: string) => {
    const result = await smartAppointmentService.getTodayAppointments(doctorId);
    
    if (result.success) {
      console.log('Today appointments:', result.data);
    }
  };

  // Get waiting queue
  const getQueueExample = async (doctorId: string) => {
    const result = await smartAppointmentService.getWaitingQueue(doctorId);
    
    if (result.success) {
      console.log('Waiting queue:', result.data);
    }
  };

  // Get statistics
  const getStatsExample = async (doctorId: string) => {
    const stats = await smartAppointmentService.getStats(
      doctorId,
      '2026-01-01',
      '2026-01-31'
    );
    
    console.log('Stats:', stats);
  };

  // Check for conflicts
  const checkConflictExample = async () => {
    const hasConflict = await smartAppointmentService.checkConflict(
      'doctor-uuid',
      '2026-01-10',
      '10:00'
    );
    
    console.log('Has conflict:', hasConflict);
  };

  // Real-time subscription
  const subscribeExample = (doctorId: string) => {
    const channel = smartAppointmentService.subscribeToAppointments(
      doctorId,
      (payload) => {
        console.log('Change received:', payload);
        toast.info('تم تحديث المواعيد');
        // Reload appointments
      }
    );

    // Cleanup
    return () => {
      smartAppointmentService.unsubscribe(channel);
    };
  };

  // Export to CSV
  const exportExample = async (doctorId: string) => {
    const result = await smartAppointmentService.exportToCSV({
      doctorId,
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    });

    if (result.success) {
      toast.success('تم تصدير البيانات');
    }
  };

  // Search appointments
  const searchExample = async (doctorId: string) => {
    const result = await smartAppointmentService.search('محمد', doctorId);
    
    if (result.success) {
      console.log('Search results:', result.data);
    }
  };

  return null;
};

// ============================================================================
// EXAMPLE: QUICK ACTIONS COMPONENT
// مثال: مكون الإجراءات السريعة
// ============================================================================

export const QuickAppointmentActions: React.FC<{ doctorId: string }> = ({ doctorId }) => {
  const [waitingCount, setWaitingCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    loadCounts();
    
    // Real-time updates
    const channel = smartAppointmentService.subscribeToAppointments(
      doctorId,
      () => loadCounts()
    );

    return () => smartAppointmentService.unsubscribe(channel);
  }, [doctorId]);

  const loadCounts = async () => {
    // Waiting queue
    const queueResult = await smartAppointmentService.getWaitingQueue(doctorId);
    if (queueResult.success) {
      setWaitingCount(queueResult.data.length);
    }

    // Upcoming
    const upcomingResult = await smartAppointmentService.getUpcomingAppointments(doctorId, 7);
    if (upcomingResult.success) {
      setUpcomingCount(upcomingResult.data.length);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="text-2xl font-bold text-amber-700">{waitingCount}</div>
        <div className="text-sm text-amber-600">في الانتظار الآن</div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="text-2xl font-bold text-blue-700">{upcomingCount}</div>
        <div className="text-sm text-blue-600">المواعيد القادمة</div>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE: APPOINTMENT NOTIFICATION
// مثال: إشعار الموعد
// ============================================================================

export const AppointmentNotification: React.FC<{ appointment: any }> = ({ appointment }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-500',
      waiting: 'bg-amber-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const handleAccept = async () => {
    await smartAppointmentService.markAsWaiting(appointment.id);
    toast.success('تم نقل المريض إلى قائمة الانتظار');
  };

  const handleReject = async () => {
    await smartAppointmentService.markAsCancelled(appointment.id);
    toast.success('تم إلغاء الموعد');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(appointment.status)}`} />
        
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{appointment.patient?.name}</h4>
          <p className="text-sm text-gray-600">
            {appointment.appointment_time} - {appointment.visit_type}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200"
          >
            قبول
          </button>
          <button
            onClick={handleReject}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200"
          >
            رفض
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE: INTEGRATION IN EXISTING DASHBOARD
// مثال: التكامل مع لوحة التحكم الموجودة
// ============================================================================

export const IntegrateInExistingDashboard = () => {
  // In your existing SecretaryDashboard.tsx or DoctorDashboard.tsx
  
  /* 
  
  // 1. Import the component
  import SmartAppointmentSystem from '../components/appointments/SmartAppointmentSystem';
  
  // 2. Add a view state (if using tabs/views)
  const [activeView, setActiveView] = useState<'dashboard' | 'appointments' | 'patients'>('dashboard');
  
  // 3. Add to your navigation
  <button onClick={() => setActiveView('appointments')}>
    المواعيد
  </button>
  
  // 4. Add to your content area
  {activeView === 'appointments' && (
    <SmartAppointmentSystem
      doctorId={doctorId}
      userRole={userRole}
      onAppointmentClick={(apt) => {
        // Handle click - maybe open patient file
        console.log('Clicked:', apt);
      }}
    />
  )}
  
  */
  
  return null;
};

export default {
  DoctorAppointmentsPage,
  SecretaryAppointmentsPage,
  QuickAppointmentActions,
  AppointmentNotification
};
