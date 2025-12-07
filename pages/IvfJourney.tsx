import React, { useState, useEffect } from 'react';
import { db, calculateTMSC, analyzeSemenAnalysis, classifyOvarianReserve, calculateMaturationRate, calculateFertilizationRate } from '../services/ivfService';
import { Patient, PrescriptionItem, CycleAssessment, OpuLabData, TransferData, OutcomeData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, TrendingUp, PipetteIcon, Heart, Save, AlertCircle, CheckCircle, Pill, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import PrescriptionComponent from '../components/PrescriptionComponent';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import { supabase } from '../services/supabaseClient';

// Comprehensive Cycle Data Interface using existing types
interface CycleData {
  id: string;
  protocol: string;
  status: 'Assessment' | 'Active' | 'PickUp' | 'Transfer' | 'Frozen' | 'Done';
  assessment: CycleAssessment;
  stimulation: {
    logs: Array<{ date: string, cd: number, fsh: number, hmg: number, e2: number, lh: number, folliclesRt: string, folliclesLt: string }>;
    trigger: { date: string, type: string, hours: number };
    prescription: Array<string>;
  };
  lab: OpuLabData;
  transfer: TransferData;
  outcome: OutcomeData;
}

const IvfJourney: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'stimulation' | 'lab' | 'transfer'>('assessment');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);

  // Load patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const pats = await db.getPatients();
        setPatients(pats);
      } catch (error) {
        toast.error('Failed to load patients');
      }
    };
    loadPatients();
  }, []);

  // Load cycle data when patient changes
  useEffect(() => {
    const loadCycle = async () => {
      if (selectedPatientId) {
        try {
          const cycles = await db.getCycles();
          const activeCycle = cycles.find(c => c.patientId === selectedPatientId && c.status === 'Active');

          if (activeCycle) {
            // Load existing cycle data
            setCycleData({
              id: activeCycle.id,
              protocol: activeCycle.protocol,
              status: activeCycle.status as any,
              assessment: activeCycle.assessment || {
                coupleProfile: {},
                maleFactor: {},
                femaleFactor: {},
                tubalUterine: {}
              },
              stimulation: {
                logs: activeCycle.logs.map(log => ({
                  date: log.date,
                  cd: log.cycleDay,
                  fsh: parseFloat(log.fsh) || 0,
                  hmg: parseFloat(log.hmg) || 0,
                  e2: parseFloat(log.e2) || 0,
                  lh: parseFloat(log.lh) || 0,
                  folliclesRt: log.rtFollicles,
                  folliclesLt: log.ltFollicles
                })),
                trigger: { date: '', type: '', hours: 0 },
                prescription: []
              },
              lab: activeCycle.lab || {},
              transfer: activeCycle.transfer || { lutealSupport: [] },
              outcome: activeCycle.outcome || {}
            });
          } else {
            // Initialize new cycle
            setCycleData(null);
          }
        } catch (error) {
          toast.error('Failed to load cycle data');
        }
      }
    };
    loadCycle();
  }, [selectedPatientId]);

  // Start new cycle
  const startNewCycle = async (protocol: string) => {
    if (!selectedPatientId) {
      toast.error('Select a patient first');
      return;
    }

    const toastId = toast.loading('Starting new cycle...');
    try {
      const newCycle = await db.saveCycle({
        patientId: selectedPatientId,
        protocol: protocol as any,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });

      setCycleData({
        id: newCycle.id,
        protocol: protocol,
        status: 'Active',
        assessment: {
          coupleProfile: {},
          maleFactor: {},
          femaleFactor: {},
          tubalUterine: {}
        },
        stimulation: {
          logs: [],
          trigger: { date: '', type: '', hours: 0 },
          prescription: []
        },
        lab: {},
        transfer: { lutealSupport: [] },
        outcome: {}
      });

      setActiveTab('assessment');
      toast.success('New IVF Cycle Started', { id: toastId });
    } catch (error) {
      toast.error('Error starting cycle', { id: toastId });
    }
  };

  // Save cycle data to Supabase
  const saveCycleData = async (section: keyof CycleData, data: any) => {
    if (!cycleData) return;

    try {
      const updateData: any = {};
      updateData[`${section}_data`] = data;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('ivf_cycles')
        .update(updateData)
        .eq('id', cycleData.id);

      if (error) throw error;

      setCycleData({ ...cycleData, [section]: data });
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully`);
    } catch (error) {
      toast.error(`Failed to save ${section} data`);
    }
  };

  // Auto-calculations
  const maleTMSC = calculateTMSC(
    cycleData?.assessment.maleFactor?.volume || 0,
    cycleData?.assessment.maleFactor?.concentration || 0,
    cycleData?.assessment.maleFactor?.motility || 0
  );

  const maleDiagnosis = analyzeSemenAnalysis(
    cycleData?.assessment.maleFactor?.volume || 0,
    cycleData?.assessment.maleFactor?.concentration || 0,
    cycleData?.assessment.maleFactor?.motility || 0,
    cycleData?.assessment.maleFactor?.morphology || 0
  );

  const ovarianReserve = classifyOvarianReserve(
    cycleData?.assessment.femaleFactor?.amh,
    cycleData?.assessment.femaleFactor?.afcRight
  );

  const maturationRate = calculateMaturationRate(
    cycleData?.lab.totalOocytes || 0,
    cycleData?.lab.mii || 0
  );

  const fertilizationRate = calculateFertilizationRate(
    cycleData?.lab.fertilizedTwoPN || 0,
    cycleData?.lab.mii || 0
  );

  // Chart data for stimulation
  const chartData = cycleData?.stimulation.logs.map(log => ({
    day: `D${log.cd}`,
    e2: log.e2,
    follicles: (log.folliclesRt.split(',').length + log.folliclesLt.split(',').length) || 0
  })) || [];

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" dir="ltr">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Patient</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">-- Select Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPatientId && !cycleData && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Protocol</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500"
                  id="protocol-select"
                >
                  <option value="Long">Long Protocol</option>
                  <option value="Antagonist">Antagonist Protocol</option>
                  <option value="Flare-up">Flare-up Protocol</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const protocol = (document.getElementById('protocol-select') as HTMLSelectElement).value;
                  startNewCycle(protocol);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Start New Cycle
              </button>
            </>
          )}
        </div>
      </div>

      {cycleData ? (
        <>
          {/* Tabs Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-100 bg-gray-50">
              {[
                { id: 'assessment', label: '📋 التقييم الذكي', icon: '📋' },
                { id: 'stimulation', label: '💉 التحفيز والمراقبة', icon: '💉' },
                { id: 'lab', label: '🔬 المعمل والأجنة', icon: '🔬' },
                { id: 'transfer', label: '👶 النقل والنتيجة', icon: '👶' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 font-bold text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-4 border-teal-600 text-teal-700 bg-teal-50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Tab 1: Smart Assessment */}
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">📋 التقييم الذكي - Smart Assessment</h3>

                  {/* Male Factor */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">العامل الذكري - Male Factor (WHO 2021)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Volume (mL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cycleData.assessment.maleFactor?.volume || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              maleFactor: { ...cycleData.assessment.maleFactor, volume: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Concentration (M/mL)</label>
                        <input
                          type="number"
                          value={cycleData.assessment.maleFactor?.concentration || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              maleFactor: { ...cycleData.assessment.maleFactor, concentration: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Motility (%)</label>
                        <input
                          type="number"
                          value={cycleData.assessment.maleFactor?.motility || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              maleFactor: { ...cycleData.assessment.maleFactor, motility: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Morphology (%)</label>
                        <input
                          type="number"
                          value={cycleData.assessment.maleFactor?.morphology || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              maleFactor: { ...cycleData.assessment.maleFactor, morphology: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">TMSC: {maleTMSC}M</span>
                      </div>
                      <div className="text-sm text-blue-700">Diagnosis: {maleDiagnosis}</div>
                      {maleTMSC < 5 && (
                        <div className="flex items-center gap-2 mt-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">🔴 Severe Male Factor (ICSI Required)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Female Factor */}
                  <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
                    <h4 className="text-lg font-semibold text-pink-800 mb-4">العامل الأنثوي - Female Factor (Ovarian Reserve)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">AMH (ng/mL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cycleData.assessment.femaleFactor?.amh || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              femaleFactor: { ...cycleData.assessment.femaleFactor, amh: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">FSH (IU/L)</label>
                        <input
                          type="number"
                          value={cycleData.assessment.femaleFactor?.fsh || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              femaleFactor: { ...cycleData.assessment.femaleFactor, fsh: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">AFC</label>
                        <input
                          type="number"
                          value={cycleData.assessment.femaleFactor?.afcRight || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              femaleFactor: { ...cycleData.assessment.femaleFactor, afcRight: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-pink-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-pink-600" />
                        <span className="font-semibold text-pink-800">Ovarian Classification: {ovarianReserve}</span>
                      </div>
                      {ovarianReserve === 'High Responder' && (
                        <div className="flex items-center gap-2 mt-2 text-purple-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">⚠️ High Responder (PCOS Risk - OHSS Prevention)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => saveCycleData('assessment', cycleData.assessment)}
                    className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    حفظ التقييم - Save Assessment
                  </button>
                </div>
              )}

              {/* Tab 2: Stimulation & Monitoring */}
              {activeTab === 'stimulation' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">💉 التحفيز والمراقبة - Stimulation & Monitoring</h3>
                    <div className="text-sm text-gray-600">
                      Protocol: {cycleData.protocol} | Start: {cycleData.stimulation.logs[0]?.date || 'Not started'}
                    </div>
                  </div>

                  {/* Charts */}
                  {chartData.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        E2 Levels & Follicle Growth
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="e2" stroke="#00838f" strokeWidth={2} dot={{r: 3}} name="E2 (pg/mL)" />
                            <Line yAxisId="right" type="monotone" dataKey="follicles" stroke="#ff6b6b" strokeWidth={2} dot={{r: 3}} name="Follicles >14mm" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Stimulation Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3">CD</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">FSH</th>
                          <th className="px-4 py-3">HMG</th>
                          <th className="px-4 py-3">E2</th>
                          <th className="px-4 py-3">LH</th>
                          <th className="px-4 py-3">Rt Follicles</th>
                          <th className="px-4 py-3">Lt Follicles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycleData.stimulation.logs.map((log, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-3 font-bold">D{log.cd}</td>
                            <td className="px-4 py-3">{log.date}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={log.fsh || ''}
                                onChange={(e) => {
                                  const newLogs = [...cycleData.stimulation.logs];
                                  newLogs[index].fsh = parseFloat(e.target.value) || 0;
                                  setCycleData({
                                    ...cycleData,
                                    stimulation: { ...cycleData.stimulation, logs: newLogs }
                                  });
                                }}
                                className="w-16 px-2 py-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={log.hmg || ''}
                                onChange={(e) => {
                                  const newLogs = [...cycleData.stimulation.logs];
                                  newLogs[index].hmg = parseFloat(e.target.value) || 0;
                                  setCycleData({
                                    ...cycleData,
                                    stimulation: { ...cycleData.stimulation, logs: newLogs }
                                  });
                                }}
                                className="w-16 px-2 py-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={log.e2 || ''}
                                onChange={(e) => {
                                  const newLogs = [...cycleData.stimulation.logs];
                                  newLogs[index].e2 = parseFloat(e.target.value) || 0;
                                  setCycleData({
                                    ...cycleData,
                                    stimulation: { ...cycleData.stimulation, logs: newLogs }
                                  });
                                }}
                                className="w-16 px-2 py-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={log.lh || ''}
                                onChange={(e) => {
                                  const newLogs = [...cycleData.stimulation.logs];
                                  newLogs[index].lh = parseFloat(e.target.value) || 0;
                                  setCycleData({
                                    ...cycleData,
                                    stimulation: { ...cycleData.stimulation, logs: newLogs }
                                  });
                                }}
                                className="w-16 px-2 py-1 border rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={log.folliclesRt}
                                onChange={(e) => {
                                  const newLogs = [...cycleData.stimulation.logs];
                                  newLogs[index].folliclesRt = e.target.value;
                                  setCycleData({
                                    ...cycleData,
                                    stimulation: { ...cycleData.stimulation, logs: newLogs }
                                  });
                                }}
                                className="w-24 px-2 py-1 border rounded text-center"
                                placeholder="18,20,22"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={log.folliclesLt}
                                onChange={(e) => {
                                  const newLogs = [...cycleData.stimulation.logs];
                                  newLogs[index].folliclesLt = e.target.value;
                                  setCycleData({
                                    ...cycleData,
                                    stimulation: { ...cycleData.stimulation, logs: newLogs }
                                  });
                                }}
                                className="w-24 px-2 py-1 border rounded text-center"
                                placeholder="18,20,22"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => {
                      const lastDay = cycleData.stimulation.logs.length > 0
                        ? cycleData.stimulation.logs[cycleData.stimulation.logs.length - 1].cd
                        : 0;
                      const newLog = {
                        date: new Date().toISOString().split('T')[0],
                        cd: lastDay + 1,
                        fsh: 0,
                        hmg: 0,
                        e2: 0,
                        lh: 0,
                        folliclesRt: '',
                        folliclesLt: ''
                      };
                      setCycleData({
                        ...cycleData,
                        stimulation: {
                          ...cycleData.stimulation,
                          logs: [...cycleData.stimulation.logs, newLog]
                        }
                      });
                    }}
                    className="flex items-center gap-2 text-green-700 font-bold hover:bg-green-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    <PlusCircle className="w-5 h-5" />
                    إضافة يوم - Add Day
                  </button>

                  {/* Prescription Integration */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <PrescriptionComponent
                      prescriptions={prescription}
                      onPrescriptionsChange={setPrescription}
                      onPrint={() => setIsPrinterOpen(true)}
                      showPrintButton={true}
                    />
                  </div>

                  <button
                    onClick={() => saveCycleData('stimulation', cycleData.stimulation)}
                    className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    حفظ بيانات التحفيز - Save Stimulation Data
                  </button>
                </div>
              )}

              {/* Tab 3: OPU & Embryology */}
              {activeTab === 'lab' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">🔬 المعمل والأجنة - OPU & Embryology</h3>

                  {/* OPU Procedure */}
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">إجراء السحب - OPU Procedure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">OPU Date</label>
                        <input
                          type="date"
                          value={cycleData.lab.opuDate}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            lab: { ...cycleData.lab, opuDate: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Oocyte Data */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">بيانات البويضات - Oocyte Data</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Oocytes</label>
                        <input
                          type="number"
                          value={cycleData.lab.totalOocytes || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            lab: { ...cycleData.lab, totalOocytes: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">MII</label>
                        <input
                          type="number"
                          value={cycleData.lab.mii || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            lab: { ...cycleData.lab, mii: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">MI</label>
                        <input
                          type="number"
                          value={cycleData.lab.mi || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            lab: { ...cycleData.lab, mi: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">GV</label>
                        <input
                          type="number"
                          value={cycleData.lab.gv || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            lab: { ...cycleData.lab, gv: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                      <div className="text-lg font-semibold text-blue-800">
                        Maturation Rate: {maturationRate}%
                      </div>
                      <div className="text-sm text-blue-600">
                        ({cycleData.lab.mii || 0} / {cycleData.lab.totalOocytes || 0} oocytes)
                      </div>
                    </div>
                  </div>

                  {/* Fertilization */}
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h4 className="text-lg font-semibold text-purple-800 mb-4">الإخصاب - Fertilization (Day 1)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">2PN Count</label>
                        <input
                          type="number"
                          value={cycleData.lab.fertilizedTwoPN || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            lab: { ...cycleData.lab, fertilizedTwoPN: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="p-4 bg-purple-100 rounded-lg">
                        <div className="text-lg font-semibold text-purple-800">
                          Fertilization Rate: {fertilizationRate}%
                        </div>
                        <div className="text-sm text-purple-600">
                          ({cycleData.lab.fertilizedTwoPN || 0} / {cycleData.lab.mii || 0} MII oocytes)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Embryo Grading */}
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-4">تصنيف الأجنة - Embryo Grading</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Day 3 Embryos</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600">Grade A</label>
                            <input
                              type="number"
                              value={cycleData.lab.embryoDay3A || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                lab: { ...cycleData.lab, embryoDay3A: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Grade B</label>
                            <input
                              type="number"
                              value={cycleData.lab.embryoDay3B || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                lab: { ...cycleData.lab, embryoDay3B: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Grade C</label>
                            <input
                              type="number"
                              value={cycleData.lab.embryoDay3C || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                lab: { ...cycleData.lab, embryoDay3C: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Day 5 Blastocysts</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600">Expanded</label>
                            <input
                              type="number"
                              value={cycleData.lab.blastocystsExpanded || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                lab: { ...cycleData.lab, blastocystsExpanded: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Hatching</label>
                            <input
                              type="number"
                              value={cycleData.lab.blastocystsHatching || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                lab: { ...cycleData.lab, blastocystsHatching: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => saveCycleData('lab', cycleData.lab)}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    حفظ بيانات المعمل - Save Lab Data
                  </button>
                </div>
              )}

              {/* Tab 4: Transfer & Outcome */}
              {activeTab === 'transfer' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">👶 النقل والنتيجة - Transfer & Outcome</h3>

                  {/* Transfer Details */}
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                    <h4 className="text-lg font-semibold text-red-800 mb-4">تفاصيل النقل - Transfer Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transfer Date</label>
                        <input
                          type="date"
                          value={cycleData.transfer.transferDate || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            transfer: { ...cycleData.transfer, transferDate: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Embryos Transferred</label>
                        <input
                          type="number"
                          value={cycleData.transfer.numberTransferred || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            transfer: { ...cycleData.transfer, numberTransferred: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Embryo Quality</label>
                        <input
                          value={cycleData.transfer.embryoQuality || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            transfer: { ...cycleData.transfer, embryoQuality: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="e.g., Day 5 expanded blastocyst"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Outcome */}
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h4 className="text-lg font-semibold text-purple-800 mb-4">النتيجة - Outcome</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Beta-HCG Result</label>
                        <select
                          value={cycleData.outcome.betaHcgPositive ? 'Positive' : cycleData.outcome.betaHcgPositive === false ? 'Negative' : 'Pending'}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            outcome: {
                              ...cycleData.outcome,
                              betaHcgPositive: e.target.value === 'Positive' ? true : e.target.value === 'Negative' ? false : undefined
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className={`text-2xl font-bold ${
                          cycleData.outcome.betaHcgPositive === true ? 'text-green-600' :
                          cycleData.outcome.betaHcgPositive === false ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {cycleData.outcome.betaHcgPositive === true ? '✅ Pregnancy!' :
                           cycleData.outcome.betaHcgPositive === false ? '❌ No Pregnancy' : '⏳ Pending'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => saveCycleData('transfer', cycleData.transfer)}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                      <Save className="w-5 h-5 inline mr-2" />
                      حفظ بيانات النقل - Save Transfer Data
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await saveCycleData('transfer', cycleData.transfer);
                          setCycleData({ ...cycleData, status: 'Done' });
                          toast.success('Cycle archived successfully!');
                        } catch (error) {
                          toast.error('Failed to archive cycle');
                        }
                      }}
                      className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                    >
                      📁 إغلاق الدورة - Archive Cycle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400">
          <Baby className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-gray-600">Select a patient and start a new IVF cycle to begin tracking.</p>
        </div>
      )}

      {/* Prescription Printer */}
      <PrescriptionPrinter
        patient={selectedPatient || null}
        prescriptions={prescription}
        diagnosis={`IVF Cycle - ${cycleData?.protocol || 'Unknown Protocol'}`}
        notes={`Cycle ID: ${cycleData?.id || 'N/A'}`}
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />
    </div>
  );
};

export default IvfJourney;
