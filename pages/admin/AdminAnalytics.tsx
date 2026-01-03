import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Building2, CreditCard, DollarSign, Activity, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface Stats {
  totalClinics: number;
  activeClinics: number;
  totalDoctors: number;
  totalSecretaries: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  newClinicsThisMonth: number;
}

const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalClinics: 0,
    activeClinics: 0,
    totalDoctors: 0,
    totalSecretaries: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0,
    newClinicsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // جلب بيانات الأطباء والسكرتارية
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('*');
      
      if (doctorsError) throw doctorsError;

      // الدكاترة فقط (كل دكتور = عيادة)
      const doctorsList = doctors?.filter(d => d.user_role === 'doctor') || [];
      const totalClinics = doctorsList.length;
      const activeClinics = doctorsList.filter(d => d.is_active !== false).length;
      const totalDoctors = doctorsList.length;
      const totalSecretaries = doctors?.filter(d => d.user_role === 'secretary').length || 0;

      // حساب العيادات الجديدة هذا الشهر
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newClinicsThisMonth = doctors?.filter(d => {
        const createdAt = new Date(d.created_at);
        return createdAt >= firstDayOfMonth;
      }).length || 0;

      // جلب بيانات الاشتراكات
      const { data: subscriptions, error: subsError } = await supabase
        .from('clinic_subscriptions')
        .select('*');

      if (subsError) throw subsError;

      const totalSubscriptions = subscriptions?.length || 0;
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
      const expiredSubscriptions = subscriptions?.filter(s => s.status === 'expired').length || 0;

      // حساب الإيرادات (افتراضي بناءً على الاشتراكات النشطة)
      const totalRevenue = activeSubscriptions * 9999; // متوسط سعر الاشتراك

      setStats({
        totalClinics,
        activeClinics,
        totalDoctors,
        totalSecretaries,
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        newClinicsThisMonth
      });
    } catch (err: any) {
      toast.error('فشل تحميل الإحصائيات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي العيادات',
      value: stats.totalClinics,
      icon: Building2,
      color: 'bg-blue-500',
      change: `+${stats.newClinicsThisMonth} هذا الشهر`
    },
    {
      title: 'العيادات النشطة',
      value: stats.activeClinics,
      icon: Activity,
      color: 'bg-green-500',
      change: `${Math.round((stats.activeClinics / stats.totalClinics) * 100)}% من الإجمالي`
    },
    {
      title: 'الأطباء',
      value: stats.totalDoctors,
      icon: Users,
      color: 'bg-teal-500',
      change: `${stats.totalSecretaries} سكرتيرة`
    },
    {
      title: 'الاشتراكات النشطة',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: 'bg-purple-500',
      change: `${stats.expiredSubscriptions} منتهية`
    },
    {
      title: 'إجمالي الإيرادات',
      value: `₪${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: 'تقديري'
    },
    {
      title: 'نسبة النمو',
      value: `${stats.newClinicsThisMonth > 0 ? '+' : ''}${Math.round((stats.newClinicsThisMonth / (stats.totalClinics || 1)) * 100)}%`,
      icon: TrendingUp,
      color: 'bg-pink-500',
      change: 'هذا الشهر'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-[Tajawal]">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-800">التقارير والإحصائيات</h1>
      </div>

      {/* إحصائيات رئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                <span className="text-xs text-gray-500">{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* رسوم بيانية - قريباً */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-600" />
          الرسوم البيانية التفصيلية
        </h2>
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">الرسوم البيانية التفاعلية قريباً...</p>
          <p className="text-sm">سيتم إضافة رسوم بيانية تفصيلية لنمو العيادات والإيرادات</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
