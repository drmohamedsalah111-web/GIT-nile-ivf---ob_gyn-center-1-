import React from 'react';
import { PrintSettings, PatientData, Medicine, PrescriptionData } from '../types';

interface PrescriptionTemplateProps {
  settings: PrintSettings;
  data: PrescriptionData;
}

const PrescriptionTemplate: React.FC<PrescriptionTemplateProps> = ({ settings, data }) => {
  return (
    <>
      <style>
        {`
          @media print {
            .prescription-template {
              margin: 0;
              padding: 20mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              break-inside: avoid;
            }
            body * {
              visibility: hidden;
            }
            .prescription-template, .prescription-template * {
              visibility: visible;
            }
            .prescription-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: auto;
            }
            .drug-item {
              break-inside: avoid;
            }
          }
        `}
      </style>
      <div className="prescription-template bg-white text-black font-sans" style={{ width: '210mm', height: '297mm', padding: '20mm', position: 'relative' }}>
        {/* Watermark */}
        {settings.show_watermark && settings.logo_url && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: 0.08 }}
          >
            <img
              src={settings.logo_url}
              alt="Watermark"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Header */}
        <div
          className="flex justify-between items-center mb-8 rounded-b-lg"
          style={{ backgroundColor: settings.primary_color, color: 'white', padding: '20px' }}
        >
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{settings.header_text}</h1>
          </div>
          <div className="flex-1 text-right">
            {settings.logo_url && (
              <img
                src={settings.logo_url}
                alt="Clinic Logo"
                className="max-h-16 max-w-32 object-contain"
              />
            )}
          </div>
        </div>

        {/* Patient Strip */}
        <div className="bg-gray-100 p-4 mb-6 rounded">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-semibold">Patient:</span> {data.patient.name}
            </div>
            <div>
              <span className="font-semibold">Age:</span> {data.patient.age} years
            </div>
            <div>
              <span className="font-semibold">Date:</span> {data.patient.date}
            </div>
          </div>
        </div>

        {/* Rx Icon and Title */}
        <div className="flex items-center mb-6">
          <div
            className="text-4xl mr-4"
            style={{ color: settings.primary_color }}
          >
            ℞
          </div>
          <h2 className="text-xl font-bold" style={{ color: settings.primary_color }}>
            Prescription
          </h2>
        </div>

        {/* Drug List */}
        <div className="mb-8">
          {data.medicines.map((medicine, index) => (
            <div key={index} className="mb-4 drug-item">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-lg">{medicine.name}</div>
                  <div className="text-gray-600">{medicine.dosage}</div>
                  <div className="text-sm text-gray-500">{medicine.instructions}</div>
                </div>
              </div>
              {index < data.medicines.length - 1 && (
                <hr
                  className="mt-4"
                  style={{ borderColor: settings.secondary_color, borderWidth: '1px', borderStyle: 'dotted' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8">
          <hr
            className="mb-4"
            style={{ borderColor: settings.primary_color, borderWidth: '2px' }}
          />
          <div className="text-center text-gray-700">
            {settings.footer_text}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrescriptionTemplate;