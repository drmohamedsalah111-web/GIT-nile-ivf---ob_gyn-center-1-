import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

interface CycleTimelineProps {
    currentStatus: 'assessment' | 'protocol' | 'stimulation' | 'opu' | 'lab' | 'transfer' | 'outcome' | 'completed' | 'cancelled';
    startDate: string;
}

const STAGES = [
    { id: 'assessment', label: 'التقييم', labelEn: 'Assessment' },
    { id: 'protocol', label: 'البروتوكول', labelEn: 'Protocol' },
    { id: 'stimulation', label: 'التنشيط', labelEn: 'Stimulation' },
    { id: 'opu', label: 'سحب البويضات', labelEn: 'OPU' },
    { id: 'lab', label: 'المعمل', labelEn: 'Lab' },
    { id: 'transfer', label: 'النقل', labelEn: 'Transfer' },
    { id: 'outcome', label: 'النتائج', labelEn: 'Outcome' },
];

const CycleTimeline: React.FC<CycleTimelineProps> = ({ currentStatus, startDate }) => {
    const getStageStatus = (stageId: string): 'completed' | 'current' | 'upcoming' | 'cancelled' => {
        if (currentStatus === 'cancelled') return 'cancelled';
        if (currentStatus === 'completed') return 'completed';

        const currentIndex = STAGES.findIndex(s => s.id === currentStatus);
        const stageIndex = STAGES.findIndex(s => s.id === stageId);

        if (stageIndex < currentIndex) return 'completed';
        if (stageIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'current':
                return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
            case 'cancelled':
                return <AlertCircle className="w-6 h-6 text-red-500" />;
            default:
                return <Circle className="w-6 h-6 text-gray-300" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'current':
                return 'bg-blue-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-300';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">مراحل الدورة</h3>
                <div className="text-sm text-gray-600">
                    بدأت في: {new Date(startDate).toLocaleDateString('ar-EG')}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200" style={{ zIndex: 0 }} />
                <div
                    className={`absolute top-3 left-0 h-1 ${getStatusColor(currentStatus === 'cancelled' ? 'cancelled' : 'completed')} transition-all duration-500`}
                    style={{
                        width: `${(STAGES.findIndex(s => s.id === currentStatus) / (STAGES.length - 1)) * 100}%`,
                        zIndex: 0
                    }}
                />

                {/* Stages */}
                <div className="relative flex justify-between" style={{ zIndex: 1 }}>
                    {STAGES.map((stage, index) => {
                        const status = getStageStatus(stage.id);

                        return (
                            <div key={stage.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                                {/* Icon */}
                                <div className={`
                  relative bg-white rounded-full p-1 border-2 transition-all
                  ${status === 'completed' ? 'border-green-500' : ''}
                  ${status === 'current' ? 'border-blue-500 shadow-lg' : ''}
                  ${status === 'cancelled' ? 'border-red-500' : ''}
                  ${status === 'upcoming' ? 'border-gray-300' : ''}
                `}>
                                    {getStatusIcon(status)}
                                </div>

                                {/* Label */}
                                <div className="mt-3 text-center">
                                    <div className={`
                    text-sm font-semibold
                    ${status === 'completed' ? 'text-green-600' : ''}
                    ${status === 'current' ? 'text-blue-600' : ''}
                    ${status === 'cancelled' ? 'text-red-600' : ''}
                    ${status === 'upcoming' ? 'text-gray-400' : ''}
                  `}>
                                        {stage.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {stage.labelEn}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status Message */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                        {currentStatus === 'cancelled' && 'تم إلغاء الدورة'}
                        {currentStatus === 'completed' && 'تم إكمال الدورة بنجاح'}
                        {currentStatus !== 'cancelled' && currentStatus !== 'completed' &&
                            `المرحلة الحالية: ${STAGES.find(s => s.id === currentStatus)?.label}`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CycleTimeline;
