import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface Props {
  patient: any;
  clinicId?: string | null;
  onSave: (invoiceData: any) => void;
}

const InvoiceBuilder: React.FC<Props> = ({ patient, clinicId, onSave }) => {
  const [items, setItems] = useState<any[]>([{ id: Date.now(), description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  const [paymentSplit, setPaymentSplit] = useState({ total: 0, paid: 0, method: 'cash' });
  const [discount, setDiscount] = useState<{ amount: number; reason: string }>({ amount: 0, reason: '' });
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const loadServices = async () => {
      const { data } = await supabase.from('services').select('id, name, price').eq('clinic_id', clinicId).limit(100);
      setServices(data || []);
    };
    loadServices();
  }, [clinicId]);

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  const removeItem = (id: any) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id: any, changes: Partial<any>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes, total_price: ((changes.quantity ?? i.quantity) * (changes.unit_price ?? i.unit_price)) } : i));
  };

  const save = async () => {
    const subtotal = items.reduce((s, it) => s + (it.total_price || 0), 0);
    const total = Math.max(0, subtotal - (discount.amount || 0));
    const status = paymentSplit.paid >= total ? 'paid' : (paymentSplit.paid > 0 ? 'partial' : 'draft');

    const invoiceData = {
      clinic_id: clinicId,
      patient_id: patient?.id,
      items,
      subtotal,
      discount: discount.amount,
      total_amount: total,
      paid_amount: paymentSplit.paid,
      payment_method: paymentSplit.method,
      status,
      notes: discount.reason
    };

    onSave(invoiceData);
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold mb-4">فاتورة جديدة</h3>
      <div className="mb-4">
        <div className="text-sm text-gray-600">مريض: {patient?.name || '—'}</div>
      </div>

      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="flex gap-2 items-center">
            <input className="flex-1 p-2 border rounded" placeholder="وصف" value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} />
            <input className="w-20 p-2 border rounded" type="number" value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: parseInt(e.target.value || '1') })} />
            <input className="w-28 p-2 border rounded" type="number" value={it.unit_price} onChange={(e) => updateItem(it.id, { unit_price: parseFloat(e.target.value || '0') })} />
            <div className="w-28 text-right">{(it.total_price || 0).toLocaleString()} ج.م</div>
            <button className="text-red-500" onClick={() => removeItem(it.id)}>حذف</button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={addItem}>إضافة بند</button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm">خصم</label>
        <div className="flex gap-2 mt-1">
          <input className="p-2 border rounded w-32" type="number" value={discount.amount} onChange={(e) => setDiscount({ ...discount, amount: parseFloat(e.target.value || '0') })} />
          <input className="flex-1 p-2 border rounded" placeholder="سبب الخصم" value={discount.reason} onChange={(e) => setDiscount({ ...discount, reason: e.target.value })} />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm">دفع</label>
        <div className="flex gap-2 mt-1 items-center">
          <input className="w-32 p-2 border rounded" type="number" value={paymentSplit.total} onChange={(e) => setPaymentSplit({ ...paymentSplit, total: parseFloat(e.target.value || '0') })} placeholder="الإجمالي" />
          <input className="w-32 p-2 border rounded" type="number" value={paymentSplit.paid} onChange={(e) => setPaymentSplit({ ...paymentSplit, paid: parseFloat(e.target.value || '0') })} placeholder="المدفوع" />
          <select className="p-2 border rounded" value={paymentSplit.method} onChange={(e) => setPaymentSplit({ ...paymentSplit, method: e.target.value })}>
            <option value="cash">نقداً</option>
            <option value="visa">فيزا</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="instapay">Instapay</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button className="px-4 py-2 bg-teal-500 text-white rounded" onClick={save}>حفظ وطباعة</button>
        <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => console.log('رسل للطابور')}>Check In &amp; Notify Doctor</button>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
