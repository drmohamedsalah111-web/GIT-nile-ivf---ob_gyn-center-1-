import React, { useState, useEffect } from 'react';
import { usePatients } from '../src/hooks/usePatients';
import { PregnancyProfile } from '../src/pages/Obstetrics/PregnancyProfile';
import SearchableSelect from '../components/ui/SearchableSelect';
import HistorySidebar from '../src/components/HistorySidebar';
import { BookOpen } from 'lucide-react';

const ObstetricsDashboard: React.FC = () => {
  const { patients } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id.toString());
    }
  }, [patients]);

  return (
    <div className="space-y-6 font-[Tajawal]" dir="rtl">
      {/* Patient Selection Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">اختر المريضة</label>
          <SearchableSelect
            options={patients.map(p => ({ value: p.id.toString(), label: p.name }))}
            value={selectedPatientId || ''}
            onChange={setSelectedPatientId}
            placeholder="ابحث عن مريضة..."
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showHistory ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={18} />
            <span>السجل المرضي</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {selectedPatientId ? (
            <PregnancyProfile patientId={selectedPatientId} />
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
              الرجاء اختيار مريضة لعرض ملف الحمل
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && selectedPatientId && (
          <div className="w-80 shrink-0">
            <HistorySidebar patientId={selectedPatientId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ObstetricsDashboard;

