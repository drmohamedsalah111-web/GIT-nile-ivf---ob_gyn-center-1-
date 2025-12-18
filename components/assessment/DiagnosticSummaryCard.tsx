import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  User,
  Zap,
  TrendingDown,
  Microscope,
} from 'lucide-react';
import { DiagnosticSummary, RiskAlert } from '../../src/types/assessmentTypes';

interface DiagnosticSummaryCardProps {
  summary: DiagnosticSummary;
  onEdit?: () => void;
}

export const DiagnosticSummaryCard: React.FC<DiagnosticSummaryCardProps> = ({
  summary,
  onEdit,
}) => {
  const getAlertIcon = (severity: 'Info' | 'Warning' | 'Critical') => {
    if (severity === 'Critical') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (severity === 'Warning') return <AlertCircle className="w-5 h-5 text-orange-600" />;
    return <CheckCircle className="w-5 h-5 text-blue-600" />;
  };

  const getAlertBgColor = (severity: 'Info' | 'Warning' | 'Critical') => {
    if (severity === 'Critical') return 'bg-red-50 border-red-200';
    if (severity === 'Warning') return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnostic Summary</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(summary.assessmentDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition font-medium"
          >
            Edit Assessment
          </button>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold">Age</p>
            <p className="text-2xl font-bold text-gray-900">{summary.vitals.age}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold">Height</p>
            <p className="text-2xl font-bold text-gray-900">{summary.vitals.height} cm</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold">Weight</p>
            <p className="text-2xl font-bold text-gray-900">{summary.vitals.weight} kg</p>
          </div>
          <div className={`p-3 rounded-lg ${summary.vitals.bmi > 30 ? 'bg-orange-50' : 'bg-green-50'}`}>
            <p className="text-xs font-semibold">BMI</p>
            <p className={`text-2xl font-bold ${summary.vitals.bmi > 30 ? 'text-orange-800' : 'text-green-800'}`}>
              {summary.vitals.bmi.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Infertility History</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 font-semibold">Duration</p>
            <p className="text-lg font-bold text-gray-900">{summary.history.duration} years</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Type</p>
            <p className="text-lg font-bold text-gray-900">{summary.history.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Menstrual Pattern</p>
            <p className="text-lg font-bold text-gray-900">{summary.history.menstrualPattern}</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Key Findings
        </h3>
        <div className="space-y-3">
          {summary.diagnosticFindings.pcos.calculatedDiagnosis && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900">
                🔴 PCOS Diagnosis
                <span className="text-xs ml-2 font-normal">({summary.diagnosticFindings.pcos.criteriaMetCount}/3 Rotterdam criteria met)</span>
              </p>
            </div>
          )}

          {summary.maleFactor.who2021Classification?.diagnosis && summary.maleFactor.who2021Classification.diagnosis !== 'Normal' && (
            <div className={`p-3 rounded-lg border ${summary.maleFactor.icsiIndicated ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`font-semibold ${summary.maleFactor.icsiIndicated ? 'text-red-900' : 'text-orange-900'}`}>
                {summary.maleFactor.icsiIndicated ? '🔴 ICSI Indicated' : '⚠️ Abnormal Semen Analysis'}
                <span className="text-xs ml-2 font-normal">{summary.maleFactor.who2021Classification.diagnosis}</span>
              </p>
            </div>
          )}

          {summary.femaleInvestigation.ovarianReserve.interpretation === 'Poor' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="font-semibold text-orange-900">
                ⚠️ Diminished Ovarian Reserve
                <span className="text-xs ml-2 font-normal">AFC {summary.femaleInvestigation.ovarianReserve.totalAFC}, AMH {summary.femaleInvestigation.ovarianReserve.amh}</span>
              </p>
            </div>
          )}

          {summary.femaleInvestigation.ultrasound.hydrosalpinx && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900">
                🔴 Hydrosalpinx Detected
                <span className="text-xs ml-2 font-normal">Surgical intervention may be needed</span>
              </p>
            </div>
          )}

          {summary.femaleInvestigation.ultrasound.endometriumThickness &&
            summary.femaleInvestigation.ultrasound.endometriumThickness < 7 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-semibold text-orange-900">
                  ⚠️ Thin Endometrium
                  <span className="text-xs ml-2 font-normal">
                    {summary.femaleInvestigation.ultrasound.endometriumThickness}mm (normal: ≥7mm)
                  </span>
                </p>
              </div>
            )}
        </div>
      </div>

      {summary.riskAlerts.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Clinical Alerts ({summary.riskAlerts.length})
          </h3>
          <div className="space-y-2">
            {summary.riskAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-start gap-3 ${getAlertBgColor(alert.severity)}`}
              >
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{alert.message}</p>
                  {alert.action && <p className="text-xs text-gray-700 mt-1">→ {alert.action}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.rcogRecommendations.recommendations.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">RCOG Recommendations</h3>
          <div
            className={`p-4 rounded-lg border-2 mb-4 ${
              summary.rcogRecommendations.urgency === 'Urgent'
                ? 'border-red-300 bg-red-50'
                : summary.rcogRecommendations.urgency === 'Expedited'
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-green-300 bg-green-50'
            }`}
          >
            <p className={`font-bold ${summary.rcogRecommendations.urgency === 'Urgent' ? 'text-red-800' : summary.rcogRecommendations.urgency === 'Expedited' ? 'text-orange-800' : 'text-green-800'}`}>
              Priority: {summary.rcogRecommendations.urgency}
            </p>
            {summary.rcogRecommendations.reasonsForUrgency && (
              <p className="text-xs mt-1">
                Reasons: {summary.rcogRecommendations.reasonsForUrgency.join(', ')}
              </p>
            )}
          </div>

          <ul className="space-y-2">
            {summary.rcogRecommendations.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-800">{rec}</span>
              </li>
            ))}
          </ul>

          {summary.rcogRecommendations.nextSteps && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold text-gray-900 mb-2">Next Steps:</p>
              <ul className="space-y-1 text-sm">
                {summary.rcogRecommendations.nextSteps.tubalTest && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Tubal Testing ({summary.rcogRecommendations.nextSteps.tubalTestType || 'HSG'})
                  </li>
                )}
                {summary.rcogRecommendations.nextSteps.hysteroscopy && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Hysteroscopy
                  </li>
                )}
                {summary.rcogRecommendations.nextSteps.dFSH && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Dynamic FSH Test
                  </li>
                )}
                {summary.rcogRecommendations.nextSteps.maleFactor && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Urological Referral
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {summary.clinicalNotes && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Clinical Notes</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="border-t pt-6 flex gap-3">
        <button onClick={() => window.print()} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
          Print Summary
        </button>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(summary))} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

export default DiagnosticSummaryCard;
