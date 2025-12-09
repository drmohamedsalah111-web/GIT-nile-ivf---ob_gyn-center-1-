import React, { useState, useEffect } from 'react';
import {
  Calendar, FileText, User, Heart, Baby, TestTube, Download, ChevronDown, ChevronUp,
  X, Image as ImageIcon, Printer
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Patient, Visit } from '../types';
import { db } from '../src/db/localDB';
import { supabase } from '../services/supabaseClient';
import { visitsService } from '../services/visitsService';
import toast from 'react-hot-toast';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import RefreshButton from '../components/RefreshButton';

const PatientMasterRecord: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'GYNA' | 'OBS' | 'IVF'>('All');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const localPatients = useLiveQuery(async () => {
    return await db.patients.toArray();
  }, []) || [];

  const patients: Patient[] = localPatients.map((p: any) => ({
    id: p.id || p.remoteId,
    name: p.name,
    age: p.age,
    phone: p.phone,
    husbandName: p.husbandName || p.husband_name,
    history: p.history,
    createdAt: p.created_at || p.createdAt?.toString()
  }));

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientVisits(selectedPatientId);
      fetchPatientFiles(selectedPatientId);
    } else {
      setVisits([]);
      setPatientFiles([]);
    }
  }, [selectedPatientId]);

  const fetchPatientVisits = async (patientId: string) => {
    setIsLoading(true);
    try {
      // Get all visits from local DB and filter by patient (supports both local and remote IDs)
      const allVisits = await db.visits.toArray();
      const patientIdStr = String(patientId);
      
      const filteredVisits = allVisits.filter((v: any) => {
        return String(v.patient_id) === patientIdStr || 
               String(v.patientId) === patientIdStr;
      });

      const mappedData = (filteredVisits || []).map((visit: any) => ({
        id: String(visit.id || visit.remoteId || ''),
        patientId: visit.patient_id || visit.patientId,
        date: visit.date || visit.visit_date || new Date().toISOString(),
        department: visit.department || 'General',
        diagnosis: visit.diagnosis || '',
        prescription: visit.prescription || [],
        notes: visit.notes || '',
        clinical_data: visit.clinical_data
      }));
      
      setVisits(mappedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load patient visits');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientFiles = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        setPatientFiles([]);
      } else {
        setPatientFiles(data || []);
      }
    } catch (error) {
      console.error('Error fetching patient files:', error);
      setPatientFiles([]);
    }
  };

  const selectedPatient = patients.find(p => String(p.id) === selectedPatientId);

  const getDepartmentIcon = (department?: string) => {
    switch (department) {
      case 'GYNA': return <Heart className="w-6 h-6 text-pink-600" />;
      case 'OBS': return <Baby className="w-6 h-6 text-blue-600" />;
      case 'IVF_STIM': return <TestTube className="w-6 h-6 text-purple-600" />;
      case 'IVF_LAB': return <TestTube className="w-6 h-6 text-purple-600" />;
      default: return <FileText className="w-6 h-6 text-gray-600" />;
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

  const getDepartmentColor = (department?: string) => {
    switch (department) {
      case 'GYNA': return { bg: 'bg-pink-100', border: 'border-pink-300', dot: 'bg-pink-600' };
      case 'OBS': return { bg: 'bg-blue-100', border: 'border-blue-300', dot: 'bg-blue-600' };
      case 'IVF_STIM': return { bg: 'bg-purple-100', border: 'border-purple-300', dot: 'bg-purple-600' };
      case 'IVF_LAB': return { bg: 'bg-purple-100', border: 'border-purple-300', dot: 'bg-purple-600' };
      default: return { bg: 'bg-gray-100', border: 'border-gray-300', dot: 'bg-gray-600' };
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
      case 'GYNA': return renderGynecologyData(data);
      case 'OBS': return renderObstetricsData(data);
      case 'IVF_STIM': return renderIVFData(data);
      default: return <div className="text-sm text-gray-600"><pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre></div>;
    }
  };

  const renderGynecologyData = (data: any) => {
    const { assessment, diagnosis, procedureOrder, clinicalNotes } = data;
    return (
      <div className="space-y-3">
        {assessment?.complaints && assessment.complaints.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Complaints:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {assessment.complaints.map((complaint: string, idx: number) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{complaint}</span>
              ))}
            </div>
          </div>
        )}
        {diagnosis && <div><span className="font-medium text-green-700">Diagnosis:</span> {diagnosis}</div>}
        {procedureOrder && <div><span className="font-medium text-purple-700">Procedure:</span> {procedureOrder}</div>}
        {clinicalNotes && <div><span className="font-medium text-gray-700">Notes:</span> {clinicalNotes}</div>}
      </div>
    );
  };

  const renderObstetricsData = (data: any) => {
    const { gestationalAge, riskAssessment, currentStatus } = data;
    return (
      <div className="space-y-2">
        {gestationalAge && <div><span className="font-medium">GA:</span> {gestationalAge.weeks}w {gestationalAge.days}d</div>}
        {riskAssessment && <div><span className="font-medium">Risk:</span> {riskAssessment.level}</div>}
        {currentStatus && <div><span className="font-medium">Status:</span> {currentStatus}</div>}
      </div>
    );
  };

  const renderIVFData = (data: any) => {
    const { protocol, startDate, stimulationDays, latestHormones } = data;
    return (
      <div className="space-y-2">
        {protocol && <div><span className="font-medium">Protocol:</span> {protocol}</div>}
        {startDate && <div><span className="font-medium">Started:</span> {formatDate(startDate)}</div>}
        {stimulationDays && <div><span className="font-medium">Days:</span> {stimulationDays}</div>}
        {latestHormones?.e2 && <div><span className="font-medium">E2:</span> {latestHormones.e2} pg/mL</div>}
      </div>
    );
  };

  const getFilteredVisits = () => {
    if (selectedFilter === 'All') return visits;
    if (selectedFilter === 'IVF') return visits.filter(v => v.department?.startsWith('IVF'));
    return visits.filter(v => v.department === selectedFilter);
  };

  const groupFilesByDate = (files: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    files.forEach(file => {
      const date = new Date(file.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(file);
    });
    return grouped;
  };

  const generateMedicalReport = () => {
    const filteredVisits = getFilteredVisits();
    const html = `
      <html>
        <head><title>Medical Report - ${selectedPatient?.name}</title></head>
        <body style="font-family: Arial; margin: 20px;">
          <h1>Medical Report</h1>
          <p><strong>Patient:</strong> ${selectedPatient?.name}</p>
          <p><strong>Age:</strong> ${selectedPatient?.age}</p>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px;">Date</th>
              <th>Department</th>
              <th>Diagnosis</th>
            </tr>
            ${filteredVisits.map(v => `<tr><td style="padding: 8px;">${formatDate(v.date)}</td><td>${getDepartmentName(v.department)}</td><td>${v.diagnosis || 'N/A'}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 250);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Patient Master Record</h1>
            <p className="text-gray-600">Comprehensive Medical Timeline & Archive</p>
          </div>
          <RefreshButton onRefreshComplete={() => {
            if (selectedPatientId) {
              fetchPatientVisits(selectedPatientId);
              fetchPatientFiles(selectedPatientId);
            }
          }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Select Patient --</option>
            {patients.map(p => (<option key={p.id} value={p.id}>{p.name} - {p.phone}</option>))}
          </select>
        </div>

        {selectedPatient && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                  <p className="text-teal-100">Age: {selectedPatient.age} | ID: {String(selectedPatient.id).slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={generateMedicalReport}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                Report
              </button>
            </div>

            <div className="border-b border-gray-200 px-6 flex">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-4 font-semibold border-b-2 transition ${
                  activeTab === 'timeline'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-4 px-4 font-semibold border-b-2 transition ${
                  activeTab === 'gallery'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                <ImageIcon className="w-5 h-5 inline mr-2" />
                Media Gallery
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'timeline' && (
                <div>
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {(['All', 'GYNA', 'OBS', 'IVF'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setSelectedFilter(f)}
                        className={`px-4 py-2 rounded-full font-medium transition ${
                          selectedFilter === f
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {f === 'GYNA' ? '♥ Gynecology' : f === 'OBS' ? '👶 Obstetrics' : f === 'IVF' ? '🧬 IVF' : '📋 All'}
                      </button>
                    ))}
                  </div>

                  {getFilteredVisits().length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredVisits().map((v) => {
                        const colors = getDepartmentColor(v.department);
                        const isExpanded = expandedVisitId === v.id;

                        return (
                          <div key={v.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full ${colors.dot} border-4 border-white shadow-md`} />
                              <div className="w-1 bg-gray-300 flex-1 h-12" />
                            </div>

                            <div
                              className={`flex-1 ${colors.bg} border-2 ${colors.border} rounded-lg p-4 cursor-pointer transition hover:shadow-md`}
                              onClick={() => setExpandedVisitId(isExpanded ? null : v.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getDepartmentIcon(v.department)}
                                    <h3 className="font-semibold text-gray-900">{getDepartmentName(v.department)}</h3>
                                    <span className="text-xs text-gray-500">{formatDate(v.date)}</span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-700">{v.diagnosis || 'No diagnosis'}</p>
                                </div>
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </div>

                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-opacity-30">
                                  <div className="bg-white bg-opacity-60 p-3 rounded mb-3">
                                    {renderClinicalData(v.clinical_data, v.department)}
                                  </div>
                                  {v.notes && (
                                    <div className="mb-3">
                                      <p className="text-xs font-medium text-gray-600 mb-1">Notes:</p>
                                      <p className="text-sm text-gray-700 italic">{v.notes}</p>
                                    </div>
                                  )}
                                  {v.prescription && v.prescription.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVisit(v);
                                        setIsPrinterOpen(true);
                                      }}
                                      className="mt-3 flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                                    >
                                      <Printer className="w-4 h-4" />
                                      Print Prescription
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      No visits found for this filter
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'gallery' && (
                <div>
                  {patientFiles.length > 0 ? (
                    <div>
                      {Object.entries(groupFilesByDate(patientFiles)).map(([date, files]) => (
                        <div key={date} className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">{date}</h3>
                          <div className="grid grid-cols-4 gap-4">
                            {files.map(f => (
                              <div
                                key={f.id}
                                className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition"
                                onClick={() => setSelectedImage(f)}
                              >
                                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center group-hover:from-gray-300 group-hover:to-gray-400">
                                  <ImageIcon className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-xs text-gray-600 p-2 truncate">{f.name || 'File'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {selectedImage && (
                        <div
                          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                          onClick={() => setSelectedImage(null)}
                        >
                          <div
                            className="bg-white rounded-lg p-4 max-w-2xl w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">{selectedImage.name || 'File'}</h3>
                              <button onClick={() => setSelectedImage(null)} className="text-gray-600 hover:text-gray-900">
                                <X className="w-6 h-6" />
                              </button>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-4 min-h-96 flex items-center justify-center">
                              <ImageIcon className="w-16 h-16 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mt-4">{formatDate(selectedImage.created_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      No media files available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isPrinterOpen && selectedVisit && (
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
