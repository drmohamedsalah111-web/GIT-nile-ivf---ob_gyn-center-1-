/**
 * مثال على استخدام نظام الروشتات الذكي
 * Smart Prescription System Usage Example
 */

import React, { useState } from 'react';
import { SmartPrescriptionSystem } from './components/smart-prescription';
import { usePrescription } from './hooks/usePrescription';
import { Patient, Doctor, PrescriptionItem } from './types';
import { Printer } from 'lucide-react';

const PrescriptionExample = () => {
  const [isSystemOpen, setIsSystemOpen] = useState(false);

  // بيانات المريض
  const patient: Patient = {
    id: '1',
    name: 'أحمد محمد علي',
    age: 35,
    phone: '01234567890',
  };

  // بيانات الطبيب
  const doctor: Doctor = {
    id: '1',
    user_id: 'doctor-1',
    email: 'doctor@clinic.com',
    name: 'د. محمد صلاح جبر',
    specialization: 'استشاري أمراض النساء والتوليد وعلاج العقم',
    clinic_name: 'عيادة النيل المتخصصة',
    clinic_address: '123 شارع التحرير، القاهرة، مصر',
    clinic_phone: '02-12345678',
    primary_color: '#0891B2',
    secondary_color: '#06B6D4',
    accent_color: '#22D3EE',
  };

  // الروشتة الحالية
  const currentPrescriptions: PrescriptionItem[] = [
    {
      drug: 'Augmentin 1g',
      dose: 'قرص واحد كل 12 ساعة بعد الأكل',
      category: 'Antibiotics',
    },
    {
      drug: 'Paracetamol 500mg',
      dose: 'قرص واحد عند الحاجة (لا يتجاوز 3 مرات يومياً)',
      category: 'Analgesics',
    },
    {
      drug: 'Omeprazole 20mg',
      dose: 'كبسولة واحدة قبل الإفطار',
      category: 'Gastrointestinal',
    },
  ];

  // استخدام Hook
  const {
    prescriptions,
    settings,
    loading,
    interactionWarnings,
    hasInteractions,
    addMedication,
    removeMedication,
    clearPrescriptions,
    savePrescription,
  } = usePrescription({
    patientId: patient.id?.toString(),
    enableInteractionCheck: true,
    autoSave: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎨 نظام الروشتات الذكي
          </h1>
          <p className="text-gray-600">
            نظام متكامل لإدارة وطباعة الروشتات الطبية بشكل احترافي
          </p>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات المريض</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-teal-50 rounded-lg">
              <div className="text-sm text-teal-600 font-semibold mb-1">الاسم</div>
              <div className="text-gray-900 font-medium">{patient.name}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-semibold mb-1">العمر</div>
              <div className="text-gray-900 font-medium">{patient.age} سنة</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-semibold mb-1">الهاتف</div>
              <div className="text-gray-900 font-medium">{patient.phone}</div>
            </div>
          </div>
        </div>

        {/* Current Prescriptions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">الروشتة الحالية</h2>
          {currentPrescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Printer className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد أدوية في الروشتة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentPrescriptions.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{item.drug}</div>
                    <div className="text-sm text-gray-600">{item.dose}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="inline-block px-2 py-0.5 bg-gray-200 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interaction Warnings */}
        {hasInteractions && (
          <div className="bg-red-50 border-r-4 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-red-600 text-2xl">⚠️</div>
              <div>
                <h3 className="font-bold text-red-900 mb-2">تحذير: تفاعلات دوائية محتملة</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  {interactionWarnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4">
            <button
              onClick={() => setIsSystemOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg"
            >
              <Printer className="w-6 h-6" />
              فتح نظام الروشتات الذكي
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-sm font-semibold text-blue-900">4 قوالب احترافية</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl mb-2">🧠</div>
              <div className="text-sm font-semibold text-green-900">فحص التفاعلات الدوائية</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-semibold text-purple-900">تخصيص كامل</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm font-semibold text-orange-900">طباعة احترافية</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <div className="text-gray-700 font-semibold">جاري التحميل...</div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Prescription System */}
      <SmartPrescriptionSystem
        patient={patient}
        doctor={doctor}
        isOpen={isSystemOpen}
        onClose={() => setIsSystemOpen(false)}
        initialPrescriptions={currentPrescriptions}
        diagnosis="ارتفاع ضغط الدم - Hypertension"
        notes="المتابعة بعد أسبوعين. تجنب الأطعمة المالحة. الإكثار من شرب الماء."
      />
    </div>
  );
};

export default PrescriptionExample;
