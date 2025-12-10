import React, { useState, useEffect } from 'react';
import { X, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { visitsService } from '../../services/visitsService';
import { Visit } from '../../types';

interface HistorySidebarProps {
  patientId: string;
  category: 'GYNA' | 'OBS' | 'IVF' | 'ALL';
  isOpen: boolean;
  onClose: () => void;
  onCopyData?: (visit: Visit) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  patientId,
  category,
  isOpen,
  onClose,
  onCopyData
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
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedItems(newExpanded);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنوات`;
  };

  const getKeyDataSummary = (visit: Visit) => {
    if (visit.department === 'OBS' && visit.clinical_data) {
      const data = visit.clinical_data;
      const parts = [];
      if (data.systolic_bp && data.diastolic_bp) parts.push(`BP: ${data.systolic_bp}/${data.diastolic_bp}`);
      if (data.weight_kg) parts.push(`وزن: ${data.weight_kg}kg`);
      if (data.fundal_height_cm) parts.push(`ارتفاع الرحم: ${data.fundal_height_cm}cm`);
      return parts.join(' • ');
    }
    if (visit.department === 'IVF') {
      return visit.diagnosis;
    }
    return visit.diagnosis || 'زيارة طبية';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-teal-50">
            <h2 className="text-lg font-bold text-gray-900 font-[Tajawal]">
              📜 السجل السابق - {category === 'GYNA' ? 'طب النساء' : category === 'OBS' ? 'الحمل' : category === 'IVF' ? 'التلقيح الاصطناعي' : 'الكل'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
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
                    {/* Header */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 mb-1">
                            {getRelativeTime(visit.date)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            {getKeyDataSummary(visit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(visit.date).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
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
                          <button
                            onClick={() => toggleExpanded(visit.id)}
                            className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedItems.has(visit.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedItems.has(visit.id) && (
                      <div className="p-3 bg-white">
                        {visit.notes && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">ملاحظات:</h4>
                            <p className="text-sm text-gray-700">{visit.notes}</p>
                          </div>
                        )}

                        {visit.prescription && visit.prescription.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">الوصفة الطبية:</h4>
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