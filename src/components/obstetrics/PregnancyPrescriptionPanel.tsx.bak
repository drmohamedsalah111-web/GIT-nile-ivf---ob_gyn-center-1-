import React, { useState, useEffect, useRef } from 'react';
import { Pill, Plus, Check, Trash2, Printer, AlertCircle, X, Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';
import PrescriptionTemplate from '../../../components/PrescriptionTemplate';

// Pregnancy medications - Egyptian trade names in English
const PREGNANCY_MEDICATIONS = {
  vitamins: {
    title: 'Vitamins & Supplements',
    titleAr: 'الفيتامينات والمكملات',
    color: 'emerald',
    medications: [
      { id: 'folic_acid', name: 'Folic Acid 5mg', tradeName: 'Folicap / Folicare', frequency: 'Once daily' },
      { id: 'prenatal', name: 'Prenatal Multivitamin', tradeName: 'Pregnacare / Vitapreg / Maternavit', frequency: 'Once daily' },
      { id: 'iron', name: 'Iron + Folic Acid', tradeName: 'Ferrovit / Haemoton / Pharmaton', frequency: 'Once or twice daily' },
      { id: 'calcium', name: 'Calcium + Vitamin D', tradeName: 'Calcimate D / Calcivit D / Osteocare', frequency: 'Twice daily' },
      { id: 'omega3', name: 'Omega-3', tradeName: 'Octatron / Omega Plus', frequency: 'Once daily' },
      { id: 'vitd', name: 'Vitamin D 50,000 IU', tradeName: 'Vidrop / Devarol-S', frequency: 'Weekly' },
      { id: 'lactoferrin', name: 'Lactoferrin', tradeName: 'Pravotin / Pravotin Sachet', frequency: 'Twice daily' },
    ]
  },
  nausea: {
    title: 'Nausea & Vomiting',
    titleAr: 'الغثيان والقيء',
    color: 'orange',
    medications: [
      { id: 'xonvea', name: 'Doxylamine + Pyridoxine', tradeName: 'Xonvea / Diclegis', frequency: 'As directed' },
      { id: 'ondansetron', name: 'Ondansetron 4mg', tradeName: 'Zofran / Emeset', frequency: 'Every 8 hours PRN' },
      { id: 'metoclopramide', name: 'Metoclopramide 10mg', tradeName: 'Primperan / Controloc', frequency: 'Every 8 hours PRN' },
      { id: 'meclizine', name: 'Meclizine 25mg', tradeName: 'Dramamine', frequency: 'Twice daily PRN' },
      { id: 'navidoxine', name: 'Meclizine + B6', tradeName: 'Navidoxine', frequency: 'Once daily at bedtime' },
    ]
  },
  gi: {
    title: 'Gastrointestinal',
    titleAr: 'الجهاز الهضمي',
    color: 'teal',
    medications: [
      { id: 'omeprazole', name: 'Omeprazole 20mg', tradeName: 'Gastroloc / Omiz', frequency: 'Once daily before breakfast' },
      { id: 'esomeprazole', name: 'Esomeprazole 40mg', tradeName: 'Nexium / Ezoloc', frequency: 'Once daily' },
      { id: 'antacid', name: 'Antacid', tradeName: 'Maalox / Gaviscon / Epicogel', frequency: 'After meals PRN' },
      { id: 'lactulose', name: 'Lactulose', tradeName: 'Duphalac / Laevolac', frequency: 'Once or twice daily' },
      { id: 'fiber', name: 'Fiber Supplement', tradeName: 'Agiolax', frequency: 'Once daily' },
      { id: 'simethicone', name: 'Simethicone', tradeName: 'Disflatyl', frequency: 'Three times daily' },
    ]
  },
  antibiotics: {
    title: 'Antibiotics',
    titleAr: 'المضادات الحيوية',
    color: 'rose',
    medications: [
      { id: 'amoxicillin', name: 'Amoxicillin 1000mg', tradeName: 'Augmentin / E-Mox / Hibiotic', frequency: 'Twice daily' },
      { id: 'cephalexin', name: 'Cephalexin 500mg', tradeName: 'Ceporex / Keflex', frequency: 'Every 6-8 hours' },
      { id: 'azithromycin', name: 'Azithromycin 500mg', tradeName: 'Zithromax / Azithrocin', frequency: 'Once daily x 3-5 days' },
      { id: 'nitrofurantoin', name: 'Nitrofurantoin 100mg', tradeName: 'Furadantin / Macrofuran', frequency: 'Twice daily' },
      { id: 'cefixime', name: 'Cefixime 400mg', tradeName: 'Suprax / Magnacef', frequency: 'Once daily' },
    ]
  },
  hypertension: {
    title: 'Antihypertensives',
    titleAr: 'أدوية الضغط',
    color: 'blue',
    medications: [
      { id: 'methyldopa', name: 'Methyldopa 250mg', tradeName: 'Aldomet', frequency: 'Twice or three times daily' },
      { id: 'labetalol', name: 'Labetalol 100mg', tradeName: 'Trandate', frequency: 'Twice daily' },
      { id: 'nifedipine', name: 'Nifedipine 10mg SR', tradeName: 'Epilat Retard', frequency: 'Twice daily' },
    ]
  },
  thyroid: {
    title: 'Thyroid Medications',
    titleAr: 'أدوية الغدة الدرقية',
    color: 'purple',
    medications: [
      { id: 'levothyroxine', name: 'Levothyroxine', tradeName: 'Eltroxin / Euthyrox', frequency: 'Once daily on empty stomach' },
      { id: 'ptu', name: 'Propylthiouracil', tradeName: 'PTU', frequency: 'As directed' },
    ]
  },
  anticoagulation: {
    title: 'Anticoagulation',
    titleAr: 'مضادات التخثر',
    color: 'slate',
    medications: [
      { id: 'clexane', name: 'LMWH 40mg', tradeName: 'Clexane 40mg', frequency: 'Once daily SC' },
      { id: 'clexane60', name: 'LMWH 60mg', tradeName: 'Clexane 60mg', frequency: 'Once daily SC' },
      { id: 'aspirin', name: 'Aspirin 75mg', tradeName: 'Jusprin / Aspocid', frequency: 'Once daily' },
    ]
  },
  progesterone: {
    title: 'Progesterone Support',
    titleAr: 'دعم البروجسترون',
    color: 'fuchsia',
    medications: [
      { id: 'cyclogest', name: 'Progesterone 400mg vaginal', tradeName: 'Cyclogest / Prontogest', frequency: 'Twice daily' },
      { id: 'duphaston', name: 'Dydrogesterone 10mg', tradeName: 'Duphaston', frequency: 'Twice daily' },
      { id: 'proluton', name: 'Progesterone 250mg IM', tradeName: 'Proluton Depot', frequency: 'Weekly' },
      { id: 'utrogestan', name: 'Progesterone 100/200mg', tradeName: 'Utrogestan', frequency: 'As directed' },
    ]
  },
  tocolytics: {
    title: 'Tocolytics (Preterm Labor)',
    titleAr: 'مثبطات الطلق المبكر',
    color: 'sky',
    medications: [
      { id: 'nifedipine_tocolytic', name: 'Nifedipine 10mg', tradeName: 'Epilat', frequency: 'As directed' },
      { id: 'ritodrine', name: 'Ritodrine', tradeName: 'Yutopar', frequency: 'As directed' },
      { id: 'indomethacin', name: 'Indomethacin 50mg', tradeName: 'Indocin', frequency: 'As directed' },
    ]
  },
  corticosteroids: {
    title: 'Fetal Lung Maturity',
    titleAr: 'حقن الرئة للجنين',
    color: 'lime',
    medications: [
      { id: 'betamethasone', name: 'Betamethasone 12mg IM', tradeName: 'Celestone', frequency: 'Two doses 24h apart' },
      { id: 'dexamethasone', name: 'Dexamethasone 6mg IM', tradeName: 'Fortecortin / Dexamethasone', frequency: 'Four doses 12h apart' },
    ]
  },
  diabetes: {
    title: 'Anti-Diabetics',
    titleAr: 'أدوية السكر',
    color: 'amber',
    medications: [
      { id: 'insulin_rapid', name: 'Rapid Acting Insulin', tradeName: 'NovoRapid / Humalog', frequency: 'Before meals' },
      { id: 'insulin_long', name: 'Long Acting Insulin', tradeName: 'Lantus / Levemir', frequency: 'Once daily' },
      { id: 'metformin', name: 'Metformin 500/1000mg', tradeName: 'Glucophage / Cidophage', frequency: 'As directed' },
    ]
  },
  infections: {
    title: 'Vaginal Infections',
    titleAr: 'الالتهابات المهبلية',
    color: 'yellow',
    medications: [
      { id: 'clotrimazole', name: 'Clotrimazole Cream/Vaginal', tradeName: 'Canesten / Gynozol', frequency: 'At bedtime' },
      { id: 'miconazole', name: 'Miconazole Vaginal', tradeName: 'Gyno-Daktarin', frequency: 'At bedtime' },
      { id: 'metronidazole', name: 'Metronidazole 500mg', tradeName: 'Flagyl / Amrizole', frequency: 'Twice daily' },
      { id: 'clindamycin', name: 'Clindamycin Vaginal', tradeName: 'Dalacin V', frequency: 'At bedtime' },
      { id: 'betadine_vaginal', name: 'Povidone-Iodine Vaginal', tradeName: 'Betadine Vaginal Douche', frequency: 'As directed' },
    ]
  },
  hemorrhoids: {
    title: 'Hemorrhoids & Varicose',
    titleAr: 'البواسير والدوالي',
    color: 'stone',
    medications: [
      { id: 'daflon', name: 'Diosmin + Hesperidin', tradeName: 'Daflon 500mg', frequency: 'Twice daily' },
      { id: 'proctoglyvenol', name: 'Hemorrhoid Cream', tradeName: 'Procto-Glyvenol / Faktu', frequency: 'Twice daily' },
    ]
  },
  painRelief: {
    title: 'Pain Relief',
    titleAr: 'المسكنات',
    color: 'red',
    medications: [
      { id: 'paracetamol', name: 'Paracetamol 500mg', tradeName: 'Panadol / Cetal', frequency: 'Every 6-8 hours PRN' },
      { id: 'paracetamol1g', name: 'Paracetamol 1000mg', tradeName: 'Panadol Extra / Adol', frequency: 'Every 6-8 hours PRN' },
    ]
  },
  other: {
    title: 'Other Medications',
    titleAr: 'أدوية أخرى',
    color: 'gray',
    medications: [
      { id: 'loratadine', name: 'Loratadine 10mg', tradeName: 'Claritine / Lorano', frequency: 'Once daily' },
      { id: 'cetirizine', name: 'Cetirizine 10mg', tradeName: 'Zyrtec / Letizen', frequency: 'Once daily' },
      { id: 'antid', name: 'Anti-D Immunoglobulin', tradeName: 'Anti-D Injection / Rhophylac', frequency: 'Single dose' },
    ]
  }
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; hover: string; light: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-100', light: 'bg-emerald-100/50' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100', light: 'bg-orange-100/50' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', hover: 'hover:bg-teal-100', light: 'bg-teal-100/50' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', hover: 'hover:bg-rose-100', light: 'bg-rose-100/50' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100', light: 'bg-blue-100/50' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100', light: 'bg-purple-100/50' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', hover: 'hover:bg-slate-100', light: 'bg-slate-100/50' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', hover: 'hover:bg-fuchsia-100', light: 'bg-fuchsia-100/50' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', hover: 'hover:bg-sky-100', light: 'bg-sky-100/50' },
  lime: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', hover: 'hover:bg-lime-100', light: 'bg-lime-100/50' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', hover: 'hover:bg-amber-100', light: 'bg-amber-100/50' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', hover: 'hover:bg-yellow-100', light: 'bg-yellow-100/50' },
  stone: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200', hover: 'hover:bg-stone-100', light: 'bg-stone-100/50' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hover: 'hover:bg-red-100', light: 'bg-red-100/50' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', hover: 'hover:bg-gray-100', light: 'bg-gray-100/50' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:bg-indigo-100', light: 'bg-indigo-100/50' }
};

interface PrescriptionItem {
  medication_id: string;
  name: string;
  trade_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  pregnancy_id: string;
  visit_id?: string;
  items: PrescriptionItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PregnancyPrescriptionPanelProps {
  pregnancyId: string;
  gestationalWeeks: number;
  patientName?: string;
}

interface PrintSettings {
  id?: number;
  clinic_id: number;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  header_text: string;
  footer_text: string;
  show_watermark: boolean;
}

export const PregnancyPrescriptionPanel: React.FC<PregnancyPrescriptionPanelProps> = ({
  pregnancyId,
  gestationalWeeks,
  patientName
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [selectedItems, setSelectedItems] = useState<PrescriptionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [editingItem, setEditingItem] = useState<PrescriptionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customMedications, setCustomMedications] = useState<any[]>([]);
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [newMedData, setNewMedData] = useState({
    name: '',
    trade_name: '',
    category: 'Other Medications',
    default_dosage: '1 tablet',
    default_frequency: 'Once daily',
    default_duration: '30 days'
  });
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    clinic_id: 1,
    primary_color: '#2d5a6b',
    secondary_color: '#00838f',
    logo_url: null,
    header_text: 'Dr. Mohamed Salah Gabr',
    footer_text: 'Clinic Address | Phone: 0123456789',
    show_watermark: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPrescriptions();
    fetchCustomMedications();
    fetchPrintSettings();
  }, [pregnancyId]);

  const fetchCustomMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications_catalog')
        .select('*')
        .order('trade_name', { ascending: true });

      if (error) throw error;
      setCustomMedications(data || []);
    } catch (error: any) {
      console.error('Error fetching custom medications:', error);
    }
  };

  const fetchPrintSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_print_settings')
        .select('*')
        .eq('clinic_id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows

      if (data) {
        setPrintSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching print settings:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('pregnancy_prescriptions')
        .select('*')
        .eq('pregnancy_id', pregnancyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      toast.error('خطأ في تحميل الروشتات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMedication = async () => {
    if (!newMedData.name || !newMedData.trade_name) {
      toast.error('Please fill in both Generic and Trade names');
      return;
    }

    try {
      const { error } = await supabase
        .from('medications_catalog')
        .insert([newMedData]);

      if (error) throw error;

      toast.success('Medication added to catalog');
      setIsAddMedModalOpen(false);
      setNewMedData({
        name: '',
        trade_name: '',
        category: 'Other Medications',
        default_dosage: '1 tablet',
        default_frequency: 'Once daily',
        default_duration: '30 days'
      });
      fetchCustomMedications();
    } catch (error: any) {
      console.error('Error adding medication:', error);
      toast.error('Error adding medication');
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const medications = [];

      // Skip header if exists (assuming: trade_name, generic_name, category, dosage, frequency, duration)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [trade_name, name, category, default_dosage, default_frequency, default_duration] = line.split(',').map(s => s.trim());
        
        if (trade_name && name) {
          medications.push({
            trade_name,
            name,
            category: category || 'Other Medications',
            default_dosage: default_dosage || '1 tablet',
            default_frequency: default_frequency || 'Once daily',
            default_duration: default_duration || '30 days'
          });
        }
      }

      if (medications.length === 0) {
        toast.error('No valid medications found in CSV');
        return;
      }

      try {
        const { error } = await supabase
          .from('medications_catalog')
          .insert(medications);

        if (error) throw error;

        toast.success(`Successfully imported ${medications.length} medications`);
        fetchCustomMedications();
      } catch (error: any) {
        console.error('Error importing CSV:', error);
        toast.error('Error importing CSV');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMedication = (med: any, category: string) => {
    const newItem: PrescriptionItem = {
      medication_id: med.id,
      name: med.name,
      trade_name: med.tradeName,
      dosage: '1 tablet',
      frequency: med.frequency,
      duration: '30 days',
      instructions: ''
    };
    setEditingItem(newItem);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      setSelectedItems([...selectedItems, editingItem]);
      setEditingItem(null);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmitPrescription = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one medication');
      return;
    }

    try {
      const { error } = await supabase
        .from('pregnancy_prescriptions')
        .insert({
          pregnancy_id: pregnancyId,
          items: selectedItems,
          notes: notes.trim() || null
        });

      if (error) throw error;

      toast.success('تم حفظ الروشتة بنجاح');
      setShowNewPrescription(false);
      setSelectedItems([]);
      setNotes('');
      fetchPrescriptions();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error('خطأ في حفظ الروشتة');
    }
  };

  const getRecommendedMedications = () => {
    const recommended: string[] = [];
    
    // First trimester
    if (gestationalWeeks <= 13) {
      recommended.push('folic_acid', 'prenatal');
    }
    
    // All pregnancy
    if (gestationalWeeks > 0) {
      recommended.push('prenatal', 'calcium', 'iron');
    }
    
    return recommended;
  };

  const recommendedMeds = getRecommendedMedications();

  const handlePrint = (prescription: Prescription) => {
    const printData = {
      patient: {
        name: patientName || 'Patient Name',
        age: 30, // Mock age, should fetch from patient data
        date: new Date().toLocaleDateString(),
      },
      medicines: prescription.items.map(item => ({
        name: item.trade_name,
        dosage: item.dosage,
        instructions: `${item.frequency} for ${item.duration}${item.instructions ? ` - ${item.instructions}` : ''}`,
      })),
    };

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
      toast.error('فشل فتح نافذة الطباعة');
      return;
    }

    const content = `
      <html>
        <head>
          <title>Prescription</title>
          <style>
            body { margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          <div id="prescription-root"></div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();

    // Wait for content to load then render React component
    setTimeout(() => {
      const root = printWindow.document.getElementById('prescription-root');
      if (root) {
        // Since we can't easily render React in new window, let's use a simpler approach
        // For now, just call window.print() on the template
        // But since template has print CSS, we can render it in a hidden div and print
        const hiddenDiv = document.createElement('div');
        hiddenDiv.style.position = 'absolute';
        hiddenDiv.style.left = '-9999px';
        hiddenDiv.innerHTML = `
          <style>
            @media print {
              .prescription-template {
                margin: 0;
                padding: 20mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                break-inside: avoid;
              }
              body * {
                visibility: hidden;
              }
              .prescription-template, .prescription-template * {
                visibility: visible;
              }
              .prescription-template {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
              }
              .drug-item {
                break-inside: avoid;
              }
            }
          </style>
          <div class="prescription-template bg-white text-black font-sans" style="width: 210mm; height: 297mm; padding: 20mm; position: relative;">
            ${printSettings.show_watermark && printSettings.logo_url ? `
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; opacity: 0.08;">
                <img src="${printSettings.logo_url}" alt="Watermark" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-radius: 0 0 8px 8px; background-color: ${printSettings.primary_color}; color: white; padding: 20px;">
              <div style="flex: 1;">
                <h1 style="font-size: 24px; font-weight: bold;">${printSettings.header_text}</h1>
              </div>
              <div style="flex: 1; text-align: right;">
                ${printSettings.logo_url ? `<img src="${printSettings.logo_url}" alt="Clinic Logo" style="max-height: 64px; max-width: 128px; object-fit: contain;" />` : ''}
              </div>
            </div>
            <div style="background-color: #f9f9f9; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                <div><span style="font-weight: bold;">Patient:</span> ${printData.patient.name}</div>
                <div><span style="font-weight: bold;">Age:</span> ${printData.patient.age} years</div>
                <div><span style="font-weight: bold;">Date:</span> ${printData.patient.date}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-right: 16px; color: ${printSettings.primary_color};">℞</div>
              <h2 style="font-size: 24px; font-weight: bold; color: ${printSettings.primary_color};">Prescription</h2>
            </div>
            <div style="margin-bottom: 32px;">
              ${printData.medicines.map((medicine, index) => `
                <div style="margin-bottom: 16px;" class="drug-item">
                  <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 18px;">${medicine.name}</div>
                    <div style="color: #6b7280;">${medicine.dosage}</div>
                    <div style="font-size: 14px; color: #9ca3af;">${medicine.instructions}</div>
                  </div>
                  ${index < printData.medicines.length - 1 ? `<hr style="margin-top: 16px; border-color: ${printSettings.secondary_color}; border-width: 1px; border-style: dotted;" />` : ''}
                </div>
              `).join('')}
            </div>
            <div style="margin-top: auto; padding-top: 32px;">
              <hr style="margin-bottom: 16px; border-color: ${printSettings.primary_color}; border-width: 2px;" />
              <div style="text-align: center; color: #6b7280;">${printSettings.footer_text}</div>
            </div>
          </div>
        `;
        document.body.appendChild(hiddenDiv);
        window.print();
        document.body.removeChild(hiddenDiv);
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Pill className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">روشتات الحمل</h3>
            <p className="text-sm text-gray-500">إدارة الأدوية والعلاجات</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewPrescription(!showNewPrescription)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>روشتة جديدة</span>
        </button>
      </div>

      {/* Recommended Medications Alert */}
      {recommendedMeds.length > 0 && !showNewPrescription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">أدوية موصى بها ({gestationalWeeks} أسبوع حمل)</p>
              <p className="text-sm text-blue-700 mt-1">
                اضغط على "روشتة جديدة" لإضافة الأدوية المناسبة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Form */}
      {showNewPrescription && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h4 className="font-medium text-gray-900">اختر الأدوية</h4>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="بحث عن دواء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-10 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Plus className="w-4 h-4 text-gray-400 rotate-45" />
                </div>
              </div>

              <button
                onClick={() => setIsAddMedModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm transition-colors"
                title="إضافة دواء جديد للدليل"
              >
                <Plus size={16} />
                <span>إضافة دواء</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                title="استيراد من CSV"
              >
                <Upload size={16} />
                <span>استيراد CSV</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCSVImport}
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>
          
          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <span className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <FileSpreadsheet size={16} />
                  الأدوية المختارة في الروشتة ({selectedItems.length})
                </span>
                <button 
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-red-600 hover:underline"
                >
                  مسح الكل
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 text-sm border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{item.trade_name}</p>
                        <p className="text-xs text-gray-500 italic truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">💊 {item.dosage}</span>
                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">🔄 {item.frequency}</span>
                          <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">⏳ {item.duration}</span>
                        </div>
                        {item.instructions && (
                          <p className="text-[11px] text-gray-600 mt-2 bg-gray-50 p-1.5 rounded border-l-2 border-blue-400">
                            📝 {item.instructions}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medication Categories */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {/* Custom Medications Category */}
            {customMedications.length > 0 && (
              <div className={`rounded-xl border ${CATEGORY_STYLES.indigo.border} ${CATEGORY_STYLES.indigo.bg} overflow-hidden shadow-sm`}>
                <div className={`px-4 py-2 ${CATEGORY_STYLES.indigo.light} border-b ${CATEGORY_STYLES.indigo.border} flex items-center justify-between`}>
                  <h5 className={`text-sm font-bold ${CATEGORY_STYLES.indigo.text} flex items-center gap-2`}>
                    <Pill size={16} />
                    <span>Custom Medications (دليل الأدوية المضاف)</span>
                  </h5>
                  <span className={`text-xs font-medium ${CATEGORY_STYLES.indigo.text} bg-white/50 px-2 py-0.5 rounded-full`}>
                    {customMedications.length} دواء
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customMedications
                    .filter(med => 
                      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      med.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (med.category && med.category.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(med => {
                      const isAlreadySelected = selectedItems.some(item => item.medication_id === med.id);
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleAddMedication({
                            id: med.id,
                            name: med.name,
                            tradeName: med.trade_name,
                            frequency: med.default_frequency
                          }, med.category)}
                          disabled={isAlreadySelected}
                          className={`text-left px-3 py-2 rounded-lg border transition-all duration-200 ${
                            isAlreadySelected
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : `bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:shadow-md transform hover:-translate-y-0.5`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{med.trade_name}</p>
                              <p className="text-xs text-gray-500 italic">{med.name}</p>
                            </div>
                            {isAlreadySelected && <Check size={16} className="text-indigo-600" />}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {Object.entries(PREGNANCY_MEDICATIONS).map(([key, category]) => {
              const filteredMeds = category.medications.filter(med => 
                med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                med.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.titleAr.includes(searchTerm)
              );

              if (filteredMeds.length === 0) return null;

              const style = CATEGORY_STYLES[category.color] || CATEGORY_STYLES.gray;

              return (
                <div key={key} className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden shadow-sm`}>
                  <div className={`px-4 py-2 ${style.light} border-b ${style.border} flex items-center justify-between`}>
                    <h5 className={`text-sm font-bold ${style.text} flex items-center gap-2`}>
                      <Pill size={16} />
                      <span>{category.title} <span className="opacity-70 text-xs font-normal">({category.titleAr})</span></span>
                    </h5>
                    <span className={`text-xs font-medium ${style.text} bg-white/50 px-2 py-0.5 rounded-full`}>
                      {filteredMeds.length} دواء
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredMeds.map(med => {
                      const isRecommended = recommendedMeds.includes(med.id);
                      const isAlreadySelected = selectedItems.some(item => item.medication_id === med.id);
                      
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleAddMedication(med, key)}
                          disabled={isAlreadySelected}
                          className={`text-left px-3 py-2 rounded-lg border transition-all duration-200 ${
                            isAlreadySelected
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : isRecommended
                              ? `bg-white text-gray-900 ${style.border} hover:border-amber-400 hover:shadow-md transform hover:-translate-y-0.5 ring-1 ring-amber-200`
                              : `bg-white text-gray-700 border-gray-200 ${style.hover.replace('hover:', 'hover:border-')} hover:shadow-md transform hover:-translate-y-0.5`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{med.tradeName}</p>
                              <p className="text-xs text-gray-500 truncate italic">{med.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{med.frequency}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {isRecommended && !isAlreadySelected && (
                                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Recommended" />
                              )}
                              {isAlreadySelected && <Check size={16} className={style.text} />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
              placeholder="أي ملاحظات أو تعليمات إضافية..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitPrescription}
              disabled={selectedItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              <span>حفظ الروشتة ({selectedItems.length} دواء)</span>
            </button>
            <button
              onClick={() => {
                setShowNewPrescription(false);
                setSelectedItems([]);
                setNotes('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">تفاصيل الدواء</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم التجاري</label>
                <input
                  type="text"
                  value={editingItem.trade_name}
                  onChange={e => setEditingItem({ ...editingItem, trade_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجرعة</label>
                  <input
                    type="text"
                    value={editingItem.dosage}
                    onChange={e => setEditingItem({ ...editingItem, dosage: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="1 tablet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدة</label>
                  <input
                    type="text"
                    value={editingItem.duration}
                    onChange={e => setEditingItem({ ...editingItem, duration: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="30 days"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التردد</label>
                <input
                  type="text"
                  value={editingItem.frequency}
                  onChange={e => setEditingItem({ ...editingItem, frequency: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Once daily"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تعليمات الاستخدام</label>
                <textarea
                  value={editingItem.instructions || ''}
                  onChange={e => setEditingItem({ ...editingItem, instructions: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Before meals, with water, etc..."
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSaveItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                إضافة
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Medication to Catalog Modal */}
      {isAddMedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="text-green-600" size={20} />
                <h3 className="text-lg font-bold text-gray-900">إضافة دواء جديد للدليل</h3>
              </div>
              <button
                onClick={() => setIsAddMedModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم التجاري (Trade Name)</label>
                  <input
                    type="text"
                    value={newMedData.trade_name}
                    onChange={e => setNewMedData({ ...newMedData, trade_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: Augmentin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم العلمي (Generic Name)</label>
                  <input
                    type="text"
                    value={newMedData.name}
                    onChange={e => setNewMedData({ ...newMedData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: Amoxicillin"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <select
                  value={newMedData.category}
                  onChange={e => setNewMedData({ ...newMedData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Progesterone Support">Progesterone Support</option>
                  <option value="Antihypertensives">Antihypertensives</option>
                  <option value="Other Medications">Other Medications</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجرعة الافتراضية</label>
                  <input
                    type="text"
                    value={newMedData.default_dosage}
                    onChange={e => setNewMedData({ ...newMedData, default_dosage: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="1 tablet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التردد الافتراضي</label>
                  <input
                    type="text"
                    value={newMedData.default_frequency}
                    onChange={e => setNewMedData({ ...newMedData, default_frequency: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Once daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدة الافتراضية</label>
                  <input
                    type="text"
                    value={newMedData.default_duration}
                    onChange={e => setNewMedData({ ...newMedData, default_duration: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="30 days"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddCustomMedication}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                حفظ في الدليل
              </button>
              <button
                onClick={() => setIsAddMedModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex gap-2 text-blue-700">
                <FileSpreadsheet size={16} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold mb-1">نصيحة للاستيراد الجماعي:</p>
                  <p>يمكنك استيراد قائمة كبيرة من الأدوية مرة واحدة باستخدام زر "استيراد CSV" في الشاشة السابقة.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions History */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">سجل الروشتات</h4>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>لا توجد روشتات</p>
          </div>
        ) : (
          prescriptions.map(prescription => (
            <div
              key={prescription.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(prescription.created_at).toLocaleDateString('ar-EG', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handlePrint(prescription)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                  title="طباعة الروشتة"
                >
                  <Printer size={16} />
                </button>
              </div>
              
              <div className="space-y-2">
                {prescription.items.map((item: PrescriptionItem, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-900">{item.trade_name}</p>
                    <p className="text-xs text-gray-600">{item.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                      <span>• {item.dosage}</span>
                      <span>• {item.frequency}</span>
                      <span>• {item.duration}</span>
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-gray-600 mt-1">📝 {item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {prescription.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{prescription.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
