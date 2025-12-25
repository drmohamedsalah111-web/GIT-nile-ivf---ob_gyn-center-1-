# 🎨 نظام الروشتات الذكي - Smart Prescription System

نظام متكامل وذكي لإدارة وطباعة الروشتات الطبية بمظهر احترافي وجميل.

## ✨ المميزات الرئيسية

### 🎯 قوالب متعددة احترافية
- **عصري (Modern)**: تصميم عصري بألوان متدرجة وأيقونات حديثة
- **كلاسيكي (Classic)**: تصميم تقليدي أنيق بنمط طبي تقليدي
- **بسيط (Minimal)**: تصميم نظيف ومباشر للحصول على مظهر أنيق
- **أنيق (Elegant)**: تصميم راقي بإطار مزخرف وخطوط أنيقة

### 🧠 ذكاء اصطناعي مدمج
- ✅ **فحص التفاعلات الدوائية**: تحذير تلقائي عند وجود تفاعلات محتملة
- 💊 **اقتراحات ذكية**: اقتراح أدوية بناءً على التشخيص
- 📋 **سجل تاريخي**: حفظ واسترجاع الروشتات السابقة
- 🔄 **نسخ الروشتات**: إمكانية نسخ روشتات سابقة

### 🎨 تخصيص كامل
- 🎨 اختيار الألوان (رئيسي، ثانوي، مميز)
- 🖼️ رفع شعار العيادة
- 📝 تخصيص رأس وتذييل الروشتة
- 🔤 اختيار نوع الخط (Tajawal، Cairo، Almarai، Inter)
- 📏 حجم الخط (صغير، متوسط، كبير)
- 📄 حجم الورق (A4، A5، Letter)

### 📋 خيارات العرض
- ✅ إظهار/إخفاء العنوان
- ✅ إظهار/إخفاء رقم الهاتف
- ✅ إظهار/إخفاء توقيع الطبيب
- ✅ إظهار/إخفاء علامة مائية
- ✅ إظهار/إخفاء تصنيف الدواء
- ✅ إظهار/إخفاء الترجمة العربية
- ✅ ترقيم تلقائي للأدوية

## 📁 البنية

```
components/
  smart-prescription/
    ├── SmartPrescriptionSystem.tsx  # المكون الرئيسي
    ├── ModernTemplate.tsx           # قالب عصري
    ├── ClassicTemplate.tsx          # قالب كلاسيكي
    ├── MinimalTemplate.tsx          # قالب بسيط
    ├── ElegantTemplate.tsx          # قالب أنيق
    └── index.ts                     # ملف التصدير

services/
  └── prescriptionService.ts         # خدمات الروشتات

hooks/
  └── usePrescription.ts            # Hook ذكي للروشتات
```

## 🚀 الاستخدام

### 1. استيراد المكون

```tsx
import { SmartPrescriptionSystem } from '@/components/smart-prescription';
import { usePrescription } from '@/hooks/usePrescription';
```

### 2. استخدام Hook

```tsx
const {
  prescriptions,
  settings,
  loading,
  interactionWarnings,
  addMedication,
  removeMedication,
  clearPrescriptions,
  savePrescription,
  printPrescription,
} = usePrescription({
  patientId: patient.id,
  enableInteractionCheck: true,
  autoSave: true,
});
```

### 3. استخدام المكون

```tsx
<SmartPrescriptionSystem
  patient={patient}
  doctor={doctor}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialPrescriptions={prescriptions}
  diagnosis={diagnosis}
  notes={notes}
/>
```

## 📦 التبعيات المطلوبة

```bash
npm install lucide-react react-hot-toast
```

## 🔧 الإعداد الأولي

### 1. إنشاء جدول الإعدادات في Supabase

```sql
-- تشغيل السكريبت الموجود في:
-- PRESCRIPTION_PRINT_SETTINGS_SETUP.sql
```

### 2. إضافة جدول سجل الروشتات (اختياري)

```sql
CREATE TABLE IF NOT EXISTS prescription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL,
  prescriptions JSONB NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prescription_history ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can manage their prescriptions"
  ON prescription_history
  USING (true)
  WITH CHECK (true);
```

## 🎯 مثال كامل

```tsx
import React, { useState } from 'react';
import { SmartPrescriptionSystem } from '@/components/smart-prescription';
import { usePrescription } from '@/hooks/usePrescription';
import { Patient, Doctor } from '@/types';

const PrescriptionPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [patient] = useState<Patient>({
    id: '1',
    name: 'أحمد محمد',
    age: 35,
    phone: '0123456789',
  });
  
  const [doctor] = useState<Doctor>({
    id: '1',
    name: 'د. محمد صلاح',
    specialization: 'أخصائي نساء وتوليد',
    clinic_name: 'عيادة النيل',
    clinic_address: 'شارع التحرير، القاهرة',
    clinic_phone: '0123456789',
  });

  const {
    prescriptions,
    addMedication,
    interactionWarnings,
  } = usePrescription({
    patientId: patient.id,
    enableInteractionCheck: true,
  });

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg"
      >
        فتح نظام الروشتات
      </button>

      <SmartPrescriptionSystem
        patient={patient}
        doctor={doctor}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialPrescriptions={prescriptions}
        diagnosis="ارتفاع ضغط الدم"
        notes="المتابعة بعد أسبوعين"
      />
    </div>
  );
};

export default PrescriptionPage;
```

## 🎨 تخصيص القوالب

يمكنك إنشاء قالب جديد:

```tsx
import React from 'react';
import { PrescriptionItem, Patient, Doctor } from '../../types';
import { PrescriptionSettings } from '../../services/prescriptionService';

interface CustomTemplateProps {
  patient: Patient;
  doctor: Doctor | null;
  prescriptions: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  settings: PrescriptionSettings;
}

export const CustomTemplate = React.forwardRef<HTMLDivElement, CustomTemplateProps>(
  ({ patient, doctor, prescriptions, diagnosis, notes, settings }, ref) => {
    return (
      <div ref={ref} className="prescription-custom">
        {/* تصميمك الخاص هنا */}
      </div>
    );
  }
);

CustomTemplate.displayName = 'CustomTemplate';
```

## ⚙️ API Reference

### `usePrescription` Hook

#### Options
```typescript
interface UsePrescriptionOptions {
  patientId?: string;           // معرف المريض
  autoSave?: boolean;           // حفظ تلقائي
  enableInteractionCheck?: boolean; // فحص التفاعلات
}
```

#### Returns
```typescript
{
  prescriptions: PrescriptionItem[];
  settings: PrescriptionSettings | null;
  loading: boolean;
  interactionWarnings: string[];
  hasInteractions: boolean;
  
  // Actions
  addMedication: (medication: PrescriptionItem) => void;
  removeMedication: (index: number) => void;
  updateMedication: (index: number, updates: Partial<PrescriptionItem>) => void;
  clearPrescriptions: () => void;
  loadPrescriptionTemplate: (template: PrescriptionItem[]) => void;
  getSuggestions: (diagnosis: string) => PrescriptionItem[];
  savePrescription: (data: { diagnosis?: string; notes?: string }) => Promise<string | null>;
  printPrescription: (printElement: HTMLElement) => Promise<boolean>;
  setPrescriptions: (prescriptions: PrescriptionItem[]) => void;
  loadSettings: () => Promise<void>;
}
```

### `prescriptionService` Service

#### Methods

```typescript
// جلب الإعدادات
await prescriptionService.getSettings(clinicId?: number);

// حفظ الإعدادات
await prescriptionService.saveSettings(settings: Partial<PrescriptionSettings>);

// الحصول على القوالب المتاحة
prescriptionService.getAvailableTemplates();

// معالجة الروشتة قبل الطباعة
prescriptionService.processPrescription(prescriptions, settings);

// فحص التفاعلات الدوائية
prescriptionService.checkDrugInteractions(prescriptions);

// الحصول على اقتراحات الأدوية
prescriptionService.getSuggestedMedications(diagnosis);

// حفظ في السجل
await prescriptionService.savePrescriptionHistory(data);

// جلب تاريخ الروشتات
await prescriptionService.getPrescriptionHistory(patientId, limit);
```

## 🐛 المشاكل الشائعة وحلولها

### المشكلة: الطباعة لا تعمل
**الحل**: تأكد من السماح بالنوافذ المنبثقة (Pop-ups) في المتصفح

### المشكلة: الألوان لا تظهر عند الطباعة
**الحل**: تفعيل "Print background colors" في إعدادات الطباعة

### المشكلة: الخطوط العربية لا تظهر بشكل صحيح
**الحل**: تأكد من تحميل خطوط Google Fonts في `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
```

## 🔮 الميزات المستقبلية

- [ ] إضافة QR Code للروشتات
- [ ] تصدير PDF مباشر
- [ ] إرسال الروشتة عبر البريد الإلكتروني/SMS
- [ ] قوالب إضافية
- [ ] دعم لغات متعددة
- [ ] تكامل مع أنظمة الصيدليات

## 📝 الترخيص

هذا النظام جزء من نظام Nile IVF & OB/GYN Center Management System

## 👨‍💻 المطور

تم التطوير بواسطة فريق Nile Medical Systems

---

💙 **استمتع بنظام روشتات ذكي واحترافي!**
