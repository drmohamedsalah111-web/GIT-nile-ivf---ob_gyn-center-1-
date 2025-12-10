import React, { useState, useEffect } from 'react';
import { Save, Stethoscope, ClipboardList, Pill } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { Patient, PrescriptionItem } from '../types';
import { db } from '../src/db/localDB';
import { visitsService } from '../services/visitsService';
import { authService } from '../services/authService';
import PrescriptionComponent from '../components/PrescriptionComponent';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import SearchableSelect from '../components/ui/SearchableSelect';
import RefreshButton from '../components/RefreshButton';
import HistorySidebar from '../src/components/HistorySidebar';
import { COMMON_COMPLAINTS, ICD10_DIAGNOSES, PROCEDURE_ORDERS } from '../data/medical_terms';

interface GynecologyData {
  // Vitals
  vitals: {
    weight?: number;
    height?: number;
    bmi?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    temperature?: number;
  };

  // Assessment Tab
  complaints: string[];
  pvExamination: {
    vulva: string;
    vagina: string;
    cervix: string;
    adnexa: string;
  };
  ultrasound: {
    uterus: {
      dimensions: string;
      position: string;
      myometrium: string;
      cavity: string;
    };
    endometrium: {
      thickness: string;
      pattern: string;
    };
    adnexa: {
      rightOvary: string;
      leftOvary: string;
      pod: string;
    };
  };

  // Diagnosis & Plan Tab
  diagnosis: string[];
  procedureOrder: string[];
  clinicalNotes: string;

  // Rx Tab
  prescription: PrescriptionItem[];
}

const Gynecology: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnosis' | 'rx'>('assessment');
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const patients = useLiveQuery(() => db.patients.toArray(), []) || [];

  const [gynecologyData, setGynecologyData] = useState<GynecologyData>({
    vitals: {
      weight: undefined,
      height: undefined,
      bmi: undefined,
      bpSystolic: undefined,
      bpDiastolic: undefined,
      temperature: undefined,
    },
    complaints: [],
    pvExamination: {
      vulva: '',
      vagina: '',
      cervix: '',
      adnexa: '',
    },
    ultrasound: {
      uterus: {
        dimensions: '',
        position: 'AVF',
        myometrium: 'Homogeneous',
        cavity: 'Empty',
      },
      endometrium: {
        thickness: '',
        pattern: 'Triple Line',
      },
      adnexa: {
        rightOvary: '',
        leftOvary: '',
        pod: 'Clear',
      },
    },
    diagnosis: [],
    procedureOrder: [],
    clinicalNotes: '',
    prescription: [],
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const doctor = await authService.getDoctorProfile(user.id);
        setDoctorId(doctor.id);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast.error('Failed to load doctor profile');
    }
  };

  const selectedPatient = patients.find(p => p.id.toString() === selectedPatientId);

  const handleSaveVisit = async () => {
    if (!selectedPatientId || !doctorId) {
      toast.error('Please select a patient');
      return;
    }

    setIsLoading(true);
    try {
      const clinicalData = {
        vitals: gynecologyData.vitals,
        assessment: {
          complaints: gynecologyData.complaints,
          pvExamination: gynecologyData.pvExamination,
          ultrasound: gynecologyData.ultrasound,
        },
        diagnosis: gynecologyData.diagnosis.join('; '),
        procedureOrder: gynecologyData.procedureOrder.join('; '),
        clinicalNotes: gynecologyData.clinicalNotes,
      };

      await visitsService.saveVisit({
        patientId: selectedPatientId,
        department: 'GYNA',
        clinicalData: clinicalData,
        diagnosis: gynecologyData.diagnosis.join('; '),
        prescription: gynecologyData.prescription,
        notes: gynecologyData.clinicalNotes,
      });

      toast.success('Gynecology visit saved successfully');

      // Reset form
      setGynecologyData({
        vitals: {
          weight: undefined,
          height: undefined,
          bmi: undefined,
          bpSystolic: undefined,
          bpDiastolic: undefined,
          temperature: undefined,
        },
        complaints: [],
        pvExamination: {
          vulva: '',
          vagina: '',
          cervix: '',
          adnexa: '',
        },
        ultrasound: {
          uterus: {
            dimensions: '',
            position: 'AVF',
            myometrium: 'Homogeneous',
            cavity: 'Empty',
          },
          endometrium: {
            thickness: '',
            pattern: 'Triple Line',
          },
          adnexa: {
            rightOvary: '',
            leftOvary: '',
            pod: 'Clear',
          },
        },
        diagnosis: [],
        procedureOrder: [],
        clinicalNotes: '',
        prescription: [],
      });

    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error(`Failed to save visit: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplaint = (complaint: string) => {
    setGynecologyData(prev => ({
      ...prev,
      complaints: prev.complaints.includes(complaint)
        ? prev.complaints.filter(c => c !== complaint)
        : [...prev.complaints, complaint]
    }));
  };

  const toggleDiagnosis = (diagnosis: string) => {
    setGynecologyData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis.includes(diagnosis)
        ? prev.diagnosis.filter(d => d !== diagnosis)
        : [...prev.diagnosis, diagnosis]
    }));
  };

  const toggleProcedure = (procedure: string) => {
    setGynecologyData(prev => ({
      ...prev,
      procedureOrder: prev.procedureOrder.includes(procedure)
        ? prev.procedureOrder.filter(p => p !== procedure)
        : [...prev.procedureOrder, procedure]
    }));
  };

  const handleVitalsChange = (field: keyof GynecologyData['vitals'], value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    
    setGynecologyData(prev => {
      const newVitals = { ...prev.vitals, [field]: numValue };
      
      if (field === 'weight' || field === 'height') {
        if (newVitals.weight && newVitals.height && newVitals.height > 0) {
          const heightInMeters = newVitals.height / 100;
          newVitals.bmi = parseFloat((newVitals.weight / (heightInMeters * heightInMeters)).toFixed(1));
        }
      }
      
      return {
        ...prev,
        vitals: newVitals,
      };
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
            عيادة النساء
          </h1>
          <p className="text-gray-600 font-[Tajawal]">
            Gynecology Station - Diagnosis & Medical Management of Benign Conditions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            📜 السجل السابق
          </button>
          <RefreshButton />
        </div>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Patient
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">-- Select Patient --</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name} - {patient.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div className="bg-white rounded-lg shadow-md">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('assessment')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'assessment'
                    ? 'border-b-2 border-teal-500 text-teal-600 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Stethoscope className="w-5 h-5 inline mr-2" />
                Clinical Assessment
              </button>
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'diagnosis'
                    ? 'border-b-2 border-amber-500 text-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardList className="w-5 h-5 inline mr-2" />
                Diagnosis & Plan
              </button>
              <button
                onClick={() => setActiveTab('rx')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'rx'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Pill className="w-5 h-5 inline mr-2" />
                Prescription
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Assessment Tab */}
            {activeTab === 'assessment' && (
              <div className="grid md:grid-cols-2 gap-6" dir="ltr">
                {/* LEFT COLUMN: Vitals & Complaints */}
                <div className="space-y-6">
                  {/* Vitals Section */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h3>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={gynecologyData.vitals.weight || ''}
                          onChange={(e) => handleVitalsChange('weight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 65"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={gynecologyData.vitals.height || ''}
                          onChange={(e) => handleVitalsChange('height', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 165"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium">
                          {gynecologyData.vitals.bmi ? gynecologyData.vitals.bmi.toFixed(1) : '--'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°C)</label>
                        <input
                          type="number"
                          value={gynecologyData.vitals.temperature || ''}
                          onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 37"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BP Systolic</label>
                        <input
                          type="number"
                          value={gynecologyData.vitals.bpSystolic || ''}
                          onChange={(e) => handleVitalsChange('bpSystolic', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="mmHg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BP Diastolic</label>
                        <input
                          type="number"
                          value={gynecologyData.vitals.bpDiastolic || ''}
                          onChange={(e) => handleVitalsChange('bpDiastolic', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="mmHg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complaints */}
                  <div className="text-left">
                    <SearchableSelect
                      label="Chief Complaints"
                      options={COMMON_COMPLAINTS}
                      value={gynecologyData.complaints}
                      onChange={(value) => setGynecologyData(prev => ({
                        ...prev,
                        complaints: Array.isArray(value) ? value : [value]
                      }))}
                      placeholder="ابحث عن الشكوى أو أضف شكوى جديدة"
                      multi={true}
                      allowCustom={true}
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Investigations & Scans */}
                <div className="space-y-6">
                {/* PV Examination */}
                <div className="bg-green-50 p-4 rounded-lg" dir="ltr">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaginal Examination (PV)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vulva</label>
                      <input
                        type="text"
                        value={gynecologyData.pvExamination.vulva}
                        onChange={(e) => setGynecologyData(prev => ({
                          ...prev,
                          pvExamination: { ...prev.pvExamination, vulva: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Normal / Lesions / etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vagina</label>
                      <input
                        type="text"
                        value={gynecologyData.pvExamination.vagina}
                        onChange={(e) => setGynecologyData(prev => ({
                          ...prev,
                          pvExamination: { ...prev.pvExamination, vagina: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Normal / Discharge / etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cervix</label>
                      <input
                        type="text"
                        value={gynecologyData.pvExamination.cervix}
                        onChange={(e) => setGynecologyData(prev => ({
                          ...prev,
                          pvExamination: { ...prev.pvExamination, cervix: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Normal / Erosion / Motion tenderness"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adnexa</label>
                      <input
                        type="text"
                        value={gynecologyData.pvExamination.adnexa}
                        onChange={(e) => setGynecologyData(prev => ({
                          ...prev,
                          pvExamination: { ...prev.pvExamination, adnexa: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Normal / Mass / Tenderness"
                      />
                    </div>
                  </div>
                </div>

                {/* Office Ultrasound */}
                <div dir="ltr">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transvaginal Ultrasound (TVS)</h3>

                  {/* Uterus */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Uterus</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (LxWxAP)</label>
                        <input type="text" value={gynecologyData.ultrasound.uterus.dimensions} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, uterus: { ...prev.ultrasound.uterus, dimensions: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="e.g., 7x5x4 cm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <select value={gynecologyData.ultrasound.uterus.position} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, uterus: { ...prev.ultrasound.uterus, position: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="AVF">Anteverted Flexed (AVF)</option>
                          <option value="RVF">Retroverted Flexed (RVF)</option>
                          <option value="Axial">Axial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Myometrium</label>
                        <select value={gynecologyData.ultrasound.uterus.myometrium} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, uterus: { ...prev.ultrasound.uterus, myometrium: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="Homogeneous">Homogeneous</option>
                          <option value="Heterogeneous">Heterogeneous</option>
                          <option value="Fibroid">Fibroid</option>
                          <option value="Adenomyosis">Adenomyosis</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cavity</label>
                        <select value={gynecologyData.ultrasound.uterus.cavity} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, uterus: { ...prev.ultrasound.uterus, cavity: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="Empty">Empty</option>
                          <option value="Polyp">Polyp</option>
                          <option value="Fibroid">Fibroid</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Endometrium */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Endometrium</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
                        <input type="text" value={gynecologyData.ultrasound.endometrium.thickness} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, endometrium: { ...prev.ultrasound.endometrium, thickness: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="e.g., 8-10 mm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                        <select value={gynecologyData.ultrasound.endometrium.pattern} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, endometrium: { ...prev.ultrasound.endometrium, pattern: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="Triple Line">Triple Line</option>
                          <option value="Hyperechoic">Hyperechoic</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Adnexa */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Adnexa</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Right Ovary</label>
                        <select value={gynecologyData.ultrasound.adnexa.rightOvary} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, adnexa: { ...prev.ultrasound.adnexa, rightOvary: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="">Select</option>
                          <option value="Normal">Normal</option>
                          <option value="PCO">Polycystic (PCO)</option>
                          <option value="Cyst">Cyst</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Left Ovary</label>
                        <select value={gynecologyData.ultrasound.adnexa.leftOvary} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, adnexa: { ...prev.ultrasound.adnexa, leftOvary: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="">Select</option>
                          <option value="Normal">Normal</option>
                          <option value="PCO">Polycystic (PCO)</option>
                          <option value="Cyst">Cyst</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">POD (Pouch of Douglas)</label>
                        <select value={gynecologyData.ultrasound.adnexa.pod} onChange={(e) => setGynecologyData(prev => ({ ...prev, ultrasound: { ...prev.ultrasound, adnexa: { ...prev.ultrasound.adnexa, pod: e.target.value } } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                          <option value="Clear">Clear</option>
                          <option value="Free Fluid">Free Fluid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Diagnosis & Plan Tab */}
            {activeTab === 'diagnosis' && (
              <div className="space-y-6" dir="ltr">
                {/* Diagnosis */}
                <div className="text-left">
                  <SearchableSelect
                    label="ICD-10 التشخيص (اختر متعدد)"
                    options={ICD10_DIAGNOSES}
                    value={gynecologyData.diagnosis}
                    onChange={(value) => setGynecologyData(prev => ({
                      ...prev,
                      diagnosis: Array.isArray(value) ? value : [value]
                    }))}
                    placeholder="ابحث عن التشخيص أو أضف تشخيص جديد"
                    multi={true}
                    allowCustom={true}
                  />
                  {gynecologyData.diagnosis.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium font-[Tajawal]">التشخيصات المحددة:</p>
                      <p className="text-sm text-amber-700 mt-1 font-[Tajawal]">{gynecologyData.diagnosis.join('; ')}</p>
                    </div>
                  )}
                </div>

                {/* Procedure Order */}
                <div className="text-left">
                  <SearchableSelect
                    label="خطة العلاج / الإجراءات (اختر متعدد)"
                    options={PROCEDURE_ORDERS}
                    value={gynecologyData.procedureOrder}
                    onChange={(value) => setGynecologyData(prev => ({
                      ...prev,
                      procedureOrder: Array.isArray(value) ? value : [value]
                    }))}
                    placeholder="ابحث عن إجراء أو أضف إجراء جديد"
                    multi={true}
                    allowCustom={true}
                  />
                  {gynecologyData.procedureOrder.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium font-[Tajawal]">الإجراءات المحددة:</p>
                      <p className="text-sm text-blue-700 mt-1 font-[Tajawal]">{gynecologyData.procedureOrder.join('; ')}</p>
                    </div>
                  )}
                </div>

                {/* Clinical Notes */}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes & Plan</h3>
                  <textarea
                    value={gynecologyData.clinicalNotes}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter clinical observations, management plan, and follow-up..."
                  />
                </div>
              </div>
            )}

            {/* Rx Tab */}
            {activeTab === 'rx' && (
              <PrescriptionComponent
                prescriptions={gynecologyData.prescription}
                onPrescriptionsChange={(prescriptions) =>
                  setGynecologyData(prev => ({ ...prev, prescription: prescriptions }))
                }
                onPrint={() => setIsPrinterOpen(true)}
                showPrintButton={true}
              />
            )}
          </div>

          {/* Save Button */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleSaveVisit}
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Gynecology Visit'}
            </button>
          </div>
        </div>
      )}

      <PrescriptionPrinter
        patient={selectedPatient || null}
        prescriptions={gynecologyData.prescription}
        diagnosis={gynecologyData.diagnosis.join('; ')}
        notes={gynecologyData.clinicalNotes}
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />

      <HistorySidebar
        patientId={selectedPatientId}
        category="GYNA"
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};

export default Gynecology;