/**
 * ServicesManager.tsx
 * Complete service catalog management with inline editing
 * Features: Add, Edit, Delete, Bulk Price Update
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Search,
  DollarSign,
  Tag,
  Package,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Download,
} from 'lucide-react';
import { servicesAPI, Service } from '../../services/financialService';
import toast from 'react-hot-toast';
import { defaultServices } from '../../data/defaultServices';

interface ServicesManagerProps {
  clinicId: string;
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({ clinicId }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Add Service Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    category: 'Outpatient',
    price: 0,
    cost_price: 0,
    commission_type: 'none',
    commission_value: 0,
    description: '',
  });

  // Inline Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Bulk Price Update
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [inflationPercentage, setInflationPercentage] = useState<number>(0);

  // Default Services Initialization
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [clinicId]);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, categoryFilter]);

  const fetchServices = async () => {
    if (!clinicId) {
      console.log('⏳ Waiting for clinicId to fetch services...');
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await servicesAPI.getServices(clinicId, true); // Include inactive
      setServices(data);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('خطأ في تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    setFilteredServices(filtered);
  };

  const handleAddService = async () => {
    if (!clinicId) {
      console.log('⏳ Waiting for clinicId to initialize services...');
      toast.error('لم يتم تهيئة العيادة بعد');
      return;
    }
    if (!newService.name || !newService.price) {
      toast.error('أدخل اسم الخدمة والسعر');
      return;
    }

    // Prevent duplicate service (same name in the same clinic)
    try {
      const existing = services.find(s => s.name.trim().toLowerCase() === (newService.name || '').trim().toLowerCase());
      if (existing) {
        if (!existing.is_active) {
          toast.error('الخدمة موجودة ولكن معطلة. قم بتفعيلها بدلاً من الإضافة.');
        } else {
          toast.error('الخدمة موجودة بالفعل.');
        }
        return;
      }
    } catch (e) {
      // non-blocking — proceed to try create
    }

    try {
      await servicesAPI.createService({
        ...newService,
        clinic_id: clinicId,
      });
      toast.success('تم إضافة الخدمة بنجاح');
      setShowAddModal(false);
      setNewService({
        name: '',
        category: 'Outpatient',
        price: 0,
        cost_price: 0,
        commission_type: 'none',
        commission_value: 0,
        description: '',
      });
      fetchServices();
    } catch (error: any) {
      // Log detailed error for debugging (server error may contain details)
      console.error('Error adding service:', error);
      try {
        // Supabase error shape may include .message, .details, .hint
        const msg = error?.message || error?.error_description || JSON.stringify(error);
        const details = error?.details || error?.hint;
        console.error('Service create error details:', { msg, details, raw: error });
      } catch (logErr) {
        console.error('Error logging service create error', logErr);
      }
      toast.error(error?.message || 'خطأ في إضافة الخدمة');
    }
  };

  const handleInlineEdit = (service: Service) => {
    setEditingId(service.id);
    setEditValue(service.price);
  };

  const handleSaveInlineEdit = async (serviceId: string) => {
    try {
      await servicesAPI.updateService(serviceId, { price: editValue });
      toast.success('تم تحديث السعر');
      setEditingId(null);
      fetchServices();
    } catch (error: any) {
      console.error('Error updating price:', error);
      toast.error('خطأ في تحديث السعر');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await servicesAPI.toggleActive(service.id, !service.is_active);
      toast.success(service.is_active ? 'تم إيقاف الخدمة' : 'تم تفعيل الخدمة');
      fetchServices();
    } catch (error: any) {
      console.error('Error toggling service:', error);
      toast.error('خطأ في تحديث الخدمة');
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (inflationPercentage === 0) {
      toast.error('أدخل نسبة الزيادة');
      return;
    }

    if (!confirm(`هل تريد زيادة أسعار جميع الخدمات بنسبة ${inflationPercentage}%؟`)) {
      return;
    }

    try {
      const count = await servicesAPI.bulkUpdatePrices(clinicId, inflationPercentage);
      toast.success(`تم تحديث ${count} خدمة بنجاح`);
      setShowBulkModal(false);
      setInflationPercentage(0);
      fetchServices();
    } catch (error: any) {
      console.error('Error bulk updating:', error);
      toast.error('خطأ في التحديث الجماعي');
    }
  };

  const handleInitializeDefaultServices = async () => {
    if (!clinicId) {
      toast.error('لم يتم تهيئة العيادة بعد');
      return;
    }

    if (!confirm(`سيتم إضافة ${defaultServices.length} خدمة افتراضية. المتكررة سيتم تجاهلها. هل تريد المتابعة؟`)) {
      return;
    }

    try {
      setIsInitializing(true);
      const servicesWithClinicId = defaultServices.map(s => ({
        ...s,
        clinic_id: clinicId,
        is_active: true,
      }));

      await servicesAPI.initializeDefaultServices(servicesWithClinicId, clinicId);
      toast.success('تم تحميل الخدمات الافتراضية بنجاح! 🎉');
      fetchServices();
    } catch (error: any) {
      console.error('Error initializing services:', error);
      toast.error('حدث خطأ أثناء التحميل');
    } finally {
      setIsInitializing(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      Outpatient: 'bg-blue-100 text-blue-700',
      Procedure: 'bg-purple-100 text-purple-700',
      Lab: 'bg-green-100 text-green-700',
      Pharmacy: 'bg-pink-100 text-pink-700',
      IVF: 'bg-teal-100 text-teal-700',
      Antenatal: 'bg-amber-100 text-amber-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الخدمات والأسعار</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredServices.length} خدمة • {services.filter((s) => s.is_active).length} نشط
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleInitializeDefaultServices}
            disabled={isInitializing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isInitializing ? 'جاري التحميل...' : `تحميل ${defaultServices.length} خدمة جاهزة`}
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            تحديث جماعي
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            خدمة جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن خدمة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">جميع الفئات</option>
            <option value="Outpatient">عيادة خارجية</option>
            <option value="Procedure">إجراءات</option>
            <option value="Lab">معمل</option>
            <option value="Pharmacy">صيدلية</option>
            <option value="IVF">حقن مجهري</option>
            <option value="Antenatal">متابعة حمل</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                الخدمة
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                الفئة
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                السعر
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                التكلفة
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                الحالة
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredServices.map((service) => (
              <tr
                key={service.id}
                className={`hover:bg-gray-50 transition-colors ${!service.is_active ? 'opacity-50' : ''
                  }`}
              >
                {/* Service Name */}
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  {service.description && (
                    <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                  )}
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
                      service.category
                    )}`}
                  >
                    {service.category}
                  </span>
                </td>

                {/* Price (Inline Editable) */}
                <td className="px-6 py-4">
                  {editingId === service.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveInlineEdit(service.id)}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleInlineEdit(service)}
                    >
                      <span className="font-semibold text-gray-900">
                        {service.price.toLocaleString()} ج.م
                      </span>
                      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>

                {/* Cost Price */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {service.cost_price?.toLocaleString() || '—'} ج.م
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="flex items-center gap-2"
                  >
                    {service.is_active ? (
                      <ToggleRight className="w-8 h-8 text-teal-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">لا توجد خدمات</p>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">إضافة خدمة جديدة</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الخدمة *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="مثال: موجات فوق صوتية رباعية الأبعاد"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة *</label>
                <select
                  value={newService.category}
                  onChange={(e) =>
                    setNewService({ ...newService, category: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Outpatient">عيادة خارجية</option>
                  <option value="Procedure">إجراءات</option>
                  <option value="Lab">معمل</option>
                  <option value="Pharmacy">صيدلية</option>
                  <option value="IVF">حقن مجهري</option>
                  <option value="Antenatal">متابعة حمل</option>
                </select>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر *
                  </label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التكلفة (اختياري)
                  </label>
                  <input
                    type="number"
                    value={newService.cost_price}
                    onChange={(e) =>
                      setNewService({ ...newService, cost_price: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Commission */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع العمولة
                  </label>
                  <select
                    value={newService.commission_type}
                    onChange={(e) =>
                      setNewService({ ...newService, commission_type: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="none">بدون عمولة</option>
                    <option value="fixed">مبلغ ثابت</option>
                    <option value="percentage">نسبة مئوية</option>
                  </select>
                </div>
                {newService.commission_type !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      قيمة العمولة
                    </label>
                    <input
                      type="number"
                      value={newService.commission_value}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          commission_value: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddService}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                إضافة الخدمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">تحديث الأسعار جماعياً</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة الزيادة (%)
                </label>
                <input
                  type="number"
                  value={inflationPercentage}
                  onChange={(e) => setInflationPercentage(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="مثال: 10 لزيادة 10%"
                  step="0.1"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  ⚠️ سيتم تطبيق الزيادة على جميع الخدمات النشطة. لن يتأثر التاريخ القديم.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleBulkPriceUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                تطبيق التحديث
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManager;
