import React, { useState, useEffect } from 'react';
import { db, calculateFertilizationRate } from '../services/ivfService';
import { IvfCycle, Patient, StimulationLog, OpuLabData, TransferData, OutcomeData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, TrendingUp, PipetteIcon, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

// Self-contained data
const PROTOCOL_OPTIONS = ['Long', 'Antagonist', 'Flare'];

const IVF_DRUGS = {
  Induction: ['Gonal-F 75 IU', 'Merional 75 IU', 'Fostimon 75 IU'],
  Trigger: ['Ovitrelle 250mcg', 'Choriomon 5000 IU'],
  Support: ['Cyclogest 400mg', 'Utrogestan 200mg', 'Crinone 8% Gel']
};

const IvfJourney: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeCycle, setActiveCycle] = useState<IvfCycle | null>(null);
  const [logs, setLogs] = useState<StimulationLog[]>([]);
  const [labData, setLabData] = useState<OpuLabData>({});
  const [transferData, setTransferData] = useState<TransferData>({ lutealSupport: [] });
  const [outcomeData, setOutcomeData] = useState<OutcomeData>({});
  const [activeTab, setActiveTab] = useState<'stimulation' | 'opu' | 'transfer'>('stimulation');
  const [newProtocol, setNewProtocol] = useState('Long');

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

  useEffect(() => {
    const loadCycle = async () => {
      if (selectedPatientId) {
        try {
          const cycles = await db.getCycles();
          const current = cycles.find(c => c.patientId === selectedPatientId && c.status === 'Active');
          if (current) {
            setActiveCycle(current);
            setLogs(current.logs || []);
            setLabData(current.lab || {});
            setTransferData(current.transfer || { lutealSupport: [] });
            setOutcomeData(current.outcome || {});
          } else {
            setActiveCycle(null);
            setLogs([]);
            setLabData({});
            setTransferData({ lutealSupport: [] });
            setOutcomeData({});
          }
        } catch (error) {
          toast.error('Failed to load cycle');
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
      setActiveCycle(newCycle);
      setLogs([]);
      setLabData({});
      setTransferData({ lutealSupport: [] });
      setOutcomeData({});
      setActiveTab('stimulation');
      toast.success('New IVF Cycle Started', { id: toastId });
    } catch (error) {
      toast.error('Error starting cycle', { id: toastId });
    }
  };

  const addDayLog = async () => {
    if (!activeCycle) return;
    const lastDay = logs.length > 0 ? logs[logs.length - 1].cycleDay : 0;
    const newLog: StimulationLog = {
      id: '',
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
      const insertedLog = await db.addLog(activeCycle.id, newLog);
      const mappedLog: StimulationLog = {
        id: insertedLog.id,
        date: insertedLog.date,
        cycleDay: insertedLog.cycle_day,
        fsh: insertedLog.fsh || '',
        hmg: insertedLog.hmg || '',
        e2: insertedLog.e2 || '',
        lh: insertedLog.lh || '',
        rtFollicles: insertedLog.rt_follicles || '',
        ltFollicles: insertedLog.lt_follicles || '',
        endometriumThickness: insertedLog.endometrium_thickness || ''
      };
      setLogs([...logs, mappedLog]);
      toast.success('Day log added');
    } catch (error) {
      toast.error('Failed to add log');
    }
  };

  const updateLog = async (id: string, field: keyof StimulationLog, value: string) => {
    const updatedLogs = logs.map(log =>
      log.id === id ? { ...log, [field]: value } : log
    );
    setLogs(updatedLogs);
    try {
      await db.updateLog(id, { [field]: value });
    } catch (error) {
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

  const chartData = logs.map(log => ({
    day: `D${log.cycleDay}`,
    e2: parseFloat(log.e2) || 0
  }));

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
                  {PROTOCOL_OPTIONS.map(p => (
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
                { id: 'stimulation', label: '💉 Stimulation', icon: '💉' },
                { id: 'opu', label: '🥚 OPU & Lab', icon: '🥚' },
                { id: 'transfer', label: '👶 Transfer', icon: '👶' }
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
                      <div className="text-2xl font-bold">{logs.length}</div>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-600" /> E2 vs Days
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="e2" stroke="#00838f" strokeWidth={2} dot={{r: 3}} name="E2 (pg/mL)" />
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold text-gray-800">D{log.cycleDay}</td>
                            <td className="px-4 py-3 font-mono text-gray-500">{log.date.slice(5)}</td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-teal-500 outline-none text-sm" value={log.fsh} onChange={e => updateLog(log.id, 'fsh', e.target.value)} placeholder="150" /></td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-teal-500 outline-none text-sm" value={log.hmg} onChange={e => updateLog(log.id, 'hmg', e.target.value)} placeholder="1" /></td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-blue-500 outline-none text-sm" value={log.e2} onChange={e => updateLog(log.id, 'e2', e.target.value)} placeholder="100" /></td>
                            <td className="p-2"><input className="w-14 p-1 text-center border rounded focus:border-blue-500 outline-none text-sm" value={log.lh} onChange={e => updateLog(log.id, 'lh', e.target.value)} placeholder="2" /></td>
                            <td className="p-2"><input className="w-20 p-1 border rounded focus:border-gray-400 outline-none text-sm" value={log.rtFollicles} onChange={e => updateLog(log.id, 'rtFollicles', e.target.value)} placeholder="18,20" /></td>
                            <td className="p-2"><input className="w-20 p-1 border rounded focus:border-gray-400 outline-none text-sm" value={log.ltFollicles} onChange={e => updateLog(log.id, 'ltFollicles', e.target.value)} placeholder="18,20" /></td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-8 text-gray-400 italic text-center">No stimulation logs. Click 'Add Day' to begin.</td>
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
                      <PipetteIcon className="w-5 h-5 text-green-600" /> OPU & Lab
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Oocytes Retrieved</label>
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1">2PN</label>
                        <input
                          type="number"
                          value={labData.fertilizedTwoPN || ''}
                          onChange={(e) => setLabData({ ...labData, fertilizedTwoPN: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Blastocysts</label>
                        <input
                          type="number"
                          value={labData.blastocystsExpanded || ''}
                          onChange={(e) => setLabData({ ...labData, blastocystsExpanded: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="font-semibold text-gray-800 mb-3">Fertilization Rate</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-700">{calculateFertilizationRate(labData.fertilizedTwoPN || 0, labData.mii || 0)}%</div>
                      <div className="text-sm text-gray-600">({labData.fertilizedTwoPN || 0} / {labData.mii || 0} MII oocytes)</div>
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
                      <Heart className="w-5 h-5 text-red-600" /> Transfer
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Count</label>
                        <input
                          type="number"
                          value={transferData.numberTransferred || ''}
                          onChange={(e) => setTransferData({ ...transferData, numberTransferred: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Embryo Quality</label>
                        <input
                          type="text"
                          value={transferData.embryoQuality || ''}
                          onChange={(e) => setTransferData({ ...transferData, embryoQuality: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                          placeholder="e.g., Day 5 expanded blastocyst"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Outcome</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Result</label>
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
                          <option value="negative">Negative ({"<"}5 mIU/mL)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveTransferData}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                  >
                    Save Transfer Data
                  </button>

                  <button
                    onClick={saveOutcome}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors mt-4"
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
