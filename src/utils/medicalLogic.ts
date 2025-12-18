import { useMemo } from 'react';
import { PCOSInputs, SemenAnalysis } from '../types/assessment';

export const WHO2021_LIMITS = {
  volume: 1.4,
  concentration: 16,
  totalMotility: 42,
  morphology: 4,
} as const;

export interface PCOSResult {
  ovulatoryDysfunction: boolean;
  hyperandrogenism: boolean;
  pcoMorphology: boolean;
  criteriaMetCount: number;
  highProbability: boolean;
}

export interface SemenInterpretation {
  tags: string[];
  isNormal: boolean;
  abnormalities: {
    oligozoospermia: boolean;
    asthenozoospermia: boolean;
    teratozoospermia: boolean;
  };
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const calculateBMI = (weightKg?: number, heightCm?: number): number | null => {
  if (!isNumber(weightKg) || !isNumber(heightCm) || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

export const evaluatePCOS = (inputs: PCOSInputs): PCOSResult => {
  const ovulatoryDysfunction = inputs.cycleRegularity !== 'Regular';
  const hyperandrogenism =
    inputs.hyperandrogenism.hirsutism ||
    inputs.hyperandrogenism.acne ||
    inputs.hyperandrogenism.biochemical;

  const afc = isNumber(inputs.ovarianMorphology.afc) ? inputs.ovarianMorphology.afc : 0;
  const volume = isNumber(inputs.ovarianMorphology.ovarianVolume)
    ? inputs.ovarianMorphology.ovarianVolume
    : 0;
  const pcoMorphology = afc > 20 || volume > 10;

  const criteriaMetCount = [ovulatoryDysfunction, hyperandrogenism, pcoMorphology].filter(Boolean)
    .length;
  const highProbability = criteriaMetCount >= 2;

  return {
    ovulatoryDysfunction,
    hyperandrogenism,
    pcoMorphology,
    criteriaMetCount,
    highProbability,
  };
};

export const usePCOSCalculator = (inputs: PCOSInputs): PCOSResult => {
  return useMemo(
    () => evaluatePCOS(inputs),
    [
      inputs.cycleRegularity,
      inputs.hyperandrogenism.hirsutism,
      inputs.hyperandrogenism.acne,
      inputs.hyperandrogenism.biochemical,
      inputs.ovarianMorphology.afc,
      inputs.ovarianMorphology.ovarianVolume,
    ]
  );
};

export const interpretSemenAnalysis = (semen: SemenAnalysis): SemenInterpretation => {
  const concentration = semen.concentration;
  const motility = semen.totalMotility;
  const morphology = semen.morphology;

  const oligozoospermia = isNumber(concentration) && concentration < WHO2021_LIMITS.concentration;
  const asthenozoospermia = isNumber(motility) && motility < WHO2021_LIMITS.totalMotility;
  const teratozoospermia = isNumber(morphology) && morphology < WHO2021_LIMITS.morphology;

  const tags: string[] = [];

  if (oligozoospermia && asthenozoospermia && teratozoospermia) {
    tags.push('Oligoasthenoteratozoospermia');
  } else if (oligozoospermia && asthenozoospermia) {
    tags.push('Oligoasthenozoospermia');
  } else if (oligozoospermia && teratozoospermia) {
    tags.push('Oligoteratozoospermia');
  } else if (asthenozoospermia && teratozoospermia) {
    tags.push('Asthenoteratozoospermia');
  } else {
    if (oligozoospermia) tags.push('Oligozoospermia');
    if (asthenozoospermia) tags.push('Asthenozoospermia');
    if (teratozoospermia) tags.push('Teratozoospermia');
  }

  const isNormal = tags.length === 0;
  if (isNormal) {
    tags.push('Normozoospermia');
  }

  return {
    tags,
    isNormal,
    abnormalities: { oligozoospermia, asthenozoospermia, teratozoospermia },
  };
};

export const getRcogEarlyManagementNote = (age?: number, durationYears?: number): string | null => {
  if (!isNumber(age) || !isNumber(durationYears)) return null;
  if (age >= 35 && durationYears >= 0.5) {
    return 'Consider early active management (age 35+ with >6 months infertility).';
  }
  if (age < 35 && durationYears >= 1) {
    return 'Consider early active management (>1 year infertility).';
  }
  return null;
};

export const getBmiWarning = (bmi: number | null): string | null => {
  if (!isNumber(bmi)) return null;
  if (bmi >= 30) return 'BMI > 30 may reduce IVF success rates.';
  return null;
};
