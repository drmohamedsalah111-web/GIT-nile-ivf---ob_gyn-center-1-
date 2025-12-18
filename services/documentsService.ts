import { supabase } from './supabaseClient';

export interface PatientDocument {
  id: string;
  patient_id: string;
  doctor_id: string;
  file_name: string;
  file_url: string;
  file_type: 'Image' | 'PDF';
  category: 'Lab' | 'Scan' | 'Rx' | 'Other';
  file_size_bytes?: number;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const documentsService = {
  getDocumentsByPatient: async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      return (data || []) as PatientDocument[];
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      throw error;
    }
  },

  getDocumentsByCategory: async (patientId: string, category: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as PatientDocument[];
    } catch (error) {
      console.error('Error fetching documents by category:', error);
      throw error;
    }
  },

  uploadDocument: async (params: {
    patientId: string;
    doctorId: string;
    file: File;
    category: 'Lab' | 'Scan' | 'Rx' | 'Other';
    fileName?: string;
    tags?: string[];
    notes?: string;
  }) => {
    try {
      const id = crypto.randomUUID();
      const timestamp = Date.now();
      const fileName = params.fileName || params.file.name;
      const fileExtension = fileName.split('.').pop() || 'file';
      const storagePath = `${params.patientId}/${id}_${timestamp}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient_documents')
        .upload(storagePath, params.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('patient_documents')
        .getPublicUrl(storagePath);

      const fileUrl = urlData?.publicUrl || '';

      const fileType = params.file.type.startsWith('image/') ? 'Image' : 'PDF';

      const { data: docData, error: dbError } = await supabase
        .from('patient_documents')
        .insert([{
          id,
          patient_id: params.patientId,
          doctor_id: params.doctorId,
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType,
          category: params.category,
          file_size_bytes: params.file.size,
          tags: params.tags || [],
          notes: params.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      return (docData?.[0] || {}) as PatientDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  updateDocumentMetadata: async (documentId: string, params: {
    tags?: string[];
    notes?: string;
    category?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .update({
          tags: params.tags,
          notes: params.notes,
          category: params.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select();

      if (error) throw error;

      return (data?.[0] || {}) as PatientDocument;
    } catch (error) {
      console.error('Error updating document metadata:', error);
      throw error;
    }
  },

  deleteDocument: async (documentId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('patient_documents')
        .remove([storagePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw storageError;
      }

      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  getStoragePublicUrl: (patientId: string, fileName: string) => {
    const { data } = supabase.storage
      .from('patient_documents')
      .getPublicUrl(`${patientId}/${fileName}`);

    return data?.publicUrl || '';
  }
};
