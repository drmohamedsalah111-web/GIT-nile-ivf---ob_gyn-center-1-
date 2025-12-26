/**
 * FinancePage.tsx
 * صفحة الماليات الرئيسية
 * Main Finance Dashboard with tabs for different financial modules
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  AlertCircle,
  Settings,
  FileText,
  Users,
  Calendar,
  Wallet,
  PieChart,
  List
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { ServicesManager, DailyIncomeReport, QuickInvoiceModal } from '../../src/modules/finance';
import toast from 'react-hot-toast';

interface FinancePageProps {
  doctorId: string;
}

// Tabs configuration
type TabId = 'dashboard' | 'services' | 'invoices' | 'cases' | 'reports';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: PieChart },
  { id: 'services', label: 'الخدمات والأسعار', icon: Package },
  { id: 'invoices', label: 'الفواتير', icon: FileText },
  { id: 'cases', label: 'حالات IVF', icon: Users },
  { id: 'reports', label: 'التقارير', icon: TrendingUp },
];

export const FinancePage: React.FC<FinancePageProps> = ({ doctorId }) => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0,
    activeServices: 0,
    openCases: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchPatients();
  }, [doctorId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Today's revenue
      const today = new Date().toISOString().split('T')[0];
      const { data: todayInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('clinic_id', doctorId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('status', 'Paid');

      const todayRevenue = todayInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Month revenue
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data: monthInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('clinic_id', doctorId)
        .gte('created_at', monthStart.toISOString())
        .eq('status', 'Paid');

      const monthRevenue = monthInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Active services count
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', doctorId)
        .eq('is_active', true);

      // Open cases count
      const { count: casesCount } = await supabase
        .from('financial_cases')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', doctorId)
        .eq('status', 'Open');

      // Pending installments
      const { data: pendingInstallments } = await supabase
        .from('installments')
        .select('amount, case_id, financial_cases!inner(clinic_id)')
        .eq('financial_cases.clinic_id', doctorId)
        .eq('is_paid', false);

      const pendingPayments = pendingInstallments?.reduce((sum, inst) => sum + (inst.amount || 0), 0) || 0;

      setStats({
        todayRevenue,
        monthRevenue,
        pendingPayments,
        activeServices: servicesCount || 0,
        openCases: casesCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, name, phone')
        .order('name');
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const handleCreateInvoice = (patient: any) => {
    setSelectedPatient(patient);
    setShowInvoiceModal(true);
  };

  // Stats Cards Component
  const StatsCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Today's Revenue */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <DollarSign className="w-8 h-8 opacity-80" />
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">اليوم</span>
        </div>
        <div className="text-2xl font-bold">{stats.todayRevenue.toLocaleString()}</div>
        <div className="text-sm opacity-80">ج.م إيرادات اليوم</div>
      </div>

      {/* Month Revenue */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="w-8 h-8 opacity-80" />
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الشهر</span>
        </div>
        <div className="text-2xl font-bold">{stats.monthRevenue.toLocaleString()}</div>
        <div className="text-sm opacity-80">ج.م إيرادات الشهر</div>
      </div>

      {/* Pending Payments */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <AlertCircle className="w-8 h-8 opacity-80" />
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">معلق</span>
        </div>
        <div className="text-2xl font-bold">{stats.pendingPayments.toLocaleString()}</div>
        <div className="text-sm opacity-80">ج.م مستحقات</div>
      </div>

      {/* Active Services */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <Package className="w-8 h-8 opacity-80" />
        </div>
        <div className="text-2xl font-bold">{stats.activeServices}</div>
        <div className="text-sm opacity-80">خدمة نشطة</div>
      </div>

      {/* Open Cases */}
      <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <Users className="w-8 h-8 opacity-80" />
        </div>
        <div className="text-2xl font-bold">{stats.openCases}</div>
        <div className="text-sm opacity-80">حالة IVF مفتوحة</div>
      </div>
    </div>
  );

  // Quick Actions
  const QuickActions = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('invoices')}
          className="flex flex-col items-center gap-2 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
        >
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">فاتورة جديدة</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
        >
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">إدارة الخدمات</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className="flex flex-col items-center gap-2 p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
        >
          <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">حالات IVF</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">التقارير</span>
        </button>
      </div>
    </div>
  );

  // Patient List for Invoicing
  const PatientInvoiceList = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">إنشاء فاتورة سريعة</h3>
        <input
          type="text"
          placeholder="بحث عن مريض..."
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {patients.slice(0, 10).map((patient) => (
          <div
            key={patient.id}
            className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer"
            onClick={() => handleCreateInvoice(patient)}
          >
            <div>
              <div className="font-medium text-gray-900">{patient.name}</div>
              <div className="text-sm text-gray-500">{patient.phone}</div>
            </div>
            <button className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm hover:bg-teal-200 transition-colors">
              فاتورة
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Cases List
  const CasesList = () => {
    const [cases, setCases] = useState<any[]>([]);
    const [casesLoading, setCasesLoading] = useState(true);

    useEffect(() => {
      const fetchCases = async () => {
        try {
          const { data } = await supabase
            .from('financial_cases')
            .select('*, patients(name), packages(name)')
            .eq('clinic_id', doctorId)
            .order('created_at', { ascending: false });
          setCases(data || []);
        } catch (err) {
          console.error('Error fetching cases:', err);
        } finally {
          setCasesLoading(false);
        }
      };
      fetchCases();
    }, []);

    if (casesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">حالات IVF المالية</h3>
          <p className="text-sm text-gray-500">تتبع المدفوعات والأقساط لمرضى IVF</p>
        </div>
        
        {cases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد حالات مالية</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cases.map((c) => {
              const progress = c.total_amount > 0 ? (c.paid_amount / c.total_amount) * 100 : 0;
              return (
                <div key={c.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{c.patients?.name}</div>
                      <div className="text-sm text-gray-500">{c.packages?.name || 'حالة مخصصة'}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      c.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'Closed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {c.status === 'Open' ? 'مفتوحة' : c.status === 'Closed' ? 'مغلقة' : 'ملغاة'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {c.paid_amount?.toLocaleString()} / {c.total_amount?.toLocaleString()} ج.م
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <StatsCards />
            <QuickActions />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PatientInvoiceList />
              <CasesList />
            </div>
          </>
        );
      case 'services':
        return <ServicesManager clinicId={doctorId} />;
      case 'invoices':
        return <PatientInvoiceList />;
      case 'cases':
        return <CasesList />;
      case 'reports':
        return <DailyIncomeReport clinicId={doctorId} />;
      default:
        return null;
    }
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-teal-600" />
          </div>
          إدارة الماليات
        </h1>
        <p className="text-gray-500 mt-1">الفواتير، الخدمات، وتتبع المدفوعات</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-teal-500 text-teal-600 bg-teal-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedPatient && (
        <QuickInvoiceModal
          clinicId={doctorId}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          doctorId={doctorId}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            setShowInvoiceModal(false);
            setSelectedPatient(null);
            fetchStats();
            toast.success('تم إنشاء الفاتورة بنجاح!');
          }}
        />
      )}
    </div>
  );
};

export default FinancePage;
