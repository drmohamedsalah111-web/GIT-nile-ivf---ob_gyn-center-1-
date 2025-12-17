import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, AlertCircle, TimerReset } from 'lucide-react';
import { format } from 'date-fns';
import {
  calculatePregnancySnapshotFromEdd,
  calculatePregnancySnapshotFromLmp,
  parseDateInput,
  PregnancyMilestone,
  Trimester
} from './pregnancyCalculations';

interface PregnancyWheelProps {
  initialLmp?: string | null;
  initialEdd?: string | null;
}

const trimesterMeta: Record<Trimester, { labelAr: string; barClass: string; badgeClass: string }> = {
  1: { labelAr: 'الثلث الأول', barClass: 'bg-teal-600', badgeClass: 'bg-teal-50 text-teal-800 border-teal-200' },
  2: { labelAr: 'الثلث الثاني', barClass: 'bg-blue-600', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' },
  3: { labelAr: 'الثلث الثالث', barClass: 'bg-pink-600', badgeClass: 'bg-pink-50 text-pink-800 border-pink-200' }
};

const formatDateAr = (date: Date) => {
  try {
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return format(date, 'yyyy-MM-dd');
  }
};

const milestoneDateLabel = (milestone: PregnancyMilestone) => {
  if (!milestone.endDate) return formatDateAr(milestone.startDate);
  return `${formatDateAr(milestone.startDate)} - ${formatDateAr(milestone.endDate)}`;
};

const MilestoneRow: React.FC<{ milestone: PregnancyMilestone }> = ({ milestone }) => {
  const isDone = milestone.status === 'completed';
  const isActive = milestone.status === 'active';
  const accent =
    milestone.isCritical && !isDone
      ? 'border-rose-200 bg-rose-50'
      : isActive
        ? 'border-teal-200 bg-teal-50'
        : 'border-gray-200 bg-white';

  return (
    <div className={`border rounded-lg p-3 transition ${accent} ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : isActive ? (
              <AlertCircle className="w-4 h-4 text-teal-700" />
            ) : (
              <Calendar className="w-4 h-4 text-gray-500" />
            )}
            <h4 className={`font-semibold text-sm text-gray-900 font-[Tajawal] ${milestone.isCritical ? 'text-rose-800' : ''}`}>
              {milestone.titleAr}
            </h4>
          </div>
          {milestone.noteAr && (
            <div className="mt-1 text-xs text-gray-600 font-[Tajawal]">{milestone.noteAr}</div>
          )}
        </div>
        <div className="text-xs text-gray-700 whitespace-nowrap font-[Tajawal]">
          {milestoneDateLabel(milestone)}
        </div>
      </div>
    </div>
  );
};

const PregnancyWheel: React.FC<PregnancyWheelProps> = ({ initialLmp, initialEdd }) => {
  const [lmpInput, setLmpInput] = useState<string>(() => String(initialLmp || '').slice(0, 10));
  const [eddInput, setEddInput] = useState<string>(() => String(initialEdd || '').slice(0, 10));
  const [lastEdited, setLastEdited] = useState<'lmp' | 'edd'>('lmp');

  const snapshot = useMemo(() => {
    const lmp = parseDateInput(lmpInput);
    const edd = parseDateInput(eddInput);

    if (lastEdited === 'edd' && edd) {
      return calculatePregnancySnapshotFromEdd(edd);
    }
    if (lmp) {
      return calculatePregnancySnapshotFromLmp(lmp);
    }
    if (edd) {
      return calculatePregnancySnapshotFromEdd(edd);
    }
    return null;
  }, [lmpInput, eddInput, lastEdited]);

  const meta = snapshot ? trimesterMeta[snapshot.trimester] : null;

  const handleLmpChange = (value: string) => {
    setLastEdited('lmp');
    setLmpInput(value);
    const lmp = parseDateInput(value);
    if (!lmp) return;
    const derived = calculatePregnancySnapshotFromLmp(lmp);
    setEddInput(format(derived.edd, 'yyyy-MM-dd'));
  };

  const handleEddChange = (value: string) => {
    setLastEdited('edd');
    setEddInput(value);
    const edd = parseDateInput(value);
    if (!edd) return;
    const derived = calculatePregnancySnapshotFromEdd(edd);
    setLmpInput(format(derived.lmp, 'yyyy-MM-dd'));
  };

  const handleReset = () => {
    setLmpInput('');
    setEddInput('');
    setLastEdited('lmp');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-[Tajawal]">عجلة الحمل الرقمية والحاسبة</h3>
          <p className="text-sm text-gray-600 font-[Tajawal]">
            أدخل تاريخ آخر دورة أو تاريخ الولادة المتوقع — وسيتم الحساب تلقائيًا.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 font-[Tajawal]"
        >
          <TimerReset className="w-4 h-4" />
          مسح
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-[Tajawal]">تاريخ آخر دورة (LMP)</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={lmpInput}
              onChange={(e) => handleLmpChange(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-[Tajawal]">تاريخ الولادة المتوقع (EDD)</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={eddInput}
              onChange={(e) => handleEddChange(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 font-[Tajawal]">عند إدخال EDD سيتم حساب LMP تلقائيًا.</div>
        </div>
      </div>

      {!snapshot ? (
        <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-600 font-[Tajawal]">
          أدخل تاريخًا لبدء الحساب.
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 font-[Tajawal]">عمر الحمل الحالي</div>
              <div className="mt-1 text-2xl font-extrabold text-gray-900 font-[Tajawal]">
                {snapshot.gaWeeks}w + {snapshot.gaDaysRemainder}d
              </div>
              <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold font-[Tajawal] ${meta?.badgeClass || ''}">
                {meta?.labelAr}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 font-[Tajawal]">تاريخ الولادة المتوقع</div>
              <div className="mt-1 text-xl font-extrabold text-gray-900 font-[Tajawal]">
                {formatDateAr(snapshot.edd)}
              </div>
              <div className="mt-2 text-sm text-gray-700 font-[Tajawal]">
                المتبقي: <span className="font-bold">{snapshot.daysRemaining}</span> يوم
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600 font-[Tajawal]">نسبة التقدم</div>
                <div className="text-xs text-gray-800 font-[Tajawal]">{snapshot.progressPct.toFixed(1)}%</div>
              </div>
              <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${meta?.barClass || 'bg-teal-600'} rounded-full transition-all`}
                  style={{ width: `${snapshot.progressPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 font-[Tajawal]">
                EDD = LMP + 280 يوم
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 bg-white">
              <h4 className="text-sm font-bold text-gray-900 mb-3 font-[Tajawal]">محطات مهمة خلال الحمل</h4>
              <div className="space-y-2">
                {snapshot.milestones.map((m) => (
                  <MilestoneRow key={m.id} milestone={m} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <h4 className="text-sm font-bold text-gray-900 mb-3 font-[Tajawal]">ملخص سريع</h4>
              <div className="space-y-2 text-sm text-gray-800 font-[Tajawal]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">LMP</span>
                  <span className="font-semibold">{formatDateAr(snapshot.lmp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">EDD</span>
                  <span className="font-semibold">{formatDateAr(snapshot.edd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">الثلث</span>
                  <span className={`font-semibold ${meta?.barClass?.replace('bg-', 'text-') || 'text-teal-700'}`}>
                    {meta?.labelAr}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-[Tajawal]">
                  ملاحظة: بعض المحطات “عند اللزوم” تعتمد على تقييم الطبيب والحالة الإكلينيكية.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PregnancyWheel;

