# 🎉 نظام الأقساط للحقن المجهري - دليل الاستخدام

## تم إنشاؤه: 27 ديسمبر 2025
## المبرمج: د. محمد صلاح جبر

---

## ✅ ما تم إنجازه

تم تطوير نظام متكامل لإدارة الأقساط الخاصة بدورات الحقن المجهري يشمل:

### 1. **قاعدة البيانات (Database Schema)**
📄 الملف: `INSTALLMENTS_SYSTEM_SCHEMA.sql`

**الجداول المُنشأة:**
- ✅ `ivf_packages` - باقات الحقن المجهري مع الأسعار
- ✅ `installments` - أقساط الدفع لكل دورة
- ✅ `installment_payments` - سجل كامل لكل دفعة (للتدقيق)

**المميزات:**
- أقساط تلقائية عند بدء دورة جديدة (3 أقساط: تنشيط، سحب، إرجاع)
- دالة `create_installments_for_cycle()` لإنشاء الأقساط تلقائياً
- RLS Policies كاملة للأمان
- Indexes محسّنة للأداء
- Triggers تلقائية لـ `updated_at`

---

### 2. **خدمة الأقساط (Installments Service)**
📄 الملف: `services/installmentsService.ts`

**الوظائف المتاحة:**

#### إدارة الباقات:
- `getActivePackages()` - جلب الباقات النشطة
- `createPackage()` - إنشاء باقة جديدة

#### إدارة الأقساط:
- `createInstallmentsForCycle()` - إنشاء أقساط تلقائية لدورة جديدة
- `getInstallmentsByCycle()` - جلب أقساط دورة معينة
- `getDueInstallmentsByPatient()` - جلب الأقساط المستحقة
- `payInstallment()` - تسجيل دفع قسط
- `getPaymentHistory()` - تاريخ الدفعات لقسط
- `updateInstallmentStatusOnEvent()` - تحديث الأقساط عند حدث (OPU/Transfer)
- `cancelInstallment()` - إلغاء قسط

#### تقارير وإحصائيات:
- `getInstallmentsSummary()` - ملخص الأقساط للطبيب

---

### 3. **واجهة المستخدم (UI Components)**

#### **أ. جدول الأقساط**
📄 الملف: `components/installments/InstallmentsTable.tsx`

**المميزات:**
- ✅ عرض كل أقساط الدورة في جدول احترافي
- ✅ حالة كل قسط (مؤجل، مستحق، مدفوع، متأخر، ملغي)
- ✅ زر "دفع" يظهر فقط للأقساط المستحقة
- ✅ حساب المبلغ المتبقي تلقائياً
- ✅ طباعة إيصال فوري بعد الدفع
- ✅ تحديث تلقائي بعد الدفع

**الاستخدام:**
```tsx
import { InstallmentsTable } from './components/installments/InstallmentsTable';

<InstallmentsTable
  cycleId="uuid-cycle-id"
  patientId="uuid-patient-id"
  patientName="اسم المريضة"
  onPaymentSuccess={() => console.log('تم الدفع')}
/>
```

#### **ب. نافذة بدء دورة جديدة مع باقة**
📄 الملف: `components/installments/StartCycleWithPackage.tsx`

**المميزات:**
- ✅ اختيار باقة من قائمة الباقات المتاحة
- ✅ عرض تفاصيل كل باقة (السعر، خطة الأقساط)
- ✅ إنشاء دورة + أقساط معاً بضغطة زر واحدة
- ✅ واجهة جميلة وسهلة الاستخدام

**الاستخدام:**
```tsx
import { StartCycleWithPackage } from './components/installments/StartCycleWithPackage';

const [showDialog, setShowDialog] = useState(false);

<button onClick={() => setShowDialog(true)}>
  بدء دورة جديدة
</button>

{showDialog && (
  <StartCycleWithPackage
    patientId="uuid-patient-id"
    patientName="اسم المريضة"
    onSuccess={(cycleId) => {
      console.log('تم إنشاء الدورة:', cycleId);
      setShowDialog(false);
    }}
    onCancel={() => setShowDialog(false)}
  />
)}
```

---

## 🚀 خطوات التفعيل

### الخطوة 1: تشغيل سكريبت قاعدة البيانات
```sql
-- افتح Supabase SQL Editor
-- الصق كود INSTALLMENTS_SYSTEM_SCHEMA.sql
-- اضغط Run
```

**النتيجة المتوقعة:**
```
✅ نظام الأقساط تم إنشاؤه بنجاح
tables_created: 3
```

---

### الخطوة 2: إضافة باقات افتراضية

```sql
-- أضف باقاتك الخاصة (غيّر YOUR_DOCTOR_ID بـ ID الطبيب الحقيقي)
INSERT INTO ivf_packages (doctor_id, package_name, package_name_ar, total_price, description) VALUES
  ('YOUR_DOCTOR_ID', 'ICSI Standard Package', 'باقة الحقن المجهري القياسية', 30000.00, 'تشمل: التنشيط + السحب + الإرجاع'),
  ('YOUR_DOCTOR_ID', 'ICSI Premium Package', 'باقة الحقن المجهري المميزة', 45000.00, 'تشمل: التنشيط + السحب + الإرجاع + PGT-A');
```

**للحصول على doctor_id الخاص بك:**
```sql
SELECT id, name, email FROM doctors WHERE user_role = 'doctor';
```

---

### الخطوة 3: دمج المكوّنات في واجهة المستخدم

#### في صفحة المريضة (PatientProfile):

```tsx
import { useState } from 'react';
import { InstallmentsTable } from './components/installments/InstallmentsTable';
import { StartCycleWithPackage } from './components/installments/StartCycleWithPackage';

export const PatientProfile = ({ patient }: { patient: any }) => {
  const [showStartCycle, setShowStartCycle] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  return (
    <div>
      {/* زر بدء دورة جديدة */}
      <button onClick={() => setShowStartCycle(true)}>
        بدء دورة حقن مجهري
      </button>

      {/* نافذة بدء الدورة */}
      {showStartCycle && (
        <StartCycleWithPackage
          patientId={patient.id}
          patientName={patient.name}
          onSuccess={(cycleId) => {
            setSelectedCycleId(cycleId);
            setShowStartCycle(false);
          }}
          onCancel={() => setShowStartCycle(false)}
        />
      )}

      {/* عرض جدول الأقساط */}
      {selectedCycleId && (
        <InstallmentsTable
          cycleId={selectedCycleId}
          patientId={patient.id}
          patientName={patient.name}
        />
      )}
    </div>
  );
};
```

---

## 📋 سيناريو الاستخدام الكامل

### **مثال: مدام سارة تدفع مقدم عملية الحقن**

#### 1. **فتح صفحة المريضة**
- تدخل السكرتيرة على صفحة "مدام سارة"
- تضغط زر "بدء دورة حقن مجهري"

#### 2. **اختيار الباقة**
- تظهر نافذة تحتوي على:
  - ✅ باقة الحقن المجهري القياسية (30,000 ج.م)
  - ✅ باقة الحقن المجهري المميزة (45,000 ج.م)
- تختار السكرتيرة "باقة القياسية"
- تظهر خطة الأقساط:
  - القسط 1: التنشيط (10,000 ج.م) - 33%
  - القسط 2: السحب (15,000 ج.م) - 50%
  - القسط 3: الإرجاع (5,000 ج.م) - 17%

#### 3. **إنشاء الدورة**
- تضغط "بدء الدورة"
- السيستم يُنشئ:
  - ✅ دورة IVF جديدة في جدول `ivf_cycles`
  - ✅ 3 أقساط تلقائية في جدول `installments`

#### 4. **عرض جدول الأقساط**
يظهر جدول يحتوي على:

| # | اسم القسط | المبلغ | المدفوع | المتبقي | الحالة | الإجراء |
|---|-----------|--------|---------|---------|--------|---------|
| 1 | التنشيط | 10,000 ج.م | 0 ج.م | 10,000 ج.م | 🟡 مستحق | [زر دفع] |
| 2 | السحب | 15,000 ج.م | 0 ج.م | 15,000 ج.م | ⏸️ مؤجل | - |
| 3 | الإرجاع | 5,000 ج.م | 0 ج.م | 5,000 ج.م | ⏸️ مؤجل | - |

#### 5. **دفع القسط الأول**
- السكرتيرة تضغط "دفع" بجوار القسط الأول (التنشيط)
- تختار طريقة الدفع: نقداً
- السيستم:
  - ✅ يسجل الدفعة في `installment_payments`
  - ✅ يحدث حالة القسط إلى "مدفوع"
  - ✅ يطبع إيصال فوري يحتوي على:
    - اسم المريضة
    - اسم القسط (التنشيط)
    - المبلغ (10,000 ج.م)
    - طريقة الدفع (نقداً)
    - التاريخ والوقت
    - رقم الإيصال

#### 6. **تحديث الحالة**
الجدول يتحدث تلقائياً:

| # | اسم القسط | المبلغ | المدفوع | المتبقي | الحالة |
|---|-----------|--------|---------|---------|--------|
| 1 | التنشيط | 10,000 ج.م | 10,000 ج.م | 0 ج.م | ✅ مدفوع |
| 2 | السحب | 15,000 ج.م | 0 ج.م | 15,000 ج.م | ⏸️ مؤجل |
| 3 | الإرجاع | 5,000 ج.م | 0 ج.م | 5,000 ج.م | ⏸️ مؤجل |

---

## 🎨 المميزات الإضافية

### 1. **تحديث حالة الأقساط عند الأحداث**
عند حدوث عملية السحب (OPU):
```typescript
await installmentsService.updateInstallmentStatusOnEvent(cycleId, 'opu');
```
- القسط الثاني يتحول من "مؤجل" إلى "مستحق"

### 2. **جلب الأقساط المستحقة (Dashboard)**
```typescript
const { data } = await installmentsService.getDueInstallmentsByPatient(patientId);
// عرض الأقساط المستحقة في لوحة التحكم
```

### 3. **ملخص إحصائي للأقساط**
```typescript
const { data } = await installmentsService.getInstallmentsSummary();
console.log(data);
// {
//   total_pending: 150,
//   total_due: 25,
//   total_paid: 320,
//   total_amount_due: 375000,
//   total_amount_paid: 2400000
// }
```

---

## 🔒 الأمان

### RLS Policies المطبقة:
- ✅ الطبيب يرى أقساطه فقط
- ✅ السكرتيرة ترى أقساط طبيبها المعيّن فقط
- ✅ السكرتيرة تستطيع الدفع (UPDATE) لكن لا تستطيع الحذف
- ✅ كل دفعة تُسجل في `installment_payments` للتدقيق

---

## 📊 التكامل مع الخزنة (Future)

عند الدفع، يمكنك إضافة تسجيل في جدول الخزنة:

```typescript
// في payInstallment() داخل installmentsService.ts
await supabase.from('cashbox').insert([{
  doctor_id: installment.doctor_id,
  patient_id: installment.patient_id,
  amount: paymentData.amount,
  type: 'income',
  category: 'ivf_installment',
  description: `دفعة ${installment.installment_name_ar} - ${patientName}`,
  payment_method: paymentData.payment_method,
  receipt_number: paymentData.receipt_number
}]);
```

---

## 🧪 اختبار النظام

### 1. اختبار إنشاء باقة:
```typescript
const result = await installmentsService.createPackage({
  doctor_id: 'your-doctor-id',
  package_name: 'Test Package',
  package_name_ar: 'باقة تجريبية',
  total_price: 50000,
  currency: 'EGP',
  is_active: true
});
console.log(result);
```

### 2. اختبار إنشاء أقساط:
```typescript
const result = await installmentsService.createInstallmentsForCycle(
  'cycle-id',
  'patient-id',
  'doctor-id',
  'package-id'
);
console.log(result);
```

### 3. اختبار جلب الأقساط:
```typescript
const { data } = await installmentsService.getInstallmentsByCycle('cycle-id');
console.log(data);
```

### 4. اختبار الدفع:
```typescript
const result = await installmentsService.payInstallment('installment-id', {
  amount: 10000,
  payment_method: 'cash',
  receipt_number: 'REC-12345',
  recorded_by: 'user-id'
});
console.log(result);
```

---

## 🎉 النتيجة النهائية

✅ **قاعدة بيانات محترفة** مع 3 جداول و RLS policies كاملة  
✅ **خدمة متكاملة** مع 12 وظيفة جاهزة  
✅ **واجهتين احترافيتين** (جدول الأقساط + نافذة بدء الدورة)  
✅ **طباعة إيصالات فورية** بعد كل دفعة  
✅ **تحديث تلقائي** لحالة الأقساط  
✅ **أمان كامل** مع RLS policies  

---

## 📞 الدعم

تم البرمجة والتطوير بواسطة:  
**د. محمد صلاح جبر - 2026**

لأي استفسارات أو تعديلات، تواصل معي! 🚀
