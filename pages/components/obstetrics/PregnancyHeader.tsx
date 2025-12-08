import React from 'react';
import { Calendar, AlertCircle, CheckCircle, Baby } from 'lucide-react';
import { Pregnancy } from '../../../types';
import { calculateGestationalAge, getDueActions } from '../../../services/obstetricsService';
import toast from 'react-hot-toast';

interface PregnancyHeaderProps {
  pregnancy: Pregnancy;
}

const PregnancyHeader: React.FC<PregnancyHeaderProps> = ({ pregnancy }) => {
  const lmpDate = pregnancy.lmp_date;
  const ga = lmpDate ? calculateGestationalAge(lmpDate) : { weeks: 0, days: 0 };
  const dueActions = getDueActions(ga.weeks);

  const progressPercentage = ((ga.weeks * 7 + ga.days) / 280) * 100;

  // Determine pregnancy status based on gestational age
  const getPregnancyStatus = (weeks: number) => {
    if (weeks < 37) {
      return {
        status: 'Pre-term',
        color: 'blue',
        arabicText: 'حمل مبكر',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      };
    } else if (weeks >= 37 && weeks < 40) {
      return {
        status: 'Full Term',
        color: 'green',
        arabicText: 'فترة ولادة طبيعية',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    } else if (weeks >= 40 && weeks < 42) {
      return {
        status: 'Late Term / Overdue',
        color: 'orange',
        arabicText: 'تخطت الموعد',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      };
    } else {
      return {
        status: 'Post Term',
        color: 'red',
        arabicText: 'حمل متأخر عن الموعد - خطر',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      };
    }
  };

  const pregnancyStatus = getPregnancyStatus(ga.weeks);
  const isOverdue = ga.weeks >= 40;

  const handleDeliveryCheck = () => {
    toast.success('تم تسجيل الاستعلام عن الولادة - يرجى تحديث بيانات الولادة في النظام');
    // TODO: Navigate to delivery outcome form or archive the pregnancy
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-6 border border-teal-200">
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <div></div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${pregnancyStatus.bgColor} ${pregnancyStatus.textColor} border ${pregnancyStatus.borderColor} font-[Tajawal]`}>
          {pregnancyStatus.arabicText}
        </div>
      </div>

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
              className={`h-full rounded-full transition-all duration-500 ${
                isOverdue
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2 font-[Tajawal]">
            {progressPercentage.toFixed(0)}% من 40 أسبوع
            {isOverdue && (
              <span className="text-red-600 font-bold ml-2">
                (متأخر عن الموعد)
              </span>
            )}
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

      {/* Did She Deliver? Prompt for overdue pregnancies */}
      {isOverdue && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Baby className="text-red-600" size={24} />
              <div>
                <h4 className="text-lg font-bold text-red-900 font-[Tajawal]">
                  👶 هل تمت الولادة؟
                </h4>
                <p className="text-sm text-red-700 font-[Tajawal]">
                  تسجيل بيانات الولادة وإنهاء ملف الحمل
                </p>
              </div>
            </div>
            <button
              onClick={handleDeliveryCheck}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 font-[Tajawal] flex items-center gap-2"
            >
              <Baby size={16} />
              تسجيل الولادة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PregnancyHeader;
