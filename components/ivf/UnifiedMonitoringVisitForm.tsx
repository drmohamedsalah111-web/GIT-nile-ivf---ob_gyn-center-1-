/**
 * ============================================================================
 * UNIFIED MONITORING VISIT FORM
 * نموذج زيارة المتابعة المتكامل
 * ============================================================================
 * يدخل كل البيانات في سجل واحد: هرمونات + سونار + أدوية + تحاليل
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Activity,
  Pill,
  Beaker,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  Zap,
  Search
} from 'lucide-react';
import smartStimulationService from '../../services/smartStimulationService.unified';
import type {
  AddVisitInput,
  MedicationGiven,
  LabResult,
  MedicationReference,
  LabTestReference,
  EndometriumPattern,
  SmartMonitoringVisit
} from '../../types/smartStimulation.types';
import toast from 'react-hot-toast';

interface UnifiedMonitoringVisitFormProps {
  cycleId: string;
  cycleStartDate: string;
  lastVisit?: SmartMonitoringVisit;
  onSuccess?: (visit: SmartMonitoringVisit) => void;
  onCancel?: () => void;
}

const UnifiedMonitoringVisitForm: React.FC<UnifiedMonitoringVisitFormProps> = ({
  cycleId,
  cycleStartDate,
  lastVisit,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [medicationsRef, setMedicationsRef] = useState<MedicationReference[]>([]);
  const [labTestsRef, setLabTestsRef] = useState<LabTestReference[]>([]);

  // Visit Basic Info
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [cycleDay, setCycleDay] = useState(1);
  const [stimulationDay, setStimulationDay] = useState<number | undefined>();

  // Hormones
  const [e2, setE2] = useState<string>('');
  const [lh, setLh] = useState<string>('');
  const [p4, setP4] = useState<string>('');
  const [fsh, setFsh] = useState<string>('');

  // Ultrasound
  const [endoThickness, setEndoThickness] = useState<string>('');
  const [endoPattern, setEndoPattern] = useState<EndometriumPattern | ''>('');
  const [folliclesRight, setFolliclesRight] = useState<number[]>([]);
  const [folliclesLeft, setFolliclesLeft] = useState<number[]>([]);
  const [newFollicleRight, setNewFollicleRight] = useState('');
  const [newFollicleLeft, setNewFollicleLeft] = useState('');

  // Medications
  const [medications, setMedications] = useState<MedicationGiven[]>([]);
  const [showAddMed, setShowAddMed] = useState(false);

  // Lab Results
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [showAddLab, setShowAddLab] = useState(false);

  // Clinical Notes
  const [doctorNotes, setDoctorNotes] = useState('');

  // Search and Grouping
  const [medSearch, setMedSearch] = useState('');

  useEffect(() => {
    loadReferences();
    calculateCycleDay(visitDate);

    // [Smart Memory] Pre-fill from last visit
    if (lastVisit) {
      if (lastVisit.medications_given && lastVisit.medications_given.length > 0) {
        setMedications(lastVisit.medications_given.map(m => ({
          ...m,
          id: undefined // New record
        })));
      }
      if (lastVisit.endometrium_pattern) setEndoPattern(lastVisit.endometrium_pattern);
      if (lastVisit.endometrium_thickness) setEndoThickness(lastVisit.endometrium_thickness.toString());
      if (lastVisit.doctor_notes) setDoctorNotes(`متابعة من الزيارة السابقة: ${lastVisit.doctor_notes}`);
    }
  }, [lastVisit]);

  useEffect(() => {
    calculateCycleDay(visitDate);
  }, [visitDate, cycleStartDate]);

  const loadReferences = async () => {
    try {
      const [medsResult, labsResult] = await Promise.all([
        smartStimulationService.getMedicationsReference(),
        smartStimulationService.getLabTestsReference()
      ]);

      if (medsResult.data) setMedicationsRef(medsResult.data);
      if (labsResult.data) setLabTestsRef(labsResult.data);
    } catch (error) {
      console.error('Error loading references:', error);
    }
  };

  const calculateCycleDay = (date: string) => {
    const start = new Date(cycleStartDate);
    const current = new Date(date);
    const diffTime = Math.abs(current.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setCycleDay(diffDays + 1);
  };

  const addFollicle = (side: 'right' | 'left', size: string) => {
    const sizeNum = parseFloat(size);
    if (isNaN(sizeNum) || sizeNum <= 0) return;

    if (side === 'right') {
      setFolliclesRight([...folliclesRight, sizeNum]);
      setNewFollicleRight('');
    } else {
      setFolliclesLeft([...folliclesLeft, sizeNum]);
      setNewFollicleLeft('');
    }
  };

  const removeFollicle = (side: 'right' | 'left', index: number) => {
    if (side === 'right') {
      setFolliclesRight(folliclesRight.filter((_, i) => i !== index));
    } else {
      setFolliclesLeft(folliclesLeft.filter((_, i) => i !== index));
    }
  };

  const addMedication = (medRef: MedicationReference) => {
    const newMed: MedicationGiven = {
      medication_id: medRef.id,
      medication_name: medRef.medication_name,
      medication_name_ar: medRef.medication_name_ar,
      medication_type: medRef.medication_type,
      dose: parseFloat(medRef.typical_starting_dose || '0') || 0,
      unit: medRef.unit,
      route: medRef.route[0] || 'SC',
      notes: medRef.timing_instructions // Pre-fill with Arabic instructions
    };
    setMedications([...medications, newMed]);
    setShowAddMed(false);
  };

  const updateMedication = (index: number, field: keyof MedicationGiven, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addLabResult = (testRef: LabTestReference) => {
    const newLab: LabResult = {
      test_id: testRef.id,
      test_name: testRef.test_name,
      test_name_ar: testRef.test_name_ar,
      result_value: 0,
      unit: testRef.unit,
      reference_min: testRef.reference_range_min,
      reference_max: testRef.reference_range_max
    };
    setLabResults([...labResults, newLab]);
    setShowAddLab(false);
  };

  const updateLabResult = (index: number, field: keyof LabResult, value: any) => {
    const updated = [...labResults];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-determine if normal
    if (field === 'result_value' && updated[index].reference_min && updated[index].reference_max) {
      const val = parseFloat(value);
      updated[index].is_normal =
        val >= (updated[index].reference_min || 0) &&
        val <= (updated[index].reference_max || Infinity);
    }

    setLabResults(updated);
  };

  const removeLabResult = (index: number) => {
    setLabResults(labResults.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const visitData: AddVisitInput = {
        cycle_id: cycleId,
        visit_date: visitDate,
        cycle_day: cycleDay,
        stimulation_day: stimulationDay,

        // Hormones
        e2_level: e2 ? parseFloat(e2) : undefined,
        lh_level: lh ? parseFloat(lh) : undefined,
        p4_level: p4 ? parseFloat(p4) : undefined,

        // Ultrasound
        endometrium_thickness: endoThickness ? parseFloat(endoThickness) : undefined,
        endometrium_pattern: endoPattern || undefined,
        follicles_right: folliclesRight,
        follicles_left: folliclesLeft,

        // ✅ UNIFIED: Medications integrated
        medications_given: medications,

        // Calculate legacy summary fields for reporting
        fsh_dose_given: medications
          .filter(m => m.medication_type === 'gonadotropin_fsh')
          .reduce((sum, m) => sum + (m.dose || 0), 0),
        hmg_dose_given: medications
          .filter(m => m.medication_type === 'gonadotropin_hmg')
          .reduce((sum, m) => sum + (m.dose || 0), 0),

        // ✅ UNIFIED: Lab results integrated
        lab_results: labResults,

        // Clinical notes
        doctor_notes: doctorNotes || undefined
      };

      const { data, error } = await smartStimulationService.addVisit(visitData);

      if (error) throw error;

      toast.success('تم حفظ الزيارة بنجاح ✓');

      if (onSuccess && data) {
        onSuccess(data);
      }
    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error('فشل حفظ الزيارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">زيارة متابعة متكاملة</h2>
              <p className="text-teal-100">هرمونات + سونار + أدوية + تحاليل في سجل واحد</p>
            </div>
          </div>
          {lastVisit && (
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Smart Memory Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          معلومات الزيارة الأساسية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              تاريخ الزيارة
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              يوم الدورة (Day)
            </label>
            <input
              type="number"
              value={cycleDay}
              onChange={(e) => setCycleDay(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              يوم التنشيط (Stim Day)
            </label>
            <input
              type="number"
              value={stimulationDay || ''}
              onChange={(e) => setStimulationDay(parseInt(e.target.value) || undefined)}
              placeholder="اختياري"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Hormones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-pink-600" />
          الهرمونات
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">E2 (pg/mL)</label>
            <input
              type="number"
              step="0.01"
              value={e2}
              onChange={(e) => setE2(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500"
              placeholder="مثال: 1500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">LH (mIU/mL)</label>
            <input
              type="number"
              step="0.01"
              value={lh}
              onChange={(e) => setLh(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500"
              placeholder="مثال: 5.2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">P4 (ng/mL)</label>
            <input
              type="number"
              step="0.01"
              value={p4}
              onChange={(e) => setP4(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500"
              placeholder="مثال: 0.8"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">FSH (mIU/mL)</label>
            <input
              type="number"
              step="0.01"
              value={fsh}
              onChange={(e) => setFsh(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500"
              placeholder="اختياري"
            />
          </div>
        </div>
      </div>

      {/* Ultrasound */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          السونار
        </h3>

        {/* Endometrium */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-3">بطانة الرحم</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                السُمك (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={endoThickness}
                onChange={(e) => setEndoThickness(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
                placeholder="مثال: 9.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                النمط (Pattern)
              </label>
              <select
                value={endoPattern}
                onChange={(e) => setEndoPattern(e.target.value as EndometriumPattern)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
              >
                <option value="">-- اختر --</option>
                <option value="trilaminar">Trilaminar (ثلاثي الطبقات)</option>
                <option value="homogeneous">Homogeneous (متجانس)</option>
                <option value="hyperechoic">Hyperechoic (عالي الصدى)</option>
                <option value="irregular">Irregular (غير منتظم)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Follicles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Right Ovary */}
          <div className="border-2 border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">المبيض الأيمن (Right)</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                step="0.1"
                value={newFollicleRight}
                onChange={(e) => setNewFollicleRight(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addFollicle('right', newFollicleRight);
                  }
                }}
                placeholder="حجم الحويصلة (mm)"
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
              />
              <button
                onClick={() => addFollicle('right', newFollicleRight)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {folliclesRight.sort((a, b) => a - b).map((size, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-purple-100 text-purple-900 px-3 py-1 rounded-full font-semibold"
                >
                  {size} mm
                  <button
                    onClick={() => removeFollicle('right', idx)}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-purple-700">
              العدد: <span className="font-bold">{folliclesRight.length}</span>
            </div>
          </div>

          {/* Left Ovary */}
          <div className="border-2 border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">المبيض الأيسر (Left)</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                step="0.1"
                value={newFollicleLeft}
                onChange={(e) => setNewFollicleLeft(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addFollicle('left', newFollicleLeft);
                  }
                }}
                placeholder="حجم الحويصلة (mm)"
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
              />
              <button
                onClick={() => addFollicle('left', newFollicleLeft)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {folliclesLeft.sort((a, b) => a - b).map((size, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full font-semibold"
                >
                  {size} mm
                  <button
                    onClick={() => removeFollicle('left', idx)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-indigo-700">
              العدد: <span className="font-bold">{folliclesLeft.length}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-purple-50 rounded-lg p-3">
          <div className="font-semibold text-purple-900">
            إجمالي الحويصلات: {folliclesRight.length + folliclesLeft.length}
          </div>
        </div>
      </div>

      {/* ✅ Medications (INTEGRATED) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            الأدوية المعطاة
          </h3>
          <button
            onClick={() => setShowAddMed(!showAddMed)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة دواء
          </button>
        </div>

        {showAddMed && (
          <div className="mb-4 bg-gray-50 border-2 border-blue-100 rounded-xl p-4 shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                اختر الدواء المطلوب
              </h4>
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="بحث باسم الدواء (Gonal, Menopur...)"
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-0 text-sm"
                />
              </div>
            </div>

            <div className="space-y-6 max-h-[400px] overflow-y-auto px-1">
              {['gonadotropin_fsh', 'gonadotropin_hmg', 'gnrh_agonist', 'gnrh_antagonist', 'trigger_hcg', 'trigger_gnrh', 'progesterone', 'estrogen', 'other'].map(type => {
                const medsInGroup = medicationsRef.filter(m =>
                  m.medication_type === type &&
                  (m.medication_name.toLowerCase().includes(medSearch.toLowerCase()) ||
                    m.medication_name_ar.includes(medSearch))
                );

                if (medsInGroup.length === 0) return null;

                const getTypeName = (t: string) => {
                  switch (t) {
                    case 'gonadotropin_fsh': return 'أدوية تنشيط (FSH)';
                    case 'gonadotropin_hmg': return 'أدوية تنشيط (HMG)';
                    case 'gnrh_agonist': return 'منبهات (Agonist)';
                    case 'gnrh_antagonist': return 'مضادات (Antagonist)';
                    case 'trigger_hcg': return 'حقن تفجيرية (hCG)';
                    case 'trigger_gnrh': return 'حقن تفجيرية (Agonist)';
                    case 'progesterone': return 'دعم بروجسترون';
                    case 'estrogen': return 'دعم استروجين';
                    default: return 'أدوية إضافية';
                  }
                };

                return (
                  <div key={type} className="space-y-2">
                    <h5 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-1">
                      {getTypeName(type)}
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {medsInGroup.map((med) => (
                        <button
                          key={med.id}
                          onClick={() => {
                            addMedication(med);
                            setMedSearch('');
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center group shadow-sm hover:shadow-md"
                        >
                          <div className="text-[13px] font-bold text-gray-800 group-hover:text-blue-700 leading-tight mb-1">
                            {med.medication_name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium">
                            {med.medication_name_ar}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {medications.length > 0 ? (
          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div key={idx} className="bg-white border-2 border-blue-50 rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xl font-black text-gray-900">{med.medication_name_ar || med.medication_name}</div>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {med.medication_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-blue-600 font-mono">{med.medication_name}</div>
                  </div>
                  <button
                    onClick={() => removeMedication(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">الجرعة (Dose)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={med.dose}
                        onChange={(e) => updateMedication(idx, 'dose', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 font-bold text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">الوحدة (Unit)</label>
                    <input
                      type="text"
                      value={med.unit}
                      onChange={(e) => updateMedication(idx, 'unit', e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 font-bold text-gray-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">طريقة الإعطاء (Route)</label>
                    <select
                      value={med.route}
                      onChange={(e) => updateMedication(idx, 'route', e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 font-bold text-gray-700"
                    >
                      <option value="SC">SC (تحت الجلد)</option>
                      <option value="IM">IM (حقن عضلي)</option>
                      <option value="PO">PO (بالفم)</option>
                      <option value="PV">PV (لبوس مهبلي)</option>
                      <option value="PR">PR (لبوس شرجي)</option>
                    </select>
                  </div>
                </div>

                {/* Instructions / Notes in Arabic */}
                <div className="mt-4 space-y-1.5">
                  <label className="text-[11px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    تعليمات الاستخدام في الروشتة (Usage)
                  </label>
                  <textarea
                    value={med.notes || ''}
                    onChange={(e) => updateMedication(idx, 'notes', e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50/30 border-2 border-blue-100/50 rounded-xl text-sm text-gray-800 focus:bg-white focus:border-blue-400 transition-all font-medium"
                    rows={2}
                    placeholder="مثال: يتم الحقن في تمام الساعة ٩ مساءً..."
                  />
                  <div className="text-[10px] text-blue-400 italic">هذا النص سيظهر في روشتة المريضة باللغة العربية.</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            <Pill className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            لم يتم إضافة أدوية
          </div>
        )}
      </div>

      {/* ✅ Lab Results (INTEGRATED) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-green-600" />
            نتائج التحاليل
          </h3>
          <button
            onClick={() => setShowAddLab(!showAddLab)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة تحليل
          </button>
        </div>

        {showAddLab && (
          <div className="mb-4 bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">اختر تحليل:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {labTestsRef.map((test) => (
                <button
                  key={test.id}
                  onClick={() => addLabResult(test)}
                  className="text-right px-4 py-2 bg-white border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="font-semibold">{test.test_name_ar}</div>
                  <div className="text-sm text-gray-600">{test.test_name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {labResults.length > 0 ? (
          <div className="space-y-3">
            {labResults.map((lab, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-green-900">{lab.test_name_ar || lab.test_name}</div>
                    {lab.reference_min && lab.reference_max && (
                      <div className="text-xs text-green-700">
                        المرجع: {lab.reference_min} - {lab.reference_max} {lab.unit}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeLabResult(idx)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">النتيجة</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lab.result_value}
                      onChange={(e) => updateLabResult(idx, 'result_value', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">التفسير</label>
                    <input
                      type="text"
                      value={lab.interpretation || ''}
                      onChange={(e) => updateLabResult(idx, 'interpretation', e.target.value)}
                      placeholder="طبيعي / مرتفع / منخفض"
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>
                {lab.is_normal !== undefined && (
                  <div className={`mt-2 text-xs font-semibold ${lab.is_normal ? 'text-green-700' : 'text-orange-700'}`}>
                    {lab.is_normal ? '✓ ضمن الحدود الطبيعية' : '⚠ خارج الحدود الطبيعية'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            <Beaker className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            لم يتم إضافة تحاليل
          </div>
        )}
      </div>

      {/* Clinical Notes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">ملاحظات الطبيب</h3>
        <textarea
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          rows={4}
          placeholder="أي ملاحظات سريرية أو خطة المتابعة..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              حفظ الزيارة المتكاملة
            </>
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">✅ نظام موحد ومتكامل</p>
            <p>
              كل بيانات الزيارة (هرمونات + سونار + أدوية + تحاليل) يتم حفظها في سجل واحد.
              هذا يسهل الوصول للبيانات ويوفر رؤية شاملة لتطور الدورة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMonitoringVisitForm;
