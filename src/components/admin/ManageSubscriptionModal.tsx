// ============================================================================
// 🎯 MANAGE SUBSCRIPTION MODAL - إدارة الاشتراكات
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clinicId: string;
  clinicName: string;
  currentSubscription?: {
    id: string;
    status: string;
    plan_id: string;
    plan_name: string;
    start_date: string;
    end_date: string;
    paid_amount: number;
  } | null;
}

interface Plan {
  id: string;
  display_name_ar: string;
  monthly_price: number;
  duration_months: number;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
  clinicId,
  clinicName,
  currentSubscription,
  onSuccess
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_id: '',
    status: 'active',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    duration_months: 12,
    paid_amount: 0,
    payment_method: 'cash'
  });

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      if (currentSubscription) {
        // Edit mode
        setFormData({
          plan_id: currentSubscription.plan_id || '',
          status: currentSubscription.status,
          start_date: currentSubscription.start_date ? format(new Date(currentSubscription.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          duration_months: 12,
          paid_amount: currentSubscription.paid_amount || 0,
          payment_method: 'cash'
        });
      } else {
        // Create mode - reset
        setFormData({
          plan_id: '',
          status: 'active',
          start_date: format(new Date(), 'yyyy-MM-dd'),
          duration_months: 12,
          paid_amount: 0,
          payment_method: 'cash'
        });
      }
    }
  }, [isOpen, currentSubscription]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, display_name_ar, monthly_price, duration_months')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
      
      // Auto-select first plan if creating new
      if (!currentSubscription && data && data.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          plan_id: data[0].id,
          paid_amount: data[0].monthly_price * (prev.duration_months || 12)
        }));
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('فشل تحميل الباقات');
    }
  };

  const calculateEndDate = () => {
    const start = new Date(formData.start_date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + formData.duration_months);
    return end.toISOString();
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        plan_id: planId,
        paid_amount: selectedPlan.monthly_price * prev.duration_months
      }));
    }
  };

  const handleDurationChange = (months: number) => {
    const selectedPlan = plans.find(p => p.id === formData.plan_id);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        duration_months: months,
        paid_amount: selectedPlan.monthly_price * months
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plan_id) {
      toast.error('يجب اختيار الباقة');
      return;
    }

    try {
      setLoading(true);

      const subscriptionData = {
        clinic_id: clinicId,
        plan_id: formData.plan_id,
        status: formData.status,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: calculateEndDate(),
        paid_amount: formData.paid_amount,
        payment_method: formData.payment_method,
        updated_at: new Date().toISOString()
      };

      if (currentSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('clinic_subscriptions')
          .update(subscriptionData)
          .eq('id', currentSubscription.id);

        if (error) throw error;
        toast.success('تم تحديث الاشتراك بنجاح ✓');
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('clinic_subscriptions')
          .insert({
            ...subscriptionData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('تم إنشاء الاشتراك بنجاح ✓');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error managing subscription:', error);
      toast.error(error.message || 'فشلت العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!currentSubscription) return;

    try {
      setLoading(true);
      
      const newStartDate = new Date();
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + formData.duration_months);

      const { error } = await supabase
        .from('clinic_subscriptions')
        .update({
          status: 'active',
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;
      
      toast.success('تم تجديد الاشتراك بنجاح ✓');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast.error('فشل تجديد الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription) return;
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('clinic_subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;
      
      toast.success('تم إلغاء الاشتراك');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('فشل إلغاء الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPlan = plans.find(p => p.id === formData.plan_id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-xl font-black text-white">
              {currentSubscription ? 'تعديل الاشتراك' : 'إنشاء اشتراك جديد'}
            </h3>
            <p className="text-purple-100 text-sm mt-1">{clinicName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Plan Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Package className="w-4 h-4" />
              الباقة
            </label>
            <select
              value={formData.plan_id}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            >
              <option value="">اختر الباقة</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.display_name_ar} - {plan.monthly_price.toLocaleString()} ج.م/شهر
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              المدة (بالأشهر)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 12, 24].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => handleDurationChange(months)}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    formData.duration_months === months
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {months} شهر
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">حالة الاشتراك</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            >
              <option value="active">نشط</option>
              <option value="suspended">قيد المراجعة</option>
              <option value="expired">منتهي</option>
              <option value="trial">تجريبي</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">تاريخ البدء</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Payment Amount */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              المبلغ المدفوع (ج.م)
            </label>
            <input
              type="number"
              value={formData.paid_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: Number(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">طريقة الدفع</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="cash">كاش</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit_card">بطاقة ائتمان</option>
              <option value="vodafone_cash">فودافون كاش</option>
            </select>
          </div>

          {/* Summary */}
          {selectedPlan && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                ملخص الاشتراك
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">الباقة:</span>
                  <span className="font-bold text-purple-900">{selectedPlan.display_name_ar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">المدة:</span>
                  <span className="font-bold text-purple-900">{formData.duration_months} شهر</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">تاريخ البدء:</span>
                  <span className="font-bold text-purple-900">
                    {format(new Date(formData.start_date), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">تاريخ الانتهاء:</span>
                  <span className="font-bold text-purple-900">
                    {format(new Date(calculateEndDate()), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="text-purple-700">الإجمالي:</span>
                  <span className="font-black text-purple-900 text-lg">
                    {formData.paid_amount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {currentSubscription && (
              <>
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تجديد الاشتراك
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء الاشتراك
                </button>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {currentSubscription ? 'حفظ التعديلات' : 'إنشاء الاشتراك'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
