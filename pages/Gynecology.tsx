import React, { useState, useEffect } from 'react';
import { Save, Stethoscope, ClipboardList, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import { Patient, PrescriptionItem } from '../types';
import { supabase } from '../services/supabaseClient';
import { visitsService } from '../services/visitsService';
import { authService } from '../services/authService';
import PrescriptionComponent from '../components/PrescriptionComponent';
import PrescriptionPrinter from '../components/PrescriptionPrinter';

interface GynecologyData {
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
  diagnosis: string;
  procedureOrder: string;
  clinicalNotes: string;

  // Rx Tab
  prescription: PrescriptionItem[];
}

const Gynecology: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'diagnosis' | 'rx'>('assessment');
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);

  const [gynecologyData, setGynecologyData] = useState<GynecologyData>({
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
    diagnosis: '',
    procedureOrder: '',
    clinicalNotes: '',
    prescription: [],
  });

  useEffect(() => {
    fetchPatients();
    fetchDoctorProfile();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

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

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSaveVisit = async () => {
    if (!selectedPatientId || !doctorId) {
      toast.error('Please select a patient');
      return;
    }

    setIsLoading(true);
    try {
      const clinicalData = {
        assessment: {
          complaints: gynecologyData.complaints,
          pvExamination: gynecologyData.pvExamination,
          ultrasound: gynecologyData.ultrasound,
        },
        diagnosis: gynecologyData.diagnosis,
        procedureOrder: gynecologyData.procedureOrder,
        clinicalNotes: gynecologyData.clinicalNotes,
      };

      await visitsService.saveVisit({
        patientId: selectedPatientId,
        department: 'GYNA',
        clinicalData: clinicalData,
        diagnosis: gynecologyData.diagnosis,
        prescription: gynecologyData.prescription,
        notes: gynecologyData.clinicalNotes,
      });

      toast.success('Gynecology visit saved successfully');

      // Reset form
      setGynecologyData({
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
        diagnosis: '',
        procedureOrder: '',
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
          عيادة النساء
        </h1>
        <p className="text-gray-600 font-[Tajawal]">
          Gynecology Station - Diagnosis & Medical Management of Benign Conditions
        </p>
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
              <div className="space-y-6" dir="ltr">
                {/* Complaints */}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chief Complaints</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Menorrhagia', 'Metrorrhagia', 'Dysmenorrhea', 'Amenorrhea', 'Infertility', 'Pelvic Pain', 'Vaginal Discharge'
                    ].map(complaint => (
                      <button
                        key={complaint}
                        onClick={() => toggleComplaint(complaint)}
                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                          gynecologyData.complaints.includes(complaint)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {complaint}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PV Examination */}
                <div dir="ltr">
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
            )}

            {/* Diagnosis & Plan Tab */}
            {activeTab === 'diagnosis' && (
              <div className="space-y-6" dir="ltr">
                {/* Diagnosis */}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ICD-10 Diagnosis</h3>
                  <select
                    value={gynecologyData.diagnosis}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Diagnosis</option>
                    <option value="E28.2 - PCOS (Polycystic Ovary Syndrome)">E28.2 - PCOS (Polycystic Ovary Syndrome)</option>
                    <option value="N93.9 - Abnormal Uterine Bleeding (AUB)">N93.9 - Abnormal Uterine Bleeding (AUB)</option>
                    <option value="N80 - Endometriosis">N80 - Endometriosis</option>
                    <option value="D25 - Uterine Leiomyoma (Fibroid)">D25 - Uterine Leiomyoma (Fibroid)</option>
                    <option value="N84 - Polyp of Female Genital Tract">N84 - Polyp of Female Genital Tract</option>
                    <option value="N85.0 - Endometrial Hyperplasia">N85.0 - Endometrial Hyperplasia</option>
                    <option value="N70 - Salpingitis and Oophoritis (PID)">N70 - Salpingitis and Oophoritis (PID)</option>
                    <option value="N71 - Inflammatory Disease of Uterus">N71 - Inflammatory Disease of Uterus</option>
                    <option value="N97 - Female Infertility">N97 - Female Infertility</option>
                  </select>
                </div>

                {/* Procedure Order */}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Procedure / Management Plan</h3>
                  <select
                    value={gynecologyData.procedureOrder}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, procedureOrder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Procedure</option>
                    <option value="Conservative Management">Conservative Management</option>
                    <option value="Hysteroscopy + D&C">Hysteroscopy + D&C</option>
                    <option value="Diagnostic Laparoscopy">Diagnostic Laparoscopy</option>
                    <option value="Pap Smear Screening">Pap Smear Screening</option>
                    <option value="Endometrial Biopsy">Endometrial Biopsy</option>
                    <option value="Colposcopy">Colposcopy</option>
                    <option value="Myomectomy">Myomectomy</option>
                    <option value="IUD Insertion">IUD Insertion</option>
                  </select>
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
        diagnosis={gynecologyData.diagnosis}
        notes={gynecologyData.clinicalNotes}
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />
    </div>
  );
};

export default Gynecology;