import React from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Pregnancy } from '../../../types';
import { calculateGestationalAge, getDueActions } from '../../../services/obstetricsService';

interface PregnancyHeaderProps {
  pregnancy: Pregnancy;
}

const PregnancyHeader: React.FC<PregnancyHeaderProps> = ({ pregnancy }) => {
  const lmpDate = pregnancy.lmp_date;
  const ga = lmpDate ? calculateGestationalAge(lmpDate) : { weeks: 0, days: 0 };
  const dueActions = getDueActions(ga.weeks);

  const progressPercentage = ((ga.weeks * 7 + ga.days) / 280) * 100;

  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-6 border border-teal-200">
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm text-gray-600 font-semibold mb-2 font-[Tajawal]">
            الحمل الحالي
          </h2>
          <p className="text-4xl font-bold text-teal-700 font-[Tajawal]">
            {ga.weeks}
            <span className="text-xl text-gray-500 ml-2">أسبوع</span>
            <span className="text-lg text-gray-400 ml-1">+ {ga.days}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">
            آخر دورة: {lmpDate ? new Date(lmpDate).toLocaleDateString('ar-EG') : 'غير محدد'}
          </p>
        </div>

        <div>
          <h3 className="text-sm text-gray-600 font-semibold mb-3 font-[Tajawal]">
            تقدم الحمل
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2 font-[Tajawal]">
            {progressPercentage.toFixed(0)}% من 40 أسبوع
          </p>
        </div>

        <div>
          <h3 className="text-sm text-gray-600 font-semibold mb-2 font-[Tajawal]">
            تاريخ الولادة المتوقع
          </h3>
          <p className="text-xl font-bold text-teal-700 font-[Tajawal]">
            {pregnancy.edd_date
              ? new Date(pregnancy.edd_date).toLocaleDateString('ar-EG')
              : 'غير محدد'}
          </p>
          <p className="text-xs text-gray-500 mt-2 font-[Tajawal]">
            {ga.weeks < 40 && `باقي ${40 - ga.weeks} أسابيع`}
            {ga.weeks >= 40 && '⏰ الولادة متوقعة!'}
          </p>
        </div>
      </div>

      {dueActions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-teal-200">
          <h3 className="text-sm font-semibold text-teal-900 mb-3 flex items-center gap-2 font-[Tajawal]">
            <AlertCircle size={18} className="text-orange-500" />
            الإجراءات المستحقة
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {dueActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-orange-200"
              >
                <AlertCircle size={16} className="text-orange-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-[Tajawal]">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pregnancy.risk_level === 'high' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="font-[Tajawal]">
              <p className="font-semibold text-red-900">⚠️ حمل عالي الخطورة</p>
              <p className="text-sm text-red-700 mt-1">
                الرقابة المتقاربة والاستشارة المتخصصة مطلوبة
              </p>
              {pregnancy.aspirin_prescribed && (
                <p className="text-sm text-red-600 mt-1">
                  ✓ Aspirin 150mg موصوف للوقاية من تسمم الحمل
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {pregnancy.risk_level === 'low' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <p className="text-sm text-green-800 font-[Tajawal] font-semibold">
            ✓ حمل منخفض الخطورة - المتابعة الروتينية المعتادة
          </p>
        </div>
      )}
    </div>
  );
};

export default PregnancyHeader;
