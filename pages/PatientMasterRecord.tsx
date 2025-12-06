import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, Activity, Heart, Baby, Printer } from 'lucide-react';
import { Patient, Visit } from '../types';
import { supabase } from '../services/supabaseClient';
import { visitsService } from '../services/visitsService';
import toast from 'react-hot-toast';
import PrescriptionPrinter from '../components/PrescriptionPrinter';

const PatientMasterRecord: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientVisits(selectedPatientId);
    } else {
      setVisits([]);
    }
  }, [selectedPatientId]);

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

  const fetchPatientVisits = async (patientId: string) => {
    setIsLoading(true);
    try {
      const data = await visitsService.getVisitsByPatient(patientId);
      // Map snake_case database columns to camelCase for display
      const mappedData = (data || []).map((visit: any) => ({
        ...visit,
        patientId: visit.patient_id, // map back to camelCase for consistency
      }));
      setVisits(mappedData);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load patient visits');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const getDepartmentIcon = (department?: string) => {
    switch (department) {
      case 'GYNA': return <Heart className="w-5 h-5 text-pink-600" />;
      case 'OBS': return <Baby className="w-5 h-5 text-blue-600" />;
      case 'IVF_STIM': return <Activity className="w-5 h-5 text-green-600" />;
      case 'IVF_LAB': return <Activity className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDepartmentName = (department?: string) => {
    switch (department) {
      case 'GYNA': return 'Gynecology';
      case 'OBS': return 'Obstetrics';
      case 'IVF_STIM': return 'IVF Stimulation';
      case 'IVF_LAB': return 'IVF Lab';
      default: return 'General Visit';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderClinicalData = (data: any, department?: string) => {
    if (!data) return null;

    switch (department) {
      case 'GYNA':
        return renderGynecologyData(data);
      case 'OBS':
        return renderObstetricsData(data);
      case 'IVF_STIM':
        return renderIVFData(data);
      default:
        return (
          <div className="text-sm text-gray-600">
            <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          </div>
        );
    }
  };

  const renderGynecologyData = (data: any) => {
    const { assessment, diagnosis, procedureOrder, clinicalNotes } = data;

    return (
      <div className="space-y-3">
        {/* Complaints */}
        {assessment?.complaints && assessment.complaints.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Complaints:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {assessment.complaints.map((complaint: string, idx: number) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {complaint}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PV Examination */}
        {assessment?.pvExamination && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {assessment.pvExamination.vulva && (
              <div><span className="font-medium">Vulva:</span> {assessment.pvExamination.vulva}</div>
            )}
            {assessment.pvExamination.vagina && (
              <div><span className="font-medium">Vagina:</span> {assessment.pvExamination.vagina}</div>
            )}
            {assessment.pvExamination.cervix && (
              <div><span className="font-medium">Cervix:</span> {assessment.pvExamination.cervix}</div>
            )}
            {assessment.pvExamination.adnexa && (
              <div><span className="font-medium">Adnexa:</span> {assessment.pvExamination.adnexa}</div>
            )}
          </div>
        )}

        {/* Ultrasound */}
        {assessment?.ultrasound && (
          <div>
            <span className="font-medium text-gray-700">Ultrasound Findings:</span>
            <div className="mt-2 space-y-2">
              {assessment.ultrasound.uterus && (
                <div className="bg-gray-50 p-2 rounded text-sm">
                  <div className="font-medium text-gray-800">Uterus:</div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                    {assessment.ultrasound.uterus.dimensions && (
                      <div>Size: {assessment.ultrasound.uterus.dimensions}</div>
                    )}
                    {assessment.ultrasound.uterus.myometrium && (
                      <div>Myometrium: {assessment.ultrasound.uterus.myometrium}</div>
                    )}
                    {assessment.ultrasound.uterus.cavity && (
                      <div>Cavity: {assessment.ultrasound.uterus.cavity}</div>
                    )}
                  </div>
                </div>
              )}

              {(assessment.ultrasound.ovaries?.right || assessment.ultrasound.ovaries?.left) && (
                <div className="bg-gray-50 p-2 rounded text-sm">
                  <div className="font-medium text-gray-800">Ovaries:</div>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    {assessment.ultrasound.ovaries.right && (
                      <div>
                        <div className="font-medium">Right:</div>
                        <div>Size: {assessment.ultrasound.ovaries.right.size || 'N/A'}</div>
                        {assessment.ultrasound.ovaries.right.cysts && (
                          <div>Cysts: {assessment.ultrasound.ovaries.right.cysts}</div>
                        )}
                      </div>
                    )}
                    {assessment.ultrasound.ovaries.left && (
                      <div>
                        <div className="font-medium">Left:</div>
                        <div>Size: {assessment.ultrasound.ovaries.left.size || 'N/A'}</div>
                        {assessment.ultrasound.ovaries.left.cysts && (
                          <div>Cysts: {assessment.ultrasound.ovaries.left.cysts}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnosis & Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
          {diagnosis && (
            <div>
              <span className="font-medium text-green-700">Diagnosis:</span>
              <div className="text-sm text-gray-700 mt-1">{diagnosis}</div>
            </div>
          )}
          {procedureOrder && (
            <div>
              <span className="font-medium text-purple-700">Procedure:</span>
              <div className="text-sm text-gray-700 mt-1">{procedureOrder}</div>
            </div>
          )}
        </div>

        {clinicalNotes && (
          <div className="pt-2 border-t border-gray-200">
            <span className="font-medium text-gray-700">Clinical Notes:</span>
            <div className="text-sm text-gray-600 mt-1 italic">{clinicalNotes}</div>
          </div>
        )}
      </div>
    );
  };

  const renderObstetricsData = (data: any) => {
    const { gestationalAge, riskAssessment, currentStatus } = data;

    return (
      <div className="space-y-3">
        {gestationalAge && (
          <div>
            <span className="font-medium text-gray-700">Gestational Age:</span>
            <span className="text-blue-600 font-medium ml-2">
              {gestationalAge.weeks} weeks {gestationalAge.days} days
            </span>
          </div>
        )}

        {riskAssessment && (
          <div>
            <span className="font-medium text-gray-700">Risk Assessment:</span>
            <div className="mt-1 space-y-1 text-sm">
              <div>Level: <span className={`font-medium ${
                riskAssessment.level === 'high' ? 'text-red-600' :
                riskAssessment.level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
              }`}>{riskAssessment.level}</span></div>
              {riskAssessment.aspirin && <div>✅ Aspirin prescribed</div>}
              {riskAssessment.thromboprophylaxis && <div>✅ Thromboprophylaxis needed</div>}
            </div>
          </div>
        )}

        {currentStatus && (
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="text-green-600 ml-2">{currentStatus}</span>
          </div>
        )}
      </div>
    );
  };

  const renderIVFData = (data: any) => {
    const { protocol, startDate, stimulationDays, currentStatus, latestHormones } = data;

    return (
      <div className="space-y-3">
        {protocol && (
          <div>
            <span className="font-medium text-gray-700">Protocol:</span>
            <span className="text-purple-600 ml-2">{protocol}</span>
          </div>
        )}

        {startDate && (
          <div>
            <span className="font-medium text-gray-700">Started:</span>
            <span className="text-gray-600 ml-2">{formatDate(startDate)}</span>
          </div>
        )}

        {stimulationDays && (
          <div>
            <span className="font-medium text-gray-700">Stimulation Days:</span>
            <span className="text-blue-600 ml-2">{stimulationDays}</span>
          </div>
        )}

        {latestHormones && (
          <div>
            <span className="font-medium text-gray-700">Latest Hormones:</span>
            <div className="mt-1 text-sm">
              {latestHormones.e2 && <div>E2: {latestHormones.e2} pg/mL</div>}
              {latestHormones.lh && <div>LH: {latestHormones.lh} IU/L</div>}
            </div>
          </div>
        )}

        {currentStatus && (
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="text-green-600 ml-2">{currentStatus}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
          Patient Master Record
        </h1>
        <p className="text-gray-600 font-[Tajawal]">
          Complete timeline of all patient visits across all departments
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
          {/* Patient Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                <p className="text-teal-100">{selectedPatient.phone}</p>
                <p className="text-teal-100 text-sm">Age: {selectedPatient.age} years</p>
              </div>
            </div>
          </div>

          {/* Visit Timeline */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Visit Timeline</h3>
              <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-sm font-medium">
                {visits.length} visits
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : visits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No visits recorded yet</p>
                <p className="text-sm">Visits from all departments will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit, index) => (
                  <div key={visit.id} className="relative">
                    {/* Timeline line */}
                    {index < visits.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-12 bg-gray-200"></div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start gap-4">
                        {/* Department Icon */}
                        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                          {getDepartmentIcon(visit.department)}
                        </div>

                        {/* Visit Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {getDepartmentName(visit.department)}
                            </h4>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {formatDate(visit.date)}
                            </span>
                          </div>

                          {visit.diagnosis && (
                            <p className="text-gray-700 mb-3">
                              <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                            </p>
                          )}

                          {visit.notes && (
                            <p className="text-gray-600 mb-3">
                              <span className="font-medium">Notes:</span> {visit.notes}
                            </p>
                          )}

                          {/* Clinical Data Preview */}
                          {visit.clinical_data && (
                            <div className="bg-white rounded border p-3 mb-3">
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Clinical Assessment:</h5>
                              {renderClinicalData(visit.clinical_data, visit.department)}
                            </div>
                          )}

                          {/* Prescription */}
                          {visit.prescription && visit.prescription.length > 0 && (
                            <div className="bg-blue-50 rounded border border-blue-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-blue-800">Prescription:</h5>
                                <button
                                  onClick={() => {
                                    setSelectedVisit(visit);
                                    setIsPrinterOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                                >
                                  <Printer className="w-3 h-3" />
                                  Print
                                </button>
                              </div>
                              <div className="space-y-1">
                                {visit.prescription.map((item, idx) => (
                                  <div key={idx} className="text-sm text-blue-700">
                                    <span className="font-medium">{item.drug}</span>
                                    {item.dose && <span className="text-blue-600"> - {item.dose}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedVisit && (
        <PrescriptionPrinter
          patient={selectedPatient || null}
          prescriptions={selectedVisit.prescription || []}
          diagnosis={selectedVisit.diagnosis}
          notes={selectedVisit.notes}
          isOpen={isPrinterOpen}
          onClose={() => {
            setIsPrinterOpen(false);
            setSelectedVisit(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientMasterRecord;