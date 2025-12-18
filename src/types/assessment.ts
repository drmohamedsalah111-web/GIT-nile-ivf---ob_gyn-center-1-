export type CycleRegularity = 'Regular' | 'Oligo-ovulation' | 'Amenorrhea';

export interface PCOSInputs {
  cycleRegularity: CycleRegularity;
  hyperandrogenism: {
    hirsutism: boolean;
    acne: boolean;
    biochemical: boolean;
  };
  ovarianMorphology: {
    afc?: number;
    ovarianVolume?: number;
  };
}

export interface SemenAnalysis {
  volume?: number;
  concentration?: number;
  totalMotility?: number;
  morphology?: number;
}

export interface FemaleInvestigation {
  pcos: PCOSInputs;
}

export interface MaleInvestigation {
  semenAnalysis: SemenAnalysis;
}

export interface InfertilityHistory {
  age?: number;
  durationYears?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
}

export interface DiagnosticAssessment {
  history: InfertilityHistory;
  female: FemaleInvestigation;
  male: MaleInvestigation;
  finalAssessment: {
    notes?: string;
  };
}
