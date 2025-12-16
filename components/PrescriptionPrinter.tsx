import React, { useState, useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { PrescriptionItem, Patient, Doctor } from '../types';
import { authService } from '../services/authService';
import { useBranding } from '../context/BrandingContext';
import toast from 'react-hot-toast';

interface PrescriptionPrinterProps {
  patient: Patient | null;
  prescriptions: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PrescriptionPrinter: React.FC<PrescriptionPrinterProps> = ({
  patient,
  prescriptions,
  diagnosis,
  notes,
  isOpen,
  onClose
}) => {
  const { branding } = useBranding();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDoctorInfo();
    }
  }, [isOpen]);

  const fetchDoctorInfo = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const doctorData = await authService.getDoctorProfile(user.id);
        setDoctor(doctorData);
      }
    } catch (error) {
      console.error('Error fetching doctor info:', error);
      // No toast.error - using default profile silently
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
      toast.error('فشل فتح نافذة الطباعة');
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; padding: 20px; }
        .prescription-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #ddd; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2d5a6b; padding-bottom: 20px; margin-bottom: 30px; }
        .clinic-info { flex: 1; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #2d5a6b; margin-bottom: 8px; }
        .clinic-details { font-size: 12px; color: #666; line-height: 1.8; }
        .logo-area { flex: 1; text-align: right; color: #2d5a6b; font-weight: bold; font-size: 14px; }
        .patient-doctor-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .info-block { }
        .info-label { font-weight: bold; color: #2d5a6b; font-size: 13px; margin-bottom: 5px; }
        .info-value { font-size: 14px; color: #333; }
        .rx-title { font-size: 18px; font-weight: bold; color: #2d5a6b; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .prescriptions-list { margin-bottom: 30px; }
        .prescription-item { background: #f9f9f9; border: 1px solid #e0e0e0; padding: 12px 15px; margin-bottom: 10px; border-radius: 4px; }
        .prescription-number { display: inline-block; background: #2d5a6b; color: white; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; font-size: 12px; }
        .prescription-content { margin-left: 38px; }
        .drug-name { font-weight: bold; font-size: 14px; color: #333; }
        .drug-dose { font-size: 12px; color: #666; margin-top: 3px; }
        .drug-category { font-size: 11px; color: #999; margin-top: 3px; }
        .diagnosis-section, .notes-section { margin-bottom: 25px; padding: 15px; background: #f5f5f5; border-left: 4px solid #2d5a6b; }
        .section-title { font-weight: bold; color: #2d5a6b; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; }
        .section-content { color: #333; font-size: 13px; line-height: 1.6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .signature-box { }
        .signature-label { font-size: 12px; font-weight: bold; color: #666; margin-top: 40px; border-top: 1px solid #333; padding-top: 5px; text-align: center; }
        .date-time { font-size: 12px; color: #666; margin-top: 15px; text-align: center; }
        @media print {
          body { padding: 0; }
          .prescription-container { border: none; padding: 0; }
        }
      </style>
    `;

    const content = printContent.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>روشتة طبية</title>
          ${styles}
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = getCurrentDateTime();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">معاينة الروشتة الطبية</h2>
          <button
            onClick={onClose}
            className="hover:bg-teal-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div ref={printRef} className="prescription-container">
            {/* Header */}
            <div className="header">
              <div className="clinic-info">
                <div className="clinic-name">
                  {branding?.clinic_name || 'عيادة متخصصة'}
                </div>
                <div className="clinic-details">
                  {branding?.clinic_address && <div>{branding.clinic_address}</div>}
                  {branding?.clinic_phone && <div>ت: {branding.clinic_phone}</div>}
                  {doctor?.email && <div>البريد الإلكتروني: {doctor.email}</div>}
                </div>
              </div>
              <div className="logo-area">
                {branding?.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" style={{ maxWidth: '80px', maxHeight: '80px' }} />
                ) : (
                  'ℜ'
                )}
              </div>
            </div>

            {/* Patient & Doctor Info */}
            <div className="patient-doctor-section">
              <div className="info-block">
                <div className="info-label">بيانات المريضة</div>
                <div className="info-value">{patient?.name || 'N/A'}</div>
                <div className="info-value" style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                  العمر: {patient?.age || 'N/A'} سنة
                </div>
                <div className="info-value" style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                  الهاتف: {patient?.phone || 'N/A'}
                </div>
              </div>
              <div className="info-block">
                <div className="info-label">بيانات الطبيب</div>
                <div className="info-value">{doctor?.name || 'N/A'}</div>
                <div className="info-value" style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                  {doctor?.specialization || ''}
                </div>
                <div className="info-value" style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                  {date} - {time}
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            {diagnosis && (
              <div className="diagnosis-section">
                <div className="section-title">التشخيص</div>
                <div className="section-content">{diagnosis}</div>
              </div>
            )}

            {/* Prescriptions */}
            {prescriptions.length > 0 && (
              <>
                <div className="rx-title">الروشتة الطبية</div>
                <div className="prescriptions-list">
                  {prescriptions.map((prescription, index) => (
                    <div key={index} className="prescription-item">
                      <span className="prescription-number">{index + 1}</span>
                      <div className="prescription-content">
                        <div className="drug-name">{prescription.drug}</div>
                        <div className="drug-dose">
                          {prescription.dose || 'الجرعة القياسية'}
                        </div>
                        <div className="drug-category">التصنيف: {prescription.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {notes && (
              <div className="notes-section">
                <div className="section-title">ملاحظات</div>
                <div className="section-content">{notes}</div>
              </div>
            )}

            {/* Footer */}
            <div className="footer">
              <div className="signature-box">
                <div className="signature-label">توقيع الطبيب</div>
              </div>
              <div className="signature-box">
                <div className="signature-label">توقيع المريضة</div>
              </div>
            </div>

            {/* System Signature */}
            <div style={{
              marginTop: '30px',
              paddingTop: '15px',
              borderTop: '1px solid #ccc',
              fontSize: '10px',
              color: '#999',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                {branding?.clinic_address && <div>{branding.clinic_address}</div>}
                {branding?.clinic_phone && <div>Tel: {branding.clinic_phone}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                System developed by Dr. Mohamed Salah Gabr
              </div>
            </div>

            {/* Date Time */}
            <div className="date-time">
              تم الطباعة: {date} في {time}
            </div>
          </div>

          {/* Print Button */}
          <div className="mt-6 flex gap-3 justify-end sticky bottom-0 bg-gray-50 p-4 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة الروشتة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPrinter;
