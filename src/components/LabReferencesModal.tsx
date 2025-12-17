import React, { useMemo, useState } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { LAB_REFERENCES, LabReferenceCategory, LabReferenceItem } from '../constants/labReferences';

interface LabReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryNameAr: Record<LabReferenceCategory, string> = {
  'Hormones': 'هرمونات',
  'Semen Analysis': 'تحليل السائل المنوي',
  'Pregnancy': 'تحاليل/تنبيهات الحمل',
  'General': 'عام'
};

const LabReferencesModal: React.FC<LabReferencesModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LabReferenceCategory | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return LAB_REFERENCES.filter((item) => {
      const matchesCategory = category === 'ALL' ? true : item.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;

      const haystack = `${item.nameAr} ${item.nameEn || ''} ${item.unit || ''} ${item.reminderAr} ${item.sourceInAppAr || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category]);

  const grouped = useMemo(() => {
    const result: Record<string, LabReferenceItem[]> = {};
    for (const item of filtered) {
      const key = item.category;
      if (!result[key]) result[key] = [];
      result[key].push(item);
    }
    return result;
  }, [filtered]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex items-start justify-between gap-4 p-4 border-b bg-teal-50">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-[Tajawal] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700" />
                مرجع التحاليل (للتذكير)
              </h2>
              <p className="text-xs text-gray-600 font-[Tajawal]">
                هذه “حدود/ملاحظات تنبيه” مستخدمة داخل البرنامج وليست بديلًا عن مرجع المعمل.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/70 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1 font-[Tajawal]">بحث</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث باسم التحليل أو الوحدة أو الملاحظة..."
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-[Tajawal]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-[Tajawal]">القسم</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-[Tajawal]"
                >
                  <option value="ALL">كل التحاليل</option>
                  <option value="Hormones">{categoryNameAr.Hormones}</option>
                  <option value="Semen Analysis">{categoryNameAr['Semen Analysis']}</option>
                  <option value="Pregnancy">{categoryNameAr.Pregnancy}</option>
                  <option value="General">{categoryNameAr.General}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 font-[Tajawal] py-10">لا توجد نتائج</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="text-sm font-bold text-gray-900 mb-2 font-[Tajawal]">
                      {categoryNameAr[cat as LabReferenceCategory] || cat}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-3 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 font-[Tajawal]">
                                {item.nameAr}
                                {item.nameEn ? <span className="text-xs text-gray-500 ml-2">{item.nameEn}</span> : null}
                              </div>
                              {item.unit ? (
                                <div className="text-xs text-gray-600 mt-1 font-[Tajawal]">الوحدة: {item.unit}</div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-800 font-[Tajawal] whitespace-pre-line">
                            {item.reminderAr}
                          </div>
                          {item.sourceInAppAr ? (
                            <div className="mt-2 text-xs text-gray-500 font-[Tajawal]">
                              المكان داخل البرنامج: {item.sourceInAppAr}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LabReferencesModal;

