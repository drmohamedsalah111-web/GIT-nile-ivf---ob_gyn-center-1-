import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AccordionSection from './AccordionSection';
import { MaleFactor } from '../../src/types/assessmentTypes';
import { calculateTMSC } from '../../src/utils/clinicalCalculations';
import { useMaleFactorIndicator } from '../../src/hooks/useSmartDiagnostics';

interface MaleFactorSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  maleFactor: MaleFactor;
  onUpdate: (updates: Partial<MaleFactor>) => void;
}

export const MaleFactorSection: React.FC<MaleFactorSectionProps> = ({
  isOpen,
  onToggle,
  maleFactor,
  onUpdate,
}) => {
  const indicator = useMaleFactorIndicator({
    classification: maleFactor.who2021Classification?.diagnosis || 'Normal',
    icsiIndicated: maleFactor.icsiIndicated,
  });

  const tmscResult = calculateTMSC(
    maleFactor.semenAnalysis?.volume,
    maleFactor.semenAnalysis?.concentration,
    maleFactor.semenAnalysis?.motility_PR
  );

  return (
    <AccordionSection
      title="Male Factor Assessment"
      description="WHO 2021 semen analysis with automatic classification and ICSI indication"
      icon="👨‍⚕️"
      isOpen={isOpen}
      onToggle={onToggle}
      alertMessage={
        indicator.requiresICJSI
          ? '🔴 ICSI strongly indicated based on semen parameters'
          : indicator.isAbnormal
            ? '⚠️ Abnormal semen analysis - May require intervention'
            : undefined
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Enter WHO 2021 parameters. The system will automatically classify findings and
            recommend ICSI if indicated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Volume (mL)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={maleFactor.semenAnalysis?.volume || ''}
              onChange={(e) =>
                onUpdate({
                  semenAnalysis: {
                    ...maleFactor.semenAnalysis,
                    volume: Number(e.target.value) || undefined,
                  },
                })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                (maleFactor.semenAnalysis?.volume || 0) < 1.4 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
              }`}
              placeholder="Normal: ≥1.4"
            />
            <p className="text-xs text-gray-500 mt-1">Reference: ≥1.4 mL</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Concentration (M/mL)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={maleFactor.semenAnalysis?.concentration || ''}
              onChange={(e) =>
                onUpdate({
                  semenAnalysis: {
                    ...maleFactor.semenAnalysis,
                    concentration: Number(e.target.value) || undefined,
                  },
                })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                (maleFactor.semenAnalysis?.concentration || 0) < 16 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Normal: ≥16"
            />
            <p className="text-xs text-gray-500 mt-1">Reference: ≥16 million/mL (Oligozoospermia if &lt;16)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">PR Motility (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={maleFactor.semenAnalysis?.motility_PR || ''}
              onChange={(e) =>
                onUpdate({
                  semenAnalysis: {
                    ...maleFactor.semenAnalysis,
                    motility_PR: Number(e.target.value) || undefined,
                  },
                })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                (maleFactor.semenAnalysis?.motility_PR || 0) < 42 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Normal: ≥42%"
            />
            <p className="text-xs text-gray-500 mt-1">Reference: ≥42% (Progressive + Non-progressive)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">NP Motility (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={maleFactor.semenAnalysis?.motility_NP || ''}
              onChange={(e) =>
                onUpdate({
                  semenAnalysis: {
                    ...maleFactor.semenAnalysis,
                    motility_NP: Number(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Non-progressive"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Morphology (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={maleFactor.semenAnalysis?.morphology || ''}
              onChange={(e) =>
                onUpdate({
                  semenAnalysis: {
                    ...maleFactor.semenAnalysis,
                    morphology: Number(e.target.value) || undefined,
                  },
                })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                (maleFactor.semenAnalysis?.morphology || 0) < 4 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Normal: ≥4%"
            />
            <p className="text-xs text-gray-500 mt-1">Reference: ≥4% (Strict Kruger)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">pH</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={maleFactor.semenAnalysis?.pH || ''}
              onChange={(e) =>
                onUpdate({
                  semenAnalysis: {
                    ...maleFactor.semenAnalysis,
                    pH: Number(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Normal: ≥7.2"
            />
          </div>
        </div>

        {tmscResult.tmsc > 0 && (
          <div
            className={`p-4 rounded-lg border ${
              tmscResult.tmsc < 5
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-300'
            }`}
          >
            <p className={`font-semibold ${tmscResult.tmsc < 5 ? 'text-red-800' : 'text-green-800'}`}>
              Total Motile Sperm Count (TMSC): {tmscResult.tmsc.toFixed(2)} million
            </p>
            <p className={`text-sm mt-1 ${tmscResult.tmsc < 5 ? 'text-red-700' : 'text-green-700'}`}>
              {tmscResult.interpretation}
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">WHO 2021 Classification</h4>

          {maleFactor.who2021Classification && (
            <div className={`p-4 rounded-lg border-2 ${
              indicator.requiresICJSI
                ? 'bg-red-50 border-red-300'
                : indicator.isAbnormal
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{indicator.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold ${indicator.color}`}>
                    {maleFactor.who2021Classification.diagnosis}
                  </p>

                  {maleFactor.who2021Classification.oligozoospermia && (
                    <p className="text-sm text-gray-700 mt-1">
                      ✓ Oligozoospermia (Concentration &lt;16 M/mL)
                    </p>
                  )}
                  {maleFactor.who2021Classification.asthenozoospermia && (
                    <p className="text-sm text-gray-700">
                      ✓ Asthenozoospermia (Motility &lt;42%)
                    </p>
                  )}
                  {maleFactor.who2021Classification.teratozoospermia && (
                    <p className="text-sm text-gray-700">
                      ✓ Teratozoospermia (Morphology &lt;4%)
                    </p>
                  )}

                  {maleFactor.icsiIndicated && (
                    <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                      <p className="text-sm font-semibold text-red-800">
                        🔴 ICSI Strongly Indicated
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!maleFactor.who2021Classification && (
            <p className="text-sm text-gray-500 italic">
              Enter semen parameters above - classification will appear here automatically
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={maleFactor.icsiIndicated}
              onChange={(e) => onUpdate({ icsiIndicated: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold text-gray-700">
              ICSI Indicated (even if auto-classified as not needed)
            </span>
          </label>

          {maleFactor.icsiIndicated && (
            <input
              type="text"
              placeholder="Reason for ICSI (e.g., Previous fertilization failure, prior surgery)"
              value={maleFactor.icsiReason || ''}
              onChange={(e) => onUpdate({ icsiReason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes</label>
          <textarea
            value={maleFactor.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="e.g., Varicocele present, Leukocytospermia, Previous infections..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>
      </div>
    </AccordionSection>
  );
};

export default MaleFactorSection;
