import React, { useState, useEffect } from 'react';
import PatientLookup from '../../components/reception/PatientLookup';
import InvoiceBuilder from '../../components/reception/InvoiceBuilder';
import { posService } from '../../services/posService';
import toast from 'react-hot-toast';

const POSPage: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    // TODO: derive clinicId from auth/get_doctor_id or context
    // setClinicId(...)
  }, []);

  const handleSaveInvoice = async (invoiceData: any) => {
    try {
      const inv = await posService.createInvoice(invoiceData);
      toast.success('تم حفظ الفاتورة');
      // trigger print
      window.open(`/pos/receipt/${inv.id}`, '_blank');
    } catch (err: any) {
      console.error('Save POS invoice error:', err);
      toast.error('فشل حفظ الفاتورة');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">نقطة تحصيل السكرتارية (POS)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <PatientLookup onSelect={setSelectedPatient} />
        </div>
        <div className="col-span-2">
          <InvoiceBuilder
            patient={selectedPatient}
            clinicId={clinicId}
            onSave={handleSaveInvoice}
          />
        </div>
      </div>
    </div>
  );
};

export default POSPage;
