import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  User,
  Heart,
  Baby,
  TestTube,
  Download,
  Image as ImageIcon,
  Printer,
  X
} from 'lucide-react';
import { usePatients } from '../src/hooks/usePatients';
import { Patient } from '../types';
import { supabase } from '../services/supabaseClient';
import { ivfService } from '../services/ivfService';
import toast from 'react-hot-toast';
import PrescriptionPrinter from '../components/PrescriptionPrinter';
import ClinicalDataDisplay from './components/ClinicalDataDisplay';

interface HistoryItem {
  id: string;
  date: string;
  type: 'Visit' | 'Pregnancy' | 'IVF';
  department?: string;
  diagnosis: string;
  summary: string;
  clinical_data?: any;
  prescription?: any[];
  notes?: string;
}

const PatientMasterRecord: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<HistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Visit' | 'Pregnancy' | 'IVF'>('All');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<HistoryItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const { patients: powerSyncPatients } = usePatients();

  const patients: Patient[] = powerSyncPatients.map((p: any) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    phone: p.phone,
    husbandName: p.husband_name,
    history: p.history,
    createdAt: p.created_at
  }));

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId);
      fetchPatientFiles(selectedPatientId);
    } else {
      setHistory([]);
      setPatientFiles([]);
    }
  }, [selectedPatientId]);

  const fetchPatientHistory = async (pId: string) => {
    setIsLoading(true);
    try {
      const data = await ivfService.getPatientFullHistory(pId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load patient history');
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

      if (error) throw error;
      setPatientFiles(data || []);
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
      default: return <ClinicalDataDisplay data={data} department={department} />;
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

  const getFilteredHistory = () => {
    if (selectedFilter === 'All') return history;
    return history.filter(h => h.type === selectedFilter);
  };

  const handleSelectDetail = (item: HistoryItem, isExpanded: boolean) => {
    setExpandedVisitId(isExpanded ? null : item.id);
    setSelectedDetail(isExpanded ? null : item);
  };

  const getRelatedHistory = (item: HistoryItem | null) => {
    if (!item) return [];
    const filtered = item.department
      ? history.filter(h => h.department === item.department)
      : history.filter(h => h.type === item.type);
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const filteredHistory = getFilteredHistory();
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
              <th>Type</th>
              <th>Summary</th>
            </tr>
            ${filteredHistory.map(h => `<tr><td style="padding: 8px;">${formatDate(h.date)}</td><td>${h.type}</td><td>${h.summary || 'N/A'}</td></tr>`).join('')}
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
                className={`py-4 px-4 font-semibold border-b-2 transition ${activeTab === 'timeline'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600'
                  }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-4 px-4 font-semibold border-b-2 transition ${activeTab === 'gallery'
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
                    {(['All', 'Visit', 'Pregnancy', 'IVF'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setSelectedFilter(f)}
                        className={`px-4 py-2 rounded-full font-medium transition ${selectedFilter === f
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading history...</div>
                  ) : getFilteredHistory().length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 overflow-x-auto border border-gray-100 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Summary / Diagnosis</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {getFilteredHistory().map((h) => {
                              const colors = getDepartmentColor(h.department);
                              const isExpanded = expandedVisitId === h.id;

                              return (
                                <React.Fragment key={h.id}>
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(h.date)}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {getDepartmentIcon(h.department)}
                                        <div>
                                          <div className="text-sm font-semibold text-gray-900">{h.type}</div>
                                          <div className="text-xs text-gray-500">{getDepartmentName(h.department)}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{h.summary || h.diagnosis || 'No summary'}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.border}`}>
                                        {h.department || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      <button
                                        onClick={() => handleSelectDetail(h, isExpanded)}
                                        className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                                      >
                                        <FileText className="w-4 h-4" />
                                        {isExpanded ? 'Hide' : 'View'} Details
                                      </button>
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={5} className="bg-gray-50 px-6 pb-6 pt-3">
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="bg-white rounded border border-gray-200 p-4">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">Clinical Data</p>
                                            {h.type === 'Visit' ? renderClinicalData(h.clinical_data, h.department) : (
                                              <div className="text-sm text-gray-700">
                                                <pre className="whitespace-pre-wrap">{JSON.stringify(h.clinical_data, null, 2)}</pre>
                                              </div>
                                            )}
                                          </div>
                                          {(h.notes || (h.prescription && h.prescription.length > 0)) && (
                                            <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
                                              {h.notes && (
                                                <div>
                                                  <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                                                  <p className="text-sm text-gray-700 italic">{h.notes}</p>
                                                </div>
                                              )}
                                              {h.prescription && h.prescription.length > 0 && (
                                                <button
                                                  onClick={() => {
                                                    setSelectedVisit(h);
                                                    setIsPrinterOpen(true);
                                                  }}
                                                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                                                >
                                                  <Printer className="w-4 h-4" />
                                                  Print Prescription
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:col-span-1">
                        <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs uppercase text-gray-500 font-semibold">تفاصيل الحدث</p>
                              <h3 className="text-lg font-bold text-gray-900">التاريخ الطبي المسجل</h3>
                            </div>
                          </div>
                          {selectedDetail ? (
                            <>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  {getDepartmentIcon(selectedDetail.department)}
                                  <div>
                                    <p className="text-sm text-gray-500">{formatDate(selectedDetail.date)}</p>
                                    <p className="text-lg font-semibold text-gray-900">{selectedDetail.type}</p>
                                    <p className="text-xs text-gray-600">{getDepartmentName(selectedDetail.department)}</p>
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">الملخص / التشخيص</p>
                                  <p className="text-sm text-gray-800">{selectedDetail.summary || selectedDetail.diagnosis || 'No summary'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">البيانات المسجلة</p>
                                  {selectedDetail.type === 'Visit'
                                    ? renderClinicalData(selectedDetail.clinical_data, selectedDetail.department)
                                    : (
                                      <div className="text-sm text-gray-700">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedDetail.clinical_data, null, 2)}</pre>
                                      </div>
                                    )}
                                </div>
                                {selectedDetail.notes && (
                                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <p className="text-xs uppercase text-gray-500 font-semibold mb-1">الملاحظات</p>
                                    <p className="text-sm text-gray-800 italic">{selectedDetail.notes}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-6 border-t pt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs uppercase text-gray-500 font-semibold">سجل هذا القسم</p>
                                  <span className="text-xs text-gray-600">({getRelatedHistory(selectedDetail).length})</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                                  {getRelatedHistory(selectedDetail).map((event) => (
                                    <div
                                      key={event.id}
                                      className={`p-3 rounded-lg border ${event.id === selectedDetail.id ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                                          <p className="text-sm font-semibold text-gray-900">{event.summary || event.diagnosis || 'No summary'}</p>
                                        </div>
                                        {event.id !== selectedDetail.id && (
                                          <button
                                            onClick={() => handleSelectDetail(event, false)}
                                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                                          >
                                            عرض
                                          </button>
                                        )}
                                      </div>
                                      {event.notes && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              اختر حدثًا من الجدول لعرض التفاصيل الكاملة المسجلة مسبقًا.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      No history events found for this filter
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
                                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                    <img src={f.file_url} alt={f.name || 'File'} className="w-full h-full object-cover rounded" />
                                  </div>
                                  <p className="text-xs text-gray-600 p-2 truncate">{f.file_name || 'File'}</p>
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
                              <h3 className="text-lg font-semibold">{selectedImage.file_name || 'File'}</h3>
                              <button onClick={() => setSelectedImage(null)} className="text-gray-600 hover:text-gray-900">
                                <X className="w-6 h-6" />
                              </button>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-4 min-h-96 flex items-center justify-center">
                              <img src={selectedImage.file_url} alt={selectedImage.file_name || 'File'} className="max-w-full max-h-full object-contain" />
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
