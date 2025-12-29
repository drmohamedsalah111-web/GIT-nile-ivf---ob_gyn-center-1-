import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Package, Calendar } from 'lucide-react';
import { financialAnalyticsService } from '../../src/services/financialAnalyticsService';
import { supabase } from '../../services/supabaseClient';

const AdvancedFinancialDashboard: React.FC = () => {
    const [doctorId, setDoctorId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Analytics data states
    const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [topServices, setTopServices] = useState<any[]>([]);
    const [growthData, setGrowthData] = useState<any>(null);

    useEffect(() => {
        initializeDashboard();
    }, []);

    useEffect(() => {
        if (doctorId && dateRange.start && dateRange.end) {
            loadAnalytics();
        }
    }, [doctorId, dateRange]);

    const initializeDashboard = async () => {
        // Get doctor ID
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
            const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', user.user.id).single();
            if (doctor?.id) {
                setDoctorId(doctor.id);

                // Set default date range (last 30 days)
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                });
            }
        }
    };

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [revenue, payments, services, growth] = await Promise.all([
                financialAnalyticsService.getRevenueByCategory(doctorId, dateRange.start, dateRange.end),
                financialAnalyticsService.getPaymentMethodsDistribution(doctorId, dateRange.start, dateRange.end),
                financialAnalyticsService.getTopServices(doctorId, dateRange.start, dateRange.end, 10),
                financialAnalyticsService.getGrowthComparison(doctorId)
            ]);

            setRevenueByCategory(revenue);
            setPaymentMethods(payments);
            setTopServices(services);
            setGrowthData(growth);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6" dir="rtl">
            {/* Header with Date Range */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📊 التحليلات المالية المتقدمة</h2>
                <div className="flex gap-3">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="flex items-center">إلى</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Growth KPIs */}
            {growthData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">الشهر الحالي</p>
                                <p className="text-2xl font-bold text-blue-600">{growthData.thisMonth.toLocaleString()} ج.م</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">الشهر الماضي</p>
                                <p className="text-2xl font-bold text-gray-600">{growthData.lastMonth.toLocaleString()} ج.م</p>
                            </div>
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">معدل النمو</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-2xl font-bold ${growthData.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {growthData.growth.toFixed(1)}%
                                    </p>
                                    {growthData.isPositive ? (
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-6 h-6 text-red-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Category Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        توزيع الإيرادات حسب الفئة
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByCategory}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ category, value }) => `${category}: ${value.toLocaleString()}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {revenueByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `${value.toLocaleString()} ج.م`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Donut Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        توزيع طرق الدفع
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                                >
                                    {paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `${value.toLocaleString()} ج.م`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 10 Services Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        أعلى 10 خدمات من حيث الإيراد
                    </h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topServices} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip formatter={(value: any) => `${value.toLocaleString()} ج.م`} />
                                <Bar dataKey="value" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-3">📈 ملخص سريع</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">إجمالي الفئات</p>
                        <p className="text-xl font-bold text-blue-600">{revenueByCategory.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">أعلى فئة</p>
                        <p className="text-xl font-bold text-purple-600">
                            {revenueByCategory[0]?.category || '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">أفضل خدمة</p>
                        <p className="text-xl font-bold text-green-600">
                            {topServices[0]?.name?.substring(0, 20) || '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">إجمالي الخدمات</p>
                        <p className="text-xl font-bold text-orange-600">{topServices.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFinancialDashboard;
