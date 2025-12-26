/**
 * CaseBillingTracker.tsx
 * IVF Patient Installment Payment Tracker
 * Features: Progress bar, Installments list, Payment modal
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  casesAPI,
  installmentsAPI,
  invoicesAPI,
  FinancialCase,
  Installment,
} from '../../services/financialService';
import toast from 'react-hot-toast';

interface CaseBillingTrackerProps {
  patientId: string;
  clinicId: string;
  doctorId: string;
}

export const CaseBillingTracker: React.FC<CaseBillingTrackerProps> = ({
  patientId,
  clinicId,
  doctorId,
}) => {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Visa' | 'Bank Transfer'>('Cash');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [patientId]);

  useEffect(() => {
    if (selectedCase) {
      fetchInstallments();
    }
  }, [selectedCase]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await casesAPI.getPatientCases(patientId);
      setCases(data);
      
      // Auto-select first open case
      const openCase = data.find((c: any) => c.status === 'Open');
      if (openCase) {
        setSelectedCase(openCase);
      }
    } catch (error: any) {
      console.error('Error fetching cases:', error);
      toast.error('خطأ في تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstallments = async () => {
    try {
      const data = await installmentsAPI.getCaseInstallments(selectedCase.id);
      setInstallments(data);
    } catch (error: any) {
      console.error('Error fetching installments:', error);
    }
  };

  const handlePayInstallment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInstallment || !selectedCase) return;

    try {
      setProcessing(true);

      // Create installment invoice
      await invoicesAPI.createInstallmentInvoice(
        clinicId,
        patientId,
        doctorId,
        selectedCase.id,
        selectedInstallment.id,
        selectedInstallment.amount,
        paymentMethod
      );

      toast.success('تم تسجيل الدفعة بنجاح');
      setShowPaymentModal(false);
      setSelectedInstallment(null);
      
      // Refresh data
      fetchCases();
      fetchInstallments();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('خطأ في معالجة الدفع');
    } finally {
      setProcessing(false);
    }
  };

  const getInstallmentStatus = (installment: Installment) => {
    if (installment.is_paid) {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'مدفوع' };
    }

    if (!installment.due_date) {
      return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: 'غير محدد' };
    }

    const today = new Date();
    const dueDate = new Date(installment.due_date);

    if (dueDate < today) {
      return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'متأخر' };
    } else if (dueDate.toDateString() === today.toDateString()) {
      return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'مستحق اليوم' };
    } else {
      return { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', label: 'قادم' };
    }
  };

  const calculateProgress = (financialCase: any) => {
    if (!financialCase) return 0;
    return (financialCase.paid_amount / financialCase.total_amount) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">لا توجد حالات مالية لهذا المريض</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Case Selector */}
      {cases.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اختر الحالة</label>
          <select
            value={selectedCase?.id || ''}
            onChange={(e) => {
              const caseData = cases.find((c) => c.id === e.target.value);
              setSelectedCase(caseData);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.packages?.name || 'حالة مخصصة'} - {c.status}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCase && (
        <>
          {/* Financial Summary Card */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold opacity-90">الحالة المالية</h3>
                <p className="text-2xl font-bold mt-1">
                  {selectedCase.packages?.name || 'حالة مخصصة'}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  selectedCase.status === 'Open'
                    ? 'bg-amber-500'
                    : selectedCase.status === 'Closed'
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                } bg-opacity-30`}
              >
                <span className="font-semibold">{selectedCase.status}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>المدفوع: {selectedCase.paid_amount.toLocaleString()} ج.م</span>
                <span>المتبقي: {selectedCase.remaining_amount.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full h-4 bg-white bg-opacity-20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${calculateProgress(selectedCase)}%` }}
                ></div>
              </div>
              <div className="text-center text-sm font-semibold">
                {calculateProgress(selectedCase).toFixed(1)}% مكتمل
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white border-opacity-20">
              <div>
                <div className="text-xs opacity-80">الإجمالي</div>
                <div className="text-lg font-bold">
                  {selectedCase.total_amount.toLocaleString()} ج.م
                </div>
              </div>
              <div>
                <div className="text-xs opacity-80">المدفوع</div>
                <div className="text-lg font-bold text-green-300">
                  {selectedCase.paid_amount.toLocaleString()} ج.م
                </div>
              </div>
              <div>
                <div className="text-xs opacity-80">المتبقي</div>
                <div className="text-lg font-bold text-amber-300">
                  {selectedCase.remaining_amount.toLocaleString()} ج.م
                </div>
              </div>
            </div>
          </div>

          {/* Installments List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">جدول الدفعات</h3>
              <p className="text-sm text-gray-500 mt-1">
                {installments.filter((i) => i.is_paid).length} من {installments.length} مدفوع
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {installments.map((installment) => {
                const status = getInstallmentStatus(installment);
                const StatusIcon = status.icon;

                return (
                  <div key={installment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Status Icon */}
                        <div className={`p-3 rounded-xl ${status.bg}`}>
                          <StatusIcon className={`w-6 h-6 ${status.color}`} />
                        </div>

                        {/* Installment Details */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{installment.title}</h4>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold">
                                {installment.amount.toLocaleString()} ج.م
                              </span>
                            </div>

                            {installment.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(installment.due_date).toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {installment.is_paid && installment.paid_at && (
                            <div className="mt-2 text-xs text-green-600">
                              ✓ تم الدفع في{' '}
                              {new Date(installment.paid_at).toLocaleDateString('ar-EG')}
                              {installment.payment_method && ` - ${installment.payment_method}`}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {installment.is_paid ? (
                          <div
                            className={`px-4 py-2 rounded-lg ${status.bg} ${status.color} font-semibold`}
                          >
                            {status.label}
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePayInstallment(installment)}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            دفع
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-6">تأكيد الدفع</h3>

            {/* Installment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="font-semibold text-gray-900 mb-2">
                {selectedInstallment.title}
              </div>
              <div className="text-2xl font-bold text-teal-600">
                {selectedInstallment.amount.toLocaleString()} ج.م
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">طريقة الدفع</label>
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
                    className={`w-6 h-6 mx-auto mb-1 ${
                      paymentMethod === 'Cash' ? 'text-teal-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="text-xs font-semibold">نقداً</div>
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
                    className={`w-6 h-6 mx-auto mb-1 ${
                      paymentMethod === 'Visa' ? 'text-teal-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="text-xs font-semibold">فيزا</div>
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
                    className={`w-6 h-6 mx-auto mb-1 ${
                      paymentMethod === 'Bank Transfer' ? 'text-teal-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="text-xs font-semibold">تحويل</div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInstallment(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري المعالجة...
                  </div>
                ) : (
                  'تأكيد الدفع'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseBillingTracker;
