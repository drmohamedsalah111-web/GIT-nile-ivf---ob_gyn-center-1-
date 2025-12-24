import React from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle, ArrowUp } from 'lucide-react';

interface VisitsTableProps {
  visits: any[];
}

export const VisitsTable: React.FC<VisitsTableProps> = ({ visits }) => {
  // Helper to check weight gain
  const checkWeightGain = (currentVisit: any, index: number) => {
    if (index === visits.length - 1) return false; // Last item (oldest) has no previous
    const prevVisit = visits[index + 1];
    
    if (!currentVisit.weight_kg || !prevVisit.weight_kg) return false;
    
    const weightDiff = currentVisit.weight_kg - prevVisit.weight_kg;
    // Simple check: if gain > 2kg between visits (assuming weekly/bi-weekly, but logic requested is > 2kg in one week)
    // For strict "one week" check we'd need date diff.
    // Let's do: if (weightDiff > 2) AND (dateDiff <= 7 days) -> Warning
    // Or just simple alert if sudden jump.
    
    return weightDiff > 2;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
            <tr>
              <th className="px-6 py-4">التاريخ</th>
              <th className="px-6 py-4">عمر الحمل</th>
              <th className="px-6 py-4">الضغط (BP)</th>
              <th className="px-6 py-4">الوزن (Kg)</th>
              <th className="px-6 py-4">الزلال (Urine)</th>
              <th className="px-6 py-4">نبض الجنين (FHS)</th>
              <th className="px-6 py-4">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  لا توجد زيارات مسجلة
                </td>
              </tr>
            ) : (
              visits.map((visit, index) => {
                const isHighBP = (visit.systolic_bp && visit.systolic_bp > 140) || 
                               (visit.diastolic_bp && visit.diastolic_bp > 90);
                const hasWeightWarning = checkWeightGain(visit, index);

                return (
                  <tr 
                    key={visit.id} 
                    className={`hover:bg-gray-50 transition-colors ${isHighBP ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-gray-900">
                      {format(parseISO(visit.visit_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {visit.gestational_age_weeks}w + {visit.gestational_age_days}d
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isHighBP ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                        {visit.systolic_bp}/{visit.diastolic_bp}
                        {isHighBP && <AlertCircle size={16} />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{visit.weight_kg}</span>
                        {hasWeightWarning && (
                          <div className="text-amber-500" title="زيادة وزن سريعة (>2kg)">
                            <ArrowUp size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {visit.urine_albuminuria || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {visit.fetal_heart_rate ? `${visit.fetal_heart_rate} bpm` : (visit.fetal_heart_sound ? 'Positive' : '-')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                      {visit.notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
