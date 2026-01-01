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
import './mobile-optimized.css';

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
  invoice_items?: { description: string }[];
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
      // Fetch from both tables separately to avoid view relationship issues
      const [standardInvoices, posInvoices] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            patient_id,
            total_amount,
            paid_amount,
            status,
            payment_method,
            created_at,
            patients(name, phone)
          `)
          .eq('clinic_id', doctorId)
          .order('created_at', { ascending: false }),

        supabase
          .from('pos_invoices')
          .select(`
            id,
            invoice_number,
            patient_id,
            total_amount,
            paid_amount,
            status,
            payment_method,
            created_at,
            patients(name, phone)
          `)
          .eq('clinic_id', doctorId)
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

      const invoicesWithCalcs = data?.map((inv: any) => ({
        ...inv,
        patient: {
          name: inv.patient_name || 'مريض غير معروف',
          phone: inv.patient_phone || '-'
        },
        remaining_amount: Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)),
        paid_amount: inv.paid_amount || 0
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
      const targetTable = (selectedInvoice as any).source_type === 'pos' ? 'pos_invoices' : 'invoices';

      const { error: updateError } = await supabase
        .from(targetTable)
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
      'الخدمة': inv.invoice_items?.map(item => item.description).join(' - ') || '-',
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" dir="rtl">
      {/* Mobile-Optimized Header with Safe Area */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 safe-area-inset-top">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
          <span className="truncate">إدارة التحصيل والمقبوضات</span>
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">تحكم في الفواتير والمدفوعات</p>
      </div>

      <div className="px-4 sm:px-6 pb-6">
        {/* Statistics Cards - Mobile First Design */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 mb-6">
          {/* Mobile-Optimized Stats Cards */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-600 text-xs sm:text-sm font-medium truncate">إجمالي الفواتير</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{stats.totalInvoices}</p>
              </div>
              <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 opacity-20 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-yellow-600 text-xs sm:text-sm font-medium truncate">فواتير متبقية</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-900 mt-1">{stats.totalPending}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 opacity-20 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-600 text-xs sm:text-sm font-medium truncate">فواتير مدفوعة</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">{stats.totalPaid}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 opacity-20 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-red-600 text-xs sm:text-sm font-medium truncate">مبالغ متبقية</p>
                <p className="text-base sm:text-xl font-bold text-red-900 mt-1 truncate">{stats.pendingAmount.toLocaleString('ar-EG')} ج.م</p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 opacity-20 flex-shrink-0" />
            </div>
          </div>
      </div>

        {/* Mobile-Optimized Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'pending'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            <span className="hidden sm:inline">الفواتير المتبقية</span>
            <span className="sm:hidden">متبقية</span>
            <span className="mr-1">({stats.totalPending})</span>
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'paid'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            <span className="hidden sm:inline">الفواتير المدفوعة</span>
            <span className="sm:hidden">مدفوعة</span>
            <span className="mr-1">({stats.totalPaid})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'reports'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            التقارير
          </button>
        </div>

        {/* Mobile-Optimized Search & Filter */}
        {activeTab !== 'reports' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف أو رقم الفاتورة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredInvoices.length === 0}
              className="px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>تصدير</span>
            </button>
          </div>
        )}

        {/* Mobile Card View & Desktop Table View */}
        {(activeTab === 'pending' || activeTab === 'paid') && (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    {/* Invoice Header */}
                    <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="font-bold text-gray-900 text-sm truncate">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm truncate">{invoice.patient?.name || '-'}</span>
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0 ml-2">
                        <div className="text-lg font-bold text-green-600">
                          {invoice.total_amount?.toLocaleString('ar-EG')}
                        </div>
                        <div className="text-xs text-gray-500">ج.م</div>
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="space-y-2 mb-3">
                      {invoice.patient?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <a href={`tel:${invoice.patient?.phone}`} className="text-green-600 hover:underline">
                            {invoice.patient?.phone}
                          </a>
                        </div>
                      )}
                      
                      {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-xs line-clamp-2">
                            {invoice.invoice_items.map(i => i.description).join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">
                            {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        
                        {invoice.payment_method && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {invoice.payment_method}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-gray-100">
                      {activeTab === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentForm(true);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          تحصيل المبلغ
                        </button>
                      )}
                      {activeTab === 'paid' && (
                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium py-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>تم الدفع</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">لا توجد فواتير في هذه الفئة</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-right text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-xs font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-3 rounded-tr-lg">رقم الفاتورة</th>
                    <th className="px-4 py-3">اسم المريضة</th>
                    <th className="px-4 py-3">الخدمة</th>
                    <th className="px-4 py-3">الهاتف</th>
                    <th className="px-4 py-3">المبلغ</th>
                    <th className="px-4 py-3">طريقة الدفع</th>
                    <th className="px-4 py-3">التاريخ</th>
                    <th className="px-4 py-3 rounded-tl-lg">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-900">{invoice.invoice_number}</td>
                        <td className="px-4 py-3.5 text-gray-600">{invoice.patient?.name || '-'}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs">
                          <div className="max-w-[150px] truncate" title={invoice.invoice_items?.map(i => i.description).join(', ')}>
                            {invoice.invoice_items?.map(i => i.description).join(', ') || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <a href={`tel:${invoice.patient?.phone}`} className="text-green-600 hover:underline">
                            {invoice.patient?.phone || '-'}
                          </a>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">{invoice.total_amount?.toLocaleString('ar-EG')} ج.م</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {invoice.payment_method || 'غير محدد'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs">
                          {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3.5">
                          {activeTab === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentForm(true);
                              }}
                              className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              تحصيل
                            </button>
                          )}
                          {activeTab === 'paid' && (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              مدفوعة
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        لا توجد فواتير في هذه الفئة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Mobile-Optimized Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Collection Rate Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border-2 border-green-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="truncate">نسبة التحصيل</span>
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="flex-1 w-full">
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${stats.collectionRate}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs sm:text-sm text-gray-600">
                      {stats.totalInvoices > 0
                        ? `${stats.totalPaid} من ${stats.totalInvoices} فاتورة مدفوعة`
                        : 'لا توجد فواتير'}
                    </p>
                  </div>
                  <div className="text-4xl sm:text-3xl font-bold text-green-600">{stats.collectionRate}%</div>
                </div>
              </div>

              {/* Total Collections Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border-2 border-purple-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="truncate">إجمالي المقبوضات</span>
                </h3>
                <div>
                  <p className="text-3xl sm:text-3xl font-bold text-purple-600 mb-2">
                    {stats.totalCollected.toLocaleString('ar-EG')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-400">ج.م</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-3">المجموع الذي تم تحصيله</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-Optimized Payment Form Modal */}
        {showPaymentForm && selectedInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto safe-area-inset-bottom">
              {/* Header - Sticky */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 pt-4 pb-3 sm:pt-6 sm:pb-4 rounded-t-3xl sm:rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    تسجيل دفعة
                  </h3>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-4">
                {/* Invoice Info Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-blue-600 font-medium mb-1">المريضة</p>
                        <p className="font-bold text-gray-900 truncate">{selectedInvoice.patient?.name}</p>
                      </div>
                      <div className="text-left flex-shrink-0 ml-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">رقم الفاتورة</p>
                        <p className="font-bold text-gray-900 text-sm">{selectedInvoice.invoice_number}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">المبلغ الكامل</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedInvoice.total_amount?.toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      المبلغ المدفوع *
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        max={selectedInvoice.total_amount}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0.00"
                        required
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">ج.م</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      طريقة الدفع *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'Cash', label: 'نقد', icon: Banknote },
                        { value: 'Visa', label: 'بطاقة', icon: CreditCard },
                        { value: 'Bank Transfer', label: 'تحويل', icon: DollarSign },
                        { value: 'Insurance', label: 'تأمين', icon: FileText }
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, method: method.value as any })}
                          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                            paymentForm.method === method.value
                              ? 'bg-green-50 border-green-600 text-green-700 font-bold'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <method.icon className="w-4 h-4" />
                          <span className="text-sm">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      ملاحظات (اختياري)
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                      rows={3}
                      placeholder="أي ملاحظات إضافية..."
                    />
                  </div>
                </form>
              </div>

              {/* Footer - Sticky */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 safe-area-inset-bottom">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 px-4 py-3 text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    تسجيل الدفعة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default CollectionsManagement;
