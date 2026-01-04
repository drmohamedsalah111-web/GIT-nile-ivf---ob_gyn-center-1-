// ============================================================================
// 👤 PATIENT PROFILE - ملف المريض الشامل
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Calendar, Mail, MapPin, FileText, 
  Heart, Activity, ClipboardList, AlertCircle, Printer,
  Edit, Save, X, Plus, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabaseClient';

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  national_id?: string;
  address?: string;
  email?: string;
  blood_type?: string;
  created_at?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  visit_type: string;
}

const PatientProfile: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      
      console.log('Loaded patients:', data?.length || 0);
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('فشل تحميل المرضى');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientAppointments = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPatientAppointments(patient.id);
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.national_id?.includes(searchTerm)
  );

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
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <User className="w-8 h-8 text-teal-600" />
              ملفات المرضى
            </h1>
            <p className="text-gray-500 mt-1">إدارة وعرض السجلات الطبية الشاملة</p>
          </div>
          <div className="text-3xl font-bold text-teal-600">
            {patients.length}
            <span className="text-sm text-gray-500 mr-2">مريض</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Patients List - Left Side */}
        <div className="col-span-4 bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="ابحث بالاسم، التليفون، أو الرقم القومي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد نتائج</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`w-full text-right p-4 rounded-lg border-2 transition-all ${
                    selectedPatient?.id === patient.id
                      ? 'bg-teal-50 border-teal-500'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{patient.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                        {patient.age && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {patient.age} سنة
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0 mr-2"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Patient Details - Right Side */}
        <div className="col-span-8">
          {!selectedPatient ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">اختر مريض</h3>
              <p className="text-gray-500">اختر مريض من القائمة لعرض ملفه الطبي</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient Info Card */}
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedPatient.name}</h2>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {selectedPatient.phone}
                        </div>
                        {selectedPatient.age && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {selectedPatient.age} سنة
                          </div>
                        )}
                        {selectedPatient.national_id && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {selectedPatient.national_id}
                          </div>
                        )}
                        {selectedPatient.blood_type && (
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            {selectedPatient.blood_type}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Appointments History */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-teal-600" />
                    سجل المواعيد
                  </h3>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-bold">
                    {appointments.length} موعد
                  </span>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد مواعيد مسجلة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              {new Date(apt.appointment_date).toLocaleDateString('ar-EG', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500">{apt.visit_type}</p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            apt.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : apt.status === 'Cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {apt.status === 'Completed' && 'مكتمل'}
                          {apt.status === 'Scheduled' && 'محجوز'}
                          {apt.status === 'Cancelled' && 'ملغي'}
                          {apt.status === 'Waiting' && 'في الانتظار'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medical Records Placeholder */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <Activity className="w-6 h-6 text-teal-600" />
                  السجل الطبي
                </h3>
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">لا توجد سجلات طبية</p>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    إضافة سجل
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
