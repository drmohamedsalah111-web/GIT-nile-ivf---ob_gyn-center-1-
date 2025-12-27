/**
 * DailyCashPage.tsx
 * Daily cash audit page for receptionist
 * Shows only invoices collected by current secretary
 * Security: No total monthly profit or expenses shown
 */

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Banknote,
  CreditCard,
  Receipt,
  Printer,
  Download,
  DollarSign,
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface DailyCashPageProps {
  secretaryId: string;
  secretaryName: string;
}

interface Invoice {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  invoice_type: string;
  patients: {
    name: string;
  };
}

export const DailyCashPage: React.FC<DailyCashPageProps> = ({ secretaryId, secretaryName }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    totalCash: 0,
    totalVisa: 0,
    totalBank: 0,
    totalInsurance: 0,
    invoiceCount: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, [selectedDate, secretaryId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices collected by this secretary today
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          payment_reference,
          status,
          invoice_type,
          patients (
            name
          )
        `)
        .eq('created_by', secretaryId)
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .in('status', ['paid', 'Paid'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invoiceList = (data || []).map((inv: any) => ({
        ...inv,
        patients: Array.isArray(inv.patients) ? inv.patients[0] : inv.patients
      }));
      setInvoices(invoiceList);

      // Calculate summary
      const totalCash = invoiceList
        .filter(inv => inv.payment_method?.toLowerCase() === 'cash')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      const totalVisa = invoiceList
        .filter(inv => inv.payment_method?.toLowerCase() === 'visa')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      const totalBank = invoiceList
        .filter(inv => 
          inv.payment_method?.toLowerCase() === 'bank_transfer' || 
          inv.payment_method?.toLowerCase() === 'bank transfer'
        )
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      const totalInsurance = invoiceList
        .filter(inv => inv.payment_method?.toLowerCase() === 'insurance')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      setSummary({
        totalCash,
        totalVisa,
        totalBank,
        totalInsurance,
        invoiceCount: invoiceList.length
      });
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error('خطأ في تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الصندوق اليومي</title>
        <style>
          body {
            font-family: 'Tajawal', Arial, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #0891B2;
          }
          .info-box {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .summary-box {
            background: #e0f2fe;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #bae6fd;
          }
          .total-row {
            font-size: 1.2em;
            font-weight: bold;
            color: #0891B2;
            border-top: 2px solid #0891B2;
            padding-top: 15px;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
          }
          th {
            background-color: #0891B2;
            color: white;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .signature-line {
            display: inline-block;
            border-top: 1px solid #333;
            width: 200px;
            margin: 0 20px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير الصندوق اليومي</h1>
          <p>نظام إدارة العيادة</p>
        </div>

        <div class="info-box">
          <div class="info-row">
            <span><strong>التاريخ:</strong> ${new Date(selectedDate).toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span><strong>الوقت:</strong> ${new Date().toLocaleTimeString('ar-EG')}</span>
          </div>
          <div class="info-row">
            <span><strong>مسؤول الصندوق:</strong> ${secretaryName}</span>
            <span><strong>عدد الفواتير:</strong> ${summary.invoiceCount}</span>
          </div>
        </div>

        <div class="summary-box">
          <h3 style="margin-top: 0; color: #0891B2;">ملخص المحصلات</h3>
          <div class="summary-item">
            <span>💵 نقداً (Cash)</span>
            <span><strong>${summary.totalCash.toLocaleString()} ج.م</strong></span>
          </div>
          <div class="summary-item">
            <span>💳 فيزا (Visa)</span>
            <span><strong>${summary.totalVisa.toLocaleString()} ج.م</strong></span>
          </div>
          <div class="summary-item">
            <span>🏦 تحويل بنكي (Bank Transfer)</span>
            <span><strong>${summary.totalBank.toLocaleString()} ج.م</strong></span>
          </div>
          <div class="summary-item">
            <span>🏥 تأمين (Insurance)</span>
            <span><strong>${summary.totalInsurance.toLocaleString()} ج.م</strong></span>
          </div>
          <div class="summary-item total-row">
            <span>📊 الإجمالي</span>
            <span>${(summary.totalCash + summary.totalVisa + summary.totalBank + summary.totalInsurance).toLocaleString()} ج.م</span>
          </div>
        </div>

        <h3>تفاصيل الفواتير</h3>
        <table>
          <thead>
            <tr>
              <th>الوقت</th>
              <th>اسم المريض</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>رقم الإيصال</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(inv => `
              <tr>
                <td>${new Date(inv.created_at).toLocaleTimeString('ar-EG', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</td>
                <td>${inv.patients?.name || 'غير محدد'}</td>
                <td><strong>${inv.total_amount.toLocaleString()} ج.م</strong></td>
                <td>${inv.payment_method === 'Cash' ? 'نقداً' : 
                      inv.payment_method === 'Visa' ? 'فيزا' : 
                      inv.payment_method === 'Bank Transfer' ? 'تحويل بنكي' : 
                      inv.payment_method === 'Insurance' ? 'تأمين' : inv.payment_method}</td>
                <td>${inv.payment_reference || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div style="text-align: center; margin-top: 40px;">
            <div style="display: inline-block; margin: 0 40px;">
              <p>توقيع المسؤول</p>
              <div class="signature-line"></div>
            </div>
            <div style="display: inline-block; margin: 0 40px;">
              <p>توقيع المدير</p>
              <div class="signature-line"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    const headers = ['التاريخ', 'الوقت', 'اسم المريض', 'المبلغ', 'طريقة الدفع', 'رقم الإيصال'];
    const rows = invoices.map(inv => [
      selectedDate,
      new Date(inv.created_at).toLocaleTimeString('ar-EG'),
      inv.patients?.name || '',
      inv.total_amount,
      inv.payment_method,
      inv.payment_reference || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `صندوق-${selectedDate}.csv`;
    link.click();

    toast.success('تم التصدير بنجاح');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">الصندوق اليومي 💰</h1>
            <p className="opacity-90">تدقيق المحصلات لـ {secretaryName}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{(summary.totalCash + summary.totalVisa + summary.totalBank + summary.totalInsurance).toLocaleString()}</div>
            <div className="text-sm opacity-80">جنيه مصري</div>
          </div>
        </div>
      </div>

      {/* Date Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Banknote className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">{summary.totalCash.toLocaleString()}</div>
          <div className="text-sm text-gray-600">نقداً</div>
          <div className="text-xs text-gray-400 mt-1">Cash</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">{summary.totalVisa.toLocaleString()}</div>
          <div className="text-sm text-gray-600">فيزا</div>
          <div className="text-xs text-gray-400 mt-1">Visa</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">{summary.totalBank.toLocaleString()}</div>
          <div className="text-sm text-gray-600">تحويل بنكي</div>
          <div className="text-xs text-gray-400 mt-1">Bank Transfer</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mb-1">{summary.invoiceCount}</div>
          <div className="text-sm text-gray-600">عدد الفواتير</div>
          <div className="text-xs text-gray-400 mt-1">Invoices</div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-900">ملاحظة هامة</div>
          <div className="text-sm text-amber-700">
            هذا التقرير يعرض فقط الفواتير التي تم تحصيلها بواسطتك. يجب تسليمه للإدارة في نهاية الوردية.
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل الفواتير</h3>
          <p className="text-sm text-gray-500 mt-1">{invoices.length} فاتورة</p>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد فواتير في هذا التاريخ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الوقت</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">اسم المريض</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">طريقة الدفع</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">رقم الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {new Date(invoice.created_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{invoice.patients?.name || 'غير محدد'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-teal-600">{invoice.total_amount.toLocaleString()} ج.م</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        invoice.payment_method?.toLowerCase() === 'cash' ? 'bg-green-100 text-green-700' :
                        invoice.payment_method?.toLowerCase() === 'visa' ? 'bg-blue-100 text-blue-700' :
                        (invoice.payment_method?.toLowerCase() === 'bank_transfer' || invoice.payment_method?.toLowerCase() === 'bank transfer') ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.payment_method?.toLowerCase() === 'cash' && <Banknote className="w-4 h-4" />}
                        {invoice.payment_method?.toLowerCase() === 'visa' && <CreditCard className="w-4 h-4" />}
                        {(invoice.payment_method?.toLowerCase() === 'bank_transfer' || invoice.payment_method?.toLowerCase() === 'bank transfer') && <Receipt className="w-4 h-4" />}
                        {invoice.payment_method?.toLowerCase() === 'cash' ? 'نقداً' :
                         invoice.payment_method?.toLowerCase() === 'visa' ? 'فيزا' :
                         (invoice.payment_method?.toLowerCase() === 'bank_transfer' || invoice.payment_method?.toLowerCase() === 'bank transfer') ? 'تحويل بنكي' :
                         invoice.payment_method?.toLowerCase() === 'insurance' ? 'تأمين' :
                         invoice.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{invoice.payment_reference || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cash in Hand Summary */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">💵 النقدية في اليد</h3>
            <p className="text-sm text-green-700">المبلغ النقدي الذي يجب تسليمه</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-green-700">{summary.totalCash.toLocaleString()}</div>
            <div className="text-sm text-green-600">جنيه مصري</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCashPage;
