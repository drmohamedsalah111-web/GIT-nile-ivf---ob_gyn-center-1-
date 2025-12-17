import React, { useState, useEffect } from 'react';
import { Beaker, Plus, Trash2, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { labService, LabTest, LabRequest, LabRequestItem, LabResult } from '../../services/labService';
import toast from 'react-hot-toast';

const QUICK_PACKAGES = {
  'IVF Workup': ['FSH', 'LH', 'E2', 'AMH', 'TSH', 'Prolactin'],
  'Antenatal Profile': ['CBC', 'Blood Group', 'RBS', 'HIV', 'Hepatitis B', 'RPR'],
  'Hormone Panel': ['FSH', 'LH', 'E2', 'Progesterone', 'Prolactin', 'TSH'],
  'Full Chemistry': ['FBS', 'Urea', 'Creatinine', 'Sodium', 'Potassium', 'Calcium', 'Total Protein']
};

interface Props {
  patientId?: string;
  patientName?: string;
  onRequestCreated?: (requestId: string) => void;
}

const LabOrderManager: React.FC<Props> = ({ patientId, patientName, onRequestCreated }) => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'results'>('order');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTests();
    if (patientId) loadRequests();
  }, [patientId]);

  const loadTests = async () => {
    try {
      const catalog = await labService.getTestsCatalog();
      setTests(catalog);
    } catch (err) {
      console.error('Failed to load lab tests:', err);
      toast.error('فشل تحميل قائمة التحاليل');
    }
  };

  const loadRequests = async () => {
    if (!patientId) return;
    try {
      const data = await labService.getPatientRequests(patientId);
      setRequests(data as any);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const addTest = (test: LabTest) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const addQuickPackage = (packageName: string) => {
    const packageTestNames = QUICK_PACKAGES[packageName as keyof typeof QUICK_PACKAGES];
    const packageTests = tests.filter(t => 
      packageTestNames.some(name => t.name.includes(name))
    );
    
    const newTests = packageTests.filter(pt => 
      !selectedTests.find(st => st.id === pt.id)
    );
    setSelectedTests([...selectedTests, ...newTests]);
  };

  const submitRequest = async () => {
    if (!patientId) {
      toast.error('اختر مريضة أولاً');
      return;
    }
    
    if (selectedTests.length === 0) {
      toast.error('اختر تحليل واحد على الأقل');
      return;
    }

    setLoading(true);
    try {
      const requestId = await labService.createRequest(
        patientId,
        selectedTests.map(t => t.id),
        notes
      );
      
      toast.success('تم إضافة طلب التحليل بنجاح');
      setSelectedTests([]);
      setNotes('');
      onRequestCreated?.(requestId);
      loadRequests();
    } catch (err: any) {
      console.error('Failed to create request:', err);
      toast.error(`فشل إنشاء الطلب: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTests = filteredTests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, LabTest[]>);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 p-4 flex items-center gap-3">
        <Beaker className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">إدارة التحاليل</h3>
        {patientName && <span className="text-sm text-gray-500 ml-auto">{patientName}</span>}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 py-3 font-medium text-center ${
            activeTab === 'order'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          طلب تحليل ({selectedTests.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 font-medium text-center ${
            activeTab === 'results'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          النتائج ({requests.length})
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'order' ? (
          <div className="space-y-4">
            {/* Quick Packages */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                حزم سريعة
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(QUICK_PACKAGES).map(pkg => (
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

            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="ابحث عن تحليل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tests List */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {Object.entries(groupedTests).map(([category, categoryTests]) => (
                <div key={category} className="border-b border-gray-200 last:border-b-0">
                  <div className="bg-gray-50 px-3 py-2 font-semibold text-sm text-gray-700">
                    {category}
                  </div>
                  {categoryTests.map(test => (
                    <div
                      key={test.id}
                      onClick={() => addTest(test)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-start border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{test.name}</div>
                        {test.referenceRangeText && (
                          <div className="text-xs text-gray-500">{test.referenceRangeText}</div>
                        )}
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {test.unit || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Selected Tests */}
            {selectedTests.length > 0 && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2">التحاليل المختارة:</h4>
                <div className="space-y-2">
                  {selectedTests.map(test => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between bg-white p-2 rounded border border-blue-200"
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900">{test.name}</div>
                        <div className="text-xs text-gray-500">{test.unit}</div>
                      </div>
                      <button
                        onClick={() => removeTest(test.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                ملاحظات سريرية
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: قبل العلاج..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={submitRequest}
              disabled={loading || selectedTests.length === 0 || !patientId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'جاري الإرسال...' : 'إرسال طلب التحليل'}
            </button>
          </div>
        ) : (
          // Results Tab
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات تحليل
              </div>
            ) : (
              requests.map((request: any) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {request.status === 'Completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className={`font-semibold ${
                        request.status === 'Completed' 
                          ? 'text-green-700' 
                          : 'text-yellow-700'
                      }`}>
                        {request.status === 'Completed' ? 'مكتملة' : 'قيد الانتظار'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(request.requestDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    {request.items?.map((item: LabRequestItem) => (
                      <div key={item.id} className="text-sm">
                        <div className="font-medium text-gray-900">
                          {item.testName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.testUnit}
                        </div>
                      </div>
                    ))}
                  </div>

                  {request.notes && (
                    <div className="mt-2 text-sm text-gray-600 p-2 bg-amber-50 rounded">
                      <strong>ملاحظات:</strong> {request.notes}
                    </div>
                  )}
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
