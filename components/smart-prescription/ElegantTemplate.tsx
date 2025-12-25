/**
 * Elegant Prescription Template
 * قالب أنيق وراقي
 */

import React from 'react';
import { PrescriptionItem, Patient, Doctor } from '../../types';
import { PrescriptionSettings } from '../../services/prescriptionService';

interface ElegantTemplateProps {
  patient: Patient;
  doctor: Doctor | null;
  prescriptions: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  settings: PrescriptionSettings;
}

export const ElegantTemplate = React.forwardRef<HTMLDivElement, ElegantTemplateProps>(
  ({ patient, doctor, prescriptions, diagnosis, notes, settings }, ref) => {
    return (
      <div
        ref={ref}
        className="prescription-elegant bg-white"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '14px',
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          direction: 'rtl',
          background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
        }}
      >
        {/* Decorative Border */}
        <div className="border-4 border-double p-8" style={{ borderColor: settings.primary_color }}>
          {/* Elegant Header */}
          <div className="text-center mb-8 relative">
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-1"
              style={{ backgroundColor: settings.primary_color }}
            />
            <div className="pt-6">
              {settings.logo_url && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-16 object-contain opacity-80"
                  />
                </div>
              )}
              <h1
                className="text-3xl font-serif mb-2"
                style={{ color: settings.primary_color, fontWeight: 300, letterSpacing: '2px' }}
              >
                {settings.header_text}
              </h1>
              <div className="text-sm text-gray-600 italic">{settings.footer_text}</div>
            </div>
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1"
              style={{ backgroundColor: settings.primary_color }}
            />
          </div>

          {/* Patient Information - Elegant Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">اسم المريض</div>
              <div className="font-semibold text-gray-800">{patient?.name}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">العمر</div>
              <div className="font-semibold text-gray-800">{patient?.age || '-'}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">التاريخ</div>
              <div className="font-semibold text-gray-800">{new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </div>

          {/* Diagnosis */}
          {diagnosis && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-r-2" style={{ borderColor: settings.accent_color }}>
              <div className="text-xs font-semibold text-gray-500 mb-1">التشخيص</div>
              <div className="text-gray-800">{diagnosis}</div>
            </div>
          )}

          {/* Ornamental Rx */}
          <div className="text-center my-8">
            <div className="inline-block relative">
              <div
                className="text-6xl font-serif"
                style={{ color: settings.primary_color, opacity: 0.9 }}
              >
                ℞
              </div>
              <div
                className="absolute -bottom-2 left-0 right-0 h-0.5"
                style={{ backgroundColor: settings.accent_color }}
              />
            </div>
          </div>

          {/* Medications - Elegant Cards */}
          <div className="space-y-3 mb-8">
            {prescriptions.map((item, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm border-l-4"
                style={{ borderLeftColor: settings.accent_color }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: settings.primary_color }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-serif text-lg text-gray-900 mb-1">{item.drug}</div>
                    {item.dose && (
                      <div className="text-sm text-gray-600 italic">{item.dose}</div>
                    )}
                    {settings.show_drug_category && item.category && (
                      <div className="text-xs text-gray-500 mt-1">({item.category})</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {notes && (
            <div className="mb-8 p-4 bg-amber-50/50 rounded-lg border border-amber-200">
              <div className="text-xs font-semibold text-amber-900 mb-2">ملاحظات مهمة</div>
              <div className="text-sm text-amber-800 italic">{notes}</div>
            </div>
          )}

          {/* Elegant Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300">
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-600">
                <div className="mb-8"></div>
                <div className="border-t-2 border-gray-400 pt-1 w-48 text-center">
                  توقيع المريض
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-lg mb-1" style={{ color: settings.primary_color }}>
                  {doctor?.name}
                </div>
                {doctor?.specialization && (
                  <div className="text-sm text-gray-600">{doctor.specialization}</div>
                )}
                <div className="mt-8 border-t-2 border-gray-400 pt-1 w-48 text-center text-sm">
                  توقيع الطبيب
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            .prescription-elegant {
              margin: 0;
              padding: 20mm;
            }
          }
        `}</style>
      </div>
    );
  }
);

ElegantTemplate.displayName = 'ElegantTemplate';
