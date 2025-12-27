import { supabase } from './supabaseClient';

// ============================================================================
// نظام إدارة الأقساط للحقن المجهري
// Installments Service for IVF Cycles
// ============================================================================

export interface IVFPackage {
  id: string;
  doctor_id: string;
  package_name: string;
  package_name_ar: string;
  description?: string;
  total_price: number;
  currency: string;
  default_installments: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  cycle_id: string;
  patient_id: string;
  doctor_id: string;
  package_id?: string;
  installment_number: number;
  installment_name: string;
  installment_name_ar: string;
  amount: number;
  currency: string;
  due_date?: string;
  due_on_event: 'cycle_start' | 'opu' | 'transfer' | 'custom';
  status: 'pending' | 'due' | 'paid' | 'overdue' | 'cancelled';
  paid_amount: number;
  paid_at?: string;
  paid_by?: string;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'other';
  receipt_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InstallmentPayment {
  id: string;
  installment_id: string;
  cycle_id: string;
  patient_id: string;
  doctor_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'other';
  receipt_number: string;
  recorded_by: string;
  notes?: string;
  payment_date: string;
  created_at: string;
}

export const installmentsService = {
  // ============================================================================
  // إدارة الباقات (Packages Management)
  // ============================================================================

  /**
   * جلب كل الباقات النشطة للطبيب الحالي
   */
  async getActivePackages(): Promise<{ data: IVFPackage[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ivf_packages')
        .select('*')
        .eq('is_active', true)
        .order('package_name_ar');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      return { data: null, error };
    }
  },

  /**
   * إنشاء باقة جديدة
   */
  async createPackage(packageData: Partial<IVFPackage>): Promise<{ data: IVFPackage | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ivf_packages')
        .insert([packageData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating package:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // إدارة الأقساط (Installments Management)
  // ============================================================================

  /**
   * إنشاء أقساط لدورة جديدة تلقائياً
   */
  async createInstallmentsForCycle(
    cycleId: string,
    patientId: string,
    doctorId: string,
    packageId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.rpc('create_installments_for_cycle', {
        p_cycle_id: cycleId,
        p_patient_id: patientId,
        p_doctor_id: doctorId,
        p_package_id: packageId
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error creating installments:', error);
      return { success: false, error };
    }
  },

  /**
   * جلب أقساط دورة معينة
   */
  async getInstallmentsByCycle(cycleId: string): Promise<{ data: Installment[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('installment_number');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching installments:', error);
      return { data: null, error };
    }
  },

  /**
   * جلب الأقساط المستحقة للمريضة
   */
  async getDueInstallmentsByPatient(patientId: string): Promise<{ data: Installment[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['due', 'overdue'])
        .order('due_date');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching due installments:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث حالة القسط عند الدفع
   */
  async payInstallment(
    installmentId: string,
    paymentData: {
      amount: number;
      payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'other';
      receipt_number: string;
      recorded_by: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; payment?: InstallmentPayment; error?: any }> {
    try {
      // جلب معلومات القسط
      const { data: installment, error: fetchError } = await supabase
        .from('installments')
        .select('*')
        .eq('id', installmentId)
        .single();

      if (fetchError) throw fetchError;
      if (!installment) throw new Error('القسط غير موجود');

      // تحديث حالة القسط
      const newPaidAmount = (installment.paid_amount || 0) + paymentData.amount;
      const isFullyPaid = newPaidAmount >= installment.amount;

      const { error: updateError } = await supabase
        .from('installments')
        .update({
          paid_amount: newPaidAmount,
          status: isFullyPaid ? 'paid' : installment.status,
          paid_at: isFullyPaid ? new Date().toISOString() : installment.paid_at,
          paid_by: paymentData.recorded_by,
          payment_method: paymentData.payment_method,
          receipt_number: paymentData.receipt_number,
          notes: paymentData.notes || installment.notes
        })
        .eq('id', installmentId);

      if (updateError) throw updateError;

      // تسجيل الدفعة في سجل المدفوعات
      const { data: payment, error: paymentError } = await supabase
        .from('installment_payments')
        .insert([{
          installment_id: installmentId,
          cycle_id: installment.cycle_id,
          patient_id: installment.patient_id,
          doctor_id: installment.doctor_id,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          receipt_number: paymentData.receipt_number,
          recorded_by: paymentData.recorded_by,
          notes: paymentData.notes,
          payment_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      return { success: true, payment };
    } catch (error: any) {
      console.error('Error paying installment:', error);
      return { success: false, error };
    }
  },

  /**
   * جلب تاريخ الدفعات لقسط معين
   */
  async getPaymentHistory(installmentId: string): Promise<{ data: InstallmentPayment[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('installment_payments')
        .select('*')
        .eq('installment_id', installmentId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      return { data: null, error };
    }
  },

  /**
   * تحديث حالة الأقساط المؤجلة إلى مستحقة عند حدث معين
   */
  async updateInstallmentStatusOnEvent(
    cycleId: string,
    event: 'opu' | 'transfer'
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('installments')
        .update({ 
          status: 'due',
          due_date: new Date().toISOString().split('T')[0] 
        })
        .eq('cycle_id', cycleId)
        .eq('due_on_event', event)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating installment status:', error);
      return { success: false, error };
    }
  },

  /**
   * إلغاء قسط
   */
  async cancelInstallment(installmentId: string, reason?: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('installments')
        .update({ 
          status: 'cancelled',
          notes: reason 
        })
        .eq('id', installmentId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling installment:', error);
      return { success: false, error };
    }
  },

  // ============================================================================
  // تقارير وإحصائيات (Reports & Statistics)
  // ============================================================================

  /**
   * جلب ملخص الأقساط للطبيب (Dashboard)
   */
  async getInstallmentsSummary(): Promise<{ 
    data: {
      total_pending: number;
      total_due: number;
      total_overdue: number;
      total_paid: number;
      total_amount_pending: number;
      total_amount_due: number;
      total_amount_paid: number;
    } | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('status, amount, paid_amount');

      if (error) throw error;

      const summary = {
        total_pending: 0,
        total_due: 0,
        total_overdue: 0,
        total_paid: 0,
        total_amount_pending: 0,
        total_amount_due: 0,
        total_amount_paid: 0
      };

      data?.forEach((inst: any) => {
        if (inst.status === 'pending') {
          summary.total_pending++;
          summary.total_amount_pending += inst.amount;
        } else if (inst.status === 'due') {
          summary.total_due++;
          summary.total_amount_due += inst.amount - (inst.paid_amount || 0);
        } else if (inst.status === 'overdue') {
          summary.total_overdue++;
          summary.total_amount_due += inst.amount - (inst.paid_amount || 0);
        } else if (inst.status === 'paid') {
          summary.total_paid++;
          summary.total_amount_paid += inst.paid_amount || 0;
        }
      });

      return { data: summary, error: null };
    } catch (error: any) {
      console.error('Error fetching installments summary:', error);
      return { data: null, error };
    }
  }
};

export default installmentsService;
