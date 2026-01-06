import React, { useState, useReducer, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Beaker,
    Save,
    User,
    Search,
    Loader2,
    Syringe,
    Pill,
    Clock,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usePatients } from '../src/hooks/usePatients';
import smartIVFService, { SmartCycleData, SmartVisitData } from '../services/smartIVFService';
import { dbService } from '../services/dbService';
import { ClinicalEngine, Recommendation, PrescriptionPlan } from '../utils/ClinicalEngine';
import FollicleInputModal from '../components/ivf/FollicleInputModal';
import ClinicalInsightsPanel from '../components/ivf/ClinicalInsightsPanel';

// ============================================================================
// TYPES & INTERFACES (Frontend)
// ============================================================================

interface PatientProfile {
    id?: string | number;
    name?: string;
    age: number;
    bmi: number;
    amh: number;
    afc: number;
    fsh: number;
    cycleRegularity: 'regular' | 'irregular';
    pcos?: boolean;
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
    id?: string;
    status: 'stimulation' | 'trigger' | 'opu' | 'transfer' | 'outcome' | 'cancelled';
    phenotype: 'High' | 'Normal' | 'Poor';
    poseidonGroup: 1 | 2 | 3 | 4 | null;
    riskTags: string[];
    protocol: string;
    suggestedDose: number;
    visits: Visit[];
}

// ============================================================================
// COMPONENT: AI PROTOCOL PROPOSAL CARD (New)
// ============================================================================

const ProtocolProposalCard: React.FC<{
    plan: PrescriptionPlan,
    onApply: () => void
}> = ({ plan, onApply }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-xl p-6 mb-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain className="w-32 h-32 text-indigo-900" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{plan.protocolName}</h3>
                        <p className="text-gray-600 font-medium">{plan.explanation}</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-lg p-1 border border-indigo-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {plan.medications.map((med, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
                                <div className={`p-2 rounded-full ${med.role === 'Stimulation' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                    {med.role === 'Stimulation' ? <Syringe size={20} /> : <Pill size={20} />}
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{med.role}</div>
                                    <div className="font-bold text-lg text-gray-800">{med.drugName}</div>
                                    <div className="text-indigo-600 font-mono font-bold">{med.dose}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {med.instruction}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onApply}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Accept & Start Cycle
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const SmartIVFJourney: React.FC = () => {
    // Hooks
    const navigate = useNavigate();
    const { patients, isLoading: patientsLoading, searchQuery, setSearchQuery } = usePatients();

    // State
    const [profile, setProfile] = useState<PatientProfile>({
        age: 32, bmi: 24, amh: 2.5, afc: 12, fsh: 7, cycleRegularity: 'regular', pcos: false
    });

    const [cycle, setCycle] = useState<SmartCycle>({
        status: 'stimulation',
        phenotype: 'Normal',
        poseidonGroup: 1,
        riskTags: [],
        protocol: '',
        suggestedDose: 150,
        visits: [],
    });

    const [aiProposal, setAiProposal] = useState<PrescriptionPlan | null>(null);

    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [showFollicleModal, setShowFollicleModal] = useState(false);
    const [activeVisitId, setActiveVisitId] = useState<string | null>(null);

    // Derived
    const clinicalRecs = useMemo(() => {
        return ClinicalEngine.analyzeMonitoring({
            age: profile.age,
            bmi: profile.bmi,
            amh: profile.amh,
            afc: profile.afc,
            pcos: profile.pcos || false,
            history: { previous_ohss: false, poor_response: false, recurrent_implantation_failure: false },
            current_cycle: cycle.visits.length > 0 ? {
                day: cycle.visits[cycle.visits.length - 1].day,
                e2: cycle.visits[cycle.visits.length - 1].e2,
                p4: cycle.visits[cycle.visits.length - 1].p4,
                lead_follicle: Math.max(...cycle.visits[cycle.visits.length - 1].follicles_right, ...cycle.visits[cycle.visits.length - 1].follicles_left, 0),
                follicles_10mm: 0, // Simplified for demo
                follicles_14mm: 0,
                endometrium: cycle.visits[cycle.visits.length - 1].endometrium
            } : undefined
        });
    }, [cycle.visits, profile]);

    // Handlers
    const handlePatientSelect = (patientId: string) => {
        setSelectedPatientId(patientId);
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            setProfile(prev => ({
                ...prev,
                id: patient.id,
                name: patient.name,
                age: patient.age || 30,
            }));
            setCycle(prev => ({ ...prev, visits: [], id: undefined })); // Reset cycle
            setAiProposal(null);
        }
    };

    const runAiAnalysis = () => {
        // 1. Generate Proposal
        const proposal = ClinicalEngine.suggestProtocol({
            age: profile.age,
            bmi: profile.bmi,
            amh: profile.amh,
            afc: profile.afc,
            pcos: profile.pcos || false,
            history: {
                previous_ohss: false,
                poor_response: profile.amh < 1.0,
                recurrent_implantation_failure: false
            }
        });
        setAiProposal(proposal);
        toast.success('AI Analysis Complete');
    };

    const applyProposal = () => {
        if (!aiProposal) return;
        setCycle(prev => ({
            ...prev,
            protocol: aiProposal.protocolName,
            // Extract dose number from string "225 IU Daily" -> 225 (simple regex/parse)
            suggestedDose: parseInt(aiProposal.medications.find(m => m.role === 'Stimulation')?.dose || '150') || 150,
        }));
        toast.success('Protocol Applied');

        // Auto-create first visit (Day 1)
        handleAddVisit(1);
    };

    const handleSaveCycle = async () => {
        if (!selectedPatientId) {
            toast.error('Please select a patient first');
            return;
        }
        setIsSaving(true);
        try {
            const doctor = await dbService.getDoctorIdOrThrow();
            const cycleData: SmartCycleData = {
                patient_id: selectedPatientId,
                doctor_id: doctor.doctorId,
                phenotype: cycle.phenotype,
                poseidon_group: cycle.poseidonGroup,
                risk_tags: cycle.riskTags,
                protocol_type: cycle.protocol as any, // Cast for loose string match
                starting_dose: cycle.suggestedDose,
                status: cycle.status,
                start_date: new Date().toISOString(),
            };

            let cycleId = cycle.id;
            if (cycleId) {
                await smartIVFService.updateSmartCycle(cycleId, cycleData);
                toast.success('Cycle updated');
            } else {
                const { data, error } = await smartIVFService.createSmartCycle(cycleData);
                if (error) throw error;
                cycleId = data!.id!;
                setCycle(prev => ({ ...prev, id: cycleId }));
                toast.success('New smart cycle created');
            }
            setIsSaving(false);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to save: ' + error.message);
            setIsSaving(false);
        }
    };

    const handleAddVisit = (dayOffset = 2) => {
        const lastDay = cycle.visits.length > 0 ? cycle.visits[cycle.visits.length - 1].day : 0;
        const newVisit: Visit = {
            id: crypto.randomUUID(),
            day: lastDay + dayOffset, // Increment usually by 2 days
            date: new Date().toISOString().split('T')[0],
            e2: 0, p4: 0, lh: 0,
            follicles_right: [], follicles_left: [], endometrium: 0,
            medication: '',
            fsh_dose: cycle.suggestedDose,
            hmg_dose: 0,
            notes: '',
        };
        setCycle(prev => ({ ...prev, visits: [...prev.visits, newVisit] }));
    };

    const openFollicleModal = (visitId: string) => {
        setActiveVisitId(visitId);
        setShowFollicleModal(true);
    };

    const handleSaveFollicles = (right: number[], left: number[]) => {
        if (activeVisitId) {
            setCycle(prev => ({
                ...prev,
                visits: prev.visits.map(v => v.id === activeVisitId ? { ...v, follicles_right: right, follicles_left: left } : v)
            }));
        }
    };

    // Helper for inline profile edit
    const updateProfile = (key: keyof PatientProfile, val: any) => setProfile(p => ({ ...p, [key]: val }));

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-[Tajawal]" dir="ltr">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Brain className="w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-bold">Smart IVF Copilot <span className="text-sm bg-white/20 px-2 py-1 rounded ml-2">v3.0</span></h1>
                        </div>
                        <p className="text-indigo-100 text-lg">
                            Intelligent Protocol Design & Cycle Monitoring System
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleSaveCycle}
                            disabled={isSaving || !selectedPatientId}
                            className="flex items-center gap-2 bg-white text-indigo-700 px-6 py-2.5 rounded-full font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-lg"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {cycle.id ? 'Save Changes' : 'Save New Cycle'}
                        </button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </div>

            {/* STEP 1: Patient Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-1 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                        <User className="w-5 h-5" />
                        <h3 className="font-bold">Select Patient</h3>
                    </div>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-lg focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {patientsLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-600" /></div>
                        ) : patients.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handlePatientSelect(String(p.id))}
                                className={`w-full text-left p-3 rounded-lg transition-colors border ${selectedPatientId === String(p.id)
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                                    : 'hover:bg-gray-50 border-transparent'
                                    }`}
                            >
                                <div className="font-bold">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.age} years • {p.phone}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* STEP 2: Clinical Parameters */}
                <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-gray-800">
                            <Activity className="w-5 h-5" />
                            <h3 className="font-bold">Assessment & Parameters</h3>
                        </div>
                        {selectedPatientId && (
                            <button
                                onClick={runAiAnalysis}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all text-sm"
                            >
                                <Brain className="w-4 h-4" />
                                Generate Proposal
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { l: 'Age', k: 'age', s: 1 }, { l: 'BMI', k: 'bmi', s: 0.1 },
                            { l: 'AMH', k: 'amh', s: 0.1 }, { l: 'AFC', k: 'afc', s: 1 },
                            { l: 'Base FSH', k: 'fsh', s: 0.1 }
                        ].map((f: any) => (
                            <div key={f.k}>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{f.l}</label>
                                <input
                                    type="number" step={f.s}
                                    value={profile[f.k as keyof PatientProfile] as number}
                                    onChange={e => updateProfile(f.k, Number(e.target.value))}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 font-mono font-bold text-center"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">PCOS?</label>
                            <button
                                onClick={() => updateProfile('pcos', !profile.pcos)}
                                className={`w-full p-2 border rounded-lg font-bold text-sm transition-colors ${profile.pcos ? 'bg-pink-100 border-pink-300 text-pink-700' : 'bg-gray-50 text-gray-400'}`}
                            >
                                {profile.pcos ? 'YES' : 'NO'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* STEP 3: AI Proposal (Conditional) */}
            {aiProposal && !cycle.protocol && (
                <ProtocolProposalCard plan={aiProposal} onApply={applyProposal} />
            )}

            {/* STEP 4: Active Cycle Management */}
            {cycle.protocol && (
                <>
                    {/* Active Monitoring Header */}
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border-l-4 border-green-500 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Protocol</div>
                            <div className="text-xl font-bold text-green-700">{cycle.protocol}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Start Dose</div>
                            <div className="text-xl font-bold text-gray-900">{cycle.suggestedDose} IU</div>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4 justify-end">
                        <button
                            onClick={() => navigate(`/smart-stimulation?patientId=${selectedPatientId}`)}
                            className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Go to Copilot Monitoring
                        </button>
                    </div>

                    {/* Insights Panel (Dynamic) */}
                    <ClinicalInsightsPanel recommendations={clinicalRecs} />

                    {/* Monitoring Sheet */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <TableIcon /> Stimulation Flow Sheet
                            </h3>
                            <button onClick={() => handleAddVisit()} className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                                + Add Visit
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Day</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3 text-center">E2</th>
                                        <th className="p-3 text-center">P4</th>
                                        <th className="p-3 w-48">Follicles (R / L)</th>
                                        <th className="p-3 text-center">Endo</th>
                                        <th className="p-3 text-center">Dose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {cycle.visits.map(v => (
                                        <tr key={v.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-bold text-indigo-600">D{v.day}</td>
                                            <td className="p-3 text-gray-600">{v.date}</td>
                                            <td className="p-3 text-center">
                                                <input type="number"
                                                    className="w-16 text-center border rounded p-1"
                                                    value={v.e2}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setCycle(prev => ({ ...prev, visits: prev.visits.map(x => x.id === v.id ? { ...x, e2: val } : x) }))
                                                    }}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <input type="number" step="0.1"
                                                    className="w-16 text-center border rounded p-1"
                                                    value={v.p4}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setCycle(prev => ({ ...prev, visits: prev.visits.map(x => x.id === v.id ? { ...x, p4: val } : x) }))
                                                    }}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <button onClick={() => openFollicleModal(v.id)} className="w-full text-left text-xs border border-dashed border-gray-300 rounded p-2 hover:border-indigo-400">
                                                    {v.follicles_right.length + v.follicles_left.length === 0 ? 'No Data' : (
                                                        <>
                                                            <span className="text-blue-600 font-bold">R: {v.follicles_right.length}</span> / <span className="text-pink-600 font-bold">L: {v.follicles_left.length}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <input type="number" step="0.1"
                                                    className="w-12 text-center border rounded p-1"
                                                    value={v.endometrium}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setCycle(prev => ({ ...prev, visits: prev.visits.map(x => x.id === v.id ? { ...x, endometrium: val } : x) }))
                                                    }}
                                                />
                                            </td>
                                            <td className="p-3 text-center">{v.fsh_dose}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {cycle.visits.length === 0 && <div className="p-8 text-center text-gray-400">No visits yet. Apply protocol to start.</div>}
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            <FollicleInputModal
                isOpen={showFollicleModal}
                onClose={() => setShowFollicleModal(false)}
                initialRight={cycle.visits.find(v => v.id === activeVisitId)?.follicles_right}
                initialLeft={cycle.visits.find(v => v.id === activeVisitId)?.follicles_left}
                onSave={handleSaveFollicles}
            />
        </div>
    );
};

// Mini Icon wrapper
const TableIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

export default SmartIVFJourney;
