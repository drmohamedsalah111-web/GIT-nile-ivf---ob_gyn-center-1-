import React, { useState, useEffect } from 'react';
import { db, calculateTMSC, analyzeSemenAnalysis, classifyOvarianReserve, calculateMaturationRate, calculateFertilizationRate } from '../services/ivfService';
import { Patient, PrescriptionItem, CycleAssessment, OpuLabData, TransferData, OutcomeData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Baby, TestTube, PlusCircle, TrendingUp, PipetteIcon, Heart, Save, AlertCircle, CheckCircle, Pill, Printer, Microscope, Activity, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import PrescriptionComponent from '../components/PrescriptionComponent';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import { supabase } from '../services/supabaseClient';

// Comprehensive Cycle Data Interface using existing types
interface CycleData {
  id: string;
  protocol: string;
  status: 'Assessment' | 'Active' | 'PickUp' | 'Transfer' | 'Frozen' | 'Done';
  assessment: CycleAssessment & {
    plan?: {
      recommendedProtocol: string;
      startingDose: string;
      trigger: string;
      hint: string;
      suggestedMeds: string[];
    };
  };
  stimulation: {
    logs: Array<{ date: string, cd: number, fsh: number, hmg: number, e2: number, lh: number, folliclesRt: string, folliclesLt: string }>;
    trigger: { date: string, type: string, hours: number };
    prescription: Array<string>;
  };
  lab: OpuLabData;
  transfer: TransferData;
  outcome: OutcomeData;
}

// Smart Protocol Recommender Engine
const recommendProtocol = (age: number, bmi: number, amh: number, afc: number, pcosHistory: boolean) => {
  // High Responder Criteria (PCOS or AMH > 3.5 or AFC > 20)
  if (pcosHistory || amh > 3.5 || afc > 20) {
    return {
      recommendedProtocol: 'GnRH Antagonist',
      trigger: 'Agonist Trigger (Decapeptyl) or Dual Trigger',
      startingDose: '150 IU',
      hint: 'High risk of OHSS. Avoid hCG trigger alone. Freeze-all strategy preferred.',
      suggestedMeds: ['Gonal-F 75 IU', 'Merional 75 IU', 'Cetrotide 0.25mg', 'Decapeptyl 0.1mg (Trigger)']
    };
  }

  // Poor Responder Criteria (AMH < 1.1)
  if (amh < 1.1) {
    return {
      recommendedProtocol: 'GnRH Antagonist or Short Flare',
      trigger: 'Ovitrelle 250mcg',
      startingDose: '300 - 450 IU',
      hint: 'Expect low oocyte yield. Consider accumulation cycles. Adjuvants: DHEA/Growth Hormone priming.',
      suggestedMeds: ['Gonal-F 300 IU', 'Merional 150 IU', 'Cetrotide 0.25mg', 'Ovitrelle 250mcg']
    };
  }

  // Normal Responder (AMH 1.2 - 3.5)
  return {
    recommendedProtocol: 'GnRH Antagonist',
    trigger: 'Ovitrelle 250mcg',
    startingDose: '225 IU',
    hint: 'Standard response expected.',
    suggestedMeds: ['Gonal-F 75 IU', 'Merional 75 IU', 'Cetrotide 0.25mg', 'Ovitrelle 250mcg']
  };
};

// Utility function for safe nested state updates
const updateNestedState = <T extends Record<string, any>>(
  obj: T,
  path: string[],
  value: any
): T => {
  if (path.length === 0) return obj;

  const [head, ...tail] = path;
  if (tail.length === 0) {
    return { ...obj, [head]: value };
  }

  const nested = obj[head] || {};
  return {
    ...obj,
    [head]: updateNestedState(nested, tail, value)
  };
};

// Input validation utilities
const validateNumericInput = (value: string, min: number = 0, max?: number): number => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || (max !== undefined && num > max)) {
    throw new Error(`Invalid input: must be a number between ${min} and ${max || 'unlimited'}`);
  }
  return num;
};

const safeParseInt = (value: string, defaultValue: number = 0): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const defaultImaging = {
  baselineUltrasound: {
    uterus: { dimensions: '', myometrium: '', cavity: '' },
    endometrium: { thickness: 0, pattern: '' },
    ovaries: {
      afcRight: 0,
      afcLeft: 0,
      pathology: { cyst: false, endometrioma: false, dermoid: false }
    },
    adnexa: { hydrosalpinx: false }
  },
  hysteroscopyHSG: {
    status: [],
    actionTaken: ''
  }
};

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
              assessment: {
                ...(activeCycle.assessment || {
                  coupleProfile: {},
                  maleFactor: {},
                  femaleFactor: {},
                  tubalUterine: {}
                }),
                imaging: activeCycle.assessment?.imaging || defaultImaging
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
          tubalUterine: {},
          imaging: defaultImaging
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
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg" dir="ltr">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🔬 رحلة التلقيح الاصطناعي - IVF Journey</h1>
            <p className="text-teal-100">
              Patient: <span className="font-semibold">{selectedPatient?.name || 'Not selected'}</span>
              {cycleData && (
                <>
                  {' • '}Protocol: <span className="font-semibold">{cycleData.protocol}</span>
                  {' • '}Status: <span className="font-semibold">{cycleData.status}</span>
                </>
              )}
            </p>
          </div>
          <Baby className="w-16 h-16 text-teal-200" />
        </div>
      </div>

      {/* Patient Selection & Cycle Start */}
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
          {/* Top Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
              {[
                { id: 'assessment', label: '📊 التقييم الشامل', arLabel: 'Assessment', icon: Microscope },
                { id: 'stimulation', label: '💉 المتابعة والتنشيط', arLabel: 'Stimulation', icon: Activity },
                { id: 'lab', label: '🔬 السحب والمعمل', arLabel: 'Lab', icon: TestTube },
                { id: 'transfer', label: '👶 النقل والنتيجة', arLabel: 'Transfer', icon: Heart }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 md:px-6 py-4 font-bold text-sm md:text-base whitespace-nowrap transition-all duration-200 flex-1 md:flex-none flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-b-4 border-teal-600 text-teal-700 bg-teal-50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.arLabel}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Tab 1: Assessment */}
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Microscope className="w-8 h-8 text-teal-600" />
                    <h3 className="text-2xl font-bold text-gray-800">📊 التقييم الشامل - Comprehensive Assessment</h3>
                  </div>

                  {/* Couple Profile */}
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">👫 ملف الزوجين - Couple Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <input
                          type="number"
                          value={cycleData.assessment.coupleProfile?.age || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              coupleProfile: { ...cycleData.assessment.coupleProfile, age: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">BMI</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cycleData.assessment.coupleProfile?.bmi || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              coupleProfile: { ...cycleData.assessment.coupleProfile, bmi: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Infertility Duration (years)</label>
                        <input
                          type="number"
                          value={cycleData.assessment.coupleProfile?.infertilityDuration || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              coupleProfile: { ...cycleData.assessment.coupleProfile, infertilityDuration: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={cycleData.assessment.coupleProfile?.infertilityType || ''}
                          onChange={(e) => setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              coupleProfile: { ...cycleData.assessment.coupleProfile, infertilityType: e.target.value as 'Primary' | 'Secondary' }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                        >
                          <option value="">Select</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Male Factor */}
                  <div className="bg-blue-50 p-3 md:p-6 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 text-sm md:text-base">العامل الذكري - Male Factor (WHO 2021)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
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
                  <div className="bg-pink-50 p-3 md:p-6 rounded-lg border border-pink-200">
                    <h4 className="text-lg font-semibold text-pink-800 mb-4 text-sm md:text-base">العامل الأنثوي - Female Factor (Ovarian Reserve)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
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

                  {/* Advanced Imaging Section */}
                  <div className="bg-indigo-50 p-3 md:p-6 rounded-lg border border-indigo-200">
                    <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2 text-sm md:text-base">
                      📺 التصوير المتقدم - Advanced Imaging
                    </h4>

                    {/* Baseline Ultrasound */}
                    <div className="mb-6">
                      <h5 className="text-md font-semibold text-indigo-700 mb-3 text-sm md:text-base">Baseline Ultrasound (TVS)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                        {/* Uterus */}
                        <div className="space-y-3">
                          <h6 className="font-medium text-gray-700">Uterus</h6>
                          <div>
                            <label className="block text-sm text-gray-600">Dimensions</label>
                            <input
                              value={cycleData.assessment.imaging?.baselineUltrasound.uterus.dimensions || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                assessment: {
                                  ...cycleData.assessment,
                                  imaging: {
                                    ...cycleData.assessment.imaging,
                                    baselineUltrasound: {
                                      ...cycleData.assessment.imaging?.baselineUltrasound,
                                      uterus: { ...cycleData.assessment.imaging?.baselineUltrasound?.uterus, dimensions: e.target.value }
                                    }
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              placeholder="e.g., 7.2 x 4.1 x 5.8 cm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Myometrium</label>
                            <select
                              value={cycleData.assessment.imaging?.baselineUltrasound.uterus.myometrium || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                assessment: {
                                  ...cycleData.assessment,
                                  imaging: {
                                    ...cycleData.assessment.imaging,
                                    baselineUltrasound: {
                                      ...cycleData.assessment.imaging?.baselineUltrasound,
                                      uterus: { ...cycleData.assessment.imaging?.baselineUltrasound?.uterus, myometrium: e.target.value }
                                    }
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select</option>
                              <option value="Normal">Normal</option>
                              <option value="Adenomyosis">Adenomyosis</option>
                              <option value="Fibroids">Fibroids</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Cavity</label>
                            <select
                              value={cycleData.assessment.imaging?.baselineUltrasound.uterus.cavity || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                assessment: {
                                  ...cycleData.assessment,
                                  imaging: {
                                    ...cycleData.assessment.imaging,
                                    baselineUltrasound: {
                                      ...cycleData.assessment.imaging?.baselineUltrasound,
                                      uterus: { ...cycleData.assessment.imaging?.baselineUltrasound?.uterus, cavity: e.target.value }
                                    }
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select</option>
                              <option value="Normal">Normal</option>
                              <option value="Polyp">Polyp</option>
                            </select>
                          </div>
                        </div>

                        {/* Endometrium */}
                        <div className="space-y-3">
                          <h6 className="font-medium text-gray-700">Endometrium</h6>
                          <div>
                            <label className="block text-sm text-gray-600">Thickness (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={cycleData.assessment.imaging?.baselineUltrasound.endometrium.thickness || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                assessment: {
                                  ...cycleData.assessment,
                                  imaging: {
                                    ...cycleData.assessment.imaging,
                                    baselineUltrasound: {
                                      ...cycleData.assessment.imaging?.baselineUltrasound,
                                      endometrium: { ...cycleData.assessment.imaging?.baselineUltrasound?.endometrium, thickness: parseFloat(e.target.value) || 0 }
                                    }
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Pattern</label>
                            <select
                              value={cycleData.assessment.imaging?.baselineUltrasound.endometrium.pattern || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                assessment: {
                                  ...cycleData.assessment,
                                  imaging: {
                                    ...cycleData.assessment.imaging,
                                    baselineUltrasound: {
                                      ...cycleData.assessment.imaging?.baselineUltrasound,
                                      endometrium: { ...cycleData.assessment.imaging?.baselineUltrasound?.endometrium, pattern: e.target.value }
                                    }
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select</option>
                              <option value="Triple Line">Triple Line</option>
                              <option value="Homogeneous">Homogeneous</option>
                              <option value="Echogenic">Echogenic</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Ovaries */}
                      <div className="mt-4">
                        <h6 className="font-medium text-gray-700 mb-3">Ovaries</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600">AFC Right</label>
                            <input
                              type="number"
                              value={cycleData.assessment.imaging?.baselineUltrasound.ovaries.afcRight || ''}
                              onChange={(e) => setCycleData({
                                ...cycleData,
                                assessment: {
                                  ...cycleData.assessment,
                                  imaging: {
                                    ...cycleData.assessment.imaging,
                                    baselineUltrasound: {
                                      ...cycleData.assessment.imaging?.baselineUltrasound,
                                      ovaries: { ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries, afcRight: parseInt(e.target.value) || 0 }
                                    }
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">AFC Left</label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={cycleData?.assessment?.imaging?.baselineUltrasound?.ovaries?.afcLeft || ''}
                              onChange={(e) => {
                                try {
                                  const value = safeParseInt(e.target.value, 0);
                                  if (cycleData) {
                                    setCycleData(updateNestedState(
                                      cycleData,
                                      ['assessment', 'imaging', 'baselineUltrasound', 'ovaries', 'afcLeft'],
                                      value
                                    ));
                                  }
                                } catch (error) {
                                  toast.error('Invalid AFC value');
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Total AFC</label>
                            <input
                              type="number"
                              value={(cycleData.assessment.imaging?.baselineUltrasound.ovaries.afcRight || 0) + (cycleData.assessment.imaging?.baselineUltrasound.ovaries.afcLeft || 0)}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                            />
                          </div>
                        </div>

                        {/* Pathology Checkboxes */}
                        <div className="mt-3">
                          <label className="block text-sm text-gray-600 mb-2">Pathology</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cycleData.assessment.imaging?.baselineUltrasound.ovaries.pathology.cyst || false}
                                onChange={(e) => setCycleData({
                                  ...cycleData,
                                  assessment: {
                                    ...cycleData.assessment,
                                    imaging: {
                                      ...cycleData.assessment.imaging,
                                      baselineUltrasound: {
                                        ...cycleData.assessment.imaging?.baselineUltrasound,
                                        ovaries: {
                                          ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries,
                                          pathology: { ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries.pathology, cyst: e.target.checked }
                                        }
                                      }
                                    }
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm">Cyst</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cycleData.assessment.imaging?.baselineUltrasound.ovaries.pathology.endometrioma || false}
                                onChange={(e) => setCycleData({
                                  ...cycleData,
                                  assessment: {
                                    ...cycleData.assessment,
                                    imaging: {
                                      ...cycleData.assessment.imaging,
                                      baselineUltrasound: {
                                        ...cycleData.assessment.imaging?.baselineUltrasound,
                                        ovaries: {
                                          ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries,
                                          pathology: { ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries.pathology, endometrioma: e.target.checked }
                                        }
                                      }
                                    }
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm">Endometrioma</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cycleData.assessment.imaging?.baselineUltrasound.ovaries.pathology.dermoid || false}
                                onChange={(e) => setCycleData({
                                  ...cycleData,
                                  assessment: {
                                    ...cycleData.assessment,
                                    imaging: {
                                      ...cycleData.assessment.imaging,
                                      baselineUltrasound: {
                                        ...cycleData.assessment.imaging?.baselineUltrasound,
                                        ovaries: {
                                          ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries,
                                          pathology: { ...cycleData.assessment.imaging?.baselineUltrasound?.ovaries.pathology, dermoid: e.target.checked }
                                        }
                                      }
                                    }
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm">Dermoid</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Adnexa */}
                      <div className="mt-4">
                        <h6 className="font-medium text-gray-700 mb-3">Adnexa</h6>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={cycleData.assessment.imaging?.baselineUltrasound.adnexa.hydrosalpinx || false}
                            onChange={(e) => setCycleData({
                              ...cycleData,
                              assessment: {
                                ...cycleData.assessment,
                                imaging: {
                                  ...cycleData.assessment.imaging,
                                  baselineUltrasound: {
                                    ...cycleData.assessment.imaging?.baselineUltrasound,
                                    adnexa: { hydrosalpinx: e.target.checked }
                                  }
                                }
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-red-600">Hydrosalpinx (Critical - Requires Surgery)</span>
                        </label>
                        {cycleData.assessment.imaging?.baselineUltrasound.adnexa.hydrosalpinx && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertCircle className="w-5 h-5" />
                              <span className="font-semibold">⚠️ Critical Finding: Hydrosalpinx detected</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                              Surgical intervention required before IVF. Hydrosalpinx significantly reduces pregnancy rates.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hysteroscopy / HSG Findings */}
                    <div className="border-t pt-4">
                      <h5 className="text-md font-semibold text-indigo-700 mb-3">Hysteroscopy / HSG Findings</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Status</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['Patent Tubes', 'Blocked', 'Septum', 'Adhesions', 'Cavity Normal'].map(status => (
                              <label key={status} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={cycleData.assessment.imaging?.hysteroscopyHSG.status?.includes(status) || false}
                                  onChange={(e) => {
                                    const currentStatus = cycleData.assessment.imaging?.hysteroscopyHSG.status || [];
                                    const newStatus = e.target.checked
                                      ? [...currentStatus, status]
                                      : currentStatus.filter(s => s !== status);
                                    setCycleData({
                                      ...cycleData,
                                      assessment: {
                                        ...cycleData.assessment,
                                        imaging: {
                                          ...cycleData.assessment.imaging,
                                          hysteroscopyHSG: {
                                            ...cycleData.assessment.imaging?.hysteroscopyHSG,
                                            status: newStatus
                                          }
                                        }
                                      }
                                    });
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{status}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">Action Taken</label>
                          <textarea
                            value={cycleData.assessment.imaging?.hysteroscopyHSG.actionTaken || ''}
                            onChange={(e) => setCycleData({
                              ...cycleData,
                              assessment: {
                                ...cycleData.assessment,
                                imaging: {
                                  ...cycleData.assessment.imaging,
                                  hysteroscopyHSG: {
                                    ...cycleData.assessment.imaging?.hysteroscopyHSG,
                                    actionTaken: e.target.value
                                  }
                                }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                            placeholder="e.g., Septum resected on [date], Tubes patent after intervention"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart Protocol Recommender */}
                  <div className="bg-green-50 p-3 md:p-6 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2 text-sm md:text-base">
                      🤖 محرك التوصية الذكي - Smart Protocol Recommender
                    </h4>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                      <button
                        onClick={() => {
                          const age = selectedPatient?.age || 0;
                          const bmi = cycleData.assessment.coupleProfile?.weight && cycleData.assessment.coupleProfile?.height
                            ? (cycleData.assessment.coupleProfile.weight / Math.pow(cycleData.assessment.coupleProfile.height / 100, 2))
                            : 0;
                          const amh = cycleData.assessment.femaleFactor?.amh || 0;
                          const afc = (cycleData.assessment.imaging?.baselineUltrasound.ovaries.afcRight || 0) +
                                     (cycleData.assessment.imaging?.baselineUltrasound.ovaries.afcLeft || 0);
                          const pcosHistory = false; // This would come from patient history

                          const recommendation = recommendProtocol(age, bmi, amh, afc, pcosHistory);

                          setCycleData({
                            ...cycleData,
                            assessment: {
                              ...cycleData.assessment,
                              plan: recommendation
                            }
                          });

                          toast.success('Protocol recommendation generated!');
                        }}
                        className="bg-green-600 text-white px-4 md:px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <Pill className="w-5 h-5" />
                        <span>Suggest Protocol</span>
                      </button>
                    </div>

                    {cycleData.assessment.plan && (
                      <div className="bg-white p-3 md:p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-3 text-sm md:text-base">📋 Recommended Protocol</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4 text-sm md:text-base">
                          <div>
                            <span className="font-medium text-gray-700">Protocol:</span>
                            <span className="ml-2 font-bold text-green-700">{cycleData.assessment.plan.recommendedProtocol}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Starting Dose:</span>
                            <span className="ml-2 font-bold text-blue-700">{cycleData.assessment.plan.startingDose}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Trigger:</span>
                            <span className="ml-2 text-gray-700">{cycleData.assessment.plan.trigger}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="font-medium text-gray-700">Clinical Hint:</span>
                          <p className="mt-1 text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                            💡 {cycleData.assessment.plan.hint}
                          </p>
                        </div>

                        <div className="mb-4">
                          <span className="font-medium text-gray-700 mb-2 block">Suggested Medications:</span>
                          <div className="flex flex-wrap gap-2">
                            {cycleData.assessment.plan.suggestedMeds.map((med, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setCycleData({
                              ...cycleData,
                              protocol: cycleData.assessment.plan!.recommendedProtocol
                            });
                            toast.success('Protocol applied to cycle!');
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm"
                        >
                          Apply to Plan
                        </button>
                      </div>
                    )}
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
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">💉 التحفيز والمراقبة - Stimulation & Monitoring</h3>
                    <div className="text-xs md:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <div>Protocol: {cycleData.protocol}</div>
                      <div>Start: {cycleData.stimulation.logs[0]?.date || 'Not started'}</div>
                    </div>
                  </div>

                  {/* Charts */}
                  {chartData.length > 0 && (
                    <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm md:text-base">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        E2 Levels & Follicle Growth
                      </h4>
                      <div className="h-48 md:h-64">
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
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-xs md:text-sm bg-white">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">CD</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">Date</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">FSH</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">HMG</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">E2</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">LH</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">Rt F</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-700">Lt F</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycleData.stimulation.logs.map((log, index) => (
                          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-2 md:px-4 py-2 md:py-3 font-bold text-xs md:text-sm">D{log.cd}</td>
                            <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{log.date}</td>
                            <td className="px-2 md:px-4 py-2 md:py-3">
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
                                className="w-12 md:w-16 px-1 md:px-2 py-1 border rounded text-center text-xs"
                              />
                            </td>
                            <td className="px-2 md:px-4 py-2 md:py-3">
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
                                className="w-12 md:w-16 px-1 md:px-2 py-1 border rounded text-center text-xs"
                              />
                            </td>
                            <td className="px-2 md:px-4 py-2 md:py-3">
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
                                className="w-12 md:w-16 px-1 md:px-2 py-1 border rounded text-center text-xs"
                              />
                            </td>
                            <td className="px-2 md:px-4 py-2 md:py-3">
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
                                className="w-12 md:w-16 px-1 md:px-2 py-1 border rounded text-center text-xs"
                              />
                            </td>
                            <td className="px-2 md:px-4 py-2 md:py-3">
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
                                className="w-14 md:w-24 px-1 md:px-2 py-1 border rounded text-center text-xs"
                                placeholder="18,20"
                              />
                            </td>
                            <td className="px-2 md:px-4 py-2 md:py-3">
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
                                className="w-14 md:w-24 px-1 md:px-2 py-1 border rounded text-center text-xs"
                                placeholder="18,20"
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
