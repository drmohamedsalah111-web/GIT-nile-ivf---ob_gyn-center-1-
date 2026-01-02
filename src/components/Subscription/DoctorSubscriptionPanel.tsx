import React, { useState } from 'react';
import { 
  Calendar, CreditCard, AlertTriangle, CheckCircle, 
  Clock, Shield, ChevronRight 
} from 'lucide-react';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { PricingPlans } from './PricingPlans';
import { SubscriptionPlan } from '../../types/subscription';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Reuse the type or define a simpler one for the doctor view
interface DoctorSubscription {
  id: string;
  status: string;
  end_date: string;
  plan_id: string;
  subscription_plans?: {
    display_name_ar: string;
    monthly_price: number;
    features: string[];
  };
}

interface DoctorSubscriptionPanelProps {
  subscription: DoctorSubscription | null;
  plans: SubscriptionPlan[];
  onSubscribe: (plan: SubscriptionPlan) => void;
  loading: boolean;
}

export const DoctorSubscriptionPanel: React.FC<DoctorSubscriptionPanelProps> = ({
  subscription,
  plans,
  onSubscribe,
  loading
}) => {
  const [showPlans, setShowPlans] = useState(!subscription);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">جاري تحميل بيانات الاشتراك...</div>;
  }

  // If no subscription or user wants to see plans
  if (showPlans || !subscription) {
    return (
      <div className="space-y-6">
        {subscription && (
          <button 
            onClick={() => setShowPlans(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors mb-4"
          >
            <ChevronRight className="w-5 h-5" />
            العودة لاشتراكي الحالي
          </button>
        )}
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">اختر خطة الاشتراك المناسبة</h2>
          <p className="text-gray-500">جميع الخطط تشمل الدعم الفني والتحديثات المجانية</p>
        </div>

        <PricingPlans 
          plans={plans} 
          userRole="doctor"
          currentPlanId={subscription?.plan_id}
          onSelectPlan={onSubscribe}
        />
      </div>
    );
  }

  // Active Subscription View
  const daysRemaining = Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-t-4 border-purple-600">
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">اشتراكي الحالي</h2>
              <p className="text-gray-500">تفاصيل الباقة وصلاحية الحساب</p>
            </div>
            <SubscriptionStatusBadge status={subscription.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <span className="font-bold text-gray-700">الباقة الحالية</span>
              </div>
              <p className="text-xl font-black text-purple-900">
                {subscription.subscription_plans?.display_name_ar || 'غير محدد'}
              </p>
            </div>

            <div className={`rounded-xl p-6 ${isExpiringSoon || isExpired ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Clock className={`w-6 h-6 ${isExpiringSoon || isExpired ? 'text-red-600' : 'text-green-600'}`} />
                <span className="font-bold text-gray-700">الأيام المتبقية</span>
              </div>
              <p className={`text-xl font-black ${isExpiringSoon || isExpired ? 'text-red-900' : 'text-green-900'}`}>
                {isExpired ? 'منتهي' : `${daysRemaining} يوم`}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-gray-700">تاريخ الانتهاء</span>
              </div>
              <p className="text-xl font-black text-blue-900">
                {format(new Date(subscription.end_date), 'dd MMM yyyy', { locale: ar })}
              </p>
            </div>
          </div>

          {/* Alerts */}
          {isExpiringSoon && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <h4 className="font-bold text-orange-800">اشتراكك سينتهي قريباً</h4>
                <p className="text-sm text-orange-700">يرجى تجديد الاشتراك لضمان استمرار الخدمة وعدم فقدان البيانات.</p>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h4 className="font-bold text-red-800">اشتراكك منتهي</h4>
                <p className="text-sm text-red-700">تم إيقاف بعض الخدمات. يرجى التجديد فوراً لاستعادة كامل الصلاحيات.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 flex justify-end gap-4">
          <button 
            onClick={() => setShowPlans(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isExpired ? 'تجديد الاشتراك الآن' : 'ترقية الباقة / تجديد'}
          </button>
        </div>
      </div>
    </div>
  );
};
