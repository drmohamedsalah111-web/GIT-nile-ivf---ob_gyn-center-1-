import React, { useMemo, useEffect, useState } from 'react';
import { Beaker, CheckCircle, Clock, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { labService, LabRequest, LabRequestItem, LabResult, LabTest } from '../../services/labService';

const QUICK_PACKAGES: Record<string, string[]> = {
  'IVF Workup': ['FSH', 'LH', 'E2', 'AMH', 'TSH', 'Prolactin'],
  'Antenatal Profile': ['CBC', 'Blood Group', 'Fasting Blood Sugar', 'HIV', 'HBsAg', 'RPR'],
  'Hormone Panel': ['FSH', 'LH', 'E2', 'Progesterone', 'Prolactin', 'TSH'],
  'Full Chemistry': ['Fasting Blood Sugar', 'Urea', 'Creatinine', 'ALT', 'AST', 'Total Cholesterol']
};

interface Props {
  patientId?: string;
  patientName?: string;
  onRequestCreated?: (requestId: string) => void;
}

type LabRequestWithItems = LabRequest & { items?: LabRequestItem[] };

const LabOrderManager: React.FC<Props> = ({ patientId, patientName, onRequestCreated }) => {
  const [activeTab, setActiveTab] = useState<'order' | 'results'>('order');
  const [loading, setLoading] = useState(false);

  const [tests, setTests] = useState<LabTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [notes, setNotes] = useState('');

  const [requests, setRequests] = useState<LabRequestWithItems[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [savingResults, setSavingResults] = useState(false);
  const [resultsDraft, setResultsDraft] = useState<Record<string, { value: string; text: string; notes: string }>>({});
  const [requestResultsCache, setRequestResultsCache] = useState<Record<string, Record<string, LabResult>>>({});

  useEffect(() => {
    const run = async () => {
      try {
        const catalog = await labService.getTestsCatalog();
        setTests(catalog);
      } catch (error) {
        console.error('Failed to load lab catalog:', error);
        toast.error('فشل تحميل قائمة التحاليل');
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (!patientId) {
      setRequests([]);
      setExpandedRequestId(null);
      return;
    }
    loadRequests();
  }, [patientId]);

  const loadRequests = async () => {
    if (!patientId) return;
    try {
      const data = await labService.getPatientRequests(patientId);
      setRequests(data as any);
    } catch (error: any) {
      console.error('Failed to load requests:', error);
      toast.error(`فشل تحميل الطلبات: ${error?.message || 'خطأ غير معروف'}`);
    }
  };

  const filteredTests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [tests, searchTerm]);

  const groupedTests = useMemo(() => {
    return filteredTests.reduce((acc, test) => {
      if (!acc[test.category]) acc[test.category] = [];
      acc[test.category].push(test);
      return acc;
    }, {} as Record<string, LabTest[]>);
  }, [filteredTests]);

  const addTest = (test: LabTest) => {
    setSelectedTests((prev) => (prev.some((t) => t.id === test.id) ? prev : [...prev, test]));
  };

  const removeTest = (testId: string) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== testId));
  };

  const addQuickPackage = (packageName: string) => {
    const names = QUICK_PACKAGES[packageName] || [];
    const packageTests = tests.filter((t) => names.some((n) => t.name.includes(n)));
    setSelectedTests((prev) => {
      const next = [...prev];
      for (const t of packageTests) {
        if (!next.some((x) => x.id === t.id)) next.push(t);
      }
      return next;
    });
  };

  const submitRequest = async () => {
    if (!patientId) {
      toast.error('اختر مريضة أولاً');
      return;
    }
    if (selectedTests.length === 0) {
      toast.error('اختر تحليلًا واحدًا على الأقل');
      return;
    }

    setLoading(true);
    try {
      const requestId = await labService.createRequest(
        patientId,
        selectedTests.map((t) => t.id),
        notes
      );
      toast.success('تم إنشاء طلب التحاليل بنجاح');
      setSelectedTests([]);
      setNotes('');
      onRequestCreated?.(requestId);
      await loadRequests();
      setActiveTab('results');
    } catch (error: any) {
      console.error('Failed to create request:', error);
      toast.error(`فشل إنشاء الطلب: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  const getDraft = (itemId: string) => resultsDraft[itemId] || { value: '', text: '', notes: '' };

  const setDraft = (itemId: string, patch: Partial<{ value: string; text: string; notes: string }>) => {
    setResultsDraft((prev) => ({ ...prev, [itemId]: { ...getDraft(itemId), ...patch } }));
  };

  const computeAbnormal = (item: LabRequestItem, valueText: string) => {
    const num = Number(valueText);
    if (!isFinite(num)) return { isAbnormal: false as const, abnormalType: undefined as any };
    const min = item.referenceRangeMin;
    const max = item.referenceRangeMax;
    if (typeof min === 'number' && num < min) return { isAbnormal: true as const, abnormalType: 'Low' as const };
    if (typeof max === 'number' && num > max) return { isAbnormal: true as const, abnormalType: 'High' as const };
    return { isAbnormal: false as const, abnormalType: undefined as any };
  };

  const fetchRequestResults = async (requestId: string) => {
    if (requestResultsCache[requestId]) return;
    try {
      const results = await labService.getResults(requestId);
      const map: Record<string, LabResult> = {};
      for (const r of results) map[r.requestItemId] = r;
      setRequestResultsCache((prev) => ({ ...prev, [requestId]: map }));
      setResultsDraft((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (!next[r.requestItemId]) {
            next[r.requestItemId] = {
              value: r.resultValue !== undefined && r.resultValue !== null ? String(r.resultValue) : '',
              text: r.resultText || '',
              notes: r.notes || ''
            };
          }
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  };

  const saveItemResult = async (requestId: string, item: LabRequestItem) => {
    const draft = getDraft(item.id);
    const valueText = draft.value.trim();
    const text = draft.text.trim();

    if (!valueText && !text) {
      throw new Error('أدخل قيمة أو نص النتيجة أولاً');
    }

    const abnormal = computeAbnormal(item, valueText);

    await labService.saveResult(item.id, {
      resultValue: valueText ? Number(valueText) : undefined,
      resultText: text ? text : undefined,
      resultDate: new Date().toISOString(),
      isAbnormal: abnormal.isAbnormal,
      abnormalType: abnormal.abnormalType,
      notes: draft.notes.trim() ? draft.notes.trim() : undefined
    });

    setRequestResultsCache((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [item.id]: {
          id: prev[requestId]?.[item.id]?.id || crypto.randomUUID(),
          requestItemId: item.id,
          resultValue: valueText ? Number(valueText) : undefined,
          resultText: text ? text : undefined,
          resultDate: new Date().toISOString(),
          isAbnormal: abnormal.isAbnormal,
          abnormalType: abnormal.abnormalType,
          notes: draft.notes.trim() ? draft.notes.trim() : undefined
        } as any
      }
    }));
  };

  const saveAllResultsForRequest = async (request: LabRequestWithItems) => {
    const items = request.items || [];
    if (items.length === 0) return;

    setSavingResults(true);
    try {
      for (const item of items) {
        const d = getDraft(item.id);
        if (!d.value.trim() && !d.text.trim()) continue;
        await saveItemResult(request.id, item);
      }
      await labService.updateRequestStatus(request.id, 'Completed');
      toast.success('تم حفظ النتائج وتحديث حالة الطلب');
      await loadRequests();
    } finally {
      setSavingResults(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" dir="rtl">
      <div className="border-b border-gray-200 p-4 flex items-center gap-3">
        <Beaker className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 font-[Tajawal]">إدارة التحاليل</h3>
        {patientName ? <span className="text-sm text-gray-500 mr-auto font-[Tajawal]">{patientName}</span> : null}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 py-3 font-medium text-center font-[Tajawal] ${activeTab === 'order' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          طلب تحليل ({selectedTests.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 font-medium text-center font-[Tajawal] ${activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          النتائج ({requests.length})
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'order' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2 font-[Tajawal]">باقات سريعة</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(QUICK_PACKAGES).map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => addQuickPackage(pkg)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {pkg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="ابحث عن تحليل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[Tajawal]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {Object.entries(groupedTests).map(([category, categoryTests]) => (
                <div key={category} className="border-b border-gray-200 last:border-b-0">
                  <div className="bg-gray-50 px-3 py-2 font-semibold text-sm text-gray-700">{category}</div>
                  {categoryTests.map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => addTest(test)}
                      className="w-full text-right px-3 py-2 hover:bg-blue-50 flex justify-between items-start border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{test.name}</div>
                        {test.referenceRangeText ? (
                          <div className="text-xs text-gray-500">{test.referenceRangeText}</div>
                        ) : null}
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded whitespace-nowrap">
                        {test.unit || '—'}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {selectedTests.length > 0 ? (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2 font-[Tajawal]">التحاليل المختارة:</h4>
                <div className="space-y-2">
                  {selectedTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{test.name}</div>
                        <div className="text-xs text-gray-500">{test.unit}</div>
                      </div>
                      <button onClick={() => removeTest(test.id)} className="text-red-600 hover:text-red-700 p-1" type="button">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2 font-[Tajawal]">ملاحظات الطلب</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: نزيف، متابعة، تاريخ آخر دورة..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 font-[Tajawal]"
              />
            </div>

            <button
              onClick={submitRequest}
              disabled={loading || selectedTests.length === 0 || !patientId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'جاري الإرسال...' : 'إنشاء طلب التحاليل'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-[Tajawal]">لا توجد طلبات تحاليل</div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {request.status === 'Completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className={`font-semibold font-[Tajawal] ${request.status === 'Completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                        {request.status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 font-[Tajawal]">
                      {new Date(request.requestDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    {(request.items || []).map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="font-medium text-gray-900">{item.testName}</div>
                        <div className="text-xs text-gray-500">
                          {item.testUnit || ''}
                          {item.referenceRangeText ? ` • المرجع: ${item.referenceRangeText}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>

                  {request.notes ? (
                    <div className="mt-2 text-sm text-gray-600 p-2 bg-amber-50 rounded font-[Tajawal]">
                      <strong>ملاحظات:</strong> {request.notes}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={async () => {
                        const next = expandedRequestId === request.id ? null : request.id;
                        setExpandedRequestId(next);
                        if (next) await fetchRequestResults(next);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium font-[Tajawal]"
                      type="button"
                    >
                      {expandedRequestId === request.id ? 'إخفاء إدخال النتائج' : 'إدخال النتائج'}
                    </button>
                    <button
                      onClick={() => saveAllResultsForRequest(request)}
                      disabled={savingResults || request.status === 'Completed'}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium flex items-center gap-2 font-[Tajawal]"
                      type="button"
                    >
                      <Save className="w-4 h-4" />
                      {savingResults ? 'جاري الحفظ...' : 'حفظ النتائج'}
                    </button>
                  </div>

                  {expandedRequestId === request.id ? (
                    <div className="mt-4 border-t pt-4 space-y-3">
                      {(request.items || []).map((item) => {
                        const draft = getDraft(item.id);
                        const abnormal = computeAbnormal(item, draft.value.trim());
                        const highlight = abnormal.isAbnormal ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white';
                        const saved = !!requestResultsCache[request.id]?.[item.id];

                        return (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900">{item.testName}</div>
                                <div className="text-xs text-gray-500">
                                  {item.testUnit || ''}
                                  {item.referenceRangeText ? ` • المرجع: ${item.referenceRangeText}` : ''}
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded border ${saved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {saved ? 'محفوظ' : 'بدون نتيجة'}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 font-[Tajawal]">قيمة رقمية</label>
                                <input
                                  type="number"
                                  value={draft.value}
                                  onChange={(e) => setDraft(item.id, { value: e.target.value })}
                                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${highlight}`}
                                  placeholder="مثال: 3.2"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 font-[Tajawal]">نتيجة نصية</label>
                                <input
                                  type="text"
                                  value={draft.text}
                                  onChange={(e) => setDraft(item.id, { text: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="مثال: Negative"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 font-[Tajawal]">ملاحظات</label>
                                <input
                                  type="text"
                                  value={draft.notes}
                                  onChange={(e) => setDraft(item.id, { notes: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="اختياري"
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={async () => {
                                  try {
                                    setSavingResults(true);
                                    await saveItemResult(request.id, item);
                                    toast.success('تم حفظ النتيجة');
                                  } catch (e: any) {
                                    toast.error(`فشل حفظ النتيجة: ${e?.message || 'خطأ غير معروف'}`);
                                  } finally {
                                    setSavingResults(false);
                                  }
                                }}
                                disabled={savingResults}
                                className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white text-sm font-medium flex items-center gap-2 font-[Tajawal]"
                                type="button"
                              >
                                <Save className="w-4 h-4" />
                                حفظ هذا التحليل
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabOrderManager;

