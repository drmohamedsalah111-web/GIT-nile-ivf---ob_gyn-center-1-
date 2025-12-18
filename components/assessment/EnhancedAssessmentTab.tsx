import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Save, AlertTriangle } from 'lucide-react';
import AccordionSection from './AccordionSection';
import HistorySection from './HistorySection';
import FemaleInvestigationSection from './FemaleInvestigationSection';
import MaleFactorSection from './MaleFactorSection';
import { useSmartDiagnostics, useBMIIndicator } from '../../src/hooks/useSmartDiagnostics';
import { AssessmentFormState, InfertilityHistory } from '../../src/types/assessmentTypes';
import toast from 'react-hot-toast';

interface EnhancedAssessmentTabProps {
  patientId: string;
  onSave?: (assessment: AssessmentFormState) => void;
}

export const EnhancedAssessmentTab: React.FC<EnhancedAssessmentTabProps> = ({
  patientId,
  onSave,
}) => {
  const [formState, setFormState] = useState<AssessmentFormState>({
    history: {
      duration: 0,
      type: 'Primary',
      menstrualPattern: 'Regular',
      medicalHistory: [],
      surgicalHistory: [],
      lifestyleFactors: { smoking: false, alcohol: false, exercise: 'Moderate', stress: 'Moderate' },
    },
    vitals: { age: 0, weight: 0, height: 0 },
    femaleEndocrine: {},
    femaleOvarian: { interpretation: 'Unknown' },
    femaleUltrasound: { uterinePathology: {}, ovarianPathology: {}, tubalAssessment: {} },
    maleFactor: { semenAnalysis: {}, who2021Classification: { diagnosis: '' }, icsiIndicated: false },
  });

  const [openSections, setOpenSections] = useState({
    history: true,
    female: true,
    male: true,
    vitals: true,
  });

  const diagnostics = useSmartDiagnostics();
  const bmiIndicator = useBMIIndicator(
    (formState.vitals?.weight || 0) / ((formState.vitals?.height || 1) / 100) ** 2,
    formState.vitals?.weight,
    formState.vitals?.height
  );

  const handleHistoryUpdate = useCallback((updates: Partial<InfertilityHistory>) => {
    setFormState(prev => ({
      ...prev,
      history: { ...prev.history, ...updates },
    }));
  }, []);

  const handleVitalsUpdate = useCallback((age?: number, weight?: number, height?: number) => {
    setFormState(prev => ({
      ...prev,
      vitals: {
        age: age ?? prev.vitals.age,
        weight: weight ?? prev.vitals.weight,
        height: height ?? prev.vitals.height,
      },
    }));
    diagnostics.updateVitals(weight, height, age);
  }, [diagnostics]);

  const handleFemaleEndocrineUpdate = useCallback((updates: any) => {
    setFormState(prev => ({
      ...prev,
      femaleEndocrine: { ...prev.femaleEndocrine, ...updates },
    }));
    diagnostics.updateEndocrine({ ...formState.femaleEndocrine, ...updates });
  }, [diagnostics, formState.femaleEndocrine]);

  const handleFemaleOvarianUpdate = useCallback((updates: any) => {
    setFormState(prev => ({
      ...prev,
      femaleOvarian: { ...prev.femaleOvarian, ...updates },
    }));
  }, []);

  const handleFemaleUltrasoundUpdate = useCallback((updates: any) => {
    setFormState(prev => ({
      ...prev,
      femaleUltrasound: { ...prev.femaleUltrasound, ...updates },
    }));
  }, []);

  const handleMaleFactorUpdate = useCallback(
    (updates: any) => {
      setFormState(prev => ({
        ...prev,
        maleFactor: { ...prev.maleFactor, ...updates },
      }));

      const sa = { ...formState.maleFactor.semenAnalysis, ...updates.semenAnalysis };
      diagnostics.updateMaleFactor(sa.volume, sa.concentration, sa.totalCount, sa.motility_PR, sa.morphology);
    },
    [diagnostics, formState.maleFactor]
  );

  const handlePCOSUpdate = useCallback(
    (oligoAnovulation: boolean, clinicalHA: boolean, biochemicalHA: boolean, polycysticUS: boolean) => {
      setFormState(prev => ({
        ...prev,
        femaleOvarian: {
          ...prev.femaleOvarian,
        },
      }));
      diagnostics.updatePCOS(oligoAnovulation, clinicalHA, biochemicalHA, polycysticUS);
    },
    [diagnostics]
  );

  const handleSaveAssessment = useCallback(async () => {
    try {
      diagnostics.generateAlerts(
        formState.vitals.age,
        formState.history.duration,
        formState.femaleUltrasound.tubalAssessment?.hsgFindings === 'Blocked' ||
          formState.femaleUltrasound.tubalAssessment?.hsgFindings === 'Hydrosalpinx' ||
          formState.femaleUltrasound.hydrosalpinx ||
          false,
        formState.femaleOvarian.interpretation === 'Poor'
      );

      diagnostics.generateRecommendations(
        formState.vitals.age,
        formState.history.duration,
        diagnostics.state.maleFactor.classification !== 'Normal',
        formState.femaleOvarian.totalAFC || 0
      );

      if (onSave) {
        onSave(formState);
      }

      toast.success('Assessment saved successfully');
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    }
  }, [formState, diagnostics, onSave]);

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Intelligent Diagnostic & Clinical Decision Support</h2>
        <p className="text-teal-100 text-sm">
          All fields update in real-time with Rotterdam ESHRE & RCOG guideline-based logic
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border-2 ${bmiIndicator.backgroundColor} border ${bmiIndicator.color}`}>
          <p className="text-sm font-semibold">{bmiIndicator.message}</p>
          {bmiIndicator.recommendation && (
            <p className="text-xs mt-1">{bmiIndicator.recommendation}</p>
          )}
        </div>

        <div className={`p-4 rounded-lg border-2 ${diagnostics.state.pcos.calculatedDiagnosis ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <p className={`text-sm font-semibold ${diagnostics.state.pcos.calculatedDiagnosis ? 'text-red-800' : 'text-green-800'}`}>
            {diagnostics.state.pcos.calculatedDiagnosis
              ? `🔴 PCOS (${diagnostics.state.pcos.criteriaMetCount}/3 criteria)`
              : `✅ PCOS: ${diagnostics.state.pcos.criteriaMetCount}/3 criteria`}
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 ${diagnostics.state.maleFactor.icsiIndicated ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <p className={`text-sm font-semibold ${diagnostics.state.maleFactor.icsiIndicated ? 'text-red-800' : 'text-green-800'}`}>
            {diagnostics.state.maleFactor.icsiIndicated
              ? '🔴 ICSI Indicated'
              : `✅ ${diagnostics.state.maleFactor.classification}`}
          </p>
        </div>
      </div>

      <AccordionSection
        title="Vitals & Baseline"
        description="Age, weight, height for BMI calculation"
        icon="📏"
        isOpen={openSections.vitals}
        onToggle={() => setOpenSections(prev => ({ ...prev, vitals: !prev.vitals }))}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Age (years)</label>
            <input
              type="number"
              min="18"
              max="50"
              value={formState.vitals.age || ''}
              onChange={(e) => handleVitalsUpdate(Number(e.target.value), formState.vitals.weight, formState.vitals.height)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                (formState.vitals.age || 0) > 40 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
              }`}
            />
            {(formState.vitals.age || 0) > 40 && (
              <p className="text-xs text-orange-600 mt-1">Advanced maternal age</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="200"
              value={formState.vitals.weight || ''}
              onChange={(e) => handleVitalsUpdate(formState.vitals.age, Number(e.target.value), formState.vitals.height)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              min="140"
              max="210"
              value={formState.vitals.height || ''}
              onChange={(e) => handleVitalsUpdate(formState.vitals.age, formState.vitals.weight, Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">BMI</label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <p className="font-semibold">{((formState.vitals.weight || 0) / ((formState.vitals.height || 1) / 100) ** 2).toFixed(1)}</p>
            </div>
          </div>
        </div>
      </AccordionSection>

      <HistorySection
        isOpen={openSections.history}
        onToggle={() => setOpenSections(prev => ({ ...prev, history: !prev.history }))}
        history={formState.history}
        onUpdate={handleHistoryUpdate}
      />

      <FemaleInvestigationSection
        isOpen={openSections.female}
        onToggle={() => setOpenSections(prev => ({ ...prev, female: !prev.female }))}
        endocrine={formState.femaleEndocrine}
        ovarianReserve={formState.femaleOvarian}
        ultrasound={formState.femaleUltrasound}
        pcos={diagnostics.state.pcos}
        onUpdateEndocrine={handleFemaleEndocrineUpdate}
        onUpdateOvarian={handleFemaleOvarianUpdate}
        onUpdateUltrasound={handleFemaleUltrasoundUpdate}
        onUpdatePCOS={handlePCOSUpdate}
      />

      <MaleFactorSection
        isOpen={openSections.male}
        onToggle={() => setOpenSections(prev => ({ ...prev, male: !prev.male }))}
        maleFactor={formState.maleFactor}
        onUpdate={handleMaleFactorUpdate}
      />

      {diagnostics.state.riskAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-900">Clinical Alerts</h3>
          {diagnostics.state.riskAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'Critical'
                  ? 'bg-red-50 border-red-400'
                  : alert.severity === 'Warning'
                    ? 'bg-orange-50 border-orange-400'
                    : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.severity === 'Critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : alert.severity === 'Warning' ? (
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{alert.message}</p>
                  {alert.action && <p className="text-sm text-gray-700 mt-1">→ {alert.action}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {diagnostics.state.rcogRecommendations.recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-900">RCOG Recommendations</h3>
          <div className={`p-4 rounded-lg border-2 ${diagnostics.state.rcogRecommendations.urgency === 'Urgent' ? 'border-red-300 bg-red-50' : diagnostics.state.rcogRecommendations.urgency === 'Expedited' ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
            <p className={`font-semibold ${diagnostics.state.rcogRecommendations.urgency === 'Urgent' ? 'text-red-800' : diagnostics.state.rcogRecommendations.urgency === 'Expedited' ? 'text-orange-800' : 'text-green-800'}`}>
              Urgency: {diagnostics.state.rcogRecommendations.urgency}
            </p>
          </div>

          <ul className="space-y-2">
            {diagnostics.state.rcogRecommendations.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-800">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleSaveAssessment}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
        >
          <Save className="w-5 h-5" />
          Save Assessment
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default EnhancedAssessmentTab;
