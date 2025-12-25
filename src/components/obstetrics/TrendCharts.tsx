import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { differenceInWeeks, parseISO } from 'date-fns';

interface TrendChartsProps {
  visits: any[];
  pregnancyLmp: string;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ visits, pregnancyLmp }) => {
  // Prepare data for charts
  const chartData = visits
    .slice()
    .reverse() // Oldest to newest
    .map(visit => {
      const ga = pregnancyLmp 
        ? differenceInWeeks(parseISO(visit.visit_date), parseISO(pregnancyLmp))
        : visit.gestational_age_weeks;

      // Ideal weight gain (IOM guidelines for normal BMI)
      // First trimester: 0.5-2 kg total
      // Second trimester: ~0.4 kg/week
      // Third trimester: ~0.4 kg/week
      let idealWeightGain = 0;
      if (ga <= 13) {
        idealWeightGain = ga * 0.15; // ~2kg by week 13
      } else if (ga <= 27) {
        idealWeightGain = 2 + (ga - 13) * 0.4; // Adding 0.4kg per week
      } else {
        idealWeightGain = 2 + 14 * 0.4 + (ga - 27) * 0.4;
      }

      return {
        week: `${ga}w`,
        weekNum: ga,
        weight: visit.weight_kg || null,
        idealWeight: visit.weight_kg ? (visit.weight_kg - idealWeightGain) + idealWeightGain : null,
        systolic: visit.systolic_bp || null,
        diastolic: visit.diastolic_bp || null,
        date: visit.visit_date
      };
    });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{payload[0].payload.week}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-bold">{entry.value?.toFixed(1)}</span>
              {entry.name.includes('Weight') ? ' kg' : entry.name.includes('BP') ? ' mmHg' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weight Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 print:break-inside-avoid">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
          منحنى الوزن (Maternal Weight Curve)
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#9333ea"
              strokeWidth={3}
              dot={{ fill: '#9333ea', r: 5 }}
              name="الوزن الفعلي (Actual Weight)"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="idealWeight"
              stroke="#d946ef"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="الوزن المثالي (Ideal Weight)"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-purple-700 font-medium">أول وزن مسجل</div>
            <div className="text-xl font-bold text-purple-900">
              {chartData[0]?.weight ? `${chartData[0].weight} kg` : '-'}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-purple-700 font-medium">آخر وزن مسجل</div>
            <div className="text-xl font-bold text-purple-900">
              {chartData[chartData.length - 1]?.weight ? `${chartData[chartData.length - 1].weight} kg` : '-'}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200 col-span-2">
            <div className="text-green-700 font-medium">إجمالي الزيادة في الوزن</div>
            <div className="text-xl font-bold text-green-900">
              {chartData[0]?.weight && chartData[chartData.length - 1]?.weight
                ? `+${(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1)} kg`
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* BP Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 print:break-inside-avoid">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full"></span>
          منحنى ضغط الدم (BP Trend)
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              domain={[60, 160]}
              label={{ value: 'BP (mmHg)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
            />
            
            {/* Reference lines for high BP */}
            <ReferenceLine 
              y={140} 
              stroke="#ef4444" 
              strokeDasharray="3 3"
              label={{ value: 'High Systolic', position: 'right', fill: '#ef4444', fontSize: 10 }}
            />
            <ReferenceLine 
              y={90} 
              stroke="#f59e0b" 
              strokeDasharray="3 3"
              label={{ value: 'High Diastolic', position: 'right', fill: '#f59e0b', fontSize: 10 }}
            />

            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ fill: '#dc2626', r: 5 }}
              name="الانقباضي (Systolic)"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#ea580c"
              strokeWidth={3}
              dot={{ fill: '#ea580c', r: 5 }}
              name="الانبساطي (Diastolic)"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-red-700 font-medium">متوسط الانقباضي</div>
            <div className="text-xl font-bold text-red-900">
              {chartData.filter(d => d.systolic).length > 0
                ? Math.round(
                    chartData.reduce((sum, d) => sum + (d.systolic || 0), 0) /
                    chartData.filter(d => d.systolic).length
                  )
                : '-'}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="text-orange-700 font-medium">متوسط الانبساطي</div>
            <div className="text-xl font-bold text-orange-900">
              {chartData.filter(d => d.diastolic).length > 0
                ? Math.round(
                    chartData.reduce((sum, d) => sum + (d.diastolic || 0), 0) /
                    chartData.filter(d => d.diastolic).length
                  )
                : '-'}
            </div>
          </div>
          <div className={`p-3 rounded-lg border col-span-2 ${
            chartData.some(d => (d.systolic && d.systolic > 140) || (d.diastolic && d.diastolic > 90))
              ? 'bg-red-100 border-red-300'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className={`font-medium ${
              chartData.some(d => (d.systolic && d.systolic > 140) || (d.diastolic && d.diastolic > 90))
                ? 'text-red-700'
                : 'text-green-700'
            }`}>
              حالة ضغط الدم
            </div>
            <div className={`text-xl font-bold ${
              chartData.some(d => (d.systolic && d.systolic > 140) || (d.diastolic && d.diastolic > 90))
                ? 'text-red-900'
                : 'text-green-900'
            }`}>
              {chartData.some(d => (d.systolic && d.systolic > 140) || (d.diastolic && d.diastolic > 90))
                ? '⚠️ يوجد قراءات مرتفعة'
                : '✓ ضمن الطبيعي'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
