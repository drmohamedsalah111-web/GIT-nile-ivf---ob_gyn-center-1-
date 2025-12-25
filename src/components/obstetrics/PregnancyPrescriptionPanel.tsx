import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Trash2, Printer, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

// Pregnancy medications - Egyptian trade names in English
const PREGNANCY_MEDICATIONS = {
  vitamins: {
    title: 'Vitamins & Supplements',
    titleAr: 'الفيتامينات والمكملات',
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
    medications: [
      { id: 'methyldopa', name: 'Methyldopa 250mg', tradeName: 'Aldomet', frequency: 'Twice or three times daily' },
      { id: 'labetalol', name: 'Labetalol 100mg', tradeName: 'Trandate', frequency: 'Twice daily' },
      { id: 'nifedipine', name: 'Nifedipine 10mg SR', tradeName: 'Epilat Retard', frequency: 'Twice daily' },
    ]
  },
  thyroid: {
    title: 'Thyroid Medications',
    titleAr: 'أدوية الغدة الدرقية',
    medications: [
      { id: 'levothyroxine', name: 'Levothyroxine', tradeName: 'Eltroxin / Euthyrox', frequency: 'Once daily on empty stomach' },
      { id: 'ptu', name: 'Propylthiouracil', tradeName: 'PTU', frequency: 'As directed' },
    ]
  },
  anticoagulation: {
    title: 'Anticoagulation',
    titleAr: 'مضادات التخثر',
    medications: [
      { id: 'clexane', name: 'LMWH 40mg', tradeName: 'Clexane 40mg', frequency: 'Once daily SC' },
      { id: 'clexane60', name: 'LMWH 60mg', tradeName: 'Clexane 60mg', frequency: 'Once daily SC' },
      { id: 'aspirin', name: 'Aspirin 75mg', tradeName: 'Jusprin / Aspocid', frequency: 'Once daily' },
    ]
  },
  progesterone: {
    title: 'Progesterone Support',
    titleAr: 'دعم البروجسترون',
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
    medications: [
      { id: 'nifedipine_tocolytic', name: 'Nifedipine 10mg', tradeName: 'Epilat', frequency: 'As directed' },
      { id: 'ritodrine', name: 'Ritodrine', tradeName: 'Yutopar', frequency: 'As directed' },
      { id: 'indomethacin', name: 'Indomethacin 50mg', tradeName: 'Indocin', frequency: 'As directed' },
    ]
  },
  corticosteroids: {
    title: 'Fetal Lung Maturity',
    titleAr: 'حقن الرئة للجنين',
    medications: [
      { id: 'betamethasone', name: 'Betamethasone 12mg IM', tradeName: 'Celestone', frequency: 'Two doses 24h apart' },
      { id: 'dexamethasone', name: 'Dexamethasone 6mg IM', tradeName: 'Fortecortin / Dexamethasone', frequency: 'Four doses 12h apart' },
    ]
  },
  diabetes: {
    title: 'Anti-Diabetics',
    titleAr: 'أدوية السكر',
    medications: [
      { id: 'insulin_rapid', name: 'Rapid Acting Insulin', tradeName: 'NovoRapid / Humalog', frequency: 'Before meals' },
      { id: 'insulin_long', name: 'Long Acting Insulin', tradeName: 'Lantus / Levemir', frequency: 'Once daily' },
      { id: 'metformin', name: 'Metformin 500/1000mg', tradeName: 'Glucophage / Cidophage', frequency: 'As directed' },
    ]
  },
  infections: {
    title: 'Vaginal Infections',
    titleAr: 'الالتهابات المهبلية',
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
    medications: [
      { id: 'daflon', name: 'Diosmin + Hesperidin', tradeName: 'Daflon 500mg', frequency: 'Twice daily' },
      { id: 'proctoglyvenol', name: 'Hemorrhoid Cream', tradeName: 'Procto-Glyvenol / Faktu', frequency: 'Twice daily' },
    ]
  },
  painRelief: {
    title: 'Pain Relief',
    titleAr: 'المسكنات',
    medications: [
      { id: 'paracetamol', name: 'Paracetamol 500mg', tradeName: 'Panadol / Cetal', frequency: 'Every 6-8 hours PRN' },
      { id: 'paracetamol1g', name: 'Paracetamol 1000mg', tradeName: 'Panadol Extra / Adol', frequency: 'Every 6-8 hours PRN' },
    ]
  },
  other: {
    title: 'Other Medications',
    titleAr: 'أدوية أخرى',
    medications: [
      { id: 'loratadine', name: 'Loratadine 10mg', tradeName: 'Claritine / Lorano', frequency: 'Once daily' },
      { id: 'cetirizine', name: 'Cetirizine 10mg', tradeName: 'Zyrtec / Letizen', frequency: 'Once daily' },
      { id: 'antid', name: 'Anti-D Immunoglobulin', tradeName: 'Anti-D Injection / Rhophylac', frequency: 'Single dose' },
    ]
  }
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

  useEffect(() => {
    fetchPrescriptions();
  }, [pregnancyId]);

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
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">اختر الأدوية</h4>
            <div className="relative w-64">
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
          </div>
          
          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">الأدوية المختارة ({selectedItems.length})</span>
              </div>
              {selectedItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.trade_name}</p>
                      <p className="text-gray-600">{item.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        <span>• {item.dosage}</span>
                        <span>• {item.frequency}</span>
                        <span>• {item.duration}</span>
                      </div>
                      {item.instructions && (
                        <p className="text-xs text-gray-500 mt-1">📝 {item.instructions}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medication Categories */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(PREGNANCY_MEDICATIONS).map(([key, category]) => {
              const filteredMeds = category.medications.filter(med => 
                med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                med.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.titleAr.includes(searchTerm)
              );

              if (filteredMeds.length === 0) return null;

              return (
                <div key={key} className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">
                    {category.title} <span className="text-gray-500">({category.titleAr})</span>
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredMeds.map(med => {
                      const isRecommended = recommendedMeds.includes(med.id);
                      const isAlreadySelected = selectedItems.some(item => item.medication_id === med.id);
                      
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleAddMedication(med, key)}
                          disabled={isAlreadySelected}
                          className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                            isAlreadySelected
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : isRecommended
                              ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{med.tradeName}</p>
                              <p className="text-xs text-gray-500">{med.name} • {med.frequency}</p>
                            </div>
                            {isRecommended && !isAlreadySelected && <span className="text-lg">⭐</span>}
                            {isAlreadySelected && <Check size={16} className="text-gray-400" />}
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
