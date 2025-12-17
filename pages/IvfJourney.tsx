import React, { useState, useEffect } from 'react';
import { usePatients } from '../src/hooks/usePatients';
import { calculateTMSC, analyzeSemenAnalysis, classifyOvarianReserve, calculateMaturationRate, calculateFertilizationRate, db } from '../services/ivfService';
import { Patient } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, TrendingUp, PipetteIcon, Heart, Save, AlertCircle, CheckCircle, Pill, Printer, Microscope, Activity, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import HistorySidebar from '../src/components/HistorySidebar';

const PROTOCOL_OPTIONS = ['Long', 'Antagonist', 'Flare-up', 'Mini-IVF'];

const LOCAL_IVF_DRUGS = {
  'Induction (Stimulation)': ['Gonal-F 75 IU', 'Merional 75 IU', 'Menogon 75 IU', 'Clomid 50mg', 'Femara 2.5mg'],
  'Trigger Shots': ['Ovitrelle 250mcg', 'Choriomon 5000 IU', 'Pregnyl 5000 IU', 'Decapeptyl 0.1mg (Trigger)'],
  'Down-Regulation': ['Cetrotide 0.25mg', 'Orgalutran 0.25mg', 'Decapeptyl 0.1mg Daily', 'Zoladex 3.6mg'],
  'Luteal Support': ['Cyclogest 400mg', 'Cyclogest 200mg', 'Prontogest 100mg', 'Duphaston 10mg', 'Utrogestan 200mg', 'Crinone 8% Gel']
};

const PROTOCOL_INFO: any = {
  'Long': {
    name: 'Long Agonist Protocol',
    arabicName: 'بروتوكول الناهضات الطويلة',
    bestFor: ['Normal responders', 'Regular cycles', 'PCO patients'],
    duration: '35-42 days',
    stimDays: '10-12 days',
    stimDrugs: ['Gonal-F 75 IU', 'Merional 75 IU', 'Fostimon 75 IU'],
    trigger: ['Ovitrelle 250mcg', 'Choriomon 5000 IU'],
    luteal: ['Cyclogest 400mg', 'Utrogestan 200mg']
  },
  'Antagonist': {
    name: 'Antagonist Protocol',
    arabicName: 'بروتوكول المضادات',
    bestFor: ['Poor responders', 'Previous low response'],
    duration: '14-16 days',
    stimDays: '8-10 days',
    stimDrugs: ['Gonal-F 75-150 IU', 'Merional 75 IU', 'Menopur 75 IU'],
    trigger: ['Ovitrelle 250mcg', 'Decapeptyl 0.1mg (Trigger)'],
    luteal: ['Cyclogest 400mg', 'Progynova 2mg']
  },
  'Flare-up': {
    name: 'Flare-up Protocol',
    arabicName: 'بروتوكول التنشيط الحاد',
    bestFor: ['Poor responders', 'Diminished ovarian reserve'],
    duration: '10-12 days',
    stimDays: '8-9 days',
    stimDrugs: ['Gonal-F 150-300 IU', 'Merional 150 IU'],
    trigger: ['Ovitrelle 250mcg', 'Choriomon 5000 IU'],
    luteal: ['Cyclogest 400mg', 'Duphaston 10mg']
  },
  'Mini-IVF': {
    name: 'Mini-IVF Protocol',
    arabicName: 'بروتوكول الحقن المجهري الخفيف',
    bestFor: ['Poor responders', 'Previous OHSS'],
    duration: '10-14 days',
    stimDays: '7-8 days',
    stimDrugs: ['Clomid 50mg', 'Femara 2.5mg', 'Gonal-F 75 IU'],
    trigger: ['Ovitrelle 250mcg'],
    luteal: ['Cyclogest 200mg', 'Utrogestan 200mg']
  }
};

interface StimulationLog {
  id?: string;
  date: string;
  cycleDay: number;
  fsh: string;
  hmg: string;
  e2: string;
  lh: string;
  rtFollicles: string;
  ltFollicles: string;
  endometriumThickness?: string;
}

interface CycleDataState {
  id: string;
  patientId: string;
  protocol: string;
  status: 'Assessment' | 'Active' | 'PickUp' | 'Transfer' | 'Done';
  startDate: string;

  // Assessment Tab
  coupleAge?: number;
  coupleBMI?: number;
  amh?: number;
  afc?: number;
  pcosHistory?: boolean;
  maleFactorAnalysis?: string;
  maleFactorDiagnosis?: string;
  recommendedProtocol?: string;

  // Stimulation Tab
  stimulationLogs: StimulationLog[];
  triggerDate?: string;

  // Lab Tab
  opuDate?: string;
  totalOocytes?: number;
  mii?: number;
  mi?: number;
  gv?: number;
  atretic?: number;
  maturationRate?: number;
  fertilizedTwoPN?: number;
  fertilizationRate?: number;

  // Transfer Tab
  transferDate?: string;
  numberTransferred?: number;
  embryoQuality?: string;
  betaHcg?: number;
  clinicalPregnancy?: boolean;
  gestationalSac?: boolean;
  fHR?: boolean;
}

const defaultCycleData: CycleDataState = {
  id: '',
  patientId: '',
  protocol: 'Antagonist',
  status: 'Assessment',
  startDate: new Date().toISOString().split('T')[0],
  stimulationLogs: [],
  coupleAge: undefined,
  coupleBMI: undefined,
  amh: undefined,
  afc: undefined,
  pcosHistory: false,
  maleFactorAnalysis: '',
  maleFactorDiagnosis: '',
  recommendedProtocol: 'GnRH Antagonist',
  triggerDate: undefined,
  opuDate: undefined,
  totalOocytes: undefined,
  mii: undefined,
  mi: undefined,
  gv: undefined,
  atretic: undefined,
  maturationRate: undefined,
  fertilizedTwoPN: undefined,
  fertilizationRate: undefined,
  transferDate: undefined,
  numberTransferred: undefined,
  embryoQuality: '',
  betaHcg: undefined,
  clinicalPregnancy: false,
  gestationalSac: false,
  fHR: false
};

const IvfJourney: React.FC = () => {
  const { patients } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cycleData, setCycleData] = useState<CycleDataState>(defaultCycleData);
  const [activeTab, setActiveTab] = useState<'assessment' | 'stimulation' | 'lab' | 'transfer'>('assessment');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const selectedPatient = patients.find(p => String(p.id) === selectedPatientId);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(String(patients[0].id));
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    if (selectedPatientId) {
      loadExistingCycle(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadExistingCycle = async (patientId: string) => {
    try {
      const cycles = await db.getCycles();
      const patientCycles = cycles.filter(c => c.patientId === patientId);

      if (patientCycles.length > 0) {
        // Load the most recent cycle
        const activeCycle = patientCycles[0]; // Get the first (most recent) cycle

        // Load stimulation logs for this cycle from the cycle object itself (populated by service)
        const cycleLogs = activeCycle.logs || [];

        // Map status to component status
        let componentStatus: CycleDataState['status'] = 'Assessment';
        if (activeCycle.status === 'Active') componentStatus = 'Active';
        else if (activeCycle.status === 'Completed') componentStatus = 'Done';

        setCycleData({
          id: activeCycle.id,
          patientId: activeCycle.patientId,
          protocol: activeCycle.protocol,
          status: componentStatus,
          startDate: activeCycle.startDate,
          stimulationLogs: cycleLogs.map(log => ({
            id: log.id,
            date: log.date,
            cycleDay: log.cycleDay,
            fsh: log.fsh || '',
            hmg: log.hmg || '',
            e2: log.e2 || '',
            lh: log.lh || '',
            rtFollicles: log.rtFollicles || '',
            ltFollicles: log.ltFollicles || '',
            endometriumThickness: log.endometriumThickness || ''
          })),
          // Load assessment data from cycle data
          coupleAge: activeCycle.assessment?.coupleProfile?.age,
          coupleBMI: activeCycle.assessment?.coupleProfile?.bmi,
          amh: activeCycle.assessment?.femaleFactor?.amh,
          afc: activeCycle.assessment?.femaleFactor?.afcRight,
          pcosHistory: activeCycle.assessment?.coupleProfile?.infertilityType === 'Secondary',
          maleFactorAnalysis: activeCycle.assessment?.maleFactor?.diagnosis,
          recommendedProtocol: activeCycle.protocol,
          // Load lab data
          opuDate: activeCycle.lab?.opuDate,
          totalOocytes: activeCycle.lab?.totalOocytes,
          mii: activeCycle.lab?.mii,
          mi: activeCycle.lab?.mi,
          gv: activeCycle.lab?.gv,
          atretic: activeCycle.lab?.atretic,
          fertilizedTwoPN: activeCycle.lab?.fertilizedTwoPN,
          // Load transfer data
          transferDate: activeCycle.transfer?.transferDate,
          numberTransferred: activeCycle.transfer?.numberTransferred,
          embryoQuality: activeCycle.transfer?.embryoQuality,
          // Load outcome data
          betaHcg: activeCycle.outcome?.betaHcg,
          clinicalPregnancy: activeCycle.outcome?.clinicalPregnancy,
          gestationalSac: activeCycle.outcome?.gestationalSac,
          fHR: activeCycle.outcome?.fHR
        });
      } else {
        // No existing cycle, reset to default
        setCycleData({ ...defaultCycleData, patientId: selectedPatientId });
      }
    } catch (error) {
      console.error('Error loading existing cycle:', error);
      setCycleData({ ...defaultCycleData, patientId: selectedPatientId });
    }
  };

  const handleStartCycle = async () => {
    if (isLoading) return;
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    setIsLoading(true);
    try {
      // Create new cycle in database
      const cycleDataToSave = {
        patientId: selectedPatientId,
        protocol: cycleData.protocol as 'Long' | 'Antagonist' | 'Flare-up' | 'Mini-IVF',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active' as const,
        assessment: {
          coupleProfile: {
            age: cycleData.coupleAge,
            bmi: cycleData.coupleBMI,
            infertilityType: cycleData.pcosHistory ? 'Secondary' as const : 'Primary' as const
          },
          femaleFactor: {
            amh: cycleData.amh,
            afcRight: cycleData.afc
          },
          maleFactor: {
            diagnosis: cycleData.maleFactorAnalysis
          }
        }
      };

      const savedCycle = await db.saveCycle(cycleDataToSave);

      // Update local state with the saved cycle ID
      setCycleData(prev => ({
        ...prev,
        id: savedCycle.id,
        patientId: selectedPatientId,
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0]
      }));

      toast.success('New IVF cycle started and saved', { id: 'ivf-start-cycle' });
    } catch (error) {
      console.error('Error starting cycle:', error);
      toast.error((error as any)?.message || 'Failed to start cycle', { id: 'ivf-start-cycle' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStimulationLog = async () => {
    const newLog: StimulationLog = {
      date: new Date().toISOString().split('T')[0],
      cycleDay: cycleData.stimulationLogs.length + 1,
      fsh: '',
      hmg: '',
      e2: '',
      lh: '',
      rtFollicles: '',
      ltFollicles: '',
      endometriumThickness: ''
    };
    try {
      const savedLog = await db.addLog(cycleData.id, newLog);
      setCycleData(prev => ({
        ...prev,
        stimulationLogs: [...prev.stimulationLogs, { ...newLog, id: savedLog.id }]
      }));
      toast.success('Day added');
    } catch (error) {
      console.error('Error adding log:', error);
      toast.error('Failed to add day');
    }
  };

  const handleUpdateLog = (index: number, field: string, value: any) => {
    setCycleData(prev => {
      const newLogs = [...prev.stimulationLogs];
      newLogs[index] = { ...newLogs[index], [field]: value };
      return { ...prev, stimulationLogs: newLogs };
    });
  };

  const handleRemoveLog = (index: number) => {
    setCycleData(prev => ({
      ...prev,
      stimulationLogs: prev.stimulationLogs.filter((_, i) => i !== index)
    }));
  };

  const calculateMaturation = () => {
    if (!cycleData.totalOocytes || cycleData.totalOocytes === 0) return 0;
    if (!cycleData.mii) return 0;
    return ((cycleData.mii / cycleData.totalOocytes) * 100).toFixed(1);
  };

  const calculateFertilization = () => {
    if (!cycleData.mii || cycleData.mii === 0) return 0;
    if (!cycleData.fertilizedTwoPN) return 0;
    return ((cycleData.fertilizedTwoPN / cycleData.mii) * 100).toFixed(1);
  };

  const handleSaveCycle = async () => {
    if (!cycleData.id) {
      toast.error('No cycle to save');
      return;
    }

    setIsLoading(true);
    try {
      // Update cycle with all current data
      const cycleUpdate = {
        status: cycleData.status === 'Done' ? 'Completed' as const : 'Active' as const,
        assessment_data: {
          coupleProfile: {
            age: cycleData.coupleAge,
            bmi: cycleData.coupleBMI,
            infertilityType: cycleData.pcosHistory ? 'Secondary' as const : 'Primary' as const
          },
          femaleFactor: {
            amh: cycleData.amh,
            afcRight: cycleData.afc
          },
          maleFactor: {
            diagnosis: cycleData.maleFactorAnalysis
          }
        },
        lab_data: {
          opuDate: cycleData.opuDate,
          totalOocytes: cycleData.totalOocytes,
          mii: cycleData.mii,
          mi: cycleData.mi,
          gv: cycleData.gv,
          atretic: cycleData.atretic,
          fertilizedTwoPN: cycleData.fertilizedTwoPN,
          maturationRate: cycleData.totalOocytes && cycleData.mii ? ((cycleData.mii / cycleData.totalOocytes) * 100) : undefined,
          fertilizationRate: cycleData.mii && cycleData.fertilizedTwoPN ? ((cycleData.fertilizedTwoPN / cycleData.mii) * 100) : undefined
        },
        transfer_data: {
          transferDate: cycleData.transferDate,
          numberTransferred: cycleData.numberTransferred,
          embryoQuality: cycleData.embryoQuality
        },
        outcome_data: {
          betaHcg: cycleData.betaHcg,
          clinicalPregnancy: cycleData.clinicalPregnancy,
          gestationalSac: cycleData.gestationalSac,
          fHR: cycleData.fHR
        }
      };

      // Update cycle assessment data
      await db.updateCycleAssessment(cycleData.id, cycleUpdate.assessment_data);

      // Update cycle lab data
      await db.updateCycleLabData(cycleData.id, cycleUpdate.lab_data);

      // Update cycle transfer data
      await db.updateCycleTransfer(cycleData.id, cycleUpdate.transfer_data);

      // Update cycle outcome data
      await db.updateCycleOutcome(cycleData.id, cycleUpdate.outcome_data);

      // Save stimulation logs
      for (const log of cycleData.stimulationLogs) {
        const logData = {
          cycleDay: log.cycleDay,
          date: log.date,
          fsh: log.fsh || '',
          hmg: log.hmg || '',
          e2: log.e2 || '',
          lh: log.lh || '',
          rtFollicles: log.rtFollicles || '',
          ltFollicles: log.ltFollicles || '',
          endometriumThickness: log.endometriumThickness || ''
        };

        if (log.id) {
          // Update existing log
          await db.updateLog(log.id, logData);
        } else {
          // Add new log
          await db.addLog(cycleData.id, logData);
        }
      }

      toast.success('IVF cycle data saved successfully');
    } catch (error) {
      console.error('Error saving cycle:', error);
      toast.error('Failed to save cycle data');
    } finally {
      setIsLoading(false);
    }
  };

  const stimulationChartData = cycleData.stimulationLogs.map(log => ({
    day: `D${log.cycleDay}`,
    e2: parseFloat(log.e2) || 0,
    lh: parseFloat(log.lh) || 0,
    date: log.date
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: 'Tajawal, sans-serif' }} dir="ltr">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">مركز الخصوبة (IVF)</h1>
            <p className="text-teal-100">Comprehensive IVF Cycle Management & Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(true)}
              disabled={!selectedPatientId}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              📜 السجل السابق
            </button>
            <TestTube className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient</label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">-- Select Patient --</option>
          {patients.map(patient => (
            <option key={patient.id} value={String(patient.id)}>
              {patient.name} - {patient.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && cycleData.id && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cycle Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}'s Cycle</h2>
            <p className="text-sm text-gray-600 mt-1">Status: <span className="font-semibold text-teal-600">{cycleData.status}</span></p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {['assessment', 'stimulation', 'lab', 'transfer'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === tab
                    ? 'border-b-2 border-teal-500 text-teal-600 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Assessment Tab */}
            {activeTab === 'assessment' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Couple Profile */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-blue-600" /> Couple Profile
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age (Wife)</label>
                      <input
                        type="number"
                        value={cycleData.coupleAge || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, coupleAge: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Years"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                      <input
                        type="number"
                        step="0.1"
                        value={cycleData.coupleBMI || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, coupleBMI: parseFloat(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="kg/m²"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pcosCheckbox"
                        checked={cycleData.pcosHistory || false}
                        onChange={(e) => setCycleData(prev => ({ ...prev, pcosHistory: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <label htmlFor="pcosCheckbox" className="text-sm font-medium text-gray-700">PCOS History</label>
                    </div>
                  </div>
                </div>

                {/* Ovarian Reserve */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-green-600" /> Ovarian Reserve
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AMH (ng/mL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={cycleData.amh || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, amh: parseFloat(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AFC</label>
                      <input
                        type="number"
                        value={cycleData.afc || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, afc: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Count"
                      />
                    </div>
                    {cycleData.amh !== undefined && cycleData.afc !== undefined && (
                      <div className="p-3 bg-white rounded border border-green-200 text-sm">
                        <p className="font-medium text-gray-900">
                          Classification: <span className="text-green-600 font-bold">{classifyOvarianReserve(cycleData.amh, cycleData.afc)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Male Factor */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Male Factor Analysis</h3>
                  <textarea
                    value={cycleData.maleFactorAnalysis || ''}
                    onChange={(e) => setCycleData(prev => ({ ...prev, maleFactorAnalysis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="WHO 2021 parameters, TMSC, Morphology..."
                    rows={3}
                  />
                </div>

                {/* Protocol Selection */}
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Selection</h3>
                  <select
                    value={cycleData.protocol}
                    onChange={(e) => setCycleData(prev => ({ ...prev, protocol: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 mb-3"
                  >
                    {PROTOCOL_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {PROTOCOL_INFO[cycleData.protocol] && (
                    <div className="p-3 bg-white rounded border border-amber-200 text-sm">
                      <p className="font-medium text-gray-900">{PROTOCOL_INFO[cycleData.protocol].name}</p>
                      <p className="text-gray-600 mt-1">Duration: {PROTOCOL_INFO[cycleData.protocol].duration}</p>
                      <p className="text-gray-600">Stimulation: {PROTOCOL_INFO[cycleData.protocol].stimDays}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stimulation Tab */}
            {activeTab === 'stimulation' && (
              <div className="space-y-6">
                {/* Hormone Trends Chart */}
                {stimulationChartData.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hormone Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stimulationChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="e2" stroke="#ef4444" name="E2 (pg/mL)" />
                        <Line type="monotone" dataKey="lh" stroke="#3b82f6" name="LH (mIU/mL)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Daily Stimulation Logs */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Daily Stimulation Logs</h3>
                    <button
                      onClick={handleAddStimulationLog}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" /> Add Day
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Day</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">FSH</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">HMG</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">E2</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">LH</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Rt Follicles</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Lt Follicles</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cycleData.stimulationLogs.map((log, idx) => (
                          <tr key={idx} className="bg-white hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={log.date}
                                onChange={(e) => handleUpdateLog(idx, 'date', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-gray-600">{log.cycleDay}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={log.fsh}
                                onChange={(e) => handleUpdateLog(idx, 'fsh', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="IU"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={log.hmg}
                                onChange={(e) => handleUpdateLog(idx, 'hmg', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="IU"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={log.e2}
                                onChange={(e) => handleUpdateLog(idx, 'e2', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="pg/mL"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={log.lh}
                                onChange={(e) => handleUpdateLog(idx, 'lh', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="mIU/mL"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={log.rtFollicles}
                                onChange={(e) => handleUpdateLog(idx, 'rtFollicles', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="e.g., 12,10,8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={log.ltFollicles}
                                onChange={(e) => handleUpdateLog(idx, 'ltFollicles', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="e.g., 11,9,7"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleRemoveLog(idx)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {cycleData.stimulationLogs.length === 0 && (
                    <p className="text-gray-500 text-center py-6">No stimulation logs yet. Click "Add Day" to start recording.</p>
                  )}
                </div>

                {/* Trigger */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Shot</h3>
                  <input
                    type="date"
                    value={cycleData.triggerDate || ''}
                    onChange={(e) => setCycleData(prev => ({ ...prev, triggerDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            {/* Lab Tab */}
            {activeTab === 'lab' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* OPU Data */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PipetteIcon className="w-5 h-5 text-pink-600" /> OPU Data
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">OPU Date</label>
                      <input
                        type="date"
                        value={cycleData.opuDate || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, opuDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Oocytes</label>
                      <input
                        type="number"
                        value={cycleData.totalOocytes || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, totalOocytes: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MII</label>
                        <input
                          type="number"
                          value={cycleData.mii || ''}
                          onChange={(e) => setCycleData(prev => ({ ...prev, mii: parseInt(e.target.value) || undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MI</label>
                        <input
                          type="number"
                          value={cycleData.mi || ''}
                          onChange={(e) => setCycleData(prev => ({ ...prev, mi: parseInt(e.target.value) || undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GV</label>
                        <input
                          type="number"
                          value={cycleData.gv || ''}
                          onChange={(e) => setCycleData(prev => ({ ...prev, gv: parseInt(e.target.value) || undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Atretic</label>
                        <input
                          type="number"
                          value={cycleData.atretic || ''}
                          onChange={(e) => setCycleData(prev => ({ ...prev, atretic: parseInt(e.target.value) || undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                    {cycleData.totalOocytes && cycleData.mii && (
                      <div className="p-3 bg-white rounded border border-pink-200">
                        <p className="text-sm text-gray-700">
                          Maturation Rate: <span className="font-bold text-pink-600">{calculateMaturation()}%</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fertilization */}
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-cyan-600" /> Fertilization
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">2PN Count</label>
                      <input
                        type="number"
                        value={cycleData.fertilizedTwoPN || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, fertilizedTwoPN: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    {cycleData.mii && cycleData.fertilizedTwoPN && (
                      <div className="p-3 bg-white rounded border border-cyan-200">
                        <p className="text-sm text-gray-700">
                          Fertilization Rate: <span className="font-bold text-cyan-600">{calculateFertilization()}%</span>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Embryo Quality</label>
                      <select
                        value={cycleData.embryoQuality || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, embryoQuality: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Select Quality</option>
                        <option value="A">Excellent (A)</option>
                        <option value="B">Good (B)</option>
                        <option value="C">Fair (C)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Tab */}
            {activeTab === 'transfer' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Transfer Details */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-indigo-600" /> Transfer Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                      <input
                        type="date"
                        value={cycleData.transferDate || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, transferDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number Transferred</label>
                      <input
                        type="number"
                        value={cycleData.numberTransferred || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, numberTransferred: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Outcome */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600" /> Outcome
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Beta-HCG (mIU/mL)</label>
                      <input
                        type="number"
                        value={cycleData.betaHcg || ''}
                        onChange={(e) => setCycleData(prev => ({ ...prev, betaHcg: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="clinicalPregnancy"
                          checked={cycleData.clinicalPregnancy || false}
                          onChange={(e) => setCycleData(prev => ({ ...prev, clinicalPregnancy: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <label htmlFor="clinicalPregnancy" className="text-sm font-medium text-gray-700">Clinical Pregnancy</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="gestationalSac"
                          checked={cycleData.gestationalSac || false}
                          onChange={(e) => setCycleData(prev => ({ ...prev, gestationalSac: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <label htmlFor="gestationalSac" className="text-sm font-medium text-gray-700">Gestational Sac Seen</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="fhr"
                          checked={cycleData.fHR || false}
                          onChange={(e) => setCycleData(prev => ({ ...prev, fHR: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <label htmlFor="fhr" className="text-sm font-medium text-gray-700">Fetal Heart Rate Detected</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 p-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={handleSaveCycle}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Cycle'}
            </button>
            <button
              onClick={() => setIsPrinterOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              <Printer className="w-5 h-5" /> Print Report
            </button>
            <button
              onClick={() => {
                setCycleData(defaultCycleData);
                setActiveTab('assessment');
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              <X className="w-5 h-5" /> Reset
            </button>
          </div>
        </div>
      )}

      {!cycleData.id && selectedPatient && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <TestTube className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Cycle</h2>
          <p className="text-gray-600 mb-6">Start a new IVF cycle for {selectedPatient.name}</p>
          <button
            onClick={handleStartCycle}
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg transition flex items-center justify-center gap-2 mx-auto"
          >
            <PlusCircle className="w-5 h-5" />
            {isLoading ? 'Starting...' : 'Start New Cycle'}
          </button>
        </div>
      )}

      {/* Prescription Printer */}
      <PrescriptionPrinter
        patient={selectedPatient || null}
        prescriptions={[]}
        diagnosis="IVF Cycle"
        notes="Comprehensive IVF Cycle Documentation"
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />

      <HistorySidebar
        patientId={selectedPatientId}
        category="IVF"
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};

export default IvfJourney;
