import React, { useState } from 'react';
import useDoctorFinance, { DateRange } from '../../../hooks/useDoctorFinance';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
}

const FinanceStats: React.FC = () => {
  const [range, setRange] = useState<DateRange>('month');
  const { total_revenue, pending_debt, daily_series, patient_count, recent, loading } = useDoctorFinance(range);

  return (
    <div className="space-y-6 font-[Tajawal]" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">التقرير المالي</h2>
        <div className="flex gap-2">
          {(['today','week','month','year'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-sm border ${range === r ? 'bg-teal-600 text-white' : 'bg-white text-teal-700 border-teal-200'}`}
            >{r === 'today' ? 'اليوم' : r === 'week' ? 'الأسبوع' : r === 'month' ? 'الشهر' : 'السنة'}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm text-gray-500">دخل اليوم</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(total_revenue)}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm text-gray-500">ديون خارجية</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(pending_debt)}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm text-gray-500">عدد الحالات</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{patient_count}</div>
        </div>
      </div>

      {/* Charts and recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-3">منحنى الإيرادات (آخر فترة)</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_series}>
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('ar-EG') } />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelFormatter={(l) => new Date(l).toLocaleDateString('ar-EG')} />
                <Area type="monotone" dataKey="amount" stroke="#009688" fill="#009688" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-3">آخر 5 فواتير</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-right text-gray-500">
                  <th className="py-2">المريض</th>
                  <th className="py-2">الخدمة</th>
                  <th className="py-2">المبلغ</th>
                  <th className="py-2">السكرتيرة</th>
                  <th className="py-2">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="py-4 text-center">جارٍ التحميل...</td></tr>}
                {!loading && recent.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">لا توجد معاملات</td></tr>}
                {!loading && recent.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="py-2 text-right">{inv.patient_id || '-'}</td>
                    <td className="py-2 text-right">{inv.service_name || '-'}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(inv.paid_amount || 0))}</td>
                    <td className="py-2 text-right">{inv.created_by || '-'}</td>
                    <td className="py-2 text-right">{new Date(inv.created_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceStats;
