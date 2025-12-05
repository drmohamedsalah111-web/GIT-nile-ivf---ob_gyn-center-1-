
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db, calculateBMI, analyzeSemenAnalysis } from '../services/ivfService';
import { EGYPTIAN_DRUGS } from '../constants';
import { PrescriptionItem, Patient, Doctor, Visit } from '../types';
import { AlertTriangle, Plus, Trash2, Printer, FileText, Activity, Microscope, Info } from 'lucide-react';

interface ClinicalStationProps {
  doctorProfile: Doctor | null;
}

interface FemaleFactor {
  // Hormones
  fsh: string;
  lh: string;
  e2: string;
  prolactin: string;
  tsh: string;
  amh: string;
  // Ultrasound
  endoThickness: string;
  afcR: string;
  afcL: string;
  uterusPathology: string[];
  ovaryPathology: string[];
  // Tubes & Scope
  tubalStatus: string;
  hydrosalpinx: boolean;
  hysteroscopy: string[];
  laparoscopy: string[];
}

const ClinicalStation: React.FC<ClinicalStationProps> = ({ doctorProfile }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);

  // Vitals & Male
  const [vitals, setVitals] = useState({ weight: '', height: '' });
  const [maleParams, setMaleParams] = useState({ vol: 0, conc: 0, mot: 0, morph: 0 });

  // Female Workup State
  const [activeFemaleTab, setActiveFemaleTab] = useState<'hormones' | 'us' | 'scope'>('hormones');
  const [femaleData, setFemaleData] = useState<FemaleFactor>({
    fsh: '', lh: '', e2: '', prolactin: '', tsh: '', amh: '',
    endoThickness: '', afcR: '', afcL: '',
    uterusPathology: [], ovaryPathology: [],
    tubalStatus: 'Patent', hydrosalpinx: false,
    hysteroscopy: [], laparoscopy: []
  });

  // Rx State
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [drugCategory, setDrugCategory] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // Initial Fetch
  useEffect(() => {
    db.getPatients().then(setPatients);
  }, []);

  // Load visits when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      db.getVisitsForPatient(selectedPatientId).then(setVisits);
    } else {
      setVisits([]);
    }
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Computed Values
  const bmiInfo = calculateBMI(Number(vitals.weight), Number(vitals.height));
  const spermDiagnosis = analyzeSemenAnalysis(maleParams.vol, maleParams.conc, maleParams.mot, maleParams.morph);

  // --- Female Logic Engine ---
  const getFemaleDiagnosis = () => {
    const findings: string[] = [];
    const fsh = Number(femaleData.fsh);
    const lh = Number(femaleData.lh);
    const e2 = Number(femaleData.e2);
    const prl = Number(femaleData.prolactin);
    const tsh = Number(femaleData.tsh);
    const amh = Number(femaleData.amh);
    const et = Number(femaleData.endoThickness);
    const afcTotal = Number(femaleData.afcR) + Number(femaleData.afcL);

    // Hormones
    if (fsh > 10) findings.push("Diminished Ovarian Reserve (FSH > 10)");
    if (fsh > 0 && lh / fsh > 2) findings.push("Suspect PCOS (LH/FSH ratio > 2)");
    if (e2 > 80) findings.push("Functional Cyst / Poor Responder Risk (High E2)");
    if (prl > 25) findings.push(prl > 100 ? "Hyperprolactinemia (Check MRI)" : "Hyperprolactinemia");
    if (tsh > 2.5) findings.push("Subclinical Hypothyroidism (Treat for Fertility)");
    if (femaleData.amh && amh < 1.0) findings.push("Low Ovarian Reserve (Poseidon Group)");
    if (amh > 3.5) findings.push("High Reserve (PCOS Risk)");

    // Ultrasound
    if (femaleData.endoThickness && et < 7) findings.push("Thin Endometrium (< 7mm)");
    if ((femaleData.afcR || femaleData.afcL) && afcTotal < 5) findings.push("Low AFC (< 5 Total)");
    if (femaleData.uterusPathology.length > 0) findings.push(`Uterus: ${femaleData.uterusPathology.join(', ')}`);
    if (femaleData.ovaryPathology.length > 0) findings.push(`Ovary: ${femaleData.ovaryPathology.join(', ')}`);

    // Tubes
    if (femaleData.hydrosalpinx) findings.push("CRITICAL: Hydrosalpinx (Clip/Remove before IVF)");
    if (femaleData.tubalStatus !== 'Patent') findings.push(`Tubes: ${femaleData.tubalStatus}`);
    
    // Scopes
    if (femaleData.laparoscopy.includes('Endometriosis')) findings.push("Endometriosis Confirmed");

    return findings;
  };

  const femaleFindings = getFemaleDiagnosis();

  // Handlers
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
    if (!selectedPatient || rxItems.length === 0) return;
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSave = async () => {
    if (!selectedPatient) return;

    const bmiInfo = calculateBMI(Number(vitals.weight), Number(vitals.height));
    const diagnosis = femaleFindings.join('; ');

    try {
      await db.saveVisit({
        patientId: selectedPatient.id,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        diagnosis,
        prescription: rxItems,
        notes,
        vitals: {
          weight: Number(vitals.weight) || undefined,
          height: Number(vitals.height) || undefined,
          bmi: bmiInfo.bmi || undefined
        }
      });

      // Reload visits
      const updatedVisits = await db.getVisitsForPatient(selectedPatient.id);
      setVisits(updatedVisits);

      // Clear form
      setVitals({ weight: '', height: '' });
      setMaleParams({ vol: 0, conc: 0, mot: 0, morph: 0 });
      setFemaleData({
        fsh: '', lh: '', e2: '', prolactin: '', tsh: '', amh: '',
        endoThickness: '', afcR: '', afcL: '',
        uterusPathology: [], ovaryPathology: [],
        tubalStatus: 'Patent', hydrosalpinx: false,
        hysteroscopy: [], laparoscopy: []
      });
      setRxItems([]);
      setNotes('');
      setDrugCategory('');
      setSelectedDrug('');

      toast.success('Visit saved successfully');
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error('Error saving visit');
    }
  };

  const toggleCheckbox = (field: keyof FemaleFactor, value: string) => {
    const list = femaleData[field] as string[];
    const newList = list.includes(value) 
      ? list.filter(item => item !== value)
      : [...list, value];
    setFemaleData({ ...femaleData, [field]: newList });
  };

  return (
    <div className="space-y-6">
      {/* Patient Selector */}
      <div className="bg-white p-3 md:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 no-print">
        <label className="block text-sm font-bold text-gray-700 mb-2">Select Patient</label>
        <select
          className="w-full px-3 md:px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white text-sm md:text-base min-h-[48px]"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">-- Choose from Directory --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} (Husband: {p.husbandName})</option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 no-print">

            {/* LEFT COLUMN: Vitals + Male */}
            <div className="md:col-span-1 lg:col-span-3 space-y-4 md:space-y-6">
              {/* BMI Calculator */}
              <div className="bg-white p-3 md:p-4 lg:p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm md:text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" /> Vitals & BMI
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                     <div className="col-span-1">
                        <label className="text-xs text-gray-500">Weight (kg)</label>
                        <input type="number" className="w-full p-2 md:p-3 border rounded text-sm min-h-[44px] md:min-h-[48px]" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} />
                     </div>
                     <div className="col-span-1">
                        <label className="text-xs text-gray-500">Height (cm)</label>
                        <input type="number" className="w-full p-2 md:p-3 border rounded text-sm min-h-[44px] md:min-h-[48px]" value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})} />
                     </div>
                  </div>
                  {bmiInfo.bmi > 0 && (
                    <div className={`p-2 rounded text-xs flex items-center gap-2 ${bmiInfo.alert ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {bmiInfo.alert ? <AlertTriangle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-green-600" />}
                      <span className="font-bold">{bmiInfo.bmi} {bmiInfo.alert && "(Obese)"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Male Diagnosis */}
              <div className="bg-white p-3 md:p-4 lg:p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm md:text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                   <Microscope className="w-4 h-4 text-blue-600" /> Male Factor
                </h3>
                <div className="space-y-2 md:space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500">Volume (ml)</label>
                    <input type="number" placeholder="> 1.5" className="w-full p-2 md:p-3 border rounded min-h-[44px] md:min-h-[48px]" onChange={e => setMaleParams({...maleParams, vol: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Conc (M/ml)</label>
                    <input type="number" placeholder="> 15" className="w-full p-2 md:p-3 border rounded min-h-[44px] md:min-h-[48px]" onChange={e => setMaleParams({...maleParams, conc: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Motility (%)</label>
                    <input type="number" placeholder="> 40" className="w-full p-2 md:p-3 border rounded min-h-[44px] md:min-h-[48px]" onChange={e => setMaleParams({...maleParams, mot: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Morphology (%)</label>
                    <input type="number" placeholder="> 4" className="w-full p-2 md:p-3 border rounded min-h-[44px] md:min-h-[48px]" onChange={e => setMaleParams({...maleParams, morph: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs font-bold text-blue-800 border border-blue-100">
                  {spermDiagnosis}
                </div>
              </div>
            </div>

            {/* MIDDLE COLUMN: Female Workup */}
            <div className="md:col-span-1 lg:col-span-5 flex flex-col gap-4 md:gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-100">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveFemaleTab('hormones')}
                      className={`flex-1 py-3 md:py-4 text-center text-xs md:text-sm font-medium border-b-2 transition-colors ${activeFemaleTab === 'hormones' ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      Hormones
                    </button>
                    <button
                      onClick={() => setActiveFemaleTab('us')}
                      className={`flex-1 py-3 md:py-4 text-center text-xs md:text-sm font-medium border-b-2 transition-colors ${activeFemaleTab === 'us' ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      Ultrasound
                    </button>
                    <button
                      onClick={() => setActiveFemaleTab('scope')}
                      className={`flex-1 py-3 md:py-4 text-center text-xs md:text-sm font-medium border-b-2 transition-colors ${activeFemaleTab === 'scope' ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      Endoscopy
                    </button>
                  </nav>
                </div>

                <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                  
                  {/* TAB 1: HORMONES */}
                  {activeFemaleTab === 'hormones' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 text-xs text-gray-400 mb-2 font-bold">Day 2-3 Profile</div>
                      
                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">FSH (IU/L)</label>
                        <input type="number" className={`w-full p-2 border rounded-lg ${Number(femaleData.fsh) > 10 ? 'border-red-300 bg-red-50' : ''}`} 
                          value={femaleData.fsh} onChange={e => setFemaleData({...femaleData, fsh: e.target.value})} />
                        {Number(femaleData.fsh) > 10 && <span className="text-[10px] text-red-600 absolute bottom-[-16px] right-0">Diminished Reserve</span>}
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">LH (IU/L)</label>
                        <input type="number" className="w-full p-2 border rounded-lg" 
                          value={femaleData.lh} onChange={e => setFemaleData({...femaleData, lh: e.target.value})} />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">E2 (pg/mL)</label>
                        <input type="number" className={`w-full p-2 border rounded-lg ${Number(femaleData.e2) > 80 ? 'border-yellow-300 bg-yellow-50' : ''}`}
                          value={femaleData.e2} onChange={e => setFemaleData({...femaleData, e2: e.target.value})} />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Prolactin (ng/mL)</label>
                        <input type="number" className={`w-full p-2 border rounded-lg ${Number(femaleData.prolactin) > 25 ? 'border-red-300 bg-red-50' : ''}`}
                          value={femaleData.prolactin} onChange={e => setFemaleData({...femaleData, prolactin: e.target.value})} />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">TSH (mIU/L)</label>
                        <input type="number" className={`w-full p-2 border rounded-lg ${Number(femaleData.tsh) > 2.5 ? 'border-yellow-300 bg-yellow-50' : ''}`}
                          value={femaleData.tsh} onChange={e => setFemaleData({...femaleData, tsh: e.target.value})} />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">AMH (ng/mL)</label>
                        <input type="number" className={`w-full p-2 border rounded-lg ${Number(femaleData.amh) < 1 ? 'border-red-300 bg-red-50' : Number(femaleData.amh) > 3.5 ? 'border-blue-300 bg-blue-50' : ''}`}
                          value={femaleData.amh} onChange={e => setFemaleData({...femaleData, amh: e.target.value})} />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ULTRASOUND */}
                  {activeFemaleTab === 'us' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Endometrial Thickness (mm)</label>
                          <input type="number" className={`w-full p-2 border rounded-lg ${Number(femaleData.endoThickness) > 0 && Number(femaleData.endoThickness) < 7 ? 'border-red-300 bg-red-50' : ''}`}
                            value={femaleData.endoThickness} onChange={e => setFemaleData({...femaleData, endoThickness: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">AFC Right</label>
                          <input type="number" className="w-full p-2 border rounded-lg"
                            value={femaleData.afcR} onChange={e => setFemaleData({...femaleData, afcR: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">AFC Left</label>
                          <input type="number" className="w-full p-2 border rounded-lg"
                            value={femaleData.afcL} onChange={e => setFemaleData({...femaleData, afcL: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Uterus Pathology</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Fibroids', 'Polyps', 'Adenomyosis', 'Septum'].map(item => (
                            <button
                              key={item}
                              onClick={() => toggleCheckbox('uterusPathology', item)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${femaleData.uterusPathology.includes(item) ? 'bg-pink-600 text-white border-pink-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Ovary Pathology</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Simple Cyst', 'Endometrioma', 'Dermoid', 'PCO Pattern'].map(item => (
                            <button
                              key={item}
                              onClick={() => toggleCheckbox('ovaryPathology', item)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${femaleData.ovaryPathology.includes(item) ? 'bg-pink-600 text-white border-pink-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SCOPES & TUBES */}
                  {activeFemaleTab === 'scope' && (
                    <div className="space-y-6">
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Tubal Patency (HSG/HyCoSy)</label>
                        <select
                          className="w-full p-2 border rounded-lg mb-3"
                          value={femaleData.tubalStatus}
                          onChange={e => setFemaleData({...femaleData, tubalStatus: e.target.value})}
                        >
                          <option value="Patent">Patent Bilaterally</option>
                          <option value="Right Blocked">Right Blocked</option>
                          <option value="Left Blocked">Left Blocked</option>
                          <option value="Bilateral Block">Bilateral Block</option>
                        </select>
                        
                        <label className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={femaleData.hydrosalpinx} 
                            onChange={e => setFemaleData({...femaleData, hydrosalpinx: e.target.checked})} 
                            className="w-5 h-5 text-red-600 rounded focus:ring-red-500" 
                          />
                          <div>
                            <span className="font-bold text-red-800 block text-sm">Hydrosalpinx Detected</span>
                            <span className="text-xs text-red-600">Must remove before IVF</span>
                          </div>
                        </label>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-2">Hysteroscopy Findings</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Normal Cavity', 'Adhesions', 'Polypectomy', 'Septum Resection'].map(item => (
                            <button
                              key={item}
                              onClick={() => toggleCheckbox('hysteroscopy', item)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${femaleData.hysteroscopy.includes(item) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-2">Laparoscopy Findings</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Normal', 'Endometriosis I-II', 'Endometriosis III-IV', 'Adhesions'].map(item => (
                            <button
                              key={item}
                              onClick={() => toggleCheckbox('laparoscopy', item)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${femaleData.laparoscopy.includes(item) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
                
                {/* Summary / Diagnosis Box */}
                <div className="bg-pink-50 p-4 border-t border-pink-100 min-h-[100px]">
                  <h4 className="text-xs font-bold text-pink-800 uppercase mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Diagnosis & Findings
                  </h4>
                  {femaleFindings.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {femaleFindings.map((finding, i) => (
                        <li key={i} className="text-sm text-pink-900 font-medium">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-pink-400 italic">Enter data to generate diagnosis...</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Smart Rx */}
            <div className="md:col-span-2 lg:col-span-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" /> Smart Prescription
              </h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Category</label>
                  <select
                    className="w-full p-2 md:p-3 border rounded-lg mt-1 text-sm min-h-[44px] md:min-h-[auto]"
                    value={drugCategory}
                    onChange={e => { setDrugCategory(e.target.value); setSelectedDrug(''); }}
                  >
                    <option value="">Select Category</option>
                    {Object.keys(EGYPTIAN_DRUGS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Medication</label>
                  <select
                    className="w-full p-2 md:p-3 border rounded-lg mt-1 text-sm min-h-[44px] md:min-h-[auto]"
                    value={selectedDrug}
                    onChange={e => setSelectedDrug(e.target.value)}
                    disabled={!drugCategory}
                  >
                    <option value="">Select Drug</option>
                    {drugCategory && Object.keys((EGYPTIAN_DRUGS as any)[drugCategory]).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddDrug}
                  disabled={!selectedDrug}
                  className="w-full bg-teal-600 text-white py-3 md:py-2 rounded-lg font-bold hover:bg-teal-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm min-h-[48px] md:min-h-[auto]"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex-1 border border-gray-100 rounded-lg p-3 bg-gray-50 overflow-y-auto max-h-[300px]">
                {rxItems.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs mt-10">No items added</p>
                ) : (
                  <ul className="space-y-2">
                    {rxItems.map((item, idx) => (
                      <li key={idx} className="bg-white p-2 rounded shadow-sm flex justify-between items-start">
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{item.drug}</div>
                          <div className="text-xs text-teal-600 font-mono mt-0.5">{item.dose}</div>
                        </div>
                        <button onClick={() => removeDrug(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                {/* Notes Field */}
                <div>
                  <label className="text-xs font-medium text-gray-600">Visit Notes</label>
                  <textarea
                    className="w-full p-2 md:p-3 border rounded-lg mt-1 text-sm min-h-[80px] md:min-h-[auto]"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Enter additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-teal-600 text-white py-3 md:py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 text-sm min-h-[48px] md:min-h-[auto]"
                  >
                    <FileText className="w-4 h-4" /> Save Visit
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={rxItems.length === 0}
                    className="flex-1 bg-gray-800 text-white py-3 md:py-2.5 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm min-h-[48px] md:min-h-[auto]"
                  >
                    <Printer className="w-4 h-4" /> Print Prescription
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Visits Section */}
          {visits.length > 0 && (
            <div className="bg-white p-3 md:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 no-print">
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4">Previous Visits</h3>
              <div className="space-y-3">
                {visits.map(visit => (
                  <div key={visit.id} className="border border-gray-200 rounded-lg p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                      <div className="font-bold text-teal-700 text-sm md:text-base">{new Date(visit.date).toLocaleDateString('ar-EG')}</div>
                      {visit.vitals && (
                        <div className="text-xs md:text-sm text-gray-600">
                          Weight: {visit.vitals.weight}kg | Height: {visit.vitals.height}cm | BMI: {visit.vitals.bmi}
                        </div>
                      )}
                    </div>
                    {visit.diagnosis && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 text-sm">Diagnosis:</span>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">{visit.diagnosis}</p>
                      </div>
                    )}
                    {visit.prescription && visit.prescription.length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700 text-sm">Prescription:</span>
                        <ul className="text-xs md:text-sm text-gray-600 mt-1 list-disc list-inside">
                          {visit.prescription.map((item, idx) => (
                            <li key={idx}>{item.drug} - {item.dose}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {visit.notes && (
                      <div>
                        <span className="font-medium text-gray-700 text-sm">Notes:</span>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">{visit.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRINT VIEW - Hidden until print */}
           <div className="print-only w-full bg-white p-8">
             <div className="border-b-2 border-teal-700 pb-6 mb-8">
               <div className="flex flex-row-reverse justify-between items-end mb-4">
                 <div className="text-right">
                   <h1 className="text-3xl font-bold text-teal-800">{doctorProfile?.clinic_name || 'نظام دكتور محمد صلاح جبر'}</h1>
                   <p className="text-gray-600 mt-2 text-sm">{doctorProfile?.clinic_name || 'Dr. Mohamed Salah Gabr System'}</p>
                   <p className="text-gray-700 mt-1 text-sm font-medium">Doctor: {doctorProfile?.name || 'Dr. [Doctor Name]'}</p>
                 </div>
                <div className="text-left text-sm text-gray-600">
                  <p>Date: {new Date().toLocaleDateString('en-US')}</p>
                  <p>Patient Name: <strong>{selectedPatient?.name}</strong></p>
                </div>
              </div>
            </div>

            <div className="print-only mb-8">
              <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Medical Prescription</h2>
              <h3 className="text-4xl font-serif text-teal-700 text-center mb-8">R/</h3>

              <div className="space-y-4">
                {rxItems.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-300 pb-3 flex flex-row-reverse justify-between items-start">
                    <div className="text-right flex-1">
                      <div className="font-bold text-lg text-gray-800">{item.drug}</div>
                      <div className="text-sm text-teal-700 font-medium mt-1">{item.dose}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="print-only border-t border-gray-300 pt-6 mt-12 text-center text-xs text-gray-500">
              <p>{doctorProfile?.clinic_name || 'Dr. Mohamed Salah Gabr System'} - {doctorProfile?.clinic_address || 'Cairo, Egypt'}</p>
              <p className="mt-1">{doctorProfile?.clinic_phone || '+20 123 456 7890'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClinicalStation;
