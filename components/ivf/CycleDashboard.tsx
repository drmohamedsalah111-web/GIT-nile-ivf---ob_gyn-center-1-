import React, { useState, useEffect } from 'react';
import { ivfCycleService } from '../../services/ivfCycleService';
import CycleTimeline from './CycleTimeline';
import { Activity, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CycleDashboardProps {
    cycleId: string;
    patientName: string;
}

const CycleDashboard: React.FC<CycleDashboardProps> = ({ cycleId, patientName }) => {
    const [cycle, setCycle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadCycleData();
    }, [cycleId]);

    const loadCycleData = async () => {
        try {
            setLoading(true);
            const { data, error } = await ivfCycleService.getCycleById(cycleId);

            if (error) throw error;
            setCycle(data);
        } catch (error: any) {
            console.error('Error loading cycle:', error);
            toast.error('فشل تحميل بيانات الدورة');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <span className="text-yellow-900">لم يتم العثور على بيانات الدورة</span>
                </div>
            </div>
        );
    }

    const getDaysInCycle = () => {
        const start = new Date(cycle.start_date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-2">{patientName}</h2>
                <div className="flex items-center gap-6 text-blue-100">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>دورة رقم {cycle.cycle_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>اليوم {getDaysInCycle()} من الدورة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>البروتوكول: {cycle.protocol_type}</span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <CycleTimeline
                currentStatus={cycle.status}
                startDate={cycle.start_date}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Assessment */}
                {cycle.cycle_assessment && (
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-purple-500">
                        <div className="text-sm text-gray-600 mb-1">AMH</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {cycle.cycle_assessment.amh || '-'} <span className="text-sm text-gray-500">ng/mL</span>
                        </div>
                    </div>
                )}

                {/* Monitoring */}
                {cycle.monitoring_visits && cycle.monitoring_visits.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
                        <div className="text-sm text-gray-600 mb-1">آخر E2</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {cycle.monitoring_visits[cycle.monitoring_visits.length - 1]?.e2 || '-'}
                            <span className="text-sm text-gray-500"> pg/mL</span>
                        </div>
                    </div>
                )}

                {/* OPU */}
                {cycle.oocyte_retrieval && (
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-pink-500">
                        <div className="text-sm text-gray-600 mb-1">البويضات</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {cycle.oocyte_retrieval.total_oocytes || '-'}
                            <span className="text-sm text-gray-500"> / {cycle.oocyte_retrieval.mii_oocytes || '-'} MII</span>
                        </div>
                    </div>
                )}

                {/* Fertilization */}
                {cycle.fertilization && (
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-green-500">
                        <div className="text-sm text-gray-600 mb-1">التخصيب</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {cycle.fertilization.total_fertilized_2pn || '-'}
                            <span className="text-sm text-gray-500"> ({cycle.fertilization.fertilization_rate?.toFixed(0) || '-'}%)</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Current Stage Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">تفاصيل المرحلة الحالية</h3>

                {cycle.status === 'assessment' && (
                    <div className="text-gray-600">
                        <p>جاري إجراء التقييم الأولي للزوجين...</p>
                        <p className="mt-2 text-sm">يرجى إكمال جميع الفحوصات المطلوبة قبل الانتقال للمرحلة التالية.</p>
                    </div>
                )}

                {cycle.status === 'stimulation' && cycle.monitoring_visits && (
                    <div>
                        <p className="text-gray-600 mb-3">عدد زيارات المتابعة: {cycle.monitoring_visits.length}</p>
                        {cycle.monitoring_visits.length > 0 && (
                            <div className="bg-blue-50 rounded p-3">
                                <div className="text-sm text-gray-700">
                                    آخر زيارة: {new Date(cycle.monitoring_visits[cycle.monitoring_visits.length - 1].visit_date).toLocaleDateString('ar-EG')}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {cycle.status === 'lab' && cycle.embryo_development && (
                    <div>
                        <p className="text-gray-600 mb-3">
                            عدد الأجنة قيد التطور: {cycle.embryo_development.filter((e: any) => e.status === 'developing').length}
                        </p>
                    </div>
                )}

                {cycle.status === 'outcome' && cycle.cycle_outcome && (
                    <div>
                        {cycle.cycle_outcome.beta_hcg_day_14_result && (
                            <div className={`p-4 rounded-lg ${cycle.cycle_outcome.beta_hcg_day_14_result === 'positive'
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-gray-50 border border-gray-200'
                                }`}>
                                <div className="font-semibold">
                                    نتيجة Beta-hCG: {cycle.cycle_outcome.beta_hcg_day_14_result === 'positive' ? 'إيجابية ✅' : 'سلبية'}
                                </div>
                                {cycle.cycle_outcome.beta_hcg_day_14_value && (
                                    <div className="text-sm mt-1">
                                        القيمة: {cycle.cycle_outcome.beta_hcg_day_14_value} mIU/mL
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CycleDashboard;
