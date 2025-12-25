/**
 * Smart Prescription System - Main Component
 * نظام الروشتات الذكي - المكون الرئيسي
 */

import React, { useState, useRef } from 'react';
import { Patient, Doctor, PrescriptionItem } from '../../types';
import { usePrescription } from '../../hooks/usePrescription';
import { ModernTemplate } from './ModernTemplate';
import { ClassicTemplate } from './ClassicTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import {
  Printer,
  Settings,
  AlertTriangle,
  Download,
  Save,
  X,
  Eye,
  Palette,
  FileText,
  Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SmartPrescriptionSystemProps {
  patient: Patient;
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  initialPrescriptions?: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
}

export const SmartPrescriptionSystem: React.FC<SmartPrescriptionSystemProps> = ({
  patient,
  doctor,
  isOpen,
  onClose,
  initialPrescriptions = [],
  diagnosis = '',
  notes = '',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'settings'>('edit');
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [styleSettings, setStyleSettings] = useState({
    primary_color: '#0891B2',
    secondary_color: '#06B6D4',
    header_text: 'عيادة متخصصة',
    footer_text: 'العنوان | الهاتف',
    font_family: 'Tajawal',
    paper_size: 'A4',
  });

  const {
    prescriptions,
    settings,
    loading,
    interactionWarnings,
    hasInteractions,
    setPrescriptions,
    addMedication,
  } = usePrescription({
    patientId: patient?.id?.toString(),
    enableInteractionCheck: true,
  });

  // Initialize prescriptions
  React.useEffect(() => {
    if (initialPrescriptions.length > 0) {
      initialPrescriptions.forEach(med => addMedication(med));
    }
  }, []);

  const handlePrint = () => {
    if (!printRef.current) {
      toast.error('فشل تحميل نموذج الطباعة');
      return;
    }

    if (!prescriptions || prescriptions.length === 0) {
      toast.error('أضف بعض الأدوية أولاً قبل الطباعة');
      return;
    }

    // التبديل إلى تاب المعاينة أولاً
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      toast.info('انتقل إلى تاب المعاينة أولاً ثم اضغط طباعة مرة أخرى');
      return;
    }

    // انتظر قليلاً ثم اطبع
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAddDrug = () => {
    if (!newDrug.trim()) {
      toast.error('أدخل اسم الدواء');
      return;
    }
    if (!newDose.trim()) {
      toast.error('أدخل الجرعة');
      return;
    }

    addMedication({
      drug: newDrug,
      dose: newDose,
      category: newCategory || 'أدوية',
    });

    setNewDrug('');
    setNewDose('');
    setNewCategory('');
  };

  const handleExportPDF = () => {
    toast.success('جاري تصدير PDF...');
    // Implementation would use html2pdf or similar library
    handlePrint();
  };

  const renderTemplate = () => {
    if (!patient) {
      return <div className="text-center py-12 text-gray-500">البيانات غير متاحة</div>;
    }

    const templateSettings = {
      primary_color: styleSettings.primary_color,
      secondary_color: styleSettings.secondary_color,
      accent_color: '#22D3EE',
      font_family: styleSettings.font_family,
      font_size: 'medium',
      paper_size: styleSettings.paper_size,
      header_text: styleSettings.header_text,
      footer_text: styleSettings.footer_text,
      show_watermark: false,
    };

    const templateProps = {
      patient,
      doctor,
      prescriptions: prescriptions || [],
      diagnosis,
      notes,
      settings: templateSettings as any,
    };

    console.log('Rendering template with data:', { 
      prescriptionCount: prescriptions.length,
      selectedTemplate,
      patientName: patient.name 
    });

    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate {...templateProps} ref={printRef} />;
      case 'classic':
        return <ClassicTemplate {...templateProps} ref={printRef} />;
      case 'minimal':
        return <MinimalTemplate {...templateProps} ref={printRef} />;
      default:
        return <ModernTemplate {...templateProps} ref={printRef} />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-print-area,
          #prescription-print-area * {
            visibility: visible;
          }
          #prescription-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">نظام الروشتات الذكي</h2>
              <p className="text-sm text-teal-100">Smart Prescription System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Interaction Warnings */}
        {hasInteractions && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-r-4 border-red-500 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900 mb-2">
                  ⚠️ تحذير: تم اكتشاف تفاعلات دوائية محتملة
                </div>
                <ul className="text-sm text-red-800 space-y-1">
                  {interactionWarnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'edit'
                ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} />
            تحرير الروشتة
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'preview'
                ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Eye size={18} />
            معاينة
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={18} />
            إعدادات
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'preview' && (
            <div>
              {/* Template Selector */}
              <div className="mb-6 flex gap-3">
                {[
                  { id: 'modern', name: 'عصري', icon: '🎨' },
                  { id: 'classic', name: 'كلاسيكي', icon: '📜' },
                  { id: 'minimal', name: 'بسيط', icon: '⚪' },
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id as any)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-teal-600 bg-teal-50 text-teal-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="mr-2">{template.icon}</span>
                    {template.name}
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm text-teal-900">
                  📋 الأدوية المضافة: <span className="font-semibold">{prescriptions.length}</span> | 
                  عدل الألوان والنصوص من تاب الإعدادات
                </p>
              </div>

              {/* Preview */}
              <div className="bg-gray-100 p-8 rounded-xl overflow-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                <div id="prescription-print-area" className="mx-auto shadow-2xl" style={{ width: '210mm' }}>
                  {renderTemplate()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Add Drug Form */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة دواء</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="اسم الدواء"
                    value={newDrug}
                    onChange={(e) => setNewDrug(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <input
                    type="text"
                    placeholder="الجرعة"
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <input
                    type="text"
                    placeholder="التصنيف (اختياري)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <button
                  onClick={handleAddDrug}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                >
                  إضافة الدواء
                </button>
              </div>

              {/* Current Prescriptions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">الأدوية المضافة ({prescriptions.length})</h3>
                {prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{item.drug}</p>
                          <p className="text-sm text-gray-600">{item.dose}</p>
                          {item.category && <p className="text-xs text-gray-500">التصنيف: {item.category}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>لم تتم إضافة أي أدوية بعد</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Colors */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">الألوان</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اللون الأساسي</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styleSettings.primary_color}
                        onChange={(e) => setStyleSettings({ ...styleSettings, primary_color: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styleSettings.primary_color}
                        onChange={(e) => setStyleSettings({ ...styleSettings, primary_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اللون الثانوي</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styleSettings.secondary_color}
                        onChange={(e) => setStyleSettings({ ...styleSettings, secondary_color: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styleSettings.secondary_color}
                        onChange={(e) => setStyleSettings({ ...styleSettings, secondary_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Settings */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">النصوص</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رأس الروشتة</label>
                    <input
                      type="text"
                      value={styleSettings.header_text}
                      onChange={(e) => setStyleSettings({ ...styleSettings, header_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="مثال: عيادة متخصصة"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تذييل الروشتة</label>
                    <input
                      type="text"
                      value={styleSettings.footer_text}
                      onChange={(e) => setStyleSettings({ ...styleSettings, footer_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="مثال: العنوان | الهاتف"
                    />
                  </div>
                </div>
              </div>

              {/* Font & Layout */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">الخط وحجم الورقة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الخط</label>
                    <select
                      value={styleSettings.font_family}
                      onChange={(e) => setStyleSettings({ ...styleSettings, font_family: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="Tajawal">تجول</option>
                      <option value="Cairo">كايرو</option>
                      <option value="Inter">إنتر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">حجم الورقة</label>
                    <select
                      value={styleSettings.paper_size}
                      onChange={(e) => setStyleSettings({ ...styleSettings, paper_size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Live */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 سيتم تطبيق جميع التغييرات على المعاينة والطباعة تلقائياً
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold shadow-lg"
            >
           <Printer size={20} />
              طباعة
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Download size={20} />
              تصدير PDF
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
      </div>
    </>
  );
};
