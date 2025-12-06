
import React, { useState, useEffect } from 'react';
import { db } from '../services/ivfService';
import { PROTOCOLS } from '../constants';
import { IvfCycle, Patient, StimulationLog, IvfData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, Save, Microscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { EGYPTIAN_DRUGS } from '../constants';
import { Plus, Trash2, FileText, Printer } from 'lucide-react';

const IvfJourney: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeCycle, setActiveCycle] = useState<IvfCycle | null>(null);
  const [newProtocol, setNewProtocol] = useState('Long');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);

  // Lab Data State
  const [labData, setLabData] = useState({
    totalOocytes: 0,
    mii: 0,
    fertilized2PN: 0,
    cleavageGrade: '',
    blastocystGrade: ''
  });

  // Semen Prep Data State
  const [semenPrepData, setSemenPrepData] = useState({
    count: 0,
    motility: 0
  });

  // Prescription State
  const [rxItems, setRxItems] = useState<any[]>([]);
  const [drugCategory, setDrugCategory] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Load Patients
  useEffect(() => {
    db.getPatients().then(setPatients);
    fetchDoctorProfile();
  }, []);

  // Load cycle when patient changes
  useEffect(() => {
    const loadCycle = async () => {
      if (selectedPatientId) {
        const cycles = await db.getCycles();
        const current = cycles.find(c => c.patientId === selectedPatientId && c.status === 'Active');
        setActiveCycle(current || null);
        fetchVisits(selectedPatientId);
      } else {
        setActiveCycle(null);
        setVisits([]);
      }
    };
    loadCycle();
  }, [selectedPatientId]);

  const fetchDoctorProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const doctor = await authService.getDoctorProfile(user.id);
        setDoctorProfile(doctor);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchVisits = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

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

  const chartData = activeCycle?.logs.map(log => ({
    day: `D${log.cycleDay}`,
    e2: parseFloat(log.e2) || 0,
    lh: parseFloat(log.lh) || 0
  })) || [];

  const handleSaveLabData = async () => {
    if (!selectedPatientId || !doctorProfile) return;

    setIsSaving(true);
    try {
      const clinicalData: IvfData = {
        department: 'ivf',
        cycleId: activeCycle?.id,
        labData: {
          totalOocytes: labData.totalOocytes || undefined,
          mii: labData.mii || undefined,
          fertilized2PN: labData.fertilized2PN || undefined,
          cleavageGrade: labData.cleavageGrade || undefined,
          blastocystGrade: labData.blastocystGrade || undefined
        },
        semenPrep: {
          count: semenPrepData.count || undefined,
          motility: semenPrepData.motility || undefined
        }
      };

      const visitData = {
        patient_id: selectedPatientId,
        date: new Date().toISOString().split('T')[0],
        diagnosis: 'IVF Lab Data Entry',
        prescription: rxItems,
        notes: 'IVF laboratory results and semen preparation data',
        clinical_data: clinicalData
      };

      const { error } = await supabase
        .from('visits')
        .insert([visitData]);

      if (error) throw error;

      // Reset forms
      setLabData({
        totalOocytes: 0,
        mii: 0,
        fertilized2PN: 0,
        cleavageGrade: '',
        blastocystGrade: ''
      });
      setSemenPrepData({
        count: 0,
        motility: 0
      });
      setRxItems([]);

      fetchVisits(selectedPatientId);
      toast.success('تم حفظ بيانات المختبر بنجاح');
    } catch (error: any) {
      console.error('Error saving lab data:', error);
      toast.error(`فشل حفظ البيانات: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDrug = () => {
    if (!drugCategory || !selectedDrug) return;
    // @ts-ignore
    const drugInfo = EGYPTIAN_DRUGS[drugCategory][selectedDrug];
    const dose = drugInfo ? drugInfo.dose : '';
    setRxItems([...rxItems, { category: drugCategory, drug: selectedDrug, dose }]);
    setSelectedDrug('');
  };

  const removeDrug = (idx: number) => {
    setRxItems(rxItems.filter((_, i) => i !== idx));
  };

  const handlePrint = () => {
    if (!selectedPatientId || rxItems.length === 0) return;
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="space-y-6">
       {/* Header & Selector */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Patient for IVF Journey</label>
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
              className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors"
            >
              Start Cycle
            </button>
          </div>
        )}
      </div>

      {activeCycle ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cycle Info Card */}
            <div className="lg:col-span-1 bg-teal-700 text-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Baby className="w-6 h-6" /> Cycle Info
              </h2>
              <div className="space-y-3 opacity-90">
                <p className="flex justify-between border-b border-teal-600 pb-2">
                  <span>Protocol:</span> <span className="font-bold">{activeCycle.protocol}</span>
                </p>
                <p className="flex justify-between border-b border-teal-600 pb-2">
                  <span>Start Date:</span> <span className="font-mono">{activeCycle.startDate}</span>
                </p>
                <p className="flex justify-between border-b border-teal-600 pb-2">
                  <span>Day of Stim:</span> <span className="font-bold">{activeCycle.logs.length}</span>
                </p>
              </div>
            </div>

            {/* E2 Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Hormonal Profile (E2)</h3>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TestTube className="text-teal-600" /> Stimulation Sheet
              </h3>
              <button 
                onClick={addDayLog}
                className="flex items-center gap-2 text-teal-700 font-bold hover:bg-teal-100 px-4 py-2 rounded-lg transition-colors"
              >
                <PlusCircle className="w-5 h-5" /> Add Day
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-teal-700">FSH (IU)</th>
                    <th className="px-4 py-3 text-teal-700">HMG (Amp)</th>
                    <th className="px-4 py-3 text-blue-700">E2</th>
                    <th className="px-4 py-3 text-blue-700">LH</th>
                    <th className="px-4 py-3">RT Follicles</th>
                    <th className="px-4 py-3">LT Follicles</th>
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
                      <td className="p-2"><input className="w-full p-1 border rounded focus:border-gray-400 outline-none" placeholder="10, 12, 14..." value={log.rtFollicles} onChange={e => updateLog(log.id, 'rtFollicles', e.target.value)} /></td>
                      <td className="p-2"><input className="w-full p-1 border rounded focus:border-gray-400 outline-none" placeholder="11, 13..." value={log.ltFollicles} onChange={e => updateLog(log.id, 'ltFollicles', e.target.value)} /></td>
                    </tr>
                  ))}
                  {activeCycle.logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-gray-400 italic">Click 'Add Day' to start the stimulation log.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lab Data Entry Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Lab Results */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-purple-600" />
                نتائج المختبر
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي البويضات</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      value={labData.totalOocytes || ''}
                      onChange={(e) => setLabData(prev => ({ ...prev, totalOocytes: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MII (ناضجة)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      value={labData.mii || ''}
                      onChange={(e) => setLabData(prev => ({ ...prev, mii: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مخصبة (2PN)</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    value={labData.fertilized2PN || ''}
                    onChange={(e) => setLabData(prev => ({ ...prev, fertilized2PN: Number(e.target.value) }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">درجة الانقسام (يوم 3)</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      value={labData.cleavageGrade}
                      onChange={(e) => setLabData(prev => ({ ...prev, cleavageGrade: e.target.value }))}
                    >
                      <option value="">اختر</option>
                      <option value="Grade A">درجة A</option>
                      <option value="Grade B">درجة B</option>
                      <option value="Grade C">درجة C</option>
                      <option value="Grade D">درجة D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">درجة الكيسة (يوم 5)</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      value={labData.blastocystGrade}
                      onChange={(e) => setLabData(prev => ({ ...prev, blastocystGrade: e.target.value }))}
                    >
                      <option value="">اختر</option>
                      <option value="3AA">3AA</option>
                      <option value="3AB">3AB</option>
                      <option value="3BA">3BA</option>
                      <option value="3BB">3BB</option>
                      <option value="4AA">4AA</option>
                      <option value="4AB">4AB</option>
                      <option value="4BA">4BA</option>
                      <option value="4BB">4BB</option>
                      <option value="5AA">5AA</option>
                      <option value="5AB">5AB</option>
                      <option value="5BA">5BA</option>
                      <option value="5BB">5BB</option>
                      <option value="6AA">6AA</option>
                      <option value="6AB">6AB</option>
                      <option value="6BA">6BA</option>
                      <option value="6BB">6BB</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Semen Preparation */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-blue-600" />
                تحضير السائل المنوي
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العدد (مليون/مل)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={semenPrepData.count || ''}
                    onChange={(e) => setSemenPrepData(prev => ({ ...prev, count: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحركة (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={semenPrepData.motility || ''}
                    onChange={(e) => setSemenPrepData(prev => ({ ...prev, motility: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Prescription Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              الوصفة الطبية
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">الفئة</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  value={drugCategory}
                  onChange={(e) => { setDrugCategory(e.target.value); setSelectedDrug(''); }}
                >
                  <option value="">اختر الفئة</option>
                  {Object.keys(EGYPTIAN_DRUGS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">الدواء</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  value={selectedDrug}
                  onChange={(e) => setSelectedDrug(e.target.value)}
                  disabled={!drugCategory}
                >
                  <option value="">اختر الدواء</option>
                  {drugCategory && Object.keys((EGYPTIAN_DRUGS as any)[drugCategory]).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddDrug}
              disabled={!selectedDrug}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Plus className="w-4 h-4" />
              إضافة دواء
            </button>

            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
              {rxItems.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">لا توجد أدوية</p>
              ) : (
                <ul className="space-y-2">
                  {rxItems.map((item, idx) => (
                    <li key={idx} className="bg-white p-2 rounded shadow-sm flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{item.drug}</div>
                        <div className="text-xs text-green-600 font-mono mt-0.5">{item.dose}</div>
                      </div>
                      <button
                        onClick={() => removeDrug(idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveLabData}
                disabled={isSaving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ بيانات المختبر'}
              </button>
              <button
                onClick={handlePrint}
                disabled={rxItems.length === 0}
                className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                طباعة الوصفة
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400">
          <Baby className="w-16 h-16 mb-4 opacity-20" />
          <p>Select a patient and start a cycle to view the journey.</p>
        </div>
      )}
    </div>
  );
};

export default IvfJourney;
