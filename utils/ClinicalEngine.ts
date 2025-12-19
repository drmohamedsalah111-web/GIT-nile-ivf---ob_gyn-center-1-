// ============================================================================
// ADVANCED IVF CLINICAL INTELLIGENCE ENGINE (CIE)
// Based on ESHRE 2024 Guidelines & ASRM Best Practices
// ============================================================================

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
    current_cycle: {
        day: number;
        e2: number;
        p4: number;
        lead_follicle: number; // Size of largest follicle
        follicles_14mm: number; // Count > 14mm
        follicles_10mm: number; // Count > 10mm
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

    static analyze(input: AnalysisInput): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // 1. Stimulation Phase Guidelines (Days 1-5)
        if (input.current_cycle.day <= 5) {
            this.analyzeEarlyPhase(input, recommendations);
        }

        // 2. Mid-Luteal / Adjustment Phase (Days 6-9)
        if (input.current_cycle.day > 5 && input.current_cycle.day < 10) {
            this.analyzeMidPhase(input, recommendations);
        }

        // 3. Late Phase / Trigger Decision (Day 10+)
        if (input.current_cycle.day >= 10) {
            this.analyzeTriggerPhase(input, recommendations);
        }

        // 4. Transfer Strategy (Always active)
        this.analyzeTransferStrategy(input, recommendations);

        return recommendations;
    }

    // ---------------------------------------------------------------------------
    // Phase 1: Early Response
    // ---------------------------------------------------------------------------
    private static analyzeEarlyPhase(input: AnalysisInput, recs: Recommendation[]) {
        // Starting Dose Validation
        let targetDose = 150;
        if (input.amh < 1.0 || input.history.poor_response) targetDose = 300;
        else if (input.amh > 3.0 || input.pcos) targetDose = 150;
        else if (input.age > 40) targetDose = 225 - 300;

        // TODO: Add complex logic for starting adjuvants
        if (input.history.poor_response && input.age > 38) {
            recs.push({
                category: 'ADJUVANT',
                action: 'Consider adding Growth Hormone (Omnotrope)',
                reasoning: 'Patient >38y with history of poor response may benefit from GH priming.',
                confidence: 'Medium',
                priority: 'Routine'
            });
        }
    }

    // ---------------------------------------------------------------------------
    // Phase 2: Dose Adjustment (Step-up / Step-down)
    // ---------------------------------------------------------------------------
    private static analyzeMidPhase(input: AnalysisInput, recs: Recommendation[]) {
        const { e2, lead_follicle, follicles_10mm } = input.current_cycle;

        // Poor Response Check
        if (input.current_cycle.day === 6 && e2 < 200 && lead_follicle < 10) {
            recs.push({
                category: 'DOSE',
                action: 'Step-up Dose (+75 IU)',
                reasoning: 'Day 6 E2 < 200pg/mL indicates hypo-response. Early step-up is recommended.',
                confidence: 'High',
                priority: 'Critical'
            });
        }

        // Hyper Response Check (Coasting Warning)
        if (input.current_cycle.day < 8 && e2 > 1500) {
            recs.push({
                category: 'DOSE',
                action: 'Step-down Dose or Consider Coasting',
                reasoning: 'Rapid E2 rise (>1500 early in cycle). Risk of OHSS.',
                confidence: 'High',
                priority: 'Critical'
            });
        }
    }

    // ---------------------------------------------------------------------------
    // Phase 3: Trigger Strategy (The most critical decision)
    // ---------------------------------------------------------------------------
    private static analyzeTriggerPhase(input: AnalysisInput, recs: Recommendation[]) {
        const { e2, follicles_14mm, follicles_10mm } = input.current_cycle;

        const totalFollicles = follicles_10mm; // Proxy for total active follicles

        // OHSS Risk Assessment
        if (totalFollicles > 18 || e2 > 3500 || input.history.previous_ohss) {
            recs.push({
                category: 'TRIGGER',
                action: 'GnRH Agonist Trigger ONLY (Decapeptyl 0.2mg)',
                reasoning: 'High OHSS Risk criteria met. Avoid hCG completely.',
                confidence: 'High',
                priority: 'Critical'
            });
        } else if (totalFollicles > 12 && totalFollicles <= 18) {
            recs.push({
                category: 'TRIGGER',
                action: 'Dual Trigger (Agonist + Low Dose hCG 1500)',
                reasoning: 'Moderate responder. Dual trigger improves oocyte maturity (MII rate).',
                confidence: 'High',
                priority: 'Routine'
            });
        } else {
            recs.push({
                category: 'TRIGGER',
                action: 'Standard hCG Trigger (Ovitrelle 250mcg)',
                reasoning: 'Normal responder with low OHSS risk.',
                confidence: 'High',
                priority: 'Routine'
            });
        }
    }

    // ---------------------------------------------------------------------------
    // Phase 4: Transfer Strategy (Fresh vs Freeze-All)
    // ---------------------------------------------------------------------------
    private static analyzeTransferStrategy(input: AnalysisInput, recs: Recommendation[]) {
        // 1. Progesterone Elevation (Premature Luteinization)
        if (input.current_cycle.p4 > 1.5) {
            recs.push({
                category: 'TRANSFER',
                action: 'Freeze-All (No Fresh Transfer)',
                reasoning: 'P4 > 1.5ng/mL on trigger day is associated with significantly lower implantation rates.',
                confidence: 'High',
                priority: 'Critical'
            });
            return; // Stop checking
        }

        // 2. Endometriums Factor
        if (input.current_cycle.endometrium < 7 && input.current_cycle.day >= 10) {
            recs.push({
                category: 'TRANSFER',
                action: 'Consider Freeze-All (Thin Endometrium)',
                reasoning: 'Endometrium < 7mm consistently. Receptivity may be compromised.',
                confidence: 'Medium',
                priority: 'Routine'
            });
        }

        // 3. OHSS Risk (Duplicate check but relevant for transfer)
        if (input.current_cycle.e2 > 3500) {
            recs.push({
                category: 'TRANSFER',
                action: 'Freeze-All (OHSS Risk)',
                reasoning: 'Pregnancy increases endogenous HCG which exacerbates OHSS.',
                confidence: 'High',
                priority: 'Critical'
            });
        }
    }
}
