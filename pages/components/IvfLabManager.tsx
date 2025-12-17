import React, { useState, useEffect } from 'react';
import { Beaker, Plus, Trash2, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { labService, LabTest, LabRequest } from '../../services/labService';
import toast from 'react-hot-toast';

const IVF_PHASE_PACKAGES = {
  'Assessment Phase': {
    description: 'Initial hormonal assessment (Day 3-5 FSH)',
    tests: ['FSH', 'LH', 'E2 (Estradiol)', 'Prolactin', 'TSH', 'AMH'],
    color: 'blue'
  },
  'Stimulation Monitoring': {
    description: 'Daily monitoring during stimulation',
    tests: ['E2 (Estradiol)', 'LH', 'Progesterone'],
    color: 'amber'
  },
  'Trigger Decision': {
    description: 'Pre-trigger hormonal levels',
    tests: ['E2 (Estradiol)', 'LH', 'Progesterone'],
    color: 'red'
  },
  'Post-OPU Baseline': {
    description: 'Baseline bloodwork before transfer',
    tests: ['CBC', 'Blood Group & Rh', 'Fasting Blood Sugar'],
    color: 'green'
  },
  'Post-Transfer Beta': {
    description: 'Beta hCG confirmation test',
    tests: ['Beta hCG', 'Progesterone'],
    color: 'purple'
  },
  'Full Fertility Panel': {
    description: 'Comprehensive initial workup',
    tests: ['FSH', 'LH', 'E2', 'Prolactin', 'TSH', 'AMH'],
    color: 'indigo'
  }
};

interface Props {
  patientId?: string;
  patientName?: string;
  cycleStatus?: 'Assessment' | 'Active' | 'PickUp' | 'Transfer' | 'Done';
  protocol?: string;
  stimulationDay?: number;
  onRequestCreated?: (requestId: string) => void;
}

const IvfLabManager: React.FC<Props> = ({
  patientId,
  patientName,
  cycleStatus = 'Assessment',
  protocol = 'Antagonist',
  stimulationDay = 0,
  onRequestCreated
}) => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendedPackage, setRecommendedPackage] = useState<string>('');

  useEffect(() => {
    loadTests();
    if (patientId) loadRequests();
    updateRecommendedPackage();
  }, [patientId, cycleStatus, stimulationDay]);

  const updateRecommendedPackage = () => {
    if (cycleStatus === 'Assessment') {
      setRecommendedPackage('Assessment Phase');
    } else if (cycleStatus === 'Active' && stimulationDay > 0 && stimulationDay < 8) {
      setRecommendedPackage('Stimulation Monitoring');
    } else if (cycleStatus === 'Active' && stimulationDay >= 8) {
      setRecommendedPackage('Trigger Decision');
    } else if (cycleStatus === 'PickUp') {
      setRecommendedPackage('Post-OPU Baseline');
    } else if (cycleStatus === 'Transfer') {
      setRecommendedPackage('Post-Transfer Beta');
    }
  };

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

  const addIVFPackage = (packageName: string) => {
    const config = (IVF_PHASE_PACKAGES as any)[packageName];
    if (!config) return;
    
    const packageTestNames = config.tests;
    const packageTests = tests.filter(t =>
      packageTestNames.some(name => t.name.includes(name))
    );

    const newTests = packageTests.filter(pt =>
      !selectedTests.find(st => st.id === pt.id)
    );
    setSelectedTests([...selectedTests, ...newTests]);
    toast.success(`Added ${packageName} tests`, { icon: '✅' });
  };

  const submitRequest = async () => {
    if (!patientId) {
      toast.error('اختر مريضة أولاً');
      return;
    }

    if (selectedTests.length === 0) {
      toast.error('اختر تحليلاً واحداً على الأقل');
      return;
    }

    setLoading(true);
    try {
      const clinicalNote = notes || `${cycleStatus} - Day ${stimulationDay}${protocol ? ` (${protocol})` : ''}`;
      const requestId = await labService.createRequest(
        patientId,
        selectedTests.map(t => t.id),
        clinicalNote
      );

      setSelectedTests([]);
      setNotes('');
      await loadRequests();
      onRequestCreated?.(requestId);
      toast.success('تم إرسال طلب التحاليل بنجاح');
    } catch (err) {
      console.error('Failed to submit request:', err);
      toast.error('فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackageColor = (color: string) => {
    const colors: any = {
      blue: 'bg-blue-50 border-blue-200',
      amber: 'bg-amber-50 border-amber-200',
      red: 'bg-red-50 border-red-200',
      green: 'bg-green-50 border-green-200',
      purple: 'bg-purple-50 border-purple-200',
      indigo: 'bg-indigo-50 border-indigo-200'
    };
    return colors[color] || 'bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">IVF Cycle Lab Management</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm mb-3">
          <div className="bg-white p-2 rounded border border-teal-100">
            <p className="text-gray-600">Current Phase</p>
            <p className="font-bold text-teal-600">{cycleStatus}</p>
          </div>
          <div className="bg-white p-2 rounded border border-teal-100">
            <p className="text-gray-600">Protocol</p>
            <p className="font-bold text-teal-600">{protocol}</p>
          </div>
          {cycleStatus === 'Active' && stimulationDay > 0 && (
            <div className="bg-white p-2 rounded border border-teal-100">
              <p className="text-gray-600">Stimulation Day</p>
              <p className="font-bold text-teal-600">Day {stimulationDay}</p>
            </div>
          )}
        </div>
        {recommendedPackage && (
          <div className="bg-white p-3 rounded border-l-4 border-teal-500">
            <p className="text-sm text-gray-600">
              💡 <strong>Recommended:</strong> {(IVF_PHASE_PACKAGES as any)[recommendedPackage].description}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Beaker className="w-4 h-4" /> IVF Phase-Specific Packages
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(IVF_PHASE_PACKAGES).map(([packageName, config]: any) => (
            <button
              key={packageName}
              onClick={() => addIVFPackage(packageName)}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${getPackageColor(config.color)} ${
                recommendedPackage === packageName ? 'border-current font-bold ring-2 ring-offset-2 ring-teal-400' : 'border-gray-200'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{packageName}</p>
              <p className="text-xs text-gray-600 mt-1">{config.description}</p>
              <p className="text-xs text-gray-500 mt-1">+{config.tests.length} tests</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Manual Test Selection</h4>
        <input
          type="text"
          placeholder="ابحث عن تحليل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-teal-500"
        />
        <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto mb-3">
          {filteredTests.map(test => (
            <button
              key={test.id}
              onClick={() => addTest(test)}
              disabled={selectedTests.some(t => t.id === test.id)}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50 text-left transition"
            >
              <p className="font-medium text-gray-900">{test.name}</p>
              <p className="text-xs text-gray-600">{test.category}</p>
              {test.unit && <p className="text-xs text-gray-500 mt-1">{test.unit}</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Selected Tests ({selectedTests.length})</h4>
        {selectedTests.length > 0 ? (
          <div className="space-y-2 mb-4">
            {selectedTests.map(test => (
              <div key={test.id} className="flex items-center justify-between bg-teal-50 p-3 rounded border border-teal-200">
                <div>
                  <p className="font-medium text-gray-900">{test.name}</p>
                  <p className="text-sm text-gray-600">{test.category}</p>
                </div>
                <button
                  onClick={() => removeTest(test.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No tests selected yet</p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Before trigger shot, Post-fertilization confirmation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            rows={2}
          />
        </div>

        <button
          onClick={submitRequest}
          disabled={loading || selectedTests.length === 0 || !patientId}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {loading ? 'جاري الإرسال...' : 'Submit IVF Lab Order'}
        </button>
      </div>

      {requests.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Lab Orders
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(req.requestDate).toLocaleDateString('ar-EG')}
                  </p>
                  <p className="text-xs text-gray-600">{req.notes || req.clinicalIndication || 'No notes'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(req.status)}
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    req.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IvfLabManager;
