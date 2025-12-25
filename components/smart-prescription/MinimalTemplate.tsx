/**
 * Minimal Prescription Template
 * قالب بسيط ومباشر
 */

import React from 'react';
import { PrescriptionItem, Patient, Doctor } from '../../types';
import { PrescriptionSettings } from '../../services/prescriptionService';

interface MinimalTemplateProps {
  patient: Patient;
  doctor: Doctor | null;
  prescriptions: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  settings: PrescriptionSettings;
}

export const MinimalTemplate = React.forwardRef<HTMLDivElement, MinimalTemplateProps>(
  ({ patient, doctor, prescriptions, diagnosis, notes, settings }, ref) => {
    return (
      <div
        ref={ref}
        className="prescription-minimal bg-white"
        style={{
          fontFamily: settings.font_family || 'Inter',
          fontSize: '14px',
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm',
          direction: 'rtl',
        }}
      >
        {/* Minimal Header */}
        <div className="mb-8 pb-4 border-b-2" style={{ borderColor: settings.primary_color }}>
          <h1 className="text-2xl font-light mb-1" style={{ color: settings.primary_color }}>
            {settings.header_text}
          </h1>
          <div className="text-sm text-gray-600">{settings.footer_text}</div>
        </div>

        {/* Patient Info - Minimal */}
        <div className="mb-6 text-sm space-y-1">
          <div><span className="text-gray-500">المريض:</span> <span className="font-medium">{patient?.name}</span></div>
          <div><span className="text-gray-500">التاريخ:</span> <span className="font-medium">{new Date().toLocaleDateString('ar-EG')}</span></div>
          {diagnosis && <div><span className="text-gray-500">التشخيص:</span> <span className="font-medium">{diagnosis}</span></div>}
        </div>

        {/* Simple Rx */}
        <div className="mb-6">
          <div className="text-3xl font-light" style={{ color: settings.primary_color }}>℞</div>
        </div>

        {/* Medications - Clean List */}
        <div className="space-y-4 mb-8">
          {prescriptions && prescriptions.length > 0 ? (
            prescriptions.map((item, index) => (
              <div key={index} className="pb-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900">{index + 1}. {item.drug}</div>
                {item.dose && <div className="text-sm text-gray-600 mt-1">{item.dose}</div>}
                {item.category && <div className="text-xs text-gray-500 mt-1">التصنيف: {item.category}</div>}
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic text-center py-4">لم تتم إضافة أي أدوية</div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="mb-6 text-sm">
            <div className="text-gray-500 mb-1">ملاحظات:</div>
            <div className="text-gray-700">{notes}</div>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="mt-auto pt-8 text-sm text-gray-500">
          {doctor?.name}
        </div>
      </div>
    );
  }
);

MinimalTemplate.displayName = 'MinimalTemplate';
