import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import AccordionSection from './AccordionSection';
import { InfertilityHistory } from '../../src/types/assessmentTypes';

interface HistorySectionProps {
  isOpen: boolean;
  onToggle: () => void;
  history: InfertilityHistory;
  onUpdate: (updates: Partial<InfertilityHistory>) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  isOpen,
  onToggle,
  history,
  onUpdate,
}) => {
  return (
    <AccordionSection
      title="Detailed History"
      description="Infertility duration, type, menstrual pattern, and medical history"
      icon="📋"
      isOpen={isOpen}
      onToggle={onToggle}
      alertMessage={history.duration > 2 ? 'Long infertility duration - Expedited workup recommended' : undefined}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Duration of Infertility (years)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={history.duration || ''}
              onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            {history.duration && history.duration >= 1 && (
              <p className="text-xs text-orange-600 mt-1">Tubal testing recommended</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Type of Infertility
            </label>
            <select
              value={history.type || 'Primary'}
              onChange={(e) => onUpdate({ type: e.target.value as 'Primary' | 'Secondary' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Menstrual Pattern
            </label>
            <select
              value={history.menstrualPattern || 'Regular'}
              onChange={(e) =>
                onUpdate({
                  menstrualPattern: e.target.value as
                    | 'Regular'
                    | 'Irregular'
                    | 'Oligomenorrhea'
                    | 'Amenorrhea',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="Regular">Regular</option>
              <option value="Irregular">Irregular</option>
              <option value="Oligomenorrhea">Oligomenorrhea (>35 days)</option>
              <option value="Amenorrhea">Amenorrhea</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Menstrual Cycle Length (days)
            </label>
            <input
              type="number"
              min="14"
              max="120"
              value={history.menstrualCycleLength || ''}
              onChange={(e) => onUpdate({ menstrualCycleLength: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Obstetric History</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gravida</label>
              <input
                type="number"
                min="0"
                value={history.obstetricHistory?.gravida || ''}
                onChange={(e) =>
                  onUpdate({
                    obstetricHistory: {
                      ...history.obstetricHistory,
                      gravida: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parity</label>
              <input
                type="number"
                min="0"
                value={history.obstetricHistory?.parity || ''}
                onChange={(e) =>
                  onUpdate({
                    obstetricHistory: {
                      ...history.obstetricHistory,
                      parity: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miscarriages</label>
              <input
                type="number"
                min="0"
                value={history.obstetricHistory?.miscarriages || ''}
                onChange={(e) =>
                  onUpdate({
                    obstetricHistory: {
                      ...history.obstetricHistory,
                      miscarriages: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Ectopic <input type="checkbox" className="w-4 h-4" />
              </label>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-2">Medical/Surgical History</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.medicalHistory?.includes('Thyroid') || false}
                onChange={(e) => {
                  const updated = [...(history.medicalHistory || [])];
                  if (e.target.checked) {
                    updated.push('Thyroid');
                  } else {
                    const idx = updated.indexOf('Thyroid');
                    if (idx > -1) updated.splice(idx, 1);
                  }
                  onUpdate({ medicalHistory: updated });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Thyroid Disease</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.medicalHistory?.includes('Diabetes') || false}
                onChange={(e) => {
                  const updated = [...(history.medicalHistory || [])];
                  if (e.target.checked) {
                    updated.push('Diabetes');
                  } else {
                    const idx = updated.indexOf('Diabetes');
                    if (idx > -1) updated.splice(idx, 1);
                  }
                  onUpdate({ medicalHistory: updated });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Diabetes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.medicalHistory?.includes('Hypertension') || false}
                onChange={(e) => {
                  const updated = [...(history.medicalHistory || [])];
                  if (e.target.checked) {
                    updated.push('Hypertension');
                  } else {
                    const idx = updated.indexOf('Hypertension');
                    if (idx > -1) updated.splice(idx, 1);
                  }
                  onUpdate({ medicalHistory: updated });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Hypertension</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.surgicalHistory?.includes('Previous_D&C') || false}
                onChange={(e) => {
                  const updated = [...(history.surgicalHistory || [])];
                  if (e.target.checked) {
                    updated.push('Previous_D&C');
                  } else {
                    const idx = updated.indexOf('Previous_D&C');
                    if (idx > -1) updated.splice(idx, 1);
                  }
                  onUpdate({ surgicalHistory: updated });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Previous D&C</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.surgicalHistory?.includes('Appendectomy') || false}
                onChange={(e) => {
                  const updated = [...(history.surgicalHistory || [])];
                  if (e.target.checked) {
                    updated.push('Appendectomy');
                  } else {
                    const idx = updated.indexOf('Appendectomy');
                    if (idx > -1) updated.splice(idx, 1);
                  }
                  onUpdate({ surgicalHistory: updated });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Appendectomy</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-2">Lifestyle Factors</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.lifestyleFactors?.smoking || false}
                onChange={(e) =>
                  onUpdate({
                    lifestyleFactors: {
                      ...history.lifestyleFactors,
                      smoking: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Smoking</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={history.lifestyleFactors?.alcohol || false}
                onChange={(e) =>
                  onUpdate({
                    lifestyleFactors: {
                      ...history.lifestyleFactors,
                      alcohol: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Alcohol Use</span>
            </label>
          </div>
        </div>
      </div>
    </AccordionSection>
  );
};

export default HistorySection;
