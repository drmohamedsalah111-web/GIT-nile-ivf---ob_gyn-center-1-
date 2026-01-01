/**
 * ServicesManagementPage.tsx
 * 📦 صفحة إدارة الخدمات للطبيب
 * Features:
 * - ✅ إضافة/تعديل/حذف الخدمات
 * - 💰 تسعير الخدمات
 * - 📂 تصنيف الخدمات
 * - 🔄 تفعيل/تعطيل الخدمات
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface ServicesManagementPageProps {
  doctorId: string;
}

interface Service {
  id: string;
  name: string;
  name_en?: string;
  category: string;
  price: number;
  cost_price?: number;
  description?: string;
  is_active: boolean;
  clinic_id: string;
  created_at: string;
}

const CATEGORIES = [
  { id: 'consultation', label: 'استشارات', color: 'blue' },
  { id: 'lab', label: 'تحاليل معملية', color: 'purple' },
  { id: 'ultrasound', label: 'سونار', color: 'green' },
  { id: 'procedure', label: 'إجراءات', color: 'orange' },
  { id: 'ivf', label: 'حقن مجهري', color: 'pink' },
  { id: 'surgery', label: 'عمليات', color: 'red' },
  { id: 'medication', label: 'أدوية', color: 'teal' },
  { id: 'followup', label: 'متابعة', color: 'indigo' },
  { id: 'other', label: 'أخرى', color: 'gray' }
];

const ServicesManagementPage: React.FC<ServicesManagementPageProps> = ({ doctorId }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    category: 'consultation',
    price: 0,
    cost_price: 0,
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (doctorId) {
      fetchServices();
    }
  }, [doctorId]);

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, categoryFilter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('clinic_id', doctorId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('خطأ في تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.name_en?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }

    setFilteredServices(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الخدمة');
      return;
    }

    if (formData.price <= 0) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            name_en: formData.name_en,
            category: formData.category,
            price: formData.price,
            cost_price: formData.cost_price,
            description: formData.description,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('تم تحديث الخدمة بنجاح');
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({
            ...formData,
            clinic_id: doctorId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('تم إضافة الخدمة بنجاح');
      }

      setShowModal(false);
      setEditingService(null);
      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'خطأ في حفظ الخدمة');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      name_en: service.name_en || '',
      category: service.category,
      price: service.price,
      cost_price: service.cost_price || 0,
      description: service.description || '',
      is_active: service.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`هل أنت متأكد من حذف "${service.name}"؟`)) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;
      toast.success('تم حذف الخدمة');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('خطأ في حذف الخدمة');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      toast.success(service.is_active ? 'تم تعطيل الخدمة' : 'تم تفعيل الخدمة');
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('خطأ في تحديث الخدمة');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      category: 'consultation',
      price: 0,
      cost_price: 0,
      description: '',
      is_active: true
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-600" />
              إدارة الخدمات
            </h2>
            <p className="text-sm text-gray-500 mt-1">إضافة وتعديل خدمات العيادة وأسعارها</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingService(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة خدمة
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن خدمة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">جميع التصنيفات</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium">إجمالي الخدمات</p>
          <p className="text-2xl font-bold text-purple-700">{services.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
          <p className="text-xs text-green-600 font-medium">نشطة</p>
          <p className="text-2xl font-bold text-green-700">
            {services.filter(s => s.is_active).length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-600 font-medium">معطلة</p>
          <p className="text-2xl font-bold text-gray-700">
            {services.filter(s => !s.is_active).length}
          </p>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد خدمات</h3>
            <p className="text-gray-500 text-sm">ابدأ بإضافة خدمات العيادة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredServices.map(service => {
              const category = getCategoryInfo(service.category);
              return (
                <div 
                  key={service.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!service.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800">{service.name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full bg-${category.color}-100 text-${category.color}-600`}>
                          {category.label}
                        </span>
                        {!service.is_active && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
                            معطلة
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="text-lg font-bold text-green-600">{service.price} ج.م</p>
                        {service.cost_price ? (
                          <p className="text-xs text-gray-400">التكلفة: {service.cost_price} ج.م</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(service)}
                          className={`p-2 rounded-lg transition-colors ${
                            service.is_active 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={service.is_active ? 'تعطيل' : 'تفعيل'}
                        >
                          {service.is_active ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingService(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الخدمة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: كشف استشاري"
                  required
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Consultation"
                  dir="ltr"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  التصنيف *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر (ج.م) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التكلفة (اختياري)
                  </label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="وصف مختصر للخدمة..."
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">الخدمة نشطة</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`p-1 rounded-full transition-colors ${
                    formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  {formData.is_active ? (
                    <ToggleRight className="w-6 h-6 text-white" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingService ? 'حفظ التغييرات' : 'إضافة الخدمة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagementPage;
