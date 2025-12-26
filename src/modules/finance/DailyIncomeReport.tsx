/**
 * DailyIncomeReport.tsx
 * Financial Analytics Dashboard with Recharts
 * Features: Revenue cards, Pie chart, Transactions table
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Banknote,
  CreditCard,
  Package,
  Receipt,
  Users,
  Clock,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { invoicesAPI } from '../../services/financialService';
import toast from 'react-hot-toast';

interface DailyIncomeReportProps {
  clinicId: string;
}

interface RevenueSummary {
  total: number;
  serviceRevenue: number;
  installmentRevenue: number;
  packageRevenue: number;
  cashPayments: number;
  cardPayments: number;
  invoiceCount: number;
}

export const DailyIncomeReport: React.FC<DailyIncomeReportProps> = ({ clinicId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [selectedDate, clinicId]);

  const fetchReport = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryData = await invoicesAPI.getDailyRevenue(clinicId, selectedDate);
      setSummary(summaryData);

      // Fetch detailed invoices
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;
      const invoicesData = await invoicesAPI.getInvoices(
        clinicId,
        startOfDay,
        endOfDay,
        'Paid'
      );
      setInvoices(invoicesData);
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error('خطأ في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (invoices.length === 0) {
      toast.error('لا توجد فواتير للتصدير');
      return;
    }

    const headers = ['رقم الفاتورة', 'المريض', 'المبلغ', 'طريقة الدفع', 'النوع', 'الوقت'];
    const rows = invoices.map((inv) => [
      inv.id.slice(0, 8),
      inv.patients?.name || 'غير محدد',
      inv.total_amount,
      inv.payment_method,
      inv.invoice_type === 'service' ? 'خدمة' : 'قسط',
      new Date(inv.created_at).toLocaleTimeString('ar-EG'),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير-${selectedDate}.csv`;
    link.click();

    toast.success('تم التصدير بنجاح');
  };

  // Pie Chart Data
  const pieData = summary
    ? [
        { name: 'خدمات', value: summary.serviceRevenue, color: '#0891B2' },
        { name: 'أقساط IVF', value: summary.installmentRevenue, color: '#10B981' },
        { name: 'باقات', value: summary.packageRevenue, color: '#F59E0B' },
      ].filter((item) => item.value > 0)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقرير اليومي</h2>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.length} فاتورة • {summary?.invoiceCount || 0} عملية دفع
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {summary?.total.toLocaleString() || 0} ج.م
          </div>
          <div className="text-sm opacity-80">إجمالي الإيرادات</div>
        </div>

        {/* Service Revenue */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              خدمات
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {summary?.serviceRevenue.toLocaleString() || 0} ج.م
          </div>
          <div className="text-sm text-gray-500">رسوم الخدمات</div>
        </div>

        {/* Installment Revenue */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
              أقساط
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {summary?.installmentRevenue.toLocaleString() || 0} ج.م
          </div>
          <div className="text-sm text-gray-500">أقساط IVF</div>
        </div>

        {/* Transaction Count */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {summary?.invoiceCount || 0}
          </div>
          <div className="text-sm text-gray-500">عدد الفواتير</div>
        </div>
      </div>

      {/* Charts & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">توزيع الإيرادات</h3>

          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `${value.toLocaleString()} ج.م`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد بيانات للعرض</p>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">طرق الدفع</h3>

          <div className="space-y-4">
            {/* Cash */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">نقداً</div>
                  <div className="text-xs text-gray-500">Cash Payments</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {summary?.cashPayments.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500">ج.م</div>
              </div>
            </div>

            {/* Card */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">بطاقات الدفع</div>
                  <div className="text-xs text-gray-500">Visa/Mastercard</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">
                  {summary?.cardPayments.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500">ج.م</div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">إجمالي المدفوعات</span>
                <span className="text-2xl font-bold text-teal-600">
                  {summary?.total.toLocaleString() || 0} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">آخر الفواتير (10)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  الوقت
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  المريض
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.slice(0, 10).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.created_at).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.patients?.name || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        invoice.invoice_type === 'service'
                          ? 'bg-blue-100 text-blue-700'
                          : invoice.invoice_type === 'installment'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {invoice.invoice_type === 'service'
                        ? 'خدمة'
                        : invoice.invoice_type === 'installment'
                        ? 'قسط'
                        : 'باقة'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {invoice.total_amount.toLocaleString()} ج.م
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {invoice.payment_method === 'Cash' ? (
                        <Banknote className="w-4 h-4 text-green-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm text-gray-600">{invoice.payment_method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">لا توجد فواتير لهذا اليوم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyIncomeReport;
