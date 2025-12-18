import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Microscope,
  BadgeInfo,
} from 'lucide-react';
import { DiagnosticAssessment } from '../../src/types/assessment';
import {
  calculateBMI,
  getBmiWarning,
  getRcogEarlyManagementNote,
  interpretSemenAnalysis,
  PCOSResult,
  SemenInterpretation,
  usePCOSCalculator,
  WHO2021_LIMITS,
} from '../../src/utils/medicalLogic';

const initialAssessment: DiagnosticAssessment = {
  history: {
    age: undefined,
    durationYears: undefined,
    weightKg: undefined,
    heightCm: undefined,
    bmi: undefined,
  },
  female: {
    pcos: {
      cycleRegularity: 'Regular',
      hyperandrogenism: {
        hirsutism: false,
        acne: false,
        biochemical: false,
      },
      ovarianMorphology: {
        afc: undefined,
        ovarianVolume: undefined,
      },
    },
  },
  male: {
    semenAnalysis: {
      volume: undefined,
      concentration: undefined,
      totalMotility: undefined,
      morphology: undefined,
    },
  },
  finalAssessment: {
    notes: '',
  },
};

const toNumber = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

interface AssessmentTabProps {
  onAssessmentChange?: (
    assessment: DiagnosticAssessment,
    derived: {
      bmi: number | null;
      pcos: PCOSResult;
      semen: SemenInterpretation;
      rcogNote: string | null;
      bmiWarning: string | null;
    }
  ) => void;
}

const AssessmentTab: React.FC<AssessmentTabProps> = ({ onAssessmentChange }) => {
  const [assessment, setAssessment] = useState<DiagnosticAssessment>(initialAssessment);
  const [activeTab, setActiveTab] = useState<'history' | 'female' | 'male' | 'final'>('history');

  const bmiValue = useMemo(
    () => calculateBMI(assessment.history.weightKg, assessment.history.heightCm),
    [assessment.history.weightKg, assessment.history.heightCm]
  );

  const pcos = usePCOSCalculator(assessment.female.pcos);
  const semen = useMemo(
    () => interpretSemenAnalysis(assessment.male.semenAnalysis),
    [
      assessment.male.semenAnalysis.concentration,
      assessment.male.semenAnalysis.totalMotility,
      assessment.male.semenAnalysis.morphology,
    ]
  );

  const rcogNote = useMemo(
    () => getRcogEarlyManagementNote(assessment.history.age, assessment.history.durationYears),
    [assessment.history.age, assessment.history.durationYears]
  );
  const bmiWarning = useMemo(() => getBmiWarning(bmiValue), [bmiValue]);

  useEffect(() => {
    if (!onAssessmentChange) return;
    onAssessmentChange(assessment, { bmi: bmiValue, pcos, semen, rcogNote, bmiWarning });
  }, [assessment, bmiValue, bmiWarning, onAssessmentChange, pcos, rcogNote, semen]);

  const summaryItems = useMemo(() => {
    const items: Array<{
      title: string;
      detail: string;
      severity: 'info' | 'warning' | 'critical';
    }> = [];

    if (pcos.highProbability) {
      items.push({
        title: 'High Probability of PCOS',
        detail: `${pcos.criteriaMetCount}/3 Rotterdam criteria met`,
        severity: 'critical',
      });
    }

    if (!semen.isNormal) {
      items.push({
        title: 'Male Factor Flags',
        detail: semen.tags.join(', '),
        severity: 'critical',
      });
    }

    if (rcogNote) {
      items.push({
        title: 'RCOG Timing',
        detail: rcogNote,
        severity: 'warning',
      });
    }

    if (bmiWarning) {
      items.push({
        title: 'BMI Advisory',
        detail: bmiWarning,
        severity: 'warning',
      });
    }

    if (items.length === 0) {
      items.push({
        title: 'No high-risk flags detected',
        detail: 'Continue routine assessment and document findings.',
        severity: 'info',
      });
    }

    return items;
  }, [pcos, semen, rcogNote, bmiWarning]);

  const updateHistory = (updates: Partial<DiagnosticAssessment['history']>) => {
    setAssessment(prev => ({
      ...prev,
      history: { ...prev.history, ...updates },
    }));
  };

  const updatePCOS = (updates: Partial<DiagnosticAssessment['female']['pcos']>) => {
    setAssessment(prev => ({
      ...prev,
      female: {
        ...prev.female,
        pcos: { ...prev.female.pcos, ...updates },
      },
    }));
  };

  const updateHyperandrogenism = (
    key: keyof DiagnosticAssessment['female']['pcos']['hyperandrogenism'],
    value: boolean
  ) => {
    setAssessment(prev => ({
      ...prev,
      female: {
        ...prev.female,
        pcos: {
          ...prev.female.pcos,
          hyperandrogenism: {
            ...prev.female.pcos.hyperandrogenism,
            [key]: value,
          },
        },
      },
    }));
  };

  const updateOvarianMorphology = (
    key: keyof DiagnosticAssessment['female']['pcos']['ovarianMorphology'],
    value?: number
  ) => {
    setAssessment(prev => ({
      ...prev,
      female: {
        ...prev.female,
        pcos: {
          ...prev.female.pcos,
          ovarianMorphology: {
            ...prev.female.pcos.ovarianMorphology,
            [key]: value,
          },
        },
      },
    }));
  };

  const updateSemenAnalysis = (
    key: keyof DiagnosticAssessment['male']['semenAnalysis'],
    value?: number
  ) => {
    setAssessment(prev => ({
      ...prev,
      male: {
        ...prev.male,
        semenAnalysis: {
          ...prev.male.semenAnalysis,
          [key]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-slate-900 p-2 text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Assessment Summary</h2>
            <p className="text-sm text-slate-500">
              Real-time decision support using Rotterdam, WHO 2021, and RCOG guidance.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {summaryItems.map((item, index) => {
            const styles =
              item.severity === 'critical'
                ? 'border-red-200 bg-red-50 text-red-900'
                : item.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900';
            const Icon = item.severity === 'critical' ? AlertTriangle : CheckCircle2;

            return (
              <div
                key={`${item.title}-${index}`}
                className={`rounded-xl border px-4 py-3 ${styles}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm opacity-80">{item.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'history', label: 'History', icon: ClipboardList },
            { id: 'female', label: 'Female Investigation', icon: HeartPulse },
            { id: 'male', label: 'Male Investigation', icon: Microscope },
            { id: 'final', label: 'Final Assessment', icon: BadgeInfo },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                }`}
                type="button"
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'history' && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Infertility Profile</h3>
            <p className="text-sm text-slate-500">Baseline details for RCOG timing logic.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-slate-600">
                Age (years)
                <input
                  type="number"
                  min="18"
                  max="50"
                  value={assessment.history.age ?? ''}
                  onChange={e => updateHistory({ age: toNumber(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-600">
                Duration of infertility (years)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={assessment.history.durationYears ?? ''}
                  onChange={e => updateHistory({ durationYears: toNumber(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-600">
                Weight (kg)
                <input
                  type="number"
                  min="30"
                  step="0.1"
                  value={assessment.history.weightKg ?? ''}
                  onChange={e => updateHistory({ weightKg: toNumber(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-600">
                Height (cm)
                <input
                  type="number"
                  min="120"
                  step="0.1"
                  value={assessment.history.heightCm ?? ''}
                  onChange={e => updateHistory({ heightCm: toNumber(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">BMI Snapshot</h3>
            <p className="text-sm text-slate-500">Auto-calculated from weight and height.</p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-5">
              <p className="text-3xl font-semibold text-slate-900">
                {bmiValue ? bmiValue.toFixed(1) : '--'}
              </p>
              <p className="text-sm text-slate-500">kg/m2</p>
            </div>

            {bmiWarning && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {bmiWarning}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'female' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Rotterdam PCOS Criteria</h3>
                <p className="text-sm text-slate-500">2 of 3 criteria indicates high probability.</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  pcos.highProbability
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {pcos.highProbability ? 'High Probability' : 'Criteria Pending'}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-600">
                Cycle regularity
                <select
                  value={assessment.female.pcos.cycleRegularity}
                  onChange={e => updatePCOS({ cycleRegularity: e.target.value as DiagnosticAssessment['female']['pcos']['cycleRegularity'] })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                >
                  <option value="Regular">Regular</option>
                  <option value="Oligo-ovulation">Oligo-ovulation</option>
                  <option value="Amenorrhea">Amenorrhea</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-600">
                Follicle count (AFC)
                <input
                  type="number"
                  min="0"
                  value={assessment.female.pcos.ovarianMorphology.afc ?? ''}
                  onChange={e => updateOvarianMorphology('afc', toNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-600">
                Ovarian volume (ml)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={assessment.female.pcos.ovarianMorphology.ovarianVolume ?? ''}
                  onChange={e => updateOvarianMorphology('ovarianVolume', toNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Hyperandrogenism</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {[
                  { key: 'hirsutism', label: 'Hirsutism' },
                  { key: 'acne', label: 'Acne' },
                  { key: 'biochemical', label: 'Biochemical (High T/FAI)' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={assessment.female.pcos.hyperandrogenism[item.key as keyof DiagnosticAssessment['female']['pcos']['hyperandrogenism']]}
                      onChange={e =>
                        updateHyperandrogenism(
                          item.key as keyof DiagnosticAssessment['female']['pcos']['hyperandrogenism'],
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Ovulatory Dysfunction',
                met: pcos.ovulatoryDysfunction,
                detail: assessment.female.pcos.cycleRegularity,
              },
              {
                title: 'Hyperandrogenism',
                met: pcos.hyperandrogenism,
                detail: pcos.hyperandrogenism ? 'Present' : 'Absent',
              },
              {
                title: 'PCO Morphology',
                met: pcos.pcoMorphology,
                detail: 'AFC > 20 or Volume > 10 ml',
              },
            ].map(item => (
              <div
                key={item.title}
                className={`rounded-xl border px-4 py-4 ${
                  item.met ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.met ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                </div>
                <p className="mt-2 text-xs text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'male' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">WHO 2021 Semen Analysis</h3>
                <p className="text-sm text-slate-500">Lower reference limits are applied instantly.</p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {semen.isNormal ? 'Normozoospermia' : 'Abnormal'}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-600">
                Volume (ml)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={assessment.male.semenAnalysis.volume ?? ''}
                  onChange={e => updateSemenAnalysis('volume', toNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-600">
                Concentration (M/ml)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={assessment.male.semenAnalysis.concentration ?? ''}
                  onChange={e => updateSemenAnalysis('concentration', toNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-600">
                Total motility (%)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={assessment.male.semenAnalysis.totalMotility ?? ''}
                  onChange={e => updateSemenAnalysis('totalMotility', toNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-600">
                Morphology (%)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={assessment.male.semenAnalysis.morphology ?? ''}
                  onChange={e => updateSemenAnalysis('morphology', toNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Auto-interpretation</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {semen.tags.map(tag => (
                  <span
                    key={tag}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      semen.isNormal
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                WHO 2021 LRL: volume {WHO2021_LIMITS.volume} ml, concentration {WHO2021_LIMITS.concentration}{' '}
                M/ml, motility {WHO2021_LIMITS.totalMotility}%, morphology {WHO2021_LIMITS.morphology}%.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'final' && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Clinical Notes</h3>
            <p className="text-sm text-slate-500">Record the working diagnosis and plan.</p>
            <textarea
              rows={8}
              value={assessment.finalAssessment.notes ?? ''}
              onChange={e =>
                setAssessment(prev => ({
                  ...prev,
                  finalAssessment: { ...prev.finalAssessment, notes: e.target.value },
                }))
              }
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Summarize findings, proposed investigations, and plan..."
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Quick Recap</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                BMI: {bmiValue ? bmiValue.toFixed(1) : 'Not calculated'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                PCOS criteria met: {pcos.criteriaMetCount}/3
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Male factor: {semen.tags.join(', ')}
              </li>
              {rcogNote && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {rcogNote}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentTab;
