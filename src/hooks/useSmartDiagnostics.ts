import { useState, useCallback, useMemo } from 'react';
import {
  PCOSCriteria,
  MaleFactor,
  DiagnosticFindings,
  RiskAlert,
  RCOGRecommendations,
  EndocrineProfile,
  OvarianReserveAssessment,
  UltrasoundFindings,
} from '../types/assessmentTypes';
import {
  classifySemenAnalysis,
  calculateTMSC,
  calculatePCOSCriteria,
  calculateLHFSHRatio,
  calculateBMI,
  generateRiskAlerts,
  generateRCOGRecommendations,
} from '../utils/clinicalCalculations';

export interface SmartDiagnosticsState {
  pcos: PCOSCriteria;
  maleFactor: { classification: string; icsiIndicated: boolean; findings: string[] };
  bmi: { bmi: number; category: string };
  lhFshRatio: { ratio: number; interpretation: string };
  tmsc: { tmsc: number; interpretation: string };
  riskAlerts: RiskAlert[];
  rcogRecommendations: RCOGRecommendations;
  diagnosticFindings: DiagnosticFindings;
}

export const useSmartDiagnostics = () => {
  const [state, setState] = useState<SmartDiagnosticsState>({
    pcos: {
      oligoAnovulation: false,
      clinicalHyperandrogenism: false,
      biochemicalHyperandrogenism: false,
      polycysticOvariesUS: false,
      calculatedDiagnosis: false,
      criteriaMetCount: 0,
    },
    maleFactor: { classification: 'Incomplete data', icsiIndicated: false, findings: [] },
    bmi: { bmi: 0, category: 'N/A' },
    lhFshRatio: { ratio: 0, interpretation: 'Cannot calculate' },
    tmsc: { tmsc: 0, interpretation: 'Cannot calculate - missing parameters' },
    riskAlerts: [],
    rcogRecommendations: {
      recommendations: [],
      urgency: 'Routine',
      nextSteps: {
        tubalTest: false,
        hysteroscopy: false,
        dFSH: false,
        maleFactor: false,
        referralNeeded: false,
      },
    },
    diagnosticFindings: {
      pcos: {
        oligoAnovulation: false,
        clinicalHyperandrogenism: false,
        biochemicalHyperandrogenism: false,
        polycysticOvariesUS: false,
        calculatedDiagnosis: false,
        criteriaMetCount: 0,
      },
      maleFactorDiagnosis: 'Normal',
      uterineTubalFactors: [],
      ovulationDisorder: false,
      unexplained: false,
      combinedFactors: [],
    },
  });

  const updatePCOS = useCallback(
    (oligoAnovulation: boolean, clinicalHA: boolean, biochemicalHA: boolean, polycysticUS: boolean) => {
      const pcosResult = calculatePCOSCriteria(oligoAnovulation, clinicalHA, biochemicalHA, polycysticUS);
      setState(prev => ({
        ...prev,
        pcos: pcosResult,
        diagnosticFindings: {
          ...prev.diagnosticFindings,
          pcos: pcosResult,
        },
      }));
    },
    []
  );

  const updateMaleFactor = useCallback(
    (volume?: number, concentration?: number, totalCount?: number, motilityPR?: number, morphology?: number) => {
      const result = classifySemenAnalysis(volume, concentration, totalCount, motilityPR, morphology);
      const tmscResult = calculateTMSC(volume, concentration, motilityPR);

      setState(prev => ({
        ...prev,
        maleFactor: {
          classification: result.classification,
          icsiIndicated: result.icsiIndicated,
          findings: result.findings,
        },
        tmsc: tmscResult,
      }));
    },
    []
  );

  const updateVitals = useCallback((weight?: number, height?: number, age?: number) => {
    const bmiResult = calculateBMI(weight, height);

    setState(prev => ({
      ...prev,
      bmi: bmiResult,
    }));
  }, []);

  const updateEndocrine = useCallback((endocrine: Partial<EndocrineProfile>) => {
    const lhFshResult = calculateLHFSHRatio(endocrine.day2_3_lh, endocrine.day2_3_fsh);

    setState(prev => ({
      ...prev,
      lhFshRatio: lhFshResult,
    }));
  }, []);

  const updateDiagnosticFindings = useCallback(
    (
      maleFactorDiagnosis: string,
      uterineTubalFactors: string[],
      ovulationDisorder: boolean,
      unexplained: boolean,
      combinedFactors: string[]
    ) => {
      setState(prev => ({
        ...prev,
        diagnosticFindings: {
          ...prev.diagnosticFindings,
          maleFactorDiagnosis,
          uterineTubalFactors,
          ovulationDisorder,
          unexplained,
          combinedFactors,
        },
      }));
    },
    []
  );

  const generateAlerts = useCallback(
    (
      age: number,
      infertilityDuration: number,
      tubalPathology: boolean,
      endometriosisRisk: boolean
    ) => {
      const alerts = generateRiskAlerts(
        age,
        state.bmi.bmi,
        infertilityDuration,
        state.pcos,
        state.maleFactor,
        tubalPathology,
        endometriosisRisk
      );

      setState(prev => ({
        ...prev,
        riskAlerts: alerts,
      }));

      return alerts;
    },
    [state.bmi, state.pcos, state.maleFactor]
  );

  const generateRecommendations = useCallback(
    (
      age: number,
      infertilityDuration: number,
      maleFactor: boolean,
      afcTotal: number
    ) => {
      const recommendations = generateRCOGRecommendations(
        age,
        infertilityDuration,
        maleFactor,
        state.pcos,
        false,
        afcTotal
      );

      setState(prev => ({
        ...prev,
        rcogRecommendations: recommendations,
      }));

      return recommendations;
    },
    [state.pcos]
  );

  return {
    state,
    updatePCOS,
    updateMaleFactor,
    updateVitals,
    updateEndocrine,
    updateDiagnosticFindings,
    generateAlerts,
    generateRecommendations,
  };
};

export const usePCOSIndicator = (pcos: PCOSCriteria) => {
  return useMemo(() => {
    const activated = pcos.criteriaMetCount;
    return {
      isPCOS: pcos.calculatedDiagnosis,
      criteriaMetCount: activated,
      message: pcos.calculatedDiagnosis
        ? `Rotterdam PCOS Criteria: ${activated}/3 met - PCOS Diagnosis`
        : `Rotterdam PCOS Criteria: ${activated}/3 met`,
      severityColor:
        activated === 0
          ? 'text-green-600'
          : activated === 1
            ? 'text-yellow-600'
            : activated === 2
              ? 'text-orange-600'
              : 'text-red-600',
      backgroundColor:
        activated === 0
          ? 'bg-green-50'
          : activated === 1
            ? 'bg-yellow-50'
            : activated === 2
              ? 'bg-orange-50'
              : 'bg-red-50',
    };
  }, [pcos.criteriaMetCount, pcos.calculatedDiagnosis]);
};

export const useMaleFactorIndicator = (maleFactor: { classification: string; icsiIndicated: boolean }) => {
  return useMemo(() => {
    const isAbnormal = maleFactor.classification !== 'Normal' && maleFactor.classification !== 'Incomplete data';
    const requiresICJSI = maleFactor.icsiIndicated;

    return {
      isAbnormal,
      requiresICJSI,
      displayText: maleFactor.classification,
      icon: requiresICJSI ? '⚠️' : isAbnormal ? '⚡' : '✓',
      color: requiresICJSI ? 'text-red-600' : isAbnormal ? 'text-orange-600' : 'text-green-600',
      backgroundColor: requiresICJSI ? 'bg-red-50' : isAbnormal ? 'bg-orange-50' : 'bg-green-50',
    };
  }, [maleFactor.classification, maleFactor.icsiIndicated]);
};

export const useBMIIndicator = (bmi: number, weight?: number, height?: number) => {
  return useMemo(() => {
    let severity: 'safe' | 'warning' | 'critical' = 'safe';
    let message = 'Normal BMI';
    let recommendation = '';

    if (bmi === 0) {
      return { severity, message: 'Enter weight and height', recommendation: '', color: 'text-gray-600' };
    }

    if (bmi < 18.5) {
      severity = 'warning';
      message = `Low BMI (${bmi.toFixed(1)})`;
      recommendation = 'Nutritional counseling recommended';
    } else if (bmi < 25) {
      message = `Optimal BMI (${bmi.toFixed(1)})`;
      recommendation = '';
    } else if (bmi < 30) {
      severity = 'warning';
      message = `Overweight (${bmi.toFixed(1)})`;
      recommendation = 'Weight loss recommended (5-10%)';
    } else if (bmi < 35) {
      severity = 'critical';
      message = `Obese (${bmi.toFixed(1)})`;
      recommendation = 'Significant weight loss needed before IVF stimulation';
    } else {
      severity = 'critical';
      message = `Severe Obesity (${bmi.toFixed(1)})`;
      recommendation = 'Delay treatment - intensive weight management program essential';
    }

    const color = severity === 'safe' ? 'text-green-600' : severity === 'warning' ? 'text-orange-600' : 'text-red-600';
    const backgroundColor =
      severity === 'safe' ? 'bg-green-50' : severity === 'warning' ? 'bg-orange-50' : 'bg-red-50';

    return { severity, message, recommendation, color, backgroundColor };
  }, [bmi]);
};
