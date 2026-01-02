// ============================================================================
// 🎯 SMART SUBSCRIPTION MANAGEMENT - إدارة الاشتراكات الذكية
// ============================================================================

import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import { AdminSubscriptionPanel, AdminSubscription } from '../../src/components/Subscription/AdminSubscriptionPanel';
import { DoctorSubscriptionPanel } from '../../src/components/Subscription/DoctorSubscriptionPanel';
import { SubscriptionPlan } from '../../src/types/subscription';
import { Loader2 } from 'lucide-react';

const SmartSubscriptionManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'doctor' | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  
  // Admin Data
  const [allSubscriptions, setAllSubscriptions] = useState<AdminSubscription[]>([]);
  
  // Doctor Data
  const [mySubscription, setMySubscription] = useState<any>(null);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    setLoading(true);
    try {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Check Role from Doctors table
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('role, id')
        .eq('user_id', user.id) // Assuming user_id links to auth.users
        .or(`email.eq.${user.email}`) // Fallback check by email
        .single();

      if (doctorError && doctorError.code !== 'PGRST116') {
        console.error('Error fetching doctor role:', doctorError);
      }

      const role = doctorData?.role === 'admin' ? 'admin' : 'doctor';
      setUserRole(role);

      // 3. Load Plans (Common)
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      setPlans(plansData || []);

      // 4. Load Specific Data
      if (role === 'admin') {
        await loadAdminData();
      } else {
        if (doctorData?.id) {
          await loadDoctorData(doctorData.id);
        }
      }

    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    const { data, error } = await supabase
      .from('clinic_subscriptions')
      .select(`
        *,
        doctors!clinic_id(full_name, email, phone),
        subscription_plans!plan_id(display_name_ar, monthly_price)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading admin subscriptions:', error);
      toast.error('فشل تحميل قائمة الاشتراكات');
    } else {
      setAllSubscriptions(data || []);
    }
  };

  const loadDoctorData = async (clinicId: string) => {
    const { data, error } = await supabase
      .from('clinic_subscriptions')
      .select(`
        *,
        subscription_plans!plan_id(*)
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading subscription:', error);
    } else {
      setMySubscription(data);
    }
  };

  // Actions
  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clinic_subscriptions')
        .update({ 
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year default
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('تم تفعيل الاشتراك بنجاح');
      loadAdminData();
    } catch (error) {
      toast.error('فشل تفعيل الاشتراك');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رفض هذا الاشتراك؟')) return;
    
    try {
      const { error } = await supabase
        .from('clinic_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('تم رفض الاشتراك');
      loadAdminData();
    } catch (error) {
      toast.error('فشل رفض الاشتراك');
    }
  };

  const handleExtend = async (id: string, days: number) => {
    // Implementation for extension modal would go here
    toast.success('سيتم إضافة ميزة التمديد قريباً');
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get clinic ID
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('email', user.email) // Safer to use email if user_id might be missing in old records
        .single();

      if (!doctor) {
        toast.error('لم يتم العثور على بيانات العيادة');
        return;
      }

      const { error } = await supabase.from('clinic_subscriptions').insert({
        clinic_id: doctor.id,
        plan_id: plan.id,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paid_amount: 0
      });

      if (error) throw error;
      
      toast.success('تم إرسال طلب الاشتراك بنجاح');
      loadDoctorData(doctor.id);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الاشتراك');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500 font-medium">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-black text-gray-900">
            {userRole === 'admin' ? 'لوحة تحكم الاشتراكات' : 'إدارة اشتراكي'}
          </h1>
          <p className="text-gray-500 mt-1">
            {userRole === 'admin' 
              ? 'إدارة ومتابعة جميع اشتراكات العيادات في النظام' 
              : 'تابع حالة اشتراكك وقم بتجديد الباقة بسهولة'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {userRole === 'admin' ? (
          <AdminSubscriptionPanel 
            subscriptions={allSubscriptions}
            onApprove={handleApprove}
            onReject={handleReject}
            onExtend={handleExtend}
            loading={loading}
          />
        ) : (
          <DoctorSubscriptionPanel 
            subscription={mySubscription}
            plans={plans}
            onSubscribe={handleSubscribe}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default SmartSubscriptionManagement;
