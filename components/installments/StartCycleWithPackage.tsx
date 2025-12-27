import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign } from 'lucide-react';
import installmentsService, { IVFPackage } from '../../services/installmentsService';
import toast from 'react-hot-toast';

interface StartCycleWithPackageProps {
  patientId: string;
  patientName: string;
  onSuccess?: (cycleId: string) => void;
  onCancel?: () => void;
}

export const StartCycleWithPackage: React.FC<StartCycleWithPackageProps> = ({
  patientId,
  patientName,
  onSuccess,
  onCancel
}) => {
  const [packages, setPackages] = useState<IVFPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await installmentsService.getActivePackages();
      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast.error('فشل تحميل الباقات');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCycle = async () => {
    if (!selectedPackage) {
      toast.error('الرجاء اختيار باقة');
      return;
    }

    setCreating(true);
    try {
      // هنا نستورد dbService لإنشاء الدورة
      const { dbService } = await import('../../services/dbService');
      
      // إنشاء دورة جديدة
      const result = await dbService.handleCreateCycle(patientId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const cycleId = result.cycleId;

      // جلب معلومات المريضة للحصول على doctor_id
      const { supabase } = await import('../../services/supabaseClient');
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('doctor_id')
        .eq('id', patientId)
        .single();

      if (patientError || !patient) {
        throw new Error('فشل جلب معلومات المريضة');
      }

      // إنشاء الأقساط للدورة
      const installmentsResult = await installmentsService.createInstallmentsForCycle(
        cycleId,
        patientId,
        patient.doctor_id,
        selectedPackage
      );

      if (!installmentsResult.success) {
        throw installmentsResult.error;
      }

      toast.success('✅ تم إنشاء الدورة والأقساط بنجاح');
      onSuccess?.(cycleId);
    } catch (error: any) {
      console.error('Error starting cycle:', error);
      toast.error('فشل إنشاء الدورة: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            بدء دورة حقن مجهري جديدة
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-800 font-semibold">
              <span className="font-bold">المريضة:</span> {patientName}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">لا توجد باقات متاحة</p>
              <p className="text-sm">يرجى التواصل مع الإدارة لإضافة باقات</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  اختر الباقة:
                </label>
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPackage === pkg.id
                          ? 'border-teal-500 bg-teal-50 shadow-md'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">{pkg.package_name_ar}</h3>
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                          )}
                        </div>
                        <div className="text-left mr-4">
                          <div className="flex items-center gap-1 text-2xl font-bold text-teal-600">
                            <span>{pkg.total_price.toLocaleString('ar-EG')}</span>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-gray-500">{pkg.currency}</span>
                        </div>
                      </div>

                      {/* عرض الأقساط */}
                      {selectedPackage === pkg.id && pkg.default_installments && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">خطة الأقساط:</p>
                          <div className="space-y-2">
                            {pkg.default_installments.map((inst: any, idx: number) => {
                              const amount = (pkg.total_price * inst.percentage) / 100;
                              return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">
                                    {idx + 1}. {inst.name_ar}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {amount.toLocaleString('ar-EG')} ج.م ({inst.percentage}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPkg && (
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-2">ملخص الباقة:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">الإجمالي:</span>
                      <span className="font-bold text-gray-900">
                        {selectedPkg.total_price.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد الأقساط:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedPkg.default_installments?.length || 0} أقساط
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleStartCycle}
            disabled={!selectedPackage || creating}
            className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all ${
              creating || !selectedPackage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الإنشاء...
              </span>
            ) : (
              'بدء الدورة'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartCycleWithPackage;
