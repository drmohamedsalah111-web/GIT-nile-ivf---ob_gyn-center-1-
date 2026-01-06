/**
 * SMART IVF STIMULATION COPILOT
 * واجهة ذكية لمتابعة رحلة الحقن المجهري - مرحلة التنشيط
 * 
 * Features:
 * - متابعة دقيقة لزيارات التنشيط
 * - توصيات ذكية فورية
 * - تنبيهات تلقائية
 * - رسوم بيانية تفاعلية
 * - حساب الجرعات الذكي
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, Cell
} from 'recharts';
import {
  Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus,
  Calendar, Syringe, Pill, Eye, Brain, Target, Zap, Plus, Save,
  Trash2, Clock, FileText, AlertCircle, Info, Users, Search,
  ArrowRight, ArrowUp, ArrowDown, Droplet, Heart, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usePatients } from '../src/hooks/usePatients';
import smartStimulationService, {
  SmartIVFCycle,
  MonitoringVisit,
  CycleStatus,
  OHSSRisk
} from '../services/smartStimulationService';
import { dbService } from '../services/dbService';

// ============================================================================
// TYPES
// ============================================================================

interface PatientInfo {
  id: string;
  name: string;
  age: number;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * بطاقة معلومات المريض
 */
const PatientCard: React.FC<{ patient: PatientInfo }> = ({ patient }) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-blue-600 rounded-full text-white">
        <Users size={24} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>العمر: {patient.age} سنة</span>
        </div>
      </div>
    </div>
  </div>
);

/**
 * بطاقة ملخص الدورة
 */
const CycleSummaryCard: React.FC<{
  cycle: SmartIVFCycle;
  visitCount: number;
  latestVisit?: MonitoringVisit;
}> = ({ cycle, visitCount, latestVisit }) => {

  const getStatusBadge = (status: CycleStatus) => {
    const badges = {
      stimulation: { text: 'جاري التنشيط', color: 'bg-blue-100 text-blue-800' },
      baseline: { text: 'فحص أساسي', color: 'bg-purple-100 text-purple-800' },
      trigger: { text: 'الإبرة التفجيرية', color: 'bg-pink-100 text-pink-800' },
      opu: { text: 'سحب البويضات', color: 'bg-green-100 text-green-800' },
      assessment: { text: 'تقييم', color: 'bg-gray-100 text-gray-800' },
    };
    return badges[status as keyof typeof badges] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getRiskColor = (risk?: OHSSRisk) => {
    if (!risk) return 'text-gray-500';
    const colors = {
      low: 'text-green-600',
      moderate: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[risk];
  };

  const badge = getStatusBadge(cycle.status);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900">
            الدورة رقم {cycle.cycle_number}
          </h4>
          <p className="text-sm text-gray-600">{cycle.protocol_name || cycle.protocol_type}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold ${badge.color}`}>
          {badge.text}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{visitCount}</div>
          <div className="text-xs text-gray-600">زيارات متابعة</div>
        </div>

        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {latestVisit?.total_follicles || 0}
          </div>
          <div className="text-xs text-gray-600">عدد الحويصلات</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {latestVisit?.lead_follicle_size?.toFixed(1) || 0}mm
          </div>
          <div className="text-xs text-gray-600">أكبر حويصلة</div>
        </div>

        <div className="text-center p-3 bg-pink-50 rounded-lg">
          <div className={`text-2xl font-bold ${getRiskColor(cycle.ohss_risk_level)}`}>
            {cycle.ohss_risk_level || 'منخفض'}
          </div>
          <div className="text-xs text-gray-600">خطر OHSS</div>
        </div>
      </div>
    </div>
  );
};

/**
 * بطاقة التوصيات الذكية
 */
const AIRecommendationsCard: React.FC<{ visit?: MonitoringVisit }> = ({ visit }) => {
  if (!visit || !visit.ai_recommendations || visit.ai_recommendations.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <Brain size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">التوصيات الذكية</h3>
      </div>

      <div className="space-y-3">
        {visit.ai_recommendations.map((rec: any, idx: number) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 ${getSeverityColor(rec.severity)}`}
          >
            {getSeverityIcon(rec.severity)}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{rec.message}</p>
              {rec.action && (
                <p className="text-sm text-gray-600 mt-1">الإجراء: {rec.action}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {visit.dose_adjustment && visit.dose_adjustment !== 'maintain' && (
        <div className="mt-4 p-4 bg-white/70 rounded-lg border-2 border-indigo-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">توصية الجرعة التالية</p>
              <p className="text-sm text-gray-600">{visit.dose_adjustment_reason}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {visit.recommended_fsh_dose} IU
              </div>
              <div className="text-xs text-gray-600">FSH</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * نموذج إضافة زيارة جديدة
 */
const AddVisitForm: React.FC<{
  cycleId: string;
  visitCount: number;
  lastVisit?: MonitoringVisit;
  onSave: () => void;
  onCancel: () => void;
}> = ({ cycleId, visitCount, lastVisit, onSave, onCancel }) => {

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<MonitoringVisit>>({
    cycle_id: cycleId,
    visit_number: visitCount + 1,
    visit_date: new Date().toISOString().split('T')[0],
    cycle_day: (lastVisit?.cycle_day || 0) + 2,
    stimulation_day: (lastVisit?.stimulation_day || 0) + 2,
    e2_level: undefined,
    lh_level: undefined,
    p4_level: undefined,
    endometrium_thickness: undefined,
    follicles_right: [],
    follicles_left: [],
    fsh_dose_given: lastVisit?.recommended_fsh_dose || lastVisit?.fsh_dose_given || 150,
    hmg_dose_given: lastVisit?.hmg_dose_given || 0,
    antagonist_given: false,
    doctor_notes: ''
  });

  const [follicleInput, setFollicleInput] = useState({ right: '', left: '' });

  const handleFollicleAdd = (side: 'right' | 'left', value: string) => {
    const size = parseFloat(value);
    if (isNaN(size) || size < 5 || size > 30) return;

    const field = side === 'right' ? 'follicles_right' : 'follicles_left';
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), size].sort((a, b) => b - a)
    }));

    setFollicleInput(prev => ({ ...prev, [side]: '' }));
  };

  const handleFollicleRemove = (side: 'right' | 'left', index: number) => {
    const field = side === 'right' ? 'follicles_right' : 'follicles_left';
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await smartStimulationService.addMonitoringVisit(formData as Omit<MonitoringVisit, 'id'>);
      toast.success('تم حفظ الزيارة بنجاح');
      onSave();
    } catch (error: any) {
      toast.error('خطأ في الحفظ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">زيارة متابعة جديدة</h2>
          <p className="text-indigo-100">الزيارة رقم {formData.visit_number}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* التاريخ والأيام */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 ml-1" />
                تاريخ الزيارة
              </label>
              <input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                يوم الدورة
              </label>
              <input
                type="number"
                value={formData.cycle_day}
                onChange={(e) => setFormData({ ...formData, cycle_day: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                يوم التنشيط
              </label>
              <input
                type="number"
                value={formData.stimulation_day}
                onChange={(e) => setFormData({ ...formData, stimulation_day: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                min="1"
              />
            </div>
          </div>

          {/* التحاليل الهرمونية */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-500" />
              التحاليل الهرمونية
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E2 (pg/mL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.e2_level || ''}
                  onChange={(e) => setFormData({ ...formData, e2_level: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LH (mIU/mL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lh_level || ''}
                  onChange={(e) => setFormData({ ...formData, lh_level: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  P4 (ng/mL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.p4_level || ''}
                  onChange={(e) => setFormData({ ...formData, p4_level: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  بطانة الرحم (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.endometrium_thickness || ''}
                  onChange={(e) => setFormData({ ...formData, endometrium_thickness: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* الحويصلات */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              الحويصلات (mm)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* المبيض الأيمن */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-bold text-purple-900 mb-3">المبيض الأيمن</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    step="0.1"
                    value={follicleInput.right}
                    onChange={(e) => setFollicleInput({ ...follicleInput, right: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFollicleAdd('right', follicleInput.right);
                      }
                    }}
                    className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="أدخل الحجم"
                  />
                  <button
                    type="button"
                    onClick={() => handleFollicleAdd('right', follicleInput.right)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.follicles_right || []).map((size, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-white border-2 border-purple-300 rounded-full flex items-center gap-2 font-mono font-bold text-purple-900"
                    >
                      {size}mm
                      <button
                        type="button"
                        onClick={() => handleFollicleRemove('right', idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* المبيض الأيسر */}
              <div className="border-2 border-pink-200 rounded-lg p-4 bg-pink-50">
                <h4 className="font-bold text-pink-900 mb-3">المبيض الأيسر</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    step="0.1"
                    value={follicleInput.left}
                    onChange={(e) => setFollicleInput({ ...follicleInput, left: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFollicleAdd('left', follicleInput.left);
                      }
                    }}
                    className="flex-1 px-3 py-2 border-2 border-pink-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="أدخل الحجم"
                  />
                  <button
                    type="button"
                    onClick={() => handleFollicleAdd('left', follicleInput.left)}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.follicles_left || []).map((size, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-white border-2 border-pink-300 rounded-full flex items-center gap-2 font-mono font-bold text-pink-900"
                    >
                      {size}mm
                      <button
                        type="button"
                        onClick={() => handleFollicleRemove('left', idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* الأدوية */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-500" />
              الأدوية المعطاة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  FSH (IU)
                </label>
                <input
                  type="number"
                  value={formData.fsh_dose_given || ''}
                  onChange={(e) => setFormData({ ...formData, fsh_dose_given: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  HMG (IU)
                </label>
                <input
                  type="number"
                  value={formData.hmg_dose_given || ''}
                  onChange={(e) => setFormData({ ...formData, hmg_dose_given: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Antagonist
                </label>
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                  <input
                    type="checkbox"
                    checked={formData.antagonist_given || false}
                    onChange={(e) => setFormData({ ...formData, antagonist_given: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>تم إعطاؤه</span>
                </label>
              </div>
            </div>
          </div>

          {/* الملاحظات */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 ml-1" />
              ملاحظات الطبيب
            </label>
            <textarea
              value={formData.doctor_notes || ''}
              onChange={(e) => setFormData({ ...formData, doctor_notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ الزيارة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * رسم بياني لمتابعة التطور
 */
const ProgressChart: React.FC<{ visits: MonitoringVisit[] }> = ({ visits }) => {
  const chartData = visits.map(v => ({
    day: `D${v.stimulation_day}`,
    E2: v.e2_level || 0,
    Lead: v.lead_follicle_size || 0,
    Total: v.total_follicles || 0,
    Endo: v.endometrium_thickness || 0
  }));

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        منحنى التطور
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* E2 & Follicles */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">E2 ومستوى الحويصلات</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="E2" stroke="#8b5cf6" strokeWidth={2} name="E2 (pg/mL)" />
              <Line yAxisId="right" type="monotone" dataKey="Total" stroke="#ec4899" strokeWidth={2} name="عدد الحويصلات" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Follicle & Endometrium Growth */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">نمو الحويصلات والبطانة</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Lead" stroke="#3b82f6" strokeWidth={2} name="أكبر حويصلة (mm)" />
              <Line type="monotone" dataKey="Endo" stroke="#10b981" strokeWidth={2} name="البطانة (mm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SmartStimulationCopilot: React.FC = () => {
  const { patients, isLoading: patientsLoading, searchQuery, setSearchQuery } = usePatients();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [currentCycle, setCurrentCycle] = useState<SmartIVFCycle | null>(null);
  const [visits, setVisits] = useState<MonitoringVisit[]>([]);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load cycle and visits when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientCycle();
    }
  }, [selectedPatient]);

  // Handle URL params for patient selection
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && patients.length > 0 && !selectedPatient) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient as PatientInfo);
      }
    }
  }, [searchParams, patients]);

  const loadPatientCycle = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const cycles = await smartStimulationService.getPatientCycles(selectedPatient.id);

      // Find active stimulation cycle or most recent
      const activeCycle = cycles.find(c => c.status === 'stimulation' || c.status === 'baseline');
      const cycle = activeCycle || cycles[0];

      if (cycle) {
        setCurrentCycle(cycle);
        const cycleVisits = await smartStimulationService.getCycleVisits(cycle.id!);
        setVisits(cycleVisits);
      } else {
        setCurrentCycle(null);
        setVisits([]);
      }
    } catch (error: any) {
      console.error('Error loading cycle:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCycle = async () => {
    if (!selectedPatient) return;

    try {
      const doctor = await dbService.getDoctorIdOrThrow();
      const newCycle: Omit<SmartIVFCycle, 'id'> = {
        patient_id: selectedPatient.id,
        doctor_id: doctor.doctorId,
        cycle_number: 1,
        start_date: new Date().toISOString().split('T')[0],
        status: 'baseline',
        ovarian_phenotype: 'normal_responder',
        protocol_type: 'antagonist',
        initial_fsh_dose: 150,
        ohss_risk_level: 'low'
      };

      const created = await smartStimulationService.createSmartCycle(newCycle);
      setCurrentCycle(created);
      setVisits([]);
      toast.success('تم إنشاء دورة جديدة');
    } catch (error: any) {
      toast.error('خطأ في إنشاء الدورة: ' + error.message);
    }
  };

  const latestVisit = visits.length > 0 ? visits[visits.length - 1] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
              <Brain className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Smart IVF Copilot</h1>
              <p className="text-indigo-100 text-lg">مساعدك الذكي في متابعة رحلة التنشيط</p>
            </div>
          </div>
        </div>

        {/* Patient Search */}
        {!selectedPatient && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" />
              اختر المريضة
            </h2>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المريضة أو رقم الملف..."
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:border-indigo-500 focus:outline-none mb-6"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {patients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient as PatientInfo)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition text-right"
                >
                  <div className="font-bold text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-600">العمر: {patient.age || 'غير محدد'}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient & Cycle Info */}
        {selectedPatient && (
          <>
            <PatientCard patient={selectedPatient} />

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
            ) : currentCycle ? (
              <>
                <CycleSummaryCard
                  cycle={currentCycle}
                  visitCount={visits.length}
                  latestVisit={latestVisit}
                />

                {latestVisit && <AIRecommendationsCard visit={latestVisit} />}

                {visits.length > 0 && <ProgressChart visits={visits} />}

                {/* Add Visit Button */}
                <div className="flex justify-center mb-8">
                  <button
                    onClick={() => setShowAddVisit(true)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition flex items-center gap-3"
                  >
                    <Plus className="w-6 h-6" />
                    إضافة زيارة متابعة جديدة
                  </button>
                </div>

                {/* Visit List */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">سجل الزيارات</h3>
                  <div className="space-y-4">
                    {visits.map((visit, idx) => (
                      <div
                        key={visit.id}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                              زيارة {visit.visit_number}
                            </span>
                            <span className="text-gray-600">{visit.visit_date}</span>
                            <span className="text-gray-500 text-sm">
                              يوم التنشيط: {visit.stimulation_day}
                            </span>
                          </div>
                          {visit.ready_for_trigger && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                              جاهز للتفجير
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">E2:</span>{' '}
                            <span className="font-bold">{visit.e2_level || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">الحويصلات:</span>{' '}
                            <span className="font-bold">{visit.total_follicles || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">الأكبر:</span>{' '}
                            <span className="font-bold">{visit.lead_follicle_size || 0}mm</span>
                          </div>
                          <div>
                            <span className="text-gray-500">البطانة:</span>{' '}
                            <span className="font-bold">{visit.endometrium_thickness || 0}mm</span>
                          </div>
                          <div>
                            <span className="text-gray-500">FSH:</span>{' '}
                            <span className="font-bold">{visit.fsh_dose_given || 0} IU</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔬</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">لا توجد دورة نشطة</h3>
                <p className="text-gray-600 mb-8">ابدأ دورة جديدة لمتابعة التنشيط</p>
                <button
                  onClick={handleCreateNewCycle}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                  إنشاء دورة جديدة
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Visit Modal */}
        {showAddVisit && currentCycle && (
          <AddVisitForm
            cycleId={currentCycle.id!}
            visitCount={visits.length}
            lastVisit={latestVisit}
            onSave={() => {
              setShowAddVisit(false);
              loadPatientCycle();
            }}
            onCancel={() => setShowAddVisit(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SmartStimulationCopilot;
