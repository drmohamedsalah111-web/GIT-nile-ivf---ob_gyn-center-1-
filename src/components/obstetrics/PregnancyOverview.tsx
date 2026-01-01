import React, { useState } from 'react';
import { format, differenceInWeeks, differenceInDays, addDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, Calendar, Baby, Activity, Edit2 } from 'lucide-react';
import { EditPregnancyDatesModal } from './EditPregnancyDatesModal';

interface PregnancyOverviewProps {
  pregnancy: any;
  visits: any[];
  scans: any[];
  onRefresh?: () => void;
}

export const PregnancyOverview: React.FC<PregnancyOverviewProps> = ({ pregnancy, visits, scans, onRefresh }) => {
  // State for edit modal
  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

  // Calculations
  const today = new Date();
  const lmpDate = pregnancy.lmp_date ? parseISO(pregnancy.lmp_date) : null;
  const eddDate = pregnancy.edd_date ? parseISO(pregnancy.edd_date) : (lmpDate ? addDays(lmpDate, 280) : null);
  
  let gaWeeks = 0;
  let gaDays = 0;
  
  if (lmpDate) {
    const diffDays = differenceInDays(today, lmpDate);
    gaWeeks = Math.floor(diffDays / 7);
    gaDays = diffDays % 7;
  }

  // Prepare chart data
  const weightData = visits
    .filter(v => v.weight_kg && v.visit_date)
    .map(v => ({
      date: format(parseISO(v.visit_date), 'dd/MM'),
      weight: v.weight_kg,
      week: v.gestational_age_weeks
    }))
    .reverse();

  const bpData = visits
    .filter(v => v.systolic_bp && v.diastolic_bp && v.visit_date)
    .map(v => ({
      date: format(parseISO(v.visit_date), 'dd/MM'),
      systolic: v.systolic_bp,
      diastolic: v.diastolic_bp,
      week: v.gestational_age_weeks
    }))
    .reverse();

  // Trimester calculation
  const trimester = gaWeeks < 13 ? 1 : gaWeeks < 27 ? 2 : 3;
  const progress = Math.min(100, Math.max(0, (gaWeeks / 40) * 100));

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">ملخص الحمل</h2>
              <button
                onClick={() => setIsEditDatesModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                title="تعديل تاريخ آخر دورة"
              >
                <Edit2 size={16} />
                <span className="font-[Tajawal]">تعديل التاريخ</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>LMP: {lmpDate ? format(lmpDate, 'dd MMM yyyy') : 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-pink-500" />
                <span>EDD: {eddDate ? format(eddDate, 'dd MMM yyyy') : 'غير محدد'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-teal-50 rounded-lg p-4 text-center">
            <div className="text-sm text-teal-600 font-medium mb-1">عمر الحمل الحالي</div>
            <div className="text-2xl font-bold text-teal-800">
              {gaWeeks} <span className="text-sm font-normal">أسبوع</span> + {gaDays} <span className="text-sm font-normal">يوم</span>
            </div>
          </div>

          <div className={`rounded-lg p-4 text-center ${
            pregnancy.risk_level === 'high' ? 'bg-red-50 text-red-700' :
            pregnancy.risk_level === 'moderate' ? 'bg-yellow-50 text-yellow-700' :
            'bg-green-50 text-green-700'
          }`}>
            <div className="text-sm font-medium mb-1">مستوى الخطورة</div>
            <div className="text-xl font-bold">
              {pregnancy.risk_level === 'high' ? 'عالي الخطورة' :
               pregnancy.risk_level === 'moderate' ? 'متوسط الخطورة' : 'منخفض الخطورة'}
            </div>
          </div>
        </div>

        {/* Pregnancy Wheel / Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>الأسبوع 0</span>
            <span>الثلث الأول</span>
            <span>الثلث الثاني</span>
            <span>الثلث الثالث</span>
            <span>الأسبوع 40</span>
          </div>
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 right-0 h-full bg-gradient-to-l from-teal-500 to-teal-300 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
            {/* Trimester Markers */}
            <div className="absolute top-0 right-[32.5%] h-full w-0.5 bg-white/50" />
            <div className="absolute top-0 right-[67.5%] h-full w-0.5 bg-white/50" />
          </div>
          <div className="mt-2 text-center text-sm font-medium text-teal-700">
            أنت الآن في الثلث {trimester === 1 ? 'الأول' : trimester === 2 ? 'الثاني' : 'الثالث'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            متابعة الوزن
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" label={{ value: 'الأسبوع', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="الوزن (كجم)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Pressure Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            ضغط الدم
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bpData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" label={{ value: 'الأسبوع', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[60, 160]} />
                <Tooltip />
                <ReferenceLine y={140} stroke="red" strokeDasharray="3 3" label="Systolic Limit" />
                <ReferenceLine y={90} stroke="red" strokeDasharray="3 3" label="Diastolic Limit" />
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                <Line type="monotone" dataKey="diastolic" stroke="#f87171" strokeWidth={2} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Edit Pregnancy Dates Modal */}
      <EditPregnancyDatesModal
        isOpen={isEditDatesModalOpen}
        onClose={() => setIsEditDatesModalOpen(false)}
        pregnancyId={pregnancy.id}
        currentLmpDate={pregnancy.lmp_date}
        currentEddDate={pregnancy.edd_date}
        currentEddByScan={pregnancy.edd_by_scan}
        onSuccess={() => {
          setIsEditDatesModalOpen(false);
          onRefresh?.();
        }}
      />
    </div>
  );
};
