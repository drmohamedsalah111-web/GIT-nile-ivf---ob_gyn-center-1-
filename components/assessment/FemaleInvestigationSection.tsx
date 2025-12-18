import React, { useState } from 'react';
import { AlertCircle, TrendingDown } from 'lucide-react';
import AccordionSection from './AccordionSection';
import {
  EndocrineProfile,
  OvarianReserveAssessment,
  UltrasoundFindings,
  PCOSCriteria,
} from '../../src/types/assessmentTypes';
import { usePCOSIndicator } from '../../src/hooks/useSmartDiagnostics';

interface FemaleInvestigationSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  endocrine: EndocrineProfile;
  ovarianReserve: OvarianReserveAssessment;
  ultrasound: UltrasoundFindings;
  pcos: PCOSCriteria;
  onUpdateEndocrine: (updates: Partial<EndocrineProfile>) => void;
  onUpdateOvarian: (updates: Partial<OvarianReserveAssessment>) => void;
  onUpdateUltrasound: (updates: Partial<UltrasoundFindings>) => void;
  onUpdatePCOS: (oligoAnovulation: boolean, clinicalHA: boolean, biochemicalHA: boolean, polycysticUS: boolean) => void;
}

export const FemaleInvestigationSection: React.FC<FemaleInvestigationSectionProps> = ({
  isOpen,
  onToggle,
  endocrine,
  ovarianReserve,
  ultrasound,
  pcos,
  onUpdateEndocrine,
  onUpdateOvarian,
  onUpdateUltrasound,
  onUpdatePCOS,
}) => {
  const [activeTab, setActiveTab] = useState<'endocrine' | 'ovarian' | 'ultrasound' | 'pcos'>('endocrine');
  const pcosIndicator = usePCOSIndicator(pcos);

  const totalAFC = (ovarianReserve.afcRight || 0) + (ovarianReserve.afcLeft || 0);
  const isLowAFC = totalAFC > 0 && totalAFC < 5;

  return (
    <AccordionSection
      title="Female Investigation"
      description="Endocrine profile, ovarian reserve, ultrasound findings, and PCOS assessment"
      icon="👩‍⚕️"
      isOpen={isOpen}
      onToggle={onToggle}
      alertMessage={
        pcosIndicator.isPCOS
          ? `⚠️ ${pcosIndicator.message}`
          : isLowAFC
            ? '⚠️ Low AFC detected - Consider poor ovarian reserve'
            : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex border-b border-gray-200">
          {['endocrine', 'ovarian', 'ultrasound', 'pcos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'endocrine'
                ? 'Hormones'
                : tab === 'ovarian'
                  ? 'Ovarian Reserve'
                  : tab === 'ultrasound'
                    ? 'Ultrasound'
                    : 'PCOS'}
            </button>
          ))}
        </div>

        {activeTab === 'endocrine' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Day 2-3 hormones assess ovarian reserve and baseline endocrine function
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">FSH (Day 2-3) IU/L</label>
                <input
                  type="number"
                  step="0.1"
                  value={endocrine.day2_3_fsh || ''}
                  onChange={(e) => onUpdateEndocrine({ day2_3_fsh: Number(e.target.value) || undefined })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                    (endocrine.day2_3_fsh || 0) > 10 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {(endocrine.day2_3_fsh || 0) > 10 && (
                  <p className="text-xs text-red-600 mt-1">High FSH - Diminished ovarian reserve</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">LH (Day 2-3) IU/L</label>
                <input
                  type="number"
                  step="0.1"
                  value={endocrine.day2_3_lh || ''}
                  onChange={(e) => onUpdateEndocrine({ day2_3_lh: Number(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E2 (Day 2-3) pg/mL</label>
                <input
                  type="number"
                  step="1"
                  value={endocrine.day2_3_e2 || ''}
                  onChange={(e) => onUpdateEndocrine({ day2_3_e2: Number(e.target.value) || undefined })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                    (endocrine.day2_3_e2 || 0) > 80 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                />
                {(endocrine.day2_3_e2 || 0) > 80 && (
                  <p className="text-xs text-orange-600 mt-1">Elevated E2 - Poor responder risk</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prolactin ng/mL</label>
                <input
                  type="number"
                  step="0.1"
                  value={endocrine.prolactin || ''}
                  onChange={(e) => onUpdateEndocrine({ prolactin: Number(e.target.value) || undefined })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                    (endocrine.prolactin || 0) > 25 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">TSH mIU/L</label>
                <input
                  type="number"
                  step="0.1"
                  value={endocrine.tsh || ''}
                  onChange={(e) => onUpdateEndocrine({ tsh: Number(e.target.value) || undefined })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                    (endocrine.tsh || 0) > 2.5 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Testosterone ng/dL</label>
                <input
                  type="number"
                  step="0.1"
                  value={endocrine.totalTestosterone || ''}
                  onChange={(e) =>
                    onUpdateEndocrine({ totalTestosterone: Number(e.target.value) || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ovarian' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">AMH ng/mL</label>
                <input
                  type="number"
                  step="0.1"
                  value={ovarianReserve.amh || ''}
                  onChange={(e) => onUpdateOvarian({ amh: Number(e.target.value) || undefined })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                    ovarianReserve.amh && ovarianReserve.amh < 1 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                />
                {ovarianReserve.amh && ovarianReserve.amh < 1 && (
                  <p className="text-xs text-orange-600 mt-1">Low AMH - Poor ovarian reserve</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">AFC Right</label>
                <input
                  type="number"
                  min="0"
                  value={ovarianReserve.afcRight || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const totalAFC = val + (ovarianReserve.afcLeft || 0);
                    onUpdateOvarian({ afcRight: val, totalAFC });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">AFC Left</label>
                <input
                  type="number"
                  min="0"
                  value={ovarianReserve.afcLeft || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const totalAFC = (ovarianReserve.afcRight || 0) + val;
                    onUpdateOvarian({ afcLeft: val, totalAFC });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {totalAFC > 0 && (
              <div className={`p-3 rounded-lg ${isLowAFC ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-sm font-medium ${isLowAFC ? 'text-orange-800' : 'text-green-800'}`}>
                  Total AFC: {totalAFC} {isLowAFC && '- Low (consider DOR)'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Interpretation</label>
              <select
                value={ovarianReserve.interpretation || 'Unknown'}
                onChange={(e) =>
                  onUpdateOvarian({
                    interpretation: e.target.value as 'Poor' | 'Normal' | 'High' | 'Unknown',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Unknown">Unknown</option>
                <option value="Poor">Poor Responder</option>
                <option value="Normal">Normal</option>
                <option value="High">High Responder (PCOS)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'ultrasound' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Endometrium Thickness (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ultrasound.endometriumThickness || ''}
                  onChange={(e) => onUpdateUltrasound({ endometriumThickness: Number(e.target.value) || undefined })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                    (ultrasound.endometriumThickness || 0) < 7 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                />
                {(ultrasound.endometriumThickness || 0) < 7 && (
                  <p className="text-xs text-orange-600 mt-1">Thin endometrium detected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Endometrium Pattern</label>
                <select
                  value={ultrasound.endometriumPattern || ''}
                  onChange={(e) => onUpdateUltrasound({ endometriumPattern: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  <option value="Trilaminar">Trilaminar</option>
                  <option value="Homogeneous">Homogeneous</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Uterine Pathology</h4>
              <div className="space-y-2">
                {(['fibroids', 'polyps', 'adhesions', 'septate'] as const).map(pathology => (
                  <label key={pathology} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ultrasound.uterinePathology?.[pathology] || false}
                      onChange={(e) =>
                        onUpdateUltrasound({
                          uterinePathology: {
                            ...ultrasound.uterinePathology,
                            [pathology]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 capitalize">{pathology}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tubal Assessment</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ultrasound.tubalAssessment?.hsgDone || false}
                    onChange={(e) =>
                      onUpdateUltrasound({
                        tubalAssessment: {
                          ...ultrasound.tubalAssessment,
                          hsgDone: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">HSG Done</span>
                </label>

                {ultrasound.tubalAssessment?.hsgDone && (
                  <select
                    value={ultrasound.tubalAssessment?.hsgFindings || ''}
                    onChange={(e) =>
                      onUpdateUltrasound({
                        tubalAssessment: {
                          ...ultrasound.tubalAssessment,
                          hsgFindings: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select HSG Result</option>
                    <option value="Patent">Patent</option>
                    <option value="Patency_Disputed">Patency Disputed</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Hydrosalpinx">Hydrosalpinx</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pcos' && (
          <div className={`space-y-4 p-4 rounded-lg ${pcosIndicator.backgroundColor} border ${pcosIndicator.severityColor}`}>
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className={`text-sm font-semibold ${pcosIndicator.severityColor}`}>
                {pcosIndicator.message}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                2 out of 3 Rotterdam criteria required for diagnosis
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded border border-gray-200">
                <input
                  type="checkbox"
                  checked={pcos.oligoAnovulation}
                  onChange={(e) =>
                    onUpdatePCOS(
                      e.target.checked,
                      pcos.clinicalHyperandrogenism,
                      pcos.biochemicalHyperandrogenism,
                      pcos.polycysticOvariesUS
                    )
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Oligo/Anovulation (Irregular cycles or Amenorrhea)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded border border-gray-200">
                <input
                  type="checkbox"
                  checked={pcos.clinicalHyperandrogenism}
                  onChange={(e) =>
                    onUpdatePCOS(
                      pcos.oligoAnovulation,
                      e.target.checked,
                      pcos.biochemicalHyperandrogenism,
                      pcos.polycysticOvariesUS
                    )
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Clinical Hyperandrogenism (Hirsutism, Acne, Alopecia)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded border border-gray-200">
                <input
                  type="checkbox"
                  checked={pcos.biochemicalHyperandrogenism}
                  onChange={(e) =>
                    onUpdatePCOS(
                      pcos.oligoAnovulation,
                      pcos.clinicalHyperandrogenism,
                      e.target.checked,
                      pcos.polycysticOvariesUS
                    )
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Biochemical Hyperandrogenism (Elevated Testosterone)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded border border-gray-200">
                <input
                  type="checkbox"
                  checked={pcos.polycysticOvariesUS}
                  onChange={(e) =>
                    onUpdatePCOS(
                      pcos.oligoAnovulation,
                      pcos.clinicalHyperandrogenism,
                      pcos.biochemicalHyperandrogenism,
                      e.target.checked
                    )
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Polycystic Ovaries on Ultrasound (AFC ≥20 or volume &gt;10 mL per ovary)
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </AccordionSection>
  );
};

export default FemaleInvestigationSection;
