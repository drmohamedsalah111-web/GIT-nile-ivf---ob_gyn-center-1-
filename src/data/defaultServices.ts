/**
 * قائمة الخدمات الافتراضية لعيادات النساء والولادة والحقن المجهري
 * يمكن تحميلها تلقائياً عند بداية العمل
 */

type ServiceCategory = 'Outpatient' | 'Procedure' | 'Lab' | 'Pharmacy' | 'IVF' | 'Antenatal';

interface DefaultService {
    name: string;
    category: ServiceCategory;
    price: number;
    cost_price: number;
}

export const defaultServices: DefaultService[] = [
    // عيادة خارجية - Outpatient
    { name: 'كشف عيادة خارجية', category: 'Outpatient', price: 300, cost_price: 0 },
    { name: 'كشف متابعة', category: 'Outpatient', price: 200, cost_price: 0 },
    { name: 'استشارة طبية', category: 'Outpatient', price: 250, cost_price: 0 },
    { name: 'كشف طوارئ', category: 'Outpatient', price: 400, cost_price: 0 },

    // إجراءات - Procedures
    { name: 'سونار عادي', category: 'Procedure', price: 200, cost_price: 0 },
    { name: 'سونار رباعي الأبعاد (4D)', category: 'Procedure', price: 400, cost_price: 0 },
    { name: 'سونار مهبلي', category: 'Procedure', price: 250, cost_price: 0 },
    { name: 'فحص عنق الرحم', category: 'Procedure', price: 300, cost_price: 0 },
    { name: 'تركيب لولب', category: 'Procedure', price: 500, cost_price: 200 },
    { name: 'إزالة لولب', category: 'Procedure', price: 300, cost_price: 50 },
    { name: 'حقن مهبلي', category: 'Procedure', price: 150, cost_price: 50 },
    { name: 'تنظيف رحم', category: 'Procedure', price: 3000, cost_price: 500 },
    { name: 'خزعة عنق الرحم', category: 'Procedure', price: 800, cost_price: 200 },
    { name: 'كي كهربائي', category: 'Procedure', price: 1000, cost_price: 150 },

    // معمل - Lab
    { name: 'تحليل حمل رقمي (HCG)', category: 'Lab', price: 150, cost_price: 50 },
    { name: 'تحليل هرمونات', category: 'Lab', price: 400, cost_price: 150 },
    { name: 'صورة دم كاملة (CBC)', category: 'Lab', price: 100, cost_price: 30 },
    { name: 'تحليل سكر صائم', category: 'Lab', price: 80, cost_price: 20 },
    { name: 'تحليل بول كامل', category: 'Lab', price: 60, cost_price: 15 },
    { name: 'مزرعة بول', category: 'Lab', price: 150, cost_price: 50 },
    { name: 'تحليل AMH', category: 'Lab', price: 600, cost_price: 200 },
    { name: 'تحليل FSH/LH', category: 'Lab', price: 350, cost_price: 120 },
    { name: 'تحليل هرمون الحليب', category: 'Lab', price: 200, cost_price: 70 },

    // متابعة حمل - Antenatal
    { name: 'متابعة حمل شهرية', category: 'Antenatal', price: 400, cost_price: 0 },
    { name: 'سونار حمل', category: 'Antenatal', price: 300, cost_price: 0 },
    { name: 'قياس نبض الجنين', category: 'Antenatal', price: 150, cost_price: 0 },
    { name: 'فحص السكر للحامل', category: 'Antenatal', price: 200, cost_price: 50 },
    { name: 'تحليل TORCH', category: 'Antenatal', price: 800, cost_price: 300 },

    // حقن مجهري - IVF
    { name: 'استشارة حقن مجهري', category: 'IVF', price: 500, cost_price: 0 },
    { name: 'متابعة تنشيط', category: 'IVF', price: 300, cost_price: 0 },
    { name: 'سحب بويضات', category: 'IVF', price: 8000, cost_price: 2000 },
    { name: 'ترجيع أجنة', category: 'IVF', price: 5000, cost_price: 1000 },
    { name: 'تجميد أجنة', category: 'IVF', price: 3000, cost_price: 500 },
    { name: 'حقن مجهري (دورة كاملة)', category: 'IVF', price: 25000, cost_price: 8000 },
    { name: 'فحص أجنة وراثي (PGD)', category: 'IVF', price: 15000, cost_price: 5000 },
    { name: 'تحليل سائل منوي', category: 'IVF', price: 200, cost_price: 50 },
    { name: 'غسيل نطاف', category: 'IVF', price: 500, cost_price: 150 },

    // صيدلية - Pharmacy
    { name: 'أدوية تنشيط (حسب البروتوكول)', category: 'Pharmacy', price: 5000, cost_price: 3500 },
    { name: 'حقن تفجيرية', category: 'Pharmacy', price: 300, cost_price: 150 },
    { name: 'مثبتات حمل', category: 'Pharmacy', price: 400, cost_price: 200 },
    { name: 'فيتامينات للحمل', category: 'Pharmacy', price: 150, cost_price: 80 },
];
