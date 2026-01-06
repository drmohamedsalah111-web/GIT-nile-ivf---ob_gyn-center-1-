import React, { useState, useEffect } from 'react';
import { Activity, Calendar, FileText, Image as ImageIcon, AlertCircle, Plus, RefreshCw, FlaskConical, Pill } from 'lucide-react';
import { format, differenceInWeeks, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PregnancyFollowUpCard } from '../../components/obstetrics/PregnancyFollowUpCard';
import { VisitsTable } from '../../components/obstetrics/VisitsTable';
import { UltrasoundGallery } from '../../components/obstetrics/UltrasoundGallery';
import { NewVisitModal } from '../../components/obstetrics/NewVisitModal';
import { NewPregnancyModal } from '../../components/obstetrics/NewPregnancyModal';
import { PregnancyLabsPanel } from '../../components/obstetrics/PregnancyLabsPanel';
import { PregnancyPrescriptionPanel } from '../../components/obstetrics/PregnancyPrescriptionPanel';
import { obstetricsService } from '../../../services/obstetricsService';

interface PregnancyProfileProps {
  patientId: string;
}

export const PregnancyProfile: React.FC<PregnancyProfileProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'labs' | 'prescriptions' | 'gallery'>('overview');
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [isNewPregnancyModalOpen, setIsNewPregnancyModalOpen] = useState(false);

  const [pregnancy, setPregnancy] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (pregnancyId: string) => {
    try {
      const filesData = await obstetricsService.getPregnancyFiles(pregnancyId);
      setFiles(filesData || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const fetchData = async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch pregnancy data
      const pregnancyData = await obstetricsService.getPregnancyByPatient(patientId);
      setPregnancy(pregnancyData);

      if (pregnancyData?.id) {
        // Fetch visits for this pregnancy
        const visitsData = await obstetricsService.getANCVisits(pregnancyData.id);
        setVisits(visitsData || []);

        // Fetch scans for this pregnancy
        const scansData = await obstetricsService.getBiometryScans(pregnancyData.id);
        setScans(scansData || []);

        // Fetch files for this pregnancy
        const filesData = await obstetricsService.getPregnancyFiles(pregnancyData.id);
        setFiles(filesData || []);
      }
    } catch (err: any) {
      console.error('Error fetching pregnancy data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <RefreshCw className="w-8 h-8 mx-auto text-teal-600 animate-spin mb-4" />
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">حدث خطأ</h3>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    );
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
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${activeTab === 'overview'
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Activity size={20} />
            <span>نظرة عامة</span>
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${activeTab === 'visits'
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Calendar size={20} />
            <span>الزيارات</span>
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${activeTab === 'labs'
                ? 'bg-purple-50 text-purple-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <FlaskConical size={20} />
            <span>التحاليل</span>
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${activeTab === 'prescriptions'
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Pill size={20} />
            <span>الروشتات</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${activeTab === 'gallery'
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <ImageIcon size={20} />
            <span>السونار</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <PregnancyFollowUpCard
            pregnancy={pregnancy}
            visits={visits}
            patientName={pregnancy.patient_name}
            onQuickVisit={() => setIsNewVisitModalOpen(true)}
            onVisitClick={(visit) => console.log('Visit clicked:', visit)}
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
          <UltrasoundGallery
            files={files}
            pregnancyId={pregnancy.id}
            onUploadSuccess={() => fetchFiles(pregnancy.id)}
          />
        )}

        {activeTab === 'labs' && (
          <PregnancyLabsPanel
            pregnancyId={pregnancy.id}
            riskLevel={pregnancy.risk_level || 'low'}
            gestationalWeeks={pregnancy.gestational_age ? Math.floor(pregnancy.gestational_age / 7) :
              differenceInWeeks(new Date(), new Date(pregnancy.lmp))}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PregnancyPrescriptionPanel
            pregnancyId={pregnancy.id}
            patientName={pregnancy.patient_name || 'المريضة'}
            gestationalWeeks={pregnancy.gestational_age ? Math.floor(pregnancy.gestational_age / 7) :
              differenceInWeeks(new Date(), new Date(pregnancy.lmp || new Date()))}
          />
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
