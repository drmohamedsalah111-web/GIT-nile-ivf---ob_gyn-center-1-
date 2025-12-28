import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, AlertCircle, TrendingDown, PieChart as LucidePie } from 'lucide-react';
import useDoctorFinance from '../../hooks/useDoctorFinance';
import { format } from 'date-fns';

type Props = {
  clinicId: string;
};

const palette = ['#0d9488', '#f43f5e', '#2563eb', '#f59e0b']; // Teal, Rose, Blue, Amber

function formatCurrency(val: number) {
  if (!val) return '0 EGP';
  return `${val.toLocaleString('en-US')} EGP`;
}

export default function DoctorFinanceV2({ clinicId }: Props) {
  const {
    daily_series,
    todayRevenue,
    todayPending,
    todayExpenses,
    recent,
    loading,
  } = useDoctorFinance(clinicId, 'week') as any;

  // Build donut data grouped by service_name from recent (or daily_series fallback)
  const serviceMap: Record<string, number> = {};
  (recent || []).forEach((r: any) => {
    const name = r.service_name || 'خدمات أخرى';
    serviceMap[name] = (serviceMap[name] || 0) + Number(r.paid_amount || 0);
  });
  const donutData = Object.keys(serviceMap).map((k) => ({ name: k, value: serviceMap[k] }));

  return (
    <div className="font-cairo p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="rounded-xl border p-4 flex items-center gap-4 bg-white">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600"><Wallet className="w-6 h-6" /></div>
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-500">إيراد اليوم</div>
            <div className="text-2xl font-semibold">{formatCurrency(todayRevenue)}</div>
          </div>
        </div>

        <div className="rounded-xl border p-4 flex items-center gap-4 bg-white">
          <div className="p-3 rounded-lg bg-red-50 text-red-600"><AlertCircle className="w-6 h-6" /></div>
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-500">مستحقات خارجية</div>
            <div className="text-2xl font-semibold text-red-600">{formatCurrency(todayPending)}</div>
          </div>
        </div>

        <div className="rounded-xl border p-4 flex items-center gap-4 bg-white">
          <div className="p-3 rounded-lg bg-orange-50 text-orange-600"><TrendingDown className="w-6 h-6" /></div>
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-500">مصروفات</div>
            <div className="text-2xl font-semibold">{formatCurrency(todayExpenses)}</div>
          </div>
        </div>

        <div className="rounded-xl border p-4 flex items-center gap-4 bg-white">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600"><LucidePie className="w-6 h-6" /></div>
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-500">صافي الربح</div>
            <div className="text-2xl font-semibold">{formatCurrency((todayRevenue || 0) - (todayExpenses || 0))}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">اتجاه الإيراد (آخر 7 أيام)</div>
            <div className="text-sm text-gray-500">تحديث تلقائي</div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_series || []}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'MM/dd')} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#0d9488" fill="url(#tealGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="text-lg font-semibold mb-3">مصادر الإيراد</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4} startAngle={90} endAngle={-270}>
                  {donutData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {donutData.length === 0 ? 'لا توجد بيانات' : donutData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 inline-block rounded`} style={{ background: palette[i % palette.length] }}></span>
                  <span>{d.name}</span>
                </div>
                <div className="text-sm font-medium">{formatCurrency(d.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">آخر المعاملات</div>
          <div className="text-sm text-gray-500">آخر 5</div>
        </div>

        <div className="divide-y">
          {(recent || []).map((tx: any) => (
            <div key={tx.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">{tx.service_name ? tx.service_name.charAt(0) : 'S'}</div>
                <div className="text-right">
                  <div className="font-semibold">{tx.patient_name || 'مريض غير معروف'}</div>
                  <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleTimeString()} • {tx.created_by_name || 'أمين سر'}</div>
                </div>
              </div>

              <div className="text-green-600 font-semibold">+{Number(tx.paid_amount || 0).toLocaleString()} EGP</div>
            </div>
          ))}

          {(!recent || recent.length === 0) && (
            <div className="py-6 text-center text-gray-500">لا توجد معاملات اليوم</div>
          )}
        </div>
      </div>
    </div>
  );
}
