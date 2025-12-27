import React from 'react';
import { Clock } from 'lucide-react';

const DoctorQueueCard: React.FC<{ appointment: any }> = ({ appointment }) => {
  const status = appointment.financial_status;

  const isPaid = status === 'paid';
  const isPartial = status === 'credit' || status === 'partial';
  const isPending = status === 'pending';

  return (
    <div className={`p-4 rounded-lg border ${isPaid ? 'bg-green-50 border-green-200' : isPartial ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{appointment.patient?.name || 'مريض غير معروف'}</div>
          <div className="text-sm text-gray-500">{new Date(appointment.scheduled_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>
        </div>

        <div>
          {isPaid && <button className="px-3 py-1 bg-teal-500 text-white rounded">افتح الملف الطبي</button>}
          {isPartial && <button className="px-3 py-1 bg-yellow-500 text-white rounded">جزئياً (تحذير)</button>}
          {isPending && <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded" disabled>غير مدفوع</button>}
        </div>
      </div>
    </div>
  );
};

export default DoctorQueueCard;
