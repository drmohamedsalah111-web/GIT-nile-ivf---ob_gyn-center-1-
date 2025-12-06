import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { AntenatalVisit } from '../../../types';
import { obstetricsService, calculateGestationalAge } from '../../../services/obstetricsService';

interface ANCFlowSheetProps {
  pregnancyId: string;
  lmpDate?: string;
}

const ANCFlowSheet: React.FC<ANCFlowSheetProps> = ({ pregnancyId, lmpDate }) => {
  const [visits, setVisits] = useState<AntenatalVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    systolic_bp: '',
    diastolic_bp: '',
    weight_kg: '',
    urine_albuminuria: 'negative',
    urine_glycosuria: 'negative',
    fetal_heart_sound: true,
    fundal_height_cm: '',
    edema: false,
    edema_grade: 'none',
    notes: '',
    next_visit_date: '',
  });

  useEffect(() => {
    fetchVisits();
  }, [pregnancyId]);

  const fetchVisits = async () => {
    try {
      setIsLoading(true);
      const data = await obstetricsService.getANCVisits(pregnancyId);
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('فشل تحميل سجل الزيارات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVisit = async () => {
    try {
      if (!formData.visit_date) {
        toast.error('تاريخ الزيارة مطلوب');
        return;
      }

      setIsSaving(true);

      const ga = lmpDate ? calculateGestationalAge(formData.visit_date) : { weeks: 0, days: 0 };

      const visitData = {
        visit_date: formData.visit_date,
        pregnancy_id: pregnancyId,
        gestational_age_weeks: ga.weeks,
        gestational_age_days: ga.days,
        systolic_bp: formData.systolic_bp ? parseInt(formData.systolic_bp) : undefined,
        diastolic_bp: formData.diastolic_bp ? parseInt(formData.diastolic_bp) : undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        urine_albuminuria: formData.urine_albuminuria,
        urine_glycosuria: formData.urine_glycosuria,
        fetal_heart_sound: formData.fetal_heart_sound,
        fundal_height_cm: formData.fundal_height_cm ? parseFloat(formData.fundal_height_cm) : undefined,
        edema: formData.edema,
        edema_grade: formData.edema_grade,
        notes: formData.notes,
        next_visit_date: formData.next_visit_date || undefined,
      };

      if (editingId) {
        await obstetricsService.updateANCVisit(editingId, visitData);
        toast.success('تم تحديث الزيارة بنجاح');
      } else {
        await obstetricsService.createANCVisit(visitData);
        toast.success('تم إضافة الزيارة بنجاح');
      }

      fetchVisits();
      resetForm();
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error('فشل حفظ الزيارة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الزيارة؟')) return;

    try {
      await obstetricsService.deleteANCVisit(visitId);
      toast.success('تم حذف الزيارة بنجاح');
      fetchVisits();
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('فشل حذف الزيارة');
    }
  };

  const handleEditVisit = (visit: AntenatalVisit) => {
    setFormData({
      visit_date: visit.visit_date,
      systolic_bp: visit.systolic_bp?.toString() || '',
      diastolic_bp: visit.diastolic_bp?.toString() || '',
      weight_kg: visit.weight_kg?.toString() || '',
      urine_albuminuria: visit.urine_albuminuria || 'negative',
      urine_glycosuria: visit.urine_glycosuria || 'negative',
      fetal_heart_sound: visit.fetal_heart_sound ?? true,
      fundal_height_cm: visit.fundal_height_cm?.toString() || '',
      edema: visit.edema || false,
      edema_grade: visit.edema_grade || 'none',
      notes: visit.notes || '',
      next_visit_date: visit.next_visit_date || '',
    });
    setEditingId(visit.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      visit_date: new Date().toISOString().split('T')[0],
      systolic_bp: '',
      diastolic_bp: '',
      weight_kg: '',
      urine_albuminuria: 'negative',
      urine_glycosuria: 'negative',
      fetal_heart_sound: true,
      fundal_height_cm: '',
      edema: false,
      edema_grade: 'none',
      notes: '',
      next_visit_date: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const chartData = visits
    .slice()
    .reverse()
    .map(visit => ({
      date: new Date(visit.visit_date).toLocaleDateString('ar-EG'),
      weight: visit.weight_kg || 0,
      systolic: visit.systolic_bp || 0,
      diastolic: visit.diastolic_bp || 0,
    }))
    .filter(d => d.weight > 0 || d.systolic > 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6" dir="ltr">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 font-[Tajawal]">📋 ANC Flowsheet</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          Add Visit
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-teal-200" dir="ltr">
          <div className="grid md:grid-cols-2 gap-4 mb-4 text-left">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visit Date
              </label>
              <input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Systolic BP (mmHg)
              </label>
              <input
                type="number"
                value={formData.systolic_bp}
                onChange={(e) => setFormData(prev => ({ ...prev, systolic_bp: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Diastolic BP (mmHg)
              </label>
              <input
                type="number"
                value={formData.diastolic_bp}
                onChange={(e) => setFormData(prev => ({ ...prev, diastolic_bp: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Urine Albuminuria
              </label>
              <select
                value={formData.urine_albuminuria}
                onChange={(e) => setFormData(prev => ({ ...prev, urine_albuminuria: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
              >
                <option value="negative">سالب</option>
                <option value="trace">أثر</option>
                <option value="1plus">+1</option>
                <option value="2plus">+2</option>
                <option value="3plus">+3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Urine Glycosuria
              </label>
              <select
                value={formData.urine_glycosuria}
                onChange={(e) => setFormData(prev => ({ ...prev, urine_glycosuria: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
              >
                <option value="negative">سالب</option>
                <option value="trace">أثر</option>
                <option value="1plus">+1</option>
                <option value="2plus">+2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fundal Height (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.fundal_height_cm}
                onChange={(e) => setFormData(prev => ({ ...prev, fundal_height_cm: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Next Visit Date
              </label>
              <input
                type="date"
                value={formData.next_visit_date}
                onChange={(e) => setFormData(prev => ({ ...prev, next_visit_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fetal_heart_sound}
                onChange={(e) => setFormData(prev => ({ ...prev, fetal_heart_sound: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Fetal Heart Sound (FHS) Detected</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.edema}
                onChange={(e) => setFormData(prev => ({ ...prev, edema: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Edema Present</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Clinical Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-[Tajawal]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddVisit}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : editingId ? 'Update Visit' : 'Add Visit'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg" dir="ltr">
          <h3 className="text-sm font-bold text-gray-900 mb-4">📈 Weight & BP Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#14b8a6" name="Weight (kg)" />
              <Line yAxisId="right" type="monotone" dataKey="systolic" stroke="#dc2626" name="Systolic BP (mmHg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : visits.length > 0 ? (
        <div className="overflow-x-auto" dir="ltr">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Visit Date</th>
                <th className="px-4 py-2">GA (wks+days)</th>
                <th className="px-4 py-2">Weight (kg)</th>
                <th className="px-4 py-2">BP (mmHg)</th>
                <th className="px-4 py-2">Urine Alb</th>
                <th className="px-4 py-2">Fundal Height (cm)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {new Date(visit.visit_date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-4 py-2">
                    {visit.gestational_age_weeks}w+{visit.gestational_age_days}d
                  </td>
                  <td className="px-4 py-2">{visit.weight_kg || '-'}</td>
                  <td className="px-4 py-2">
                    {visit.systolic_bp && visit.diastolic_bp
                      ? `${visit.systolic_bp}/${visit.diastolic_bp}`
                      : '-'}
                  </td>
                  <td className="px-4 py-2">{visit.urine_albuminuria || '-'}</td>
                  <td className="px-4 py-2">{visit.fundal_height_cm || '-'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEditVisit(visit)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No visits recorded yet</p>
      )}
    </div>
  );
};

export default ANCFlowSheet;
