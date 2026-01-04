// ============================================================================
// 📅 SUBSCRIPTION EXPIRY TRACKER - Super Admin Component
// ============================================================================
// مكون متقدم لتتبع الأيام المتبقية في الاشتراكات داخل لوحة السوبر ادمن
// Date: January 4, 2026
// ============================================================================

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  TrendingDown,
  RefreshCw,
  Download,
  Bell,
  Filter
} from 'lucide-react';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface SubscriptionTrackingDetail {
  clinic_id: string;
  clinic_name: string;
  clinic_email: string;
  clinic_phone: string;
  plan_name: string;
  plan_name_ar: string;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  usage_percentage: number;
  total_subscription_days: number;
  days_elapsed: number;
  expiry_status_ar: string;
  expiry_status_en: string;
  auto_renew: boolean;
  monthly_price: number;
}

interface ExpiryStatistics {
  expiry_status_en: string;
  expiry_status_ar: string;
  subscription_count: number;
  avg_days_remaining: number;
  min_days_remaining: number;
  max_days_remaining: number;
}

interface FilterOptions {
  status: 'all' | 'critical' | 'urgent' | 'warning' | 'attention' | 'normal';
  autoRenew: 'all' | 'yes' | 'no';
  sortBy: 'days_asc' | 'days_desc' | 'name_asc' | 'usage_asc';
}

// ============================================================================
// Main Component
// ============================================================================

const SubscriptionExpiryTracker: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionTrackingDetail[]>([]);
  const [statistics, setStatistics] = useState<ExpiryStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    autoRenew: 'all',
    sortBy: 'days_asc'
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subscription tracking details
      const { data: trackingData, error: trackingError } = await supabase
        .from('subscription_tracking_details')
        .select('*');

      if (trackingError) throw trackingError;

      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .from('subscription_expiry_statistics')
        .select('*');

      if (statsError) throw statsError;

      setSubscriptions(trackingData || []);
      setStatistics(statsData || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================================
  // Filtering and Sorting Logic
  // ============================================================================

  const getFilteredSubscriptions = (): SubscriptionTrackingDetail[] => {
    let filtered = [...subscriptions];

    // Filter by expiry status
    if (filters.status !== 'all') {
      const statusMap = {
        critical: ['CRITICAL', 'EXPIRES_TODAY'],
        urgent: ['URGENT'],
        warning: ['WARNING'],
        attention: ['ATTENTION'],
        normal: ['NORMAL']
      };
      filtered = filtered.filter(sub => 
        statusMap[filters.status]?.includes(sub.expiry_status_en)
      );
    }

    // Filter by auto-renew
    if (filters.autoRenew !== 'all') {
      filtered = filtered.filter(sub => 
        sub.auto_renew === (filters.autoRenew === 'yes')
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'days_asc':
          return a.days_remaining - b.days_remaining;
        case 'days_desc':
          return b.days_remaining - a.days_remaining;
        case 'name_asc':
          return a.clinic_name.localeCompare(b.clinic_name);
        case 'usage_asc':
          return a.usage_percentage - b.usage_percentage;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredSubscriptions = getFilteredSubscriptions();

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'EXPIRES_TODAY': 'bg-red-100 text-red-800 border-red-300',
      'CRITICAL': 'bg-red-50 text-red-700 border-red-200',
      'URGENT': 'bg-orange-50 text-orange-700 border-orange-200',
      'WARNING': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'ATTENTION': 'bg-blue-50 text-blue-700 border-blue-200',
      'NORMAL': 'bg-green-50 text-green-700 border-green-200',
      'EXPIRED': 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'EXPIRES_TODAY': <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />,
      'CRITICAL': <AlertTriangle className="w-5 h-5 text-red-600" />,
      'URGENT': <AlertCircle className="w-5 h-5 text-orange-600" />,
      'WARNING': <Clock className="w-5 h-5 text-yellow-600" />,
      'ATTENTION': <Calendar className="w-5 h-5 text-blue-600" />,
      'NORMAL': <CheckCircle className="w-5 h-5 text-green-600" />
    };
    return iconMap[status] || <Clock className="w-5 h-5" />;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['العيادة', 'البريد', 'الهاتف', 'الباقة', 'الحالة', 'الأيام المتبقية', 'تاريخ الانتهاء', 'نسبة الاستهلاك'];
    const rows = filteredSubscriptions.map(sub => [
      sub.clinic_name,
      sub.clinic_email,
      sub.clinic_phone,
      sub.plan_name_ar,
      sub.expiry_status_ar,
      sub.days_remaining,
      sub.end_date,
      `${sub.usage_percentage}%`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscription_tracking_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="mr-3 text-gray-600">جاري تحميل البيانات...</span>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">📅 تتبع الأيام المتبقية في الاشتراكات</h2>
            <p className="text-purple-100">نظام متقدم لمراقبة وتحليل حالة الاشتراكات</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold hover:bg-purple-50 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <button
              onClick={exportToCSV}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold hover:bg-purple-50 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statistics.map((stat, index) => (
          <div
            key={index}
            className={`rounded-xl p-5 border-2 ${getStatusColor(stat.expiry_status_en)} transition-all hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              {getStatusIcon(stat.expiry_status_en)}
              <span className="text-2xl font-black">{stat.subscription_count}</span>
            </div>
            <h3 className="font-bold text-sm mb-1">{stat.expiry_status_ar}</h3>
            <p className="text-xs opacity-75">
              متوسط: {Math.round(stat.avg_days_remaining)} يوم
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">الفلاتر والترتيب</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">حالة الانتهاء</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">الكل ({subscriptions.length})</option>
              <option value="critical">عاجل جداً</option>
              <option value="urgent">عاجل</option>
              <option value="warning">تحذير</option>
              <option value="attention">انتبه</option>
              <option value="normal">طبيعي</option>
            </select>
          </div>

          {/* Auto Renew Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">التجديد التلقائي</label>
            <select
              value={filters.autoRenew}
              onChange={(e) => setFilters({ ...filters, autoRenew: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">الكل</option>
              <option value="yes">مفعّل</option>
              <option value="no">غير مفعّل</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الترتيب حسب</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="days_asc">الأيام المتبقية (تصاعدي)</option>
              <option value="days_desc">الأيام المتبقية (تنازلي)</option>
              <option value="name_asc">اسم العيادة</option>
              <option value="usage_asc">نسبة الاستهلاك</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700">العيادة</th>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الباقة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الأيام المتبقية</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">نسبة الاستهلاك</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">تاريخ الانتهاء</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">تجديد تلقائي</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubscriptions.map((sub, index) => (
                <tr
                  key={sub.clinic_id}
                  className={`hover:bg-gray-50 transition ${
                    sub.days_remaining <= 3 ? 'bg-red-50' : ''
                  }`}
                >
                  {/* Clinic Info */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-gray-900">{sub.clinic_name}</div>
                      <div className="text-xs text-gray-500">{sub.clinic_email}</div>
                      <div className="text-xs text-gray-400">{sub.clinic_phone}</div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-purple-700">{sub.plan_name_ar}</div>
                    <div className="text-xs text-gray-500">{sub.monthly_price} ج.م/شهر</div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(sub.expiry_status_en)}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(sub.expiry_status_en)}`}>
                        {sub.expiry_status_ar}
                      </span>
                    </div>
                  </td>

                  {/* Days Remaining */}
                  <td className="px-6 py-4 text-center">
                    <div className={`text-2xl font-black ${
                      sub.days_remaining <= 3 ? 'text-red-600 animate-pulse' :
                      sub.days_remaining <= 7 ? 'text-orange-600' :
                      'text-gray-700'
                    }`}>
                      {sub.days_remaining}
                    </div>
                    <div className="text-xs text-gray-500">يوم</div>
                  </td>

                  {/* Usage Percentage */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            sub.usage_percentage >= 90 ? 'bg-red-500' :
                            sub.usage_percentage >= 75 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${sub.usage_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {sub.usage_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* End Date */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-bold text-gray-900">{formatDate(sub.end_date)}</div>
                    <div className="text-xs text-gray-500">بدأ: {formatDate(sub.start_date)}</div>
                  </td>

                  {/* Auto Renew */}
                  <td className="px-6 py-4 text-center">
                    {sub.auto_renew ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        ✓ مفعّل
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                        ✗ غير مفعّل
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition"
                        title="إرسال تنبيه"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition"
                        title="تفاصيل"
                      >
                        <TrendingDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">لا توجد اشتراكات مطابقة للفلاتر المحددة</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-purple-600">{filteredSubscriptions.length}</div>
            <div className="text-sm text-gray-600">إجمالي الاشتراكات المعروضة</div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-600">
              {filteredSubscriptions.filter(s => s.days_remaining <= 7).length}
            </div>
            <div className="text-sm text-gray-600">تحتاج إجراء عاجل (≤7 أيام)</div>
          </div>
          <div>
            <div className="text-2xl font-black text-green-600">
              {filteredSubscriptions.filter(s => s.auto_renew).length}
            </div>
            <div className="text-sm text-gray-600">مفعّل عليها التجديد التلقائي</div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-600">
              {Math.round(
                filteredSubscriptions.reduce((sum, s) => sum + s.days_remaining, 0) / 
                (filteredSubscriptions.length || 1)
              )}
            </div>
            <div className="text-sm text-gray-600">متوسط الأيام المتبقية</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiryTracker;
