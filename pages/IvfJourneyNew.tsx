import React, { useState, useEffect } from 'react';
import { usePatients } from '../src/hooks/usePatients';
import { ivfCycleService } from '../services/ivfCycleService';
import CycleTimeline from '../components/ivf/CycleTimeline';
import CycleDashboard from '../components/ivf/CycleDashboard';
import AssessmentForm from '../components/ivf/AssessmentForm';
import MonitoringDashboard from '../components/ivf/MonitoringDashboard';
import { TestTube, Plus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const IvfJourneyNew: React.FC = () => {
    const { patients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [currentCycle, setCurrentCycle] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'assessment' | 'monitoring' | 'lab' | 'transfer' | 'outcome'>('dashboard');
    const [loading, setLoading] = useState(false);

    const selectedPatient = patients.find(p => String(p.id) === selectedPatientId);

    useEffect(() => {
        if (selectedPatientId) {
            loadPatientCycle();
        }
    }, [selectedPatientId]);

    const loadPatientCycle = async () => {
        try {
            setLoading(true);
            const { data } = await ivfCycleService.getCyclesByPatient(selectedPatientId);
            if (data && data.length > 0) {
                setCurrentCycle(data[0]); // Most recent cycle
            } else {
                setCurrentCycle(null);
            }
        } catch (error) {
            console.error('Error loading cycle:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartNewCycle = async () => {
        if (!selectedPatientId) {
            toast.error('الرجاء اختيار مريضة');
            return;
        }

        try {
            setLoading(true);

            // Get doctor_id from current session
            const { data: { session } } = await supabase.auth.getSession();
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', session?.user?.id)
                .single();

            if (!doctor) {
                toast.error('فشل العثور على بيانات الطبيب');
                return;
            }

            const { data, error } = await ivfCycleService.createCycle({
                patient_id: selectedPatientId,
                doctor_id: doctor.id,
                cycle_number: 1,
                protocol_type: 'Antagonist',
                start_date: new Date().toISOString().split('T')[0],
                status: 'assessment',
            });

            if (error) throw error;

            toast.success('تم بدء دورة جديدة بنجاح');
            setCurrentCycle(data);
            setActiveTab('assessment');
        } catch (error: any) {
            console.error('Error starting cycle:', error);
            toast.error('فشل بدء الدورة');
        } finally {
            setLoading(false);
        }
    };

    const TABS = [
        { id: 'dashboard', label: 'نظرة عامة', icon: TestTube },
        { id: 'assessment', label: 'التقييم', icon: TestTube },
        { id: 'monitoring', label: 'المتابعة', icon: TestTube },
        { id: 'lab', label: 'المعمل', icon: TestTube },
        { id: 'transfer', label: 'النقل', icon: TestTube },
        { id: 'outcome', label: 'النتائج', icon: TestTube },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">دورة الحقن المجهري (IVF)</h1>
                        <p className="text-teal-100">نظام احترافي متكامل لإدارة دورات IVF</p>
                    </div>
                    <TestTube className="w-16 h-16 opacity-20" />
                </div>
            </div>

            {/* Patient Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">اختر المريضة</label>
                <div className="flex gap-3">
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">-- اختر مريضة --</option>
                        {patients.map(patient => (
                            <option key={patient.id} value={String(patient.id)}>
                                {patient.name} - {patient.phone}
                            </option>
                        ))}
                    </select>

                    {selectedPatientId && !currentCycle && (
                        <button
                            onClick={handleStartNewCycle}
                            disabled={loading}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            بدء دورة جديدة
                        </button>
                    )}
                </div>
            </div>

            {/* Cycle Content */}
            {currentCycle && selectedPatient && (
                <>
                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === tab.id
                                                ? 'border-b-2 border-teal-500 text-teal-600 bg-teal-50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'dashboard' && (
                                <CycleDashboard
                                    cycleId={currentCycle.id}
                                    patientName={selectedPatient.name}
                                />
                            )}

                            {activeTab === 'assessment' && (
                                <AssessmentForm
                                    cycleId={currentCycle.id}
                                    onSave={() => {
                                        toast.success('تم حفظ التقييم');
                                        loadPatientCycle();
                                    }}
                                />
                            )}

                            {activeTab === 'monitoring' && (
                                <MonitoringDashboard cycleId={currentCycle.id} />
                            )}

                            {activeTab === 'lab' && (
                                <div className="text-center py-12 text-gray-500">
                                    <TestTube className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>قسم المعمل قيد التطوير...</p>
                                </div>
                            )}

                            {activeTab === 'transfer' && (
                                <div className="text-center py-12 text-gray-500">
                                    <TestTube className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>قسم النقل قيد التطوير...</p>
                                </div>
                            )}

                            {activeTab === 'outcome' && (
                                <div className="text-center py-12 text-gray-500">
                                    <TestTube className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>قسم النتائج قيد التطوير...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* No Cycle Message */}
            {selectedPatientId && !currentCycle && !loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <TestTube className="w-16 h-16 mx-auto mb-4 text-blue-600 opacity-50" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد دورة نشطة</h3>
                    <p className="text-gray-600 mb-4">اضغط على "بدء دورة جديدة" لإنشاء دورة IVF جديدة لهذه المريضة</p>
                </div>
            )}
        </div>
    );
};

export default IvfJourneyNew;
