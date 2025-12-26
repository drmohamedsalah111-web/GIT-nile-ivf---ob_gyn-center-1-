/**
 * QuickInvoiceModal.tsx
 * Point of Sale modal for receptionist to create service invoices
 * Features: Patient search, Service selector, Cart, Checkout
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Receipt,
  Percent,
  Check,
} from 'lucide-react';
import { servicesAPI, invoicesAPI, Service } from '../../services/financialService';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface CartItem {
  service: Service;
  quantity: number;
  price: number; // Allow price override
  total: number;
}

interface QuickInvoiceModalProps {
  clinicId: string;
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickInvoiceModal: React.FC<QuickInvoiceModalProps> = ({
  clinicId,
  doctorId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'patient' | 'cart' | 'payment'>('patient');

  // Patient Selection
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Services & Cart
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Visa' | 'Bank Transfer'>('Cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [patientSearch]);

  const fetchServices = async () => {
    try {
      const data = await servicesAPI.getServices(clinicId);
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const searchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, email')
        .or(`name.ilike.%${patientSearch}%,phone.ilike.%${patientSearch}%`)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const resetForm = () => {
    setStep('patient');
    setSelectedPatient(null);
    setPatientSearch('');
    setPatients([]);
    setServiceSearch('');
    setCart([]);
    setPaymentMethod('Cash');
    setDiscount(0);
    setNotes('');
  };

  const handleAddToCart = (service: Service) => {
    const existingItem = cart.find((item) => item.service.id === service.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.service.id === service.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: item.price * (item.quantity + 1),
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          service,
          quantity: 1,
          price: service.price,
          total: service.price,
        },
      ]);
    }

    toast.success(`تم إضافة ${service.name}`);
  };

  const handleRemoveFromCart = (serviceId: string) => {
    setCart(cart.filter((item) => item.service.id !== serviceId));
  };

  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(serviceId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.service.id === serviceId
          ? { ...item, quantity, total: item.price * quantity }
          : item
      )
    );
  };

  const handleUpdatePrice = (serviceId: string, price: number) => {
    setCart(
      cart.map((item) =>
        item.service.id === serviceId
          ? { ...item, price, total: price * item.quantity }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const handleCheckout = async () => {
    if (!selectedPatient) {
      toast.error('اختر المريض أولاً');
      return;
    }

    if (cart.length === 0) {
      toast.error('أضف خدمة واحدة على الأقل');
      return;
    }

    try {
      setProcessing(true);

      const invoiceItems = cart.map((item) => ({
        service_id: item.service.id,
        service_name: item.service.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total,
      }));

      await invoicesAPI.createServiceInvoice(
        clinicId,
        selectedPatient.id,
        doctorId,
        invoiceItems,
        paymentMethod,
        discount,
        notes
      );

      toast.success('تم إنشاء الفاتورة بنجاح');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error('خطأ في إنشاء الفاتورة');
    } finally {
      setProcessing(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">فاتورة سريعة</h2>
              <p className="text-sm text-gray-500">نقطة البيع</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'patient' ? 'bg-teal-100 text-teal-700' : 'bg-white text-gray-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                selectedPatient ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {selectedPatient ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="font-semibold">المريض</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'cart' ? 'bg-teal-100 text-teal-700' : 'bg-white text-gray-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                cart.length > 0 ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {cart.length > 0 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className="font-semibold">الخدمات</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'payment' ? 'bg-teal-100 text-teal-700' : 'bg-white text-gray-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span className="font-semibold">الدفع</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Patient Selection */}
          {step === 'patient' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ابحث عن المريض
                </label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="اسم المريض أو رقم الهاتف..."
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              {/* Selected Patient */}
              {selectedPatient && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-teal-900">{selectedPatient.name}</div>
                      <div className="text-sm text-teal-700">{selectedPatient.phone}</div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-teal-600 hover:text-teal-700"
                    >
                      تغيير
                    </button>
                  </div>
                </div>
              )}

              {/* Patient List */}
              {!selectedPatient && patients.length > 0 && (
                <div className="space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setStep('cart');
                      }}
                      className="w-full text-right p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors"
                    >
                      <div className="font-semibold text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-600">{patient.phone}</div>
                    </button>
                  ))}
                </div>
              )}

              {!selectedPatient && patientSearch && patients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>لم يتم العثور على مرضى</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Cart & Services */}
          {step === 'cart' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Services List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">الخدمات المتاحة</h3>

                <div className="mb-4">
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="ابحث عن خدمة..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleAddToCart(service)}
                      className="w-full text-right p-3 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500">{service.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-teal-600">
                            {service.price.toLocaleString()} ج.م
                          </span>
                          <Plus className="w-4 h-4 text-teal-600" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  السلة ({cart.length})
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>السلة فارغة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.service.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.service.name}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.service.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">الكمية</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.service.id, parseInt(e.target.value))
                              }
                              min="1"
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">السعر</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleUpdatePrice(item.service.id, parseFloat(e.target.value))
                              }
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">الإجمالي</label>
                            <div className="px-2 py-1 bg-gray-50 rounded font-semibold">
                              {item.total.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>الإجمالي:</span>
                        <span className="text-teal-600">
                          {calculateSubtotal().toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{calculateSubtotal().toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">الخصم:</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                      max={calculateSubtotal()}
                      className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-left"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-300 flex items-center justify-between">
                    <span className="text-lg font-bold">الإجمالي النهائي:</span>
                    <span className="text-2xl font-bold text-teal-600">
                      {calculateTotal().toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  طريقة الدفع
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'Cash'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'Cash' ? 'text-teal-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="text-sm font-semibold">نقداً</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Visa')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'Visa'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'Visa' ? 'text-teal-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="text-sm font-semibold">فيزا</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Bank Transfer')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'Bank Transfer'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Receipt
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'Bank Transfer' ? 'text-teal-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="text-sm font-semibold">تحويل بنكي</div>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="أدخل أي ملاحظات..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {step !== 'patient' && (
              <button
                onClick={() => setStep(step === 'payment' ? 'cart' : 'patient')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                رجوع
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
            >
              إلغاء
            </button>

            {step === 'patient' && selectedPatient && (
              <button
                onClick={() => setStep('cart')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                التالي
              </button>
            )}

            {step === 'cart' && cart.length > 0 && (
              <button
                onClick={() => setStep('payment')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                الدفع
              </button>
            )}

            {step === 'payment' && (
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    إتمام الفاتورة
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickInvoiceModal;
