import React, { useState, useEffect } from 'react';
import { Pill, Plus, Printer, Check, X, Edit2, Trash2, Copy, FileText } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

// أدوية الحمل الشائعة
const PREGNANCY_MEDICATIONS = {
  vitamins: {
    title: 'فيتامينات',
    icon: '💊',
    drugs: [
      { name: 'Folic Acid 5mg', nameAr: 'حمض الفوليك ٥ مجم', dose: 'قرص يومياً', category: 'vitamin' },
      { name: 'Folic Acid 400mcg', nameAr: 'حمض الفوليك ٤٠٠ ميكروجرام', dose: 'قرص يومياً', category: 'vitamin' },
      { name: 'Vitamin D3 1000 IU', nameAr: 'فيتامين د ١٠٠٠ وحدة', dose: 'قرص يومياً', category: 'vitamin' },
      { name: 'Vitamin D3 2000 IU', nameAr: 'فيتامين د ٢٠٠٠ وحدة', dose: 'قرص يومياً', category: 'vitamin' },
      { name: 'Vitamin B12', nameAr: 'فيتامين ب١٢', dose: 'قرص يومياً', category: 'vitamin' },
      { name: 'Omega-3 (DHA)', nameAr: 'أوميجا ٣', dose: 'كبسولة يومياً', category: 'vitamin' },
      { name: 'Prenatal Multivitamin', nameAr: 'فيتامينات الحمل المتعددة', dose: 'قرص يومياً', category: 'vitamin' },
    ]
  },
  iron: {
    title: 'حديد وكالسيوم',
    icon: '🩸',
    drugs: [
      { name: 'Ferrous Sulfate 200mg', nameAr: 'كبريتات الحديد ٢٠٠ مجم', dose: 'قرص مرتين يومياً', category: 'iron' },
      { name: 'Iron Polymaltose', nameAr: 'حديد بولي مالتوز', dose: 'قرص يومياً', category: 'iron' },
      { name: 'Ferrous Fumarate + Folic', nameAr: 'فيومارات الحديد + فوليك', dose: 'قرص يومياً', category: 'iron' },
      { name: 'Calcium 500mg + Vit D', nameAr: 'كالسيوم ٥٠٠ مجم + فيتامين د', dose: 'قرص مرتين يومياً', category: 'calcium' },
      { name: 'Calcium Carbonate 1000mg', nameAr: 'كربونات الكالسيوم ١٠٠٠ مجم', dose: 'قرص يومياً', category: 'calcium' },
    ]
  },
  nausea: {
    title: 'مضادات الغثيان',
    icon: '🤢',
    drugs: [
      { name: 'Vitamin B6 25mg', nameAr: 'فيتامين ب٦', dose: 'قرص ٣ مرات يومياً', category: 'nausea' },
      { name: 'Doxylamine 10mg', nameAr: 'دوكسيلامين', dose: 'قرص قبل النوم', category: 'nausea' },
      { name: 'Metoclopramide 10mg', nameAr: 'ميتوكلوبراميد', dose: 'قرص قبل الأكل', category: 'nausea' },
      { name: 'Ondansetron 4mg', nameAr: 'أوندانسيترون', dose: 'قرص عند اللزوم', category: 'nausea' },
      { name: 'Ginger Capsules', nameAr: 'كبسولات الزنجبيل', dose: 'كبسولة ٣ مرات يومياً', category: 'nausea' },
    ]
  },
  preventive: {
    title: 'أدوية وقائية',
    icon: '🛡️',
    drugs: [
      { name: 'Aspirin 81mg', nameAr: 'أسبرين ٨١ مجم', dose: 'قرص يومياً مساءً', category: 'preventive' },
      { name: 'Aspirin 100mg', nameAr: 'أسبرين ١٠٠ مجم', dose: 'قرص يومياً مساءً', category: 'preventive' },
      { name: 'Enoxaparin 40mg', nameAr: 'كليكسان ٤٠ مجم', dose: 'حقنة تحت الجلد يومياً', category: 'preventive' },
      { name: 'Enoxaparin 60mg', nameAr: 'كليكسان ٦٠ مجم', dose: 'حقنة تحت الجلد يومياً', category: 'preventive' },
      { name: 'Progesterone 200mg', nameAr: 'بروجيستيرون ٢٠٠ مجم', dose: 'تحميلة مهبلية يومياً', category: 'preventive' },
      { name: 'Progesterone 400mg', nameAr: 'بروجيستيرون ٤٠٠ مجم', dose: 'تحميلة مهبلية يومياً', category: 'preventive' },
    ]
  },
  common: {
    title: 'أدوية شائعة',
    icon: '💉',
    drugs: [
      { name: 'Paracetamol 500mg', nameAr: 'باراسيتامول ٥٠٠ مجم', dose: 'قرص عند اللزوم', category: 'common' },
      { name: 'Antacid (Gaviscon)', nameAr: 'مضاد الحموضة (جافيسكون)', dose: 'ملعقة بعد الأكل', category: 'common' },
      { name: 'Lactulose', nameAr: 'لاكتيلوز (ملين)', dose: 'ملعقة صباحاً', category: 'common' },
      { name: 'Methyldopa 250mg', nameAr: 'ميثيل دوبا ٢٥٠ مجم', dose: 'قرص ٣ مرات يومياً', category: 'bp' },
      { name: 'Labetalol 100mg', nameAr: 'لابيتالول ١٠٠ مجم', dose: 'قرص مرتين يومياً', category: 'bp' },
      { name: 'Nifedipine 20mg SR', nameAr: 'نيفيديبين ٢٠ مجم', dose: 'قرص مرتين يومياً', category: 'bp' },
    ]
  }
};

interface PrescriptionItem {
  id: string;
  drug: string;
  drugAr: string;
  dose: string;
  duration?: string;
  notes?: string;
}

interface Prescription {
  id: string;
  pregnancy_id: string;
  visit_id?: string;
  items: PrescriptionItem[];
  created_at: string;
  notes?: string;
}

interface PregnancyPrescriptionPanelProps {
  pregnancyId: string;
  visitId?: string;
  patientName?: string;
  gestationalWeeks?: number;
}

export const PregnancyPrescriptionPanel: React.FC<PregnancyPrescriptionPanelProps> = ({
  pregnancyId,
  visitId,
  patientName,
  gestationalWeeks
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentItems, setCurrentItems] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingItem, setEditingItem] = useState<PrescriptionItem | null>(null);

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
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrug = (drug: typeof PREGNANCY_MEDICATIONS.vitamins.drugs[0]) => {
    const newItem: PrescriptionItem = {
      id: crypto.randomUUID(),
      drug: drug.name,
      drugAr: drug.nameAr,
      dose: drug.dose,
      duration: '30 يوم'
    };
    setCurrentItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof PrescriptionItem, value: string) => {
    setCurrentItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmitPrescription = async () => {
    if (currentItems.length === 0) {
      toast.error('أضف أدوية للروشتة');
      return;
    }

    try {
      const { error } = await supabase
        .from('pregnancy_prescriptions')
        .insert({
          id: crypto.randomUUID(),
          pregnancy_id: pregnancyId,
          visit_id: visitId || null,
          items: currentItems,
          notes: notes || null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('تم حفظ الروشتة بنجاح');
      setCurrentItems([]);
      setNotes('');
      setShowNewPrescription(false);
      fetchPrescriptions();
    } catch (err) {
      console.error('Error creating prescription:', err);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>روشتة</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .patient-info { margin-bottom: 20px; }
          .items { margin-bottom: 20px; }
          .item { padding: 10px; border-bottom: 1px solid #ddd; display: flex; gap: 20px; }
          .item-name { font-weight: bold; flex: 1; }
          .item-dose { color: #666; }
          .item-duration { color: #888; }
          .notes { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .footer { margin-top: 40px; text-align: left; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🏥 نايل IVF</h2>
          <p>روشتة طبية</p>
        </div>
        <div class="patient-info">
          <p><strong>المريضة:</strong> ${patientName || 'غير محدد'}</p>
          <p><strong>التاريخ:</strong> ${new Date(prescription.created_at).toLocaleDateString('ar-EG')}</p>
          ${gestationalWeeks ? `<p><strong>عمر الحمل:</strong> ${gestationalWeeks} أسبوع</p>` : ''}
        </div>
        <div class="items">
          <h3>الأدوية:</h3>
          ${prescription.items.map((item, idx) => `
            <div class="item">
              <span class="item-num">${idx + 1}.</span>
              <span class="item-name">${item.drugAr || item.drug}</span>
              <span class="item-dose">${item.dose}</span>
              <span class="item-duration">${item.duration || ''}</span>
            </div>
          `).join('')}
        </div>
        ${prescription.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${prescription.notes}</div>` : ''}
        <div class="footer">
          <p>توقيع الطبيب: ________________</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopyToNew = (prescription: Prescription) => {
    setCurrentItems(prescription.items.map(item => ({
      ...item,
      id: crypto.randomUUID()
    })));
    setShowNewPrescription(true);
    toast.success('تم نسخ الروشتة - يمكنك التعديل عليها');
  };

  // Quick prescription templates
  const TEMPLATES = [
    {
      name: 'روشتة الحجز',
      items: [
        { drug: 'Folic Acid 5mg', drugAr: 'حمض الفوليك ٥ مجم', dose: 'قرص يومياً', duration: '3 أشهر' },
        { drug: 'Vitamin D3 1000 IU', drugAr: 'فيتامين د ١٠٠٠ وحدة', dose: 'قرص يومياً', duration: 'طوال الحمل' },
      ]
    },
    {
      name: 'الثلث الثاني والثالث',
      items: [
        { drug: 'Ferrous Sulfate 200mg', drugAr: 'كبريتات الحديد ٢٠٠ مجم', dose: 'قرص يومياً', duration: 'طوال الحمل' },
        { drug: 'Calcium 500mg + Vit D', drugAr: 'كالسيوم ٥٠٠ مجم + فيتامين د', dose: 'قرص مرتين يومياً', duration: 'طوال الحمل' },
        { drug: 'Omega-3 (DHA)', drugAr: 'أوميجا ٣', dose: 'كبسولة يومياً', duration: 'طوال الحمل' },
      ]
    },
    {
      name: 'حمل عالي الخطورة',
      items: [
        { drug: 'Aspirin 81mg', drugAr: 'أسبرين ٨١ مجم', dose: 'قرص يومياً مساءً', duration: 'حتى الأسبوع 36' },
        { drug: 'Calcium 500mg + Vit D', drugAr: 'كالسيوم ٥٠٠ مجم + فيتامين د', dose: 'قرص مرتين يومياً', duration: 'طوال الحمل' },
      ]
    }
  ];

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    const items = template.items.map(item => ({
      ...item,
      id: crypto.randomUUID()
    }));
    setCurrentItems(prev => [...prev, ...items]);
    toast.success(`تم إضافة ${template.name}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Pill className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">روشتات الحمل</h3>
            <p className="text-sm text-gray-500">الأدوية والمكملات الغذائية</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewPrescription(!showNewPrescription)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          <span>روشتة جديدة</span>
        </button>
      </div>

      {/* New Prescription Form */}
      {showNewPrescription && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Quick Templates */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">قوالب جاهزة:</h4>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTemplate(template)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Drug Categories */}
          {Object.entries(PREGNANCY_MEDICATIONS).map(([key, category]) => (
            <div key={key} className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.title}
              </h5>
              <div className="flex flex-wrap gap-2">
                {category.drugs.map((drug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddDrug(drug)}
                    className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-emerald-300"
                  >
                    {drug.nameAr}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Current Items */}
          {currentItems.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">الأدوية المختارة ({currentItems.length})</h4>
              <div className="space-y-2">
                {currentItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-bold text-emerald-700">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.drugAr}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={item.dose}
                          onChange={e => handleUpdateItem(item.id, 'dose', e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-200 rounded w-40"
                          placeholder="الجرعة"
                        />
                        <input
                          type="text"
                          value={item.duration || ''}
                          onChange={e => handleUpdateItem(item.id, 'duration', e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-200 rounded w-28"
                          placeholder="المدة"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات للمريضة</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
              placeholder="تعليمات إضافية..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitPrescription}
              disabled={currentItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              <span>حفظ الروشتة</span>
            </button>
            <button
              onClick={() => {
                setShowNewPrescription(false);
                setCurrentItems([]);
                setNotes('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
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
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>لا توجد روشتات سابقة</p>
          </div>
        ) : (
          prescriptions.map(prescription => (
            <div
              key={prescription.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(prescription.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({prescription.items.length} أدوية)
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyToNew(prescription)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                    title="نسخ للتعديل"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handlePrintPrescription(prescription)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    title="طباعة"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {prescription.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{idx + 1}.</span>
                    <span className="text-gray-700">{item.drugAr || item.drug}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-600">{item.dose}</span>
                    {item.duration && (
                      <span className="text-xs text-emerald-600">({item.duration})</span>
                    )}
                  </div>
                ))}
              </div>
              {prescription.notes && (
                <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded">
                  💬 {prescription.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
