# حل مشكلة عدم ظهور وقت الموعد
## Problem: "لم يحدد موعد" appears despite secretary selecting time

## الخطوات لحل المشكلة:

### 1. التحقق من قاعدة البيانات
افتح **Supabase Dashboard** → **SQL Editor** ونفذ الاستعلام التالي:

```sql
-- التحقق من وجود عمود appointment_time
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND column_name = 'appointment_time';
```

**إذا كان العمود غير موجود**، نفذ:
```sql
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_time TEXT;
```

### 2. فحص البيانات الموجودة
```sql
-- عرض آخر 10 مواعيد
SELECT 
  id,
  appointment_date,
  appointment_time,
  status,
  patient_id,
  doctor_id,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 10;
```

### 3. تحديث المواعيد الموجودة (إذا كان appointment_time فارغ)
```sql
-- تحديث المواعيد القديمة التي ليس لها وقت
UPDATE appointments 
SET appointment_time = '09:00'
WHERE appointment_time IS NULL 
  AND appointment_date >= CURRENT_DATE;
```

### 4. فحص Console في المتصفح
بعد حفظ الكود الجديد، افتح **Developer Tools** (F12) وانظر إلى **Console** بعد:
- إنشاء موعد جديد - ستظهر رسالة: `📅 Creating appointment with:` و `✅ Appointment created successfully:`
- تحميل قائمة المواعيد - ستظهر رسالة: `⏰ Appointment times:`

### 5. التحقق من سياسات RLS
```sql
-- التحقق من أن السكرتيرة لها صلاحيات INSERT
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'appointments'
  AND policyname LIKE '%secretary%'
  AND cmd = 'INSERT';
```

### ما تم تعديله في الكود:
1. ✅ أضفنا console.log عند إنشاء موعد جديد لمعرفة البيانات المُرسلة
2. ✅ أضفنا console.log عند تحميل المواعيد لمعرفة البيانات المُستلمة
3. ✅ أضفنا console.log يعرض أوقات المواعيد بشكل منفصل
4. ✅ الكود يُرسل `appointment_time` بشكل صحيح في السطر 190-191
5. ✅ الكود يعرض الوقت بشكل صحيح في السطور 407-414

### المشكلة المحتملة:
- **العمود غير موجود في قاعدة البيانات** ← نفذ الخطوة 1
- **البيانات القديمة لا تحتوي على وقت** ← نفذ الخطوة 3
- **سياسات RLS تمنع الحفظ** ← راجع الخطوة 5

### الحل السريع:
نفذ الملف الذي أنشأته: `FIX_APPOINTMENT_TIME_COLUMN.sql` في Supabase SQL Editor
