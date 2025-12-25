import React, { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInWeeks, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VisitFlowSheetProps {
  visits: any[];
  pregnancyLmp: string;
  onRefresh: () => void;
}

export const VisitFlowSheet: React.FC<VisitFlowSheetProps> = ({
  visits,
  pregnancyLmp,
  onRefresh
}) => {
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  // Calculate GA for a given date
  const calculateGA = (visitDate: string) => {
    if (!pregnancyLmp) return { weeks: 0, days: 0 };
    
    const lmp = parseISO(pregnancyLmp);
    const visit = parseISO(visitDate);
    const totalDays = differenceInDays(visit, lmp);
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    
    return { weeks, days };
  };

  // Weight change indicator
  const getWeightChange = (currentWeight: number, index: number) => {
    if (index === visits.length - 1) return null; // First visit
    
    const previousVisit = visits[index + 1];
    if (!previousVisit?.weight_kg) return null;
    
    const change = currentWeight - previousVisit.weight_kg;
    return change;
  };

  // Check if BP is high
  const isBPHigh = (systolic?: number, diastolic?: number) => {
    return (systolic && systolic > 140) || (diastolic && diastolic > 90);
  };

  if (!visits || visits.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">لا توجد زيارات مسجلة</p>
        <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 mx-auto">
          <Plus size={20} />
          <span>إضافة أول زيارة</span>
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-600">
            <th className="p-3 text-right font-bold text-gray-800 whitespace-nowrap">
              التاريخ<br />
              <span className="text-xs font-normal text-gray-600">Date</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              عمر الحمل<br />
              <span className="text-xs font-normal text-gray-600">GA</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              الوزن (كجم)<br />
              <span className="text-xs font-normal text-gray-600">Weight</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              ضغط الدم<br />
              <span className="text-xs font-normal text-gray-600">BP</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              بروتين البول<br />
              <span className="text-xs font-normal text-gray-600">Albumin</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              سكر البول<br />
              <span className="text-xs font-normal text-gray-600">Sugar</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              الوذمة<br />
              <span className="text-xs font-normal text-gray-600">Edema</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              ارتفاع الرحم<br />
              <span className="text-xs font-normal text-gray-600">Fundal Ht</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              وضع الجنين<br />
              <span className="text-xs font-normal text-gray-600">Presentation</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap">
              نبض الجنين<br />
              <span className="text-xs font-normal text-gray-600">FHS</span>
            </th>
            <th className="p-3 text-center font-bold text-gray-800 whitespace-nowrap print:hidden">
              إجراءات<br />
              <span className="text-xs font-normal text-gray-600">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit, index) => {
            const ga = calculateGA(visit.visit_date);
            const weightChange = visit.weight_kg ? getWeightChange(visit.weight_kg, index) : null;
            const bpHigh = isBPHigh(visit.systolic_bp, visit.diastolic_bp);
            
            return (
              <tr
                key={visit.id}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  index < 3 ? 'bg-blue-50/30' : '' // Highlight last 3 visits
                }`}
              >
                {/* Date */}
                <td className="p-3 font-medium text-gray-900">
                  {format(parseISO(visit.visit_date), 'dd/MM/yyyy', { locale: ar })}
                </td>

                {/* GA */}
                <td className="p-3 text-center">
                  <span className="font-bold text-teal-700">
                    {ga.weeks}w+{ga.days}d
                  </span>
                </td>

                {/* Weight */}
                <td className="p-3 text-center">
                  {visit.weight_kg ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold">{visit.weight_kg}</span>
                      {weightChange !== null && weightChange !== 0 && (
                        <span className={`text-xs flex items-center ${weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {weightChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(weightChange).toFixed(1)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* BP */}
                <td className={`p-3 text-center font-bold ${
                  bpHigh ? 'bg-red-100 text-red-800 border-2 border-red-400' : ''
                }`}>
                  {visit.systolic_bp && visit.diastolic_bp ? (
                    <div className="flex items-center justify-center gap-1">
                      <span>{visit.systolic_bp}/{visit.diastolic_bp}</span>
                      {bpHigh && <AlertTriangle size={14} className="text-red-600" />}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* Urine Albumin */}
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    visit.urine_albuminuria === 'nil' || !visit.urine_albuminuria
                      ? 'bg-green-100 text-green-800'
                      : visit.urine_albuminuria === '+'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {visit.urine_albuminuria || 'Nil'}
                  </span>
                </td>

                {/* Urine Sugar */}
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    visit.urine_glycosuria === 'nil' || !visit.urine_glycosuria
                      ? 'bg-green-100 text-green-800'
                      : visit.urine_glycosuria === '+'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {visit.urine_glycosuria || 'Nil'}
                  </span>
                </td>

                {/* Edema */}
                <td className="p-3 text-center">
                  {visit.edema ? (
                    <span className="text-amber-700 font-bold">{visit.edema_grade || '+'}</span>
                  ) : (
                    <span className="text-green-600">-</span>
                  )}
                </td>

                {/* Fundal Height */}
                <td className="p-3 text-center font-bold text-teal-700">
                  {visit.fundal_height_cm ? `${visit.fundal_height_cm} cm` : '-'}
                </td>

                {/* Presentation */}
                <td className="p-3 text-center text-xs">
                  {ga.weeks >= 28 ? (
                    visit.presentation || (
                      <span className="text-gray-400 italic">Not recorded</span>
                    )
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* FHS */}
                <td className="p-3 text-center">
                  {visit.fetal_heart_sound ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3 text-center print:hidden">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setSelectedVisit(visit)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="تعديل"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
          <div className="text-sm text-teal-700 font-medium">إجمالي الزيارات</div>
          <div className="text-2xl font-bold text-teal-900">{visits.length}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-700 font-medium">آخر وزن مسجل</div>
          <div className="text-2xl font-bold text-purple-900">
            {visits[0]?.weight_kg ? `${visits[0].weight_kg} kg` : '-'}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-700 font-medium">آخر ضغط مسجل</div>
          <div className="text-2xl font-bold text-blue-900">
            {visits[0]?.systolic_bp ? `${visits[0].systolic_bp}/${visits[0].diastolic_bp}` : '-'}
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-sm text-amber-700 font-medium">عمر الحمل الحالي</div>
          <div className="text-2xl font-bold text-amber-900">
            {(() => {
              const ga = calculateGA(new Date().toISOString());
              return `${ga.weeks}w+${ga.days}d`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
