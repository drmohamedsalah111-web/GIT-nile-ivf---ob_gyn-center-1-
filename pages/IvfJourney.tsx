
import React, { useState, useEffect } from 'react';
import { db } from '../services/ivfService';
import { PROTOCOLS } from '../constants';
import { IvfCycle, Patient, StimulationLog, PrescriptionItem } from '../types';
import { visitsService } from '../services/visitsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import PrescriptionComponent from '../components/PrescriptionComponent';
import PrescriptionPrinter from '../components/PrescriptionPrinter';

const IvfJourney: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeCycle, setActiveCycle] = useState<IvfCycle | null>(null);
  const [newProtocol, setNewProtocol] = useState('Long');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  
  // Load Patients
  useEffect(() => {
    db.getPatients().then(setPatients);
  }, []);
  
  // Load cycle when patient changes
  useEffect(() => {
    const loadCycle = async () => {
      if (selectedPatientId) {
        const cycles = await db.getCycles();
        const current = cycles.find(c => c.patientId === selectedPatientId && c.status === 'Active');
        setActiveCycle(current || null);
      } else {
        setActiveCycle(null);
      }
    };
    loadCycle();
  }, [selectedPatientId]);

  const startNewCycle = async () => {
    if (!selectedPatientId) return;
    const toastId = toast.loading("Starting new cycle...");
    try {
      const newCycle = await db.saveCycle({
        patientId: selectedPatientId,
        protocol: newProtocol as any,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
      
      // Transform returned data to match IvfCycle interface (add empty logs)
      setActiveCycle({
        ...newCycle,
        id: newCycle.id,
        logs: []
      });
      toast.success("New IVF Cycle Started", { id: toastId });
    } catch (e) {
      toast.error("Error starting cycle", { id: toastId });
    }
  };

  const addDayLog = async () => {
    if (!activeCycle) return;
    const lastDay = activeCycle.logs.length > 0 ? activeCycle.logs[activeCycle.logs.length - 1].cycleDay : 0;
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      cycleDay: lastDay + 1,
      fsh: '', hmg: '', e2: '', lh: '', rtFollicles: '', ltFollicles: ''
    };

    try {
      await db.addLog(activeCycle.id, newLog);
      // Refresh local state to show new row
      // For simplicity in this demo, we append locally, but ideally we re-fetch
      const optimisticLog = { ...newLog, id: crypto.randomUUID() }; // Temp ID
      setActiveCycle({
        ...activeCycle,
        logs: [...activeCycle.logs, optimisticLog]
      });
    } catch (e) {
      toast.error("Failed to add log");
    }
  };

  const updateLog = async (id: string, field: keyof StimulationLog, value: string) => {
    if (!activeCycle) return;

    // Optimistic UI Update
    const updatedLogs = activeCycle.logs.map(log =>
      log.id === id ? { ...log, [field]: value } : log
    );
    setActiveCycle({ ...activeCycle, logs: updatedLogs });

    // Debounce this in production!
    try {
      await db.updateLog(id, { [field]: value });
    } catch (e) {
      console.error("Save failed");
    }
  };

  const handleSaveVisit = async () => {
    if (!selectedPatientId || !activeCycle) {
      toast.error('Please select a patient and ensure cycle is active');
      return;
    }

    try {
      const clinicalData = {
        cycleId: activeCycle.id,
        protocol: activeCycle.protocol,
        startDate: activeCycle.startDate,
        stimulationDays: activeCycle.logs.length,
        currentStatus: activeCycle.status,
        latestHormones: activeCycle.logs.length > 0 ? {
          e2: activeCycle.logs[activeCycle.logs.length - 1].e2,
          lh: activeCycle.logs[activeCycle.logs.length - 1].lh,
        } : null,
      };

      await visitsService.saveVisit({
        patientId: selectedPatientId,
        department: 'IVF_STIM',
        clinicalData: clinicalData,
        diagnosis: `IVF Stimulation - ${activeCycle.protocol} Protocol`,
        prescription: prescription,
        notes: `Cycle started: ${activeCycle.startDate}, Days stimulated: ${activeCycle.logs.length}`,
      });

      toast.success('IVF visit saved successfully');
      setPrescription([]); // Reset prescription after saving

    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error(`Failed to save visit: ${error.message}`);
    }
  };

  const chartData = activeCycle?.logs.map(log => ({
    day: `D${log.cycleDay}`,
    e2: parseFloat(log.e2) || 0,
    lh: parseFloat(log.lh) || 0
  })) || [];

  return (
    <div className="space-y-6">
       {/* Header & Selector */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between" dir="ltr">
        <div className="w-full md:w-1/2 text-left">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Patient for IVF Cycle</label>
          <select 
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
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
          <div className="flex items-center gap-2">
            <select 
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none"
              value={newProtocol}
              onChange={(e) => setNewProtocol(e.target.value)}
            >
              {PROTOCOLS.map(p => <option key={p} value={p}>{p} Protocol</option>)}
            </select>
            <button 
              onClick={startNewCycle}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Start New Cycle
            </button>
          </div>
        )}
      </div>

      {activeCycle ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="ltr">
            {/* Cycle Info Card */}
            <div className="lg:col-span-1 bg-teal-700 text-white p-6 rounded-2xl shadow-lg text-left">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Baby className="w-6 h-6" /> IVF Cycle Info
              </h2>
              <div className="space-y-3 opacity-90">
                <p className="flex justify-between border-b border-teal-600 pb-2">
                  <span>Protocol:</span> <span className="font-bold">{activeCycle.protocol}</span>
                </p>
                <p className="flex justify-between border-b border-teal-600 pb-2">
                  <span>Start Date:</span> <span className="font-mono">{activeCycle.startDate}</span>
                </p>
                <p className="flex justify-between border-b border-teal-600 pb-2">
                  <span>Stim Days:</span> <span className="font-bold">{activeCycle.logs.length}</span>
                </p>
              </div>
            </div>

            {/* E2 Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100" dir="ltr">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-left">Estradiol (E2) Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="e2" stroke="#00838f" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Estradiol (E2)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Stimulation Sheet */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" dir="ltr">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TestTube className="text-teal-600" /> Stimulation Log
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
                    <th className="px-4 py-3 text-teal-700">FSH (IU)</th>
                    <th className="px-4 py-3 text-teal-700">HMG (Amp)</th>
                    <th className="px-4 py-3 text-blue-700">E2 (pg/mL)</th>
                    <th className="px-4 py-3 text-blue-700">LH (IU/L)</th>
                    <th className="px-4 py-3">Rt Follicles (mm)</th>
                    <th className="px-4 py-3">Lt Follicles (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {activeCycle.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-800">D{log.cycleDay}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{log.date.slice(5)}</td>
                      <td className="p-2"><input className="w-16 p-1 text-center border rounded focus:border-teal-500 outline-none" value={log.fsh} onChange={e => updateLog(log.id, 'fsh', e.target.value)} /></td>
                      <td className="p-2"><input className="w-16 p-1 text-center border rounded focus:border-teal-500 outline-none" value={log.hmg} onChange={e => updateLog(log.id, 'hmg', e.target.value)} /></td>
                      <td className="p-2"><input className="w-16 p-1 text-center border rounded focus:border-blue-500 outline-none" value={log.e2} onChange={e => updateLog(log.id, 'e2', e.target.value)} /></td>
                      <td className="p-2"><input className="w-16 p-1 text-center border rounded focus:border-blue-500 outline-none" value={log.lh} onChange={e => updateLog(log.id, 'lh', e.target.value)} /></td>
                      <td className="p-2"><input className="w-full p-1 border rounded focus:border-gray-400 outline-none" placeholder="18, 20, 22..." value={log.rtFollicles} onChange={e => updateLog(log.id, 'rtFollicles', e.target.value)} /></td>
                      <td className="p-2"><input className="w-full p-1 border rounded focus:border-gray-400 outline-none" placeholder="18, 20, 22..." value={log.ltFollicles} onChange={e => updateLog(log.id, 'ltFollicles', e.target.value)} /></td>
                    </tr>
                  ))}
                  {activeCycle.logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-gray-400 italic text-center">No stimulation logs recorded yet. Click 'Add Day' to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prescription Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <PrescriptionComponent
              prescriptions={prescription}
              onPrescriptionsChange={setPrescription}
              onPrint={() => setIsPrinterOpen(true)}
              showPrintButton={true}
            />
          </div>

          {/* Save Visit Button */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <button
              onClick={handleSaveVisit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Complete & Save IVF Visit
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400">
          <Baby className="w-16 h-16 mb-4 opacity-20" />
          <p>Select a patient and start a new IVF cycle to begin tracking.</p>
        </div>
      )}

      {selectedPatientId && (
        <PrescriptionPrinter
          patient={patients.find(p => p.id === selectedPatientId) || null}
          prescriptions={prescription}
          diagnosis={activeCycle ? `IVF Stimulation - ${activeCycle.protocol} Protocol` : ''}
          notes={activeCycle ? `Cycle started: ${activeCycle.startDate}, Days stimulated: ${activeCycle.logs.length}` : ''}
          isOpen={isPrinterOpen}
          onClose={() => setIsPrinterOpen(false)}
        />
      )}
    </div>
  );
};

export default IvfJourney;
