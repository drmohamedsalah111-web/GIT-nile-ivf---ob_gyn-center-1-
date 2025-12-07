import React, { useState, useEffect } from 'react';
import { Microscope, Baby, Activity, Heart, Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWorkup, saveWorkup, generateDiagnosis, WorkupState } from '../../services/workupService';

interface InfertilityWizardProps {
  patientId: string;
  patientName?: string;
}

const InfertilityWizard: React.FC<InfertilityWizardProps> = ({ patientId, patientName }) => {
  const [workupData, setWorkupData] = useState<WorkupState>({
    patientId,
    ovarianFactor: {},
    maleFactor: {},
    tubalFactor: {},
    uterineFactor: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadWorkup = async () => {
      try {
        const data = await getWorkup(patientId);
        setWorkupData(data);
      } catch (error) {
        toast.error('Failed to load infertility workup data');
      } finally {
        setLoading(false);
      }
    };

    loadWorkup();
  }, [patientId]);

  // Auto-generate diagnosis whenever data changes
  useEffect(() => {
    const diagnosis = generateDiagnosis(workupData);
    setWorkupData(prev => ({
      ...prev,
      diagnosis: diagnosis.diagnosis,
      plan: diagnosis.plan,
    }));
  }, [workupData.ovarianFactor, workupData.maleFactor, workupData.tubalFactor, workupData.uterineFactor]);

  // Handle input changes
  const updateOvarianFactor = (field: keyof WorkupState['ovarianFactor'], value: any) => {
    setWorkupData(prev => ({
      ...prev,
      ovarianFactor: {
        ...prev.ovarianFactor,
        [field]: value,
      },
    }));
  };

  const updateMaleFactor = (field: keyof WorkupState['maleFactor'], value: any) => {
    setWorkupData(prev => ({
      ...prev,
      maleFactor: {
        ...prev.maleFactor,
        [field]: value,
      },
    }));
  };

  const updateTubalFactor = (field: keyof WorkupState['tubalFactor'], value: any) => {
    setWorkupData(prev => ({
      ...prev,
      tubalFactor: {
        ...prev.tubalFactor,
        [field]: value,
      },
    }));
  };

  const updateUterineFactor = (field: keyof WorkupState['uterineFactor'], value: any) => {
    setWorkupData(prev => ({
      ...prev,
      uterineFactor: {
        ...prev.uterineFactor,
        [field]: value,
      },
    }));
  };

  // Determine card status and color
  const getCardStatus = (factor: any, checks: (() => boolean)[]) => {
    const hasData = Object.values(factor).some(value => value !== undefined && value !== '');
    if (!hasData) return { status: 'missing', color: 'border-gray-300 bg-gray-50', icon: Clock };

    const hasIssues = checks.some(check => check());
    return hasIssues
      ? { status: 'problem', color: 'border-red-300 bg-red-50', icon: AlertCircle }
      : { status: 'normal', color: 'border-green-300 bg-green-50', icon: CheckCircle };
  };

  const ovarianStatus = getCardStatus(workupData.ovarianFactor, [
    () => workupData.ovarianFactor.amh !== undefined && (workupData.ovarianFactor.amh < 1.1 || workupData.ovarianFactor.amh > 3.5),
    () => workupData.ovarianFactor.cycleRegularity === 'Irregular',
  ]);

  const maleStatus = getCardStatus(workupData.maleFactor, [
    () => workupData.maleFactor.spermCount !== undefined && workupData.maleFactor.spermCount < 15,
    () => workupData.maleFactor.motility !== undefined && workupData.maleFactor.motility < 40,
    () => workupData.maleFactor.morphology !== undefined && workupData.maleFactor.morphology < 4,
  ]);

  const tubalStatus = getCardStatus(workupData.tubalFactor, [
    () => workupData.tubalFactor.leftTube === 'Blocked' || workupData.tubalFactor.rightTube === 'Blocked',
    () => workupData.tubalFactor.leftTube === 'Hydrosalpinx' || workupData.tubalFactor.rightTube === 'Hydrosalpinx',
  ]);

  const uterineStatus = getCardStatus(workupData.uterineFactor, [
    () => workupData.uterineFactor.cavityStatus && workupData.uterineFactor.cavityStatus !== 'Normal',
  ]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWorkup(workupData);
      toast.success('Infertility workup saved successfully!');
    } catch (error) {
      toast.error('Failed to save infertility workup');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🔬 معالج العقم الآلي - Infertility Workup Wizard</h1>
            <p className="text-teal-100">
              Patient: <span className="font-semibold">{patientName || 'Unknown'}</span>
            </p>
          </div>
          <Microscope className="w-16 h-16 text-teal-200" />
        </div>

        {/* Auto-Diagnosis Preview */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            تشخيص تلقائي - Auto-Diagnosis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-teal-200">التشخيص:</span>
              <p className="font-semibold text-white mt-1">
                {workupData.diagnosis || 'يرجى إدخال البيانات - Please enter data'}
              </p>
            </div>
            <div>
              <span className="text-sm text-teal-200">الخطة العلاجية:</span>
              <p className="font-semibold text-white mt-1">
                {workupData.plan || 'يرجى إدخال البيانات - Please enter data'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ovarian Factor Card */}
        <div className={`rounded-xl border-2 p-6 transition-all duration-300 ${ovarianStatus.color}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Baby className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">العامل المبيضي</h3>
            </div>
            <ovarianStatus.icon className={`w-6 h-6 ${
              ovarianStatus.status === 'normal' ? 'text-green-600' :
              ovarianStatus.status === 'problem' ? 'text-red-600' : 'text-gray-400'
            }`} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AMH (ng/mL)</label>
              <input
                type="number"
                step="0.1"
                value={workupData.ovarianFactor.amh || ''}
                onChange={(e) => updateOvarianFactor('amh', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., 2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">انتظام الدورة</label>
              <select
                value={workupData.ovarianFactor.cycleRegularity || ''}
                onChange={(e) => updateOvarianFactor('cycleRegularity', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">اختر - Select</option>
                <option value="Regular">منتظم - Regular</option>
                <option value="Irregular">غير منتظم - Irregular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Male Factor Card */}
        <div className={`rounded-xl border-2 p-6 transition-all duration-300 ${maleStatus.color}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Heart className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">العامل الذكري</h3>
            </div>
            <maleStatus.icon className={`w-6 h-6 ${
              maleStatus.status === 'normal' ? 'text-green-600' :
              maleStatus.status === 'problem' ? 'text-red-600' : 'text-gray-400'
            }`} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عدد الحيوانات المنوية (M/mL)</label>
              <input
                type="number"
                value={workupData.maleFactor.spermCount || ''}
                onChange={(e) => updateMaleFactor('spermCount', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., 25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحركة (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={workupData.maleFactor.motility || ''}
                onChange={(e) => updateMaleFactor('motility', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., 45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الشكل (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={workupData.maleFactor.morphology || ''}
                onChange={(e) => updateMaleFactor('morphology', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., 6"
              />
            </div>
          </div>
        </div>

        {/* Tubal Factor Card */}
        <div className={`rounded-xl border-2 p-6 transition-all duration-300 ${tubalStatus.color}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Activity className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">العامل الأنبوبي</h3>
            </div>
            <tubalStatus.icon className={`w-6 h-6 ${
              tubalStatus.status === 'normal' ? 'text-green-600' :
              tubalStatus.status === 'problem' ? 'text-red-600' : 'text-gray-400'
            }`} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأنبوب الأيسر</label>
              <select
                value={workupData.tubalFactor.leftTube || ''}
                onChange={(e) => updateTubalFactor('leftTube', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">اختر - Select</option>
                <option value="Patent">مفتوح - Patent</option>
                <option value="Blocked">مسدود - Blocked</option>
                <option value="Hydrosalpinx">هيدر سالبينكس - Hydrosalpinx</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأنبوب الأيمن</label>
              <select
                value={workupData.tubalFactor.rightTube || ''}
                onChange={(e) => updateTubalFactor('rightTube', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">اختر - Select</option>
                <option value="Patent">مفتوح - Patent</option>
                <option value="Blocked">مسدود - Blocked</option>
                <option value="Hydrosalpinx">هيدر سالبينكس - Hydrosalpinx</option>
              </select>
            </div>
          </div>
        </div>

        {/* Uterine Factor Card */}
        <div className={`rounded-xl border-2 p-6 transition-all duration-300 ${uterineStatus.color}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Microscope className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">العامل الرحمي</h3>
            </div>
            <uterineStatus.icon className={`w-6 h-6 ${
              uterineStatus.status === 'normal' ? 'text-green-600' :
              uterineStatus.status === 'problem' ? 'text-red-600' : 'text-gray-400'
            }`} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حالة التجويف</label>
              <select
                value={workupData.uterineFactor.cavityStatus || ''}
                onChange={(e) => updateUterineFactor('cavityStatus', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">اختر - Select</option>
                <option value="Normal">طبيعي - Normal</option>
                <option value="Septum">حاجز - Septum</option>
                <option value="Polyp">سليلة - Polyp</option>
                <option value="Adhesions">التصاقات - Adhesions</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ التقييم - Save Workup'}
        </button>
      </div>
    </div>
  );
};

export default InfertilityWizard;