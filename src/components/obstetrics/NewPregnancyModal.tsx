import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { addDays } from 'date-fns';
import { obstetricsService } from '../../../services/obstetricsService';

interface NewPregnancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: () => void;
}

export const NewPregnancyModal: React.FC<NewPregnancyModalProps> = ({ isOpen, onClose, patientId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lmp_date: '',
    edd_date: '',
    edd_by_scan: '',
    risk_level: 'low',
    notes: ''
  });

  if (!isOpen) return null;

  const handleLMPChange = (date: string) => {
    const lmp = new Date(date);
    const edd = addDays(lmp, 280);
    setFormData({
      ...formData,
      lmp_date: date,
      edd_date: edd.toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await obstetricsService.createPregnancy({
        patient_id: patientId,
        lmp_date: formData.lmp_date || null,
        edd_date: formData.edd_date || null,
        edd_by_scan: formData.edd_by_scan || null,
        risk_level: formData.risk_level as 'low' | 'moderate' | 'high',
        risk_factors: [],
        aspirin_prescribed: false,
        thromboprophylaxis_needed: false
      });

      toast.success('تم بدء متابعة الحمل بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating pregnancy:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">بدء متابعة حمل جديدة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ آخر دورة (LMP)</label>
            <input
              type="date"
              value={formData.lmp_date}
              onChange={e => handleLMPChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">موعد الولادة المتوقع (EDD)</label>
            <input
              type="date"
              value={formData.edd_date}
              onChange={e => setFormData({...formData, edd_date: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly={!!formData.lmp_date}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">أو</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">موعد الولادة بالسونار</label>
            <input
              type="date"
              value={formData.edd_by_scan}
              onChange={e => setFormData({...formData, edd_by_scan: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مستوى الخطورة</label>
            <select
              value={formData.risk_level}
              onChange={e => setFormData({...formData, risk_level: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="low">منخفض</option>
              <option value="moderate">متوسط</option>
              <option value="high">عالي</option>
            </select>
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
              {loading ? 'جاري الحفظ...' : 'بدء المتابعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
