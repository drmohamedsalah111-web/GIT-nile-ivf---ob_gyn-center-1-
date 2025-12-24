import React, { useState, useEffect } from 'react';
import { Activity, Calendar, FileText, Image as ImageIcon, AlertCircle, Plus } from 'lucide-react';
import { format, differenceInWeeks, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { usePowerSyncQuery } from '../../hooks/usePowerSync';
import { PregnancyOverview } from '../../components/obstetrics/PregnancyOverview';
import { VisitsTable } from '../../components/obstetrics/VisitsTable';
import { UltrasoundGallery } from '../../components/obstetrics/UltrasoundGallery';
import { NewVisitModal } from '../../components/obstetrics/NewVisitModal';
import { NewPregnancyModal } from '../../components/obstetrics/NewPregnancyModal';

interface PregnancyProfileProps {
  patientId: string;
}

export const PregnancyProfile: React.FC<PregnancyProfileProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'gallery'>('overview');
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [isNewPregnancyModalOpen, setIsNewPregnancyModalOpen] = useState(false);

  // Fetch active pregnancy
  const { data: pregnancies, isLoading: isLoadingPregnancy } = usePowerSyncQuery(
    `SELECT * FROM pregnancies WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`,
    [patientId]
  );

  const pregnancy = pregnancies[0];

  // Fetch visits
  const { data: visits, isLoading: isLoadingVisits } = usePowerSyncQuery(
    `SELECT * FROM antenatal_visits WHERE pregnancy_id = ? ORDER BY visit_date DESC`,
    [pregnancy?.id || '']
  );

  // Fetch scans
  const { data: scans, isLoading: isLoadingScans } = usePowerSyncQuery(
    `SELECT * FROM biometry_scans WHERE pregnancy_id = ? ORDER BY scan_date DESC`,
    [pregnancy?.id || '']
  );

  // Fetch files
  const { data: files, isLoading: isLoadingFiles } = usePowerSyncQuery(
    `SELECT * FROM patient_files WHERE patient_id = ? AND file_type LIKE '%image%' ORDER BY created_at DESC`,
    [patientId]
  );

  if (isLoadingPregnancy) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  if (!pregnancy) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">لا يوجد حمل نشط</h3>
        <p className="text-gray-500 mt-2">قم ببدء متابعة حمل جديدة لهذا المريض</p>
        <button 
          onClick={() => setIsNewPregnancyModalOpen(true)}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          بدء متابعة حمل
        </button>
        <NewPregnancyModal
          isOpen={isNewPregnancyModalOpen}
          onClose={() => setIsNewPregnancyModalOpen(false)}
          patientId={patientId}
          onSuccess={() => {
            // PowerSync query will auto-update
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-[Tajawal]" dir="rtl">
      {/* Header Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-1">
        <div className="flex space-x-1 space-x-reverse">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Activity size={20} />
            <span>نظرة عامة</span>
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'visits'
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar size={20} />
            <span>الزيارات والمتابعة</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'gallery'
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ImageIcon size={20} />
            <span>معرض السونار</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <PregnancyOverview 
            pregnancy={pregnancy} 
            visits={visits} 
            scans={scans} 
          />
        )}
        
        {activeTab === 'visits' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsNewVisitModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm"
              >
                <Plus size={20} />
                <span>زيارة جديدة</span>
              </button>
            </div>
            <VisitsTable visits={visits} />
          </div>
        )}

        {activeTab === 'gallery' && (
          <UltrasoundGallery files={files} />
        )}
      </div>

      {/* Modals */}
      <NewVisitModal
        isOpen={isNewVisitModalOpen}
        onClose={() => setIsNewVisitModalOpen(false)}
        pregnancyId={pregnancy.id}
      />
    </div>
  );
};
