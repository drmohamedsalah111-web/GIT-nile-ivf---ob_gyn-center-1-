import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Microscope,
  Plus,
  Save,
  X
} from 'lucide-react';
import { labService, LabRequest, LabResult } from '../services/labService';
import toast from 'react-hot-toast';

interface LabResultsEntryProps {
  patientId: string;
  refreshTrigger?: number;
}

const LabResultsEntry: React.FC<LabResultsEntryProps> = ({
  patientId,
  refreshTrigger = 0
}) => {
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [enteredResults, setEnteredResults] = useState<Record<string, Partial<LabResult>>>({});

  useEffect(() => {
    fetchLabRequests();
  }, [patientId, refreshTrigger]);

  const fetchLabRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await labService.getPatientRequests(patientId);
      setLabRequests(requests);
      
      if (requests.length > 0) {
        setSelectedRequestId(requests[0].id);
        fetchResults(requests[0].id);
      }
    } catch (error) {
      console.error('Error fetching lab requests:', error);
      toast.error('Failed to load lab requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async (requestId: string) => {
    try {
      const res = await labService.getResults(requestId);
      setResults(res);
      
      const resultMap: Record<string, Partial<LabResult>> = {};
      res.forEach(r => {
        resultMap[r.requestItemId] = r;
      });
      setEnteredResults(resultMap);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    }
  };

  const handleRequestChange = (requestId: string) => {
    setSelectedRequestId(requestId);
    fetchResults(requestId);
  };

  const handleResultChange = (testItemId: string, field: string, value: any) => {
    setEnteredResults(prev => ({
      ...prev,
      [testItemId]: {
        ...prev[testItemId],
        [field]: value
      }
    }));
  };

  const handleSaveResult = async (testItemId: string) => {
    const resultData = enteredResults[testItemId];
    
    if (!resultData || (!resultData.resultValue && !resultData.resultText)) {
      toast.error('Please enter a result value');
      return;
    }

    try {
      await labService.saveResult(testItemId, {
        resultValue: resultData.resultValue,
        resultText: resultData.resultText,
        isAbnormal: resultData.isAbnormal || false,
        abnormalType: resultData.abnormalType as any,
        interpretation: resultData.interpretation,
        notes: resultData.notes
      });

      toast.success('Result saved successfully');
      if (selectedRequestId) {
        fetchResults(selectedRequestId);
      }
      setExpandedTestId(null);
    } catch (error) {
      console.error('Error saving result:', error);
      toast.error('Failed to save result');
    }
  };

  const getAbnormalityColor = (abnormalType?: string) => {
    if (!abnormalType) return 'bg-green-100 text-green-800 border-green-300';
    if (abnormalType === 'Critical') return 'bg-red-100 text-red-800 border-red-300';
    if (abnormalType === 'High') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (abnormalType === 'Low') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const isValueAbnormal = (value?: number, min?: number, max?: number) => {
    if (!value || min === undefined || max === undefined) return false;
    return value < min || value > max;
  };

  const selectedRequest = labRequests.find(r => r.id === selectedRequestId);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading lab requests...</div>;
  }

  if (labRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Microscope className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No lab requests found for this patient</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Lab Request
        </label>
        <select
          value={selectedRequestId || ''}
          onChange={(e) => handleRequestChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          {labRequests.map(req => (
            <option key={req.id} value={req.id}>
              {new Date(req.requestDate).toLocaleDateString()} - {req.status} ({req.items?.length || 0} tests)
            </option>
          ))}
        </select>
      </div>

      {selectedRequest && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Tests & Results ({selectedRequest.items?.length || 0})
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                selectedRequest.status === 'Completed'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-300'
              }`}
            >
              {selectedRequest.status}
            </span>
          </div>

          {selectedRequest.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Clinical Indication:</strong> {selectedRequest.notes}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {selectedRequest.items?.map((testItem: any) => {
              const existingResult = enteredResults[testItem.id];
              const hasResult = !!existingResult?.resultValue || !!existingResult?.resultText;
              const isExpanded = expandedTestId === testItem.id;
              const isAbnormal = isValueAbnormal(
                existingResult?.resultValue,
                testItem.referenceRangeMin,
                testItem.referenceRangeMax
              );

              return (
                <div
                  key={testItem.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                >
                  <button
                    onClick={() =>
                      setExpandedTestId(isExpanded ? null : testItem.id)
                    }
                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3 text-left flex-1">
                      {hasResult ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{testItem.testName}</p>
                        <p className="text-xs text-gray-500">
                          {testItem.testUnit || 'N/A'}
                          {testItem.referenceRangeText &&
                            ` • Normal: ${testItem.referenceRangeText}`}
                        </p>
                      </div>
                    </div>

                    {hasResult && (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`font-semibold ${isAbnormal ? 'text-orange-600' : 'text-green-600'}`}>
                            {existingResult.resultValue || existingResult.resultText}
                          </p>
                          {isAbnormal && (
                            <p className="text-xs text-orange-600">Abnormal</p>
                          )}
                        </div>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-200 p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Result Value
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter numeric result"
                              value={existingResult?.resultValue || ''}
                              onChange={(e) =>
                                handleResultChange(
                                  testItem.id,
                                  'resultValue',
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              or Text Result
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Positive, Negative"
                              value={existingResult?.resultText || ''}
                              onChange={(e) =>
                                handleResultChange(
                                  testItem.id,
                                  'resultText',
                                  e.target.value || undefined
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>

                        {testItem.referenceRangeMin && testItem.referenceRangeMax && (
                          <div className="bg-white rounded p-2 border border-gray-200">
                            <p className="text-xs text-gray-600">
                              <strong>Reference Range:</strong>{' '}
                              {testItem.referenceRangeMin} - {testItem.referenceRangeMax}{' '}
                              {testItem.testUnit || ''}
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Abnormal Status
                          </label>
                          <select
                            value={existingResult?.abnormalType || 'Normal'}
                            onChange={(e) =>
                              handleResultChange(
                                testItem.id,
                                'abnormalType',
                                e.target.value === 'Normal' ? undefined : e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="Normal">Normal</option>
                            <option value="Low">Low</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Interpretation / Comments
                          </label>
                          <textarea
                            placeholder="e.g., Within normal limits, Slightly elevated..."
                            value={existingResult?.interpretation || ''}
                            onChange={(e) =>
                              handleResultChange(
                                testItem.id,
                                'interpretation',
                                e.target.value || undefined
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Internal Notes
                          </label>
                          <input
                            type="text"
                            placeholder="For your reference only"
                            value={existingResult?.notes || ''}
                            onChange={(e) =>
                              handleResultChange(
                                testItem.id,
                                'notes',
                                e.target.value || undefined
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveResult(testItem.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                          >
                            <Save className="w-4 h-4" />
                            Save Result
                          </button>
                          <button
                            onClick={() => setExpandedTestId(null)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabResultsEntry;
