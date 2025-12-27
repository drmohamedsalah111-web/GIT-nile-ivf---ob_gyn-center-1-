import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, AlertTriangle, Receipt } from 'lucide-react';
import installmentsService, { Installment } from '../../services/installmentsService';
import toast from 'react-hot-toast';

interface InstallmentsTableProps {
  cycleId: string;
  patientId: string;
  patientName: string;
  onPaymentSuccess?: () => void;
}

export const InstallmentsTable: React.FC<InstallmentsTableProps> = ({
  cycleId,
  patientId,
  patientName,
  onPaymentSuccess
}) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadInstallments();
  }, [cycleId]);

  const loadInstallments = async () => {
    setLoading(true);
    try {
      const { data, error } = await installmentsService.getInstallmentsByCycle(cycleId);
      if (error) throw error;
      setInstallments(data || []);
    } catch (error: any) {
      console.error('Error loading installments:', error);
      toast.error('فشل تحميل الأقساط');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (installment: Installment) => {
    if (payingId) return; // Prevent double-click

    const paymentMethod = window.prompt(
      'اختر طريقة الدفع:\n1 = نقداً\n2 = بطاقة\n3 = تحويل بنكي\n4 = تأمين\n5 = أخرى',
      '1'
    );

    if (!paymentMethod) return;

    const methodMap: any = {
      '1': 'cash',
      '2': 'card',
      '3': 'bank_transfer',
      '4': 'insurance',
      '5': 'other'
    };

    const method = methodMap[paymentMethod] || 'cash';
    const receiptNumber = `REC-${Date.now()}-${installment.installment_number}`;

    setPayingId(installment.id);

    try {
      // جلب معلومات المستخدم الحالي
      const { data: { user } } = await installmentsService['supabase'].auth.getUser();
      if (!user) throw new Error('لم يتم العثور على المستخدم');

      const { success, error } = await installmentsService.payInstallment(installment.id, {
        amount: installment.amount - (installment.paid_amount || 0), // المبلغ المتبقي
        payment_method: method,
        receipt_number: receiptNumber,
        recorded_by: user.id,
        notes: `دفعة القسط ${installment.installment_number} - ${patientName}`
      });

      if (!success) throw error;

      toast.success(`✅ تم دفع ${installment.installment_name_ar} بنجاح`);
      loadInstallments(); // Refresh list
      onPaymentSuccess?.();

      // Print receipt
      printReceipt(installment, receiptNumber, method);
    } catch (error: any) {
      console.error('Error paying installment:', error);
      toast.error('فشل تسجيل الدفعة: ' + error.message);
    } finally {
      setPayingId(null);
    }
  };

  const printReceipt = (installment: Installment, receiptNumber: string, method: string) => {
    const methodAr: any = {
      cash: 'نقداً',
      card: 'بطاقة',
      bank_transfer: 'تحويل بنكي',
      insurance: 'تأمين',
      other: 'أخرى'
    };

    const receiptContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال دفع - ${receiptNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; direction: rtl; }
          .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; }
          .label { font-weight: bold; }
          .value { }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>إيصال دفع - قسط حقن مجهري</h2>
            <p>رقم الإيصال: ${receiptNumber}</p>
          </div>
          <div class="row"><span class="label">المريضة:</span><span class="value">${patientName}</span></div>
          <div class="row"><span class="label">القسط:</span><span class="value">${installment.installment_name_ar}</span></div>
          <div class="row"><span class="label">المبلغ:</span><span class="value">${installment.amount.toLocaleString('ar-EG')} ج.م</span></div>
          <div class="row"><span class="label">طريقة الدفع:</span><span class="value">${methodAr[method]}</span></div>
          <div class="row"><span class="label">التاريخ:</span><span class="value">${new Date().toLocaleDateString('ar-EG')}</span></div>
          <div class="row"><span class="label">الوقت:</span><span class="value">${new Date().toLocaleTimeString('ar-EG')}</span></div>
          <div class="footer">
            <p>شكراً لثقتكم</p>
            <p>برمجة و تطوير د محمد صلاح جبر 2026</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { icon: Clock, color: 'bg-gray-100 text-gray-600', label: 'مؤجل' },
      due: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700', label: 'مستحق' },
      paid: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'مدفوع' },
      overdue: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'متأخر' },
      cancelled: { icon: AlertTriangle, color: 'bg-gray-100 text-gray-500', label: 'ملغي' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (installments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>لا توجد أقساط لهذه الدورة</p>
        <p className="text-sm">يمكن إنشاء أقساط عند بدء دورة جديدة مع اختيار باقة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-teal-600" />
          جدول الأقساط
        </h3>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">#</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">اسم القسط</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">المبلغ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">المدفوع</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">المتبقي</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">الحالة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">تاريخ الاستحقاق</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((inst) => {
              const remaining = inst.amount - (inst.paid_amount || 0);
              const canPay = inst.status === 'due' || inst.status === 'overdue';

              return (
                <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{inst.installment_number}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{inst.installment_name_ar}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {inst.amount.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">
                    {(inst.paid_amount || 0).toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">
                    {remaining.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(inst.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {inst.due_date ? new Date(inst.due_date).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {canPay && remaining > 0 ? (
                      <button
                        onClick={() => handlePay(inst)}
                        disabled={payingId === inst.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all ${
                          payingId === inst.id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 hover:shadow-lg'
                        }`}
                      >
                        {payingId === inst.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>جاري الدفع...</span>
                          </>
                        ) : (
                          <>
                            <Receipt className="w-4 h-4" />
                            <span>دفع</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-800">الإجمالي</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                {installments.reduce((sum, i) => sum + i.amount, 0).toLocaleString('ar-EG')} ج.م
              </td>
              <td className="px-4 py-3 text-sm font-bold text-green-600">
                {installments.reduce((sum, i) => sum + (i.paid_amount || 0), 0).toLocaleString('ar-EG')} ج.م
              </td>
              <td className="px-4 py-3 text-sm font-bold text-red-600">
                {installments.reduce((sum, i) => sum + (i.amount - (i.paid_amount || 0)), 0).toLocaleString('ar-EG')} ج.م
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default InstallmentsTable;
