/**
 * ============================================================================
 * صفحة رحلة التنشيط الذكي المتكامل
 * Smart IVF Stimulation Journey - Unified Interface
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  TestTube,
  TrendingUp,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Pill,
  Beaker,
  FileText,
  BarChart3,
  Users,
  User,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import smartStimulationService from '../services/smartStimulationService.unified';
import SmartProtocolSelector from '../components/ivf/SmartProtocolSelector';
import UnifiedMonitoringVisitForm from '../components/ivf/UnifiedMonitoringVisitForm';
import { ClinicalEngine } from '../utils/ClinicalEngine';
import type {
  SmartIVFCycle,
  SmartMonitoringVisit,
  StimulationProtocol,
  ProtocolSuggestion
} from '../types/smartStimulation.types';
import { usePatients } from '../src/hooks/usePatients';

const UnifiedSmartStimulation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleIdParam = searchParams.get('cycleId');

  const { patients } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [currentCycle, setCurrentCycle] = useState<SmartIVFCycle | null>(null);
  const [visits, setVisits] = useState<SmartMonitoringVisit[]>([]);
  const [loading, setLoading] = useState(false);

  // UI State
  const [currentTab, setCurrentTab] = useState<'setup' | 'protocol' | 'monitoring' | 'timeline'>('setup');
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  useEffect(() => {
    if (cycleIdParam) {
      loadCycleData(cycleIdParam);
    }
  }, [cycleIdParam]);

  // عند اختيار المريضة، جلب آخر دورة نشطة تلقائياً
  useEffect(() => {
    const loadPatientActiveCycle = async () => {
      if (selectedPatientId && !cycleIdParam) {
        setLoading(true);
        try {
          const result = await smartStimulationService.getActiveOrLastCycle(selectedPatientId);
          if (result.data && ['assessment', 'stimulation', 'trigger', 'active', 'baseline', 'protocol'].includes(result.data.status)) {
            setCurrentCycle(result.data);
            navigate(`/unified-smart-stimulation?cycleId=${result.data.id}`, { replace: true });
            toast.success('تم تحميل آخر دورة نشطة للمريضة');
          }
        } catch (error) {
          console.error('Error loading patient active cycle:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadPatientActiveCycle();
  }, [selectedPatientId]);

  const loadCycleData = async (cycleId: string) => {
    try {
      setLoading(true);

      const [cycleResult, visitsResult] = await Promise.all([
        smartStimulationService.getCycle(cycleId),
        smartStimulationService.getCycleVisits(cycleId)
      ]);

      if (cycleResult.data) {
        setCurrentCycle(cycleResult.data);
        setSelectedPatientId(cycleResult.data.patient_id);

        // Set appropriate tab based on status
        if (cycleResult.data.status === 'assessment') {
          setCurrentTab('setup');
        } else if (cycleResult.data.status === 'protocol') {
          setCurrentTab('protocol');
        } else {
          setCurrentTab('monitoring');
        }
      }

      if (visitsResult.data) {
        setVisits(visitsResult.data);
      }
    } catch (error) {
      console.error('Error loading cycle:', error);
      toast.error('فشل تحميل بيانات الدورة');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async () => {
    if (!selectedPatientId) {
      toast.error('يرجى اختيار مريضة أولاً');
      return;
    }

    try {
      setLoading(true);

      // Get cycle number
      const { data: existingCycles } = await smartStimulationService.getPatientCycles(selectedPatientId);
      const cycleNumber = (existingCycles?.length || 0) + 1;

      const { data, error } = await smartStimulationService.createCycle({
        patient_id: selectedPatientId,
        doctor_id: '', // Will be filled by service
        cycle_number: cycleNumber,
        start_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      if (data) {
        setCurrentCycle(data);
        setCurrentTab('setup');
        toast.success('تم إنشاء دورة جديدة');
        navigate(`/unified-smart-stimulation?cycleId=${data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      toast.error('فشل إنشاء الدورة');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async (assessment: any) => {
    if (!currentCycle) return;

    try {
      setLoading(true);

      await smartStimulationService.updateCycle(currentCycle.id, {
        initial_assessment: assessment,
        status: 'protocol'
      });

      toast.success('تم حفظ التقييم');
      setCurrentTab('protocol');
      loadCycleData(currentCycle.id);
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('فشل حفظ التقييم');
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolSelected = async (protocol: StimulationProtocol, suggestion: ProtocolSuggestion) => {
    if (!currentCycle) return;

    try {
      setLoading(true);

      await smartStimulationService.updateCycle(currentCycle.id, {
        protocol_id: protocol.id,
        protocol_type: protocol.protocol_type,
        protocol_name: protocol.protocol_name,
        protocol_selection_reason: suggestion.reason,
        protocol_ai_score: suggestion.match_score / 100,
        status: 'baseline'
      });

      toast.success('تم اختيار البروتوكول');
      setCurrentTab('monitoring');
      loadCycleData(currentCycle.id);
    } catch (error) {
      console.error('Error selecting protocol:', error);
      toast.error('فشل حفظ البروتوكول');
    } finally {
      setLoading(false);
    }
  };

  const handleVisitAdded = () => {
    setShowAddVisit(false);
    if (currentCycle) {
      loadCycleData(currentCycle.id);
    }
  };

  const handleResetPatient = () => {
    setSelectedPatientId('');
    setCurrentCycle(null);
    setVisits([]);
    setCurrentTab('setup');
    navigate('/unified-smart-stimulation');
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <TestTube className="w-10 h-10" />
                <h1 className="text-4xl font-bold">رحلة التنشيط الذكي المتكامل</h1>
              </div>
              <p className="text-purple-100 text-lg">
                نظام موحد متكامل - كل شيء في مكان واحد
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {selectedPatient && (
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                    <Users className="w-5 h-5 text-cyan-200" />
                    <div>
                      <p className="text-[10px] text-purple-200 uppercase font-black tracking-widest">المريضة الحالية</p>
                      <p className="font-bold">{selectedPatient.name}</p>
                    </div>
                    {currentCycle && (
                      <button
                        onClick={handleResetPatient}
                        className="mr-4 p-2 bg-white/10 hover:bg-white/30 rounded-lg transition-all group flex items-center gap-2"
                        title="تغيير المريضة"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold">تغيير المريضة</span>
                      </button>
                    )}
                  </div>
                )}

                {currentCycle && (
                  <>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-purple-200 uppercase font-black tracking-widest">رقم الدورة</p>
                      <p className="font-bold text-center">{currentCycle.cycle_number}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-purple-200 uppercase font-black tracking-widest">الحالة</p>
                      <p className="font-bold text-center capitalize">{currentCycle.status}</p>
                    </div>
                    {currentCycle.protocol_name && (
                      <div className="bg-indigo-500/30 px-4 py-2 rounded-xl border border-indigo-400/30 shadow-inner">
                        <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest">البروتوكول</p>
                        <p className="font-bold">{currentCycle.protocol_name}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <Activity className="w-20 h-20 opacity-20 hidden lg:block" />
          </div>
        </div>

        {/* Patient Selection */}
        {!currentCycle && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-indigo-600" />
              اختيار المريضة
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  اختر المريضة
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                >
                  <option value="">-- اختر مريضة --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                  <h3 className="font-bold text-gray-900 mb-3">معلومات المريضة:</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">الاسم:</span> <span className="font-semibold">{selectedPatient.name}</span></div>
                    <div><span className="text-gray-600">العمر:</span> <span className="font-semibold">{selectedPatient.age} سنة</span></div>
                    <div><span className="text-gray-600">الهاتف:</span> <span className="font-semibold">{selectedPatient.phone}</span></div>
                  </div>
                </div>
              )}
            </div>

            {selectedPatientId && (
              <button
                onClick={handleCreateCycle}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    بدء دورة جديدة
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Tabs Navigation */}
        {currentCycle && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setCurrentTab('setup')}
                  disabled={loading}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'setup'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  1. التقييم الأولي
                </button>

                <button
                  onClick={() => setCurrentTab('protocol')}
                  disabled={loading || !currentCycle.initial_assessment}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'protocol'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }
                  `}
                >
                  <FileText className="w-5 h-5" />
                  2. اختيار البروتوكول
                  {currentCycle.protocol_id && <CheckCircle2 className="w-4 h-4 text-green-300" />}
                </button>

                <button
                  onClick={() => setCurrentTab('monitoring')}
                  disabled={loading || !currentCycle.protocol_id}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'monitoring'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }
                  `}
                >
                  <Activity className="w-5 h-5" />
                  3. المتابعة
                  <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                    {visits.length}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentTab('timeline')}
                  disabled={loading || visits.length === 0}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'timeline'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }
                  `}
                >
                  <BarChart3 className="w-5 h-5" />
                  4. الخط الزمني
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Setup Tab */}
              {currentTab === 'setup' && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">التقييم الأولي</h2>

                  <AssessmentForm
                    initialData={currentCycle.initial_assessment || {}}
                    onSave={handleSaveAssessment}
                    loading={loading}
                  />
                </div>
              )}

              {/* Protocol Tab */}
              {currentTab === 'protocol' && (
                <SmartProtocolSelector
                  patientAssessment={currentCycle.initial_assessment || {}}
                  onProtocolSelected={handleProtocolSelected}
                  showAllProtocols={true}
                />
              )}

              {/* Monitoring Tab */}
              {currentTab === 'monitoring' && currentCycle && (
                <div className="space-y-6">
                  {/* Protocol Guide Hero (NEW) */}
                  {currentCycle.protocol_name && (
                    <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-6 shadow-xl border-b-4 border-indigo-500" dir="ltr">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Active Protocol Selection</p>
                          <h2 className="text-2xl font-bold">{currentCycle.protocol_name}</h2>
                        </div>
                        {ClinicalEngine.getProtocolDetails(currentCycle.protocol_name)?.note && (
                          <div className="bg-yellow-400 text-indigo-950 px-4 py-1.5 rounded-full font-black text-xs shadow-lg flex items-center gap-2">
                            ⭐ {ClinicalEngine.getProtocolDetails(currentCycle.protocol_name)?.note}
                          </div>
                        )}
                      </div>

                      {ClinicalEngine.getProtocolDetails(currentCycle.protocol_name)?.guide && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {ClinicalEngine.getProtocolDetails(currentCycle.protocol_name)?.guide.map((step, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-all">
                              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold mb-2 ring-2 ring-indigo-400/50">
                                {i + 1}
                              </div>
                              <p className="text-xs text-indigo-50 font-medium leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visits List */}
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-teal-600" />
                        زيارات المتابعة ({visits.length})
                      </h2>
                      <button
                        onClick={() => setShowAddVisit(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        إضافة زيارة جديدة
                      </button>
                    </div>

                    {visits.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">لا توجد زيارات متابعة بعد</p>
                        <button
                          onClick={() => setShowAddVisit(true)}
                          className="mt-4 text-teal-600 font-semibold hover:text-teal-700"
                        >
                          أضف أول زيارة الآن
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visits.map((visit) => (
                          <VisitCard
                            key={visit.id}
                            visit={visit}
                            isExpanded={expandedVisitId === visit.id}
                            onToggle={() => setExpandedVisitId(expandedVisitId === visit.id ? null : visit.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Visit Form */}
                  {showAddVisit && (
                    <UnifiedMonitoringVisitForm
                      cycleId={currentCycle.id}
                      cycleStartDate={currentCycle.start_date}
                      onSuccess={handleVisitAdded}
                      onCancel={() => setShowAddVisit(false)}
                    />
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {currentTab === 'timeline' && (
                <TimelineView visits={visits} cycle={currentCycle} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Assessment Form Component
// ============================================================================
interface AssessmentFormProps {
  initialData: any;
  onSave: (data: any) => void;
  loading: boolean;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ initialData, onSave, loading }) => {
  const [age, setAge] = useState(initialData.age || '');
  const [bmi, setBmi] = useState(initialData.bmi || '');
  const [amh, setAmh] = useState(initialData.amh || '');
  const [afc, setAfc] = useState(initialData.afc || '');
  const [previousCycles, setPreviousCycles] = useState(initialData.previous_cycles || '0');

  const handleSubmit = () => {
    const assessment = {
      age: parseFloat(age) || undefined,
      bmi: parseFloat(bmi) || undefined,
      amh: parseFloat(amh) || undefined,
      afc: parseInt(afc) || undefined,
      previous_cycles: parseInt(previousCycles) || 0
    };
    onSave(assessment);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">العمر (Age)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="30"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">BMI</label>
          <input
            type="number"
            step="0.1"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
            placeholder="24.5"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">AMH (ng/mL)</label>
          <input
            type="number"
            step="0.1"
            value={amh}
            onChange={(e) => setAmh(e.target.value)}
            placeholder="2.5"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">AFC</label>
          <input
            type="number"
            value={afc}
            onChange={(e) => setAfc(e.target.value)}
            placeholder="12"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">دورات سابقة</label>
          <input
            type="number"
            value={previousCycles}
            onChange={(e) => setPreviousCycles(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !age || !amh || !afc}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            جاري الحفظ...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-6 h-6" />
            حفظ التقييم والمتابعة
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// Visit Card Component
// ============================================================================
interface VisitCardProps {
  visit: SmartMonitoringVisit;
  isExpanded: boolean;
  onToggle: () => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, isExpanded, onToggle }) => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border-2 border-gray-200 hover:border-teal-300 transition-all overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
              <span className="text-2xl font-bold">D{visit.cycle_day}</span>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{visit.visit_date}</div>
              {visit.stimulation_day && (
                <div className="text-sm text-gray-600">Stim Day {visit.stimulation_day}</div>
              )}
            </div>
          </div>

          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? '▼' : '◀'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visit.e2_level && (
            <div className="bg-pink-50 rounded-lg p-3 text-center border border-pink-200">
              <div className="text-xs text-pink-700 font-semibold">E2</div>
              <div className="text-lg font-bold text-pink-900">{visit.e2_level}</div>
            </div>
          )}
          {visit.total_follicles && (
            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
              <div className="text-xs text-purple-700 font-semibold">Follicles</div>
              <div className="text-lg font-bold text-purple-900">{visit.total_follicles}</div>
            </div>
          )}
          {visit.medications_given && visit.medications_given.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200 flex flex-col items-center justify-center">
              <Pill className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-xs text-blue-700 font-semibold">{visit.medications_given.length} أدوية</div>
            </div>
          )}
          {visit.lab_results && visit.lab_results.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200 flex flex-col items-center justify-center">
              <Beaker className="w-5 h-5 text-green-600 mb-1" />
              <div className="text-xs text-green-700 font-semibold">{visit.lab_results.length} تحاليل</div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 space-y-4">
          {/* Hormones */}
          {(visit.e2_level || visit.lh_level || visit.p4_level) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">الهرمونات:</h4>
              <div className="grid grid-cols-4 gap-3">
                {visit.e2_level && <div className="bg-white rounded p-2 text-center text-sm"><span className="text-gray-600">E2:</span> <span className="font-bold">{visit.e2_level}</span></div>}
                {visit.lh_level && <div className="bg-white rounded p-2 text-center text-sm"><span className="text-gray-600">LH:</span> <span className="font-bold">{visit.lh_level}</span></div>}
                {visit.p4_level && <div className="bg-white rounded p-2 text-center text-sm"><span className="text-gray-600">P4:</span> <span className="font-bold">{visit.p4_level}</span></div>}
                {visit.fsh_level && <div className="bg-white rounded p-2 text-center text-sm"><span className="text-gray-600">FSH:</span> <span className="font-bold">{visit.fsh_level}</span></div>}
              </div>
            </div>
          )}

          {/* Follicles */}
          {(visit.follicles_right.length > 0 || visit.follicles_left.length > 0) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">الحويصلات:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded p-3">
                  <div className="text-sm font-semibold text-purple-900 mb-2">المبيض الأيمن:</div>
                  <div className="flex flex-wrap gap-1">
                    {visit.follicles_right.map((size: number, idx: number) => (
                      <span key={idx} className="bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-semibold">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-indigo-50 rounded p-3">
                  <div className="text-sm font-semibold text-indigo-900 mb-2">المبيض الأيسر:</div>
                  <div className="flex flex-wrap gap-1">
                    {visit.follicles_left.map((size: number, idx: number) => (
                      <span key={idx} className="bg-indigo-200 text-indigo-900 px-2 py-1 rounded text-xs font-semibold">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medications */}
          {visit.medications_given && visit.medications_given.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                الأدوية المعطاة:
              </h4>
              <div className="space-y-2">
                {visit.medications_given.map((med: any, idx: number) => (
                  <div key={idx} className="bg-blue-50 rounded p-3 text-sm border border-blue-200">
                    <span className="font-semibold text-blue-900">{med.medication_name_ar || med.medication_name}</span>
                    <span className="text-gray-700 mr-2">- {med.dose} {med.unit} ({med.route})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Results */}
          {visit.lab_results && visit.lab_results.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-green-600" />
                نتائج التحاليل:
              </h4>
              <div className="space-y-2">
                {visit.lab_results.map((lab: any, idx: number) => (
                  <div key={idx} className="bg-green-50 rounded p-3 text-sm border border-green-200">
                    <span className="font-semibold text-green-900">{lab.test_name_ar || lab.test_name}</span>
                    <span className="text-gray-700 mr-2">- {lab.result_value} {lab.unit}</span>
                    {lab.is_normal !== undefined && (
                      <span className={`mr-2 ${lab.is_normal ? 'text-green-700' : 'text-orange-700'}`}>
                        {lab.is_normal ? '✓ طبيعي' : '⚠ غير طبيعي'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          {visit.doctor_notes && (
            <div className="bg-white rounded p-4 border-2 border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">ملاحظات الطبيب:</h4>
              <p className="text-gray-700">{visit.doctor_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Timeline View Component
// ============================================================================
interface TimelineViewProps {
  visits: SmartMonitoringVisit[];
  cycle: SmartIVFCycle;
}

const TimelineView: React.FC<TimelineViewProps> = ({ visits, cycle }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">الخط الزمني للدورة</h2>

      <div className="space-y-6">
        {visits.map((visit, idx) => (
          <div key={visit.id} className="relative">
            {idx !== visits.length - 1 && (
              <div className="absolute right-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 to-transparent"></div>
            )}

            <VisitCard
              visit={visit}
              isExpanded={true}
              onToggle={() => { }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnifiedSmartStimulation;
