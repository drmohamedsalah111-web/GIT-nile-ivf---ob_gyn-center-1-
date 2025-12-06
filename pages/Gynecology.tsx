import React, { useState, useEffect } from 'react';
import { Save, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { Patient, PrescriptionItem } from '../types';
import { supabase } from '../services/supabaseClient';
import { visitsService } from '../services/visitsService';
import { authService } from '../services/authService';

interface GynecologyData {
  // Hormonal Profile
  fsh: string;
  lh: string;
  e2: string;
  prolactin: string;
  tsh: string;
  amh: string;

  // Ultrasound Findings
  uterusLength: string;
  uterusWidth: string;
  uterusAP: string;
  uterusOrientation: string;
  uterusMyometrium: string;
  endometriumThickness: string;
  endometriumPattern: string;
  rightOvarySize: string;
  leftOvarySize: string;
  rightOvaryCyst: string;
  leftOvaryCyst: string;
  pouchOfDouglas: string;

  // Diagnosis & Plan
  clinicalNotes: string;
  diagnosis: string[];
}

const Gynecology: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [gynecologyData, setGynecologyData] = useState<GynecologyData>({
    fsh: '',
    lh: '',
    e2: '',
    prolactin: '',
    tsh: '',
    amh: '',
    uterusLength: '',
    uterusWidth: '',
    uterusAP: '',
    uterusOrientation: 'AVF',
    uterusMyometrium: 'Normal',
    endometriumThickness: '',
    endometriumPattern: 'Triple Line',
    rightOvarySize: '',
    leftOvarySize: '',
    rightOvaryCyst: '',
    leftOvaryCyst: '',
    pouchOfDouglas: 'No',
    clinicalNotes: '',
    diagnosis: [],
  });

  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);

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
        department: 'gynecology',
        hormonalProfile: {
          fsh: gynecologyData.fsh,
          lh: gynecologyData.lh,
          e2: gynecologyData.e2,
          prolactin: gynecologyData.prolactin,
          tsh: gynecologyData.tsh,
          amh: gynecologyData.amh,
        },
        ultrasoundFindings: {
          uterus: {
            length: gynecologyData.uterusLength,
            width: gynecologyData.uterusWidth,
            ap: gynecologyData.uterusAP,
            orientation: gynecologyData.uterusOrientation,
            myometrium: gynecologyData.uterusMyometrium,
          },
          endometrium: {
            thickness: gynecologyData.endometriumThickness,
            pattern: gynecologyData.endometriumPattern,
          },
          ovaries: {
            right: {
              size: gynecologyData.rightOvarySize,
              cyst: gynecologyData.rightOvaryCyst,
            },
            left: {
              size: gynecologyData.leftOvarySize,
              cyst: gynecologyData.leftOvaryCyst,
            },
          },
          pouchOfDouglas: gynecologyData.pouchOfDouglas,
        },
        diagnosis: gynecologyData.diagnosis,
        clinicalNotes: gynecologyData.clinicalNotes,
      };

      const visitData = {
        patientId: selectedPatientId,
        date: new Date().toISOString().split('T')[0],
        diagnosis: gynecologyData.diagnosis.join(', '),
        prescription: prescription,
        notes: gynecologyData.clinicalNotes,
        clinical_data: clinicalData,
      };

      await visitsService.createVisit(visitData);
      toast.success('Gynecology visit saved successfully');

      // Reset form
      setGynecologyData({
        fsh: '', lh: '', e2: '', prolactin: '', tsh: '', amh: '',
        uterusLength: '', uterusWidth: '', uterusAP: '',
        uterusOrientation: 'AVF', uterusMyometrium: 'Normal',
        endometriumThickness: '', endometriumPattern: 'Triple Line',
        rightOvarySize: '', leftOvarySize: '', rightOvaryCyst: '', leftOvaryCyst: '',
        pouchOfDouglas: 'No', clinicalNotes: '', diagnosis: [],
      });
      setPrescription([]);

    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error(`Failed to save visit: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiagnosis = (diagnosis: string) => {
    setGynecologyData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis.includes(diagnosis)
        ? prev.diagnosis.filter(d => d !== diagnosis)
        : [...prev.diagnosis, diagnosis]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
          Gynecology Station
        </h1>
        <p className="text-gray-600 font-[Tajawal]">
          Comprehensive gynecological assessment with hormonal profile and ultrasound findings
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Clinical Assessment */}
          <div className="space-y-6">
            {/* Hormonal Profile */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Hormonal Profile (Day 2-3)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FSH (IU/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gynecologyData.fsh}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, fsh: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LH (IU/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gynecologyData.lh}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, lh: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E2 (pg/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gynecologyData.e2}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, e2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prolactin (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gynecologyData.prolactin}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, prolactin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TSH (mIU/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gynecologyData.tsh}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, tsh: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AMH (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gynecologyData.amh}
                    onChange={(e) => setGynecologyData(prev => ({ ...prev, amh: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Ultrasound Findings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Ultrasound Findings (TVS)
              </h3>

              {/* Uterus */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Uterus</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
                    <input
                      type="number"
                      value={gynecologyData.uterusLength}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, uterusLength: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width (mm)</label>
                    <input
                      type="number"
                      value={gynecologyData.uterusWidth}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, uterusWidth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AP (mm)</label>
                    <input
                      type="number"
                      value={gynecologyData.uterusAP}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, uterusAP: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                    <select
                      value={gynecologyData.uterusOrientation}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, uterusOrientation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="AVF">AVF</option>
                      <option value="RVF">RVF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Myometrium</label>
                    <select
                      value={gynecologyData.uterusMyometrium}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, uterusMyometrium: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Adenomyosis">Adenomyosis</option>
                      <option value="Fibroid">Fibroid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Endometrium */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Endometrium</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gynecologyData.endometriumThickness}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, endometriumThickness: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                    <select
                      value={gynecologyData.endometriumPattern}
                      onChange={(e) => setGynecologyData(prev => ({ ...prev, endometriumPattern: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Triple Line">Triple Line</option>
                      <option value="Homogeneous">Homogeneous</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ovaries */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Ovaries</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Right Ovary</h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Size (e.g., 25x18x15 mm)"
                        value={gynecologyData.rightOvarySize}
                        onChange={(e) => setGynecologyData(prev => ({ ...prev, rightOvarySize: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Cyst description"
                        value={gynecologyData.rightOvaryCyst}
                        onChange={(e) => setGynecologyData(prev => ({ ...prev, rightOvaryCyst: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Left Ovary</h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Size (e.g., 25x18x15 mm)"
                        value={gynecologyData.leftOvarySize}
                        onChange={(e) => setGynecologyData(prev => ({ ...prev, leftOvarySize: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Cyst description"
                        value={gynecologyData.leftOvaryCyst}
                        onChange={(e) => setGynecologyData(prev => ({ ...prev, leftOvaryCyst: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pouch of Douglas */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Pouch of Douglas</h4>
                <select
                  value={gynecologyData.pouchOfDouglas}
                  onChange={(e) => setGynecologyData(prev => ({ ...prev, pouchOfDouglas: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="No">No free fluid</option>
                  <option value="Minimal">Minimal free fluid</option>
                  <option value="Moderate">Moderate free fluid</option>
                  <option value="Abundant">Abundant free fluid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Diagnosis & Plan */}
          <div className="space-y-6">
            {/* Clinical Notes */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Clinical Notes
              </h3>
              <textarea
                value={gynecologyData.clinicalNotes}
                onChange={(e) => setGynecologyData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter clinical observations and notes..."
              />
            </div>

            {/* Diagnosis */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'PCOS', 'Endometriosis', 'Uterine Fibroid', 'Adenomyosis',
                  'Ovarian Cyst', 'Endometrial Polyp', 'Cervical Dysplasia', 'Pelvic Inflammatory Disease',
                  'Uterine Septum', 'Asherman Syndrome', 'Normal Findings'
                ].map(diagnosis => (
                  <button
                    key={diagnosis}
                    onClick={() => toggleDiagnosis(diagnosis)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      gynecologyData.diagnosis.includes(diagnosis)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {diagnosis}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescription Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription</h3>
              <div className="space-y-4">
                {/* Prescription items would go here - simplified for now */}
                <p className="text-gray-500 text-sm">Prescription functionality to be implemented</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white p-6 rounded-lg shadow-md">
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
        </div>
      )}
    </div>
  );
};

export default Gynecology;