# 🚀 البدء السريع - نظام المواعيد الذكي
## Quick Start Guide

---

## خطوة 1: تشغيل SQL في Supabase ⚡

1. افتح **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. افتح الملف [SMART_APPOINTMENT_SETUP.sql](./SMART_APPOINTMENT_SETUP.sql)
4. انسخ المحتوى والصقه في SQL Editor
5. اضغط **Run** أو `Ctrl + Enter`

✅ **التحقق**: شغّل هذا الأمر للتأكد:
```sql
SELECT COUNT(*) FROM appointments;
SELECT * FROM get_appointment_stats('doctor-id-here', CURRENT_DATE, CURRENT_DATE);
```

---

## خطوة 2: استخدام المكون في كودك 💻

### في لوحة الطبيب:

```tsx
// في DoctorDashboard.tsx
import SmartAppointmentSystem from '../components/appointments/SmartAppointmentSystem';

// داخل المكون
<SmartAppointmentSystem
  doctorId={doctorId}
  userRole="doctor"
  onAppointmentClick={(appointment) => {
    console.log('Clicked:', appointment);
    // افتح ملف المريض أو تفاصيل الموعد
  }}
/>
```

### في لوحة السكرتير:

```tsx
// في SecretaryDashboard.tsx
import SmartAppointmentSystem from '../components/appointments/SmartAppointmentSystem';

// داخل المكون
<SmartAppointmentSystem
  doctorId={linkedDoctorId}
  userRole="secretary"
  onAppointmentClick={(appointment) => {
    // معالجة النقرة
  }}
/>
```

---

## خطوة 3: استخدام الخدمات (اختياري) 🔧

```tsx
import { smartAppointmentService } from '../services/smartAppointmentService';

// حجز موعد جديد
const result = await smartAppointmentService.createAppointment({
  patient_id: 'patient-uuid',
  doctor_id: 'doctor-uuid',
  appointment_date: '2026-01-10',
  appointment_time: '10:00',
  visit_type: 'consultation',
  priority: 'normal'
});

// تحديث حالة موعد
await smartAppointmentService.markAsWaiting('appointment-id');
await smartAppointmentService.markAsCompleted('appointment-id');

// الحصول على مواعيد اليوم
const { data } = await smartAppointmentService.getTodayAppointments(doctorId);

// الحصول على قائمة الانتظار
const { data: queue } = await smartAppointmentService.getWaitingQueue(doctorId);
```

---

## الميزات الرئيسية 🌟

### ✅ ما يمكن فعله:

1. **للطبيب والسكرتير**:
   - ✅ إضافة موعد جديد
   - ✅ تعديل المواعيد
   - ✅ حذف المواعيد
   - ✅ تغيير الحالة بسرعة
   - ✅ البحث والتصفية

2. **عرض المواعيد**:
   - 📅 **عرض يوم**: Timeline من 8 صباحاً - 8 مساءً
   - 📊 **عرض Grid**: بطاقات منظمة
   - 📝 **عرض قائمة**: قائمة مدمجة
   - 📆 **أسبوع/شهر**: قريباً

3. **حالات الموعد**:
   - 🔵 محجوز (Scheduled)
   - 🟡 انتظار (Waiting)
   - 🟣 جاري (In Progress)
   - 🟢 مكتمل (Completed)
   - 🔴 ملغي (Cancelled)
   - ⚪ لم يحضر (No Show)

4. **الأولويات**:
   - 📋 عادي (Normal)
   - 🚨 عاجل (Urgent)
   - 🔄 متابعة (Follow-up)

---

## اختبار سريع 🧪

### 1. اختبر حجز موعد:
```tsx
// في Developer Console
smartAppointmentService.createAppointment({
  patient_id: 'test-patient-id',
  doctor_id: 'test-doctor-id',
  appointment_date: '2026-01-10',
  appointment_time: '10:00',
  visit_type: 'consultation'
}).then(result => console.log(result));
```

### 2. اختبر الحصول على المواعيد:
```tsx
smartAppointmentService.getTodayAppointments('doctor-id')
  .then(result => console.log('Today:', result.data));
```

### 3. اختبر الإحصائيات:
```sql
-- في SQL Editor
SELECT * FROM get_appointment_stats(
  'doctor-id-here',
  CURRENT_DATE,
  CURRENT_DATE
);
```

---

## استكشاف الأخطاء 🔍

### المشكلة: المواعيد لا تظهر
**الحل**:
```sql
-- تحقق من RLS
SELECT * FROM appointments WHERE doctor_id = 'your-doctor-id';

-- تحقق من الصلاحيات
SELECT * FROM doctors WHERE user_id = auth.uid();
```

### المشكلة: خطأ في الإضافة
**الحل**:
- تأكد من وجود المريض في جدول `patients`
- تأكد من صحة `doctor_id`
- تحقق من صيغة التاريخ والوقت

### المشكلة: التحديث التلقائي لا يعمل
**الحل**:
```tsx
// تأكد من Subscription
useEffect(() => {
  const channel = smartAppointmentService.subscribeToAppointments(
    doctorId,
    () => loadAppointments()
  );
  
  return () => smartAppointmentService.unsubscribe(channel);
}, [doctorId]);
```

---

## نصائح مهمة 💡

1. **استخدم Timeline للعيادة المزدحمة**
   - يعطي نظرة شاملة على اليوم
   - سهل رؤية الأوقات الفارغة

2. **استخدم الأولويات**
   - 🚨 عاجل: للحالات الطارئة
   - 🔄 متابعة: للمرضى الدوريين

3. **استخدم البحث السريع**
   - ابحث بالاسم أو رقم الهاتف
   - اضغط `Ctrl + F` للبحث السريع

4. **استخدم التصفية**
   - عرض المواعيد المحجوزة فقط
   - عرض من في الانتظار

---

## الخطوات التالية 🎯

### الآن:
1. ✅ شغّل SQL
2. ✅ أضف المكون لصفحتك
3. ✅ اختبر النظام

### لاحقاً:
- [ ] إضافة تذكيرات SMS
- [ ] تكامل مع Google Calendar
- [ ] تطبيق جوال للمرضى

---

## روابط مفيدة 📚

- [دليل كامل](./SMART_APPOINTMENT_GUIDE.md)
- [أمثلة الكود](./SMART_APPOINTMENT_EXAMPLES.tsx)
- [ملف SQL](./SMART_APPOINTMENT_SETUP.sql)
- [المكون](./components/appointments/SmartAppointmentSystem.tsx)
- [الخدمات](./services/smartAppointmentService.ts)

---

## دعم 📞

إذا واجهت مشكلة:
1. راجع **Console Logs** في المتصفح
2. تحقق من **Supabase Logs**
3. راجع `appointment_audit_log` في قاعدة البيانات

---

**جاهز للانطلاق! 🚀**
