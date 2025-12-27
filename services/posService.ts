import { supabase } from './supabaseClient';

export const posService = {
  async createInvoice(payload: any) {
    // payload: { clinic_id, patient_id, items[], subtotal, discount, total_amount, paid_amount, payment_method, status }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: invoice, error } = await supabase
      .from('pos_invoices')
      .insert([{ id, ...payload, invoice_number: `POS-${Date.now()}`, created_at: now, updated_at: now }])
      .select()
      .single();

    if (error) throw error;

    // insert items
    const items = payload.items.map((it: any) => ({ id: crypto.randomUUID(), invoice_id: invoice.id, service_id: it.service_id || null, description: it.description, quantity: it.quantity, unit_price: it.unit_price, total_price: it.total_price }));
    const { error: itemsError } = await supabase.from('pos_invoice_items').insert(items);
    if (itemsError) throw itemsError;

    // insert payment if paid_amount > 0
    if (payload.paid_amount && payload.paid_amount > 0) {
      const { error: payError } = await supabase.from('pos_invoice_payments').insert([{
        id: crypto.randomUUID(), invoice_id: invoice.id, amount: payload.paid_amount, payment_method: payload.payment_method, created_at: now
      }]);
      if (payError) throw payError;
    }

    // If fully paid, update status and appointment financial_status
    if (payload.status === 'paid') {
      await supabase.from('pos_invoices').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', invoice.id);
      if (payload.appointment_id) {
        await supabase.from('appointments').update({ financial_status: 'paid' }).eq('id', payload.appointment_id);
      }
    }

    return invoice;
  },

  async createPendingOrder(payload: any) {
    const { data, error } = await supabase.from('pending_orders').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }
};
