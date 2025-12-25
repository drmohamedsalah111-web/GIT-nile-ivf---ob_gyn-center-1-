import React, { useState } from 'react';
import { AlertTriangle, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

interface RiskAssessmentHeaderProps {
  pregnancy: any;
  onUpdate: () => void;
}

interface ObstetricHistory {
  gravida: number;
  parity_fullterm: number;
  parity_preterm: number;
  abortions: number;
  living: number;
}

interface MedicalHistory {
  hypertension: boolean;
  diabetes: boolean;
  thyroid: boolean;
  cardiac: boolean;
  dvt_vte: boolean;
  other: string;
}

interface PastObsHistory {
  preeclampsia: boolean;
  pph: boolean;
  previous_cs: boolean;
  recurrent_abortion: boolean;
  other: string;
}

interface CurrentRiskFactors {
  smoking: boolean;
  bmi_over_30: boolean;
  rh_negative: boolean;
  twin_pregnancy: boolean;
  advanced_maternal_age: boolean;
  other: string;
}

export const RiskAssessmentHeader: React.FC<RiskAssessmentHeaderProps> = ({
  pregnancy,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse existing data or set defaults
  const [obsHistory, setObsHistory] = useState<ObstetricHistory>(
    pregnancy.obstetric_history || {
      gravida: 0,
      parity_fullterm: 0,
      parity_preterm: 0,
      abortions: 0,
      living: 0
    }
  );

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>(
    pregnancy.medical_history || {
      hypertension: false,
      diabetes: false,
      thyroid: false,
      cardiac: false,
      dvt_vte: false,
      other: ''
    }
  );

  const [pastObsHistory, setPastObsHistory] = useState<PastObsHistory>(
    pregnancy.past_obs_history || {
      preeclampsia: false,
      pph: false,
      previous_cs: false,
      recurrent_abortion: false,
      other: ''
    }
  );

  const [currentRiskFactors, setCurrentRiskFactors] = useState<CurrentRiskFactors>(
    pregnancy.current_risk_factors || {
      smoking: false,
      bmi_over_30: false,
      rh_negative: false,
      twin_pregnancy: false,
      advanced_maternal_age: false,
      other: ''
    }
  );

  // Calculate if high risk
  const isHighRisk = 
    pastObsHistory.previous_cs ||
    pastObsHistory.preeclampsia ||
    pastObsHistory.pph ||
    medicalHistory.hypertension ||
    medicalHistory.diabetes ||
    medicalHistory.cardiac ||
    currentRiskFactors.twin_pregnancy ||
    currentRiskFactors.advanced_maternal_age;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pregnancies')
        .update({
          obstetric_history: obsHistory,
          medical_history: medicalHistory,
          past_obs_history: pastObsHistory,
          current_risk_factors: currentRiskFactors,
          risk_level: isHighRisk ? 'high' : 'low',
          updated_at: new Date().toISOString()
        })
        .eq('id', pregnancy.id);

      if (error) throw error;

      toast.success('تم حفظ التقييم بنجاح');
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error('Error saving risk assessment:', err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Calculate GPA code
  const gpaCode = `G${obsHistory.gravida}P${obsHistory.parity_fullterm}${obsHistory.parity_preterm > 0 ? `+${obsHistory.parity_preterm}` : ''}A${obsHistory.abortions}L${obsHistory.living}`;

  return (
    <div className={`bg-white rounded-xl shadow-md border-2 ${isHighRisk ? 'border-red-400' : 'border-amber-300'} p-6 print:border print:border-gray-300`}>
      {/* Header with HIGH RISK Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isHighRisk && (
            <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 animate-pulse">
              <AlertTriangle size={18} />
              <span>HIGH RISK PREGNANCY</span>
            </div>
          )}
          <span className="text-2xl font-bold text-gray-700">
            Obstetric Code: <span className="text-teal-700">{gpaCode}</span>
          </span>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors print:hidden"
          >
            <Edit2 size={18} />
            <span>تعديل</span>
          </button>
        ) : (
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              <Save size={18} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Section 1: Obstetric History (GPA) */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">
          Obstetric History (التاريخ التوليدي)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'gravida', label: 'Gravida (الحمل)', value: obsHistory.gravida },
            { key: 'parity_fullterm', label: 'Full-term (ولادة كاملة)', value: obsHistory.parity_fullterm },
            { key: 'parity_preterm', label: 'Pre-term (ولادة مبكرة)', value: obsHistory.parity_preterm },
            { key: 'abortions', label: 'Abortions (إجهاض)', value: obsHistory.abortions },
            { key: 'living', label: 'Living (أحياء)', value: obsHistory.living }
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={field.value}
                  onChange={e => setObsHistory({ ...obsHistory, [field.key]: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              ) : (
                <div className="text-2xl font-bold text-teal-700">{field.value}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Medical History */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">
          Medical History (التاريخ الطبي)
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'hypertension', label: 'Hypertension (ارتفاع ضغط الدم)', color: 'bg-red-100 text-red-800 border-red-300' },
            { key: 'diabetes', label: 'Diabetes (السكري)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
            { key: 'thyroid', label: 'Thyroid (الغدة الدرقية)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
            { key: 'cardiac', label: 'Cardiac (القلب)', color: 'bg-pink-100 text-pink-800 border-pink-300' },
            { key: 'dvt_vte', label: 'DVT/VTE (جلطات)', color: 'bg-orange-100 text-orange-800 border-orange-300' }
          ].map(field => {
            const isActive = medicalHistory[field.key as keyof MedicalHistory];
            return (
              <button
                key={field.key}
                onClick={() => isEditing && setMedicalHistory({ ...medicalHistory, [field.key]: !isActive })}
                disabled={!isEditing}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                  isActive ? field.color : 'bg-gray-50 text-gray-400 border-gray-200'
                } ${isEditing ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
        {isEditing && (
          <input
            type="text"
            placeholder="Other medical conditions..."
            value={medicalHistory.other}
            onChange={e => setMedicalHistory({ ...medicalHistory, other: e.target.value })}
            className="w-full mt-3 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
        )}
        {!isEditing && medicalHistory.other && (
          <p className="text-sm text-gray-600 mt-2 italic">Other: {medicalHistory.other}</p>
        )}
      </div>

      {/* Section 3: Past Obstetric History */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">
          Past Obstetric History (التاريخ التوليدي السابق)
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'preeclampsia', label: 'Pre-eclampsia (تسمم حمل)', color: 'bg-red-100 text-red-800 border-red-300' },
            { key: 'pph', label: 'PPH (نزيف ما بعد الولادة)', color: 'bg-red-100 text-red-800 border-red-300' },
            { key: 'previous_cs', label: '⚠️ Previous C/S (قيصرية سابقة)', color: 'bg-red-600 text-white border-red-700' },
            { key: 'recurrent_abortion', label: 'Recurrent Abortion (إجهاض متكرر)', color: 'bg-orange-100 text-orange-800 border-orange-300' }
          ].map(field => {
            const isActive = pastObsHistory[field.key as keyof PastObsHistory];
            return (
              <button
                key={field.key}
                onClick={() => isEditing && setPastObsHistory({ ...pastObsHistory, [field.key]: !isActive })}
                disabled={!isEditing}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                  isActive ? field.color : 'bg-gray-50 text-gray-400 border-gray-200'
                } ${isEditing ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
        {isEditing && (
          <input
            type="text"
            placeholder="Other past obstetric complications..."
            value={pastObsHistory.other}
            onChange={e => setPastObsHistory({ ...pastObsHistory, other: e.target.value })}
            className="w-full mt-3 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
        )}
        {!isEditing && pastObsHistory.other && (
          <p className="text-sm text-gray-600 mt-2 italic">Other: {pastObsHistory.other}</p>
        )}
      </div>

      {/* Section 4: Current Risk Factors */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">
          Current Risk Factors (عوامل الخطر الحالية)
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'smoking', label: 'Smoking (تدخين)', color: 'bg-gray-600 text-white border-gray-700' },
            { key: 'bmi_over_30', label: 'BMI > 30 (سمنة)', color: 'bg-orange-100 text-orange-800 border-orange-300' },
            { key: 'rh_negative', label: 'Rh Negative (عامل ريسوس سالب)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
            { key: 'twin_pregnancy', label: 'Twin Pregnancy (حمل توأم)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
            { key: 'advanced_maternal_age', label: 'Age > 35 (سن متقدم)', color: 'bg-pink-100 text-pink-800 border-pink-300' }
          ].map(field => {
            const isActive = currentRiskFactors[field.key as keyof CurrentRiskFactors];
            return (
              <button
                key={field.key}
                onClick={() => isEditing && setCurrentRiskFactors({ ...currentRiskFactors, [field.key]: !isActive })}
                disabled={!isEditing}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                  isActive ? field.color : 'bg-gray-50 text-gray-400 border-gray-200'
                } ${isEditing ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
        {isEditing && (
          <input
            type="text"
            placeholder="Other current risk factors..."
            value={currentRiskFactors.other}
            onChange={e => setCurrentRiskFactors({ ...currentRiskFactors, other: e.target.value })}
            className="w-full mt-3 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
        )}
        {!isEditing && currentRiskFactors.other && (
          <p className="text-sm text-gray-600 mt-2 italic">Other: {currentRiskFactors.other}</p>
        )}
      </div>
    </div>
  );
};
