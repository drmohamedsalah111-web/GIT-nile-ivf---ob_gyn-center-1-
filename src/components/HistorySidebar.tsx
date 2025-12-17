import React, { useState, useEffect } from 'react';
import { X, Copy, ChevronDown, ChevronUp, Activity, Scale, Baby } from 'lucide-react';
import { visitsService } from '../../services/visitsService';
import { Visit, PrescriptionItem } from '../../types';

interface HistorySidebarProps {
  patientId: string;
  category: 'GYNA' | 'OBS' | 'IVF' | 'ALL';
  isOpen: boolean;
  onClose: () => void;
  onCopyData?: (visit: Visit) => void;
  onCopyRx?: (prescription: PrescriptionItem[]) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  patientId,
  category,
  isOpen,
  onClose,
  onCopyData,
  onCopyRx
}) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && patientId) {
      fetchHistory();
    }
  }, [isOpen, patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const allVisits = await visitsService.getVisitsByPatient(patientId);
      const filteredVisits = category === 'ALL'
        ? allVisits
        : category === 'IVF'
          ? allVisits.filter(visit => visit.department?.startsWith('IVF'))
          : allVisits.filter(visit => visit.department === category);
      setVisits(filteredVisits);
    } catch (error) {
      console.error('Error fetching history:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (visitId: string) => {
    const next = new Set(expandedItems);
    if (next.has(visitId)) next.delete(visitId); else next.add(visitId);
    setExpandedItems(next);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنة`;
  };

  const renderVisitSummary = (visit: Visit) => {
    const { department, clinical_data, diagnosis } = visit;

    if (department === 'OBS' && clinical_data) {
      const ga = clinical_data.gestational_age_weeks && clinical_data.gestational_age_days
        ? `${clinical_data.gestational_age_weeks}w+${clinical_data.gestational_age_days}d`
        : '-';
      const bp = clinical_data.systolic_bp && clinical_data.diastolic_bp
        ? `${clinical_data.systolic_bp}/${clinical_data.diastolic_bp}`
        : '-';
      const weight = clinical_data.weight_kg ? `${clinical_data.weight_kg}kg` : '-';

      const isBpAlert = clinical_data.systolic_bp && clinical_data.diastolic_bp &&
        (clinical_data.systolic_bp >= 140 || clinical_data.diastolic_bp >= 90);

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Baby size={14} className="text-blue-500" />
            <span className="font-medium">{ga}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className={`flex items-center gap-1 ${isBpAlert ? 'text-red-600' : 'text-gray-700'}`}>
              <Activity size={12} />
              <span>{bp}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-700">
              <Scale size={12} />
              <span>{weight}</span>
            </div>
          </div>
        </div>
      );
    }

    if (department === 'GYNA') {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
            {diagnosis || 'Diagnosis'}
          </div>
          <div className="text-xs text-gray-600">
            {clinical_data?.complaint || 'Complaint'}
          </div>
        </div>
      );
    }

    if (department?.startsWith('IVF')) {
      const protocol = clinical_data?.protocol || 'Protocol';
      const e2 = clinical_data?.e2 ? `${clinical_data.e2} pg/mL` : null;
      const follicleCount = clinical_data?.follicle_count ? `${clinical_data.follicle_count} follicles` : null;

      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-600">
            {protocol}
          </div>
          <div className="text-xs text-gray-600">
            {e2 || follicleCount || 'IVF Data'}
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600">
        {diagnosis || 'Medical Visit'}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-teal-50">
            <h2 className="text-lg font-bold text-gray-900 font-[Tajawal]">
              السجل السابق - {category === 'GYNA' ? 'طب النساء' : category === 'OBS' ? 'الحمل' : category === 'IVF' ? 'التلقيح الاصطناعي' : 'الكل'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : visits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد سجلات سابقة
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit) => (
                  <div key={visit.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-900">
                          {new Date(visit.date).toLocaleDateString('ar-EG')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getRelativeTime(visit.date)}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-100 border-b border-gray-200">
                      {renderVisitSummary(visit)}
                    </div>

                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {onCopyData && (
                          <button
                            onClick={() => onCopyData(visit)}
                            className="p-1 text-teal-600 hover:bg-teal-100 rounded transition-colors"
                            title="نسخ البيانات"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        {onCopyRx && visit.prescription?.length > 0 && (
                          <button
                            onClick={() => onCopyRx(visit.prescription || [])}
                            className="p-1 text-teal-600 hover:bg-teal-100 rounded transition-colors"
                            title="نسخ الوصفة"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpanded(visit.id)}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        {expandedItems.has(visit.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {expandedItems.has(visit.id) && (
                      <div className="p-3 bg-white">
                        {visit.notes && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">الملاحظات:</h4>
                            <p className="text-sm text-gray-700">{visit.notes}</p>
                          </div>
                        )}

                        {visit.prescription && visit.prescription.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">الوصفات:</h4>
                            <div className="space-y-1">
                              {visit.prescription.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                  {item.drug} - {item.dose}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {visit.clinical_data && Object.keys(visit.clinical_data).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">البيانات السريرية:</h4>
                            <div className="text-sm text-gray-700">
                              {Object.entries(visit.clinical_data).map(([key, value]) => (
                                <div key={key} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
