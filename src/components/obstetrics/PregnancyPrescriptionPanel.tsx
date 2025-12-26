/**
 * Pregnancy Prescription Panel - Simplified Version
 * روشتة متابعة الحمل - نسخة مبسطة
 * Features: Print, Edit medications/doses, Delete old prescriptions
 */

import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Printer, X, Edit2, Save } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { useBranding } from '../../../context/BrandingContext';
import toast from 'react-hot-toast';

interface PrescriptionItem {
  drug: string;
  dose: string;
  category?: string;
}

interface Prescription {
  id: string;
  pregnancy_id: string;
  items: PrescriptionItem[];
  notes?: string;
  created_at: string;
}

interface PregnancyPrescriptionPanelProps {
  pregnancyId: string;
  gestationalWeeks: number;
  patientName?: string;
}

export const PregnancyPrescriptionPanel: React.FC<PregnancyPrescriptionPanelProps> = ({
  pregnancyId,
  patientName
}) => {
  const { branding } = useBranding();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  
  // New prescription form
  const [newItems, setNewItems] = useState<PrescriptionItem[]>([]);
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<PrescriptionItem[]>([]);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, [pregnancyId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
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

  const handleAddDrug = () => {
    if (!newDrug.trim()) {
      toast.error('أدخل اسم الدواء');
      return;
    }
    if (!newDose.trim()) {
      toast.error('أدخل الجرعة');
      return;
    }

    setNewItems([...newItems, { drug: newDrug, dose: newDose, category: 'Pregnancy' }]);
    setNewDrug('');
    setNewDose('');
  };

  const handleRemoveNewDrug = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const handleCreatePrescription = async () => {
    if (newItems.length === 0) {
      toast.error('أضف دواء واحد على الأقل');
      return;
    }

    try {
      const { error } = await supabase
        .from('pregnancy_prescriptions')
        .insert({
          pregnancy_id: pregnancyId,
          items: newItems,
          notes: newNotes.trim() || null
        });

      if (error) throw error;

      toast.success('تم حفظ الروشتة بنجاح');
      setShowNewForm(false);
      setNewItems([]);
      setNewNotes('');
      fetchPrescriptions();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error('خطأ في حفظ الروشتة');
    }
  };

  const handleStartEdit = (prescription: Prescription) => {
    setEditingId(prescription.id);
    setEditItems([...prescription.items]);
    setEditNotes(prescription.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditItems([]);
    setEditNotes('');
  };

  const handleUpdateItem = (index: number, field: 'drug' | 'dose', value: string) => {
    const updated = [...editItems];
    updated[index][field] = value;
    setEditItems(updated);
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (editItems.length === 0) {
      toast.error('يجب أن تحتوي الروشتة على دواء واحد على الأقل');
      return;
    }

    try {
      const { error } = await supabase
        .from('pregnancy_prescriptions')
        .update({
          items: editItems,
          notes: editNotes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      toast.success('تم تحديث الروشتة بنجاح');
      setEditingId(null);
      setEditItems([]);
      setEditNotes('');
      fetchPrescriptions();
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      toast.error('خطأ في تحديث الروشتة');
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الروشتة؟')) return;

    try {
      const { error } = await supabase
        .from('pregnancy_prescriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الروشتة بنجاح');
      fetchPrescriptions();
    } catch (error: any) {
      console.error('Error deleting prescription:', error);
      toast.error('خطأ في حذف الروشتة');
    }
  };

  const handlePrint = (prescription: Prescription) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>روشتة طبية</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Tajawal', 'Arial', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid ${branding?.primary_color || '#0891B2'};
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: ${branding?.primary_color || '#0891B2'};
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .patient-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .patient-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          .rx-symbol {
            font-size: 48px;
            color: ${branding?.primary_color || '#0891B2'};
            text-align: center;
            margin: 20px 0;
          }
          .medications {
            margin: 20px 0;
          }
          .medication-item {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 10px;
          }
          .medication-item:last-child {
            border-bottom: none;
          }
          .medication-name {
            font-weight: bold;
            font-size: 16px;
            color: #111827;
            margin-bottom: 5px;
          }
          .medication-dose {
            color: #4b5563;
            font-size: 14px;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }
          .notes h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 16px;
          }
          .notes p {
            margin: 0;
            color: #78350f;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${branding?.clinic_name || 'عيادة متخصصة'}</h1>
          ${branding?.clinic_address ? `<p>${branding.clinic_address}</p>` : ''}
          ${branding?.clinic_phone ? `<p>📞 ${branding.clinic_phone}</p>` : ''}
        </div>

        <div class="patient-info">
          <p><strong>اسم المريضة:</strong> ${patientName || 'غير محدد'}</p>
          <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
          <p><strong>نوع الروشتة:</strong> متابعة حمل</p>
        </div>

        <div class="rx-symbol">℞</div>

        <div class="medications">
          ${prescription.items.map((item, index) => `
            <div class="medication-item">
              <div class="medication-name">${index + 1}. ${item.drug}</div>
              <div class="medication-dose">${item.dose}</div>
            </div>
          `).join('')}
        </div>

        ${prescription.notes ? `
          <div class="notes">
            <h3>ملاحظات</h3>
            <p>${prescription.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>تاريخ الإصدار: ${new Date(prescription.created_at).toLocaleDateString('ar-EG')}</p>
          ${branding?.default_rx_notes ? `<p style="margin-top: 10px;">${branding.default_rx_notes}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('فشل فتح نافذة الطباعة');
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <Pill className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">روشتات متابعة الحمل</h3>
            <p className="text-sm text-gray-500">{prescriptions.length} روشتة</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          روشتة جديدة
        </button>
      </div>

      {/* New Prescription Form */}
      {showNewForm && (
        <div className="bg-white border-2 border-teal-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">روشتة جديدة</h4>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewItems([]);
                setNewNotes('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Add Drug Form */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الدواء</label>
              <input
                type="text"
                value={newDrug}
                onChange={(e) => setNewDrug(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDrug()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="مثال: Folic Acid 5mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الجرعة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDose}
                  onChange={(e) => setNewDose(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDrug()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="مثال: قرص واحد يومياً"
                />
                <button
                  onClick={handleAddDrug}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* New Items List */}
          {newItems.length > 0 && (
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأدوية المضافة ({newItems.length})
              </label>
              {newItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">{item.drug}</div>
                    <div className="text-sm text-gray-600">{item.dose}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveNewDrug(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="أدخل أي ملاحظات أو تعليمات إضافية..."
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleCreatePrescription}
            disabled={newItems.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            حفظ الروشتة ({newItems.length} دواء)
          </button>
        </div>
      )}

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">لا توجد روشتات بعد</p>
          </div>
        ) : (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500">
                    {new Date(prescription.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-teal-600 font-medium mt-1">
                    {prescription.items.length} دواء
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingId === prescription.id ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        حفظ
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePrint(prescription)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة
                      </button>
                      <button
                        onClick={() => handleStartEdit(prescription)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeletePrescription(prescription.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Medications List */}
              {editingId === prescription.id ? (
                <div className="space-y-3">
                  {editItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">اسم الدواء</label>
                        <input
                          type="text"
                          value={item.drug}
                          onChange={(e) => handleUpdateItem(index, 'drug', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">الجرعة</label>
                          <input
                            type="text"
                            value={item.dose}
                            onChange={(e) => handleUpdateItem(index, 'dose', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => handleRemoveEditItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {prescription.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-xs font-semibold text-teal-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.drug}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.dose}</div>
                      </div>
                    </div>
                  ))}

                  {prescription.notes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-xs font-semibold text-amber-900 mb-1">ملاحظات</div>
                      <div className="text-sm text-amber-800">{prescription.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
