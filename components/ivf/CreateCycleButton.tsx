import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface CreateCycleButtonProps {
  patientId: string;
  patientName?: string;
  onSuccess?: (cycleId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const CreateCycleButton: React.FC<CreateCycleButtonProps> = ({
  patientId,
  patientName,
  onSuccess,
  onError,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateCycle = async () => {
    if (!patientId) {
      setMessage({ type: 'error', text: 'رقم المريضة غير صحيح' });
      onError?.('رقم المريضة غير صحيح');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await dbService.handleCreateCycle(patientId);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onSuccess?.(result.cycleId);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error });
        onError?.(result.error);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'حدث خطأ غير متوقع أثناء إنشاء دورة IVF';
      setMessage({ type: 'error', text: errorMsg });
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleCreateCycle}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          bg-blue-600 text-white hover:bg-blue-700 active:scale-95
          ${className}
        `}
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            جاري الإنشاء...
          </>
        ) : (
          <>
            <span>+</span>
            إنشاء دورة IVF جديدة
            {patientName && <span className="text-sm opacity-80">({patientName})</span>}
          </>
        )}
      </button>

      {message && (
        <div
          className={`
            flex items-start gap-3 p-3 rounded-lg text-sm
            ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }
          `}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
