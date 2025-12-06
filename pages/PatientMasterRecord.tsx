import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, Activity, Heart, Baby } from 'lucide-react';
import { Patient, Visit } from '../types';
import { supabase } from '../services/supabaseClient';
import { visitsService } from '../services/visitsService';
import toast from 'react-hot-toast';

const PatientMasterRecord: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      setVisits(data || []);
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
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Clinical Data:</h5>
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(visit.clinical_data, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Prescription */}
                          {visit.prescription && visit.prescription.length > 0 && (
                            <div className="bg-blue-50 rounded border border-blue-200 p-3">
                              <h5 className="text-sm font-medium text-blue-800 mb-2">Prescription:</h5>
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
    </div>
  );
};

export default PatientMasterRecord;