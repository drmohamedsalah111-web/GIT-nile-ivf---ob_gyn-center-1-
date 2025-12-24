import React, { useState } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { db } from '../../hooks/usePowerSync';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface NewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  pregnancyId: string;
}

export const NewVisitModal: React.FC<NewVisitModalProps> = ({ isOpen, onClose, pregnancyId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    gestational_age_weeks: '',
    gestational_age_days: '',
    systolic_bp: '',
    diastolic_bp: '',
    weight_kg: '',
    urine_albuminuria: '',
    fetal_heart_rate: '',
    notes: '',
    // Biometry
    bpd_mm: '',
    fl_mm: '',
    ac_mm: '',
    efw_grams: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const visitId = uuidv4();
      
      // Insert Visit
      await db.execute(
        `INSERT INTO antenatal_visits (
          id, pregnancy_id, visit_date, gestational_age_weeks, gestational_age_days,
          systolic_bp, diastolic_bp, weight_kg, urine_albuminuria, fetal_heart_rate, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          visitId,
          pregnancyId,
          formData.visit_date,
          parseInt(formData.gestational_age_weeks) || 0,
          parseInt(formData.gestational_age_days) || 0,
          parseInt(formData.systolic_bp) || null,
          parseInt(formData.diastolic_bp) || null,
          parseFloat(formData.weight_kg) || null,
          formData.urine_albuminuria,
          parseInt(formData.fetal_heart_rate) || null,
          formData.notes,
          new Date().toISOString()
        ]
      );

      // Insert Biometry if data exists
      if (formData.bpd_mm || formData.fl_mm || formData.ac_mm) {
        await db.execute(
          `INSERT INTO biometry_scans (
            id, pregnancy_id, scan_date, gestational_age_weeks, gestational_age_days,
            bpd_mm, fl_mm, ac_mm, efw_grams, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            pregnancyId,
            formData.visit_date,
            parseInt(formData.gestational_age_weeks) || 0,
            parseInt(formData.gestational_age_days) || 0,
            parseFloat(formData.bpd_mm) || null,
            parseFloat(formData.fl_mm) || null,
            parseFloat(formData.ac_mm) || null,
            parseInt(formData.efw_grams) || null,
            new Date().toISOString()
          ]
        );
      }

      toast.success('تم حفظ الزيارة بنجاح');
      onClose();
      setFormData({
        visit_date: new Date().toISOString().split('T')[0],
        gestational_age_weeks: '',
        gestational_age_days: '',
        systolic_bp: '',
        diastolic_bp: '',
        weight_kg: '',
        urine_albuminuria: '',
        fetal_heart_rate: '',
        notes: '',
        bpd_mm: '',
        fl_mm: '',
        ac_mm: '',
        efw_grams: ''
      });
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">تسجيل زيارة جديدة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الزيارة</label>
              <input
                type="date"
                required
                value={formData.visit_date}
                onChange={e => setFormData({...formData, visit_date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">عمر الحمل (أسابيع)</label>
                <input
                  type="number"
                  value={formData.gestational_age_weeks}
                  onChange={e => setFormData({...formData, gestational_age_weeks: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Weeks"
                />
              </div>
              <div className="w-20">
                <label className="block text-sm font-medium text-gray-700 mb-1">أيام</label>
                <input
                  type="number"
                  max="6"
                  value={formData.gestational_age_days}
                  onChange={e => setFormData({...formData, gestational_age_days: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Days"
                />
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-teal-600" />
              العلامات الحيوية
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الضغط (Systolic)</label>
                <input
                  type="number"
                  value={formData.systolic_bp}
                  onChange={e => setFormData({...formData, systolic_bp: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الضغط (Diastolic)</label>
                <input
                  type="number"
                  value={formData.diastolic_bp}
                  onChange={e => setFormData({...formData, diastolic_bp: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الوزن (Kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={e => setFormData({...formData, weight_kg: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">نبض الجنين (bpm)</label>
                <input
                  type="number"
                  value={formData.fetal_heart_rate}
                  onChange={e => setFormData({...formData, fetal_heart_rate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="140"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">تحليل البول (Albumin)</label>
              <select
                value={formData.urine_albuminuria}
                onChange={e => setFormData({...formData, urine_albuminuria: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">اختر...</option>
                <option value="Nil">Nil</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>
          </div>

          {/* Quick Ultrasound */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Calculator size={18} className="text-blue-600" />
              قياسات السونار (اختياري)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">BPD (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bpd_mm}
                  onChange={e => setFormData({...formData, bpd_mm: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">FL (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fl_mm}
                  onChange={e => setFormData({...formData, fl_mm: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">AC (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ac_mm}
                  onChange={e => setFormData({...formData, ac_mm: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">EFW (g)</label>
                <input
                  type="number"
                  value={formData.efw_grams}
                  onChange={e => setFormData({...formData, efw_grams: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'جاري الحفظ...' : 'حفظ الزيارة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
