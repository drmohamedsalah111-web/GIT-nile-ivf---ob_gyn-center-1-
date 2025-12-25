/**
 * Modern Prescription Template
 * قالب عصري للروشتات
 */

import React from 'react';
import { PrescriptionItem, Patient, Doctor } from '../../types';
import { PrescriptionSettings } from '../../services/prescriptionService';
import { Calendar, User, Phone, MapPin, Pill } from 'lucide-react';

interface ModernTemplateProps {
  patient: Patient;
  doctor: Doctor | null;
  prescriptions: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  settings: PrescriptionSettings;
  showHeader?: boolean;
}

export const ModernTemplate = React.forwardRef<HTMLDivElement, ModernTemplateProps>(
  ({ patient, doctor, prescriptions, diagnosis, notes, settings, showHeader = true }, ref) => {
    const fontSizeMap = {
      small: { base: '12px', heading: '20px', title: '16px' },
      medium: { base: '14px', heading: '24px', title: '18px' },
      large: { base: '16px', heading: '28px', title: '20px' },
    };

    const fontSize = fontSizeMap[settings.font_size || 'medium'];

    return (
      <div
        ref={ref}
        className="prescription-modern bg-white"
        style={{
          fontFamily: settings.font_family || 'Tajawal',
          fontSize: fontSize.base,
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm',
          position: 'relative',
          direction: 'rtl',
        }}
      >
        {/* Watermark */}
        {settings.show_watermark && settings.logo_url && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: 0.05, zIndex: 0 }}
          >
            <img
              src={settings.logo_url}
              alt="Watermark"
              className="max-w-[60%] max-h-[60%] object-contain"
            />
          </div>
        )}

        <div className="relative z-10">
          {/* Modern Header */}
          {showHeader && (
            <div
              className="mb-8 rounded-2xl overflow-hidden shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 100%)`,
              }}
            >
              <div className="p-6 text-white flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="font-bold mb-2" style={{ fontSize: fontSize.heading }}>
                    {settings.header_text || doctor?.clinic_name || 'عيادة متخصصة'}
                  </h1>
                  {settings.show_clinic_address && doctor?.clinic_address && (
                    <div className="flex items-center gap-2 text-white/90 text-sm mb-1">
                      <MapPin size={16} />
                      <span>{doctor.clinic_address}</span>
                    </div>
                  )}
                  {settings.show_clinic_phone && doctor?.clinic_phone && (
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Phone size={16} />
                      <span>{doctor.clinic_phone}</span>
                    </div>
                  )}
                </div>
                {settings.logo_url && (
                  <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center">
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient Information Card */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  <User size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">اسم المريض</div>
                  <div className="font-semibold text-gray-800">{patient?.name || 'غير محدد'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">العمر</div>
                  <div className="font-semibold text-gray-800">{patient?.age || '-'} سنة</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">التاريخ</div>
                  <div className="font-semibold text-gray-800">
                    {new Date().toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          {diagnosis && (
            <div className="mb-6 p-4 bg-blue-50 border-r-4 border-blue-500 rounded-lg">
              <div className="text-sm font-semibold text-blue-900 mb-1">التشخيص</div>
              <div className="text-blue-800">{diagnosis}</div>
            </div>
          )}

          {/* Rx Symbol */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="text-5xl font-bold"
              style={{ color: settings.primary_color }}
            >
              ℞
            </div>
            <div>
              <h2 className="font-bold text-gray-800" style={{ fontSize: fontSize.title }}>
                الروشتة الطبية
              </h2>
              <div className="text-sm text-gray-500">Medical Prescription</div>
            </div>
          </div>

          {/* Medications List */}
          <div className="space-y-3 mb-8">
            {prescriptions.map((item, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors"
              >
                <div className="flex gap-4">
                  {settings.auto_number_drugs && (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      {index + 1}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg mb-1">{item.drug}</div>
                    {item.dose && (
                      <div className="text-gray-600 mb-1">
                        <span className="font-semibold">الجرعة:</span> {item.dose}
                      </div>
                    )}
                    {settings.show_drug_category && item.category && (
                      <div className="text-sm text-gray-500">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded-full">
                          {item.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {notes && (
            <div className="mb-8 p-4 bg-amber-50 border-r-4 border-amber-500 rounded-lg">
              <div className="text-sm font-semibold text-amber-900 mb-1">ملاحظات</div>
              <div className="text-amber-800 whitespace-pre-wrap">{notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-gray-200">
            <div className="flex justify-between items-end">
              {settings.show_doctor_signature && doctor && (
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">توقيع الطبيب</div>
                  <div className="font-bold text-gray-800">{doctor.name}</div>
                  {doctor.specialization && (
                    <div className="text-sm text-gray-600">{doctor.specialization}</div>
                  )}
                </div>
              )}
              <div className="text-right text-sm text-gray-500">
                {settings.footer_text}
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            .prescription-modern {
              margin: 0;
              padding: 15mm;
              box-shadow: none;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>
      </div>
    );
  }
);

ModernTemplate.displayName = 'ModernTemplate';
