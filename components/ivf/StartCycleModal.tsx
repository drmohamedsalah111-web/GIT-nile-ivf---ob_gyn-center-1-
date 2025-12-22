import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { dbService } from '../../services/dbService';

interface StartCycleModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onCycleCreated?: (cycleId: string) => void;
}

export const StartCycleModal: React.FC<StartCycleModalProps> = ({
  isOpen,
  patientId,
  patientName,
  onClose,
  onCycleCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateCycle = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await dbService.handleCreateCycle(patientId);

      if (result.success) {
        setSuccess(true);
        onCycleCreated?.(result.cycleId);
        
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">إنشاء دورة IVF جديدة</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-center text-green-700 font-semibold">
                تم إنشاء دورة IVF بنجاح!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">اسم المريضة: </span>
                  <span>{patientName}</span>
                </p>
              </div>

              <p className="text-gray-600 text-sm">
                سيتم إنشاء دورة IVF جديدة للمريضة مع تعيينها للطبيب المسؤول عنها.
                سيتم تعيين البروتوكول الافتراضي (Antagonist) ويمكن تعديله لاحقاً.
              </p>

              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">خطأ</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 p-6 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleCreateCycle}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
