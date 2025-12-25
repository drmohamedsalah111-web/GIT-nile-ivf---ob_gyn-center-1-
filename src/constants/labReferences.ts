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

export interface LabPackage {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  tests: string[];
  category: 'Fertility' | 'Obstetrics' | 'General';
}

export const LAB_PACKAGES: LabPackage[] = [
  {
    id: 'basic_fertility',
    titleAr: 'باقة الخصوبة الأساسية (يوم 2-3)',
    titleEn: 'Basic Fertility Profile (Day 2-3)',
    descriptionAr: 'تقييم أولي للهرمونات الأساسية المسؤولة عن التبويض.',
    tests: ['FSH', 'LH', 'E2 (Estradiol)', 'Prolactin', 'TSH'],
    category: 'Fertility'
  },
  {
    id: 'ovarian_reserve',
    titleAr: 'باقة مخزون المبيض',
    titleEn: 'Ovarian Reserve Profile',
    descriptionAr: 'لتقييم المخزون المبيضي والتنبؤ بالاستجابة للتنشيط.',
    tests: ['AMH', 'AFC (Ultrasound)'],
    category: 'Fertility'
  },
  {
    id: 'pcos_profile',
    titleAr: 'باقة تكيس المبايض',
    titleEn: 'PCOS Profile',
    descriptionAr: 'لتشخيص متلازمة تكيس المبايض ومقاومة الأنسولين.',
    tests: ['FSH', 'LH', 'Total Testosterone', 'Free Testosterone', 'DHEAS', 'SHBG', 'Fasting Insulin', 'Fasting Glucose', 'HOMA-IR'],
    category: 'Fertility'
  },
  {
    id: 'recurrent_loss',
    titleAr: 'باقة الإجهاض المتكرر',
    titleEn: 'Recurrent Miscarriage Profile',
    descriptionAr: 'فحوصات التجلط والمناعة للكشف عن أسباب الإجهاض المتكرر.',
    tests: ['Lupus Anticoagulant', 'Anticardiolipin IgG/IgM', 'Beta-2 Glycoprotein 1 IgG/IgM', 'Protein C Activity', 'Protein S Activity', 'Antithrombin III', 'Factor V Leiden', 'Prothrombin Gene Mutation', 'Karyotyping (Husband & Wife)'],
    category: 'Fertility'
  },
  {
    id: 'pre_ivf_viral',
    titleAr: 'باقة الفيروسات (قبل الحقن)',
    titleEn: 'Pre-IVF Viral Markers',
    descriptionAr: 'فحوصات العدوى الفيروسية المطلوبة قبل بدء الحقن المجهري.',
    tests: ['HBsAg', 'HCV Ab', 'HIV I/II', 'VDRL / RPR'],
    category: 'Fertility'
  },
  {
    id: 'antenatal_first',
    titleAr: 'باقة الحمل (الزيارة الأولى)',
    titleEn: 'Antenatal Profile (First Visit)',
    descriptionAr: 'الفحوصات الروتينية عند ثبوت الحمل.',
    tests: ['CBC', 'Blood Group & Rh', 'Random Blood Sugar', 'Urine Analysis', 'Rubella IgG', 'TSH'],
    category: 'Obstetrics'
  },
  {
    id: 'antenatal_28w',
    titleAr: 'باقة الحمل (الأسبوع 24-28)',
    titleEn: 'Antenatal Profile (24-28 Weeks)',
    descriptionAr: 'فحص سكري الحمل والأنيميا.',
    tests: ['CBC', 'GCT (50g Glucose) or OGTT', 'Urine Analysis'],
    category: 'Obstetrics'
  },
  {
    id: 'male_infertility',
    titleAr: 'باقة عقم الرجال',
    titleEn: 'Male Infertility Profile',
    descriptionAr: 'تقييم أسباب تأخر الإنجاب لدى الزوج.',
    tests: ['Semen Analysis (Computerized)', 'FSH', 'LH', 'Total Testosterone', 'Prolactin', 'Scrotal Doppler'],
    category: 'Fertility'
  }
];

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

