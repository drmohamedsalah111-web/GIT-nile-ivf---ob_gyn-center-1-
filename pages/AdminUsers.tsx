import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, UserPlus, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_super_admin: boolean;
}

const AdminUsers: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', password: '', is_super_admin: false });

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('admins').select('id, email, name, is_super_admin');
    if (!error && data) setAdmins(data);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.name || !newAdmin.password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    // كلمة السر يجب تشفيرها قبل الإرسال
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(newAdmin.password, 10);
    const { error } = await supabase.from('admins').insert({
      email: newAdmin.email,
      name: newAdmin.name,
      password_hash: hash,
      is_super_admin: newAdmin.is_super_admin
    });
    if (!error) {
      toast.success('تم إضافة الأدمن بنجاح');
      setShowAdd(false);
      setNewAdmin({ email: '', name: '', password: '', is_super_admin: false });
      fetchAdmins();
    } else {
      toast.error('فشل الإضافة: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الأدمن؟')) return;
    setLoading(true);
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (!error) {
      toast.success('تم حذف الأدمن');
      fetchAdmins();
    } else {
      toast.error('فشل الحذف: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
          <Shield className="w-6 h-6" /> إدارة الأدمن
        </h2>
        <button onClick={() => setShowAdd(true)} className="btn bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> إضافة أدمن
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 bg-blue-50 p-4 rounded-xl flex flex-col gap-3">
          <input type="email" placeholder="البريد الإلكتروني" className="input input-bordered" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
          <input type="text" placeholder="الاسم" className="input input-bordered" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
          <input type="password" placeholder="كلمة المرور" className="input input-bordered" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={newAdmin.is_super_admin} onChange={e => setNewAdmin({ ...newAdmin, is_super_admin: e.target.checked })} />
            <span>صلاحية مدير عام (Super Admin)</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold">حفظ</button>
            <button type="button" className="btn bg-gray-300 rounded-lg px-4 py-2 font-semibold" onClick={() => setShowAdd(false)}>إلغاء</button>
          </div>
        </form>
      )}
      <table className="w-full text-right border-t">
        <thead>
          <tr className="text-gray-700">
            <th className="py-2">الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>مدير عام؟</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id} className="border-b">
              <td className="py-2 font-semibold">{admin.name}</td>
              <td>{admin.email}</td>
              <td>{admin.is_super_admin ? 'نعم' : 'لا'}</td>
              <td>
                {/* تعديل لاحقاً */}
                <button onClick={() => handleDelete(admin.id)} className="text-red-600 hover:text-red-800 ml-2"><Trash2 /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="text-center py-4">جاري التحميل...</div>}
    </div>
  );
};

export default AdminUsers;
