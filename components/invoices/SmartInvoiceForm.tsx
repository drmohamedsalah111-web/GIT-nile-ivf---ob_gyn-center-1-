/**
 * SmartInvoiceForm.tsx
 * 🧠 واجهة فواتير ذكية وسريعة للسكرتيرة
 * Features:
 * - ✅ تعبئة تلقائية من آخر بيانات المريض
 * - ⚡ اختصارات لوحة مفاتيح (F2 للحفظ، ESC للإلغاء)
 * - 🔍 بحث ذكي بالاسم أو رقم الهاتف
 * - 💰 حساب تلقائي مع الخصم والضريبة
 * - ❌ تحقق من الأخطاء قبل الحفظ
 * - 📝 حفظ كمسودة تلقائياً
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  X,
  Search,
  DollarSign,
  Percent,
  Calculator,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Plus,
  Trash2,
  Copy,
  Receipt
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface SmartInvoiceFormProps {
  secretaryId: string;
  doctorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialPatientId?: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  patientId: string;
  patientName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Visa' | 'Bank Transfer' | 'Insurance';
  paymentReference: string;
  notes: string;
}

export const SmartInvoiceForm: React.FC<SmartInvoiceFormProps> = ({
  secretaryId,
  doctorId,
  onSuccess,
  onCancel,
  initialPatientId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  const [invoice, setInvoice] = useState<Invoice>({
    patientId: '',
    patientName: '',
    items: [
      { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
    ],
    subtotal: 0,
    discount: 0,
    discountType: 'fixed',
    tax: 0,
    total: 0,
    paymentMethod: 'Cash',
    paymentReference: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (selectedPatient && invoice.items.some(item => item.description)) {
        saveDraft();
      }
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [invoice, selectedPatient]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F2: Save invoice
      if (e.key === 'F2') {
        e.preventDefault();
        handleSaveInvoice();
      }
      // ESC: Cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
      // Ctrl + S: Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveInvoice();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [invoice, selectedPatient]);

  // Load initial patient if provided
  useEffect(() => {
    if (initialPatientId) {
      loadPatient(initialPatientId);
    }
  }, [initialPatientId]);

  // Recalculate totals whenever items or discount change
  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.discount, invoice.discountType, invoice.tax]);

  // Search patients
  const searchPatients = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, age')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Load patient details
  const loadPatient = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, age')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      handleSelectPatient(data);
    } catch (error) {
      console.error('Load patient error:', error);
      toast.error('فشل تحميل بيانات المريض');
    }
  };

  // Select patient
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setInvoice(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name
    }));
    setSearchQuery('');
    setShowSearchResults(false);
    setErrors({});
  };

  // Add invoice item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remove invoice item
  const removeItem = (itemId: string) => {
    if (invoice.items.length === 1) {
      toast.error('يجب أن تحتوي الفاتورة على عنصر واحد على الأقل');
      return;
    }
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Update invoice item
  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          updated.total = updated.quantity * updated.unitPrice;
          return updated;
        }
        return item;
      })
    }));
  };

  // Duplicate item
  const duplicateItem = (itemId: string) => {
    const itemToDuplicate = invoice.items.find(item => item.id === itemId);
    if (itemToDuplicate) {
      const newItem = {
        ...itemToDuplicate,
        id: Date.now().toString()
      };
      setInvoice(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      toast.success('تم نسخ العنصر');
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    
    let discountAmount = 0;
    if (invoice.discountType === 'percentage') {
      discountAmount = (subtotal * invoice.discount) / 100;
    } else {
      discountAmount = invoice.discount;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * invoice.tax) / 100;
    const total = afterDiscount + taxAmount;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      total: Math.max(0, total)
    }));
  };

  // Validate invoice
  const validateInvoice = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPatient) {
      newErrors.patient = 'يجب اختيار مريض';
    }

    if (invoice.items.length === 0) {
      newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
    }

    const hasEmptyItems = invoice.items.some(
      item => !item.description || item.unitPrice <= 0
    );
    if (hasEmptyItems) {
      newErrors.items = 'يجب ملء جميع بيانات العناصر';
    }

    if (invoice.total <= 0) {
      newErrors.total = 'إجمالي الفاتورة يجب أن يكون أكبر من صفر';
    }

    if (invoice.discount < 0) {
      newErrors.discount = 'الخصم لا يمكن أن يكون سالباً';
    }

    if (invoice.discountType === 'percentage' && invoice.discount > 100) {
      newErrors.discount = 'الخصم النسبي لا يمكن أن يتجاوز 100%';
    }

    if (invoice.discount > invoice.subtotal && invoice.discountType === 'fixed') {
      newErrors.discount = 'الخصم لا يمكن أن يتجاوز المجموع الفرعي';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save draft
  const saveDraft = async () => {
    try {
      setAutoSaving(true);
      const draftKey = `invoice_draft_${secretaryId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        invoice,
        selectedPatient,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setTimeout(() => setAutoSaving(false), 500);
    }
  };

  // Load draft
  const loadDraft = () => {
    try {
      const draftKey = `invoice_draft_${secretaryId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        setInvoice(parsed.invoice);
        setSelectedPatient(parsed.selectedPatient);
        toast.success('تم تحميل المسودة');
      }
    } catch (error) {
      console.error('Load draft error:', error);
    }
  };

  // Clear draft
  const clearDraft = () => {
    const draftKey = `invoice_draft_${secretaryId}`;
    localStorage.removeItem(draftKey);
  };

  // Save invoice
  const handleSaveInvoice = async () => {
    if (!validateInvoice()) {
      toast.error('يرجى تصحيح الأخطاء قبل الحفظ');
      return;
    }

    try {
      setSaving(true);
      const toastId = toast.loading('جاري حفظ الفاتورة...');

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          clinic_id: doctorId,
          patient_id: invoice.patientId,
          doctor_id: doctorId,
          invoice_number: invoiceNumber,
          subtotal: invoice.subtotal,
          discount: invoice.discountType === 'percentage' 
            ? (invoice.subtotal * invoice.discount) / 100 
            : invoice.discount,
          tax: (invoice.subtotal * invoice.tax) / 100,
          total_amount: invoice.total,
          payment_method: invoice.paymentMethod.toLowerCase().replace(' ', '_'),
          payment_reference: invoice.paymentReference || null,
          status: 'paid',
          invoice_type: 'service',
          notes: invoice.notes || null,
          created_by: secretaryId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = invoice.items.map(item => ({
        invoice_id: invoiceData.id,
        service_name: item.description,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.total
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      clearDraft();
      toast.success('✅ تم حفظ الفاتورة بنجاح', { id: toastId });
      onSuccess?.();
    } catch (error: any) {
      console.error('Save invoice error:', error);
      toast.error(`فشل حفظ الفاتورة: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">فاتورة جديدة</h2>
              <p className="text-xs text-purple-100">اضغط F2 للحفظ • ESC للإلغاء</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {autoSaving && (
              <span className="flex items-center gap-1 text-xs text-purple-200">
                <Clock className="w-3 h-3 animate-pulse" />
                حفظ تلقائي...
              </span>
            )}
            <button
              onClick={onCancel}
              className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Patient Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المريض *
          </label>
          
          {!selectedPatient ? (
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchPatients(e.target.value);
                }}
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              
              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full px-4 py-3 text-right hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500">
                        {patient.phone} {patient.age && `• ${patient.age} سنة`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">{selectedPatient.name}</div>
                <div className="text-sm text-gray-600">{selectedPatient.phone}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setInvoice(prev => ({ ...prev, patientId: '', patientName: '' }));
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
              >
                تغيير
              </button>
            </div>
          )}
          
          {errors.patient && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.patient}
            </p>
          )}
        </div>

        {/* Invoice Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              العناصر *
            </label>
            <button
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة عنصر
            </button>
          </div>

          <div className="space-y-3">
            {invoice.items.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="الوصف (مثال: كشف - تحليل - أشعة)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      placeholder="الكمية"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-center"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="السعر"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-center"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900 min-w-[80px] text-center">
                    {item.total.toFixed(2)} ج.م
                  </div>
                  <button
                    onClick={() => duplicateItem(item.id)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="نسخ"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={invoice.items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errors.items && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.items}
            </p>
          )}
        </div>

        {/* Calculations */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الخصم
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.discount}
                  onChange={(e) => setInvoice(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <select
                  value={invoice.discountType}
                  onChange={(e) => setInvoice(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="fixed">ج.م</option>
                  <option value="percentage">%</option>
                </select>
              </div>
              {errors.discount && (
                <p className="text-red-600 text-xs mt-1">{errors.discount}</p>
              )}
            </div>

            {/* Tax */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الضريبة %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={invoice.tax}
                onChange={(e) => setInvoice(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-gray-300">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المجموع الفرعي:</span>
              <span className="font-medium">{invoice.subtotal.toFixed(2)} ج.م</span>
            </div>
            
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>الخصم:</span>
                <span>
                  - {invoice.discountType === 'percentage' 
                    ? ((invoice.subtotal * invoice.discount) / 100).toFixed(2)
                    : invoice.discount.toFixed(2)} ج.م
                </span>
              </div>
            )}
            
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>الضريبة ({invoice.tax}%):</span>
                <span>+ {((invoice.subtotal * invoice.tax) / 100).toFixed(2)} ج.م</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold text-purple-600 pt-2 border-t-2 border-purple-200">
              <span>الإجمالي:</span>
              <span>{invoice.total.toFixed(2)} ج.م</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'Cash', label: 'نقداً', icon: Banknote },
                { value: 'Visa', label: 'فيزا', icon: CreditCard },
                { value: 'Bank Transfer', label: 'تحويل بنكي', icon: Building2 },
                { value: 'Insurance', label: 'تأمين', icon: FileText }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setInvoice(prev => ({ ...prev, paymentMethod: value as any }))}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    invoice.paymentMethod === value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم المرجع (اختياري)
            </label>
            <input
              type="text"
              value={invoice.paymentReference}
              onChange={(e) => setInvoice(prev => ({ ...prev, paymentReference: e.target.value }))}
              placeholder="رقم الإيصال أو المرجع"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات (اختياري)
          </label>
          <textarea
            value={invoice.notes}
            onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="أي ملاحظات إضافية..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={loadDraft}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" />
            تحميل المسودة
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء (ESC)
            </button>
            <button
              ref={saveButtonRef}
              onClick={handleSaveInvoice}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ (F2)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartInvoiceForm;
