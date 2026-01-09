import React from 'react';
import { Recommendation } from '../../utils/ClinicalEngine';
import { AlertTriangle, Zap, ThermometerSnowflake, Syringe, Info, ArrowRight } from 'lucide-react';

interface Props {
    recommendations: Recommendation[];
}

const ClinicalInsightsPanel: React.FC<Props> = ({ recommendations }) => {
    if (recommendations.length === 0) return null;

    const getIcon = (category: string) => {
        switch (category) {
            case 'DOSE': return <Zap className="w-5 h-5 text-amber-500" />;
            case 'TRIGGER': return <Syringe className="w-5 h-5 text-purple-500" />;
            case 'TRANSFER': return <ThermometerSnowflake className="w-5 h-5 text-cyan-500" />;
            default: return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    const getColorSet = (priority: string) => {
        return priority === 'Critical'
            ? {
                bg: 'bg-red-50/50',
                border: 'border-red-200',
                accent: 'bg-red-500',
                text: 'text-red-950',
                muted: 'text-red-700/70'
            }
            : {
                bg: 'bg-indigo-50/50',
                border: 'border-indigo-100',
                accent: 'bg-indigo-500',
                text: 'text-indigo-950',
                muted: 'text-indigo-700/70'
            };
    };

    return (
        <div className="relative mb-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10"></div>

            <div className="relative bg-white border border-indigo-50 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-none mb-1">AI Clinical Intelligence</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Cycle Optimization Engine</p>
                        </div>
                    </div>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-black tracking-tighter">
                        V3.5 ACTIVE
                    </span>
                </div>

                <div className="p-6 space-y-4">
                    {recommendations.map((rec, i) => {
                        const colors = getColorSet(rec.priority);
                        return (
                            <div
                                key={i}
                                className={`group flex items-start gap-5 p-5 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-300`}
                            >
                                <div className="mt-1 flex-shrink-0 bg-white p-3 rounded-xl shadow-sm border border-white group-hover:scale-110 transition-transform">
                                    {getIcon(rec.category)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-black text-xl ${colors.text} tracking-tight`}>{rec.action}</h4>
                                            {rec.priority === 'Critical' && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> Critical
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-sm leading-relaxed opacity-90 font-medium ${colors.text}`}>
                                        {rec.reasoning}
                                    </p>
                                    <div className="mt-4 flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3].map(dot => (
                                                    <div key={dot} className={`w-3 h-1 rounded-full ${dot <= (rec.confidence === 'High' ? 3 : rec.confidence === 'Medium' ? 2 : 1)
                                                            ? colors.accent : 'bg-gray-200'
                                                        }`}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="h-3 w-px bg-gray-200"></div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Area</span>
                                            <span className={`text-[10px] font-black ${colors.text} uppercase`}>{rec.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="self-center hidden group-hover:block animate-in fade-in slide-in-from-left-2">
                                    <ArrowRight className={`w-5 h-5 ${colors.muted}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ClinicalInsightsPanel;
