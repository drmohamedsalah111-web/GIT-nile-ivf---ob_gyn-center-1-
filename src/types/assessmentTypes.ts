export interface PCOSCriteria {
  oligoAnovulation: boolean;
  clinicalHyperandrogenism: boolean;
  biochemicalHyperandrogenism: boolean;
  polycysticOvariesUS: boolean;
  calculatedDiagnosis: boolean;
  criteriaMetCount: number;
}

export interface InfertilityHistory {
  duration: number;
  type: 'Primary' | 'Secondary';
  menstrualPattern: 'Regular' | 'Irregular' | 'Oligomenorrhea' | 'Amenorrhea';
  menstrualCycleLength?: number;
  menarche?: number;
  obstetricHistory?: {
    gravida: number;
    parity: number;
    miscarriages: number;
    ectopic: boolean;
    molar: boolean;
  };
  medicalHistory: string[];
  surgicalHistory: string[];
  lifestyleFactors: {
    smoking: boolean;
    alcohol: boolean;
    exercise: string;
    stress: string;
  };
}

export interface EndocrineProfile {
  day2_3_fsh?: number;
  day2_3_lh?: number;
  day2_3_e2?: number;
  prolactin?: number;
  tsh?: number;
  totalTestosterone?: number;
  freeTestosterone?: number;
  dheas?: number;
  lhFshRatio?: number;
}

export interface OvarianReserveAssessment {
  amh?: number;
  afcRight?: number;
  afcLeft?: number;
  totalAFC?: number;
  interpretation: 'Poor' | 'Normal' | 'High' | 'Unknown';
}

export interface UltrasoundFindings {
  endometriumThickness?: number;
  endometriumPattern?: 'Trilaminar' | 'Homogeneous' | 'Other';
  uterinePathology: {
    fibroids: boolean;
    polyps: boolean;
    adhesions: boolean;
    septate: boolean;
    unicornuate: boolean;
  };
  ovarianPathology: {
    cyst: boolean;
    endometrioma: boolean;
    dermoid: boolean;
    followUpUS: boolean;
  };
  tubalAssessment: {
    hsgDone: boolean;
    hsgFindings?: 'Patent' | 'Patency_Disputed' | 'Blocked' | 'Hydrosalpinx';
    hycosy?: string;
  };
  hydrosalpinx: boolean;
  notes?: string;
}

export interface MaleFactor {
  semenAnalysis: {
    volume?: number;
    concentration?: number;
    totalCount?: number;
    motility_PR?: number;
    motility_NP?: number;
    motility_IM?: number;
    morphology?: number;
    pH?: number;
    vitality?: number;
  };
  who2021Classification: {
    oligozoospermia: boolean;
    asthenozoospermia: boolean;
    teratozoospermia: boolean;
    oligoasthenozoospermia: boolean;
    oligoasthenoteratozoospermia: boolean;
    diagnosis: string;
  };
  tmsc?: number;
  icsiIndicated: boolean;
  icsiReason?: string;
  notes?: string;
}

export interface DiagnosticFindings {
  pcos: PCOSCriteria;
  maleFactorDiagnosis: string;
  uterineTubalFactors: string[];
  ovulationDisorder: boolean;
  unexplained: boolean;
  combinedFactors: string[];
}

export interface RCOGRecommendations {
  recommendations: string[];
  urgency: 'Routine' | 'Expedited' | 'Urgent';
  reasonsForUrgency?: string[];
  nextSteps: {
    tubalTest: boolean;
    tubalTestType?: 'HSG' | 'HyCoSy' | 'Laparoscopy';
    hysteroscopy: boolean;
    dFSH: boolean;
    maleFactor: boolean;
    referralNeeded: boolean;
    referralReason?: string;
  };
}

export interface DiagnosticSummary {
  id?: string;
  patientId: string;
  assessmentDate: string;
  history: InfertilityHistory;
  vitals: {
    age: number;
    weight: number;
    height: number;
    bmi: number;
  };
  femaleInvestigation: {
    endocrine: EndocrineProfile;
    ovarianReserve: OvarianReserveAssessment;
    ultrasound: UltrasoundFindings;
  };
  maleFactor: MaleFactor;
  diagnosticFindings: DiagnosticFindings;
  rcogRecommendations: RCOGRecommendations;
  riskAlerts: RiskAlert[];
  clinicalNotes?: string;
  savedAt?: string;
}

export interface RiskAlert {
  type: 'BMI' | 'Age' | 'Duration' | 'PCOS' | 'Tubal' | 'Endometriosis' | 'MaleFactor' | 'Hormonal';
  severity: 'Info' | 'Warning' | 'Critical';
  message: string;
  action?: string;
}

export interface AssessmentFormState {
  history: InfertilityHistory;
  vitals: {
    age: number;
    weight: number;
    height: number;
  };
  femaleEndocrine: EndocrineProfile;
  femaleOvarian: OvarianReserveAssessment;
  femaleUltrasound: UltrasoundFindings;
  maleFactor: MaleFactor;
}
