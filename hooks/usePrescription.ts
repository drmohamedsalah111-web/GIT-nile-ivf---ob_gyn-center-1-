/**
 * Smart Prescription Hook
 * Hook ذكي لإدارة الروشتات بسهولة
 */

import { useState, useEffect, useCallback } from 'react';
import { PrescriptionItem, Patient, Doctor } from '../types';
import { prescriptionService, PrescriptionSettings } from '../services/prescriptionService';
import toast from 'react-hot-toast';

export interface UsePrescriptionOptions {
  patientId?: string;
  autoSave?: boolean;
  enableInteractionCheck?: boolean;
}

export const usePrescription = (options: UsePrescriptionOptions = {}) => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [settings, setSettings] = useState<PrescriptionSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState<string[]>([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check interactions when prescriptions change
  useEffect(() => {
    if (options.enableInteractionCheck && prescriptions.length > 0) {
      const result = prescriptionService.checkDrugInteractions(prescriptions);
      setInteractionWarnings(result.warnings);
      
      if (result.hasInteractions) {
        toast.error(`⚠️ تم اكتشاف ${result.warnings.length} تفاعل دوائي محتمل`);
      }
    }
  }, [prescriptions, options.enableInteractionCheck]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await prescriptionService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('فشل تحميل إعدادات الروشتة');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = useCallback((medication: PrescriptionItem) => {
    setPrescriptions((prev) => {
      const exists = prev.find((p) => p.drug === medication.drug);
      if (exists) {
        toast.error('هذا الدواء موجود بالفعل');
        return prev;
      }
      toast.success('تمت إضافة الدواء');
      return [...prev, medication];
    });
  }, []);

  const removeMedication = useCallback((index: number) => {
    setPrescriptions((prev) => {
      const newList = prev.filter((_, i) => i !== index);
      toast.success('تم حذف الدواء');
      return newList;
    });
  }, []);

  const updateMedication = useCallback((index: number, updates: Partial<PrescriptionItem>) => {
    setPrescriptions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }, []);

  const clearPrescriptions = useCallback(() => {
    setPrescriptions([]);
    setInteractionWarnings([]);
    toast.success('تم مسح الروشتة');
  }, []);

  const loadPrescriptionTemplate = useCallback((template: PrescriptionItem[]) => {
    setPrescriptions(template);
    toast.success('تم تحميل القالب');
  }, []);

  const getSuggestions = useCallback(
    (diagnosis: string) => {
      return prescriptionService.getSuggestedMedications(diagnosis);
    },
    []
  );

  const savePrescription = useCallback(
    async (data: { diagnosis?: string; notes?: string }) => {
      if (!options.patientId) {
        toast.error('لم يتم تحديد المريض');
        return null;
      }

      setLoading(true);
      try {
        const id = await prescriptionService.savePrescriptionHistory({
          patientId: options.patientId,
          prescriptions,
          diagnosis: data.diagnosis,
          notes: data.notes,
        });

        if (id) {
          toast.success('تم حفظ الروشتة بنجاح');
          return id;
        } else {
          toast.error('فشل حفظ الروشتة');
          return null;
        }
      } catch (error) {
        console.error('Error saving prescription:', error);
        toast.error('حدث خطأ أثناء الحفظ');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options.patientId, prescriptions]
  );

  const printPrescription = useCallback(
    (printElement: HTMLElement) => {
      return prescriptionService.exportToPDF(printElement, `prescription_${Date.now()}.pdf`);
    },
    []
  );

  return {
    // State
    prescriptions,
    settings,
    loading,
    interactionWarnings,
    hasInteractions: interactionWarnings.length > 0,

    // Actions
    addMedication,
    removeMedication,
    updateMedication,
    clearPrescriptions,
    loadPrescriptionTemplate,
    getSuggestions,
    savePrescription,
    printPrescription,
    setPrescriptions,

    // Settings
    loadSettings,
  };
};
