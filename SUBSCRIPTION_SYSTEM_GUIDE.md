# 🎯 دليل نظام الاشتراكات الكامل
## Subscription System Complete Guide

---

## 📋 المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [خطوات التنفيذ](#خطوات-التنفيذ)
3. [سيناريو التسجيل للطبيب الجديد](#سيناريو-التسجيل-للطبيب-الجديد)
4. [إدارة الاشتراكات للمسؤول](#إدارة-الاشتراكات-للمسؤول)
5. [الباقات المتاحة](#الباقات-المتاحة)
6. [API Reference](#api-reference)

---

## 🎯 نظرة عامة

تم تطوير نظام اشتراكات متكامل يسمح للأطباء بالتسجيل واختيار الباقة المناسبة والبدء في استخدام النظام.

### ✨ المميزات الرئيسية:

- ✅ تسجيل سهل خطوة بخطوة
- ✅ 4 باقات مختلفة (تجريبية، أساسية، احترافية، مؤسسية)
- ✅ فترة تجريبية مجانية
- ✅ إدارة حدود الاستخدام (عدد المريضات، المستخدمين)
- ✅ تتبع المدفوعات والاشتراكات
- ✅ إشعارات قبل انتهاء الاشتراك

---

## 🚀 خطوات التنفيذ

### 1️⃣ إنشاء قاعدة البيانات

```bash
# في Supabase SQL Editor
# قم بتشغيل ملف: SUBSCRIPTION_SYSTEM_SETUP.sql
```

هذا الملف يقوم بـ:
- إنشاء 4 جداول رئيسية
- إضافة Indexes للأداء
- تفعيل RLS Policies
- إدراج 4 باقات افتراضية
- إنشاء Functions مساعدة
- إنشاء Views للتقارير

### 2️⃣ الملفات المُنشأة

#### أ. Backend (Database)
- `SUBSCRIPTION_SYSTEM_SETUP.sql` - جداول وإعدادات قاعدة البيانات

#### ب. Frontend (React)
- `src/pages/Auth/DoctorRegistration.tsx` - صفحة تسجيل الأطباء
- `src/pages/Auth/SubscriptionPending.tsx` - صفحة انتظار التفعيل
- `services/subscriptionService.ts` - وظائف الاشتراكات (موجود مسبقاً)

#### ج. Routes
- `src/App.tsx` - تم إضافة المسارات الجديدة

---

## 👨‍⚕️ سيناريو التسجيل للطبيب الجديد

### الخطوة 1: البيانات الشخصية
الطبيب يدخل على `/register` ويملأ:
- الاسم الكامل
- البريد الإلكتروني
- رقم الهاتف
- كلمة المرور

### الخطوة 2: بيانات العيادة
- اسم العيادة (إنجليزي/عربي)
- العنوان والمدينة
- رقم الترخيص

### الخطوة 3: اختيار الباقة
الطبيب يختار من بين 4 باقات:

| الباقة | السعر | المدة | المريضات | المستخدمين | الحقن المجهري |
|--------|-------|-------|----------|------------|---------------|
| تجريبية | مجاناً | 14 يوم | 50 | 1 | ✅ |
| أساسية | 499 ج.م | 30 يوم | 100 | 1 | ❌ |
| احترافية | 999 ج.م | 30 يوم | 500 | 3 | ✅ |
| مؤسسية | 1999 ج.م | 30 يوم | ∞ | 10 | ✅ |

### الخطوة 4: الدفع
- اختيار طريقة الدفع (تحويل بنكي، فودافون كاش، إلخ)
- إدخال رقم العملية (اختياري)

### النتيجة:
- ✅ **باقة مجانية**: دخول مباشر للنظام
- ⏳ **باقة مدفوعة**: انتقال لصفحة انتظار التفعيل

---

## 🔧 إدارة الاشتراكات للمسؤول (Admin)

### عرض الطلبات المعلقة

```sql
-- الاشتراكات في انتظار التفعيل
SELECT 
    cs.id,
    d.full_name as doctor_name,
    d.email,
    d.phone,
    sp.name_ar as plan_name,
    cs.amount_paid,
    cs.payment_method,
    cs.payment_reference,
    cs.created_at
FROM clinic_subscriptions cs
JOIN doctors d ON cs.clinic_id = d.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.status = 'pending'
ORDER BY cs.created_at DESC;
```

### تفعيل اشتراك

```sql
-- تفعيل اشتراك بعد تأكيد الدفع
UPDATE clinic_subscriptions
SET 
    status = 'active',
    payment_status = 'paid',
    updated_at = NOW()
WHERE id = 'SUBSCRIPTION_ID_HERE';
```

### رفض اشتراك

```sql
-- رفض اشتراك
UPDATE clinic_subscriptions
SET 
    status = 'cancelled',
    payment_status = 'failed',
    cancellation_reason = 'Payment not verified',
    cancelled_at = NOW()
WHERE id = 'SUBSCRIPTION_ID_HERE';
```

---

## 📊 الباقات المتاحة

### 🆓 باقة تجريبية (Trial)
```json
{
  "السعر": 0,
  "المدة": "14 يوم",
  "المريضات": 50,
  "المستخدمين": 1,
  "المميزات": {
    "appointments": true,
    "prescriptions": true,
    "lab_tests": true,
    "ultrasound": true,
    "ivf": true,
    "reports": true,
    "support": "email",
    "storage_gb": 5
  }
}
```

### 💼 باقة أساسية (Basic)
```json
{
  "السعر": "499 ج.م",
  "المدة": "30 يوم",
  "المريضات": 100,
  "المستخدمين": 1,
  "المميزات": {
    "appointments": true,
    "prescriptions": true,
    "lab_tests": true,
    "ultrasound": true,
    "ivf": false,
    "reports": "basic",
    "support": "email",
    "storage_gb": 10
  }
}
```

### 🚀 باقة احترافية (Professional)
```json
{
  "السعر": "999 ج.م",
  "المدة": "30 يوم",
  "المريضات": 500,
  "المستخدمين": 3,
  "المميزات": {
    "appointments": true,
    "prescriptions": true,
    "lab_tests": true,
    "ultrasound": true,
    "ivf": true,
    "reports": "advanced",
    "support": "priority",
    "storage_gb": 50,
    "multi_branch": true
  }
}
```

### 🏆 باقة مؤسسية (Enterprise)
```json
{
  "السعر": "1999 ج.م",
  "المدة": "30 يوم",
  "المريضات": "غير محدود",
  "المستخدمين": 10,
  "المميزات": {
    "appointments": true,
    "prescriptions": true,
    "lab_tests": true,
    "ultrasound": true,
    "ivf": true,
    "reports": "custom",
    "support": "24/7",
    "storage_gb": "unlimited",
    "multi_branch": true,
    "api_access": true,
    "custom_branding": true,
    "dedicated_support": true
  }
}
```

---

## 🔌 API Reference

### التحقق من حالة الاشتراك

```typescript
import { subscriptionService } from './services/subscriptionService';

// التحقق من الاشتراك النشط
const status = await subscriptionService.checkSubscription(clinicId);

if (status.isActive) {
  console.log(`أيام متبقية: ${status.daysRemaining}`);
  console.log(`الباقة: ${status.plan.name_ar}`);
}
```

### التحقق من حد المريضات

```typescript
const patientLimit = await subscriptionService.checkPatientLimit(clinicId);

if (!patientLimit.canAdd) {
  alert(patientLimit.message);
  // "لقد وصلت للحد الأقصى من المريضات. يرجى ترقية الباقة."
}
```

### التحقق من الوصول لميزة

```typescript
const canUseIVF = await subscriptionService.canAccessFeature(clinicId, 'ivf');

if (canUseIVF) {
  // السماح بالوصول لوحدة الحقن المجهري
}
```

### تجديد الاشتراك

```typescript
const result = await subscriptionService.renewSubscription(
  clinicId,
  newPlanId,
  'bank_transfer',
  'REF-12345'
);

if (result.success) {
  toast.success('تم تجديد الاشتراك بنجاح');
}
```

---

## 📈 تقارير مفيدة

### الاشتراكات النشطة

```sql
SELECT * FROM active_subscriptions;
```

### الاشتراكات القريبة من الانتهاء (خلال 7 أيام)

```sql
SELECT * FROM expiring_soon_subscriptions;
```

### إحصائيات الاشتراكات

```sql
-- عدد الاشتراكات حسب الحالة
SELECT status, COUNT(*) as count
FROM clinic_subscriptions
GROUP BY status;

-- الإيرادات الشهرية
SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(amount_paid) as revenue
FROM subscription_payments
WHERE payment_status = 'paid'
GROUP BY month
ORDER BY month DESC;
```

---

## 🔔 إشعارات تلقائية (تحتاج Edge Functions)

### إنشاء Edge Function لتحديث الاشتراكات المنتهية

```typescript
// supabase/functions/update-expired-subscriptions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // تحديث الاشتراكات المنتهية
  const { data, error } = await supabase.rpc('update_expired_subscriptions');

  return new Response(
    JSON.stringify({ success: !error }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

---

## 🎨 تخصيص الباقات

يمكنك تعديل الباقات عن طريق:

```sql
-- إضافة باقة جديدة
INSERT INTO subscription_plans (
  name, name_ar, description, description_ar, 
  price, duration_days, max_patients, max_users, 
  features, is_active, trial_days, sort_order
) VALUES (
  'Premium', 'متميزة',
  'Premium plan for large clinics', 'باقة متميزة للعيادات الكبيرة',
  1499, 30, 1000, 5,
  '{"ivf": true, "support": "24/7", "storage_gb": 100}'::jsonb,
  true, 7, 5
);

-- تعديل سعر باقة
UPDATE subscription_plans
SET price = 599, updated_at = NOW()
WHERE name = 'Basic';

-- إيقاف باقة
UPDATE subscription_plans
SET is_active = false, updated_at = NOW()
WHERE name = 'Trial';
```

---

## ✅ Checklist للتنفيذ

- [x] إنشاء جداول قاعدة البيانات
- [x] إنشاء صفحة التسجيل
- [x] إنشاء صفحة انتظار التفعيل
- [x] إضافة Routes
- [ ] إنشاء لوحة تحكم Admin لإدارة الاشتراكات
- [ ] إضافة Edge Functions للإشعارات
- [ ] إنشاء صفحة تجديد الاشتراك
- [ ] إضافة Middleware للتحقق من الاشتراك في كل صفحة
- [ ] إنشاء صفحة الفواتير والمدفوعات

---

## 🆘 استكشاف الأخطاء

### مشكلة: الطبيب لا يستطيع التسجيل

**الحل:**
1. تأكد من تشغيل ملف SQL في Supabase
2. تأكد من تفعيل RLS Policies
3. تحقق من صلاحيات جدول `doctors`

### مشكلة: الاشتراك لا يتم تفعيله تلقائياً للباقات المجانية

**الحل:**
```typescript
// في DoctorRegistration.tsx
status: selectedPlan.price === 0 ? 'active' : 'pending',
payment_status: selectedPlan.price === 0 ? 'paid' : 'pending',
```

### مشكلة: عدم ظهور الباقات

**الحل:**
```sql
-- تأكد من وجود باقات نشطة
SELECT * FROM subscription_plans WHERE is_active = true;
```

---

## 📞 الدعم الفني

للمساعدة أو الاستفسارات:
- 📧 Email: support@clinic.com
- 📱 Phone: 01234567890
- 💬 WhatsApp: [رابط واتساب]

---

## 📝 ملاحظات مهمة

1. **الأسعار قابلة للتعديل** حسب السوق المستهدف
2. **المدة الافتراضية** للباقات 30 يوم (يمكن جعلها شهرية أو سنوية)
3. **الفترة التجريبية** 7-14 يوم حسب الباقة
4. **طرق الدفع** يمكن إضافة بوابات دفع إلكترونية (Fawry, Paymob, إلخ)
5. **الإشعارات** يُفضل إعداد Edge Functions للإشعارات التلقائية

---

## 🚀 الخطوات التالية المقترحة

1. **لوحة تحكم Admin** لإدارة الاشتراكات والمدفوعات
2. **نظام الخصومات والكوبونات** (Promo Codes)
3. **الفواتير التلقائية** (PDF Invoices)
4. **تكامل بوابات الدفع** (Stripe, Paymob)
5. **تقارير مالية متقدمة**
6. **نظام الإحالة** (Referral System)

---

تم إنشاء النظام بنجاح! 🎉
