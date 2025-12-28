import React, { useState } from 'react';
import { useFinancialStats, DateRange } from '../../hooks/useFinancialStats';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import 'tailwindcss/tailwind.css';

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
  const stats = useFinancialStats(dateRange);

  // KPI Cards
  const kpis = [
    {
      label: 'الدخل اليوم',
      value: formatCurrency(stats.totalRevenue),
      color: brandColors.teal,
      compare: '+12%',
    },
    {
      label: 'المبالغ المعلقة',
      value: formatCurrency(stats.outstandingDebt),
      color: brandColors.rose,
      compare: '',
    },
    {
      label: 'المصروفات',
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
    <div className="bg-gray-50 min-h-screen p-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">لوحة تحكم الطبيب المالية</h1>
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
          <div key={i} className="bg-white rounded-xl shadow p-6 flex flex-col items-center" style={{ borderTop: `4px solid ${kpi.color}` }}>
            <div className="text-2xl font-bold mb-2" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-gray-600 text-lg mb-1">{kpi.label}</div>
            {kpi.compare && <div className="text-xs text-green-600">{kpi.compare}</div>}
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow p-4 col-span-2">
          <h2 className="text-lg font-bold mb-2">منحنى الإيرادات</h2>
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
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-bold mb-2">توزيع طرق الدفع</h2>
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
      <div className="bg-white rounded-xl shadow p-4 mb-8">
        <h2 className="text-lg font-bold mb-2">الخدمات الأعلى دخلاً</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topServices} layout="vertical">
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Bar dataKey="value" fill={brandColors.rose} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Last Transactions */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-bold mb-2">آخر 5 معاملات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4">المريض</th>
                <th className="py-2 px-4">الخدمة</th>
                <th className="py-2 px-4">المبلغ</th>
                <th className="py-2 px-4">السكرتيرة</th>
                <th className="py-2 px-4">الوقت</th>
                <th className="py-2 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {lastTransactions.map((tx, i) => (
                <tr key={i}>
                  <td className="py-2 px-4">{tx.patient_name || '-'}</td>
                  <td className="py-2 px-4">{tx.service_name || '-'}</td>
                  <td className="py-2 px-4">{formatCurrency(Number(tx.paid_amount || 0))}</td>
                  <td className="py-2 px-4">{tx.created_by_name || '-'}</td>
                  <td className="py-2 px-4">{new Date(tx.created_at).toLocaleTimeString('ar-EG')}</td>
                  <td className="py-2 px-4">
                    {tx.status === 'paid' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">مدفوع</span>}
                    {tx.status === 'partial' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">جزئي</span>}
                    {tx.status === 'pending' && <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs">غير مدفوع</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
