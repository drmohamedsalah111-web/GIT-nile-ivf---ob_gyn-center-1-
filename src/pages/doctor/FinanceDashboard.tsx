import React, { useState, useEffect } from 'react';
import { useFinancialStats, DateRange } from '../../hooks/useFinancialStats';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import styles from './FinanceDashboard.module.css';
import { InvoicesManagementPage } from '../../../components/invoices';
import CollectionsManagement from '../../../components/invoices/CollectionsManagement';
import { DollarSign, TrendingUp, Package, CreditCard, AlertCircle, Settings, FileText, Users, Calendar, Wallet, PieChart as PieChartIcon, List } from 'lucide-react';
import { authService } from '../../../services/authService';

const brandColors = {
  teal: '#14b8a6',
  rose: '#e11d48',
  yellow: '#facc15',
  green: '#22c55e',
  red: '#ef4444',
};

const paymentColors = {
  cash: brandColors.teal,
  visa: brandColors.rose,
  insurance: brandColors.yellow,
};

const dateRangeLabels: Record<DateRange, string> = {
  today: 'اليوم',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  year: 'هذا العام',
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
}

const FinanceDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'collections'>('dashboard');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const stats = useFinancialStats(dateRange, doctorId);

  useEffect(() => {
    const getDoctorId = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setDoctorId(user.id);
      }
    };
    getDoctorId();
  }, []);

  // Tabs configuration
  const TABS = [
    { id: 'dashboard' as const, label: 'لوحة التحكم', icon: PieChartIcon },
    { id: 'invoices' as const, label: 'الفواتير', icon: FileText },
    { id: 'collections' as const, label: 'التحصيل والمقبوضات', icon: DollarSign },
  ];

  // KPI Cards
  const kpis = [
    {
      label: 'إجمالي الدخل (من نظام السكرتيرة)',
      value: formatCurrency(stats.totalRevenue),
      color: brandColors.teal,
      compare: '+12%',
    },
    {
      label: 'المبالغ المعلقة (من الفواتير)',
      value: formatCurrency(stats.outstandingDebt),
      color: brandColors.rose,
      compare: '',
    },
    {
      label: 'المصروفات (من السكرتيرة)',
      value: formatCurrency(stats.expenses.reduce((a, e) => a + (e.amount || 0), 0)),
      color: brandColors.yellow,
      compare: '',
    },
    {
      label: 'صافي الربح',
      value: formatCurrency(stats.netIncome),
      color: brandColors.green,
      compare: '',
    },
  ];

  // Revenue Trend Data
  const revenueTrend = stats.invoices.map(inv => ({
    date: new Date(inv.created_at).toLocaleDateString('ar-EG'),
    revenue: Number(inv.paid_amount || 0),
  }));

  // Payment Mix Data
  const paymentMix = [
    { name: 'نقدي', value: stats.cashInHand.cash, color: paymentColors.cash },
    { name: 'فيزا', value: stats.cashInHand.visa, color: paymentColors.visa },
    { name: 'تأمين', value: stats.cashInHand.insurance, color: paymentColors.insurance },
  ];

  // Top Services Data
  const serviceMap: Record<string, number> = {};
  stats.invoices.forEach(inv => {
    if (inv.service_name) {
      serviceMap[inv.service_name] = (serviceMap[inv.service_name] || 0) + Number(inv.paid_amount || 0);
    }
  });
  const topServices = Object.entries(serviceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Last 5 Transactions
  const lastTransactions = stats.invoices
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className={styles['dashboard-bg']} dir="rtl">
      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-lg p-2 shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="flex flex-col md:flex-row md:justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              لوحة ماليات الطبيب
              <span className="block text-base text-teal-600 font-normal mt-1">كل البيانات حية من نظام السكرتيرة (POS)</span>
            </h1>
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'year'] as DateRange[]).map(r => (
                <button
                  key={r}
                  className={`px-4 py-2 rounded-full font-bold border ${dateRange === r ? 'bg-teal-500 text-white' : 'bg-white text-teal-700 border-teal-500'}`}
                  onClick={() => setDateRange(r)}
                >
                  {dateRangeLabels[r]}
                </button>
              ))}
            </div>
          </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div key={i} className={styles['kpi-card']} style={{ borderTop: `5px solid ${kpi.color}` }}>
            <div className={styles['kpi-value']} style={{ color: kpi.color }}>{kpi.value}</div>
            <div className={styles['kpi-label']}>{kpi.label}</div>
            {kpi.compare && <div className={styles['kpi-compare']}>{kpi.compare}</div>}
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className={styles['chart-card']} style={{ gridColumn: 'span 2 / span 2' }}>
          <div className={styles['section-title']}>منحنى الإيرادات (من الفواتير)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} >
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke={brandColors.teal} fill={brandColors.teal} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Payment Mix */}
        <div className={styles['chart-card']}>
          <div className={styles['section-title']}>توزيع طرق الدفع (من الفواتير)</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {paymentMix.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Top Services */}
      <div className={styles['chart-card']}>
        <div className={styles['section-title']}>الخدمات الأعلى دخلاً (من الفواتير)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topServices} layout="vertical">
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Bar dataKey="value" fill={brandColors.rose} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Last Transactions */}
      <div className={styles['chart-card']}>
        <div className={styles['section-title']}>آخر 5 معاملات (من نظام السكرتيرة)</div>
        <div className="overflow-x-auto">
          <table className={styles['table']}>
            <thead>
              <tr>
                <th>المريض</th>
                <th>الخدمة</th>
                <th>المبلغ</th>
                <th>السكرتيرة</th>
                <th>الوقت</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {lastTransactions.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.patient_name || '-'}</td>
                  <td>{tx.service_name || '-'}</td>
                  <td>{formatCurrency(Number(tx.paid_amount || 0))}</td>
                  <td>{tx.created_by_name || '-'}</td>
                  <td>{new Date(tx.created_at).toLocaleTimeString('ar-EG')}</td>
                  <td>
                    {tx.status === 'paid' && <span className={`${styles['status-badge']} ${styles['status-paid']}`}>مدفوع</span>}
                    {tx.status === 'partial' && <span className={`${styles['status-badge']} ${styles['status-partial']}`}>جزئي</span>}
                    {tx.status === 'pending' && <span className={`${styles['status-badge']} ${styles['status-pending']}`}>غير مدفوع</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'invoices' && doctorId && (
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            إدارة الفواتير
            <span className="block text-base text-teal-600 font-normal mt-1">من نظام السكرتيرة (POS)</span>
          </h1>
          <InvoicesManagementPage
            secretaryId={null}
            doctorId={doctorId}
            secretaryName="الطبيب"
          />
        </div>
      )}

      {activeTab === 'collections' && doctorId && (
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            التحصيل والمقبوضات
            <span className="block text-base text-teal-600 font-normal mt-1">من نظام السكرتيرة (POS)</span>
          </h1>
          <CollectionsManagement
            doctorId={doctorId}
            secretaryId={null}
            secretaryName="الطبيب"
          />
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
