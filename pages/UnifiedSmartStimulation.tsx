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
  RefreshCw,
  Egg,
  Microscope,
  Baby,
  Eraser,
  Save,
  Trash2,
  CalendarCheck,
  Printer,
  ChevronRight,
  ClipboardList,
  Zap
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
  ProtocolSuggestion,
  SmartEmbryoRecord,
  SmartOPURecord,
  SmartTransferPrep
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
  const [currentTab, setCurrentTab] = useState<'setup' | 'protocol' | 'monitoring' | 'opu' | 'lab' | 'transfer' | 'timeline' | 'summary'>('setup');
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
  const lastVisit = React.useMemo(() =>
    visits.length > 0 ? visits[visits.length - 1] : undefined,
    [visits]
  );

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
                  الخط الزمني
                </button>

                <button
                  onClick={() => setCurrentTab('opu')}
                  disabled={loading || !currentCycle.protocol_id}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'opu'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }
                  `}
                >
                  <Egg className="w-5 h-5" />
                  سحب البويضات
                </button>

                <button
                  onClick={() => setCurrentTab('lab')}
                  disabled={loading || !currentCycle.opu_details}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'lab'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }
                  `}
                >
                  <Microscope className="w-5 h-5" />
                  المعمل
                </button>

                <button
                  onClick={() => setCurrentTab('transfer')}
                  disabled={loading || !currentCycle.embryo_lab?.length}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'transfer'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }
                  `}
                >
                  <Baby className="w-5 h-5" />
                  تهيئة النقل
                </button>

                <button
                  onClick={() => setCurrentTab('summary')}
                  disabled={loading || !currentCycle}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                    ${currentTab === 'summary'
                      ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-lg scale-105'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50'
                    }
                  `}
                >
                  <ClipboardList className="w-5 h-5" />
                  التقرير النهائي
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
                      lastVisit={lastVisit}
                      onSuccess={handleVisitAdded}
                      onCancel={() => setShowAddVisit(false)}
                    />
                  )}
                </div>
              )}

              {/* OPU Tab */}
              {currentTab === 'opu' && currentCycle && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                      <Egg className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">سحب البويضات (OPU)</h2>
                      <p className="text-gray-500">تسجيل بيانات سحب البويضات ونضجها</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="block text-sm font-bold text-gray-500 mb-2">عدد البويضات الكلي</label>
                      <input
                        type="number"
                        value={currentCycle.opu_details?.oocytes_retrieved || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCurrentCycle({
                            ...currentCycle,
                            opu_details: {
                              ...(currentCycle.opu_details || { cycle_id: currentCycle.id, opu_date: new Date().toISOString().split('T')[0], oocytes_retrieved: 0 }),
                              oocytes_retrieved: val
                            }
                          });
                        }}
                        className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-2xl font-bold focus:border-orange-500 outline-none"
                      />
                    </div>
                    {[
                      { label: 'بويضات MII', key: 'mii_count', color: 'text-green-600' },
                      { label: 'بويضات MI', key: 'mi_count', color: 'text-blue-600' },
                      { label: 'بويضات GV', key: 'gv_count', color: 'text-yellow-600' }
                    ].map(item => (
                      <div key={item.key} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className={`block text-sm font-bold text-gray-500 mb-2 ${item.color}`}>{item.label}</label>
                        <input
                          type="number"
                          value={(currentCycle.opu_details as any)?.[item.key] || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCurrentCycle({
                              ...currentCycle,
                              opu_details: {
                                ...(currentCycle.opu_details || { cycle_id: currentCycle.id, opu_date: new Date().toISOString().split('T')[0], oocytes_retrieved: 0 }),
                                [item.key]: val
                              }
                            });
                          }}
                          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-2xl font-bold focus:border-orange-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={async () => {
                        if (!currentCycle.opu_details) return;
                        const { error } = await smartStimulationService.saveOPURecord(currentCycle.opu_details);
                        if (!error) {
                          toast.success('تم حفظ بيانات السحب');
                          loadCycleData(currentCycle.id);
                        } else {
                          toast.error('حدث خطأ أثناء الحفظ');
                        }
                      }}
                      className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      حفظ نتائج السحب
                    </button>
                  </div>
                </div>
              )}

              {/* Lab Tab */}
              {currentTab === 'lab' && currentCycle && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Microscope className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">متابعة الأجنة</h2>
                        <p className="text-gray-500">تسجيل وتحديث حالة الأجنة اليومية</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const nextNum = (currentCycle.embryo_lab?.length || 0) + 1;
                        const newEmbryo: SmartEmbryoRecord = {
                          cycle_id: currentCycle.id,
                          embryo_number: nextNum,
                          status: 'developing',
                          fertilization_status: 'fertilized',
                          day_reached: 1
                        };
                        setCurrentCycle({
                          ...currentCycle,
                          embryo_lab: [...(currentCycle.embryo_lab || []), newEmbryo]
                        });
                      }}
                      className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      إضافة جنين
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {(currentCycle.embryo_lab || []).sort((a, b) => a.embryo_number - b.embryo_number).map((embryo, idx) => (
                      <div key={idx} className="p-6 border-2 border-gray-100 rounded-2xl bg-gray-50 relative group">
                        <button
                          onClick={() => {
                            const newList = currentCycle.embryo_lab!.filter((_, i) => i !== idx);
                            setCurrentCycle({ ...currentCycle, embryo_lab: newList });
                          }}
                          className="absolute top-4 left-4 p-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                            {embryo.embryo_number}
                          </span>
                          <span className="font-bold text-gray-700 text-lg">جنين رقم {embryo.embryo_number}</span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">الحالة الحالية</label>
                            <select
                              value={embryo.status}
                              onChange={(e) => {
                                const newList = [...currentCycle.embryo_lab!];
                                newList[idx] = { ...newList[idx], status: e.target.value as any };
                                setCurrentCycle({ ...currentCycle, embryo_lab: newList });
                              }}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none"
                            >
                              <option value="developing">نامي (Developing)</option>
                              <option value="frozen">مجمد (Frozen)</option>
                              <option value="transferred">تم النقل (Transferred)</option>
                              <option value="arrested">توقف النمو (Arrested)</option>
                              <option value="discarded">مستبعد (Discarded)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">الجودة (Grade)</label>
                              <input
                                type="text"
                                value={embryo.grade || ''}
                                placeholder="4AA, Grade A"
                                onChange={(e) => {
                                  const newList = [...currentCycle.embryo_lab!];
                                  newList[idx] = { ...newList[idx], grade: e.target.value };
                                  setCurrentCycle({ ...currentCycle, embryo_lab: newList });
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">اليوم الواصل له</label>
                              <input
                                type="number"
                                value={embryo.day_reached || 0}
                                onChange={(e) => {
                                  const newList = [...currentCycle.embryo_lab!];
                                  newList[idx] = { ...newList[idx], day_reached: parseInt(e.target.value) || 0 };
                                  setCurrentCycle({ ...currentCycle, embryo_lab: newList });
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!currentCycle.embryo_lab || currentCycle.embryo_lab.length === 0) && (
                    <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Microscope className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">اضغط على "إضافة جنين" للبدء في تتبع المعمل</p>
                    </div>
                  )}

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={async () => {
                        if (!currentCycle.embryo_lab) return;
                        const { error } = await smartStimulationService.saveEmbryoRecords(currentCycle.embryo_lab);
                        if (!error) {
                          toast.success('تم حفظ سجلات الأجنة');
                          loadCycleData(currentCycle.id);
                        } else {
                          toast.error('حدث خطأ أثناء الحفظ');
                        }
                      }}
                      className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl flex items-center gap-3"
                    >
                      <Save className="w-6 h-6" />
                      حفظ بيانات المعمل
                    </button>
                  </div>
                </div>
              )}

              {/* Transfer Prep Tab */}
              {currentTab === 'transfer' && currentCycle && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Baby className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">تهيئة النقل</h2>
                      <p className="text-gray-500">متابعة وتحضير الرحم لاستقبال الأجنة</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">تاريخ بدء التحضير</label>
                          <input
                            type="date"
                            value={currentCycle.transfer_prep?.prep_start_date || ''}
                            onChange={(e) => {
                              const prep = currentCycle.transfer_prep || { cycle_id: currentCycle.id };
                              setCurrentCycle({ ...currentCycle, transfer_prep: { ...prep, prep_start_date: e.target.value } });
                            }}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">التاريخ المتوقع للنقل</label>
                          <input
                            type="date"
                            value={currentCycle.transfer_prep?.planned_transfer_date || ''}
                            onChange={(e) => {
                              const prep = currentCycle.transfer_prep || { cycle_id: currentCycle.id };
                              setCurrentCycle({ ...currentCycle, transfer_prep: { ...prep, planned_transfer_date: e.target.value } });
                            }}
                            className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-emerald-700 text-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <label className="text-sm font-bold text-gray-700 block mb-4 text-center">سماكة بطانة الرحم (Endometrium)</label>
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-gray-200"
                              />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * (currentCycle.transfer_prep?.endometrium_thickness || 0)) / 15}
                                strokeLinecap="round"
                                className="text-emerald-500 transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black text-emerald-600">{currentCycle.transfer_prep?.endometrium_thickness || 0}</span>
                              <span className="text-xs font-bold text-gray-400">مم</span>
                            </div>
                          </div>

                          <input
                            type="range"
                            min="4"
                            max="15"
                            step="0.1"
                            value={currentCycle.transfer_prep?.endometrium_thickness || 7}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const prep = currentCycle.transfer_prep || { cycle_id: currentCycle.id };
                              setCurrentCycle({ ...currentCycle, transfer_prep: { ...prep, endometrium_thickness: val } });
                            }}
                            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                          />

                          <div className="text-center">
                            <span className={`px-4 py-1 rounded-full text-xs font-bold ${(currentCycle.transfer_prep?.endometrium_thickness || 0) >= 8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {(currentCycle.transfer_prep?.endometrium_thickness || 0) >= 8 ? 'حالة مثالية' : 'متابعة مطلوبة'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-10">
                    <button
                      onClick={async () => {
                        if (!currentCycle.transfer_prep) return;
                        const { error } = await smartStimulationService.saveTransferPrep(currentCycle.transfer_prep);
                        if (!error) {
                          toast.success('تم حفظ بيانات التهيئة');
                          loadCycleData(currentCycle.id);
                        } else {
                          toast.error('حدث خطأ أثناء الحفظ');
                        }
                      }}
                      className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-2xl flex items-center gap-3 active:scale-95"
                    >
                      <Save className="w-6 h-6" />
                      تأكيد وحفظ خطة التهيئة
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {currentTab === 'timeline' && (
                <TimelineView visits={visits} cycle={currentCycle} />
              )}

              {/* Summary / Final Report Tab */}
              {currentTab === 'summary' && currentCycle && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gray-900 text-white rounded-xl shadow-lg">
                        <ClipboardList className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">التقرير النهائي للدورة</h2>
                        <p className="text-gray-500 font-medium">سجل متكامل للرحلة العلاجية ونتائج الدورة</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      <Printer className="w-5 h-5" />
                      طباعة التقرير الطبي
                    </button>
                  </div>

                  <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:border-none" id="medical-report">
                    {/* Report Header for Print */}
                    <div className="bg-gray-900 text-white p-10 flex justify-between items-center border-b-8 border-indigo-500">
                      <div>
                        <h1 className="text-4xl font-black mb-1">MEDICAL CYCLE REPORT</h1>
                        <p className="text-indigo-300 font-bold tracking-widest uppercase">Smart IVF Copilot Intelligence System</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black tracking-tighter">NILE IVF CENTER</div>
                        <div className="text-sm opacity-60">Cycle ID: {currentCycle.id.substring(0, 8).toUpperCase()}</div>
                      </div>
                    </div>

                    <div className="p-10 space-y-12">
                      {/* Patient & Cycle Overview */}
                      <section>
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                          <User className="w-6 h-6 text-indigo-600" /> معلومات المريضة والدورة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">اسم المريضة</span>
                            <span className="text-xl font-bold">{selectedPatient?.name || 'غير محدد'}</span>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">العمر / BMI</span>
                            <span className="text-xl font-bold">{currentCycle.initial_assessment?.age || selectedPatient?.age || '??'} سنة / {currentCycle.initial_assessment?.bmi || '??'}</span>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">البروتوكول المستخدم</span>
                            <span className="text-xl font-bold text-indigo-700">{currentCycle.protocol_name || 'لم يحدد'}</span>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">تاريخ البدء</span>
                            <span className="text-xl font-bold">{currentCycle.start_date}</span>
                          </div>
                        </div>
                      </section>

                      {/* Stimulation Summary */}
                      <section>
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                          <TrendingUp className="w-6 h-6 text-teal-600" /> ملخص مرحلة التنشيط
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 border-2 border-gray-50 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-gray-400 block">إجمالي زيارات المتابعة</span>
                              <span className="text-3xl font-black text-gray-900">{visits.length} زيارة</span>
                            </div>
                            <Calendar className="w-10 h-10 text-gray-200" />
                          </div>
                          <div className="p-6 border-2 border-gray-50 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-gray-400 block">إجمالي جرعة FSH</span>
                              <span className="text-3xl font-black text-indigo-600">{visits.reduce((acc, v) => acc + (v.fsh_dose_given || 0), 0)} IU</span>
                            </div>
                            <Zap className="w-10 h-10 text-indigo-100" />
                          </div>
                          <div className="p-6 border-2 border-gray-50 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-gray-400 block">أقصى سماكة للبطانة</span>
                              <span className="text-3xl font-black text-emerald-600">{Math.max(...visits.map(v => v.endometrium_thickness || 0), 0)} mm</span>
                            </div>
                            <Activity className="w-10 h-10 text-emerald-100" />
                          </div>
                        </div>
                      </section>

                      {/* OPU & Lab Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-orange-50/30 p-8 rounded-3xl border border-orange-100">
                          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Egg className="w-5 h-5 text-orange-600" /> نتائج سحب البويضات (OPU)
                          </h3>
                          {currentCycle.opu_details ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center py-2 border-b border-orange-100">
                                <span className="font-bold text-gray-600 uppercase text-xs">عدد البويضات الكلي</span>
                                <span className="text-2xl font-black text-orange-700">{currentCycle.opu_details.oocytes_retrieved}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-gray-400 uppercase block">Mature (MII)</span>
                                  <span className="text-xl font-black text-green-600">{currentCycle.opu_details.mii_count || 0}</span>
                                </div>
                                <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-gray-400 uppercase block">Immature (MI)</span>
                                  <span className="text-xl font-black text-blue-600">{currentCycle.opu_details.mi_count || 0}</span>
                                </div>
                                <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                                  <span className="text-[10px] font-black text-gray-400 uppercase block">GV Stage</span>
                                  <span className="text-xl font-black text-yellow-600">{currentCycle.opu_details.gv_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400 font-bold">لا توجد بيانات متاحة لسحب البويضات</div>
                          )}
                        </section>

                        <section className="bg-indigo-50/30 p-8 rounded-3xl border border-indigo-100">
                          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Microscope className="w-5 h-5 text-indigo-600" /> نتائج المعمل والأجنة
                          </h3>
                          {currentCycle.embryo_lab && currentCycle.embryo_lab.length > 0 ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                                <span className="font-bold text-gray-600 uppercase text-xs">إجمالي عدد الأجنة</span>
                                <span className="text-2xl font-black text-indigo-700">{currentCycle.embryo_lab.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {currentCycle.embryo_lab.map((e, idx) => (
                                  <div key={idx} className="bg-white px-3 py-1 rounded-full border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase">
                                    #{e.embryo_number}: {e.status} ({e.grade || 'No Grade'})
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400 font-bold">لا توجد بيانات متاحة للمعمل</div>
                          )}
                        </section>
                      </div>

                      {/* Transfer & Outcome */}
                      <section className="bg-teal-50/20 p-10 rounded-3xl border-2 border-teal-50">
                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2 justify-center">
                          <Baby className="w-6 h-6 text-teal-600" /> النتيجة النهائية وحالة الدورة
                        </h3>

                        <div className="flex flex-col items-center gap-10">
                          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 print:hidden">
                            {[
                              { id: 'stimulation', label: 'Stim Active', color: 'bg-blue-500' },
                              { id: 'completed', label: 'Success (+ve)', color: 'bg-emerald-500' },
                              { id: 'cancelled', label: 'Failed (-ve)', color: 'bg-rose-500' }
                            ].map(btn => (
                              <button
                                key={btn.id}
                                onClick={async () => {
                                  setLoading(true);
                                  const { error } = await smartStimulationService.updateCycle(currentCycle.id, { status: btn.id as any });
                                  if (!error) {
                                    setCurrentCycle({ ...currentCycle, status: btn.id as any });
                                    toast.success('تم تحديث حالة الدورة');
                                  }
                                  setLoading(false);
                                }}
                                className={`px-6 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${currentCycle.status === btn.id
                                  ? `${btn.color} text-white shadow-xl scale-110`
                                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                  }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {btn.label}
                              </button>
                            ))}
                          </div>

                          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-white rounded-3xl shadow-lg border border-gray-50 flex flex-col items-center text-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">FINAL OUTCOME</span>
                              <div className={`p-4 rounded-full mb-4 ${currentCycle.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                currentCycle.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                <TrendingUp className="w-12 h-12" />
                              </div>
                              <span className={`text-4xl font-black ${currentCycle.status === 'completed' ? 'text-emerald-600' :
                                currentCycle.status === 'cancelled' ? 'text-rose-600' : 'text-gray-400'
                                }`}>
                                {currentCycle.status === 'completed' ? 'SUCCESSFUL PREGNANCY' :
                                  currentCycle.status === 'cancelled' ? 'FAILED TO CONCEIVE' : 'IN PROGRESS'}
                              </span>
                              <p className="mt-4 text-sm text-gray-400 font-medium max-w-xs">
                                تم توثيق النتيجة بناءً على الفحوصات المخبرية (Beta-HCG) والمتابعة السريرية.
                              </p>
                            </div>

                            <div className="flex flex-col gap-4">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">توصيات الطبيب النهائية</label>
                              <textarea
                                value={currentCycle.notes || ''}
                                onChange={(e) => setCurrentCycle({ ...currentCycle, notes: e.target.value })}
                                placeholder="اكتب التوصيات الطبية النهائية هنا..."
                                className="w-full flex-1 p-6 bg-white border-2 border-gray-50 rounded-3xl focus:border-indigo-500 outline-none font-bold text-gray-700 min-h-[200px]"
                              />
                              <button
                                onClick={async () => {
                                  setLoading(true);
                                  await smartStimulationService.updateCycle(currentCycle.id, { notes: currentCycle.notes });
                                  toast.success('تم حفظ التوصيات');
                                  setLoading(false);
                                }}
                                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all self-end flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" /> حفظ التدوينة
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Report Footer */}
                    <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Generated by Smart IVF Copilot v3.5</span>
                      <span>{new Date().toLocaleString()}</span>
                      <span>Physician Signature: _______________________</span>
                    </div>
                  </div>
                </div>
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
