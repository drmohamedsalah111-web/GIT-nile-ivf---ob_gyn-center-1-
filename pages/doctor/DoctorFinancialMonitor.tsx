import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  Users,
  CreditCard
} from 'lucide-react';

interface FinancialSummary {
  report_date: string;
  doctor_id: string;
  doctor_name: string;
  total_appointments: number;
  checked_in_count: number;
  fully_paid_count: number;
  partial_paid_count: number;
  pending_payment_count: number;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_service_requests: number;
  pending_service_requests: number;
  fulfilled_service_requests: number;
}

interface InvoiceDetail {
  invoice_id: string;
  invoice_date: string;
  invoice_total: number;
  paid_amount: number;
  payment_method: string;
  invoice_status: string;
  patient_name: string;
  patient_phone: string;
  outstanding_amount: number;
  needs_followup: boolean;
  appointment_time: string;
}

interface AuditLog {
  id: string;
  action_type: string;
  performed_by_name: string;
  performed_by_role: string;
  patient_name: string;
  amount: number;
  details: any;
  created_at: string;
}

interface CollectionItem {
  patient_name: string;
  patient_phone: string;
  invoice_total: number;
  paid_amount: number;
  outstanding: number;
  days_outstanding: number;
  priority: 'urgent' | 'high' | 'normal';
  visit_date: string;
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { ServicesManager } from '../../src/modules/finance/ServicesManager';
import AdvancedFinancialDashboard from './AdvancedFinancialDashboard';

interface ChartDataPoint {
  date: string;
  total_billed: number;
  total_collected: number;
  outstanding: number;
  collection_rate: number;
}

const DoctorFinancialMonitor: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [doctorId, setDoctorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'invoices' | 'audit' | 'collections' | 'services' | 'analytics'>('summary');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadFinancialData, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);

      // Get doctor ID first
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', user.user.id).single();
        if (doctor?.id) {
          setDoctorId(doctor.id);
        }
      }

      await Promise.all([
        loadSummary(),
        loadInvoices(),
        loadAuditLogs(),
        loadCollections(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('فشل تحميل البيانات المالية');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    const { data, error } = await supabase
      .from('daily_financial_summary')
      .select('*')
      .single();

    if (error) {
      console.error('Error loading summary:', error);
    } else {
      setSummary(data);
    }
  };

  const loadInvoices = async () => {
    let query = supabase
      .from('doctor_financial_monitor_view')
      .select('*')
      .order('invoice_date', { ascending: false });

    // Apply date filter
    const now = new Date();
    if (dateFilter === 'today') {
      query = query.gte('invoice_date', now.toISOString().split('T')[0]);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('invoice_date', weekAgo.toISOString());
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query = query.gte('invoice_date', monthAgo.toISOString());
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Error loading invoices:', error);
    } else {
      setInvoices(data || []);
    }
  };

  const loadAuditLogs = async () => {
    const { data, error } = await supabase
      .from('financial_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading audit logs:', error);
    } else {
      setAuditLogs(data || []);
    }
  };

  const loadCollections = async () => {
    const { data, error } = await supabase
      .from('collections_followup_report')
      .select('*')
      .order('days_outstanding', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading collections:', error);
    } else {
      setCollections(data || []);
    }
  };

  const loadChartData = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Default to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const { data, error } = await supabase.rpc('get_doctor_financial_report', {
      p_doctor_id: (await supabase.from('doctors').select('id').eq('user_id', user.user.id).single()).data?.id,
      p_start_date: start.toISOString().split('T')[0],
      p_end_date: end.toISOString().split('T')[0]
    });

    if (error) {
      console.error('Error loading chart data:', error);
    } else {
      // Sort by date just in case
      const sorted = (data || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(sorted);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'invoice_created':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'payment_updated':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'check_in':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'invoice_created': 'إنشاء فاتورة',
      'payment_updated': 'تحديث دفعة',
      'check_in': 'تسجيل حضور',
      'refund': 'استرجاع',
      'service_request': 'طلب خدمة'
    };
    return labels[actionType] || actionType;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const collectionRate = summary
    ? summary.total_billed > 0
      ? ((summary.total_collected / summary.total_billed) * 100).toFixed(1)
      : '0'
    : '0';

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="w-8 h-8" />
            المراقبة المالية - لوحة الطبيب
          </h1>
          <button
            onClick={loadFinancialData}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            تحديث
          </button>
        </div>

        {/* Charts Section */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                تحليل الإيرادات (آخر 30 يوم)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_billed" name="إجمالي الفواتير" fill="#3b82f6" />
                    <Bar dataKey="total_collected" name="المحصل الفعلي" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collection Efficiency Chart */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                كفاءة التحصيل
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Area type="monotone" dataKey="collection_rate" name="نسبة التحصيل" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">إجمالي اليوم</span>
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{summary.total_billed.toFixed(2)} جنيه</p>
              <p className="text-sm text-gray-500">{summary.total_appointments} موعد</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">المحصل</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.total_collected.toFixed(2)} جنيه</p>
              <p className="text-sm text-gray-500">نسبة التحصيل: {collectionRate}%</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">المتأخر</span>
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{summary.total_outstanding.toFixed(2)} جنيه</p>
              <p className="text-sm text-gray-500">{summary.pending_payment_count} موعد معلق</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">طلبات الخدمات</span>
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{summary.total_service_requests}</p>
              <p className="text-sm text-gray-500">{summary.pending_service_requests} قيد الانتظار</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="border-b flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'summary'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <Users className="w-4 h-4 inline ml-2" />
              ملخص المواعيد
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'invoices'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <FileText className="w-4 h-4 inline ml-2" />
              الفواتير
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'audit'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <Eye className="w-4 h-4 inline ml-2" />
              سجل الأنشطة
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'collections'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <AlertCircle className="w-4 h-4 inline ml-2" />
              متابعة التحصيل ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'services'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <DollarSign className="w-4 h-4 inline ml-2" />
              الخدمات والأسعار
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'analytics'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <TrendingUp className="w-4 h-4 inline ml-2" />
              التحليلات المتقدمة
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Summary Tab */}
            {activeTab === 'summary' && summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">حضر</p>
                    <p className="text-2xl font-bold text-green-600">{summary.checked_in_count}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">مدفوع كامل</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.fully_paid_count}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">مدفوع جزئي</p>
                    <p className="text-2xl font-bold text-yellow-600">{summary.partial_paid_count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div>
                {/* Date Filter */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`px-4 py-2 rounded-lg ${dateFilter === 'today'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    اليوم
                  </button>
                  <button
                    onClick={() => setDateFilter('week')}
                    className={`px-4 py-2 rounded-lg ${dateFilter === 'week'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    آخر أسبوع
                  </button>
                  <button
                    onClick={() => setDateFilter('month')}
                    className={`px-4 py-2 rounded-lg ${dateFilter === 'month'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    آخر شهر
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.invoice_id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{invoice.patient_name}</p>
                        <p className="text-sm text-gray-600">{invoice.patient_phone}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(invoice.invoice_date).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{invoice.invoice_total.toFixed(2)} جنيه</p>
                        <p className="text-sm text-green-600">مدفوع: {invoice.paid_amount.toFixed(2)}</p>
                        {invoice.outstanding_amount > 0 && (
                          <p className="text-sm text-red-600">متبقي: {invoice.outstanding_amount.toFixed(2)}</p>
                        )}
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {invoice.payment_method === 'cash' ? 'كاش' : 'فيزا'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="mt-1">{getActionIcon(log.action_type)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{getActionLabel(log.action_type)}</p>
                      <p className="text-sm text-gray-600">
                        {log.performed_by_name} ({log.performed_by_role === 'secretary' ? 'سكرتيرة' : 'طبيب'})
                      </p>
                      <p className="text-sm text-gray-600">المريض: {log.patient_name}</p>
                      {log.amount && (
                        <p className="text-sm font-medium text-green-600">{log.amount.toFixed(2)} جنيه</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {collections.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getPriorityColor(item.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{item.patient_name}</p>
                        <p className="text-sm">{item.patient_phone}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-white">
                        {item.days_outstanding} يوم
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">الإجمالي:</span>
                        <p className="font-bold">{item.invoice_total.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">المدفوع:</span>
                        <p className="font-bold text-green-600">{item.paid_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">المتبقي:</span>
                        <p className="font-bold text-red-600">{item.outstanding.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      تاريخ الزيارة: {new Date(item.visit_date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="mt-4">
                {doctorId ? (
                  <ServicesManager clinicId={doctorId} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">جاري التحميل...</p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="mt-4">
                <AdvancedFinancialDashboard doctorId={doctorId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorFinancialMonitor;
