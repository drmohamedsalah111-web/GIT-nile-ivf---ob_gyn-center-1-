import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

interface Invoice {
  id: string;
  patient_id: string;
  total: number;
  paid_amount: number;
  payment_method: string;
  created_at: string;
}

interface InvoiceItem {
  service_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Patient {
  name: string;
  phone: string;
}

interface ClinicBranding {
  clinic_name: string;
  clinic_logo: string;
  clinic_address: string;
  clinic_phone: string;
}

const POSReceipt: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [branding, setBranding] = useState<ClinicBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      loadReceiptData();
    }
  }, [invoiceId]);

  useEffect(() => {
    // Auto-print after data loads
    if (!isLoading && invoice) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isLoading, invoice]);

  const loadReceiptData = async () => {
    try {
      // Load invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Load invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('service_name, quantity, unit_price, total')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('name, phone')
        .eq('id', invoiceData.patient_id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Load clinic branding
      const { data: brandingData } = await supabase
        .from('clinic_branding')
        .select('clinic_name, clinic_logo, clinic_address, clinic_phone')
        .single();

      if (brandingData) {
        setBranding(brandingData);
      }

    } catch (err) {
      console.error('Error loading receipt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!invoice || !patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">فشل تحميل الفاتورة</div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .receipt-container {
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            font-size: 12px;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
        
        @media screen {
          .receipt-container {
            max-width: 400px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Print Button (hidden when printing) */}
      <div className="no-print fixed top-4 right-4 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600"
        >
          طباعة
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600"
        >
          إغلاق
        </button>
      </div>

      {/* Receipt */}
      <div className="receipt-container" dir="rtl">
        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-dashed pb-4">
          {branding?.clinic_logo && (
            <img 
              src={branding.clinic_logo} 
              alt="Logo" 
              className="w-16 h-16 mx-auto mb-2"
            />
          )}
          <h1 className="text-xl font-bold">
            {branding?.clinic_name || 'مركز د. صلاح للخصوبة'}
          </h1>
          {branding?.clinic_address && (
            <p className="text-sm text-gray-600">{branding.clinic_address}</p>
          )}
          {branding?.clinic_phone && (
            <p className="text-sm text-gray-600">تليفون: {branding.clinic_phone}</p>
          )}
        </div>

        {/* Invoice Info */}
        <div className="mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="font-bold">رقم الفاتورة:</span>
            <span>{invoice.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">التاريخ:</span>
            <span>{new Date(invoice.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">الوقت:</span>
            <span>{new Date(invoice.created_at).toLocaleTimeString('ar-EG')}</span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="mb-4 pb-4 border-b-2 border-dashed text-sm">
          <div className="flex justify-between mb-1">
            <span className="font-bold">المريض:</span>
            <span>{patient.name}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">الهاتف:</span>
            <span>{patient.phone}</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-4 text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-right py-2">الخدمة</th>
              <th className="text-center py-2">الكمية</th>
              <th className="text-right py-2">السعر</th>
              <th className="text-right py-2">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2">{item.service_name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{item.unit_price.toFixed(2)}</td>
                <td className="text-right">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-dashed pt-3 mb-4">
          <div className="flex justify-between mb-2 text-lg font-bold">
            <span>الإجمالي:</span>
            <span>{invoice.total.toFixed(2)} جنيه</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>المدفوع:</span>
            <span className="text-green-600 font-bold">{invoice.paid_amount.toFixed(2)} جنيه</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>المتبقي:</span>
            <span className="text-red-600 font-bold">
              {(invoice.total - invoice.paid_amount).toFixed(2)} جنيه
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>طريقة الدفع:</span>
            <span>{invoice.payment_method === 'cash' ? 'كاش' : 'فيزا'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 border-t pt-3">
          <p className="mb-1">شكراً لزيارتكم</p>
          <p className="mb-1">نتمنى لكم دوام الصحة والعافية</p>
          <p className="font-bold">الفاتورة المطبوعة ملزمة</p>
        </div>

        {/* Barcode placeholder (optional) */}
        <div className="text-center mt-4">
          <svg className="mx-auto" width="150" height="40">
            <rect width="150" height="40" fill="white" />
            {/* Simple barcode-like pattern */}
            {Array.from({ length: 30 }).map((_, i) => (
              <rect
                key={i}
                x={i * 5}
                y="5"
                width={Math.random() > 0.5 ? 2 : 3}
                height="30"
                fill="black"
              />
            ))}
          </svg>
          <p className="text-xs mt-1">{invoice.id.slice(0, 12).toUpperCase()}</p>
        </div>
      </div>
    </>
  );
};

export default POSReceipt;
