/**
 * Classic Prescription Template
 * قالب كلاسيكي تقليدي
 */

import React from 'react';
import { PrescriptionItem, Patient, Doctor } from '../../types';
import { PrescriptionSettings } from '../../services/prescriptionService';

interface ClassicTemplateProps {
  patient: Patient;
  doctor: Doctor | null;
  prescriptions: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  settings: PrescriptionSettings;
}

export const ClassicTemplate = React.forwardRef<HTMLDivElement, ClassicTemplateProps>(
  ({ patient, doctor, prescriptions, diagnosis, notes, settings }, ref) => {
    return (
      <div
        ref={ref}
        className="prescription-classic bg-white"
        style={{
          fontFamily: 'Times New Roman, serif',
          fontSize: '14px',
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          direction: 'rtl',
        }}
      >
        {/* Traditional Header */}
        <div className="border-b-4 border-double pb-4 mb-6" style={{ borderColor: settings.primary_color }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: settings.primary_color }}>
              {settings.header_text}
            </h1>
            {doctor?.clinic_address && (
              <div className="text-sm text-gray-600">{doctor.clinic_address}</div>
            )}
            {doctor?.clinic_phone && (
              <div className="text-sm text-gray-600">هاتف: {doctor.clinic_phone}</div>
            )}
          </div>
        </div>

        {/* Patient Info - Classic Style */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">اسم المريض:</span>{' '}
              <span className="border-b border-dotted border-gray-400 inline-block min-w-[200px] px-2">
                {patient?.name}
              </span>
            </div>
            <div>
              <span className="font-semibold">التاريخ:</span>{' '}
              <span className="border-b border-dotted border-gray-400 inline-block min-w-[150px] px-2">
                {new Date().toLocaleDateString('ar-EG')}
              </span>
            </div>
            <div>
              <span className="font-semibold">العمر:</span>{' '}
              <span className="border-b border-dotted border-gray-400 inline-block min-w-[100px] px-2">
                {patient?.age || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        {diagnosis && (
          <div className="mb-4">
            <span className="font-semibold">التشخيص:</span>{' '}
            <span className="underline">{diagnosis}</span>
          </div>
        )}

        {/* Classic Rx Symbol */}
        <div className="text-center my-6">
          <div className="text-6xl font-serif" style={{ color: settings.primary_color }}>
            ℞
          </div>
        </div>

        {/* Medications - Traditional List */}
        <div className="space-y-4 mb-8">
          {prescriptions.map((item, index) => (
            <div key={index} className="flex gap-3">
              <div className="font-bold">{index + 1}.</div>
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">{item.drug}</div>
                {item.dose && <div className="text-gray-700 italic">- {item.dose}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {notes && (
          <div className="mb-8 p-3 border border-gray-300">
            <div className="font-semibold mb-2">ملاحظات:</div>
            <div className="text-gray-700">{notes}</div>
          </div>
        )}

        {/* Classic Footer */}
        <div className="mt-16 border-t pt-4">
          <div className="flex justify-between">
            <div>
              <div className="mb-12"></div>
              <div className="text-center border-t border-gray-800 pt-1 w-48">
                <div className="text-sm">توقيع المريض</div>
              </div>
            </div>
            <div>
              <div className="mb-12"></div>
              <div className="text-center border-t border-gray-800 pt-1 w-48">
                <div className="text-sm font-semibold">{doctor?.name}</div>
                <div className="text-xs text-gray-600">توقيع الطبيب</div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            .prescription-classic {
              margin: 0;
              padding: 20mm;
            }
          }
        `}</style>
      </div>
    );
  }
);

ClassicTemplate.displayName = 'ClassicTemplate';
