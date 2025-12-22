# 🏥 دليل بناء Supabase من الصفر - Nile IVF & OB/GYN Center

## 📋 المتطلبات

1. حساب على [Supabase](https://supabase.com)
2. مشروع جديد على Supabase

---

## 🚀 الخطوة 1: إنشاء مشروع Supabase جديد

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط على **New Project**
3. اختر Organization
4. أدخل بيانات المشروع:
   - **Name**: `nile-ivf-center` (أو أي اسم تفضله)
   - **Database Password**: اختر كلمة سر قوية واحفظها
   - **Region**: اختر أقرب منطقة (مثل `eu-central-1` لأوروبا)
5. اضغط **Create new project**
6. انتظر حتى يكتمل إنشاء المشروع (دقيقة أو اثنتين)

---

## 🔑 الخطوة 2: الحصول على مفاتيح API

1. اذهب إلى **Settings** > **API**
2. انسخ القيم التالية:

```
Project URL: https://xxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIs...
service_role key: eyJhbGciOiJIUzI1NiIs... (اختياري، للـ Admin)
```

3. حدّث ملف `.env` في المشروع:

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
```

---

## 🗄️ الخطوة 3: بناء قاعدة البيانات

### الطريقة 1: تشغيل السكربت الكامل (موصى به)

1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. افتح ملف `COMPLETE_SUPABASE_BUILD.sql`
3. انسخ كل المحتوى
4. الصقه في SQL Editor
5. اضغط **Run**

### الطريقة 2: تشغيل خطوة بخطوة

إذا واجهت أخطاء، شغل الملفات بالترتيب:

1. `DATABASE_FRESH_BUILD.sql` - الجداول الأساسية
2. `OBSTETRICS_SETUP.sql` - جداول متابعة الحمل
3. `SECRETARY_SETUP.sql` - نظام السكرتارية
4. `SUPABASE_SETUP.sql` - إعدادات إضافية

---

## 📦 الخطوة 4: إنشاء Storage Buckets

1. اذهب إلى **Storage** في Supabase Dashboard
2. اضغط **New bucket** وأنشئ:

### Bucket 1: doctor-files
- **Name**: `doctor-files`
- **Public**: ✅ نعم
- للصور: صورة الطبيب، شعار العيادة

### Bucket 2: patient-documents
- **Name**: `patient-documents`
- **Public**: ❌ لا
- لمستندات المرضى والتقارير

### Bucket 3: ultrasound-images
- **Name**: `ultrasound-images`
- **Public**: ❌ لا
- لصور السونار

---

## 👤 الخطوة 5: تفعيل المصادقة (Authentication)

1. اذهب إلى **Authentication** > **Providers**
2. تأكد من تفعيل **Email**
3. (اختياري) فعّل **Google** للتسجيل بـ Google

### إعدادات Email:
- **Enable email confirmations**: حسب رغبتك
- **Secure email change**: ✅ نعم

---

## 🧪 الخطوة 6: اختبار الاتصال

### في Terminal المشروع:

```bash
npm run dev
```

### أو شغل هذا السكربت للتحقق:

```javascript
// test-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

async function test() {
  const { data, error } = await supabase
    .from('doctors')
    .select('count')
  
  if (error) {
    console.error('❌ خطأ:', error.message)
  } else {
    console.log('✅ الاتصال ناجح!')
  }
}

test()
```

---

## 📊 الجداول المُنشأة

| الجدول | الوصف |
|--------|-------|
| `profiles` | ملفات المستخدمين |
| `doctors` | بيانات الأطباء والسكرتارية |
| `patients` | بيانات المرضى |
| `appointments` | المواعيد |
| `ivf_cycles` | دورات الحقن المجهري |
| `stimulation_logs` | سجلات التنشيط |
| `pregnancies` | متابعة الحمل |
| `antenatal_visits` | زيارات ما قبل الولادة |
| `biometry_scans` | قياسات الجنين |
| `lab_results` | نتائج التحاليل |
| `infertility_workups` | ملفات العقم |
| `patient_documents` | مستندات المرضى |

---

## 🔒 نظام الأمان (RLS)

كل الجداول محمية بـ Row Level Security:
- الطبيب يرى مرضاه فقط
- السكرتير يرى مرضى طبيبه فقط
- لا يمكن الوصول لبيانات أطباء آخرين

---

## ❗ حل المشاكل الشائعة

### 1. خطأ "permission denied"
```sql
-- شغل هذا في SQL Editor:
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### 2. خطأ "relation does not exist"
- تأكد من تشغيل `COMPLETE_SUPABASE_BUILD.sql` بالكامل

### 3. خطأ في RLS
```sql
-- لتعطيل RLS مؤقتاً للتجربة:
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- لإعادة تفعيله:
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
```

### 4. مشكلة في Storage
- تأكد من إنشاء الـ Buckets
- تحقق من Policies في Storage

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع Supabase Logs في Dashboard
2. تحقق من Console في المتصفح
3. راجع ملف `SYNC_DIAGNOSTICS.md`

---

## ✅ تم!

مبروك! قاعدة البيانات جاهزة 🎉

الخطوة التالية: سجل أول مستخدم من خلال التطبيق
