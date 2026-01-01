/**
 * FinanceReports.tsx
 * 📊 تقارير مالية مفصلة باليوم والشهر والسنة
 * Features:
 * - ✅ تقارير يومية/أسبوعية/شهرية/سنوية
 * - 📈 إحصائيات مفصلة بطريقة الدفع
 * - 📊 مقارنة الفترات
 * - 🖨️ طباعة التقارير
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  Printer,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Clock,
  Users
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface FinanceReportsProps {
  doctorId: string;
}

interface ReportStats {
  total: number;
  count: number;
  cash: number;
  visa: number;
  bank: number;
  insurance: number;
  averageTransaction: number;
  topServices: Array<{ name: string; count: number; total: number }>;
}

interface PeriodComparison {
  current: number;
  previous: number;
  percentageChange: number;
  isPositive: boolean;
}

const FinanceReports: React.FC<FinanceReportsProps> = ({ doctorId }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    count: 0,
    cash: 0,
    visa: 0,
    bank: 0,
    insurance: 0,
    averageTransaction: 0,
    topServices: []
  });
  const [comparison, setComparison] = useState<PeriodComparison>({
    current: 0,
    previous: 0,
    percentageChange: 0,
    isPositive: true
  });
  const [dailyBreakdown, setDailyBreakdown] = useState<Array<{ date: string; total: number; count: number }>>([]);

  useEffect(() => {
    if (doctorId) {
      fetchReportData();
    }
  }, [doctorId, period]);

  const getDateRange = (periodType: string) => {
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();

    switch (periodType) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(startDate);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      previousStartDate: previousStartDate.toISOString().split('T')[0],
      previousEndDate: previousEndDate.toISOString().split('T')[0]
    };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { startDate, previousStartDate, previousEndDate } = getDateRange(period);

      // Fetch current period invoices
      const [invoicesResult, posInvoicesResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('clinic_id', doctorId)
          .gte('created_at', `${startDate}T00:00:00`)
          .in('status', ['paid', 'Paid']),
        supabase
          .from('pos_invoices')
          .select('*, pos_invoice_items(*)')
          .eq('clinic_id', doctorId)
          .gte('created_at', `${startDate}T00:00:00`)
          .in('status', ['paid', 'Paid'])
      ]);

      const allInvoices = [
        ...(invoicesResult.data || []),
        ...(posInvoicesResult.data || [])
      ];

      // Calculate stats
      const total = allInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const count = allInvoices.length;
      
      const cash = allInvoices
        .filter(inv => inv.payment_method?.toLowerCase() === 'cash')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const visa = allInvoices
        .filter(inv => inv.payment_method?.toLowerCase() === 'visa')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const bank = allInvoices
        .filter(inv => 
          inv.payment_method?.toLowerCase() === 'bank_transfer' ||
          inv.payment_method?.toLowerCase() === 'bank transfer'
        )
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const insurance = allInvoices
        .filter(inv => inv.payment_method?.toLowerCase() === 'insurance')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // Calculate top services
      const serviceMap = new Map<string, { count: number; total: number }>();
      allInvoices.forEach(inv => {
        const items = inv.invoice_items || inv.pos_invoice_items || [];
        items.forEach((item: any) => {
          const name = item.service_name || item.description || 'خدمة';
          const existing = serviceMap.get(name) || { count: 0, total: 0 };
          serviceMap.set(name, {
            count: existing.count + (item.quantity || 1),
            total: existing.total + (item.total || item.total_price || 0)
          });
        });
      });

      const topServices = Array.from(serviceMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Fetch previous period for comparison
      const [prevInvoices, prevPosInvoices] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('clinic_id', doctorId)
          .gte('created_at', `${previousStartDate}T00:00:00`)
          .lte('created_at', `${previousEndDate}T23:59:59`)
          .in('status', ['paid', 'Paid']),
        supabase
          .from('pos_invoices')
          .select('total_amount')
          .eq('clinic_id', doctorId)
          .gte('created_at', `${previousStartDate}T00:00:00`)
          .lte('created_at', `${previousEndDate}T23:59:59`)
          .in('status', ['paid', 'Paid'])
      ]);

      const previousTotal = [
        ...(prevInvoices.data || []),
        ...(prevPosInvoices.data || [])
      ].reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const percentageChange = previousTotal > 0 
        ? ((total - previousTotal) / previousTotal) * 100 
        : total > 0 ? 100 : 0;

      // Daily breakdown for charts
      const dailyMap = new Map<string, { total: number; count: number }>();
      allInvoices.forEach(inv => {
        const date = new Date(inv.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { total: 0, count: 0 };
        dailyMap.set(date, {
          total: existing.total + (inv.total_amount || 0),
          count: existing.count + 1
        });
      });

      const breakdown = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        total,
        count,
        cash,
        visa,
        bank,
        insurance,
        averageTransaction: count > 0 ? total / count : 0,
        topServices
      });

      setComparison({
        current: total,
        previous: previousTotal,
        percentageChange,
        isPositive: percentageChange >= 0
      });

      setDailyBreakdown(breakdown);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('خطأ في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'year': return 'هذه السنة';
    }
  };

  const getPreviousPeriodLabel = () => {
    switch (period) {
      case 'today': return 'أمس';
      case 'week': return 'الأسبوع الماضي';
      case 'month': return 'الشهر الماضي';
      case 'year': return 'السنة الماضية';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with Period Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            التقارير المالية
          </h3>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'today', label: 'اليوم', icon: Clock },
            { id: 'week', label: 'الأسبوع', icon: Calendar },
            { id: 'month', label: 'الشهر', icon: Calendar },
            { id: 'year', label: 'السنة', icon: Calendar }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                period === p.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <p.icon className="w-4 h-4" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Revenue */}
        <div className="col-span-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">إجمالي الإيرادات - {getPeriodLabel()}</p>
              <p className="text-3xl font-bold">{stats.total.toLocaleString()} ج.م</p>
              <p className="text-green-100 text-xs mt-1">{stats.count} معاملة</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
          
          {/* Comparison Badge */}
          <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            comparison.isPositive ? 'bg-white/20' : 'bg-red-500/30'
          }`}>
            {comparison.isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(comparison.percentageChange).toFixed(1)}% مقارنة بـ{getPreviousPeriodLabel()}
          </div>
        </div>

        {/* Cash */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">نقداً</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{stats.cash.toLocaleString()} ج.م</p>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {((stats.cash / stats.total) * 100).toFixed(0)}% من الإجمالي
            </p>
          )}
        </div>

        {/* Visa */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">فيزا</span>
          </div>
          <p className="text-xl font-bold text-purple-600">{stats.visa.toLocaleString()} ج.م</p>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {((stats.visa / stats.total) * 100).toFixed(0)}% من الإجمالي
            </p>
          )}
        </div>

        {/* Bank Transfer */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">تحويل بنكي</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{stats.bank.toLocaleString()} ج.م</p>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {((stats.bank / stats.total) * 100).toFixed(0)}% من الإجمالي
            </p>
          )}
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-teal-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-sm text-gray-600">تأمين</span>
          </div>
          <p className="text-xl font-bold text-teal-600">{stats.insurance.toLocaleString()} ج.م</p>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {((stats.insurance / stats.total) * 100).toFixed(0)}% من الإجمالي
            </p>
          )}
        </div>
      </div>

      {/* Average Transaction */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">متوسط قيمة المعاملة</p>
              <p className="text-xl font-bold text-indigo-600">
                {stats.averageTransaction.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.م
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-600">عدد المعاملات</p>
            <p className="text-xl font-bold text-gray-800">{stats.count}</p>
          </div>
        </div>
      </div>

      {/* Top Services */}
      {stats.topServices.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-green-600" />
            أكثر الخدمات طلباً
          </h4>
          <div className="space-y-3">
            {stats.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{service.name}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{service.total.toLocaleString()} ج.م</p>
                  <p className="text-xs text-gray-500">{service.count} مرة</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      {dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            التفصيل اليومي
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dailyBreakdown.map((day, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('ar-EG', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{day.total.toLocaleString()} ج.م</p>
                  <p className="text-xs text-gray-500">{day.count} معاملة</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Comparison */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          مقارنة الفترات
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{getPeriodLabel()}</p>
            <p className="text-lg font-bold text-green-600">{comparison.current.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{getPreviousPeriodLabel()}</p>
            <p className="text-lg font-bold text-gray-600">{comparison.previous.toLocaleString()} ج.م</p>
          </div>
        </div>
        <div className={`mt-3 text-center py-2 rounded-lg ${
          comparison.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <span className="font-medium">
            {comparison.isPositive ? '📈 نمو' : '📉 انخفاض'} {Math.abs(comparison.percentageChange).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinanceReports;
