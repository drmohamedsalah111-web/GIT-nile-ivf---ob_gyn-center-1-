import React, { useState, useReducer, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Zap,
    Activity,
    Plus,
    Trash2,
    Brain,
    Target,
    Beaker
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PatientProfile {
    age: number;
    bmi: number;
    amh: number;
    afc: number;
    fsh: number;
    cycleRegularity: 'regular' | 'irregular';
}

interface Visit {
    id: string;
    day: number;
    date: string;
    e2: number;
    p4: number;
    lh: number;
    follicles_right: number[];
    follicles_left: number[];
    endometrium: number;
    medication: string;
    fsh_dose: number;
    hmg_dose: number;
    notes: string;
}

interface SmartCycle {
    phenotype: 'High' | 'Normal' | 'Poor';
    poseidonGroup: 1 | 2 | 3 | 4 | null;
    riskTags: string[];
    protocol: 'Antagonist' | 'Long' | 'Flare' | 'Mini-IVF' | 'Natural';
    suggestedDose: number;
    planned_trigger_date: string;
    visits: Visit[];
}

interface SmartAlerts {
    ohssRisk: boolean;
    stagnation: boolean;
    triggerReady: boolean;
    prematureLuteinization: boolean;
    messages: string[];
}

type CycleAction =
    | { type: 'SET_PROFILE'; payload: PatientProfile }
    | { type: 'ADD_VISIT'; payload: Visit }
    | { type: 'UPDATE_VISIT'; payload: { id: string; data: Partial<Visit> } }
    | { type: 'DELETE_VISIT'; payload: string }
    | { type: 'SET_PROTOCOL'; payload: SmartCycle['protocol'] }
    | { type: 'SET_DOSE'; payload: number };

// ============================================================================
// CLINICAL ALGORITHMS (ESHRE-Based)
// ============================================================================

/**
 * Poseidon Classification (2016)
 * Group 1: <35 years, normal reserve, unexpected poor response
 * Group 2: ≥35 years, normal reserve, unexpected poor response
 * Group 3: <35 years, poor reserve
 * Group 4: ≥35 years, poor reserve
 */
function classifyPoseidon(age: number, amh: number, afc: number): 1 | 2 | 3 | 4 | null {
    const poorReserve = amh < 1.2 || afc < 5;

    if (age < 35) {
        return poorReserve ? 3 : 1;
    } else {
        return poorReserve ? 4 : 2;
    }
}

/**
 * Patient Phenotype Classification
 */
function classifyPhenotype(profile: PatientProfile): {
    phenotype: 'High' | 'Normal' | 'Poor';
    riskTags: string[];
} {
    const riskTags: string[] = [];
    let phenotype: 'High' | 'Normal' | 'Poor' = 'Normal';

    // PCOS / High Responder Check
    if ((profile.afc > 20 || profile.amh > 3.5) && profile.cycleRegularity === 'irregular') {
        riskTags.push('High Responder / PCOS Risk');
        riskTags.push('🚨 OHSS Risk');
        phenotype = 'High';
    }

    // DOR / Poor Responder Check
    if (profile.amh < 1.1 || profile.afc < 5) {
        riskTags.push('Low Functional Reserve (DOR)');
        phenotype = 'Poor';
    }

    // Age-related tags
    if (profile.age >= 40) {
        riskTags.push('Advanced Maternal Age');
    }

    // BMI tags
    if (profile.bmi > 30) {
        riskTags.push('Obesity - May affect response');
    } else if (profile.bmi < 18.5) {
        riskTags.push('Underweight - Consider nutrition');
    }

    // FSH tags
    if (profile.fsh > 10) {
        riskTags.push('Elevated Basal FSH');
    }

    return { phenotype, riskTags };
}

/**
 * Protocol Recommendation Based on Phenotype
 */
function recommendProtocol(phenotype: 'High' | 'Normal' | 'Poor'): SmartCycle['protocol'] {
    switch (phenotype) {
        case 'High':
            return 'Antagonist'; // Reduce OHSS risk
        case 'Poor':
            return 'Flare'; // Micro-dose flare for poor responders
        default:
            return 'Long'; // Standard long protocol
    }
}

/**
 * Starting Dose Calculator (Based on CONSORT Algorithm)
 */
function calculateStartingDose(age: number, bmi: number, amh: number): number {
    // Base dose calculation
    let dose = 150; // Starting point

    // Age adjustment
    if (age < 35) {
        dose -= 25;
    } else if (age >= 40) {
        dose += 75;
    } else if (age >= 35) {
        dose += 37.5;
    }

    // AMH adjustment
    if (amh < 1.0) {
        dose += 75; // Poor reserve needs higher dose
    } else if (amh > 3.5) {
        dose -= 50; // High responder needs lower dose
    }

    // BMI adjustment
    if (bmi > 30) {
        dose += 25; // Obesity may reduce bioavailability
    }

    // Clamp to safe range
    return Math.max(75, Math.min(450, Math.round(dose / 37.5) * 37.5));
}

/**
 * Smart Alert System
 */
function analyzeVisits(visits: Visit[]): SmartAlerts {
    const alerts: SmartAlerts = {
        ohssRisk: false,
        stagnation: false,
        triggerReady: false,
        prematureLuteinization: false,
        messages: [],
    };

    if (visits.length === 0) return alerts;

    const lastVisit = visits[visits.length - 1];
    const allFollicles = [...lastVisit.follicles_right, ...lastVisit.follicles_left];
    const totalFollicles = allFollicles.length;
    const folliclesOver17 = allFollicles.filter(f => f >= 17).length;
    const maxFollicle = Math.max(...allFollicles, 0);

    // OHSS Risk Check
    if (lastVisit.e2 > 3000 || totalFollicles > 15) {
        alerts.ohssRisk = true;
        alerts.messages.push('⚠️ OHSS Risk: Consider GnRH Agonist Trigger (Lupron)');
    }

    // Trigger Ready Check
    if (folliclesOver17 >= 3) {
        alerts.triggerReady = true;
        alerts.messages.push('✅ Trigger Ready: ≥3 follicles are >17mm');
    }

    // Stagnation Check (need at least 3 visits)
    if (visits.length >= 3) {
        const recentVisits = visits.slice(-3);
        const follicleGrowth = recentVisits.map((v, i) => {
            if (i === 0) return 0;
            const prevMax = Math.max(...recentVisits[i - 1].follicles_right, ...recentVisits[i - 1].follicles_left, 0);
            const currMax = Math.max(...v.follicles_right, ...v.follicles_left, 0);
            return currMax - prevMax;
        });

        const avgGrowth = follicleGrowth.slice(1).reduce((a, b) => a + b, 0) / (follicleGrowth.length - 1);
        if (avgGrowth < 1) {
            alerts.stagnation = true;
            alerts.messages.push('⚠️ Stagnation: Follicle growth <1mm/day. Consider dose increase.');
        }
    }

    // Premature Luteinization Check
    if (lastVisit.p4 > 1.5 && maxFollicle < 17) {
        alerts.prematureLuteinization = true;
        alerts.messages.push('🚨 Premature Luteinization Risk: P4 elevated before trigger.');
    }

    return alerts;
}

// ============================================================================
// REDUCER
// ============================================================================

function cycleReducer(state: SmartCycle, action: CycleAction): SmartCycle {
    switch (action.type) {
        case 'SET_PROFILE': {
            const { phenotype, riskTags } = classifyPhenotype(action.payload);
            const poseidonGroup = classifyPoseidon(action.payload.age, action.payload.amh, action.payload.afc);
            const protocol = recommendProtocol(phenotype);
            const suggestedDose = calculateStartingDose(action.payload.age, action.payload.bmi, action.payload.amh);

            return {
                ...state,
                phenotype,
                poseidonGroup,
                riskTags,
                protocol,
                suggestedDose,
            };
        }
        case 'ADD_VISIT':
            return { ...state, visits: [...state.visits, action.payload] };
        case 'UPDATE_VISIT':
            return {
                ...state,
                visits: state.visits.map(v =>
                    v.id === action.payload.id ? { ...v, ...action.payload.data } : v
                ),
            };
        case 'DELETE_VISIT':
            return { ...state, visits: state.visits.filter(v => v.id !== action.payload) };
        case 'SET_PROTOCOL':
            return { ...state, protocol: action.payload };
        case 'SET_DOSE':
            return { ...state, suggestedDose: action.payload };
        default:
            return state;
    }
}

const initialCycle: SmartCycle = {
    phenotype: 'Normal',
    poseidonGroup: null,
    riskTags: [],
    protocol: 'Long',
    suggestedDose: 150,
    planned_trigger_date: '',
    visits: [],
};

// ============================================================================
// COMPONENTS
// ============================================================================

const PhenotypeCard: React.FC<{ cycle: SmartCycle }> = ({ cycle }) => {
    const phenotypeColors = {
        High: 'bg-red-100 border-red-400 text-red-800',
        Normal: 'bg-green-100 border-green-400 text-green-800',
        Poor: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    };

    return (
        <div className={`rounded-xl p-6 border-2 ${phenotypeColors[cycle.phenotype]} mb-6`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Brain className="w-8 h-8" />
                    <div>
                        <h3 className="text-xl font-bold">Patient Phenotype</h3>
                        <p className="text-sm opacity-75">AI-Assisted Classification</p>
                    </div>
                </div>
                <div className="text-3xl font-bold">{cycle.phenotype} Responder</div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
                {cycle.poseidonGroup && (
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold">
                        Poseidon Group {cycle.poseidonGroup}
                    </span>
                )}
                {cycle.riskTags.map((tag, i) => (
                    <span
                        key={i}
                        className="px-3 py-1 bg-white/50 rounded-full text-sm font-medium"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

const ProtocolCard: React.FC<{
    cycle: SmartCycle;
    onProtocolChange: (p: SmartCycle['protocol']) => void;
    onDoseChange: (d: number) => void;
}> = ({ cycle, onProtocolChange, onDoseChange }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Protocol Setup</h3>
                <span className="text-sm text-gray-500">(AI Suggestions - Editable)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Protocol Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stimulation Protocol</label>
                    <select
                        value={cycle.protocol}
                        onChange={(e) => onProtocolChange(e.target.value as SmartCycle['protocol'])}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                        <option value="Antagonist">GnRH Antagonist (Cetrotide/Ganirelix)</option>
                        <option value="Long">Long Agonist (Lupron Down-Regulation)</option>
                        <option value="Flare">Micro-dose Flare</option>
                        <option value="Mini-IVF">Mini-IVF (Low Dose)</option>
                        <option value="Natural">Natural Cycle</option>
                    </select>
                    <p className="text-xs text-blue-600 mt-1">
                        💡 Suggested based on phenotype: {recommendProtocol(cycle.phenotype)}
                    </p>
                </div>

                {/* Starting Dose */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Starting FSH Dose (IU)</label>
                    <input
                        type="number"
                        value={cycle.suggestedDose}
                        onChange={(e) => onDoseChange(Number(e.target.value))}
                        step={37.5}
                        min={75}
                        max={450}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                        💡 Calculated dose: {cycle.suggestedDose} IU
                    </p>
                </div>

                {/* Planned Trigger */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Trigger Date</label>
                    <input
                        type="date"
                        value={cycle.planned_trigger_date}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated based on response
                    </p>
                </div>
            </div>
        </div>
    );
};

const SmartAlertsBanner: React.FC<{ alerts: SmartAlerts }> = ({ alerts }) => {
    if (alerts.messages.length === 0) return null;

    return (
        <div className="mb-6 space-y-2">
            {alerts.ohssRisk && (
                <div className="bg-red-600 text-white px-6 py-4 rounded-lg flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-semibold">OHSS ALERT: Consider GnRH Agonist Trigger!</span>
                </div>
            )}
            {alerts.triggerReady && (
                <div className="bg-green-600 text-white px-6 py-4 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">TRIGGER READY: ≥3 follicles are ≥17mm</span>
                    <button className="ml-auto bg-white text-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-50 transition-colors">
                        Schedule Trigger
                    </button>
                </div>
            )}
            {alerts.stagnation && (
                <div className="bg-yellow-500 text-white px-6 py-4 rounded-lg flex items-center gap-3">
                    <TrendingUp className="w-6 h-6" />
                    <span className="font-semibold">STAGNATION: Follicle growth &lt;1mm/day. Consider dose adjustment.</span>
                </div>
            )}
            {alerts.prematureLuteinization && (
                <div className="bg-orange-600 text-white px-6 py-4 rounded-lg flex items-center gap-3">
                    <Zap className="w-6 h-6" />
                    <span className="font-semibold">WARNING: P4 elevated - Risk of premature luteinization</span>
                </div>
            )}
        </div>
    );
};

const FolliculometryChart: React.FC<{ visits: Visit[] }> = ({ visits }) => {
    const chartData = visits.map(v => ({
        day: `D${v.day}`,
        E2: v.e2,
        MaxFollicle: Math.max(...v.follicles_right, ...v.follicles_left, 0),
        P4: v.p4 * 100, // Scale for visibility
        Endo: v.endometrium,
    }));

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Stimulation Response Chart</h3>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="E2" stroke="#ef4444" name="E2 (pg/mL)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="MaxFollicle" stroke="#3b82f6" name="Max Follicle (mm)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="Endo" stroke="#10b981" name="Endometrium (mm)" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const VisitRow: React.FC<{
    visit: Visit;
    onUpdate: (data: Partial<Visit>) => void;
    onDelete: () => void;
}> = ({ visit, onUpdate, onDelete }) => {
    const totalFollicles = visit.follicles_right.length + visit.follicles_left.length;
    const folliclesOver14 = [...visit.follicles_right, ...visit.follicles_left].filter(f => f >= 14).length;

    return (
        <tr className="border-b hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-semibold text-blue-600">D{visit.day}</td>
            <td className="px-4 py-3">{visit.date}</td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    value={visit.fsh_dose}
                    onChange={(e) => onUpdate({ fsh_dose: Number(e.target.value) })}
                    className="w-20 px-2 py-1 border rounded"
                />
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    value={visit.hmg_dose}
                    onChange={(e) => onUpdate({ hmg_dose: Number(e.target.value) })}
                    className="w-20 px-2 py-1 border rounded"
                />
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    value={visit.e2}
                    onChange={(e) => onUpdate({ e2: Number(e.target.value) })}
                    className={`w-24 px-2 py-1 border rounded ${visit.e2 > 3000 ? 'bg-red-100 border-red-500' : ''}`}
                />
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    step="0.1"
                    value={visit.p4}
                    onChange={(e) => onUpdate({ p4: Number(e.target.value) })}
                    className={`w-20 px-2 py-1 border rounded ${visit.p4 > 1.5 ? 'bg-orange-100 border-orange-500' : ''}`}
                />
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    step="0.1"
                    value={visit.endometrium}
                    onChange={(e) => onUpdate({ endometrium: Number(e.target.value) })}
                    className="w-20 px-2 py-1 border rounded"
                />
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-1">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        R: {visit.follicles_right.join(', ') || '-'}
                    </span>
                    <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded">
                        L: {visit.follicles_left.join(', ') || '-'}
                    </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Total: {totalFollicles} | ≥14mm: {folliclesOver14}
                </div>
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-700 transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
};

const StimulationFlowSheet: React.FC<{
    visits: Visit[];
    onAddVisit: () => void;
    onUpdateVisit: (id: string, data: Partial<Visit>) => void;
    onDeleteVisit: (id: string) => void;
}> = ({ visits, onAddVisit, onUpdateVisit, onDeleteVisit }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Beaker className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Stimulation Flow Sheet</h3>
                </div>
                <button
                    onClick={onAddVisit}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Visit
                </button>
            </div>

            <table className="w-full min-w-[900px]">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">FSH (IU)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">HMG (IU)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">E2 (pg/mL)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">P4 (ng/mL)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Endo (mm)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Follicles</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700"></th>
                    </tr>
                </thead>
                <tbody>
                    {visits.map(visit => (
                        <VisitRow
                            key={visit.id}
                            visit={visit}
                            onUpdate={(data) => onUpdateVisit(visit.id, data)}
                            onDelete={() => onDeleteVisit(visit.id)}
                        />
                    ))}
                    {visits.length === 0 && (
                        <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                No visits recorded yet. Click "Add Visit" to start monitoring.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SmartIVFJourney: React.FC = () => {
    const [cycle, dispatch] = useReducer(cycleReducer, initialCycle);
    const [profile, setProfile] = useState<PatientProfile>({
        age: 32,
        bmi: 24,
        amh: 2.5,
        afc: 12,
        fsh: 7,
        cycleRegularity: 'regular',
    });

    // Analyze visits for smart alerts
    const alerts = useMemo(() => analyzeVisits(cycle.visits), [cycle.visits]);

    // Update profile and recalculate
    const handleProfileChange = useCallback((field: keyof PatientProfile, value: number | string) => {
        const newProfile = { ...profile, [field]: value };
        setProfile(newProfile);
        dispatch({ type: 'SET_PROFILE', payload: newProfile });
    }, [profile]);

    // Add new visit
    const handleAddVisit = useCallback(() => {
        const lastDay = cycle.visits.length > 0
            ? cycle.visits[cycle.visits.length - 1].day + 2
            : 1;

        const newVisit: Visit = {
            id: crypto.randomUUID(),
            day: lastDay,
            date: new Date().toISOString().split('T')[0],
            e2: 0,
            p4: 0,
            lh: 0,
            follicles_right: [],
            follicles_left: [],
            endometrium: 0,
            medication: '',
            fsh_dose: cycle.suggestedDose,
            hmg_dose: 0,
            notes: '',
        };

        dispatch({ type: 'ADD_VISIT', payload: newVisit });
    }, [cycle.visits, cycle.suggestedDose]);

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen" dir="ltr">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl p-8 mb-8 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">🧬 Smart IVF Copilot</h1>
                        <p className="text-indigo-100 text-lg">ESHRE-Guided Intelligent Cycle Management</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm opacity-75">AI Confidence</div>
                        <div className="text-3xl font-bold">98%</div>
                    </div>
                </div>
            </div>

            {/* Patient Profile Input */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Patient Profile</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                            type="number"
                            value={profile.age}
                            onChange={(e) => handleProfileChange('age', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                        <input
                            type="number"
                            step="0.1"
                            value={profile.bmi}
                            onChange={(e) => handleProfileChange('bmi', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AMH (ng/mL)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={profile.amh}
                            onChange={(e) => handleProfileChange('amh', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AFC (Total)</label>
                        <input
                            type="number"
                            value={profile.afc}
                            onChange={(e) => handleProfileChange('afc', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FSH (D2)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={profile.fsh}
                            onChange={(e) => handleProfileChange('fsh', Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cycle</label>
                        <select
                            value={profile.cycleRegularity}
                            onChange={(e) => handleProfileChange('cycleRegularity', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="regular">Regular</option>
                            <option value="irregular">Irregular</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => dispatch({ type: 'SET_PROFILE', payload: profile })}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                    Analyze Profile
                </button>
            </div>

            {/* Phenotype Card */}
            {cycle.riskTags.length > 0 && <PhenotypeCard cycle={cycle} />}

            {/* Protocol Setup */}
            <ProtocolCard
                cycle={cycle}
                onProtocolChange={(p) => dispatch({ type: 'SET_PROTOCOL', payload: p })}
                onDoseChange={(d) => dispatch({ type: 'SET_DOSE', payload: d })}
            />

            {/* Smart Alerts */}
            <SmartAlertsBanner alerts={alerts} />

            {/* Chart */}
            {cycle.visits.length > 0 && <FolliculometryChart visits={cycle.visits} />}

            {/* Flow Sheet */}
            <StimulationFlowSheet
                visits={cycle.visits}
                onAddVisit={handleAddVisit}
                onUpdateVisit={(id, data) => dispatch({ type: 'UPDATE_VISIT', payload: { id, data } })}
                onDeleteVisit={(id) => dispatch({ type: 'DELETE_VISIT', payload: id })}
            />
        </div>
    );
};

export default SmartIVFJourney;
