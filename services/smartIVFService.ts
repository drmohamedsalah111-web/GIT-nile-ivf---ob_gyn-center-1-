import { supabase } from '../src/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartCycleData {
    id?: string;
    patient_id: string;
    doctor_id: string;

    // Profile
    phenotype: 'High' | 'Normal' | 'Poor';
    poseidon_group: 1 | 2 | 3 | 4 | null;
    risk_tags: string[];

    // Protocol
    protocol_type: 'Antagonist' | 'Long' | 'Flare' | 'Mini-IVF' | 'Natural';
    starting_dose: number;

    // Status
    status: 'stimulation' | 'trigger' | 'opu' | 'transfer' | 'outcome' | 'cancelled';
    start_date: string;
    trigger_date?: string;
    opu_date?: string;

    // Metadata
    created_at?: string;
    updated_at?: string;
}

export interface SmartVisitData {
    id?: string;
    cycle_id: string;

    day: number;
    visit_date: string;

    // Hormones
    e2: number;
    p4: number;
    lh: number;

    // Ultrasound
    follicles_right: number[];
    follicles_left: number[];
    endometrium_thickness: number;
    endometrium_pattern?: 'trilaminar' | 'homogeneous' | 'irregular';

    // Medication
    fsh_dose: number;
    hmg_dose: number;
    antagonist_started?: boolean;

    // Calculated
    total_follicles?: number;
    follicles_over_14?: number;
    follicles_over_17?: number;

    notes?: string;
    created_at?: string;
}

export interface SmartAlert {
    type: 'ohss' | 'trigger' | 'stagnation' | 'luteinization' | 'info';
    severity: 'critical' | 'warning' | 'success' | 'info';
    message: string;
    action?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const smartIVFService = {
    // -------------------------------------------------------------------------
    // CYCLES
    // -------------------------------------------------------------------------

    async createSmartCycle(data: SmartCycleData): Promise<{ data: SmartCycleData | null; error: any }> {
        try {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            const { data: result, error } = await supabase
                .from('smart_ivf_cycles')
                .insert([{
                    id,
                    ...data,
                    risk_tags: JSON.stringify(data.risk_tags),
                    created_at: now,
                    updated_at: now,
                }])
                .select()
                .single();

            if (error) throw error;

            return { data: result, error: null };
        } catch (error) {
            console.error('Error creating smart cycle:', error);
            return { data: null, error };
        }
    },

    async getSmartCycle(cycleId: string): Promise<{ data: SmartCycleData | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('smart_ivf_cycles')
                .select('*')
                .eq('id', cycleId)
                .single();

            if (error) throw error;

            return {
                data: {
                    ...data,
                    risk_tags: JSON.parse(data.risk_tags || '[]'),
                },
                error: null,
            };
        } catch (error) {
            console.error('Error fetching smart cycle:', error);
            return { data: null, error };
        }
    },

    async updateSmartCycle(cycleId: string, updates: Partial<SmartCycleData>): Promise<{ error: any }> {
        try {
            const updateData: any = {
                ...updates,
                updated_at: new Date().toISOString(),
            };

            if (updates.risk_tags) {
                updateData.risk_tags = JSON.stringify(updates.risk_tags);
            }

            const { error } = await supabase
                .from('smart_ivf_cycles')
                .update(updateData)
                .eq('id', cycleId);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Error updating smart cycle:', error);
            return { error };
        }
    },

    // -------------------------------------------------------------------------
    // VISITS
    // -------------------------------------------------------------------------

    async addVisit(visit: SmartVisitData): Promise<{ data: SmartVisitData | null; error: any }> {
        try {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            // Calculate derived fields
            const allFollicles = [...visit.follicles_right, ...visit.follicles_left];
            const total_follicles = allFollicles.length;
            const follicles_over_14 = allFollicles.filter(f => f >= 14).length;
            const follicles_over_17 = allFollicles.filter(f => f >= 17).length;

            const { data, error } = await supabase
                .from('smart_ivf_visits')
                .insert([{
                    id,
                    ...visit,
                    follicles_right: JSON.stringify(visit.follicles_right),
                    follicles_left: JSON.stringify(visit.follicles_left),
                    total_follicles,
                    follicles_over_14,
                    follicles_over_17,
                    created_at: now,
                }])
                .select()
                .single();

            if (error) throw error;

            return {
                data: {
                    ...data,
                    follicles_right: JSON.parse(data.follicles_right),
                    follicles_left: JSON.parse(data.follicles_left),
                },
                error: null,
            };
        } catch (error) {
            console.error('Error adding visit:', error);
            return { data: null, error };
        }
    },

    async getVisits(cycleId: string): Promise<{ data: SmartVisitData[]; error: any }> {
        try {
            const { data, error } = await supabase
                .from('smart_ivf_visits')
                .select('*')
                .eq('cycle_id', cycleId)
                .order('day', { ascending: true });

            if (error) throw error;

            const visits = (data || []).map(v => ({
                ...v,
                follicles_right: JSON.parse(v.follicles_right || '[]'),
                follicles_left: JSON.parse(v.follicles_left || '[]'),
            }));

            return { data: visits, error: null };
        } catch (error) {
            console.error('Error fetching visits:', error);
            return { data: [], error };
        }
    },

    async updateVisit(visitId: string, updates: Partial<SmartVisitData>): Promise<{ error: any }> {
        try {
            const updateData: any = { ...updates };

            if (updates.follicles_right) {
                updateData.follicles_right = JSON.stringify(updates.follicles_right);
                updateData.follicles_left = JSON.stringify(updates.follicles_left || []);

                const allFollicles = [...updates.follicles_right, ...(updates.follicles_left || [])];
                updateData.total_follicles = allFollicles.length;
                updateData.follicles_over_14 = allFollicles.filter(f => f >= 14).length;
                updateData.follicles_over_17 = allFollicles.filter(f => f >= 17).length;
            }

            const { error } = await supabase
                .from('smart_ivf_visits')
                .update(updateData)
                .eq('id', visitId);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Error updating visit:', error);
            return { error };
        }
    },

    async deleteVisit(visitId: string): Promise<{ error: any }> {
        try {
            const { error } = await supabase
                .from('smart_ivf_visits')
                .delete()
                .eq('id', visitId);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Error deleting visit:', error);
            return { error };
        }
    },

    // -------------------------------------------------------------------------
    // SMART ALERTS
    // -------------------------------------------------------------------------

    analyzeForAlerts(visits: SmartVisitData[]): SmartAlert[] {
        const alerts: SmartAlert[] = [];

        if (visits.length === 0) return alerts;

        const lastVisit = visits[visits.length - 1];
        const allFollicles = [...lastVisit.follicles_right, ...lastVisit.follicles_left];
        const totalFollicles = allFollicles.length;
        const folliclesOver17 = allFollicles.filter(f => f >= 17).length;
        const maxFollicle = Math.max(...allFollicles, 0);

        // OHSS Risk
        if (lastVisit.e2 > 3000 || totalFollicles > 15) {
            alerts.push({
                type: 'ohss',
                severity: 'critical',
                message: 'High OHSS Risk detected!',
                action: 'Consider GnRH Agonist Trigger (Lupron) instead of hCG',
            });
        }

        // Trigger Ready
        if (folliclesOver17 >= 3) {
            alerts.push({
                type: 'trigger',
                severity: 'success',
                message: `Trigger Ready: ${folliclesOver17} follicles ≥17mm`,
                action: 'Schedule trigger injection within 24-36 hours',
            });
        }

        // Stagnation
        if (visits.length >= 3) {
            const recentVisits = visits.slice(-3);
            let stagnation = true;

            for (let i = 1; i < recentVisits.length; i++) {
                const prevMax = Math.max(...recentVisits[i - 1].follicles_right, ...recentVisits[i - 1].follicles_left, 0);
                const currMax = Math.max(...recentVisits[i].follicles_right, ...recentVisits[i].follicles_left, 0);
                if (currMax - prevMax >= 1) {
                    stagnation = false;
                    break;
                }
            }

            if (stagnation) {
                alerts.push({
                    type: 'stagnation',
                    severity: 'warning',
                    message: 'Follicle growth stagnation detected (<1mm/day)',
                    action: 'Consider increasing gonadotropin dose by 75-150 IU',
                });
            }
        }

        // Premature Luteinization
        if (lastVisit.p4 > 1.5 && maxFollicle < 17) {
            alerts.push({
                type: 'luteinization',
                severity: 'warning',
                message: 'Elevated P4 before trigger - Risk of premature luteinization',
                action: 'Consider triggering soon or freeze-all strategy',
            });
        }

        return alerts;
    },

    // -------------------------------------------------------------------------
    // STATISTICS
    // -------------------------------------------------------------------------

    async getCycleStatistics(doctorId: string): Promise<{
        totalCycles: number;
        byPhenotype: Record<string, number>;
        byProtocol: Record<string, number>;
        avgFollicles: number;
    }> {
        try {
            const { data: cycles } = await supabase
                .from('smart_ivf_cycles')
                .select('*')
                .eq('doctor_id', doctorId);

            const stats = {
                totalCycles: cycles?.length || 0,
                byPhenotype: { High: 0, Normal: 0, Poor: 0 },
                byProtocol: {},
                avgFollicles: 0,
            };

            cycles?.forEach(c => {
                stats.byPhenotype[c.phenotype as keyof typeof stats.byPhenotype]++;
                stats.byProtocol[c.protocol_type] = (stats.byProtocol[c.protocol_type] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return {
                totalCycles: 0,
                byPhenotype: { High: 0, Normal: 0, Poor: 0 },
                byProtocol: {},
                avgFollicles: 0,
            };
        }
    },
};

export default smartIVFService;
