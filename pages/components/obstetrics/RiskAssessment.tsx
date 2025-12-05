import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Pregnancy } from '../../../types';
import { assessRiskLevel, RiskFactors } from '../../../services/obstetricsService';
import toast from 'react-hot-toast';

interface RiskAssessmentProps {
  pregnancy: Pregnancy;
  onUpdate: (updates: Partial<Pregnancy>) => Promise<void>;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ pregnancy, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const initialRiskFactors: RiskFactors = {
    age_over_40: pregnancy.risk_factors?.includes('age_over_40') || false,
    bmi_over_30: pregnancy.risk_factors?.includes('bmi_over_30') || false,
    previous_preeclampsia: pregnancy.risk_factors?.includes('previous_preeclampsia') || false,
    twins: pregnancy.risk_factors?.includes('twins') || false,
    autoimmune: pregnancy.risk_factors?.includes('autoimmune') || false,
    hypertension: pregnancy.risk_factors?.includes('hypertension') || false,
    diabetes: pregnancy.risk_factors?.includes('diabetes') || false,
    kidney_disease: pregnancy.risk_factors?.includes('kidney_disease') || false,
  };

  const [riskFactors, setRiskFactors] = useState<RiskFactors>(initialRiskFactors);
  const riskAssessment = assessRiskLevel(riskFactors);

  const riskFactorOptions = [
    { key: 'age_over_40', label: 'العمر > 40 سنة' },
    { key: 'bmi_over_30', label: 'مؤشر كتلة الجسم > 30' },
    { key: 'previous_preeclampsia', label: 'تسمم الحمل السابق' },
    { key: 'twins', label: 'حمل متعدد (توأم أو أكثر)' },
    { key: 'autoimmune', label: 'أمراض المناعة الذاتية' },
    { key: 'hypertension', label: 'ارتفاع ضغط الدم' },
    { key: 'diabetes', label: 'السكري' },
    { key: 'kidney_disease', label: 'أمراض الكلى' },
  ];

  const handleFactorChange = (key: keyof RiskFactors) => {
    setRiskFactors(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedRiskFactors = Object.keys(riskFactors)
        .filter(key => riskFactors[key as keyof RiskFactors])
        .map(key => key.replace(/_/g, '_'));

      await onUpdate({
        risk_factors: updatedRiskFactors,
        risk_level: riskAssessment.level,
        aspirin_prescribed: riskAssessment.aspirinNeeded,
        thromboprophylaxis_needed: riskAssessment.thromboprophylaxisNeeded,
      });

      toast.success('تم تحديث تقييم المخاطر بنجاح');
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      toast.error('فشل تحديث تقييم المخاطر');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-lg font-bold text-gray-900 hover:text-teal-700 transition-colors font-[Tajawal]"
      >
        <span>⚖️ تقييم المخاطر حسب RCOG</span>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {riskFactorOptions.map(option => (
              <label
                key={option.key}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={riskFactors[option.key as keyof RiskFactors]}
                  onChange={() => handleFactorChange(option.key as keyof RiskFactors)}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-700 font-[Tajawal]">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg border-2" style={{
            borderColor: riskAssessment.level === 'high' ? '#dc2626' : riskAssessment.level === 'moderate' ? '#f97316' : '#16a34a',
            backgroundColor: riskAssessment.level === 'high' ? '#fef2f2' : riskAssessment.level === 'moderate' ? '#fff7ed' : '#f0fdf4',
          }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg font-[Tajawal]" style={{
                color: riskAssessment.level === 'high' ? '#991b1b' : riskAssessment.level === 'moderate' ? '#9a3412' : '#166534',
              }}>
                {riskAssessment.level === 'high' && '🔴 حمل عالي الخطورة'}
                {riskAssessment.level === 'moderate' && '🟡 حمل متوسط الخطورة'}
                {riskAssessment.level === 'low' && '🟢 حمل منخفض الخطورة'}
              </h3>
            </div>

            {riskAssessment.riskFactorsList.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">عوامل الخطورة:</p>
                <ul className="list-disc list-inside space-y-1">
                  {riskAssessment.riskFactorsList.map((factor, idx) => (
                    <li key={idx} className="text-sm text-gray-700 font-[Tajawal]">{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {riskAssessment.aspirinNeeded && (
              <div className="p-3 bg-white rounded border border-current mb-2">
                <p className="text-sm font-semibold text-gray-900 font-[Tajawal]">
                  💊 وصفة موصى بها: Aspirin 150mg يومياً (لتقليل خطر تسمم الحمل)
                </p>
              </div>
            )}

            {riskAssessment.thromboprophylaxisNeeded && (
              <div className="p-3 bg-white rounded border border-current">
                <p className="text-sm font-semibold text-gray-900 font-[Tajawal]">
                  💉 تنبيه: قد تكون الوقاية من التجلط (Clexane) مطلوبة
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-[Tajawal] font-semibold transition-colors"
          >
            <Save size={18} />
            {isSaving ? 'جاري الحفظ...' : 'حفظ تقييم المخاطر'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;
