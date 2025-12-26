/**
 * Smart Prescription Service
 * نظام ذكي متكامل لإدارة الروشتات الطبية
 */

import { supabase } from './supabaseClient';
import { PrescriptionItem } from '../types';

export interface PrescriptionTemplate {
  id: string;
  name: string;
  name_ar: string;
  template_type: 'modern' | 'classic' | 'minimal' | 'elegant';
  preview_image?: string;
}

export interface PrescriptionSettings {
  id?: number;
  clinic_id: number;
  template_type: 'modern' | 'classic' | 'minimal' | 'elegant';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  header_text: string;
  footer_text: string;
  show_watermark: boolean;
  show_clinic_address: boolean;
  show_clinic_phone: boolean;
  show_doctor_signature: boolean;
  show_qr_code: boolean;
  font_family: 'tajawal' | 'cairo' | 'almarai' | 'inter';
  font_size: 'small' | 'medium' | 'large';
  paper_size: 'A4' | 'A5' | 'Letter';
  header_style: 'gradient' | 'solid' | 'bordered' | 'minimal';
  rx_symbol_style: 'classic' | 'modern' | 'minimal';
  drug_layout: 'list' | 'table' | 'cards';
  show_drug_category: boolean;
  show_arabic_translation: boolean;
  auto_number_drugs: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: Partial<PrescriptionSettings> = {
  template_type: 'modern',
  primary_color: '#0891B2',
  secondary_color: '#06B6D4',
  accent_color: '#22D3EE',
  header_text: 'عيادة متخصصة',
  footer_text: 'العنوان | الهاتف',
  show_watermark: false,
  show_clinic_address: true,
  show_clinic_phone: true,
  show_doctor_signature: true,
  show_qr_code: false,
  font_family: 'tajawal',
  font_size: 'medium',
  paper_size: 'A4',
  header_style: 'gradient',
  rx_symbol_style: 'modern',
  drug_layout: 'list',
  show_drug_category: true,
  show_arabic_translation: true,
  auto_number_drugs: true,
};

class PrescriptionService {
  /**
   * جلب إعدادات الروشتة
   */
  async getSettings(clinicId: number = 1): Promise<PrescriptionSettings> {
    try {
      const { data, error } = await supabase
        .from('clinic_print_settings')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();

      // If table doesn't exist (PGRST205) or no data (PGRST116), return defaults silently
      if (error) {
        if (error.code === 'PGRST205') {
          // Table doesn't exist - return defaults without logging
          return { ...DEFAULT_SETTINGS, clinic_id: clinicId } as PrescriptionSettings;
        }
        if (error.code !== 'PGRST116') {
          console.warn('Prescription settings not available, using defaults');
        }
      }

      return { ...DEFAULT_SETTINGS, ...data, clinic_id: clinicId } as PrescriptionSettings;
    } catch (error) {
      // Fail silently and return defaults
      return { ...DEFAULT_SETTINGS, clinic_id: clinicId } as PrescriptionSettings;
    }
  }

  /**
   * حفظ إعدادات الروشتة
   */
  async saveSettings(settings: Partial<PrescriptionSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clinic_print_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });

      // If table doesn't exist, fail silently
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('Prescription settings table not available');
          return false;
        }
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error saving prescription settings:', error);
      return false;
    }
  }

  /**
   * الحصول على القوالب المتاحة
   */
  getAvailableTemplates(): PrescriptionTemplate[] {
    return [
      {
        id: 'modern',
        name: 'Modern',
        name_ar: 'عصري',
        template_type: 'modern',
      },
      {
        id: 'classic',
        name: 'Classic',
        name_ar: 'كلاسيكي',
        template_type: 'classic',
      },
      {
        id: 'minimal',
        name: 'Minimal',
        name_ar: 'بسيط',
        template_type: 'minimal',
      },
      {
        id: 'elegant',
        name: 'Elegant',
        name_ar: 'أنيق',
        template_type: 'elegant',
      },
    ];
  }

  /**
   * معالجة الروشتة قبل الطباعة
   */
  processPrescription(prescriptions: PrescriptionItem[], settings: PrescriptionSettings) {
    return prescriptions.map((item, index) => ({
      ...item,
      number: settings.auto_number_drugs ? index + 1 : undefined,
      arabicName: settings.show_arabic_translation ? this.getArabicDrugName(item.drug) : undefined,
      category: settings.show_drug_category ? item.category : undefined,
    }));
  }

  /**
   * الحصول على الاسم العربي للدواء
   */
  private getArabicDrugName(drugName: string): string {
    // This would ideally fetch from your EGYPTIAN_DRUGS_ARABIC constant
    // For now, return a placeholder
    return drugName; // Replace with actual Arabic translation logic
  }

  /**
   * إنشاء QR Code للروشتة
   */
  async generateQRCode(prescriptionData: any): Promise<string> {
    // Implement QR code generation
    // This could include prescription ID, patient ID, date, etc.
    const dataString = JSON.stringify({
      id: prescriptionData.id,
      patientId: prescriptionData.patientId,
      date: new Date().toISOString(),
    });
    return `data:image/svg+xml;base64,${btoa(dataString)}`;
  }

  /**
   * التحقق من التفاعلات الدوائية
   */
  checkDrugInteractions(prescriptions: PrescriptionItem[]): {
    hasInteractions: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const drugNames = prescriptions.map((p) => p.drug.toLowerCase());

    // Example interaction checks (expand as needed)
    if (drugNames.includes('aspirin') && drugNames.includes('warfarin')) {
      warnings.push('تحذير: تفاعل محتمل بين Aspirin و Warfarin - خطر النزيف');
    }

    return {
      hasInteractions: warnings.length > 0,
      warnings,
    };
  }

  /**
   * اقتراحات ذكية للأدوية بناءً على التشخيص
   */
  getSuggestedMedications(diagnosis: string): PrescriptionItem[] {
    const suggestions: Record<string, PrescriptionItem[]> = {
      'hypertension': [
        { drug: 'Amlodipine 5mg', dose: '1 tab', category: 'Antihypertensive' },
        { drug: 'Losartan 50mg', dose: '1 tab', category: 'Antihypertensive' },
      ],
      'diabetes': [
        { drug: 'Metformin 500mg', dose: '1 tab', category: 'Antidiabetic' },
      ],
      'infection': [
        { drug: 'Augmentin 1g', dose: '1 tab', category: 'Antibiotic' },
      ],
    };

    const normalizedDiagnosis = diagnosis.toLowerCase();
    for (const [key, meds] of Object.entries(suggestions)) {
      if (normalizedDiagnosis.includes(key)) {
        return meds;
      }
    }

    return [];
  }

  /**
   * حفظ الروشتة في السجل
   */
  async savePrescriptionHistory(data: {
    patientId: string;
    prescriptions: PrescriptionItem[];
    diagnosis?: string;
    notes?: string;
  }): Promise<string | null> {
    try {
      const { data: result, error } = await supabase
        .from('prescription_history')
        .insert({
          patient_id: data.patientId,
          prescriptions: JSON.stringify(data.prescriptions),
          diagnosis: data.diagnosis,
          notes: data.notes,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return result.id;
    } catch (error) {
      console.error('Error saving prescription history:', error);
      return null;
    }
  }

  /**
   * جلب تاريخ الروشتات
   */
  async getPrescriptionHistory(patientId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('prescription_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching prescription history:', error);
      return [];
    }
  }

  /**
   * تصدير الروشتة كـ PDF
   */
  async exportToPDF(element: HTMLElement, filename: string): Promise<boolean> {
    try {
      // This would use a library like html2pdf or jsPDF
      // For now, trigger browser print
      window.print();
      return true;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return false;
    }
  }
}

export const prescriptionService = new PrescriptionService();
