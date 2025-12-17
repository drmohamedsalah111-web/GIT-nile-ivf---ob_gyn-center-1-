import { supabase } from './supabaseClient';
import { authService } from './authService';

export interface LabTest {
  id: string;
  name: string;
  category: string;
  unit?: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  referenceRangeText?: string;
  isActive?: boolean;
}

export interface LabRequest {
  id: string;
  patientId: string;
  doctorId: string;
  requestDate: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  clinicalIndication?: string;
}

export interface LabRequestItem {
  id: string;
  requestId: string;
  testId: string;
  priority: 'Normal' | 'Urgent';
  notes?: string;
  testName?: string;
  testUnit?: string;
}

export interface LabResult {
  id: string;
  requestItemId: string;
  resultValue?: number;
  resultText?: string;
  resultDate?: string;
  isAbnormal: boolean;
  abnormalType?: 'Low' | 'High' | 'Critical';
  interpretation?: string;
  notes?: string;
}

export const labService = {
  // --- Lab Tests Catalog ---
  getTestsCatalog: async (): Promise<LabTest[]> => {
    const { data, error } = await supabase
      .from('lab_tests_catalog')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      unit: t.unit,
      referenceRangeMin: t.reference_range_min,
      referenceRangeMax: t.reference_range_max,
      referenceRangeText: t.reference_range_text,
      isActive: t.is_active
    }));
  },

  getTestsByCategory: async (category: string): Promise<LabTest[]> => {
    const { data, error } = await supabase
      .from('lab_tests_catalog')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      unit: t.unit,
      referenceRangeMin: t.reference_range_min,
      referenceRangeMax: t.reference_range_max,
      referenceRangeText: t.reference_range_text
    }));
  },

  // --- Lab Requests ---
  createRequest: async (patientId: string, testIds: string[], notes?: string): Promise<string> => {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const doctor = await authService.ensureDoctorRecord(user.id, user.email || '');
    if (!doctor?.id) throw new Error('Doctor profile missing');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: requestError } = await supabase
      .from('lab_requests')
      .insert([{
        id,
        patient_id: patientId,
        doctor_id: doctor.id,
        request_date: now,
        status: 'Pending',
        notes: notes || null
      }]);

    if (requestError) throw requestError;

    // Add request items
    const items = testIds.map(testId => ({
      id: crypto.randomUUID(),
      request_id: id,
      test_id: testId,
      priority: 'Normal'
    }));

    const { error: itemsError } = await supabase
      .from('lab_request_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return id;
  },

  getPatientRequests: async (patientId: string): Promise<(LabRequest & { items: LabRequestItem[] })[]> => {
    const { data: requests, error: reqError } = await supabase
      .from('lab_requests')
      .select('*')
      .eq('patient_id', patientId)
      .order('request_date', { ascending: false });

    if (reqError) throw reqError;

    const { data: items, error: itemError } = await supabase
      .from('lab_request_items')
      .select(`
        id,
        request_id,
        test_id,
        priority,
        notes,
        lab_tests_catalog(name, unit)
      `)
      .in('request_id', requests?.map(r => r.id) || []);

    if (itemError) throw itemError;

    return (requests || []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      doctorId: r.doctor_id,
      requestDate: r.request_date,
      status: r.status,
      notes: r.notes,
      clinicalIndication: r.clinical_indication,
      items: (items || [])
        .filter((i: any) => i.request_id === r.id)
        .map((i: any) => ({
          id: i.id,
          requestId: i.request_id,
          testId: i.test_id,
          priority: i.priority,
          notes: i.notes,
          testName: i.lab_tests_catalog?.name,
          testUnit: i.lab_tests_catalog?.unit
        }))
    }));
  },

  updateRequestStatus: async (requestId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('lab_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
  },

  deleteRequest: async (requestId: string): Promise<void> => {
    const { error } = await supabase
      .from('lab_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;
  },

  // --- Lab Results ---
  saveResult: async (requestItemId: string, result: Omit<LabResult, 'id' | 'requestItemId'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('lab_results')
      .insert([{
        id,
        request_item_id: requestItemId,
        result_value: result.resultValue || null,
        result_text: result.resultText || null,
        result_date: result.resultDate || now,
        is_abnormal: result.isAbnormal || false,
        abnormal_type: result.abnormalType || null,
        interpretation: result.interpretation || null,
        notes: result.notes || null,
        created_at: now,
        updated_at: now
      }]);

    if (error) throw error;
    return id;
  },

  getResults: async (requestId: string): Promise<(LabResult & { testName?: string; testUnit?: string })[]> => {
    const { data, error } = await supabase
      .from('lab_results')
      .select(`
        id,
        request_item_id,
        result_value,
        result_text,
        result_date,
        is_abnormal,
        abnormal_type,
        interpretation,
        notes,
        lab_request_items(
          test_id,
          lab_tests_catalog(name, unit)
        )
      `)
      .in('request_item_id', 
        await supabase
          .from('lab_request_items')
          .select('id')
          .eq('request_id', requestId)
          .then(({ data }) => data?.map((i: any) => i.id) || [])
      );

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      requestItemId: r.request_item_id,
      resultValue: r.result_value,
      resultText: r.result_text,
      resultDate: r.result_date,
      isAbnormal: r.is_abnormal,
      abnormalType: r.abnormal_type,
      interpretation: r.interpretation,
      notes: r.notes,
      testName: (r.lab_request_items as any)?.lab_tests_catalog?.name,
      testUnit: (r.lab_request_items as any)?.lab_tests_catalog?.unit
    }));
  }
};
