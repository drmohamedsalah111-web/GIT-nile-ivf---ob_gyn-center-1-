// ============================================================================
// ADVANCED IVF CLINICAL INTELLIGENCE ENGINE (CIE) v3.5
// ============================================================================

// --- Drug Database (Commercial Names & Alternatives) ---
export const DRUG_DB = {
    FSH: [
        { name: 'Gonal-F', type: 'rFSH', form: 'Pen', unit: 'IU', available_doses: [300, 450, 900], alternatives: ['Bemfola', 'Rekovelle'] },
        { name: 'Fostimon', type: 'uFSH', form: 'Vial', unit: 'IU', available_doses: [75, 150], alternatives: ['Bravelle'] },
        { name: 'Menogon', type: 'hMG', form: 'Vial', unit: 'IU', available_doses: [75], alternatives: ['Merional', 'Menopur'] },
        { name: 'Merional', type: 'hMG', form: 'Vial', unit: 'IU', available_doses: [75, 150], alternatives: ['Menopur', 'Menogon'] },
        { name: 'Pergoveris', type: 'rFSH + rLH', form: 'Pen', unit: 'IU', available_doses: [150, 300, 450, 900], alternatives: ['Gonal-F + Luveris'] },
    ],
    ANTAGONIST: [
        { name: 'Cetrotide', dose: '0.25mg', form: 'Vial (SubQ)', alternatives: ['Orgalutran', 'Fyremadel'] },
        { name: 'Orgalutran', dose: '0.25mg', form: 'Prefilled Syringe', alternatives: ['Cetrotide', 'Fyremadel'] },
    ],
    AGONIST: [
        { name: 'Decapeptyl', dose: '0.1mg', form: 'Daily Injection', alternatives: ['Triptorelin', 'Arvekap'] },
        { name: 'Lupron', dose: '10 units', form: 'Daily Injection', alternatives: ['Buserelin', 'Suprefact'] },
        { name: 'Diphereline', dose: '0.1mg', form: 'Daily Injection', alternatives: ['Decapeptyl'] },
    ],
    TRIGGER: [
        { name: 'Ovitrelle', dose: '250mcg', type: 'r-hCG', alternatives: ['Pregnyl', 'Choriomon'] },
        { name: 'Choriomon', dose: '5000 IU', type: 'u-hCG', alternatives: ['Epifasi', 'Pregnyl'] },
        { name: 'Decapeptyl', dose: '0.2mg', type: 'Agonist', alternatives: ['Diphereline', 'Triptorelin'] },
        { name: 'Dual Trigger', dose: 'hCG + Agonist', type: 'Combo', alternatives: [] },
    ],
    PROGESTIN: [
        { name: 'Duphaston', dose: '10mg', form: 'Tablet', alternatives: ['Cyclogest', 'Prontogest'] },
        { name: 'Cyclogest', dose: '400mg', form: 'Pessary', alternatives: ['Utrogestan', 'Lutinus'] },
    ]
};

export interface PrescriptionPlan {
    protocolName: string;
    explanation: string;
    protocolGuide: string[]; // Step-by-step English guide
    clinicalNote: string;   // Short memory aid
    riskProfile: 'Low' | 'Moderate' | 'High' | 'Very High';
    successRationale: string;
    medications: {
        role: 'Stimulation' | 'Suppression' | 'Trigger' | 'Luteal' | 'Adjuvant';
        drugName: string;
        dose: string;
        instruction: string;
        alternatives?: string[];
    }[];
    startDay: string;
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

    static calculateIdealDose(input: AnalysisInput): number {
        let dose = 150;

        if (input.age < 35) dose = 150;
        else if (input.age >= 35 && input.age < 38) dose = 225;
        else if (input.age >= 38 && input.age < 42) dose = 300;
        else dose = 375;

        // Reserve Adjustments
        if (input.amh < 0.7 || input.afc < 4) dose += 75;
        if (input.amh > 4.0 || input.afc > 20) dose = 150;
        if (input.pcos) dose = 112.5;

        // BMI Adjustment
        if (input.bmi > 32) dose += 75;
        if (input.bmi < 18) dose -= 37.5;

        return Math.max(75, Math.min(450, Math.round(dose / 37.5) * 37.5));
    }

    static getProtocolDetails(protocolName: string): { guide: string[], note: string, explanation: string, rationale: string, risks: 'Low' | 'Moderate' | 'High' | 'Very High' } | null {
        const p = protocolName.toLowerCase();

        if (p.includes('antagonist')) {
            return {
                explanation: 'The current gold standard for high responders and PCOS patients.',
                rationale: 'Best for follicular synchronization and allows for Agonist Trigger to virtually eliminate OHSS risk.',
                risks: 'Low',
                note: 'Safety first, flexible control.',
                guide: [
                    'Phase 1: Baseline Ultrasound on Day 2 or 3 of menstruation.',
                    'Phase 2 (Stimulation): Start FSH/HMG injections daily at a fixed time.',
                    'Phase 3 (Suppression): Introduce GnRH Antagonist on Day 5 or 6 (or when lead follicle ≥ 14mm).',
                    'Phase 4 (Triggering): Trigger with Agonist or hCG based on follicular count and E2 levels.',
                    'Phase 5 (OPU): Oocyte Retrieval scheduled 34-36 hours after trigger.'
                ]
            };
        }

        if (p.includes('flare') || p.includes('micro')) {
            return {
                explanation: 'A specialized protocol designed for Poor Responders (DOR).',
                rationale: 'Uses the initial FSH "flare" from the agonist to maximize follicular recruitment from the start.',
                risks: 'Low',
                note: 'Intensive stimulation for low reserve.',
                guide: [
                    'Phase 1 (Preparation): Confirm Day 1 of flow.',
                    'Phase 2 (Flare): Start low-dose Agonist twice daily from Day 2.',
                    'Phase 3 (Boost): Start high-dose FSH/HMG on Day 3 while continuing Agonist.',
                    'Phase 4 (Monitoring): Frequent scanning every 48 hours to assess growth.',
                    'Phase 5: Trigger only when at least 2 follicles reach 17-18mm.'
                ]
            };
        }

        if (p.includes('long') || p.includes('down')) {
            return {
                explanation: 'Classic protocol offering the highest level of cycle control.',
                rationale: 'Eliminates premature LH surges and ensures uniform follicular growth. Ideal for egg donor cycles or synchronization.',
                risks: 'Moderate',
                note: 'Classic precision & follicular sync.',
                guide: [
                    'Phase 1 (Down-Regulation): Start Agonist on Day 21 of the previous cycle.',
                    'Phase 2 (Suppression Check): Perform ultrasound and E2 test after period starts.',
                    'Phase 3 (Stimulation): Start FSH injections once E2 < 50 pg/mL.',
                    'Phase 4 (Continuation): Maintain low-dose Agonist alongside FSH until trigger.',
                    'Phase 5: Standard hCG Trigger once follicle criteria met.'
                ]
            };
        }

        if (p.includes('ppos') || p.includes('progestin')) {
            return {
                explanation: 'Progestin-Primed Ovarian Stimulation. A low-cost, patient-friendly alternative.',
                rationale: 'Uses oral progestins instead of daily injections to prevent premature LH surge. High efficiency for freeze-all cycles.',
                risks: 'Low',
                note: 'Injection-lite, freeze-all required.',
                guide: [
                    'Phase 1: Start dual therapy (Oral Progestin + FSH) on Day 2 or 3.',
                    'Phase 2: Continue both daily until the day of trigger.',
                    'Phase 3: Dual Trigger (hCG + Agonist) usually recommended.',
                    'Phase 4: Mandatory Embryo Freezing (Cryopreservation) due to progestin effect on endometrium.'
                ]
            };
        }

        return null;
    }

    static suggestProtocol(input: AnalysisInput): PrescriptionPlan {
        const dose = this.calculateIdealDose(input);
        const isPCOS = input.pcos || input.amh > 4.0 || input.afc > 20;
        const isPoor = input.amh < 1.0 || input.afc < 6;

        if (isPCOS) {
            const details = this.getProtocolDetails('GnRH Antagonist Protocol')!;
            const fsh = DRUG_DB.FSH[0]; // Gonal-F
            const ant = DRUG_DB.ANTAGONIST[0]; // Cetrotide
            return {
                protocolName: 'GnRH Antagonist Protocol (High Responder Strategy)',
                explanation: details.explanation,
                clinicalNote: details.note,
                protocolGuide: details.guide,
                riskProfile: 'Low',
                successRationale: details.rationale,
                startDay: 'Day 2 or 3 of Cycle',
                medications: [
                    {
                        role: 'Stimulation',
                        drugName: fsh.name,
                        dose: `${dose} IU Daily`,
                        instruction: 'Subcutaneous injection, evening.',
                        alternatives: fsh.alternatives
                    },
                    {
                        role: 'Suppression',
                        drugName: ant.name,
                        dose: ant.dose,
                        instruction: 'Start on Day 6 or when lead follicle ≥ 14mm.',
                        alternatives: ant.alternatives
                    }
                ]
            };
        }

        if (isPoor) {
            const details = this.getProtocolDetails('Micro-dose Flare Protocol')!;
            const hmg = DRUG_DB.FSH[3]; // Merional
            const ago = DRUG_DB.AGONIST[0]; // Decapeptyl
            return {
                protocolName: 'Micro-dose Flare Protocol (DOR Optimization)',
                explanation: details.explanation,
                clinicalNote: details.note,
                protocolGuide: details.guide,
                riskProfile: 'Moderate',
                successRationale: details.rationale,
                startDay: 'Day 2 of Cycle',
                medications: [
                    {
                        role: 'Suppression',
                        drugName: ago.name,
                        dose: '0.05 mg twice daily',
                        instruction: 'Start on Day 2 morning.',
                        alternatives: ago.alternatives
                    },
                    {
                        role: 'Stimulation',
                        drugName: hmg.name,
                        dose: `${dose} IU Daily`,
                        instruction: 'Start on Day 3 morning.',
                        alternatives: hmg.alternatives
                    }
                ]
            };
        }

        // Normal Responder
        const details = this.getProtocolDetails('Long Agonist Protocol')!;
        const fsh = DRUG_DB.FSH[0]; // Gonal-F
        const ago = DRUG_DB.AGONIST[0]; // Decapeptyl
        return {
            protocolName: 'Long Agonist Protocol (Synchronization Method)',
            explanation: details.explanation,
            clinicalNote: details.note,
            protocolGuide: details.guide,
            riskProfile: 'Moderate',
            successRationale: details.rationale,
            startDay: 'Day 21 of Previous Cycle',
            medications: [
                {
                    role: 'Suppression',
                    drugName: ago.name,
                    dose: '0.1 mg Daily',
                    instruction: 'Start Day 21. Half dose (0.05) once FSH starts.',
                    alternatives: ago.alternatives
                },
                {
                    role: 'Stimulation',
                    drugName: fsh.name,
                    dose: `${dose} IU Daily`,
                    instruction: 'Start after period onset.',
                    alternatives: fsh.alternatives
                }
            ]
        };
    }

    static analyzeMonitoring(input: AnalysisInput): Recommendation[] {
        const recs: Recommendation[] = [];
        if (!input.current_cycle) return recs;

        const { day, e2, p4, lead_follicle, follicles_10mm, endometrium } = input.current_cycle;

        // Trigger Logic
        if (lead_follicle >= 18 && follicles_10mm >= 3) {
            if (e2 > 4000 || follicles_10mm > 15) {
                recs.push({
                    category: 'TRIGGER',
                    action: '⚠️ Decapeptyl 0.2mg ONLY (Freeze-All)',
                    reasoning: 'Extremely high OHSS risk detected. Avoiding hCG trigger is mandatory.',
                    confidence: 'High',
                    priority: 'Critical'
                });
            } else if (e2 < 1000 && lead_follicle >= 20) {
                recs.push({
                    category: 'TRIGGER',
                    action: '⚠️ Dual Trigger (hCG 5000 + Agonist 0.2)',
                    reasoning: 'Low E2 relative to follicle size suggesting potentially suboptimal oocyte maturity.',
                    confidence: 'Medium',
                    priority: 'Routine'
                });
            } else {
                recs.push({
                    category: 'TRIGGER',
                    action: '✅ Ovitrelle 250mcg (hCG)',
                    reasoning: 'Optimal follicles and E2 levels reached.',
                    confidence: 'High',
                    priority: 'Routine'
                });
            }
        }

        // Endometrium Check
        if (lead_follicle > 17 && endometrium < 7) {
            recs.push({
                category: 'ADJUVANT',
                action: 'Consider Endometrial Support',
                reasoning: 'Thin lining (< 7mm) nearing trigger day.',
                confidence: 'Medium',
                priority: 'Routine'
            });
        }

        return recs;
    }
}
