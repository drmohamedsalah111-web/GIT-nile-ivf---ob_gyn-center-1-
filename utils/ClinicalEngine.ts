// ============================================================================
// ADVANCED IVF CLINICAL INTELLIGENCE ENGINE (CIE) v3.0
// ============================================================================

// --- Drug Database (Commercial Names) ---
export const DRUG_DB = {
    FSH: [
        { name: 'Gonal-F', type: 'rFSH', form: 'Pen', unit: 'IU', available_doses: [300, 450, 900] },
        { name: 'Fostimon', type: 'uFSH', form: 'Vial', unit: 'IU', available_doses: [75, 150] },
        { name: 'Menogon', type: 'hMG', form: 'Vial', unit: 'IU', available_doses: [75] },
        { name: 'Merional', type: 'hMG', form: 'Vial', unit: 'IU', available_doses: [75, 150] },
    ],
    ANTAGONIST: [
        { name: 'Cetrotide', dose: '0.25mg', form: 'Vial (SubQ)' },
        { name: 'Orgalutran', dose: '0.25mg', form: 'Prefilled Syringe' },
    ],
    AGONIST_LONG: [
        { name: 'Decapeptyl', dose: '0.1mg', form: 'Daily Injection', note: 'Start mid-luteal of previous cycle' },
        { name: 'Lupron', dose: '10 units', form: 'Daily Injection' },
    ],
    TRIGGER: [
        { name: 'Ovitrelle', dose: '250mcg', type: 'r-hCG' },
        { name: 'Choriomon', dose: '5000 IU', type: 'u-hCG' },
        { name: 'Epifasi', dose: '5000 IU', type: 'u-hCG' },
        { name: 'Decapeptyl', dose: '0.2mg', type: 'Agonist' }, // For poor responders or OHSS
    ]
};

export interface PrescriptionPlan {
    protocolName: string;
    explanation: string;
    medications: {
        role: 'Stimulation' | 'Suppression' | 'Trigger' | 'Luteal';
        drugName: string;
        dose: string;
        instruction: string;
    }[];
    startDay: string; // e.g., "Day 2 of Cycle"
}

export interface AnalysisInput {
    age: number;
    bmi: number;
    amh: number;
    afc: number;
    pcos: boolean;
    history: {
        previous_ohss: boolean;
        poor_response: boolean;
        recurrent_implantation_failure: boolean;
    };
    current_cycle?: {
        day: number;
        e2: number;
        p4: number;
        lead_follicle: number;
        follicles_14mm: number;
        follicles_10mm: number;
        endometrium: number;
    };
}

export interface Recommendation {
    category: 'DOSE' | 'TRIGGER' | 'TRANSFER' | 'ADJUVANT';
    action: string;
    reasoning: string;
    confidence: 'High' | 'Medium' | 'Low';
    priority: 'Critical' | 'Routine';
}

export class ClinicalEngine {

    // --- Core Calculation Logic ---

    static calculateIdealDose(input: AnalysisInput): number {
        let dose = 150; // Base dose

        // Age Factor
        if (input.age < 35) dose = 150;
        else if (input.age >= 35 && input.age < 40) dose = 225;
        else if (input.age >= 40) dose = 300;

        // Reserve Factor
        if (input.amh < 1.0 || input.afc < 5) dose += 75; // Poor reserve -> Increase
        if (input.amh > 3.5 || input.afc > 20) dose = 150; // High reserve -> Stick to low dose
        if (input.pcos) dose = 112.5; // Careful with PCOS

        // BMI Factor
        if (input.bmi > 30) dose += 75; // Obesity needs higher dose

        // Cap dose
        return Math.max(75, Math.min(450, Math.round(dose / 37.5) * 37.5));
    }

    static suggestProtocol(input: AnalysisInput): PrescriptionPlan {
        const dose = this.calculateIdealDose(input);
        const isPCOS = input.pcos || input.amh > 3.5 || input.afc > 20;
        const isPoor = input.amh < 1.0 || input.afc < 5;

        // --- Scenario A: High Responder / PCOS ---
        if (isPCOS) {
            return {
                protocolName: 'GnRH Antagonist Protocol',
                explanation: 'Best for PCOS/High Responders to significantly reduce OHSS risk. Allows for Agonist Trigger if needed.',
                startDay: 'Day 2 or 3 of Cycle',
                medications: [
                    {
                        role: 'Stimulation',
                        drugName: 'Gonal-F / Fostimon',
                        dose: `${dose} IU Daily`,
                        instruction: 'Subcutaneous injection, fixed time every evening.'
                    },
                    {
                        role: 'Suppression',
                        drugName: 'Cetrotide / Orgalutran',
                        dose: '0.25 mg Daily',
                        instruction: 'Start when lead follicle ≥ 14mm or E2 > 400. Continue until trigger.'
                    }
                ]
            };
        }

        // --- Scenario B: Poor Responder (DOR) ---
        if (isPoor) {
            return {
                protocolName: 'Micro-dose Flare Protocol (Or Short Antagonist)',
                explanation: 'Utilizes the "flare" effect of agonist to boost endogenous FSH. Good for poor responders.',
                startDay: 'Day 2 of Cycle',
                medications: [
                    {
                        role: 'Stimulation',
                        drugName: 'Menogon / Merional (HMG)',
                        dose: '300-450 IU Daily',
                        instruction: 'Mixture of medicines usually preferred. High dose.'
                    },
                    {
                        role: 'Suppression',
                        drugName: 'Decapeptyl',
                        dose: '0.05 mg - 0.1 mg Daily',
                        instruction: 'Start on Day 1 or 2. Continue daily.'
                    }
                ]
            };
        }

        // --- Scenario C: Normal Responder ---
        return {
            protocolName: 'Long Agonist Protocol (Down-Regulation)',
            explanation: 'Standard protocol. Provides excellent control over the cycle and follicular synchronization.',
            startDay: 'Day 21 of Previous Cycle (Down-Reg)',
            medications: [
                {
                    role: 'Suppression',
                    drugName: 'Decapeptyl 0.1',
                    dose: '0.1 mg Daily',
                    instruction: 'Start day 21. Reduce to 0.05 mg when stimulation starts.'
                },
                {
                    role: 'Stimulation',
                    drugName: 'Gonal-F / Menogon',
                    dose: `${dose} IU Daily`,
                    instruction: 'Start after period confirms down-regulation (E2 < 50).'
                }
            ]
        };
    }

    // --- Monitoring Analysis (During Cycle) ---
    static analyzeMonitoring(input: AnalysisInput): Recommendation[] {
        const recs: Recommendation[] = [];
        if (!input.current_cycle) return recs;

        const { e2, lead_follicle, follicles_10mm } = input.current_cycle;

        // ... (Existing logic for mid-cycle monitoring) ...
        // Trigger Logic
        if (lead_follicle >= 18 && follicles_10mm > 3) {
            if (e2 > 3500 || follicles_10mm > 18) {
                recs.push({
                    category: 'TRIGGER',
                    action: '⚠️ Agonist Trigger ONLY (Decapeptyl 0.2mg)',
                    reasoning: 'High OHSS Risk. Do NOT use Ovitrelle/hCG.',
                    confidence: 'High',
                    priority: 'Critical'
                });
            } else {
                recs.push({
                    category: 'TRIGGER',
                    action: '✅ Ready for Ovitrelle 250mcg',
                    reasoning: 'Follicles ready. Standard trigger.',
                    confidence: 'High',
                    priority: 'Routine'
                });
            }
        }

        return recs;
    }
}
