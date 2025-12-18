import { PCOSCriteria, MaleFactor, RiskAlert, RCOGRecommendations, DiagnosticFindings } from '../types/assessmentTypes';

export const WHO_2021_THRESHOLDS = {
  volume: 1.4,
  concentration: 16,
  totalCount: 39,
  motility: 42,
  morphology: 4,
};

export const classifySemenAnalysis = (
  volume?: number,
  concentration?: number,
  totalCount?: number,
  motilityPR?: number,
  morphology?: number
): { classification: string; icsiIndicated: boolean; findings: string[] } => {
  const findings: string[] = [];
  let icsiIndicated = false;

  if (!volume || !concentration || !morphology) {
    return { classification: 'Incomplete data', icsiIndicated: false, findings: ['Missing semen analysis parameters'] };
  }

  const oligozoospermia = concentration < WHO_2021_THRESHOLDS.concentration;
  const asthenozoospermia = (motilityPR || 0) < WHO_2021_THRESHOLDS.motility;
  const teratozoospermia = morphology < WHO_2021_THRESHOLDS.morphology;

  if (oligozoospermia) findings.push('Oligozoospermia');
  if (asthenozoospermia) findings.push('Asthenozoospermia');
  if (teratozoospermia) findings.push('Teratozoospermia');

  const activeFindings = findings.length;

  if (activeFindings === 0 && volume < WHO_2021_THRESHOLDS.volume) {
    findings.push('Low Volume');
  }

  let classification = 'Normal semen analysis';

  if (activeFindings === 0) {
    classification = 'Normal';
  } else if (activeFindings === 1) {
    if (oligozoospermia) classification = 'Oligozoospermia';
    else if (asthenozoospermia) classification = 'Asthenozoospermia';
    else if (teratozoospermia) classification = 'Teratozoospermia';
  } else if (activeFindings === 2) {
    if (oligozoospermia && asthenozoospermia) {
      classification = 'Oligoasthenozoospermia';
      icsiIndicated = true;
    } else if (oligozoospermia && teratozoospermia) {
      classification = 'Oligoteratozoospermia';
    } else if (asthenozoospermia && teratozoospermia) {
      classification = 'Asthenoteratozoospermia';
    }
  } else {
    classification = 'Oligoasthenoteratozoospermia (OAT)';
    icsiIndicated = true;
  }

  if (concentration < 5) {
    icsiIndicated = true;
  }

  return { classification, icsiIndicated, findings };
};

export const calculateTMSC = (
  volume?: number,
  concentration?: number,
  motilityPR?: number
): { tmsc: number; interpretation: string } => {
  if (!volume || !concentration || !motilityPR) {
    return { tmsc: 0, interpretation: 'Cannot calculate - missing parameters' };
  }

  const totalSpermCount = volume * concentration;
  const tmsc = (totalSpermCount * motilityPR) / 100;

  const interpretation = tmsc >= 5 ? 'Adequate for IUI/Natural conception' : 'ICSI may be indicated';

  return { tmsc, interpretation };
};

export const calculatePCOSCriteria = (
  oligoAnovulation: boolean,
  clinicalHyperandrogenism: boolean,
  biochemicalHyperandrogenism: boolean,
  polycysticOvariesUS: boolean
): PCOSCriteria => {
  const activeFindings = [
    oligoAnovulation,
    (clinicalHyperandrogenism || biochemicalHyperandrogenism),
    polycysticOvariesUS,
  ].filter(Boolean).length;

  return {
    oligoAnovulation,
    clinicalHyperandrogenism,
    biochemicalHyperandrogenism,
    polycysticOvariesUS,
    calculatedDiagnosis: activeFindings >= 2,
    criteriaMetCount: activeFindings,
  };
};

export const calculateLHFSHRatio = (lh?: number, fsh?: number): { ratio: number; interpretation: string } => {
  if (!lh || !fsh || fsh === 0) {
    return { ratio: 0, interpretation: 'Cannot calculate' };
  }

  const ratio = lh / fsh;
  const interpretation = ratio > 2 ? 'PCOS-suggestive (LH:FSH > 2:1)' : 'Normal LH:FSH ratio';

  return { ratio, interpretation };
};

export const calculateBMI = (weight?: number, height?: number): { bmi: number; category: string } => {
  if (!weight || !height || height === 0) {
    return { bmi: 0, category: 'N/A' };
  }

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  let category = '';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal Weight';
  else if (bmi < 30) category = 'Overweight';
  else if (bmi < 35) category = 'Obese Class I';
  else category = 'Obese Class II';

  return { bmi: Math.round(bmi * 10) / 10, category };
};

export const generateRiskAlerts = (
  age: number,
  bmi: number,
  infertilityDuration: number,
  pcos: PCOSCriteria,
  maleFactor: { classification: string; icsiIndicated: boolean },
  tubalPathology: boolean,
  endometriosisRisk: boolean
): RiskAlert[] => {
  const alerts: RiskAlert[] = [];

  if (age > 40) {
    alerts.push({
      type: 'Age',
      severity: 'Warning',
      message: `Advanced maternal age (${age} years) - Consider expedited evaluation`,
      action: 'Recommend timely treatment planning',
    });
  }

  if (bmi > 30) {
    alerts.push({
      type: 'BMI',
      severity: 'Warning',
      message: `Elevated BMI (${bmi.toFixed(1)}) - Weight reduction recommended before IVF`,
      action: 'Counsel on lifestyle modification, consider delayed stimulation if BMI > 35',
    });
  }

  if (bmi < 18.5) {
    alerts.push({
      type: 'BMI',
      severity: 'Info',
      message: `Low BMI (${bmi.toFixed(1)}) - Ensure adequate nutrition`,
      action: 'Nutritional counseling',
    });
  }

  if (infertilityDuration > 3) {
    alerts.push({
      type: 'Duration',
      severity: 'Warning',
      message: `Long infertility duration (${infertilityDuration} years) - Expedited workup recommended`,
      action: 'Complete full investigation without delay',
    });
  }

  if (pcos.calculatedDiagnosis) {
    alerts.push({
      type: 'PCOS',
      severity: 'Warning',
      message: `PCOS diagnosis (${pcos.criteriaMetCount}/3 Rotterdam criteria met) - PCOS management protocol`,
      action: 'Consider metformin, diet/exercise, low-dose gonadotropins if ovulation needed',
    });
  }

  if (maleFactor.classification !== 'Normal' && maleFactor.classification !== 'Incomplete data') {
    alerts.push({
      type: 'MaleFactor',
      severity: maleFactor.icsiIndicated ? 'Critical' : 'Warning',
      message: `Abnormal semen analysis: ${maleFactor.classification}`,
      action: maleFactor.icsiIndicated ? 'ICSI strongly indicated' : 'Urological referral recommended',
    });
  }

  if (tubalPathology) {
    alerts.push({
      type: 'Tubal',
      severity: 'Warning',
      message: 'Tubal pathology detected - Surgical intervention may be needed',
      action: 'Discuss surgical options vs. direct IVF',
    });
  }

  if (endometriosisRisk) {
    alerts.push({
      type: 'Endometriosis',
      severity: 'Info',
      message: 'Risk factors for endometriosis identified',
      action: 'Consider laparoscopy if diagnosis uncertain',
    });
  }

  return alerts;
};

export const generateRCOGRecommendations = (
  age: number,
  infertilityDuration: number,
  maleFactor: boolean,
  pcos: PCOSCriteria,
  tubalPathology: boolean,
  afcTotal: number
): RCOGRecommendations => {
  const recommendations: string[] = [];
  const reasonsForUrgency: string[] = [];
  const nextSteps = {
    tubalTest: false,
    tubalTestType: undefined as 'HSG' | 'HyCoSy' | 'Laparoscopy' | undefined,
    hysteroscopy: false,
    dFSH: false,
    maleFactor: false,
    referralNeeded: false,
    referralReason: undefined as string | undefined,
  };

  let urgency: 'Routine' | 'Expedited' | 'Urgent' = 'Routine';

  if (age >= 35 || infertilityDuration > 2) {
    recommendations.push('Complete infertility workup within 3 months');
    if (age >= 40) {
      urgency = 'Urgent';
      reasonsForUrgency.push('Advanced maternal age');
    } else if (age >= 35 || infertilityDuration > 2) {
      urgency = 'Expedited';
      reasonsForUrgency.push('Age >35 or duration >2 years');
    }
  }

  if (infertilityDuration >= 1 && !tubalPathology) {
    nextSteps.tubalTest = true;
    nextSteps.tubalTestType = 'HSG';
    recommendations.push('HSG or HyCoSy for tubal patency assessment');
  }

  if (maleFactor) {
    nextSteps.maleFactor = true;
    recommendations.push('Urological referral for semen analysis abnormalities');
  }

  if (pcos.calculatedDiagnosis) {
    recommendations.push('PCOS management protocol: First-line ovulation induction');
    recommendations.push('Lifestyle modification (weight loss if BMI >25)');
  }

  if (age >= 35) {
    nextSteps.dFSH = true;
    recommendations.push('Baseline FSH for ovarian reserve assessment (if not done)');
  }

  if (afcTotal < 5) {
    recommendations.push('Poor ovarian reserve indicated - Consider early IVF');
    recommendations.push('Discuss expectations regarding treatment success');
  }

  return {
    recommendations,
    urgency,
    reasonsForUrgency: reasonsForUrgency.length > 0 ? reasonsForUrgency : undefined,
    nextSteps,
  };
};

export const diagnosticSummaryFromFindings = (findings: DiagnosticFindings): string => {
  const summary: string[] = [];

  if (findings.pcos.calculatedDiagnosis) {
    summary.push(`✓ PCOS (${findings.pcos.criteriaMetCount}/3 Rotterdam criteria)`);
  }

  if (findings.maleFactorDiagnosis !== 'Normal') {
    summary.push(`✓ Male Factor: ${findings.maleFactorDiagnosis}`);
  }

  if (findings.uterineTubalFactors.length > 0) {
    summary.push(`✓ Uterine/Tubal: ${findings.uterineTubalFactors.join(', ')}`);
  }

  if (findings.ovulationDisorder) {
    summary.push('✓ Ovulation Disorder');
  }

  if (findings.unexplained) {
    summary.push('✓ Unexplained Infertility');
  }

  if (findings.combinedFactors.length > 0) {
    summary.push(`✓ Combined Factors: ${findings.combinedFactors.join(', ')}`);
  }

  return summary.length > 0 ? summary.join('\n') : 'No abnormalities identified';
};
