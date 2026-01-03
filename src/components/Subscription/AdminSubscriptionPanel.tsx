import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, MoreVertical, 
  Calendar, CreditCard, User, Phone, Mail, AlertCircle, Clock, Edit, X
} from 'lucide-react';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Define the type based on the Supabase query structure
export interface AdminSubscription {
  id: string;
  clinic_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_status?: string;
  paid_amount: number;
  created_at: string;
  doctors?: {
    full_name: string;
    email: string;
    phone: string;
  };
  subscription_plans?: {
    display_name_ar: string;
    monthly_price: number;
  };
}

interface AdminSubscriptionPanelProps {
  subscriptions: AdminSubscription[];
  plans?: { id: string; display_name_ar: string; monthly_price: number }[];
  onApprove: (id: string, planId?: string, durationDays?: number) => void;
  onReject: (id: string) => void;
  onExtend: (id: string, days: number) => void;
  loading: boolean;
}

export const AdminSubscriptionPanel: React.FC<AdminSubscriptionPanelProps> = ({
  subscriptions,
  plans = [],
  onApprove,
  onReject,
  onExtend,
  loading
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('suspended');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; subscriptionId: string | null }>({ isOpen: false, subscriptionId: null });
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(365);

  // Statistics - suspended = قيد المراجعة (pending)
  const stats = {
    pending: subscriptions.filter(s => s.status === 'suspended').length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    total: subscriptions.length
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      sub.doctors?.full_name?.toLowerCase().includes(searchLower) ||
      sub.doctors?.email?.toLowerCase().includes(searchLower) ||
      sub.doctors?.phone?.includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <h2 className="text-2xl font-black mb-4">لوحة إدارة الاشتراكات</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-semibold">قيد المراجعة</span>
            </div>
            <div className="text-3xl font-black">{stats.pending}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">نشط</span>
            </div>
            <div className="text-3xl font-black">{stats.active}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">منتهي</span>
            </div>
            <div className="text-3xl font-black">{stats.expired}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-semibold">الإجمالي</span>
            </div>
            <div className="text-3xl font-black">{stats.total}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-6 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث باسم الطبيب، الإيميل، أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['all', 'suspended', 'active', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'الكل' : 
               status === 'suspended' ? 'قيد المراجعة' :
               status === 'active' ? 'نشط' : 'منتهي'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-600 text-sm font-bold">
            <tr>
              <th className="px-6 py-4">الطبيب / العيادة</th>
              <th className="px-6 py-4">خطة الاشتراك</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4">تاريخ الانتهاء</th>
              <th className="px-6 py-4">المدفوعات</th>
              <th className="px-6 py-4">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  لا توجد اشتراكات مطابقة للبحث
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                        {sub.doctors?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{sub.doctors?.full_name || 'غير معروف'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {sub.doctors?.email || '-'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {sub.doctors?.phone || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">
                      {sub.subscription_plans?.display_name_ar || 'غير محدد'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <SubscriptionStatusBadge status={sub.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(sub.end_date), 'dd MMM yyyy', { locale: ar })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                      {sub.paid_amount?.toLocaleString('ar-EG') || 0} ج.م
                    </div>
                    <span className="text-xs text-gray-500">
                      {sub.payment_status || 'غير مدفوع'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {sub.status === 'suspended' && (
                        <>
                          <button
                            onClick={() => {
                              setApprovalModal({ isOpen: true, subscriptionId: sub.id });
                              setSelectedPlanId(sub.plan_id || '');
                            }}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="قبول وتفعيل"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onReject(sub.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="رفض"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approval Modal */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">تفعيل الاشتراك</h3>
              <button 
                onClick={() => setApprovalModal({ isOpen: false, subscriptionId: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اختر الباقة</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- اختر الباقة --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.display_name_ar} - {plan.monthly_price} ج.م/شهرياً
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">مدة الاشتراك (بالأيام)</label>
                <div className="flex gap-2">
                  {[30, 90, 180, 365].map((days) => (
                    <button
                      key={days}
                      onClick={() => setDurationDays(days)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                        durationDays === days 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {days === 30 ? 'شهر' : days === 90 ? '3 شهور' : days === 180 ? '6 شهور' : 'سنة'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (approvalModal.subscriptionId) {
                      onApprove(approvalModal.subscriptionId, selectedPlanId || undefined, durationDays);
                      setApprovalModal({ isOpen: false, subscriptionId: null });
                    }
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  ✓ تفعيل الاشتراك
                </button>
                <button
                  onClick={() => setApprovalModal({ isOpen: false, subscriptionId: null })}
                  className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
