import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  DollarSign, 
  Lock, 
  Unlock, 
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

interface QueueItem {
  appointment_id: string;
  appointment_time: string;
  appointment_status: string;
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  checked_in_at: string | null;
  amount_required: number;
  amount_paid: number;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_old_debt: number;
  doctor_name: string;
  pending_requests: number;
}

interface ServiceRequest {
  id: string;
  appointment_id: string;
  patient_id: string;
  service_name: string;
  service_price: number;
  requested_at: string;
  patient_name: string;
  doctor_name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

const SecretaryPOS: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<QueueItem | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Array<{ service: Service; quantity: number }>>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa'>('cash');
  const [overridePassword, setOverridePassword] = useState<string>('');
  const [showOverride, setShowOverride] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load queue and service requests
  useEffect(() => {
    loadQueue();
    loadServiceRequests();
    loadServices();

    // Setup realtime subscriptions
    const serviceRequestSubscription = supabase
      .channel('service_requests_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'service_requests' },
        (payload) => {
          toast.success('🔔 طلب خدمة جديد من الطبيب!', { duration: 5000 });
          loadServiceRequests();
        }
      )
      .subscribe();

    const appointmentSubscription = supabase
      .channel('appointments_channel')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      serviceRequestSubscription.unsubscribe();
      appointmentSubscription.unsubscribe();
    };
  }, []);

  const loadQueue = async () => {
    const { data, error } = await supabase
      .from('secretary_queue_view')
      .select('*')
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error loading queue:', error);
      toast.error('فشل تحميل قائمة المواعيد');
    } else {
      setQueue(data || []);
    }
  };

  const loadServiceRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        patients!service_requests_patient_id_fkey(name),
        doctors!service_requests_requested_by_fkey(name)
      `)
      .eq('status', 'requested')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error loading service requests:', error);
    } else {
      const formatted = data?.map((sr: any) => ({
        id: sr.id,
        appointment_id: sr.appointment_id,
        patient_id: sr.patient_id,
        service_name: sr.service_name,
        service_price: sr.service_price,
        requested_at: sr.requested_at,
        patient_name: sr.patients?.name || '',
        doctor_name: sr.doctors?.name || ''
      })) || [];
      setServiceRequests(formatted);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, price')
      .order('name');

    if (error) {
      console.error('Error loading services:', error);
    } else {
      setServices(data || []);
    }
  };

  const handleSelectAppointment = (item: QueueItem) => {
    setSelectedAppointment(item);
    setSelectedServices([]);
    setAmountPaid(0);
    setOverridePassword('');
    setShowOverride(false);
  };

  const addServiceToInvoice = (service: Service) => {
    const existing = selectedServices.find(s => s.service.id === service.id);
    if (existing) {
      setSelectedServices(selectedServices.map(s => 
        s.service.id === service.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
    } else {
      setSelectedServices([...selectedServices, { service, quantity: 1 }]);
    }
  };

  const removeServiceFromInvoice = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.service.id !== serviceId));
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeServiceFromInvoice(serviceId);
    } else {
      setSelectedServices(selectedServices.map(s => 
        s.service.id === serviceId ? { ...s, quantity } : s
      ));
    }
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, item) => 
      sum + (item.service.price * item.quantity), 0
    );
  };

  const handleSaveInvoice = async () => {
    if (!selectedAppointment) return;
    
    setIsLoading(true);
    try {
      // Create invoice
      const invoiceData = {
        appointment_id: selectedAppointment.appointment_id,
        patient_id: selectedAppointment.patient_id,
        total: calculateTotal(),
        paid_amount: amountPaid,
        payment_method: paymentMethod,
        items: selectedServices.map(s => ({
          service_id: s.service.id,
          service_name: s.service.name,
          quantity: s.quantity,
          unit_price: s.service.price,
          total: s.service.price * s.quantity
        })),
        is_from_service_request: false
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      if (invoice && selectedServices.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(
            selectedServices.map(s => ({
              invoice_id: invoice.id,
              service_id: s.service.id,
              quantity: s.quantity,
              unit_price: s.service.price,
              total: s.service.price * s.quantity
            }))
          );

        if (itemsError) throw itemsError;
      }

      toast.success('✅ تم حفظ الفاتورة بنجاح');
      
      // Clear form
      setSelectedServices([]);
      setAmountPaid(0);
      
      // Reload queue
      await loadQueue();
      
      // Open receipt in new window
      window.open(`/pos/receipt/${invoice.id}`, '_blank');
      
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      toast.error('فشل حفظ الفاتورة: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedAppointment) return;

    const totalRequired = selectedAppointment.amount_required + calculateTotal();
    const totalPaid = selectedAppointment.amount_paid + amountPaid;

    // Check if payment is complete or override is provided
    const needsOverride = totalPaid < totalRequired;
    
    if (needsOverride && !overridePassword) {
      setShowOverride(true);
      toast.error('المبلغ المدفوع أقل من المطلوب. أدخل كلمة مرور المسؤول للمتابعة.');
      return;
    }

    setIsLoading(true);
    try {
      // Call the check-in function
      const { data, error } = await supabase.rpc('secretary_check_in_patient', {
        p_appointment_id: selectedAppointment.appointment_id,
        p_override_password: overridePassword || null
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        toast.error(result.error || 'فشل تسجيل الحضور');
        return;
      }

      toast.success('✅ تم تسجيل حضور المريض بنجاح!');
      
      // Reload queue
      await loadQueue();
      
      // Clear selection
      setSelectedAppointment(null);
      setOverridePassword('');
      setShowOverride(false);
      
    } catch (err: any) {
      console.error('Error checking in patient:', err);
      toast.error('فشل تسجيل الحضور: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFulfillServiceRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('✅ تم تحصيل الخدمة');
      loadServiceRequests();
      loadQueue();
      
    } catch (err: any) {
      console.error('Error fulfilling service request:', err);
      toast.error('فشل تحديث الطلب');
    }
  };

  const totalRequired = selectedAppointment 
    ? selectedAppointment.amount_required + calculateTotal()
    : 0;
  
  const totalPaid = selectedAppointment 
    ? selectedAppointment.amount_paid + amountPaid
    : 0;

  const canCheckIn = totalPaid >= totalRequired || overridePassword.length > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="w-8 h-8" />
        نقطة تحصيل السكرتارية (POS)
      </h1>

      {/* Service Requests Notifications */}
      {serviceRequests.length > 0 && (
        <div className="mb-6 bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-orange-600 animate-bounce" />
            <h3 className="font-bold text-orange-800">طلبات خدمات من الأطباء ({serviceRequests.length})</h3>
          </div>
          <div className="space-y-2">
            {serviceRequests.map(req => (
              <div key={req.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{req.patient_name} - {req.service_name}</p>
                  <p className="text-sm text-gray-600">طلب من: {req.doctor_name} - السعر: {req.service_price} جنيه</p>
                </div>
                <button
                  onClick={() => handleFulfillServiceRequest(req.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  تحصيل
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              قائمة المواعيد اليوم
            </h2>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {queue.map(item => (
                <button
                  key={item.appointment_id}
                  onClick={() => handleSelectAppointment(item)}
                  className={`w-full text-right p-3 rounded-lg border-2 transition ${
                    selectedAppointment?.appointment_id === item.appointment_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${
                    item.payment_status === 'paid' && item.checked_in_at
                      ? 'bg-green-50'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {item.patient_name}
                      </p>
                      <p className="text-sm text-gray-600">{item.patient_phone}</p>
                      <p className="text-sm text-gray-500">الموعد: {item.appointment_time}</p>
                      {item.patient_old_debt > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded mt-1">
                          <AlertCircle className="w-3 h-3" />
                          دين سابق: {item.patient_old_debt} جنيه
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      {item.payment_status === 'paid' && item.checked_in_at ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : item.payment_status === 'partially_paid' ? (
                        <Clock className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <Lock className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice Builder */}
        <div className="lg:col-span-2">
          {selectedAppointment ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">بناء الفاتورة</h2>
              
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-lg mb-2">{selectedAppointment.patient_name}</h3>
                <p className="text-sm text-gray-600">الهاتف: {selectedAppointment.patient_phone}</p>
                <p className="text-sm text-gray-600">الطبيب: {selectedAppointment.doctor_name}</p>
                {selectedAppointment.patient_old_debt > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700 font-medium">⚠️ دين سابق: {selectedAppointment.patient_old_debt} جنيه</p>
                  </div>
                )}
              </div>

              {/* Add Services */}
              <div className="mb-4">
                <label className="block font-medium mb-2">إضافة خدمات:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => {
                    const service = services.find(s => s.id === e.target.value);
                    if (service) addServiceToInvoice(service);
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="">اختر خدمة...</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.price} جنيه
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">الخدمات المضافة:</h3>
                  <div className="space-y-2">
                    {selectedServices.map(item => (
                      <div key={item.service.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{item.service.name}</p>
                          <p className="text-sm text-gray-600">{item.service.price} جنيه × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="px-3">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeServiceFromInvoice(item.service.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div className="border-t pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium mb-2">المبلغ المدفوع:</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">طريقة الدفع:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'visa')}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="cash">كاش</option>
                      <option value="visa">فيزا</option>
                    </select>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">المبلغ المطلوب السابق:</span>
                    <span>{selectedAppointment.amount_required.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">المدفوع السابق:</span>
                    <span className="text-green-600">{selectedAppointment.amount_paid.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">الخدمات الجديدة:</span>
                    <span>{calculateTotal().toFixed(2)} جنيه</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>إجمالي المطلوب:</span>
                      <span>{totalRequired.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>إجمالي المدفوع:</span>
                      <span>{totalPaid.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-red-600">
                      <span>المتبقي:</span>
                      <span>{(totalRequired - totalPaid).toFixed(2)} جنيه</span>
                    </div>
                  </div>
                </div>

                {/* Override Password */}
                {showOverride && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <label className="block font-medium mb-2 text-yellow-800">كلمة مرور المسؤول (للسماح بدخول بدون دفع كامل):</label>
                    <input
                      type="password"
                      value={overridePassword}
                      onChange={(e) => setOverridePassword(e.target.value)}
                      className="w-full p-2 border border-yellow-400 rounded-lg"
                      placeholder="أدخل كلمة المرور..."
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSaveInvoice}
                  disabled={selectedServices.length === 0 || isLoading}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  حفظ الفاتورة
                </button>

                <button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || isLoading}
                  className={`px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-white ${
                    canCheckIn 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canCheckIn ? (
                    <>
                      <Unlock className="w-5 h-5" />
                      تسجيل الحضور وفتح الملف
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      مقفل (في انتظار الدفع)
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center h-96">
              <p className="text-gray-400 text-xl">اختر موعد من القائمة لبناء الفاتورة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecretaryPOS;
