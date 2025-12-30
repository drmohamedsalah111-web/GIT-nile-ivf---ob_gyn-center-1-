export type Medication = {
  id: string;
  name_en: string;
  dosage_ar: string;
  instructions_ar: string;
  category: string;
};

export const sampleMedications: Medication[] = [
  {
    id: 'iron-01',
    name_en: 'Iron Supplement',
    dosage_ar: '1 كبسولة يومياً',
    instructions_ar: 'ي يؤخذ مع الطعام صباحاً',
    category: 'Vitamins',
  },
  {
    id: 'para-500',
    name_en: 'Paracetamol',
    dosage_ar: '500 ملغ',
    instructions_ar: 'يؤخذ كل 4-6 ساعات عند الحاجة',
    category: 'Analgesics',
  },
  {
    id: 'folic-01',
    name_en: 'Folic Acid',
    dosage_ar: '1 قرص يومياً',
    instructions_ar: 'يؤخذ قبل أو بعد الطعام',
    category: 'Vitamins',
  },
];
