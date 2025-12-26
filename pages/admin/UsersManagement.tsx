import React, { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone, User, Building2, Edit, Trash2, Shield, UserCheck } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_role: 'doctor' | 'secretary' | 'admin';
  specialization?: string;
  doctor_id?: string;
  created_at: string;
  is_active?: boolean;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      toast.success('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (err: any) {
      toast.error('فشل حذف المستخدم');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم');
      fetchUsers();
    } catch (err: any) {
      toast.error('فشل تحديث حالة المستخدم');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.user_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleStats = {
    all: users.length,
    doctor: users.filter(u => u.user_role === 'doctor').length,
    secretary: users.filter(u => u.user_role === 'secretary').length,
    admin: users.filter(u => u.user_role === 'admin').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-[Tajawal]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </div>

      {/* فلاتر الأدوار */}
      <div className="flex gap-4 mb-6">
        {[
          { key: 'all', label: 'الكل', icon: Users, count: roleStats.all },
          { key: 'doctor', label: 'أطباء', icon: User, count: roleStats.doctor },
          { key: 'secretary', label: 'سكرتارية', icon: UserCheck, count: roleStats.secretary },
          { key: 'admin', label: 'مدراء', icon: Shield, count: roleStats.admin }
        ].map(filter => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.key}
              onClick={() => setFilterRole(filter.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                filterRole === filter.key
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-purple-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {filter.label}
              <span className={`px-2 py-1 rounded-full text-xs ${
                filterRole === filter.key ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full">
            <thead>
              <tr className="bg-purple-100 text-purple-800">
                <th className="py-3 px-4 text-right">الاسم</th>
                <th className="py-3 px-4 text-right">الإيميل</th>
                <th className="py-3 px-4 text-right">الهاتف</th>
                <th className="py-3 px-4 text-right">الدور</th>
                <th className="py-3 px-4 text-right">الحالة</th>
                <th className="py-3 px-4 text-right">تاريخ التسجيل</th>
                <th className="py-3 px-4 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-purple-50 transition-all">
                    <td className="py-3 px-4 font-bold text-gray-800">{user.name}</td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        user.user_role === 'admin' ? 'bg-purple-600 text-white' :
                        user.user_role === 'doctor' ? 'bg-teal-500 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {user.user_role === 'admin' ? 'مدير' : user.user_role === 'doctor' ? 'طبيب' : 'سكرتيرة'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active !== false ? '✅ نشط' : '🔒 معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active !== false)}
                        className={`${
                          user.is_active !== false
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        } rounded-lg px-3 py-1 text-xs`}
                      >
                        {user.is_active !== false ? '🔒 تعطيل' : '✅ تفعيل'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-3 py-1 flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
