import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Unlock, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Stethoscope,
  ClipboardList
} from 'lucide-react';

interface QueuePatient {
  appointment_id: string;
  appointment_time: string;
  appointment_status: string;
  payment_status: string;
  checked_in_at: string | null;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_dob: string;
  access_status: 'locked' | 'unlocked';
}

interface ServiceRequestForm {
  appointment_id: string;
  patient_id: string;
  service_id: string;
  service_name: string;
  service_price: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

const DoctorQueue: React.FC = () => {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctorId();
    loadQueue();
    loadServices();

    // Setup realtime subscription for appointment updates
    const subscription = supabase
      .channel('doctor_appointments_channel')
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'appointments',
          filter: `date=eq.${new Date().toISOString().split('T')[0]}`
        },
        (payload) => {
          console.log('Appointment updated:', payload);
          loadQueue();
          
          // Show toast when patient is checked in
          if (payload.new.checked_in_at && !payload.old.checked_in_at) {
            toast.success('✅ مريض جديد جاهز للفحص!', { duration: 4000 });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadDoctorId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setDoctorId(data.id);
    }
  };

  const loadQueue = async () => {
    const { data, error } = await supabase
      .from('doctor_queue_view')
      .select('*')
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error loading queue:', error);
      toast.error('فشل تحميل قائمة المرضى');
    } else {
      setQueue(data || []);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, price, category')
      .order('category, name');

    if (error) {
      console.error('Error loading services:', error);
    } else {
      setServices(data || []);
    }
  };

  const handlePatientClick = (patient: QueuePatient) => {
    if (patient.access_status === 'unlocked') {
      // Navigate to patient medical file
      navigate(`/patient/${patient.patient_id}`);
    } else {
      toast.error('🔒 المريض لم يتم تسجيل حضوره بعد. في انتظار الدفع بالسكرتارية.', { 
        duration: 5000,
        icon: '🔒'
      });
    }
  };

  const handleRequestService = (patient: QueuePatient) => {
    setSelectedPatient(patient);
    setSelectedService('');
    setNotes('');
    setShowServiceModal(true);
  };

  const submitServiceRequest = async () => {
    if (!selectedPatient || !selectedService || !doctorId) {
      toast.error('الرجاء اختيار خدمة');
      return;
    }

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    try {
      const { error } = await supabase
        .from('service_requests')
        .insert({
          appointment_id: selectedPatient.appointment_id,
          patient_id: selectedPatient.patient_id,
          service_id: service.id,
          service_name: service.name,
          service_price: service.price,
          requested_by: doctorId,
          notes: notes || null,
          status: 'requested'
        });

      if (error) throw error;

      toast.success('✅ تم إرسال الطلب للسكرتارية للتحصيل', {
        duration: 5000,
        icon: '📋'
      });

      setShowServiceModal(false);
      setSelectedPatient(null);
      
    } catch (err: any) {
      console.error('Error requesting service:', err);
      toast.error('فشل إرسال الطلب: ' + err.message);
    }
  };

  const unlockedCount = queue.filter(p => p.access_status === 'unlocked').length;
  const lockedCount = queue.filter(p => p.access_status === 'locked').length;

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category || 'أخرى';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="w-8 h-8" />
            قائمة المرضى - غرفة الكشف
          </h1>
          
          {/* Status Summary */}
          <div className="flex gap-4">
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <span className="font-bold text-green-700">{unlockedCount}</span>
              <span className="text-green-600 mr-2">جاهز</span>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <span className="font-bold text-gray-700">{lockedCount}</span>
              <span className="text-gray-600 mr-2">في الانتظار</span>
            </div>
          </div>
        </div>

        {/* Queue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map(patient => (
            <div
              key={patient.appointment_id}
              className={`relative rounded-xl shadow-lg overflow-hidden transition-all ${
                patient.access_status === 'unlocked'
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 hover:shadow-xl hover:scale-105 cursor-pointer'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 opacity-60'
              }`}
            >
              {/* Lock/Unlock Badge */}
              <div className={`absolute top-3 left-3 p-2 rounded-full ${
                patient.access_status === 'unlocked' 
                  ? 'bg-green-500' 
                  : 'bg-gray-400'
              }`}>
                {patient.access_status === 'unlocked' ? (
                  <Unlock className="w-5 h-5 text-white" />
                ) : (
                  <Lock className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Card Content */}
              <div 
                className="p-5 pt-12"
                onClick={() => handlePatientClick(patient)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-3 rounded-full ${
                    patient.access_status === 'unlocked' 
                      ? 'bg-green-200' 
                      : 'bg-gray-300'
                  }`}>
                    <User className={`w-6 h-6 ${
                      patient.access_status === 'unlocked' 
                        ? 'text-green-700' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{patient.patient_name}</h3>
                    <p className="text-sm text-gray-600">{patient.patient_phone}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>الموعد: {patient.appointment_time}</span>
                  </div>
                  
                  {patient.checked_in_at && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>تم تسجيل الحضور</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {patient.access_status === 'unlocked' ? (
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientClick(patient);
                      }}
                      className="w-full bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition"
                    >
                      فتح الملف الطبي
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestService(patient);
                      }}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      طلب خدمة إضافية
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-200 p-3 rounded-lg text-center">
                    <Lock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600 font-medium">
                      في انتظار الدفع بالسكرتارية
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {queue.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">لا توجد مواعيد اليوم</p>
          </div>
        )}
      </div>

      {/* Service Request Modal */}
      {showServiceModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">طلب خدمة إضافية</h2>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="font-bold">المريض: {selectedPatient.patient_name}</p>
              <p className="text-sm text-gray-600">{selectedPatient.patient_phone}</p>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2">اختر الخدمة:</label>
              {Object.keys(servicesByCategory).map(category => (
                <div key={category} className="mb-3">
                  <p className="text-sm font-bold text-gray-700 mb-1">{category}</p>
                  <div className="space-y-1">
                    {servicesByCategory[category].map(service => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`w-full text-right p-3 rounded-lg border-2 transition ${
                          selectedService === service.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-blue-600">{service.price} جنيه</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2">ملاحظات (اختياري):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="أي ملاحظات للسكرتارية..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">تنبيه:</p>
                  <p>سيتم إرسال هذا الطلب للسكرتارية لتحصيل قيمة الخدمة من المريض قبل تنفيذها.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitServiceRequest}
                disabled={!selectedService}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                إرسال الطلب للسكرتارية
              </button>
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
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

export default DoctorQueue;
