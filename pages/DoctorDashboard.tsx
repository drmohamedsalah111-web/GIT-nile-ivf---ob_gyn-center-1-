import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, AlertCircle, FileText, Stethoscope, Calendar, ArrowRight, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
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

interface LastVisit {
  patientId: string;
  visitDate: string;
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

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onViewPatient, onAddPatient }) => {

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [lastVisits, setLastVisits] = useState<Record<string, string>>({});
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingLabRequests: 0,
    completedAppointments: 0
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

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
        fetchTodaysAppointments(doctorRecord.id)
      ]);
    } catch (err: any) {
      console.error('❌ Error initializing dashboard:', err);
      setError(err.message || 'Failed to initialize dashboard');
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, phone, husband_name, doctor_id, created_at, updated_at')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatients(data || []);

      if (data && data.length > 0) {
        await fetchLastVisits(data.map(p => p.id));
      }
    } catch (err: any) {
      console.error('❌ Error fetching patients:', err);
      toast.error('Failed to load patients');
      setPatients([]);
    }
  };

  const fetchLastVisits = async (patientIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date')
        .in('patient_id', patientIds)
        .eq('status', 'Completed')
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      const visits: Record<string, string> = {};
      if (data) {
        const latestVisits = new Map<string, string>();
        data.forEach(visit => {
          if (!latestVisits.has(visit.patient_id)) {
            latestVisits.set(visit.patient_id, visit.appointment_date);
          }
        });
        latestVisits.forEach((date, patientId) => {
          visits[patientId] = date;
        });
      }
      setLastVisits(visits);
    } catch (err: any) {
      console.error('❌ Error fetching last visits:', err);
    }
  };

  const fetchTodaysAppointments = async (doctorId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          appointment_date,
          visit_type,
          status,
          notes,
          patient:patients(name)
        `)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', `${today}T00:00:00`)
        .lte('appointment_date', `${today}T23:59:59`)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const appointments: Appointment[] = (data || []).map(appt => ({
        id: appt.id,
        patient_id: appt.patient_id,
        patient_name: appt.patient?.name || 'Unknown Patient',
        appointment_date: appt.appointment_date,
        visit_type: appt.visit_type,
        status: appt.status,
        notes: appt.notes
      }));

      setTodaysAppointments(appointments);
    } catch (err: any) {
      console.error('❌ Error fetching today\'s appointments:', err);
    }
  };

  const fetchStats = async (doctorId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { count: patientCount } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId);

      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('appointment_date', `${today}T00:00:00`)
        .lte('appointment_date', `${today}T23:59:59`)
        .eq('status', 'Scheduled');

      const { count: completedAppointmentCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('appointment_date', `${today}T00:00:00`)
        .lte('appointment_date', `${today}T23:59:59`)
        .eq('status', 'Completed');

      const { count: labCount } = await supabase
        .from('lab_requests')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'Pending');

      setStatsData({
        totalPatients: patientCount || 0,
        appointmentsToday: appointmentCount || 0,
        pendingLabRequests: labCount || 0,
        completedAppointments: completedAppointmentCount || 0
      });
    } catch (err: any) {
      console.error('❌ Error fetching stats:', err);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const name = patient.name ? String(patient.name).toLowerCase() : '';
    const phone = patient.phone ? String(patient.phone) : '';
    const search = searchQuery.toLowerCase();
    return name.includes(search) || phone.includes(searchQuery);
  });

  const handleViewPatient = (patientId: string) => {
    if (onViewPatient) {
      onViewPatient(patientId);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No visit';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 md:px-8" dir="ltr">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">لوحة تحكم الطبيب</h1>
              <p className="text-gray-600">إدارة المرضى والمواعيد اليومية</p>
            </div>
            {onAddPatient && (
              <button
                onClick={onAddPatient}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                إضافة مريضة
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border-l-4 border-blue-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المرضى</p>
                <p className="text-4xl font-bold text-gray-900">{statsData.totalPatients}</p>
              </div>
              <Users className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-l-4 border-green-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مواعيد اليوم</p>
                <p className="text-4xl font-bold text-gray-900">{statsData.appointmentsToday}</p>
              </div>
              <Calendar className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-l-4 border-orange-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">المواعيد المكتملة</p>
                <p className="text-4xl font-bold text-gray-900">{statsData.completedAppointments}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-orange-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-l-4 border-yellow-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">طلبات المعامل المعلقة</p>
                <p className="text-4xl font-bold text-gray-900">{statsData.pendingLabRequests}</p>
              </div>
              <FileText className="w-12 h-12 text-yellow-100" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Today's Appointments Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 md:px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              مواعيد اليوم ({todaysAppointments.length})
            </h2>
          </div>

          <div className="p-6">
            {todaysAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600 font-medium">لا توجد مواعيد لهذا اليوم</p>
                <p className="text-gray-500">يمكنك إضافة مواعيد جديدة من صفحة حجز المواعيد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysAppointments.map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600">{appointment.visit_type}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {new Date(appointment.appointment_date).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.status === 'Scheduled' ? 'مجدولة' : 'مكتملة'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patients Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 md:px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-6 h-6" />
              قائمة المرضى ({filteredPatients.length})
            </h2>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Patients List */}
          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 font-medium">
                {patients.length === 0 ? 'لا توجد مريضات مسجلة بعد' : 'لا توجد نتائج مطابقة للبحث'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards View */}
              <div className="block md:hidden space-y-4 p-6">
                {filteredPatients.map(patient => (
                  <div
                    key={patient.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{patient.phone}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {patient.age} yrs
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-4">
                      <p className="font-medium">Last Visit: {formatDate(lastVisits[patient.id])}</p>
                      {patient.husband_name && (
                        <p className="text-gray-600">Husband: {patient.husband_name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewPatient(patient.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop: Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Age</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Husband Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Last Visit</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPatients.map(patient => (
                      <tr
                        key={patient.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{patient.name}</p>
                              <p className="text-sm text-gray-500">ID: {patient.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {patient.age} yrs
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{patient.phone}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {patient.husband_name || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(lastVisits[patient.id])}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                          >
                            View
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
