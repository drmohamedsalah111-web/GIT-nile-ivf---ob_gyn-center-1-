export type LabReferenceCategory =
  | 'Hormones'
  | 'Semen Analysis'
  | 'Pregnancy'
  | 'General';

export interface LabReferenceItem {
  id: string;
  category: LabReferenceCategory;
  nameAr: string;
  nameEn?: string;
  unit?: string;
  reminderAr: string;
  sourceInAppAr?: string;
}

// ملاحظة: هذه القيم/الحدود مبنية على "قواعد التنبيه داخل البرنامج" (ألوان/تحذيرات)،
// وليست بديلًا عن القيم المرجعية الرسمية للمعمل والتي قد تختلف حسب الكيت/المعمل.
export const LAB_REFERENCES: LabReferenceItem[] = [
  {
    id: 'fsh',
    category: 'Hormones',
    nameAr: 'FSH',
    nameEn: 'Follicle Stimulating Hormone',
    unit: 'IU/L',
    reminderAr: 'داخل البرنامج: يتم تمييزه كتنبيه إذا كان > 10 (Day 2-3 Profile).',
    sourceInAppAr: 'Clinical Station / تقييم الخصوبة'
  },
  {
    id: 'lh',
    category: 'Hormones',
    nameAr: 'LH',
    nameEn: 'Luteinizing Hormone',
    unit: 'IU/L',
    reminderAr: 'داخل البرنامج: يُستخدم مع FSH لحساب النسبة (LH/FSH). إذا كانت النسبة > 2 قد يُشتبه PCOS.',
    sourceInAppAr: 'Clinical Station / تقييم الخصوبة'
  },
  {
    id: 'e2',
    category: 'Hormones',
    nameAr: 'E2',
    nameEn: 'Estradiol',
    unit: 'pg/mL',
    reminderAr: 'داخل البرنامج: تنبيه إذا كان E2 > 80 (قد يشير إلى كيس وظيفي/استجابة ضعيفة).',
    sourceInAppAr: 'Clinical Station / IVF Stimulation'
  },
  {
    id: 'prolactin',
    category: 'Hormones',
    nameAr: 'البرولاكتين',
    nameEn: 'Prolactin',
    unit: 'ng/mL',
    reminderAr: 'داخل البرنامج: تنبيه إذا كان > 25.',
    sourceInAppAr: 'Clinical Station'
  },
  {
    id: 'tsh',
    category: 'Hormones',
    nameAr: 'TSH',
    nameEn: 'Thyroid Stimulating Hormone',
    unit: 'mIU/L',
    reminderAr: 'داخل البرنامج: تنبيه إذا كان > 2.5 (هدف ما قبل/بداية الحمل حسب الإعدادات الشائعة).',
    sourceInAppAr: 'Clinical Station'
  },
  {
    id: 'amh',
    category: 'Hormones',
    nameAr: 'AMH',
    nameEn: 'Anti‑Müllerian Hormone',
    unit: 'ng/mL',
    reminderAr: 'داخل البرنامج: تنبيه إذا كان < 1 (مخزون ضعيف) أو > 3.5 (مخزون مرتفع/PCO محتمل).',
    sourceInAppAr: 'Clinical Station / IVF Journey / Infertility Wizard'
  },
  {
    id: 'semen_volume',
    category: 'Semen Analysis',
    nameAr: 'حجم السائل المنوي',
    nameEn: 'Semen Volume',
    unit: 'mL',
    reminderAr: 'داخل البرنامج: يعتبر منخفضًا إذا كان < 1.5.',
    sourceInAppAr: 'تحليل السائل المنوي'
  },
  {
    id: 'semen_concentration',
    category: 'Semen Analysis',
    nameAr: 'التركيز',
    nameEn: 'Sperm Concentration',
    unit: 'million/mL',
    reminderAr: 'داخل البرنامج: يعتبر منخفضًا إذا كان < 15.',
    sourceInAppAr: 'تحليل السائل المنوي'
  },
  {
    id: 'semen_motility',
    category: 'Semen Analysis',
    nameAr: 'الحركة',
    nameEn: 'Motility',
    unit: '%',
    reminderAr: 'داخل البرنامج: يعتبر منخفضًا إذا كان < 40.',
    sourceInAppAr: 'تحليل السائل المنوي'
  },
  {
    id: 'semen_morphology',
    category: 'Semen Analysis',
    nameAr: 'الأشكال الطبيعية',
    nameEn: 'Morphology',
    unit: '%',
    reminderAr: 'داخل البرنامج: يعتبر منخفضًا إذا كان < 4.',
    sourceInAppAr: 'تحليل السائل المنوي'
  },
  {
    id: 'tmsc',
    category: 'Semen Analysis',
    nameAr: 'TMSC',
    nameEn: 'Total Motile Sperm Count',
    unit: 'million',
    reminderAr: 'داخل البرنامج: يتم حسابه = الحجم × التركيز × الحركة ÷ 100.',
    sourceInAppAr: 'حسابات السائل المنوي'
  },
  {
    id: 'gtt',
    category: 'Pregnancy',
    nameAr: 'اختبار سكر الحمل',
    nameEn: 'GTT / OGTT',
    reminderAr: 'التوقيت داخل البرنامج: غالبًا بين 24–28 أسبوع (تنبيه في جدول المتابعة).',
    sourceInAppAr: 'Obstetrics Dashboard / Due Actions'
  },
  {
    id: 'anti_d',
    category: 'Pregnancy',
    nameAr: 'حقنة Anti‑D',
    nameEn: 'RhoGAM',
    reminderAr: 'التوقيت داخل البرنامج: عند 28 أسبوع (إذا كانت الأم Rh سالب).',
    sourceInAppAr: 'Obstetrics Dashboard / Due Actions'
  }
].sort((a, b) => a.category.localeCompare(b.category) || a.nameAr.localeCompare(b.nameAr));

