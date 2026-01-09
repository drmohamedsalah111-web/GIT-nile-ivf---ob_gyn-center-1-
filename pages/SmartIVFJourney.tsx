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
    FileText,
    Info,
    Users,
    ArrowRight
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
// COMPONENT: PREMIUM AI PROTOCOL PROPOSAL CARD (v4.0)
// ============================================================================

const ProtocolProposalCard: React.FC<{
    plan: PrescriptionPlan,
    onApply: () => void
}> = ({ plan, onApply }) => {
    const [showGuide, setShowGuide] = useState(false);
    const [showMedAlts, setShowMedAlts] = useState<number | null>(null);

    return (
        <div className="relative group perspective-1000 mb-12">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Brain className="w-48 h-48" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="bg-indigo-500/30 backdrop-blur-md text-indigo-100 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> AI SUGGESTED PROTOCOL
                            </span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${plan.riskProfile === 'Low' ? 'bg-green-500/20 text-green-200 border-green-500/30' :
                                plan.riskProfile === 'Moderate' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-200 border-red-500/30'
                                }`}>
                                <AlertTriangle className="w-3 h-3" /> RISK: {plan.riskProfile.toUpperCase()}
                            </span>
                            <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 ml-auto">
                                {plan.startDay}
                            </span>
                        </div>

                        <h2 className="text-4xl font-extrabold mb-2 tracking-tight">{plan.protocolName}</h2>
                        <p className="text-indigo-100 text-lg max-w-3xl leading-relaxed opacity-90">
                            {plan.explanation}
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Side: Rationale & Medications */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-500" /> Clinical Rationale
                                </h3>
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-gray-700 leading-relaxed italic">
                                    "{plan.successRationale}"
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Syringe className="w-4 h-4 text-purple-500" /> Medication Regimen
                                </h3>
                                <div className="space-y-3">
                                    {plan.medications.map((med, idx) => (
                                        <div key={idx} className="relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className={`p-3 rounded-xl ${med.role === 'Stimulation' ? 'bg-blue-50 text-blue-600' :
                                                        med.role === 'Suppression' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-pink-50 text-pink-600'
                                                        }`}>
                                                        {med.role === 'Stimulation' ? <Zap size={24} /> : <Syringe size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">{med.role}</div>
                                                        <div className="text-xl font-bold text-gray-900">{med.drugName}</div>
                                                        <div className="text-indigo-600 font-black text-lg">{med.dose}</div>
                                                        <p className="text-xs text-gray-500 mt-1">{med.instruction}</p>
                                                    </div>
                                                </div>

                                                {med.alternatives && med.alternatives.length > 0 && (
                                                    <button
                                                        onClick={() => setShowMedAlts(showMedAlts === idx ? null : idx)}
                                                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded transition-colors"
                                                    >
                                                        {showMedAlts === idx ? 'CLOSE' : 'ALTERNATIVES'}
                                                    </button>
                                                )}
                                            </div>

                                            {showMedAlts === idx && med.alternatives && (
                                                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Equivalent Options:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {med.alternatives.map(alt => (
                                                            <span key={alt} className="bg-gray-50 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md border border-gray-200">
                                                                {alt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Step-by-Step Guide */}
                        <div className="bg-gray-950 rounded-2xl p-8 text-indigo-50 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Comprehensive Protocol Guide
                            </h3>

                            <div className="space-y-6 relative z-10">
                                {plan.protocolGuide.map((step, i) => (
                                    <div key={i} className="flex gap-4 group/step">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 group-hover/step:bg-indigo-500 group-hover/step:text-white transition-all duration-300">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-gray-300 group-hover/step:text-white transition-colors leading-relaxed">
                                                {step}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <div className="flex gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg h-fit">
                                        <Info className="w-4 h-4 text-indigo-300" />
                                    </div>
                                    <p className="text-xs text-indigo-200/80 leading-relaxed">
                                        <span className="font-bold block text-indigo-200 mb-1">Clinic Note:</span>
                                        {plan.clinicalNote}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                            <Clock className="w-4 h-4" /> Estimated Duration: 10-14 days of stimulation
                        </div>

                        <button
                            onClick={onApply}
                            className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <CheckCircle className="w-6 h-6" />
                            IMPLEMENT PROTOCOL
                        </button>
                    </div>
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
            {/* Premium Header */}
            <div className="relative mb-10 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white rounded-3xl p-8 shadow-2xl overflow-hidden border border-white/10">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                        <Brain className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-inner">
                                    <Brain className="w-10 h-10 text-indigo-300" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-4xl font-black tracking-tight">Smart IVF Copilot</h1>
                                        <span className="bg-indigo-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-400">v3.5 ALPHA</span>
                                    </div>
                                    <p className="text-indigo-200/80 font-medium tracking-wide">Intelligent Protocol Design & Precision Cycle Optimization</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block h-12 w-px bg-white/10 mx-2"></div>
                            <button
                                onClick={handleSaveCycle}
                                disabled={isSaving || !selectedPatientId}
                                className="group/btn relative px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-sm shadow-xl hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-indigo-50 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative flex items-center gap-3">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {cycle.id ? 'UPDATE CYCLE DATA' : 'FINALIZE & SAVE NEW CYCLE'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Selection & Assessment Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
                {/* STEP 1: Patient Selection Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> Patient Directory
                            </h3>
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                                {patients.length} TOTAL
                            </span>
                        </div>

                        <div className="p-4 bg-white border-b border-gray-50">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Find patient..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 text-sm font-medium transition-all"
                                />
                            </div>
                        </div>

                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {patientsLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                    <span className="text-[10px] font-black text-gray-300 uppercase">Synchronizing...</span>
                                </div>
                            ) : patients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePatientSelect(String(p.id))}
                                    className={`relative w-full text-left p-4 rounded-xl transition-all group/p ${selectedPatientId === String(p.id)
                                        ? 'bg-indigo-600 shadow-lg shadow-indigo-100'
                                        : 'hover:bg-indigo-50 text-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${selectedPatientId === String(p.id) ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            {p.name?.substring(0, 1) || 'P'}
                                        </div>
                                        <div>
                                            <div className={`font-black text-sm tracking-tight ${selectedPatientId === String(p.id) ? 'text-white' : 'text-gray-900 font-bold'}`}>
                                                {p.name}
                                            </div>
                                            <div className={`text-[10px] font-bold uppercase tracking-tighter ${selectedPatientId === String(p.id) ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                {p.age || '??'} YEARS OLD
                                            </div>
                                        </div>
                                    </div>
                                    {selectedPatientId === String(p.id) && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* STEP 2: Clinical Assessment Card */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden h-full flex flex-col">
                        <div className="bg-gray-50/80 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Activity className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Clinical Parameters</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Real-time Patient Phenotyping</p>
                                </div>
                            </div>

                            {selectedPatientId && (
                                <button
                                    onClick={runAiAnalysis}
                                    className="group relative px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Zap className="w-4 h-4 fill-white animate-pulse" />
                                    GENERATE AI PROPOSAL
                                </button>
                            )}
                        </div>

                        <div className="p-8 flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                            {[
                                { l: 'Age', k: 'age', s: 1, unit: 'yr', icon: <User className="w-3 h-3" /> },
                                { l: 'BMI', k: 'bmi', s: 0.1, unit: 'kg/m²', icon: <TrendingUp className="w-3 h-3" /> },
                                { l: 'AMH', k: 'amh', s: 0.1, unit: 'ng/ml', icon: <Beaker className="w-3 h-3" /> },
                                { l: 'AFC', k: 'afc', s: 1, unit: 'antral', icon: <Target className="w-3 h-3" /> },
                                { l: 'Base FSH', k: 'fsh', s: 0.1, unit: 'mIU/ml', icon: <Activity className="w-3 h-3" /> }
                            ].map((f: any) => (
                                <div key={f.k} className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {f.icon} {f.l}
                                    </label>
                                    <div className="relative group/input">
                                        <input
                                            type="number" step={f.s}
                                            value={profile[f.k as keyof PatientProfile] as number}
                                            onChange={e => updateProfile(f.k, Number(e.target.value))}
                                            className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-black text-xl text-gray-900"
                                        />
                                        <span className="absolute right-4 bottom-2 text-[10px] font-black text-indigo-500/40 uppercase pointer-events-none group-focus-within/input:text-indigo-500 transition-colors">
                                            {f.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <AlertTriangle className="w-3 h-3" /> Phenotype
                                </label>
                                <button
                                    onClick={() => updateProfile('pcos', !profile.pcos)}
                                    className={`w-full group px-4 py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${profile.pcos
                                        ? 'bg-red-50 border-red-200 text-red-600 shadow-inner'
                                        : 'bg-gray-50 border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:bg-white hover:border-indigo-300'
                                        }`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${profile.pcos ? 'text-red-500' : 'text-gray-400'}`}>PCOS Diagnostic</span>
                                    <span className="font-black text-lg leading-none">{profile.pcos ? 'CONFIRMED' : 'NEGATIVE'}</span>
                                </button>
                            </div>
                        </div>

                        {!selectedPatientId && (
                            <div className="p-8 bg-indigo-50/30 border-t border-indigo-50 flex items-center justify-center">
                                <div className="flex items-center gap-3 text-indigo-600/60 font-black text-xs uppercase tracking-widest">
                                    <ArrowRight className="w-4 h-4 animate-bounce-x" />
                                    Select a patient to begin AI cycle analysis
                                </div>
                            </div>
                        )}
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
