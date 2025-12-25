import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Printer, ChevronDown, ChevronUp, Calendar, TrendingUp, Activity } from 'lucide-react';
import { obstetricsService } from '../../../services/obstetricsService';
import { RiskAssessmentHeader } from './RiskAssessmentHeader';
import { VisitFlowSheet } from './VisitFlowSheet';
import { TrendCharts } from './TrendCharts';
import toast from 'react-hot-toast';

interface AntenatalCareProfileProps {
  pregnancyId: string;
  patientName: string;
  patientId: string;
}

export const AntenatalCareProfile: React.FC<AntenatalCareProfileProps> = ({
  pregnancyId,
  patientName,
  patientId
}) => {
  const [pregnancy, setPregnancy] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRiskHeader, setShowRiskHeader] = useState(true);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    fetchData();
  }, [pregnancyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pregnancy data
      const pregnancyData = await obstetricsService.getPregnancyById(pregnancyId);
      setPregnancy(pregnancyData);

      // Fetch visits
      const visitsData = await obstetricsService.getANCVisits(pregnancyId);
      setVisits(visitsData || []);
    } catch (err: any) {
      console.error('Error fetching ANC data:', err);
      toast.error('Failed to load antenatal data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">جاري تحميل بطاقة المتابعة...</p>
      </div>
    );
  }

  if (!pregnancy) {
    return (
      <div className="p-8 text-center text-gray-600">
        لم يتم العثور على بيانات الحمل
      </div>
    );
  }

  const isHighRisk = pregnancy.risk_level === 'high' || 
    (pregnancy.risk_factors && pregnancy.risk_factors.length > 0);

  return (
    <div className="space-y-6 print:space-y-4" dir="rtl">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 print:shadow-none print:border print:border-gray-300">
        <div className="flex items-center justify-between print:justify-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
              بطاقة متابعة الحمل (ANC Card)
            </h1>
            <p className="text-gray-600 mt-1">
              <span className="font-medium">{patientName}</span>
              <span className="mx-2">•</span>
              <span className="text-sm">رقم المريض: {patientId}</span>
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors print:hidden"
          >
            <Printer size={18} />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Risk Assessment Header (Section A) */}
      <div className="print:break-inside-avoid">
        <button
          onClick={() => setShowRiskHeader(!showRiskHeader)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 mb-2 print:hidden hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${isHighRisk ? 'text-red-600' : 'text-amber-600'}`} />
            <span className="font-bold text-gray-900">
              {isHighRisk ? '⚠️ حمل عالي الخطورة - HIGH RISK PREGNANCY' : 'تقييم عوامل الخطر'}
            </span>
          </div>
          {showRiskHeader ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {(showRiskHeader || true /* always show on print */) && (
          <RiskAssessmentHeader
            pregnancy={pregnancy}
            onUpdate={fetchData}
          />
        )}
      </div>

      {/* Visit Flow Sheet (Section B) */}
      <div className="bg-white rounded-xl shadow-sm p-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">سجل الزيارات (Follow-up Flow Sheet)</h2>
          </div>
          <button
            onClick={() => {/* Open add visit modal */}}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors print:hidden"
          >
            <Plus size={18} />
            <span>زيارة جديدة</span>
          </button>
        </div>

        <VisitFlowSheet
          visits={visits}
          pregnancyLmp={pregnancy.lmp_date}
          onRefresh={fetchData}
        />
      </div>

      {/* Trend Charts (Section C) */}
      <div className="print:break-before-page">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full flex items-center justify-between bg-white rounded-xl shadow-sm p-4 mb-2 print:hidden hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-gray-900">الرسوم البيانية (Trends)</span>
          </div>
          {showCharts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {(showCharts || true /* always show on print */) && (
          <TrendCharts
            visits={visits}
            pregnancyLmp={pregnancy.lmp_date}
          />
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};
