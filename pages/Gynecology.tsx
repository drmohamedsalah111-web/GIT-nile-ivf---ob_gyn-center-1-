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
      myometrium: string;
      cavity: string;
    };
    ovaries: {
      right: {
        size: string;
        cysts: string;
      };
      left: {
        size: string;
        cysts: string;
      };
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
        myometrium: 'Normal',
        cavity: 'Empty',
      },
      ovaries: {
        right: {
          size: '',
          cysts: '',
        },
        left: {
          size: '',
          cysts: '',
        },
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
            myometrium: 'Normal',
            cavity: 'Empty',
          },
          ovaries: {
            right: {
              size: '',
              cysts: '',
            },
            left: {
              size: '',
              cysts: '',
            },
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
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Stethoscope className="w-5 h-5 inline mr-2" />
                Assessment
              </button>
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'diagnosis'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
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
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Pill className="w-5 h-5 inline mr-2" />
                Rx
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Assessment Tab */}
            {activeTab === 'assessment' && (
              <div className="space-y-6">
                {/* Complaints */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Menorrhagia', 'Dysmenorrhea', 'Pelvic Pain', 'Abnormal Discharge',
                      'Postcoital Bleeding', 'Intermenstrual Bleeding', 'Amenorrhea', 'Dyspareunia'
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">PV Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Ultrasound (TVS)</h3>

                  {/* Uterus */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Uterus</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</label>
                        <input
                          type="text"
                          value={gynecologyData.ultrasound.uterus.dimensions}
                          onChange={(e) => setGynecologyData(prev => ({
                            ...prev,
                            ultrasound: {
                              ...prev.ultrasound,
                              uterus: { ...prev.ultrasound.uterus, dimensions: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="L x W x AP"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Myometrium</label>
                        <select
                          value={gynecologyData.ultrasound.uterus.myometrium}
                          onChange={(e) => setGynecologyData(prev => ({
                            ...prev,
                            ultrasound: {
                              ...prev.ultrasound,
                              uterus: { ...prev.ultrasound.uterus, myometrium: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Adenomyosis">Adenomyosis</option>
                          <option value="Fibroid">Fibroid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cavity</label>
                        <select
                          value={gynecologyData.ultrasound.uterus.cavity}
                          onChange={(e) => setGynecologyData(prev => ({
                            ...prev,
                            ultrasound: {
                              ...prev.ultrasound,
                              uterus: { ...prev.ultrasound.uterus, cavity: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="Empty">Empty</option>
                          <option value="Polyp">Polyp</option>
                          <option value="Fibroid">Fibroid</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ovaries */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Ovaries</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Right Ovary</h5>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Size (mm)"
                            value={gynecologyData.ultrasound.ovaries.right.size}
                            onChange={(e) => setGynecologyData(prev => ({
                              ...prev,
                              ultrasound: {
                                ...prev.ultrasound,
                                ovaries: {
                                  ...prev.ultrasound.ovaries,
                                  right: { ...prev.ultrasound.ovaries.right, size: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            placeholder="Cysts"
                            value={gynecologyData.ultrasound.ovaries.right.cysts}
                            onChange={(e) => setGynecologyData(prev => ({
                              ...prev,
                              ultrasound: {
                                ...prev.ultrasound,
                                ovaries: {
                                  ...prev.ultrasound.ovaries,
                                  right: { ...prev.ultrasound.ovaries.right, cysts: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Left Ovary</h5>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Size (mm)"
                            value={gynecologyData.ultrasound.ovaries.left.size}
                            onChange={(e) => setGynecologyData(prev => ({
                              ...prev,
                              ultrasound: {
                                ...prev.ultrasound,
                                ovaries: {
                                  ...prev.ultrasound.ovaries,
                                  left: { ...prev.ultrasound.ovaries.left, size: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            placeholder="Cysts"
                            value={gynecologyData.ultrasound.ovaries.left.cysts}
                            onChange={(e) => setGynecologyData(prev => ({
                              ...prev,
                              ultrasound: {
                                ...prev.ultrasound,
                                ovaries: {
                                  ...prev.ultrasound.ovaries,
                                  left: { ...prev.ultrasound.ovaries.left, cysts: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnosis & Plan Tab */}
            {activeTab === 'diagnosis' && (
              <div className="space-y-6">
                {/* Diagnosis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis</h3>
                  <select
                    value={gynecologyData.diagnosis}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Diagnosis</option>
                    <option value="N93.9 - Abnormal Uterine Bleeding">N93.9 - Abnormal Uterine Bleeding</option>
                    <option value="N80 - Endometriosis">N80 - Endometriosis</option>
                    <option value="D25 - Uterine Leiomyoma">D25 - Uterine Leiomyoma</option>
                    <option value="N84 - Polyp of Female Genital Tract">N84 - Polyp of Female Genital Tract</option>
                    <option value="N85.0 - Endometrial Hyperplasia">N85.0 - Endometrial Hyperplasia</option>
                    <option value="N70 - Salpingitis and Oophoritis">N70 - Salpingitis and Oophoritis</option>
                    <option value="N71 - Inflammatory Disease of Uterus">N71 - Inflammatory Disease of Uterus</option>
                  </select>
                </div>

                {/* Procedure Order */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Procedure Order</h3>
                  <select
                    value={gynecologyData.procedureOrder}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, procedureOrder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Procedure</option>
                    <option value="Schedule Hysteroscopy">Schedule Hysteroscopy</option>
                    <option value="Schedule D&C">Schedule D&C</option>
                    <option value="Schedule Laparoscopy">Schedule Laparoscopy</option>
                    <option value="Pap Smear">Pap Smear</option>
                    <option value="Endometrial Biopsy">Endometrial Biopsy</option>
                    <option value="Colposcopy">Colposcopy</option>
                  </select>
                </div>

                {/* Clinical Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h3>
                  <textarea
                    value={gynecologyData.clinicalNotes}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter clinical observations and plan..."
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