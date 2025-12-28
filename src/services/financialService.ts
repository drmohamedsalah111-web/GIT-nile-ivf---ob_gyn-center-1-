/**
 * Financial Services Layer
 * Handles all database operations for the billing system
 */

import { supabase } from '../lib/supabase';

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  category: 'Outpatient' | 'Procedure' | 'Lab' | 'Pharmacy' | 'IVF' | 'Antenatal';
  price: number;
  cost_price?: number;
  commission_type?: 'fixed' | 'percentage' | 'none';
  commission_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  category: 'IVF' | 'ICSI' | 'Antenatal' | 'Custom';
  total_price: number;
  included_services?: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialCase {
  id: string;
  clinic_id: string;
  patient_id: string;
  cycle_id?: string;
  package_id?: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  remaining_amount?: number;
  status: 'Open' | 'Closed' | 'Cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Installment {
  id: string;
  case_id: string;
  title: string;
  amount: number;
  due_date?: string;
  is_paid: boolean;
  paid_at?: string;
  payment_method?: 'Cash' | 'Visa' | 'Bank Transfer' | 'Insurance';
  invoice_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_method: 'Cash' | 'Visa' | 'Bank Transfer' | 'Insurance' | 'Deferred';
  payment_reference?: string;
  invoice_type: 'service' | 'installment' | 'package';
  case_id?: string;
  installment_id?: string;
  status: 'Draft' | 'Paid' | 'Cancelled' | 'Refunded';
  notes?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id?: string;
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

// ============================================================
// SERVICES MANAGEMENT
// ============================================================

export const servicesAPI = {
  /**
   * Get all active services for a clinic
   */
  async getServices(clinicId: string, includeInactive = false) {
    let query = supabase
      .from('services')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Service[];
  },

  /**
   * Get a single service by ID
   */
  async getService(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Service;
  },

  /**
   * Create a new service
   */
  async createService(service: Partial<Service> | Partial<Service>[]) {
    try {
      // Prevent accidental inserts without a clinic_id which cause FK errors
      const isArray = Array.isArray(service);
      const items = isArray ? service : [service];

      if (items.some((s) => !s || !('clinic_id' in s) || !s.clinic_id)) {
        console.warn('servicesAPI.createService: missing clinic_id on one or more items, aborting insert');
        throw new Error('Missing clinic_id: cannot create service without clinic_id');
      }

      // When inserting many default services, use ignoreDuplicates to avoid 409s
      const q = supabase.from('services').insert(service as any).select();

      // If bulk insert, ask PostgREST to ignore duplicate unique-key conflicts
      // (Supported by Supabase JS through .options)
      if (isArray) {
        // @ts-ignore - Supabase client supports .options for PostgREST
        q.options({ ignoreDuplicates: true });
      }

      const { data, error } = await q;

      if (error) throw error;

      // If a single object was inserted, return the single service shape
      if (!isArray) return (data && data[0]) as Service;
      return data as Service[];
    } catch (err: any) {
      console.error('servicesAPI.createService error', err?.message ?? err);
      throw err;
    }
  },

  /**
   * Update an existing service
   */
  async updateService(id: string, updates: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  /**
   * Bulk update prices (inflation adjustment)
   */
  async bulkUpdatePrices(clinicId: string, percentage: number) {
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('id, price')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    const updates = services.map((service) => ({
      id: service.id,
      price: Math.round(service.price * (1 + percentage / 100) * 100) / 100,
    }));

    const { error: updateError } = await supabase
      .from('services')
      .upsert(updates);

    if (updateError) throw updateError;
    return updates.length;
  },

  /**
   * Toggle service active status
   */
  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  /**
   * Delete a service (soft delete by marking inactive)
   */
  async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Initialize a list of default services for a clinic.
   * This is safe to call repeatedly; duplicates are ignored server-side.
   */
  async initializeDefaultServices(defaultServices: Partial<Service>[], clinicId: string) {
    if (!clinicId) {
      console.warn('initializeDefaultServices: missing clinicId, aborting');
      return;
    }

    const servicesWithId = defaultServices.map((s) => ({ ...s, clinic_id: clinicId }));

    // Use ignoreDuplicates to avoid 409 Conflict on repeated runs
    const q = supabase.from('services').insert(servicesWithId).select();
    // @ts-ignore
    q.options({ ignoreDuplicates: true });

    const { data, error } = await q;
    if (error) {
      console.error('initializeDefaultServices error', error);
      throw error;
    }
    return data as Service[];
  },
};

// ============================================================
// PACKAGES MANAGEMENT
// ============================================================

export const packagesAPI = {
  /**
   * Get all packages for a clinic
   */
  async getPackages(clinicId: string, includeInactive = false) {
    let query = supabase
      .from('packages')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Package[];
  },

  /**
   * Create a new package
   */
  async createPackage(pkg: Partial<Package>) {
    const { data, error } = await supabase
      .from('packages')
      .insert(pkg)
      .select()
      .single();

    if (error) throw error;
    return data as Package;
  },

  /**
   * Update a package
   */
  async updatePackage(id: string, updates: Partial<Package>) {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Package;
  },
};

// ============================================================
// FINANCIAL CASES MANAGEMENT
// ============================================================

export const casesAPI = {
  /**
   * Get all cases for a patient
   */
  async getPatientCases(patientId: string) {
    const { data, error } = await supabase
      .from('financial_cases')
      .select('*, packages(*), patients(name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get a single case with installments
   */
  async getCase(caseId: string) {
    const { data, error } = await supabase
      .from('financial_cases')
      .select(`
        *,
        packages(*),
        patients(name, phone),
        installments(*)
      `)
      .eq('id', caseId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new financial case
   */
  async createCase(caseData: Partial<FinancialCase>) {
    const { data, error } = await supabase
      .from('financial_cases')
      .insert(caseData)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialCase;
  },

  /**
   * Update case status
   */
  async updateCase(caseId: string, updates: Partial<FinancialCase>) {
    const { data, error } = await supabase
      .from('financial_cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialCase;
  },

  /**
   * Get all open cases for a clinic
   */
  async getOpenCases(clinicId: string) {
    const { data, error } = await supabase
      .from('financial_cases')
      .select('*, patients(name), packages(name)')
      .eq('clinic_id', clinicId)
      .eq('status', 'Open')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// ============================================================
// INSTALLMENTS MANAGEMENT
// ============================================================

export const installmentsAPI = {
  /**
   * Get installments for a case
   */
  async getCaseInstallments(caseId: string) {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('case_id', caseId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as Installment[];
  },

  /**
   * Create multiple installments for a case
   */
  async createInstallments(installments: Partial<Installment>[]) {
    const { data, error } = await supabase
      .from('installments')
      .insert(installments)
      .select();

    if (error) throw error;
    return data as Installment[];
  },

  /**
   * Mark installment as paid
   */
  async markAsPaid(
    installmentId: string,
    paymentMethod: string,
    invoiceId?: string
  ) {
    const { data, error } = await supabase
      .from('installments')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        invoice_id: invoiceId,
      })
      .eq('id', installmentId)
      .select()
      .single();

    if (error) throw error;
    return data as Installment;
  },

  /**
   * Get overdue installments for a clinic
   */
  async getOverdueInstallments(clinicId: string) {
    const { data, error } = await supabase
      .from('installments')
      .select(`
        *,
        financial_cases!inner(clinic_id, patient_id, patients(name, phone))
      `)
      .eq('financial_cases.clinic_id', clinicId)
      .eq('is_paid', false)
      .lt('due_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;
    return data;
  },
};

// ============================================================
// INVOICES & PAYMENTS
// ============================================================

export const invoicesAPI = {
  /**
   * Create a simple service invoice
   */
  async createServiceInvoice(
    clinicId: string,
    patientId: string,
    doctorId: string,
    items: Partial<InvoiceItem>[],
    paymentMethod: string,
    discount = 0,
    notes?: string
  ) {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total = subtotal - discount;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        doctor_id: doctorId,
        subtotal,
        discount,
        tax: 0,
        total_amount: total,
        payment_method: paymentMethod,
        invoice_type: 'service',
        status: 'Paid',
        notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const itemsWithInvoiceId = items.map((item) => ({
      ...item,
      invoice_id: invoice.id,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);

    if (itemsError) throw itemsError;

    return invoice as Invoice;
  },

  /**
   * Create an installment payment invoice
   */
  async createInstallmentInvoice(
    clinicId: string,
    patientId: string,
    doctorId: string,
    caseId: string,
    installmentId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        doctor_id: doctorId,
        subtotal: amount,
        discount: 0,
        tax: 0,
        total_amount: amount,
        payment_method: paymentMethod,
        invoice_type: 'installment',
        case_id: caseId,
        installment_id: installmentId,
        status: 'Paid',
        notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Mark installment as paid
    await installmentsAPI.markAsPaid(installmentId, paymentMethod, invoice.id);

    return invoice as Invoice;
  },

  /**
   * Get invoices for a date range
   */
  async getInvoices(
    clinicId: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ) {
    let query = supabase
      .from('invoices')
      .select('*, patients(name), doctors(clinic_name)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    const normalizeDateForFilter = (d?: string) => {
      if (!d) return d;
      try {
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return d;
        return parsed.toISOString();
      } catch (e) {
        return d;
      }
    };

    if (startDate) {
      query = query.gte('created_at', normalizeDateForFilter(startDate));
    }
    if (endDate) {
      query = query.lte('created_at', normalizeDateForFilter(endDate));
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Get invoice with items
   */
  async getInvoiceDetails(invoiceId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients(name, phone),
        doctors(clinic_name, clinic_address, clinic_phone),
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get daily revenue summary
   */
  async getDailyRevenue(clinicId: string, date: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('total_amount, invoice_type, payment_method')
      .eq('clinic_id', clinicId)
      .eq('status', 'Paid')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (error) throw error;

    const summary = {
      total: 0,
      serviceRevenue: 0,
      installmentRevenue: 0,
      packageRevenue: 0,
      cashPayments: 0,
      cardPayments: 0,
      invoiceCount: data.length,
    };

    data.forEach((invoice) => {
      summary.total += invoice.total_amount;

      if (invoice.invoice_type === 'service' || invoice.invoice_type === 'Service') {
        summary.serviceRevenue += invoice.total_amount;
      } else if (invoice.invoice_type === 'installment' || invoice.invoice_type === 'Installment') {
        summary.installmentRevenue += invoice.total_amount;
      } else if (invoice.invoice_type === 'package' || invoice.invoice_type === 'Package') {
        summary.packageRevenue += invoice.total_amount;
      }

      if (invoice.payment_method === 'Cash') {
        summary.cashPayments += invoice.total_amount;
      } else if (invoice.payment_method === 'Visa') {
        summary.cardPayments += invoice.total_amount;
      }
    });

    return summary;
  },
};

export default {
  services: servicesAPI,
  packages: packagesAPI,
  cases: casesAPI,
  installments: installmentsAPI,
  invoices: invoicesAPI,
};
