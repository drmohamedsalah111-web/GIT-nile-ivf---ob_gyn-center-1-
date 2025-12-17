import React, { useEffect, useMemo, useState } from 'react';
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

  const headerTitle = useMemo(() => {
    const section =
      category === 'GYNA'
        ? 'أمراض النساء'
        : category === 'OBS'
          ? 'متابعة الحمل'
          : category === 'IVF'
            ? 'تأخر الإنجاب / IVF'
            : 'كل الأقسام';
    return `السجل السابق - ${section}`;
  }, [category]);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const allVisits = await visitsService.getVisitsByPatient(patientId);
        const filteredVisits =
          category === 'ALL'
            ? allVisits
            : allVisits.filter((visit) => {
                const dept = String(visit.department || '').trim();
                const deptUpper = dept.toUpperCase();

                if (category === 'IVF') return deptUpper.startsWith('IVF');
                if (category === 'OBS') return deptUpper === 'OBS' || deptUpper.startsWith('OBS') || deptUpper === 'OBSTETRICS';
                if (category === 'GYNA') {
                  return (
                    deptUpper === 'GYNA' ||
                    deptUpper === 'GYN' ||
                    deptUpper === 'GENERAL' ||
                    deptUpper === 'VISIT' ||
                    deptUpper === ''
                  );
                }
                return deptUpper === category;
              });
        setVisits(filteredVisits);
      } catch (error) {
        console.error('Error fetching history:', error);
        setVisits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, patientId, category]);

  const toggleExpanded = (visitId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(visitId)) next.delete(visitId); else next.add(visitId);
      return next;
    });
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
          <div className="text-sm font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
            {diagnosis || 'التشخيص'}
          </div>
          <div className="text-xs text-gray-600">
            {clinical_data?.complaint || 'الشكوى'}
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
          <div className="text-sm font-medium text-green-700">
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
        {diagnosis || 'زيارة'}
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
        <div className="flex flex-col h-full" dir="rtl">
          <div className="flex items-center justify-between p-4 border-b bg-teal-50">
            <h2 className="text-lg font-bold text-gray-900 font-[Tajawal]">{headerTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close"
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
              <div className="text-center py-8 text-gray-500 font-[Tajawal]">
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
                            className="p-1 text-teal-700 hover:bg-teal-100 rounded transition-colors"
                            title="نسخ البيانات"
                            aria-label="Copy data"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        {onCopyRx && visit.prescription?.length > 0 && (
                          <button
                            onClick={() => onCopyRx(visit.prescription || [])}
                            className="p-1 text-teal-700 hover:bg-teal-100 rounded transition-colors"
                            title="نسخ الروشتة"
                            aria-label="Copy prescription"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpanded(visit.id)}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Toggle details"
                      >
                        {expandedItems.has(visit.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {expandedItems.has(visit.id) && (
                      <div className="p-3 bg-white">
                        {visit.notes && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1 font-[Tajawal]">الملاحظات:</h4>
                            <p className="text-sm text-gray-700 font-[Tajawal] whitespace-pre-line">{visit.notes}</p>
                          </div>
                        )}

                        {visit.prescription && visit.prescription.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1 font-[Tajawal]">الروشتة:</h4>
                            <div className="space-y-1">
                              {visit.prescription.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                  {item.drug} - {item.dose}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!visit.notes && (!visit.prescription || visit.prescription.length === 0) && (
                          <div className="text-sm text-gray-500 font-[Tajawal]">لا توجد تفاصيل إضافية</div>
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
