// ============================================================================
// 🎯 SMART SUBSCRIPTION MANAGEMENT - إدارة الاشتراكات الذكية
// ============================================================================

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Plus, Edit, Trash2, DollarSign, Users, Calendar, 
  CheckCircle, XCircle, AlertCircle, TrendingUp, RefreshCw, Package,
  Clock, Settings, Save, Eye, Shield
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { adminAuthService } from '../../services/adminAuthService';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name_ar: string;
  display_name_en: string;
  description_ar: string | null;
  description_en: string | null;
  monthly_price: number;
  yearly_price: number;
  setup_fee: number;
  max_users: number | null;
  max_patients: number | null;
  max_storage_gb: number | null;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

interface ClinicSubscription {
  id: string;
  clinic_id: string;
  plan_id: string;
  status: 'active' | 'trial' | 'expired' | 'suspended' | 'cancelled';
  start_date: string;
  end_date: string;
  paid_amount: number;
  payment_method: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  notes: string | null;
  // Relations
  clinic?: {
    name: string;
    email: string;
    phone: string;
  };
  plan?: SubscriptionPlan;
}

const SmartSubscriptionManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<ClinicSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('subscriptions');
  
  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<ClinicSubscription | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPlans(), loadSubscriptions()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');
    
    if (error) throw error;
    setPlans(data || []);
  };

  const loadSubscriptions = async () => {
    const { data, error } = await supabase
      .from('clinic_subscriptions')
      .select(`
        *,
        clinic:doctors(name, email, phone),
        plan:subscription_plans(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setSubscriptions(data || []);
  };

  // Statistics
  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.is_active).length,
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    trialSubscriptions: subscriptions.filter(s => s.status === 'trial').length,
    expiredSubscriptions: subscriptions.filter(s => s.status === 'expired').length,
    expiringThisWeek: subscriptions.filter(s => {
      if (s.status !== 'active') return false;
      const daysLeft = Math.ceil((new Date(s.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 7;
    }).length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.paid_amount || 0), 0)
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      trial: 'bg-blue-100 text-blue-700',
      expired: 'bg-red-100 text-red-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    
    const labels = {
      active: 'نشط',
      trial: 'تجريبي',
      expired: 'منتهي',
      suspended: 'موقوف',
      cancelled: 'ملغي'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">
                  إدارة الاشتراكات الذكية
                </h1>
                <p className="text-purple-100 text-sm">
                  التحكم الكامل في خطط واشتراكات العيادات
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-bold transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-600 text-sm mb-1">اشتراكات نشطة</p>
                <p className="text-3xl font-black text-gray-900">{stats.activeSubscriptions}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">من إجمالي {stats.totalSubscriptions}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-600 text-sm mb-1">اشتراكات تجريبية</p>
                <p className="text-3xl font-black text-gray-900">{stats.trialSubscriptions}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500">قيد التجربة</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-amber-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-600 text-sm mb-1">تنتهي هذا الأسبوع</p>
                <p className="text-3xl font-black text-gray-900">{stats.expiringThisWeek}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-amber-500" />
            </div>
            <p className="text-xs text-gray-500">يحتاج تجديد</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-r-4 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-600 text-sm mb-1">إجمالي الإيرادات</p>
                <p className="text-2xl font-black text-gray-900">
                  {stats.totalRevenue.toLocaleString('ar-EG')} جنيه
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500">من الاشتراكات النشطة</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex-1 py-4 px-6 font-bold transition-all ${
                activeTab === 'subscriptions'
                  ? 'text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>اشتراكات العيادات ({stats.totalSubscriptions})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex-1 py-4 px-6 font-bold transition-all ${
                activeTab === 'plans'
                  ? 'text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                <span>خطط الاشتراك ({stats.totalPlans})</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'plans' && (
              <PlansManagement 
                plans={plans}
                onRefresh={loadPlans}
              />
            )}
            
            {activeTab === 'subscriptions' && (
              <SubscriptionsManagement
                subscriptions={subscriptions}
                plans={plans}
                onRefresh={loadSubscriptions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for managing subscription plans
const PlansManagement: React.FC<{ plans: SubscriptionPlan[]; onRefresh: () => void }> = ({ plans, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
    
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
      toast.success('تم حذف الخطة بنجاح');
      onRefresh();
    } catch (error: any) {
      toast.error('فشل حذف الخطة: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800">خطط الاشتراك</h2>
        <button
          onClick={() => { setEditingPlan(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة خطة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-2xl ${
              plan.is_popular ? 'border-purple-500' : 'border-gray-200'
            }`}
          >
            {plan.is_popular && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                الأكثر شعبية
              </div>
            )}
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {plan.display_name_ar}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{plan.description_ar}</p>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-black text-purple-600 mb-1">
                  {plan.yearly_price.toLocaleString('ar-EG')} جنيه
                </div>
                <div className="text-sm text-gray-600">سنوياً</div>
                <div className="text-xs text-gray-500 mt-2">
                  أو {plan.monthly_price.toLocaleString('ar-EG')} جنيه/شهر
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">المستخدمين:</span>
                <span className="font-bold">{plan.max_users || 'غير محدود'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">المرضى:</span>
                <span className="font-bold">{plan.max_patients || 'غير محدود'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">التخزين:</span>
                <span className="font-bold">{plan.max_storage_gb} جيجا</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 font-semibold mb-2">المميزات:</p>
              <ul className="space-y-1">
                {plan.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-xs text-purple-600 font-semibold">
                    +{plan.features.length - 3} ميزة أخرى
                  </li>
                )}
              </ul>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>تعديل</span>
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </button>
            </div>

            {!plan.is_active && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                <span className="text-xs text-red-700 font-semibold">خطة معطلة</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <PlanModal
          plan={editingPlan}
          onClose={() => { setShowModal(false); setEditingPlan(null); }}
          onSuccess={() => { setShowModal(false); setEditingPlan(null); onRefresh(); }}
        />
      )}
    </div>
  );
};

// Component for managing clinic subscriptions  
const SubscriptionsManagement: React.FC<{ 
  subscriptions: ClinicSubscription[]; 
  plans: SubscriptionPlan[];
  onRefresh: () => void 
}> = ({ subscriptions, plans, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800">اشتراكات العيادات</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة اشتراك جديد</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <th className="py-4 px-6 text-right font-bold">العيادة</th>
              <th className="py-4 px-6 text-right font-bold">الخطة</th>
              <th className="py-4 px-6 text-right font-bold">الحالة</th>
              <th className="py-4 px-6 text-right font-bold">المبلغ</th>
              <th className="py-4 px-6 text-right font-bold">تاريخ الانتهاء</th>
              <th className="py-4 px-6 text-right font-bold">الأيام المتبقية</th>
              <th className="py-4 px-6 text-right font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const daysLeft = Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
              
              return (
                <tr key={sub.id} className={`border-b hover:bg-purple-50 transition-all ${isExpiringSoon ? 'bg-amber-50' : ''}`}>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-bold text-gray-900">{sub.clinic?.name}</p>
                      <p className="text-xs text-gray-500">{sub.clinic?.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold">
                      {sub.plan?.display_name_ar}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                      sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                      sub.status === 'expired' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.status === 'active' ? 'نشط' :
                       sub.status === 'trial' ? 'تجريبي' :
                       sub.status === 'expired' ? 'منتهي' :
                       sub.status === 'suspended' ? 'موقوف' : 'ملغي'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900">
                    {sub.paid_amount?.toLocaleString('ar-EG') || '0'} جنيه
                  </td>
                  <td className="py-4 px-6 text-gray-700">
                    {new Date(sub.end_date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-bold ${
                      daysLeft < 0 ? 'text-red-600' :
                      daysLeft <= 7 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {daysLeft < 0 ? 'منتهي' : `${daysLeft} يوم`}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-all"
                        title="تجديد"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SubscriptionModal
          plans={plans}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); onRefresh(); }}
        />
      )}
    </div>
  );
};

// Simplified modals - you'll need to complete these
const PlanModal: React.FC<any> = ({ plan, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-black mb-4">
          {plan ? 'تعديل خطة الاشتراك' : 'إضافة خطة جديدة'}
        </h2>
        {/* Add form fields here */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">
            إلغاء
          </button>
          <button onClick={onSuccess} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

const SubscriptionModal: React.FC<any> = ({ plans, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-black mb-4">إضافة اشتراك جديد</h2>
        {/* Add form fields here */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">
            إلغاء
          </button>
          <button onClick={onSuccess} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartSubscriptionManagement;
