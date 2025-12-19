import React from 'react';
import { Recommendation } from '../../utils/ClinicalEngine';
import { AlertTriangle, Zap, ThermometerSnowflake, Syringe, Info } from 'lucide-react';

interface Props {
    recommendations: Recommendation[];
}

const ClinicalInsightsPanel: React.FC<Props> = ({ recommendations }) => {
    if (recommendations.length === 0) return null;

    const getIcon = (category: string) => {
        switch (category) {
            case 'DOSE': return <Zap className="w-5 h-5 text-yellow-600" />;
            case 'TRIGGER': return <Syringe className="w-5 h-5 text-purple-600" />;
            case 'TRANSFER': return <ThermometerSnowflake className="w-5 h-5 text-blue-600" />;
            default: return <Info className="w-5 h-5 text-gray-600" />;
        }
    };

    const getColor = (priority: string) => {
        return priority === 'Critical'
            ? 'border-red-200 bg-red-50 text-red-900'
            : 'border-blue-100 bg-blue-50 text-blue-900';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">AI Clinical Insights</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-mono">
                    Engine v2.0
                </span>
            </div>

            <div className="space-y-3">
                {recommendations.map((rec, i) => (
                    <div
                        key={i}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${getColor(rec.priority)} transition-all hover:shadow-md cursor-default`}
                    >
                        <div className="mt-1 flex-shrink-0 bg-white p-2 rounded-full shadow-sm">
                            {getIcon(rec.category)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-lg">{rec.action}</h4>
                                {rec.priority === 'Critical' && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase">
                                        <AlertTriangle className="w-3 h-3" /> Critical
                                    </span>
                                )}
                            </div>
                            <p className="text-sm opacity-90 leading-relaxed">
                                {rec.reasoning}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs opacity-75 font-semibold font-mono">
                                <span>CATEGORY: {rec.category}</span>
                                <span>CONFIDENCE: {rec.confidence.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClinicalInsightsPanel;
