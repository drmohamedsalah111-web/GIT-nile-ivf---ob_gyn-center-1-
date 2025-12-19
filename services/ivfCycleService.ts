import { supabase } from './supabaseClient';

// ============================================================================
// IVF CYCLE SERVICE
// ============================================================================
// Professional service for managing IVF cycles with full lifecycle support
// ============================================================================

export interface IvfCycleData {
    id?: string;
    patient_id: string;
    doctor_id: string;
    cycle_number?: number;
    protocol_type?: 'Long' | 'Antagonist' | 'Flare-up' | 'Mini-IVF' | 'Natural';
    start_date: string;
    end_date?: string;
    status?: 'assessment' | 'protocol' | 'stimulation' | 'opu' | 'lab' | 'transfer' | 'outcome' | 'completed' | 'cancelled';
}

export interface AssessmentData {
    cycle_id: string;
    // Female
    female_age?: number;
    female_bmi?: number;
    amh?: number;
    afc_right?: number;
    afc_left?: number;
    fsh?: number;
    lh?: number;
    e2?: number;
    ovarian_reserve?: 'poor' | 'normal' | 'high' | 'pcos';
    // Male
    sperm_count?: number;
    motility?: number;
    progressive_motility?: number;
    morphology?: number;
    tmsc?: number;
    // Diagnosis
    infertility_type?: 'primary' | 'secondary';
    infertility_duration?: number;
    previous_ivf_cycles?: number;
    previous_pregnancies?: number;
    previous_live_births?: number;
    medical_conditions?: any[];
    surgical_history?: any[];
    medications?: any[];
    notes?: string;
}

export interface MonitoringVisitData {
    cycle_id: string;
    visit_date: string;
    cycle_day: number;
    stimulation_day?: number;
    // Hormones
    e2?: number;
    lh?: number;
    progesterone?: number;
    fsh?: number;
    // Ultrasound
    endometrium_thickness?: number;
    endometrium_pattern?: 'trilaminar' | 'homogeneous' | 'irregular';
    follicles_right?: number[];
    follicles_left?: number[];
    // Calculated
    total_follicles?: number;
    follicles_gt_10mm?: number;
    follicles_gt_14mm?: number;
    follicles_gt_18mm?: number;
    lead_follicle_size?: number;
    // Medications
    medications?: any[];
    next_visit_date?: string;
    recommendations?: string;
    notes?: string;
}

export const ivfCycleService = {
    // ============================================================================
    // CYCLE MANAGEMENT
    // ============================================================================

    /**
     * Create a new IVF cycle
     */
    createCycle: async (cycleData: IvfCycleData) => {
        try {
            const { data, error } = await supabase
                .from('ivf_cycles')
                .insert([cycleData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error creating cycle:', error);
            return { data: null, error };
        }
    },

    /**
     * Get all cycles for a patient
     */
    getCyclesByPatient: async (patientId: string) => {
        try {
            const { data, error } = await supabase
                .from('ivf_cycles')
                .select('*')
                .eq('patient_id', patientId)
                .order('start_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error fetching cycles:', error);
            return { data: null, error };
        }
    },

    /**
     * Get cycle by ID with all related data
     */
    getCycleById: async (cycleId: string) => {
        try {
            const { data, error } = await supabase
                .from('ivf_cycles')
                .select(`
          *,
          cycle_assessment(*),
          stimulation_protocol(*),
          monitoring_visits(*),
          oocyte_retrieval(*),
          fertilization(*),
          embryo_development(*),
          embryo_transfer(*),
          cycle_outcome(*)
        `)
                .eq('id', cycleId)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error fetching cycle:', error);
            return { data: null, error };
        }
    },

    /**
     * Update cycle status
     */
    updateCycleStatus: async (cycleId: string, status: IvfCycleData['status']) => {
        try {
            const { data, error } = await supabase
                .from('ivf_cycles')
                .update({ status })
                .eq('id', cycleId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error updating cycle status:', error);
            return { data: null, error };
        }
    },

    // ============================================================================
    // ASSESSMENT
    // ============================================================================

    /**
     * Save or update assessment data
     */
    saveAssessment: async (assessmentData: AssessmentData) => {
        try {
            const { data, error } = await supabase
                .from('cycle_assessment')
                .upsert([assessmentData], { onConflict: 'cycle_id' })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error saving assessment:', error);
            return { data: null, error };
        }
    },

    /**
     * Get assessment for a cycle
     */
    getAssessment: async (cycleId: string) => {
        try {
            const { data, error } = await supabase
                .from('cycle_assessment')
                .select('*')
                .eq('cycle_id', cycleId)
                .maybeSingle();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error fetching assessment:', error);
            return { data: null, error };
        }
    },

    // ============================================================================
    // MONITORING
    // ============================================================================

    /**
     * Add monitoring visit
     */
    addMonitoringVisit: async (visitData: MonitoringVisitData) => {
        try {
            // Calculate follicle counts
            const folliclesRight = visitData.follicles_right || [];
            const folliclesLeft = visitData.follicles_left || [];
            const allFollicles = [...folliclesRight, ...folliclesLeft];

            const calculatedData = {
                ...visitData,
                total_follicles: allFollicles.length,
                follicles_gt_10mm: allFollicles.filter(f => f >= 10).length,
                follicles_gt_14mm: allFollicles.filter(f => f >= 14).length,
                follicles_gt_18mm: allFollicles.filter(f => f >= 18).length,
                lead_follicle_size: allFollicles.length > 0 ? Math.max(...allFollicles) : undefined,
            };

            const { data, error } = await supabase
                .from('monitoring_visits')
                .insert([calculatedData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error adding monitoring visit:', error);
            return { data: null, error };
        }
    },

    /**
     * Get all monitoring visits for a cycle
     */
    getMonitoringVisits: async (cycleId: string) => {
        try {
            const { data, error } = await supabase
                .from('monitoring_visits')
                .select('*')
                .eq('cycle_id', cycleId)
                .order('visit_date', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error fetching monitoring visits:', error);
            return { data: null, error };
        }
    },

    /**
     * Update monitoring visit
     */
    updateMonitoringVisit: async (visitId: string, updates: Partial<MonitoringVisitData>) => {
        try {
            const { data, error } = await supabase
                .from('monitoring_visits')
                .update(updates)
                .eq('id', visitId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error updating monitoring visit:', error);
            return { data: null, error };
        }
    },

    // ============================================================================
    // STATISTICS
    // ============================================================================

    /**
     * Get cycle statistics for a patient
     */
    getPatientStatistics: async (patientId: string) => {
        try {
            const { data: cycles, error } = await supabase
                .from('ivf_cycles')
                .select(`
          *,
          cycle_outcome(*)
        `)
                .eq('patient_id', patientId);

            if (error) throw error;

            const stats = {
                total_cycles: cycles?.length || 0,
                completed_cycles: cycles?.filter(c => c.status === 'completed').length || 0,
                cancelled_cycles: cycles?.filter(c => c.status === 'cancelled').length || 0,
                positive_outcomes: cycles?.filter(c =>
                    c.cycle_outcome?.[0]?.clinical_pregnancy === true
                ).length || 0,
                live_births: cycles?.filter(c =>
                    c.cycle_outcome?.[0]?.live_birth === true
                ).length || 0,
            };

            return { data: stats, error: null };
        } catch (error: any) {
            console.error('Error fetching statistics:', error);
            return { data: null, error };
        }
    },
};
