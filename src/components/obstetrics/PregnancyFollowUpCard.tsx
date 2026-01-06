import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ComposedChart, Area, ReferenceLine
} from 'recharts';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    Plus, Calendar, AlertTriangle, TrendingUp, TrendingDown,
    Heart, Baby, Activity, ChevronRight, Edit2
} from 'lucide-react';
import { obstetricsService } from '../../../services/obstetricsService';
import { Pregnancy, AntenatalVisit } from '../../../types';
import toast from 'react-hot-toast';
import EditPregnancyDatesModal from './EditPregnancyDatesModal';

interface PregnancyFollowUpCardProps {
    pregnancyId?: string;
    pregnancy?: Pregnancy;
    visits?: AntenatalVisit[];
    patientName?: string;
    onQuickVisit?: () => void;
    onVisitClick?: (visit: AntenatalVisit) => void;
}

export const PregnancyFollowUpCard: React.FC<PregnancyFollowUpCardProps> = ({
    pregnancyId,
    pregnancy: pregnancyProp,
    visits: visitsProp,
    patientName,
    onQuickVisit,
    onVisitClick
}) => {
    const [pregnancy, setPregnancy] = useState<Pregnancy | null>(pregnancyProp || null);
    const [visits, setVisits] = useState<AntenatalVisit[]>(visitsProp || []);
    const [loading, setLoading] = useState(!pregnancyProp && !!pregnancyId);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

    useEffect(() => {
        if (pregnancyId && !pregnancyProp) {
            fetchData();
        }
    }, [pregnancyId]);

    useEffect(() => {
        if (pregnancyProp) setPregnancy(pregnancyProp);
        if (visitsProp) setVisits(visitsProp);
    }, [pregnancyProp, visitsProp]);

    const fetchData = async () => {
        if (!pregnancyId) return;
        try {
            setLoading(true);
            const [pregnancyData, visitsData] = await Promise.all([
                obstetricsService.getPregnancyById(pregnancyId),
                obstetricsService.getANCVisits(pregnancyId)
            ]);
            setPregnancy(pregnancyData);
            setVisits(visitsData || []);
        } catch (err) {
            console.error('Error fetching pregnancy data:', err);
            toast.error('Failed to load pregnancy data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Gestational Age from LMP
    const calculateGA = (lmpDate: string | undefined, targetDate: Date = new Date()) => {
        if (!lmpDate) return { weeks: 0, days: 0 };
        const lmp = parseISO(lmpDate);
        const totalDays = differenceInDays(targetDate, lmp);
        const weeks = Math.floor(totalDays / 7);
        const days = totalDays % 7;
        return { weeks: Math.max(0, weeks), days: Math.max(0, days) };
    };

    // Calculate EDD (LMP + 280 days)
    const calculateEDD = (lmpDate: string | undefined) => {
        if (!lmpDate) return null;
        return addDays(parseISO(lmpDate), 280);
    };

    // Check if BP is high
    const isBPHigh = (systolic?: number, diastolic?: number) => {
        return (systolic && systolic >= 140) || (diastolic && diastolic >= 90);
    };

    // Format obstetric history (GPA)
    const formatObsHistory = (history?: Pregnancy['obstetric_history']) => {
        if (!history) return 'G? P? A?';
        const { gravida = 0, parity_fullterm = 0, parity_preterm = 0, abortions = 0, living = 0 } = history;
        return `G${gravida} P${parity_fullterm + parity_preterm} A${abortions} L${living}`;
    };

    // Get risk badges
    const getRiskBadges = () => {
        const badges: { label: string; color: string; emoji: string }[] = [];

        if (pregnancy?.risk_level === 'high') {
            badges.push({ label: 'HIGH RISK', color: 'bg-red-100 text-red-800 border-red-300', emoji: '🔴' });
        }

        if (pregnancy?.medical_history?.hypertension) {
            badges.push({ label: 'HTN', color: 'bg-rose-100 text-rose-800 border-rose-300', emoji: '🔴' });
        }
        if (pregnancy?.medical_history?.diabetes) {
            badges.push({ label: 'DM', color: 'bg-orange-100 text-orange-800 border-orange-300', emoji: '🟠' });
        }
        if (pregnancy?.current_risk_factors?.twin_pregnancy) {
            badges.push({ label: 'Twins', color: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '👶👶' });
        }
        if (pregnancy?.current_risk_factors?.rh_negative) {
            badges.push({ label: 'Rh-', color: 'bg-amber-100 text-amber-800 border-amber-300', emoji: '🟡' });
        }
        if (pregnancy?.past_obs_history?.previous_cs) {
            badges.push({ label: 'Previous C/S', color: 'bg-blue-100 text-blue-800 border-blue-300', emoji: '🔵' });
        }

        return badges;
    };

    // Prepare chart data
    const chartData = visits
        .slice()
        .reverse() // Oldest to newest for chart
        .map(visit => {
            const ga = calculateGA(pregnancy?.lmp_date, parseISO(visit.visit_date));
            return {
                week: `${ga.weeks}w`,
                weekNum: ga.weeks,
                weight: visit.weight_kg || null,
                systolic: visit.systolic_bp || null,
                diastolic: visit.diastolic_bp || null,
                date: visit.visit_date
            };
        });

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 mt-4">Loading pregnancy data...</p>
            </div>
        );
    }

    if (!pregnancy) {
        return (
            <div className="p-8 text-center text-gray-600">
                No pregnancy data found
            </div>
        );
    }

    const currentGA = calculateGA(pregnancy.lmp_date);
    const edd = pregnancy.edd_date ? parseISO(pregnancy.edd_date) : calculateEDD(pregnancy.lmp_date);
    const riskBadges = getRiskBadges();

    return (
        <div className="space-y-4" dir="rtl">
            {/* ============================================ */}
            {/* SECTION A: Pregnancy Header */}
            {/* ============================================ */}
            <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50 rounded-2xl shadow-sm border border-teal-200 p-6 sticky top-0 z-10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left: GA Big Display */}
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-5xl font-black text-teal-700">
                                {currentGA.weeks}<span className="text-3xl">w</span>
                                <span className="text-teal-500 mx-1">+</span>
                                <span className="text-4xl">{currentGA.days}</span><span className="text-2xl text-teal-500">d</span>
                            </div>
                            <div className="text-sm text-teal-600 font-medium mt-1">Gestational Age</div>
                        </div>

                        <div className="h-16 w-px bg-teal-200" />

                        {/* LMP & EDD */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                                <Calendar size={16} className="text-teal-600" />
                                <span className="font-medium">LMP:</span>
                                <span className="font-bold">
                                    {pregnancy.lmp_date ? format(parseISO(pregnancy.lmp_date), 'dd MMM yyyy') : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Baby size={16} className="text-rose-500" />
                                <span className="font-medium">EDD:</span>
                                <span className="font-bold text-rose-600">
                                    {edd ? format(edd, 'dd MMM yyyy') : 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Edit LMP Button */}
                        <button
                            onClick={() => setIsEditDatesModalOpen(true)}
                            className="p-2 bg-white/80 hover:bg-white rounded-lg border border-teal-200 shadow-sm transition-colors"
                            title="تعديل التاريخ"
                        >
                            <Edit2 size={18} className="text-teal-600" />
                        </button>
                    </div>

                    {/* Right: Parity & Risk Badges */}
                    <div className="flex flex-col items-end gap-3">
                        {/* Parity */}
                        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-teal-200 shadow-sm">
                            <span className="text-lg font-bold text-gray-800">
                                {formatObsHistory(pregnancy.obstetric_history)}
                            </span>
                        </div>

                        {/* Risk Badges */}
                        {riskBadges.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-end">
                                {riskBadges.map((badge, idx) => (
                                    <span
                                        key={idx}
                                        className={`px-3 py-1 rounded-full text-sm font-bold border ${badge.color} flex items-center gap-1`}
                                    >
                                        <span>{badge.emoji}</span>
                                        <span>{badge.label}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Patient Name */}
                        {patientName && (
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">{patientName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* SECTION B: Vitals Trend Charts */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Vitals Trend</h3>
                </div>

                {chartData.length > 1 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Weight Chart */}
                        <div dir="ltr" className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                <TrendingUp size={18} />
                                Weight Trajectory
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="week" stroke="#666" style={{ fontSize: '11px' }} />
                                    <YAxis stroke="#666" style={{ fontSize: '11px' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                                        formatter={(value: number) => [`${value?.toFixed(1)} kg`, 'Weight']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#9333ea"
                                        strokeWidth={3}
                                        dot={{ fill: '#9333ea', r: 4 }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* BP Chart */}
                        <div dir="ltr" className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                            <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                <Heart size={18} />
                                Blood Pressure
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="week" stroke="#666" style={{ fontSize: '11px' }} />
                                    <YAxis domain={[60, 160]} stroke="#666" style={{ fontSize: '11px' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                                    />
                                    <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" />
                                    <ReferenceLine y={90} stroke="#f97316" strokeDasharray="3 3" />
                                    <Area
                                        type="monotone"
                                        dataKey="systolic"
                                        fill="#fecaca"
                                        stroke="transparent"
                                        fillOpacity={0.5}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="diastolic"
                                        fill="#fed7aa"
                                        stroke="transparent"
                                        fillOpacity={0.5}
                                    />
                                    <Line type="monotone" dataKey="systolic" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <Line type="monotone" dataKey="diastolic" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Activity size={40} className="mx-auto mb-2 opacity-30" />
                        <p>Need at least 2 visits to show trends</p>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* SECTION C: Visit Log Table */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        <h3 className="text-lg font-bold text-gray-900">Visit Log</h3>
                        <span className="bg-teal-100 text-teal-800 text-sm font-medium px-2 py-0.5 rounded-full">
                            {visits.length} visits
                        </span>
                    </div>
                </div>

                {visits.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-500">
                                    <th className="p-3 text-right font-bold text-gray-700">Date</th>
                                    <th className="p-3 text-center font-bold text-gray-700">GA</th>
                                    <th className="p-3 text-center font-bold text-gray-700">BP</th>
                                    <th className="p-3 text-center font-bold text-gray-700">Weight</th>
                                    <th className="p-3 text-center font-bold text-gray-700">Urine</th>
                                    <th className="p-3 text-center font-bold text-gray-700">FHR</th>
                                    <th className="p-3 text-center font-bold text-gray-700">Fundal Ht</th>
                                    <th className="p-3 text-center font-bold text-gray-700">Presentation</th>
                                    <th className="p-3 text-center font-bold text-gray-700">Next Visit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map((visit, index) => {
                                    const ga = calculateGA(pregnancy.lmp_date, parseISO(visit.visit_date));
                                    const bpHigh = isBPHigh(visit.systolic_bp, visit.diastolic_bp);
                                    const prevVisit = visits[index + 1];
                                    const weightChange = visit.weight_kg && prevVisit?.weight_kg
                                        ? visit.weight_kg - prevVisit.weight_kg
                                        : null;

                                    return (
                                        <tr
                                            key={visit.id}
                                            onClick={() => onVisitClick?.(visit)}
                                            className={`
                        border-b transition-colors cursor-pointer hover:bg-gray-50
                        ${bpHigh ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
                        ${index === 0 ? 'bg-blue-50/50' : ''}
                      `}
                                        >
                                            {/* Date */}
                                            <td className="p-3 font-medium text-gray-900">
                                                {format(parseISO(visit.visit_date), 'dd/MM/yy')}
                                            </td>

                                            {/* GA */}
                                            <td className="p-3 text-center">
                                                <span className="font-bold text-teal-700">{ga.weeks}w+{ga.days}d</span>
                                            </td>

                                            {/* BP */}
                                            <td className={`p-3 text-center font-bold ${bpHigh ? 'text-red-700' : 'text-gray-800'}`}>
                                                {visit.systolic_bp && visit.diastolic_bp ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span>{visit.systolic_bp}/{visit.diastolic_bp}</span>
                                                        {bpHigh && <AlertTriangle size={14} className="text-red-600" />}
                                                    </div>
                                                ) : '-'}
                                            </td>

                                            {/* Weight */}
                                            <td className="p-3 text-center">
                                                {visit.weight_kg ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="font-medium">{visit.weight_kg}</span>
                                                        {weightChange !== null && weightChange !== 0 && (
                                                            <span className={`text-xs flex items-center ${weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {weightChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                                {Math.abs(weightChange).toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>

                                            {/* Urine */}
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${!visit.urine_albuminuria || visit.urine_albuminuria === 'nil'
                                                        ? 'bg-green-100 text-green-800'
                                                        : visit.urine_albuminuria === '+'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        P:{visit.urine_albuminuria || 'Nil'}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${!visit.urine_glycosuria || visit.urine_glycosuria === 'nil'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                        G:{visit.urine_glycosuria || 'Nil'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* FHR */}
                                            <td className="p-3 text-center">
                                                {visit.fetal_heart_sound ? (
                                                    <span className="text-green-600 font-bold">✓</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Fundal Height */}
                                            <td className="p-3 text-center font-medium text-teal-700">
                                                {visit.fundal_height_cm ? `${visit.fundal_height_cm}cm` : '-'}
                                            </td>

                                            {/* Presentation */}
                                            <td className="p-3 text-center text-xs">
                                                {ga.weeks >= 28 ? (
                                                    visit.presentation ? (
                                                        <span className={`px-2 py-1 rounded ${visit.presentation === 'Cephalic'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {visit.presentation}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Not recorded</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>

                                            {/* Next Visit */}
                                            <td className="p-3 text-center">
                                                {visit.next_visit_date ? (
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                        {format(parseISO(visit.next_visit_date), 'dd/MM')}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                        <p>No visits recorded yet</p>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* FAB: Quick Visit Button */}
            {/* ============================================ */}
            {onQuickVisit && (
                <button
                    onClick={onQuickVisit}
                    className="fixed bottom-6 left-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 z-50"
                >
                    <Plus size={24} />
                    <span className="font-bold">Quick Visit</span>
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
};
