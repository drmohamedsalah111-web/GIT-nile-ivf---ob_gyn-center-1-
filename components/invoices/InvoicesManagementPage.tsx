/**
 * InvoicesManagementPage.tsx
 * 📊 صفحة إدارة الفواتير الذكية للسكرتيرة
 * Features:
 * - ✅ عرض الفواتير اليومية/الشهرية
 * - 🔍 بحث وفلترة متقدمة
 * - 📊 إحصائيات مباشرة
 * - 🖨️ طباعة الفاتورة
 * - ✏️ تعديل الفاتورة
 * - 🗑️ حذف الفاتورة
 */

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Edit,
  Trash2,
  Eye,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Banknote,
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import SmartInvoiceForm from './SmartInvoiceForm';
import toast from 'react-hot-toast';

interface InvoicesManagementPageProps {
  secretaryId: string;
  doctorId: string;
  secretaryName: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  payment_reference?: string;
  status: string;
  patients: {
    name: string;
    phone: string;
  };
  invoice_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

const InvoicesManagementPage: React.FC<InvoicesManagementPageProps> = ({
  secretaryId,
  doctorId,
  secretaryName
}) => {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    cash: 0,
    visa: 0,
    bank: 0,
    totalMonth: 0 // Keep for the month card if still needed, but we'll focus on dynamic
  });

  useEffect(() => {
    fetchInvoices();
  }, [dateFilter, secretaryId]);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, paymentMethodFilter, invoices]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      let startDate = '';
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          startDate = new Date().toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'year':
          const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
          startDate = yearAgo.toISOString().split('T')[0];
          break;
        case 'all':
          startDate = '2020-01-01';
          break;
      }

      // Fetch from both tables separately to avoid view relationship issues
      const [standardInvoices, posInvoices] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            created_at,
            total_amount,
            payment_method,
            status,
            appointment_id,
            patient_id,
            patients(name, phone)
          `)
          .eq('clinic_id', doctorId)
          .gte('created_at', `${startDate}T00:00:00`)
          .in('status', ['paid', 'Paid', 'pending', 'Pending'])
          .order('created_at', { ascending: false }),

        supabase
          .from('pos_invoices')
          .select(`
            id,
            invoice_number,
            created_at,
            total_amount,
            payment_method,
            status,
            appointment_id,
            patient_id,
            patients(name, phone)
          `)
          .eq('clinic_id', doctorId)
          .gte('created_at', `${startDate}T00:00:00`)
          .in('status', ['paid', 'Paid', 'pending', 'Pending'])
          .order('created_at', { ascending: false })
      ]);

      if (standardInvoices.error) throw standardInvoices.error;
      if (posInvoices.error) throw posInvoices.error;

      // Combine and format the results
      const combinedData = [
        ...(standardInvoices.data || []).map((inv: any) => ({
          ...inv,
          source_type: 'standard',
          invoice_number: inv.invoice_number || `INV-${inv.id.substring(0, 8).toUpperCase()}`,
          patient_name: inv.patients?.name || 'مريض غير معروف',
          patient_phone: inv.patients?.phone || '-',
          paid_amount: inv.paid_amount || (inv.status?.toLowerCase() === 'paid' ? inv.total_amount : 0)
        })),
        ...(posInvoices.data || []).map((inv: any) => ({
          ...inv,
          source_type: 'pos',
          patient_name: inv.patients?.name || 'مريض غير معروف',
          patient_phone: inv.patients?.phone || '-',
          paid_amount: inv.paid_amount || 0
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const data = combinedData;
      const error = null;

      if (error) throw error;

      // Map flat columns back to the nested structure the UI expects
      const formattedData = (data || []).map((inv: any) => ({
        ...inv,
        patients: {
          name: inv.patient_name || 'مريض غير معروف',
          phone: inv.patient_phone || '-'
        }
      }));

      setInvoices(formattedData as any);
      calculateStats(formattedData as any);
    } catch (error: any) {
      console.error('Fetch invoices error:', error);
      toast.error('فشل تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesList: Invoice[]) => {
    const total = invoicesList.reduce((sum, inv) => sum + inv.total_amount, 0);
    const count = invoicesList.length;

    const cash = invoicesList
      .filter(inv => inv.payment_method?.toLowerCase() === 'cash')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const visa = invoicesList
      .filter(inv => inv.payment_method?.toLowerCase() === 'visa')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const bank = invoicesList
      .filter(inv =>
        inv.payment_method?.toLowerCase() === 'bank_transfer' ||
        inv.payment_method?.toLowerCase() === 'bank transfer'
      )
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    // Still need totalMonth for the 4th card (though we switched it to 'Bank')
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const totalMonth = invoicesList
      .filter(inv => inv.created_at >= monthStartStr)
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    setStats({
      total,
      count,
      cash,
      visa,
      bank,
      totalMonth
    });
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        inv =>
          inv.patients.name.toLowerCase().includes(query) ||
          inv.patients.phone.includes(query) ||
          inv.invoice_number.toLowerCase().includes(query)
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(inv =>
        inv.payment_method?.toLowerCase() === paymentMethodFilter.toLowerCase() ||
        inv.payment_method?.toLowerCase().replace(' ', '_') === paymentMethodFilter.toLowerCase()
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleViewInvoice = async (invoice: any) => {
    try {
      const itemsTable = invoice.source_type === 'pos' ? 'pos_invoice_items' : 'invoice_items';
      const descriptionCol = invoice.source_type === 'pos' ? 'description' : 'service_name';

      const { data: items, error } = await supabase
        .from(itemsTable)
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at');

      if (error) throw error;

      // Normalize items for display
      const normalizedItems = (items || []).map((item: any) => ({
        ...item,
        description: item[descriptionCol] || item.description || 'خدمة',
        total: item.total || item.total_price || 0
      }));

      setSelectedInvoice({
        ...invoice,
        invoice_items: normalizedItems
      });
      setShowInvoiceDetails(true);
    } catch (error) {
      console.error('View invoice error:', error);
      toast.error('فشل تحميل تفاصيل الفاتورة');
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tajawal', Arial, sans-serif; padding: 20px; }
          .invoice { max-width: 800px; margin: 0 auto; border: 2px solid #ddd; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #9333ea; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #9333ea; font-size: 28px; margin-bottom: 10px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .detail-box { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .detail-box label { font-weight: bold; color: #6b7280; font-size: 12px; display: block; margin-bottom: 5px; }
          .detail-box value { color: #111827; font-size: 16px; }
          .items { margin: 30px 0; }
          .items table { width: 100%; border-collapse: collapse; }
          .items th { background: #f3f4f6; padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; }
          .items td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .totals { margin-top: 30px; }
          .totals .row { display: flex; justify-content: space-between; padding: 10px 0; }
          .totals .total { font-size: 24px; font-weight: bold; color: #9333ea; border-top: 2px solid #9333ea; padding-top: 15px; margin-top: 15px; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>🏥 عيادة النيل للحقن المجهري</h1>
            <p style="color: #6b7280; font-size: 14px;">Nile IVF & Ob/Gyn Center</p>
          </div>

          <div class="details">
            <div class="detail-box">
              <label>رقم الفاتورة</label>
              <value>${invoice.invoice_number}</value>
            </div>
            <div class="detail-box">
              <label>التاريخ</label>
              <value>${new Date(invoice.created_at).toLocaleDateString('ar-EG')}</value>
            </div>
            <div class="detail-box">
              <label>اسم المريض</label>
              <value>${invoice.patients.name}</value>
            </div>
            <div class="detail-box">
              <label>رقم الهاتف</label>
              <value>${invoice.patients.phone}</value>
            </div>
          </div>

          ${invoice.invoice_items && invoice.invoice_items.length > 0 ? `
          <div class="items">
            <table>
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th style="text-align: center;">الكمية</th>
                  <th style="text-align: center;">السعر</th>
                  <th style="text-align: center;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.invoice_items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: center;">${item.unit_price.toFixed(2)} ج.م</td>
                    <td style="text-align: center;">${item.total.toFixed(2)} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="totals">
            <div class="row total">
              <span>الإجمالي:</span>
              <span>${invoice.total_amount.toFixed(2)} ج.م</span>
            </div>
            <div class="row" style="font-size: 14px; color: #6b7280;">
              <span>طريقة الدفع:</span>
              <span>${invoice.payment_method === 'Cash' ? '💵 نقداً' :
        invoice.payment_method === 'Visa' ? '💳 فيزا' :
          invoice.payment_method === 'Bank Transfer' ? '🏦 تحويل بنكي' :
            invoice.payment_method
      }</span>
            </div>
          </div>

          <div class="footer">
            <p>تم إصدار هذه الفاتورة بواسطة: ${secretaryName}</p>
            <p style="margin-top: 10px;">شكراً لثقتكم - نتمنى لكم دوام الصحة والعافية</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDeleteInvoice = async (invoice: any) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذه العملية.')) {
      return;
    }

    try {
      const toastId = toast.loading('جاري الحذف...');
      const targetTable = invoice.source_type === 'pos' ? 'pos_invoices' : 'invoices';

      const { error } = await supabase
        .from(targetTable)
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success('✅ تم حذف الفاتورة', { id: toastId });
      fetchInvoices();
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      toast.error('فشل حذف الفاتورة');
    }
  };

  if (showInvoiceForm) {
    return (
      <SmartInvoiceForm
        secretaryId={secretaryId}
        doctorId={doctorId}
        onSuccess={() => {
          setShowInvoiceForm(false);
          fetchInvoices();
        }}
        onCancel={() => setShowInvoiceForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الفواتير</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة وتتبع جميع الفواتير</p>
        </div>
        <button
          onClick={() => setShowInvoiceForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          فاتورة جديدة
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats.total.toLocaleString()} ج.م
          </div>
          <div className="text-sm text-gray-600">إجمالي {
            dateFilter === 'today' ? 'اليوم' :
              dateFilter === 'week' ? 'الأسبوع' :
                dateFilter === 'month' ? 'الشهر' :
                  dateFilter === 'year' ? 'السنة' : 'الفترة'
          }</div>
          <div className="text-xs text-gray-400 mt-1">{stats.count} فاتورة</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Banknote className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats.cash.toLocaleString()} ج.م
          </div>
          <div className="text-sm text-gray-600">نقداً {
            dateFilter === 'today' ? 'اليوم' :
              dateFilter === 'week' ? 'الأسبوع' :
                dateFilter === 'month' ? 'الشهر' :
                  dateFilter === 'year' ? 'السنة' : 'الفترة'
          }</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <CreditCard className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats.visa.toLocaleString()} ج.م
          </div>
          <div className="text-sm text-gray-600">فيزا {
            dateFilter === 'today' ? 'اليوم' :
              dateFilter === 'week' ? 'الأسبوع' :
                dateFilter === 'month' ? 'الشهر' :
                  dateFilter === 'year' ? 'السنة' : 'الفترة'
          }</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mb-1">
            {stats.bank.toLocaleString()} ج.م
          </div>
          <div className="text-sm text-gray-600">بنك {
            dateFilter === 'today' ? 'اليوم' :
              dateFilter === 'week' ? 'الأسبوع' :
                dateFilter === 'month' ? 'الشهر' :
                  dateFilter === 'year' ? 'السنة' : 'الفترة'
          }</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف أو رقم الفاتورة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="today">اليوم</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">آخر 30 يوم</option>
            <option value="year">آخر سنة</option>
            <option value="all">الكل</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">جميع طرق الدفع</option>
            <option value="Cash">نقداً</option>
            <option value="Visa">فيزا</option>
            <option value="Bank Transfer">تحويل بنكي</option>
            <option value="Insurance">تأمين</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المريض
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الخدمة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>لا توجد فواتير</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(invoice.created_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.patients.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.patients.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 max-w-[150px] truncate" title={invoice.invoice_items?.map(i => i.description).join(', ')}>
                        {invoice.invoice_items?.map(i => i.description).join(', ') || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-purple-600">
                        {invoice.total_amount.toLocaleString()} ج.م
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${invoice.payment_method === 'Cash' ? 'bg-green-100 text-green-700' :
                        invoice.payment_method === 'Visa' ? 'bg-blue-100 text-blue-700' :
                          invoice.payment_method === 'Bank Transfer' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {invoice.payment_method === 'Cash' && <Banknote className="w-3 h-3" />}
                        {invoice.payment_method === 'Visa' && <CreditCard className="w-3 h-3" />}
                        {invoice.payment_method === 'Bank Transfer' && <Building2 className="w-3 h-3" />}
                        {invoice.payment_method === 'Cash' ? 'نقداً' :
                          invoice.payment_method === 'Visa' ? 'فيزا' :
                            invoice.payment_method === 'Bank Transfer' ? 'تحويل بنكي' :
                              invoice.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="عرض"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(invoice)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="طباعة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showInvoiceDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  تفاصيل الفاتورة {selectedInvoice.invoice_number}
                </h3>
                <button
                  onClick={() => setShowInvoiceDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">بيانات المريض</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">الاسم:</span>
                    <span className="font-medium mr-2">{selectedInvoice.patients.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">الهاتف:</span>
                    <span className="font-medium mr-2">{selectedInvoice.patients.phone}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              {selectedInvoice.invoice_items && selectedInvoice.invoice_items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">تفاصيل الفاتورة</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right">الوصف</th>
                          <th className="px-4 py-2 text-center">الكمية</th>
                          <th className="px-4 py-2 text-center">السعر</th>
                          <th className="px-4 py-2 text-center">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvoice.invoice_items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-center">{item.unit_price.toFixed(2)} ج.م</td>
                            <td className="px-4 py-3 text-center font-medium">{item.total.toFixed(2)} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-xl font-bold text-purple-600">
                  <span>الإجمالي:</span>
                  <span>{selectedInvoice.total_amount.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                  <span>طريقة الدفع:</span>
                  <span>
                    {selectedInvoice.payment_method === 'Cash' ? 'نقداً' :
                      selectedInvoice.payment_method === 'Visa' ? 'فيزا' :
                        selectedInvoice.payment_method === 'Bank Transfer' ? 'تحويل بنكي' :
                          selectedInvoice.payment_method}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
                <button
                  onClick={() => setShowInvoiceDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesManagementPage;
