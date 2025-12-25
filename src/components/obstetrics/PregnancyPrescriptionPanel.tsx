import React, { useState, useEffect } from 'react';
import { Pill, Plus, Printer, Check, Trash2, Copy, FileText } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

// أدوية الحمل الشائعة - الاسم بالإنجليزي والوصف بالعربي
const PREGNANCY_MEDICATIONS = {
  vitamins: {
    title: 'Vitamins - فيتامينات',
    icon: '💊',
    drugs: [
      { name: 'Folic Acid 5mg', descAr: 'قرص واحد يومياً صباحاً', form: 'Tab' },
      { name: 'Folic Acid 400mcg', descAr: 'قرص واحد يومياً', form: 'Tab' },
      { name: 'Vitamin D3 1000 IU', descAr: 'قرص واحد يومياً بعد الأكل', form: 'Tab' },
      { name: 'Vitamin D3 2000 IU', descAr: 'قرص واحد يومياً بعد الأكل', form: 'Tab' },
      { name: 'Vitamin D3 10000 IU', descAr: 'قرص واحد أسبوعياً', form: 'Tab' },
      { name: 'Vitamin B12 1000mcg', descAr: 'قرص واحد يومياً', form: 'Tab' },
      { name: 'Omega-3 (DHA) 1000mg', descAr: 'كبسولة واحدة يومياً بعد الغداء', form: 'Cap' },
      { name: 'Prenatal Multivitamin', descAr: 'قرص واحد يومياً', form: 'Tab' },
      { name: 'Elevit Pronatal', descAr: 'قرص واحد يومياً', form: 'Tab' },
    ]
  },
  iron: {
    title: 'Iron & Calcium - حديد وكالسيوم',
    icon: '🩸',
    drugs: [
      { name: 'Ferrous Sulfate 200mg', descAr: 'قرص مرتين يومياً بعد الأكل بساعتين', form: 'Tab' },
      { name: 'Ferrous Fumarate 350mg', descAr: 'قرص واحد يومياً', form: 'Tab' },
      { name: 'Iron Polymaltose 100mg', descAr: 'قرص واحد يومياً مع الأكل', form: 'Tab' },
      { name: 'Haemojet B12', descAr: 'قرص واحد يومياً', form: 'Tab' },
      { name: 'Feroglobin', descAr: 'كبسولة واحدة يومياً', form: 'Cap' },
      { name: 'Calcium 500mg + Vit D', descAr: 'قرص مرتين يومياً', form: 'Tab' },
      { name: 'Calcium Carbonate 1000mg', descAr: 'قرص واحد يومياً', form: 'Tab' },
      { name: 'Caltrate 600 + D', descAr: 'قرص واحد يومياً بعد الغداء', form: 'Tab' },
    ]
  },
  nausea: {
    title: 'Anti-nausea - مضادات الغثيان',
    icon: '🤢',
    drugs: [
      { name: 'Vitamin B6 (Pyridoxine) 25mg', descAr: 'قرص ٣ مرات يومياً', form: 'Tab' },
      { name: 'Doxylamine 10mg', descAr: 'قرص قبل النوم', form: 'Tab' },
      { name: 'Metoclopramide 10mg', descAr: 'قرص قبل الأكل بنصف ساعة عند اللزوم', form: 'Tab' },
      { name: 'Ondansetron 4mg', descAr: 'قرص عند اللزوم (حد أقصى ٣ مرات)', form: 'Tab' },
      { name: 'Ginger 250mg', descAr: 'كبسولة ٣ مرات يومياً', form: 'Cap' },
    ]
  },
  preventive: {
    title: 'Preventive - أدوية وقائية',
    icon: '🛡️',
    drugs: [
      { name: 'Aspirin 75mg', descAr: 'قرص واحد يومياً مساءً بعد الأكل', form: 'Tab' },
      { name: 'Aspirin 81mg', descAr: 'قرص واحد يومياً مساءً بعد الأكل', form: 'Tab' },
      { name: 'Aspirin 100mg', descAr: 'قرص واحد يومياً مساءً بعد الأكل', form: 'Tab' },
      { name: 'Enoxaparin (Clexane) 40mg', descAr: 'حقنة تحت الجلد يومياً', form: 'Inj' },
      { name: 'Enoxaparin (Clexane) 60mg', descAr: 'حقنة تحت الجلد يومياً', form: 'Inj' },
      { name: 'Enoxaparin (Clexane) 80mg', descAr: 'حقنة تحت الجلد يومياً', form: 'Inj' },
      { name: 'Progesterone 200mg (Cyclogest)', descAr: 'تحميلة مهبلية يومياً مساءً', form: 'Supp' },
      { name: 'Progesterone 400mg (Cyclogest)', descAr: 'تحميلة مهبلية يومياً مساءً', form: 'Supp' },
      { name: 'Progesterone 100mg (Utrogestan)', descAr: 'كبسولة مرتين يومياً', form: 'Cap' },
    ]
  },
  common: {
    title: 'Common Medications - أدوية شائعة',
    icon: '💉',
    drugs: [
      { name: 'Paracetamol 500mg', descAr: 'قرص عند اللزوم كل ٦ ساعات', form: 'Tab' },
      { name: 'Paracetamol 1000mg', descAr: 'قرص عند اللزوم كل ٨ ساعات', form: 'Tab' },
      { name: 'Gaviscon Suspension', descAr: 'ملعقة كبيرة بعد الأكل وقبل النوم', form: 'Susp' },
      { name: 'Omeprazole 20mg', descAr: 'كبسولة واحدة يومياً قبل الفطار', form: 'Cap' },
      { name: 'Ranitidine 150mg', descAr: 'قرص مرتين يومياً', form: 'Tab' },
      { name: 'Lactulose 10g/15ml', descAr: 'ملعقة كبيرة صباحاً', form: 'Syrup' },
      { name: 'Bisacodyl 5mg', descAr: 'قرص قبل النوم عند اللزوم', form: 'Tab' },
      { name: 'Methyldopa 250mg', descAr: 'قرص ٣ مرات يومياً', form: 'Tab' },
      { name: 'Labetalol 100mg', descAr: 'قرص مرتين يومياً', form: 'Tab' },
      { name: 'Nifedipine SR 20mg', descAr: 'قرص مرتين يومياً', form: 'Tab' },
      { name: 'Insulin (as prescribed)', descAr: 'حسب الجرعة المحددة', form: 'Inj' },
    ]
  }
};

interface PrescriptionItem {
  id: string;
  drug: string;
  descAr: string;
  form: string;
  duration?: string;
  quantity?: string;
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
  doctorName?: string;
  clinicName?: string;
}

export const PregnancyPrescriptionPanel: React.FC<PregnancyPrescriptionPanelProps> = ({
  pregnancyId,
  visitId,
  patientName = '',
  gestationalWeeks,
  doctorName = 'د. صلاح',
  clinicName = 'Nile IVF Center'
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentItems, setCurrentItems] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [notes, setNotes] = useState('');

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
    // Check if already added
    if (currentItems.some(item => item.drug === drug.name)) {
      toast.error('هذا الدواء مضاف بالفعل');
      return;
    }
    
    const newItem: PrescriptionItem = {
      id: crypto.randomUUID(),
      drug: drug.name,
      descAr: drug.descAr,
      form: drug.form,
      duration: '30 يوم',
      quantity: '1 علبة'
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

    const prescriptionDate = new Date(prescription.created_at).toLocaleDateString('en-GB');

    const html = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>Prescription - روشتة طبية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A5; margin: 10mm; }
          body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            padding: 15px;
            font-size: 12px;
            line-height: 1.4;
          }
          .prescription {
            max-width: 148mm;
            margin: 0 auto;
            border: 2px solid #0d9488;
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white;
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .clinic-name {
            font-size: 18px;
            font-weight: bold;
          }
          .clinic-subtitle {
            font-size: 10px;
            opacity: 0.9;
          }
          .rx-symbol {
            font-size: 28px;
            font-weight: bold;
            font-family: serif;
          }
          .patient-section {
            padding: 10px 15px;
            background: #f0fdfa;
            border-bottom: 1px solid #99f6e4;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
          }
          .patient-info {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }
          .info-item {
            display: flex;
            gap: 5px;
          }
          .info-label {
            color: #0d9488;
            font-weight: 600;
            font-size: 11px;
          }
          .info-value {
            font-weight: 500;
          }
          .medications {
            padding: 15px;
          }
          .med-table {
            width: 100%;
            border-collapse: collapse;
          }
          .med-table th {
            text-align: left;
            padding: 8px 5px;
            border-bottom: 2px solid #0d9488;
            color: #0d9488;
            font-size: 11px;
            font-weight: 600;
          }
          .med-table td {
            padding: 10px 5px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .med-num {
            width: 25px;
            font-weight: bold;
            color: #0d9488;
          }
          .med-name {
            font-weight: 600;
            font-size: 13px;
            color: #1f2937;
          }
          .med-form {
            font-size: 10px;
            color: #6b7280;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            margin-left: 5px;
          }
          .med-desc {
            color: #4b5563;
            font-size: 11px;
            direction: rtl;
            text-align: right;
          }
          .med-duration {
            font-size: 11px;
            color: #059669;
            white-space: nowrap;
          }
          .med-qty {
            font-size: 11px;
            color: #6b7280;
            white-space: nowrap;
          }
          .notes-section {
            padding: 10px 15px;
            background: #fef3c7;
            border-top: 1px solid #fcd34d;
          }
          .notes-title {
            font-weight: 600;
            color: #92400e;
            font-size: 11px;
            margin-bottom: 3px;
          }
          .notes-text {
            color: #78350f;
            font-size: 11px;
            direction: rtl;
            text-align: right;
          }
          .footer {
            padding: 12px 15px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .doctor-info {
            text-align: left;
          }
          .doctor-name {
            font-weight: 600;
            color: #1f2937;
          }
          .signature-line {
            margin-top: 20px;
            border-top: 1px solid #9ca3af;
            width: 120px;
            padding-top: 3px;
            font-size: 10px;
            color: #6b7280;
          }
          .date-info {
            text-align: right;
            font-size: 11px;
            color: #6b7280;
          }
          @media print {
            body { padding: 0; }
            .prescription { border: 1px solid #0d9488; }
          }
        </style>
      </head>
      <body>
        <div class="prescription">
          <div class="header">
            <div>
              <div class="clinic-name">${clinicName}</div>
              <div class="clinic-subtitle">Obstetrics & Gynecology - IVF Center</div>
            </div>
            <div class="rx-symbol">℞</div>
          </div>
          
          <div class="patient-section">
            <div class="patient-info">
              <div class="info-item">
                <span class="info-label">Patient:</span>
                <span class="info-value">${patientName || '_______________'}</span>
              </div>
              ${gestationalWeeks ? `
              <div class="info-item">
                <span class="info-label">GA:</span>
                <span class="info-value">${gestationalWeeks} weeks</span>
              </div>
              ` : ''}
            </div>
            <div class="info-item">
              <span class="info-label">Date:</span>
              <span class="info-value">${prescriptionDate}</span>
            </div>
          </div>

          <div class="medications">
            <table class="med-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medication</th>
                  <th style="text-align: right; direction: rtl;">الجرعة</th>
                  <th>Duration</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                ${prescription.items.map((item, idx) => `
                <tr>
                  <td class="med-num">${idx + 1}</td>
                  <td>
                    <span class="med-name">${item.drug}</span>
                    <span class="med-form">${item.form || 'Tab'}</span>
                  </td>
                  <td class="med-desc">${item.descAr}</td>
                  <td class="med-duration">${item.duration || ''}</td>
                  <td class="med-qty">${item.quantity || ''}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${prescription.notes ? `
          <div class="notes-section">
            <div class="notes-title">ملاحظات / Notes:</div>
            <div class="notes-text">${prescription.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div class="doctor-info">
              <div class="doctor-name">${doctorName}</div>
              <div class="signature-line">Signature</div>
            </div>
            <div class="date-info">
              <div>Next visit: ___ / ___ / ______</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
      name: 'روشتة الحجز (Booking)',
      items: [
        { drug: 'Folic Acid 5mg', descAr: 'قرص واحد يومياً صباحاً', form: 'Tab', duration: '3 شهور' },
        { drug: 'Vitamin D3 1000 IU', descAr: 'قرص واحد يومياً بعد الأكل', form: 'Tab', duration: 'طوال الحمل' },
      ]
    },
    {
      name: 'الثلث الثاني (2nd Trimester)',
      items: [
        { drug: 'Ferrous Sulfate 200mg', descAr: 'قرص مرتين يومياً بعد الأكل بساعتين', form: 'Tab', duration: 'طوال الحمل' },
        { drug: 'Calcium 500mg + Vit D', descAr: 'قرص مرتين يومياً', form: 'Tab', duration: 'طوال الحمل' },
        { drug: 'Omega-3 (DHA) 1000mg', descAr: 'كبسولة واحدة يومياً بعد الغداء', form: 'Cap', duration: 'طوال الحمل' },
      ]
    },
    {
      name: 'حمل عالي الخطورة (High Risk)',
      items: [
        { drug: 'Aspirin 81mg', descAr: 'قرص واحد يومياً مساءً بعد الأكل', form: 'Tab', duration: 'حتى أسبوع 36' },
        { drug: 'Calcium 500mg + Vit D', descAr: 'قرص مرتين يومياً', form: 'Tab', duration: 'طوال الحمل' },
        { drug: 'Vitamin D3 2000 IU', descAr: 'قرص واحد يومياً بعد الأكل', form: 'Tab', duration: 'طوال الحمل' },
      ]
    },
    {
      name: 'IVF Pregnancy',
      items: [
        { drug: 'Progesterone 400mg (Cyclogest)', descAr: 'تحميلة مهبلية يومياً مساءً', form: 'Supp', duration: 'حتى أسبوع 12' },
        { drug: 'Folic Acid 5mg', descAr: 'قرص واحد يومياً صباحاً', form: 'Tab', duration: '3 شهور' },
        { drug: 'Aspirin 81mg', descAr: 'قرص واحد يومياً مساءً بعد الأكل', form: 'Tab', duration: 'حتى أسبوع 36' },
      ]
    }
  ];

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    const items = template.items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      quantity: '1 علبة'
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
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
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
                {category.drugs.map((drug, idx) => {
                  const isAdded = currentItems.some(item => item.drug === drug.name);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAddDrug(drug)}
                      disabled={isAdded}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        isAdded
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 cursor-not-allowed'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <span className="font-medium">{drug.name}</span>
                      {isAdded && <Check size={14} className="inline mr-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Current Items */}
          {currentItems.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">الأدوية المختارة ({currentItems.length})</h4>
              <div className="space-y-2">
                {currentItems.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{item.drug}</p>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                          {item.form}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={item.descAr}
                          onChange={e => handleUpdateItem(item.id, 'descAr', e.target.value)}
                          className="text-sm px-2 py-1.5 border border-gray-200 rounded bg-white"
                          placeholder="الجرعة"
                          dir="rtl"
                        />
                        <input
                          type="text"
                          value={item.duration || ''}
                          onChange={e => handleUpdateItem(item.id, 'duration', e.target.value)}
                          className="text-sm px-2 py-1.5 border border-gray-200 rounded bg-white"
                          placeholder="المدة"
                          dir="rtl"
                        />
                        <input
                          type="text"
                          value={item.quantity || ''}
                          onChange={e => handleUpdateItem(item.id, 'quantity', e.target.value)}
                          className="text-sm px-2 py-1.5 border border-gray-200 rounded bg-white"
                          placeholder="الكمية"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
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
              placeholder="تعليمات إضافية... مثال: تجنب تناول الحديد مع الشاي أو القهوة"
              dir="rtl"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitPrescription}
              disabled={currentItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(prescription.created_at).toLocaleDateString('en-GB')}
                  </span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                    {prescription.items.length} medications
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyToNew(prescription)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="نسخ للتعديل"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handlePrintPrescription(prescription)}
                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                    title="طباعة"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {prescription.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-white p-2 rounded">
                    <span className="w-5 h-5 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-800">{item.drug}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {item.form}
                    </span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-600 text-right flex-1" dir="rtl">{item.descAr}</span>
                    {item.duration && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {item.duration}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {prescription.notes && (
                <p className="text-sm text-amber-700 mt-3 bg-amber-50 p-2 rounded border border-amber-200" dir="rtl">
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
