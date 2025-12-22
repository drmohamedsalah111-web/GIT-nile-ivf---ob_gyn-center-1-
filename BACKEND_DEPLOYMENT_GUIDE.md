# 🏗️ دليل بناء Backend احترافي من الصفر

## 📋 نظرة عامة

هذا الدليل سيساعدك على بناء Backend احترافي كامل لنظام إدارة عيادات الحقن المجهري متوافق تماماً مع Frontend الموجود.

---

## 🚀 خطوات التنفيذ

### المرحلة 1️⃣: تنظيف القاعدة القديمة

1. **افتح Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/ladqitwqkkfiijregqlu
   ```

2. **اذهب إلى SQL Editor**
   - من القائمة الجانبية → SQL Editor
   - اضغط **+ New query**

3. **انسخ والصق كل محتوى الملف:**
   [`DATABASE_FRESH_BUILD.sql`](DATABASE_FRESH_BUILD.sql)

4. **شغّل الكود**
   - اضغط **Run** أو `Ctrl+Enter`
   - انتظر حتى ينتهي التنفيذ (حوالي 10-15 ثانية)

5. **تأكد من النجاح**
   - يجب أن ترى: `✅ تم بناء قاعدة البيانات بنجاح!`

---

### المرحلة 2️⃣: إضافة سجل الطبيب

بعد بناء القاعدة، أضف سجل طبيبك:

```sql
-- أضف هذا في SQL Editor جديد
INSERT INTO doctors (id, user_id, email, name, created_at, updated_at)
VALUES (
    '8014e2f1-02a2-4045-aea0-341dc19c4d2c',
    'efbfbed7-401d-449f-8759-6a707a358dd5',
    'dr.mohamed.salah.gabr@gmail.com',
    'د. محمد صلاح جبر',
    NOW(),
    NOW()
);

-- تحقق من النجاح
SELECT * FROM doctors WHERE id = '8014e2f1-02a2-4045-aea0-341dc19c4d2c';
```

---

### المرحلة 3️⃣: اختبار Frontend

1. **افتح تطبيقك**
   ```
   http://localhost:5173
   ```

2. **سجل دخول**
   - Email: `dr.mohamed.salah.gabr@gmail.com`
   - كلمة السر الخاصة بك

3. **اختبر الوظائف:**
   - ✅ عرض Dashboard
   - ✅ إضافة مريضة جديدة
   - ✅ إنشاء دورة IVF
   - ✅ حجز موعد

---

## 📊 هيكل قاعدة البيانات الجديدة

### الجداول الأساسية:

| الجدول | الوصف |
|--------|------|
| `profiles` | ملفات المستخدمين (مربوط مع Supabase Auth) |
| `doctors` | بيانات الأطباء |
| `patients` | بيانات المريضات |
| `appointments` | المواعيد |
| `ivf_cycles` | دورات الحقن المجهري |
| `stimulation_logs` | سجلات التنشيط |
| `pregnancies` | متابعة الحمل |
| `lab_results` | نتائج التحاليل |
| `infertility_workups` | تقييم العقم |
| `patient_documents` | مستندات المريضات |

### العلاقات بين الجداول:

```
auth.users (Supabase)
    ↓
doctors (user_id → auth.users.id)
    ↓
patients (doctor_id → doctors.id)
    ↓
├── ivf_cycles (patient_id, doctor_id)
│   └── stimulation_logs (cycle_id)
├── appointments (patient_id, doctor_id)
├── pregnancies (patient_id, doctor_id)
├── lab_results (patient_id, doctor_id)
└── patient_documents (patient_id, doctor_id)
```

---

## 🔒 Row Level Security (RLS)

جميع الجداول محمية بـ RLS:

- ✅ **Doctors**: يقدر يشوف ويعدل بياناته فقط
- ✅ **Patients**: كل دكتور يشوف مرضاه فقط
- ✅ **IVF Cycles**: كل دكتور يشوف دورات مرضاه فقط
- ✅ **Appointments**: كل دكتور يشوف مواعيده فقط
- ✅ **باقي الجداول**: نفس المنطق

---

## 🎯 مميزات Backend الجديد

### ✅ تصميم احترافي
- Schema نظيف ومنظم
- Foreign Keys صحيحة
- Indexes للأداء
- Cascading deletes

### ✅ أمان عالي
- Row Level Security على كل الجداول
- كل دكتور يشوف بياناته فقط
- محمي من SQL Injection

### ✅ متوافق مع Frontend
- نفس أسماء الجداول والأعمدة
- نفس types المتوقعة
- JSONB للبيانات المرنة

### ✅ قابل للتوسع
- سهل إضافة جداول جديدة
- JSONB للبيانات الديناميكية
- Triggers للـ updated_at

---

## 🔧 استكشاف الأخطاء

### المشكلة: "Auth session missing"
**الحل:**
```sql
-- تأكد من وجود سجل الطبيب
SELECT * FROM doctors WHERE user_id = auth.uid();
```

### المشكلة: "Foreign key violation"
**الحل:**
```sql
-- تأكد من وجود الـ doctor_id في جدول doctors
SELECT * FROM doctors WHERE id = 'YOUR_DOCTOR_ID';
```

### المشكلة: "Permission denied"
**الحل:**
```sql
-- تحقق من RLS policies
SELECT * FROM pg_policies WHERE tablename = 'patients';
```

---

## 📝 الخطوات التالية

بعد بناء Backend:

1. ✅ **اختبر كل الوظائف في Frontend**
2. ✅ **أضف بيانات تجريبية**
3. ✅ **راجع RLS policies**
4. ✅ **اعمل Backup للقاعدة**

---

## 💡 نصائح مهمة

### للحفاظ على القاعدة نظيفة:

1. **لا تعدل Schema من خارج SQL Editor**
2. **استخدم Migrations للتعديلات الجديدة**
3. **اعمل Backup قبل أي تغيير كبير**
4. **راجع RLS policies دورياً**

### للأداء الأفضل:

1. **استخدم Indexes على الأعمدة المستخدمة في WHERE**
2. **استخدم JSONB بحكمة (مش لكل حاجة)**
3. **راقب Query Performance من Dashboard**
4. **استخدم Pagination للبيانات الكبيرة**

---

## 🆘 الدعم

إذا واجهت أي مشكلة:

1. شغّل هذا Query للتشخيص:
```sql
-- عرض جميع الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- عرض جميع Foreign Keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

2. تحقق من Supabase Logs
3. شارك رسالة الخطأ الكاملة

---

## ✅ تم!

الآن عندك Backend احترافي جاهز للاستخدام! 🚀

**جرب إنشاء دورة IVF جديدة - يجب أن تشتغل بدون مشاكل**
