import React from 'react';
import { Check, X, Star, Edit, Trash2 } from 'lucide-react';
import { SubscriptionPlan } from '../../types/subscription';

interface PricingPlansProps {
  plans: SubscriptionPlan[];
  userRole?: 'admin' | 'doctor' | 'receptionist';
  currentPlanId?: string;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  onEditPlan?: (plan: SubscriptionPlan) => void;
  onDeletePlan?: (planId: string) => void;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  plans,
  userRole = 'doctor',
  currentPlanId,
  onSelectPlan,
  onEditPlan,
  onDeletePlan
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
      {plans.map((plan) => {
        const isCurrent = currentPlanId === plan.id;
        
        return (
          <div 
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 border-2 ${
              plan.is_popular ? 'border-purple-500' : 'border-transparent'
            } ${isCurrent ? 'ring-4 ring-green-400' : ''}`}
          >
            {plan.is_popular && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                الأكثر طلباً
              </div>
            )}

            {isCurrent && (
              <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
                الخطة الحالية
              </div>
            )}

            <div className="p-6 text-center border-b border-gray-100">
              <h3 className="text-2xl font-black text-gray-800 mb-2">
                {plan.display_name_ar}
              </h3>
              <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">
                {plan.description_ar}
              </p>
              
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-4xl font-black text-purple-600">
                  {plan.monthly_price}
                </span>
                <span className="text-gray-400 text-sm">ج.م / شهرياً</span>
              </div>
              {plan.yearly_price && (
                <p className="text-xs text-green-600 font-bold">
                  أو {plan.yearly_price} ج.م سنوياً (وفر 20%)
                </p>
              )}
            </div>

            <div className="p-6 bg-gray-50/50">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {userRole === 'admin' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditPlan?.(plan)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => onDeletePlan?.(plan.id)}
                    className="flex items-center justify-center p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectPlan?.(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  {isCurrent ? 'مشترك حالياً' : 'اشترك الآن'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
