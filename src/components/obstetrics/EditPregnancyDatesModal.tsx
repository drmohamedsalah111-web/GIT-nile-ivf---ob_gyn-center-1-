import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, AlertCircle } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { obstetricsService } from '../../../services/obstetricsService';

interface EditPregnancyDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pregnancyId: string;
  currentLmpDate?: string | null;
  currentEddDate?: string | null;
  currentEddByScan?: string | null;
  onSuccess?: () => void;
}

export const EditPregnancyDatesModal: React.FC<EditPregnancyDatesModalProps> = ({
  isOpen,
  onClose,
  pregnancyId,
  currentLmpDate,
  currentEddDate,
  currentEddByScan,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lmp_date: '',
    edd_date: '',
    edd_by_scan: ''
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        lmp_date: currentLmpDate ? currentLmpDate.slice(0, 10) : '',
        edd_date: currentEddDate ? currentEddDate.slice(0, 10) : '',
        edd_by_scan: currentEddByScan ? currentEddByScan.slice(0, 10) : ''
      });
    }
  }, [isOpen, currentLmpDate, currentEddDate, currentEddByScan]);

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

  const handleEDDChange = (date: string) => {
    const edd = new Date(date);
    const lmp = addDays(edd, -280);
    setFormData({
      ...formData,
      lmp_date: lmp.toISOString().split('T')[0],
      edd_date: date
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lmp_date) {
      toast.error('يرجى إدخال تاريخ آخر دورة');
      return;
    }

    setLoading(true);
    try {
      await obstetricsService.updatePregnancy(pregnancyId, {
        lmp_date: formData.lmp_date,
        edd_date: formData.edd_date,
        edd_by_scan: formData.edd_by_scan || undefined
      });
      
      toast.success('تم تحديث تاريخ آخر دورة بنجاح');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating pregnancy dates:', error);
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 font-[Tajawal]">تعديل تاريخ آخر دورة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 font-[Tajawal]">
              <p className="font-bold mb-1">تنبيه مهم</p>
              <p>تعديل تاريخ آخر دورة سيؤثر على حساب عمر الحمل وتاريخ الولادة المتوقع</p>
            </div>
          </div>

          {/* Current Values Display */}
          {currentLmpDate && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-[Tajawal]">
                التاريخ الحالي: <span className="font-bold text-gray-900">{format(parseISO(currentLmpDate), 'yyyy-MM-dd')}</span>
              </p>
            </div>
          )}

          {/* LMP Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
              <Calendar className="w-4 h-4 inline-block ml-1" />
              تاريخ آخر دورة (LMP) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.lmp_date}
              onChange={e => handleLMPChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500 font-[Tajawal]">
              سيتم حساب تاريخ الولادة المتوقع تلقائياً (LMP + 280 يوم)
            </p>
          </div>

          {/* EDD Date (auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
              تاريخ الولادة المتوقع (EDD) - محسوب تلقائياً
            </label>
            <input
              type="date"
              value={formData.edd_date}
              onChange={e => handleEDDChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500 font-[Tajawal]">
              يمكنك تعديل EDD وسيتم حساب LMP تلقائياً
            </p>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-[Tajawal]">أو حسب السونار</span>
            </div>
          </div>

          {/* EDD by Scan (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
              تاريخ الولادة المتوقع بالسونار (اختياري)
            </label>
            <input
              type="date"
              value={formData.edd_by_scan}
              onChange={e => setFormData({...formData, edd_by_scan: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500 font-[Tajawal]">
              تاريخ الولادة المحدد بالسونار (إذا كان مختلفاً عن الحساب)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-[Tajawal] font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-[Tajawal] font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPregnancyDatesModal;
