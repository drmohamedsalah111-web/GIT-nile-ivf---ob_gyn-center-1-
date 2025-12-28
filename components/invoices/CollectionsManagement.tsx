import React, { useState, useEffect } from 'react';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Download,
  Phone,
  User,
  Calendar,
  CreditCard,
  Banknote,
  Eye,
  Edit,
  FileText
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface CollectionsManagementProps {
  doctorId: string;
  secretaryId: string;
  secretaryName: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient?: { name: string; phone: string };
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  status: 'Paid' | 'Draft' | 'Cancelled' | 'Refunded';
  payment_method?: string;
  created_at: string;
  payment_history?: any[];
}

interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  created_by: string;
  notes?: string;
}

const CollectionsManagement: React.FC<CollectionsManagementProps> = ({
  doctorId,
  secretaryId,
  secretaryName
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'reports'>('pending');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash' as const,
    notes: ''
  });
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalInvoices: 0,
    collectionRate: 0,
    pendingAmount: 0,
    totalCollected: 0
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, filterStatus, activeTab]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          patient_id,
          patients:patient_id(name, phone),
          total_amount,
          status,
          payment_method,
          created_at
        `)
        .eq('clinic_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invoicesWithCalcs = data?.map((inv: any) => ({
        ...inv,
        patient: inv.patients,
        remaining_amount: inv.total_amount,
        paid_amount: 0
      })) || [];

      setInvoices(invoicesWithCalcs);
      calculateStats(invoicesWithCalcs);
    } catch (error: any) {
      console.error('Load invoices error:', error);
      toast.error('فشل تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoiceList: Invoice[]) => {
    const pending = invoiceList.filter(inv => inv.status?.toLowerCase() !== 'paid').length;
    const paid = invoiceList.filter(inv => inv.status?.toLowerCase() === 'paid').length;
    const pendingAmount = invoiceList
      .filter(inv => inv.status?.toLowerCase() !== 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalCollected = invoiceList
      .filter(inv => inv.status?.toLowerCase() === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalAmount = invoiceList.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    setStats({
      totalPending: pending,
      totalPaid: paid,
      totalInvoices: invoiceList.length,
      collectionRate: totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0,
      pendingAmount,
      totalCollected
    });
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (activeTab === 'pending') {
      filtered = filtered.filter(inv => inv.status?.toLowerCase() !== 'paid');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(inv => inv.status?.toLowerCase() === 'paid');
    }

    if (searchQuery) {
      filtered = filtered.filter(inv =>
        inv.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.patient?.phone?.includes(searchQuery) ||
        inv.invoice_number?.includes(searchQuery)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice || !paymentForm.amount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0 || amount > selectedInvoice.total_amount) {
      toast.error('المبلغ غير صحيح');
      return;
    }

    const toastId = toast.loading('جاري تسجيل الدفعة...');

    try {
      const newStatus = amount >= selectedInvoice.total_amount ? 'Paid' : selectedInvoice.status;

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: newStatus,
          payment_method: paymentForm.method,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInvoice.id);

      if (updateError) throw updateError;

      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert([{
          invoice_id: selectedInvoice.id,
          amount: amount,
          payment_method: paymentForm.method,
          payment_date: new Date().toISOString(),
          created_by: secretaryId,
          notes: paymentForm.notes,
          created_at: new Date().toISOString()
        }]);

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.warn('Payment record insert warning:', paymentError);
      }

      toast.success(`تم تسجيل دفعة ${amount} ج.م`, { id: toastId });
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', method: 'Cash', notes: '' });
      setSelectedInvoice(null);
      loadInvoices();
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`, { id: toastId });
      console.error('Payment error:', error);
    }
  };

  const exportToCSV = () => {
    const data = filteredInvoices.map(inv => ({
      'رقم الفاتورة': inv.invoice_number,
      'اسم المريضة': inv.patient?.name || '-',
      'الهاتف': inv.patient?.phone || '-',
      'المبلغ': inv.total_amount,
      'الحالة': inv.status,
      'التاريخ': new Date(inv.created_at).toLocaleDateString('ar-EG')
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_التحصيل_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" dir="rtl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          إدارة التحصيل والمقبوضات
        </h2>
        <p className="text-gray-600 text-sm mt-1">تحكم في الفواتير والمدفوعات</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">إجمالي الفواتير</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalInvoices}</p>
            </div>
            <Receipt className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">فواتير متبقية</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.totalPending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">فواتير مدفوعة</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalPaid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">مبالغ متبقية</p>
              <p className="text-xl font-bold text-red-900">{stats.pendingAmount.toLocaleString('ar-EG')} ج.م</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          الفواتير المتبقية ({stats.totalPending})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'paid'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          الفواتير المدفوعة ({stats.totalPaid})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          التقارير
        </button>
      </div>

      {/* Search & Filter */}
      {activeTab !== 'reports' && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو رقم الفاتورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير
          </button>
        </div>
      )}

      {/* Invoices Table */}
      {(activeTab === 'pending' || activeTab === 'paid') && (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3 rounded-r-lg">رقم الفاتورة</th>
                <th className="px-4 py-3">اسم المريضة</th>
                <th className="px-4 py-3">الهاتف</th>
                <th className="px-4 py-3">المبلغ</th>
                <th className="px-4 py-3">طريقة الدفع</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3 rounded-l-lg">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-600">{invoice.patient?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <a href={`tel:${invoice.patient?.phone}`} className="text-green-600 hover:underline">
                        {invoice.patient?.phone || '-'}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{invoice.total_amount?.toLocaleString('ar-EG')} ج.م</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {invoice.payment_method || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3">
                      {activeTab === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentForm(true);
                          }}
                          className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          تحصيل
                        </button>
                      )}
                      {activeTab === 'paid' && (
                        <span className="text-green-600 font-medium">✓ مدفوعة</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    لا توجد فواتير في هذه الفئة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                نسبة التحصيل
              </h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${stats.collectionRate}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm text-gray-600">
                    {stats.totalInvoices > 0
                      ? `${stats.totalPaid} من ${stats.totalInvoices} فاتورة مدفوعة`
                      : 'لا توجد فواتير'}
                  </p>
                </div>
                <div className="text-3xl font-bold text-green-600">{stats.collectionRate}%</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                إجمالي المقبوضات
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalCollected.toLocaleString('ar-EG')} ج.م
              </p>
              <p className="text-sm text-gray-600 mt-2">المجموع الذي تم تحصيله</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">تسجيل دفعة</h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">المريضة:</p>
              <p className="font-bold text-gray-900">{selectedInvoice.patient?.name}</p>
              <p className="text-sm text-gray-600 mt-2">الفاتورة:</p>
              <p className="font-bold text-gray-900">{selectedInvoice.invoice_number}</p>
              <p className="text-sm text-gray-600 mt-2">المبلغ الكامل:</p>
              <p className="font-bold text-lg text-blue-600">{selectedInvoice.total_amount?.toLocaleString('ar-EG')} ج.م</p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع *</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.total_amount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Cash">نقد</option>
                  <option value="Visa">بطاقة ائتمان</option>
                  <option value="Bank Transfer">تحويل بنكي</option>
                  <option value="Insurance">تأمين</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  تسجيل الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsManagement;
