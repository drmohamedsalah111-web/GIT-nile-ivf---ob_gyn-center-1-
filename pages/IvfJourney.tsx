import React, { useState, useEffect } from 'react';
import { db, calculateBMI, calculateTMSC, analyzeSemenAnalysis, classifyOvarianReserve, calculateMaturationRate, calculateFertilizationRate } from '../services/ivfService';
import { PROTOCOLS } from '../constants';
import { IvfCycle, Patient, StimulationLog, CycleAssessment, OpuLabData, TransferData, OutcomeData } from '../types';
import { visitsService } from '../services/visitsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, FileText, AlertCircle, CheckCircle, TrendingUp, Zap, PipetteIcon, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const IvfJourney: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeCycle, setActiveCycle] = useState<IvfCycle | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'stimulation' | 'opu' | 'transfer'>('assessment');
  const [newProtocol, setNewProtocol] = useState('Long');

  const [assessment, setAssessment] = useState<CycleAssessment>({
    coupleProfile: {},
    maleFactor: {},
    femaleFactor: {},
    tubalUterine: {}
  });

  const [labData, setLabData] = useState<OpuLabData>({});
  const [transferData, setTransferData] = useState<TransferData>({ lutealSupport: [] });
  const [outcomeData, setOutcomeData] = useState<OutcomeData>({});

  useEffect(() => {
    db.getPatients().then(setPatients);
  }, []);

  useEffect(() => {
    const loadCycle = async () => {
      if (selectedPatientId) {
        const cycles = await db.getCycles();
        const current = cycles.find(c => c.patientId === selectedPatientId && c.status === 'Active');
        if (current) {
          setActiveCycle(current);
          setAssessment(current.assessment || assessment);
          setLabData(current.lab || {});
          setTransferData(current.transfer || { lutealSupport: [] });
          setOutcomeData(current.outcome || {});
        } else {
          setActiveCycle(null);
        }
      }
    };
    loadCycle();
  }, [selectedPatientId]);

  const startNewCycle = async () => {
    if (!selectedPatientId) {
      toast.error('Select a patient first');
      return;
    }
    const toastId = toast.loading('Starting new cycle...');
    try {
      const newCycle = await db.saveCycle({
        patientId: selectedPatientId,
        protocol: newProtocol as any,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });

      setActiveCycle({
        ...newCycle,
        id: newCycle.id,
        logs: [],
        assessment: {
          coupleProfile: {},
          maleFactor: {},
          femaleFactor: {},
          tubalUterine: {}
        }
      });
      setAssessment({ coupleProfile: {}, maleFactor: {}, femaleFactor: {}, tubalUterine: {} });
      setLabData({});
      setTransferData({ lutealSupport: [] });
      setOutcomeData({});
      setActiveTab('assessment');
      toast.success('New IVF Cycle Started', { id: toastId });
    } catch (e) {
      toast.error('Error starting cycle', { id: toastId });
    }
  };

  const saveAssessment = async () => {
    if (!activeCycle) return;
    try {
      await db.updateCycleAssessment(activeCycle.id, assessment);
      setActiveCycle({ ...activeCycle, assessment });
      toast.success('Assessment saved');
    } catch (error) {
      toast.error('Failed to save assessment');
    }
  };

  const addDayLog = async () => {
    if (!activeCycle) return;
    const lastDay = activeCycle.logs.length > 0 ? activeCycle.logs[activeCycle.logs.length - 1].cycleDay : 0;
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      cycleDay: lastDay + 1,
      fsh: '',
      hmg: '',
      e2: '',
      lh: '',
      rtFollicles: '',
      ltFollicles: '',
      endometriumThickness: ''
    };

    try {
      await db.addLog(activeCycle.id, newLog);
      const optimisticLog = { ...newLog, id: crypto.randomUUID() };
      setActiveCycle({
        ...activeCycle,
        logs: [...activeCycle.logs, optimisticLog]
      });
      toast.success('Day log added');
    } catch (e) {
      toast.error('Failed to add log');
    }
  };

  const updateLog = async (id: string, field: keyof StimulationLog, value: string) => {
    if (!activeCycle) return;

    const updatedLogs = activeCycle.logs.map(log =>
      log.id === id ? { ...log, [field]: value } : log
    );
    setActiveCycle({ ...activeCycle, logs: updatedLogs });

    try {
      await db.updateLog(id, { [field]: value });
    } catch (e) {
      console.error('Save failed');
    }
  };

  const saveLabData = async () => {
    if (!activeCycle) return;
    try {
      await db.updateCycleLabData(activeCycle.id, labData);
      setActiveCycle({ ...activeCycle, lab: labData });
      toast.success('Lab data saved');
    } catch (error) {
      toast.error('Failed to save lab data');
    }
  };

  const saveTransferData = async () => {
    if (!activeCycle) return;
    try {
      await db.updateCycleTransfer(activeCycle.id, transferData);
      setActiveCycle({ ...activeCycle, transfer: transferData });
      toast.success('Transfer data saved');
    } catch (error) {
      toast.error('Failed to save transfer data');
    }
  };

  const saveOutcome = async () => {
    if (!activeCycle) return;
    try {
      await db.updateCycleOutcome(activeCycle.id, outcomeData);
      setActiveCycle({ ...activeCycle, outcome: outcomeData, status: 'Completed' });
      toast.success('Outcome saved and cycle completed');
    } catch (error) {
      toast.error('Failed to save outcome');
    }
  };

  const tmsc = calculateTMSC(assessment.maleFactor?.volume || 0, assessment.maleFactor?.concentration || 0, assessment.maleFactor?.motility || 0);
  const bmi = assessment.coupleProfile?.bmi || 0;
  const { bmi: bmiValue, alert: bmiAlert } = calculateBMI(bmi, 165);
  const ovaryClassification = classifyOvarianReserve(assessment.femaleFactor?.amh, assessment.femaleFactor?.afcRight);
  const maturationRate = calculateMaturationRate(labData.totalOocytes || 0, labData.mii || 0);
  const fertilizationRate = calculateFertilizationRate(labData.fertilized2PN || 0, labData.mii || 0);

  const chartData = activeCycle?.logs.map(log => ({
    day: `D${log.cycleDay}`,
    e2: parseFloat(log.e2) || 0,
    lh: parseFloat(log.lh) || 0,
    follicles: Math.max(parseInt(log.rtFollicles?.split(',')[0]) || 0, parseInt(log.ltFollicles?.split(',')[0]) || 0)
  })) || [];

  const suggestedProtocol = ovaryClassification === 'Poor Responder' ? 'Antagonist' : ovaryClassification === 'High Responder' ? 'Antagonist' : newProtocol;

  const LUTEAL_SUPPORT_OPTIONS = [
    'Progesterone (Crinone)',
    'Progesterone (Cyclogest)',
    'hCG (1500 IU)',
    'Estradiol (Progynova)',
    'Aspirin 75mg',
    'Prednisolone 10mg'
  ];

  return (
    <div className="space-y-6">
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

          {selectedPatientId && !activeCycle && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Protocol</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500"
                  value={newProtocol}
                  onChange={(e) => setNewProtocol(e.target.value)}
                >
                  {PROTOCOLS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={startNewCycle}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Start New Cycle
              </button>
            </>
          )}
        </div>
      </div>

      {activeCycle ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-100 bg-gray-50">
              {[
                { id: 'assessment', label: '📊 Assessment', icon: '📊' },
                { id: 'stimulation', label: '💉 Stimulation', icon: '💉' },
                { id: 'opu', label: '🥚 OPU & Embryology', icon: '🥚' },
                { id: 'transfer', label: '👶 Transfer & Outcome', icon: '👶' }
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
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Baby className="w-5 h-5 text-teal-600" /> Couple Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Duration of Infertility (years)</label>
                        <input
                          type="number"
                          value={assessment.coupleProfile?.infertilityDuration || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            coupleProfile: { ...assessment.coupleProfile, infertilityDuration: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                        <select
                          value={assessment.coupleProfile?.infertilityType || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            coupleProfile: { ...assessment.coupleProfile, infertilityType: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Previous IVF Attempts</label>
                        <input
                          type="number"
                          value={assessment.coupleProfile?.previousAttempts || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            coupleProfile: { ...assessment.coupleProfile, previousAttempts: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">BMI (kg/m²)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={assessment.coupleProfile?.bmi || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            coupleProfile: { ...assessment.coupleProfile, bmi: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" /> Male Factor (WHO 2021)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Volume (mL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={assessment.maleFactor?.volume || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            maleFactor: { ...assessment.maleFactor, volume: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Concentration (M/mL)</label>
                        <input
                          type="number"
                          value={assessment.maleFactor?.concentration || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            maleFactor: { ...assessment.maleFactor, concentration: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Motility (%)</label>
                        <input
                          type="number"
                          value={assessment.maleFactor?.motility || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            maleFactor: { ...assessment.maleFactor, motility: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Morphology (%)</label>
                        <input
                          type="number"
                          value={assessment.maleFactor?.morphology || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            maleFactor: { ...assessment.maleFactor, morphology: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-800">TMSC</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700">{tmsc}M</div>
                        {tmsc < 5 && (
                          <div className="flex items-center gap-1 mt-2 text-yellow-700 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            ICSI Indicated
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="font-semibold text-gray-700 mb-2">Diagnosis</div>
                        <div className="text-sm text-gray-600">
                          {analyzeSemenAnalysis(assessment.maleFactor?.volume || 0, assessment.maleFactor?.concentration || 0, assessment.maleFactor?.motility || 0, assessment.maleFactor?.morphology || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600" /> Female Factor (Ovarian Reserve)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">AMH (ng/mL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={assessment.femaleFactor?.amh || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            femaleFactor: { ...assessment.femaleFactor, amh: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">FSH (IU/L)</label>
                        <input
                          type="number"
                          value={assessment.femaleFactor?.fsh || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            femaleFactor: { ...assessment.femaleFactor, fsh: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">AFC Right</label>
                        <input
                          type="number"
                          value={assessment.femaleFactor?.afcRight || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            femaleFactor: { ...assessment.femaleFactor, afcRight: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">AFC Left</label>
                        <input
                          type="number"
                          value={assessment.femaleFactor?.afcLeft || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            femaleFactor: { ...assessment.femaleFactor, afcLeft: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-pink-600" />
                        <span className="font-semibold text-gray-800">Ovarian Classification</span>
                      </div>
                      <div className={`text-lg font-bold ${
                        ovaryClassification === 'Poor Responder' ? 'text-red-700' :
                        ovaryClassification === 'High Responder' ? 'text-purple-700' :
                        'text-green-700'
                      }`}>
                        {ovaryClassification}
                      </div>
                      {suggestedProtocol !== newProtocol && (
                        <div className="text-sm text-gray-600 mt-2">
                          💡 Consider "{suggestedProtocol}" protocol for {ovaryClassification} patients
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tubal & Uterine Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">HSG Findings</label>
                        <textarea
                          value={assessment.tubalUterine?.hsgFindings || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            tubalUterine: { ...assessment.tubalUterine, hsgFindings: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none h-24 resize-none"
                          placeholder="e.g., Patent bilateral tubes, uterus normal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Hysteroscopy Findings</label>
                        <textarea
                          value={assessment.tubalUterine?.hysteroscopyFindings || ''}
                          onChange={(e) => setAssessment({
                            ...assessment,
                            tubalUterine: { ...assessment.tubalUterine, hysteroscopyFindings: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none h-24 resize-none"
                          placeholder="e.g., Normal cavity"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      {['septate', 'polyps', 'adhesions'].map(finding => (
                        <label key={finding} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(assessment.tubalUterine as any)?.[finding] || false}
                            onChange={(e) => setAssessment({
                              ...assessment,
                              tubalUterine: { ...assessment.tubalUterine, [finding]: e.target.checked }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm font-semibold text-gray-700 capitalize">{finding}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={saveAssessment}
                    className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors mt-6"
                  >
                    Save Assessment
                  </button>
                </div>
              )}

              {activeTab === 'stimulation' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-teal-700 text-white p-4 rounded-lg">
                      <div className="text-sm opacity-80">Protocol</div>
                      <div className="text-2xl font-bold">{activeCycle.protocol}</div>
                    </div>
                    <div className="bg-blue-700 text-white p-4 rounded-lg">
                      <div className="text-sm opacity-80">Start Date</div>
                      <div className="text-2xl font-bold">{activeCycle.startDate}</div>
                    </div>
                    <div className="bg-purple-700 text-white p-4 rounded-lg">
                      <div className="text-sm opacity-80">Stimulation Days</div>
                      <div className="text-2xl font-bold">{activeCycle.logs.length}</div>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-600" /> Hormone Trends
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
                            <Line yAxisId="left" type="monotone" dataKey="lh" stroke="#0066cc" strokeWidth={2} dot={{r: 3}} name="LH (IU/L)" />
                            <Line yAxisId="right" type="monotone" dataKey="follicles" stroke="#ff6b6b" strokeWidth={2} dot={{r: 3}} name="Max Follicle (mm)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <TestTube className="text-teal-600" /> Stimulation Sheet
                    </h3>
                    <button
                      onClick={addDayLog}
                      className="flex items-center gap-2 text-green-700 font-bold hover:bg-green-100 px-4 py-2 rounded-lg transition-colors"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Day
                    </button>
                  </div>

                  <div className="overflow-x-auto text-left">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">CD</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-teal-700">FSH</th>
                          <th className="px-4 py-3 text-teal-700">HMG</th>
                          <th className="px-4 py-3 text-blue-700">E2</th>
                          <th className="px-4 py-3 text-blue-700">LH</th>
                          <th className="px-4 py-3">Rt Foll</th>
                          <th className="px-4 py-3">Lt Foll</th>
                          <th className="px-4 py-3">Endo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {activeCycle.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold text-gray-800">D{log.cycleDay}</td>
                            <td className="px-4 py-3 font-mono text-gray-500">{log.date.slice(5)}</td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-teal-500 outline-none text-sm" value={log.fsh} onChange={e => updateLog(log.id, 'fsh', e.target.value)} placeholder="150" /></td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-teal-500 outline-none text-sm" value={log.hmg} onChange={e => updateLog(log.id, 'hmg', e.target.value)} placeholder="1" /></td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-blue-500 outline-none text-sm" value={log.e2} onChange={e => updateLog(log.id, 'e2', e.target.value)} placeholder="100" /></td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-blue-500 outline-none text-sm" value={log.lh} onChange={e => updateLog(log.id, 'lh', e.target.value)} placeholder="2" /></td>
                            <td className="p-2"><input className="w-20 p-1 border rounded focus:border-gray-400 outline-none text-sm" value={log.rtFollicles} onChange={e => updateLog(log.id, 'rtFollicles', e.target.value)} placeholder="18,20" /></td>
                            <td className="p-2"><input className="w-20 p-1 border rounded focus:border-gray-400 outline-none text-sm" value={log.ltFollicles} onChange={e => updateLog(log.id, 'ltFollicles', e.target.value)} placeholder="18,20" /></td>
                            <td className="p-2"><input className="w-16 p-1 text-center border rounded focus:border-gray-400 outline-none text-sm" value={log.endometriumThickness || ''} onChange={e => updateLog(log.id, 'endometriumThickness', e.target.value)} placeholder="10" /></td>
                          </tr>
                        ))}
                        {activeCycle.logs.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-8 text-gray-400 italic text-center">No stimulation logs. Click 'Add Day' to begin.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'opu' && (
                <div className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <PipetteIcon className="w-5 h-5 text-green-600" /> OPU Day
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={labData.opuDate || ''}
                          onChange={(e) => setLabData({ ...labData, opuDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Total Oocytes</label>
                        <input
                          type="number"
                          value={labData.totalOocytes || ''}
                          onChange={(e) => setLabData({ ...labData, totalOocytes: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">MII</label>
                        <input
                          type="number"
                          value={labData.mii || ''}
                          onChange={(e) => setLabData({ ...labData, mii: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">MI</label>
                        <input
                          type="number"
                          value={labData.mi || ''}
                          onChange={(e) => setLabData({ ...labData, mi: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">GV</label>
                        <input
                          type="number"
                          value={labData.gv || ''}
                          onChange={(e) => setLabData({ ...labData, gv: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="font-semibold text-gray-800 mb-3">Maturation Rate</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-700">{maturationRate}%</div>
                      <div className="text-sm text-gray-600">({labData.mii} / {labData.totalOocytes} oocytes)</div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Fertilization (Day 1)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">2PN Count</label>
                        <input
                          type="number"
                          value={labData.fertilized2PN || ''}
                          onChange={(e) => setLabData({ ...labData, fertilized2PN: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Atretic</label>
                        <input
                          type="number"
                          value={labData.atretic || ''}
                          onChange={(e) => setLabData({ ...labData, atretic: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="font-semibold text-gray-800 mb-3">Fertilization Rate</div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-700">{fertilizationRate}%</div>
                        <div className="text-sm text-gray-600">({labData.fertilized2PN} / {labData.mii} MII oocytes)</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Embryo Grading</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Day 3 Embryos</label>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Grade A</label>
                          <input
                            type="number"
                            value={labData.embryoDay3A || ''}
                            onChange={(e) => setLabData({ ...labData, embryoDay3A: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Grade B</label>
                          <input
                            type="number"
                            value={labData.embryoDay3B || ''}
                            onChange={(e) => setLabData({ ...labData, embryoDay3B: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Grade C</label>
                          <input
                            type="number"
                            value={labData.embryoDay3C || ''}
                            onChange={(e) => setLabData({ ...labData, embryoDay3C: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Day 5 Blastocysts</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Expanded</label>
                          <input
                            type="number"
                            value={labData.blastocystsExpanded || ''}
                            onChange={(e) => setLabData({ ...labData, blastocystsExpanded: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Hatching</label>
                          <input
                            type="number"
                            value={labData.blastocystsHatching || ''}
                            onChange={(e) => setLabData({ ...labData, blastocystsHatching: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveLabData}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mt-6"
                  >
                    Save Lab Data
                  </button>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" /> Transfer Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Transfer Date</label>
                        <input
                          type="date"
                          value={transferData.transferDate || ''}
                          onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">No. Transferred</label>
                        <input
                          type="number"
                          value={transferData.numberTransferred || ''}
                          onChange={(e) => setTransferData({ ...transferData, numberTransferred: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Catheter Difficulty</label>
                        <select
                          value={transferData.catheterDifficulty || ''}
                          onChange={(e) => setTransferData({ ...transferData, catheterDifficulty: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Difficult">Difficult</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Embryo Quality</label>
                      <textarea
                        value={transferData.embryoQuality || ''}
                        onChange={(e) => setTransferData({ ...transferData, embryoQuality: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 outline-none h-16 resize-none"
                        placeholder="e.g., Day 5 expanded blastocyst, Grade A"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Luteal Support</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {LUTEAL_SUPPORT_OPTIONS.map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={transferData.lutealSupport?.includes(option) || false}
                            onChange={(e) => {
                              const newSupport = e.target.checked
                                ? [...(transferData.lutealSupport || []), option]
                                : transferData.lutealSupport?.filter(s => s !== option) || [];
                              setTransferData({ ...transferData, lutealSupport: newSupport });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm font-semibold text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={saveTransferData}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                  >
                    Save Transfer Details
                  </button>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Cycle Outcome</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Beta-HCG (mIU/mL)</label>
                        <input
                          type="number"
                          value={outcomeData.betaHcg || ''}
                          onChange={(e) => setOutcomeData({ ...outcomeData, betaHcg: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Beta-HCG Result</label>
                        <select
                          value={outcomeData.betaHcgPositive ? 'positive' : outcomeData.betaHcgPositive === false ? 'negative' : ''}
                          onChange={(e) => setOutcomeData({
                            ...outcomeData,
                            betaHcgPositive: e.target.value === 'positive' ? true : e.target.value === 'negative' ? false : undefined
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="positive">Positive (≥5 mIU/mL)</option>
                          <option value="negative">Negative (&lt;5 mIU/mL)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-200">
                        <input
                          type="checkbox"
                          checked={outcomeData.clinicalPregnancy || false}
                          onChange={(e) => setOutcomeData({ ...outcomeData, clinicalPregnancy: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Clinical Pregnancy</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-200">
                        <input
                          type="checkbox"
                          checked={outcomeData.gestationalSac || false}
                          onChange={(e) => setOutcomeData({ ...outcomeData, gestationalSac: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Gestational Sac</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-200">
                        <input
                          type="checkbox"
                          checked={outcomeData.fHR || false}
                          onChange={(e) => setOutcomeData({ ...outcomeData, fHR: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Fetal Heart Rate</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={saveOutcome}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors mt-6"
                  >
                    Complete Cycle & Save Outcome
                  </button>
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
    </div>
  );
};

export default IvfJourney;
