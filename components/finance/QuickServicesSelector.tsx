/**
 * QuickServicesSelector.tsx
 * ⚡ قائمة الخدمات السريعة للسكرتيرة
 * Features:
 * - 🔍 بحث سريع في الخدمات
 * - 📂 تصفية حسب التصنيف
 * - 💰 عرض الأسعار المحددة من الطبيب
 * - ➕ إضافة سريعة للفاتورة
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Plus,
  X,
  DollarSign,
  CheckCircle,
  Filter,
  Tag,
  Minus,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  name_en?: string;
  category: string;
  price: number;
  description?: string;
  is_active: boolean;
}

interface SelectedService extends Service {
  quantity: number;
}

interface QuickServicesSelectorProps {
  doctorId: string;
  onAddServices: (services: SelectedService[]) => void;
  onClose: () => void;
  initialServices?: SelectedService[];
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '📋' },
  { id: 'consultation', label: 'استشارات', icon: '👨‍⚕️' },
  { id: 'lab', label: 'تحاليل', icon: '🔬' },
  { id: 'ultrasound', label: 'سونار', icon: '📡' },
  { id: 'procedure', label: 'إجراءات', icon: '💉' },
  { id: 'ivf', label: 'حقن مجهري', icon: '🧬' },
  { id: 'surgery', label: 'عمليات', icon: '🏥' },
  { id: 'medication', label: 'أدوية', icon: '💊' },
  { id: 'followup', label: 'متابعة', icon: '📅' },
  { id: 'other', label: 'أخرى', icon: '📦' }
];

const QuickServicesSelector: React.FC<QuickServicesSelectorProps> = ({
  doctorId,
  onAddServices,
  onClose,
  initialServices = []
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(initialServices);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchServices();
  }, [doctorId]);

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, activeCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('clinic_id', doctorId)
        .eq('is_active', true)
        .order('category')
        .order('name');

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
        s.name_en?.toLowerCase().includes(query)
      );
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter(s => s.category === activeCategory);
    }

    setFilteredServices(filtered);
  };

  const isSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const getSelectedQuantity = (serviceId: string) => {
    const selected = selectedServices.find(s => s.id === serviceId);
    return selected?.quantity || 0;
  };

  const handleToggleService = (service: Service) => {
    if (isSelected(service.id)) {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setSelectedServices(prev => [...prev, { ...service, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (serviceId: string, delta: number) => {
    setSelectedServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        const newQty = Math.max(1, s.quantity + delta);
        return { ...s, quantity: newQty };
      }
      return s;
    }));
  };

  const getTotalAmount = () => {
    return selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  };

  const handleConfirm = () => {
    if (selectedServices.length === 0) {
      toast.error('يرجى اختيار خدمة واحدة على الأقل');
      return;
    }
    onAddServices(selectedServices);
    onClose();
  };

  const getCategoryIcon = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.icon || '📦';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" dir="rtl">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              اختيار الخدمات
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث سريع عن خدمة..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد خدمات</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-purple-600 text-sm hover:underline"
                >
                  مسح البحث
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredServices.map(service => {
                const selected = isSelected(service.id);
                const quantity = getSelectedQuantity(service.id);
                
                return (
                  <div
                    key={service.id}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleToggleService(service)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getCategoryIcon(service.category)}</span>
                            <h4 className="font-medium text-gray-800">{service.name}</h4>
                          </div>
                          {service.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{service.description}</p>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-green-600">{service.price}</p>
                          <p className="text-xs text-gray-400">ج.م</p>
                        </div>
                      </div>
                    </div>

                    {/* Selected badge & quantity */}
                    {selected && (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-purple-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">تم الاختيار</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-purple-200 p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(service.id, -1);
                            }}
                            className="p-1 hover:bg-purple-100 rounded"
                          >
                            <Minus className="w-4 h-4 text-purple-600" />
                          </button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(service.id, 1);
                            }}
                            className="p-1 hover:bg-purple-100 rounded"
                          >
                            <Plus className="w-4 h-4 text-purple-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Total & Confirm */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">{selectedServices.length} خدمة</span>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500">الإجمالي</p>
              <p className="text-xl font-bold text-green-600">{getTotalAmount().toLocaleString()} ج.م</p>
            </div>
          </div>
          
          <button
            onClick={handleConfirm}
            disabled={selectedServices.length === 0}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
              selectedServices.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" />
            إضافة للفاتورة
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickServicesSelector;
