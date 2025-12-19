# دليل تطبيق IVF Journey - خطوة بخطوة

## الخطوة 1: تطبيق قاعدة البيانات ✅

### 1.1 افتح Supabase SQL Editor

1. اذهب إلى [app.supabase.com](https://app.supabase.com)
2. اختر مشروعك
3. من القائمة الجانبية: **SQL Editor** → **New Query**

### 1.2 نفذ السكريبت

1. افتح ملف [`IVF_JOURNEY_SCHEMA.sql`](file:///d:/GitHub/New%20folder/GIT-nile-ivf---ob_gyn-center-1-/IVF_JOURNEY_SCHEMA.sql)
2. انسخ **المحتوى بالكامل**
3. الصقه في SQL Editor
4. اضغط **"Run"** أو **Ctrl+Enter**

### 1.3 تحقق من النجاح

يجب أن ترى في النتائج:
```
✅ IVF Journey Database Schema Created Successfully
tables_created: 9
```

### 1.4 تحقق من الجداول

نفذ هذا الاستعلام للتأكد:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'ivf_cycles', 'cycle_assessment', 'stimulation_protocol',
    'monitoring_visits', 'oocyte_retrieval', 'fertilization',
    'embryo_development', 'embryo_transfer', 'cycle_outcome'
  )
ORDER BY table_name;
```

يجب أن ترى **9 جداول**.

---

## الخطوة 2: إنشاء مكونات Frontend

سأقوم بإنشاء المكونات بالترتيب التالي:

### 2.1 المكونات الأساسية
- [x] `ivfCycleService.ts` - خدمة Backend ✅
- [ ] `CycleTimeline.tsx` - خط زمني للدورة
- [ ] `CycleDashboard.tsx` - لوحة التحكم الرئيسية

### 2.2 مكونات المراحل
- [ ] `AssessmentForm.tsx` - نموذج التقييم
- [ ] `ProtocolSelector.tsx` - اختيار البروتوكول
- [ ] `MonitoringDashboard.tsx` - لوحة المتابعة
- [ ] `OPURecorder.tsx` - تسجيل سحب البويضات
- [ ] `EmbryologyLab.tsx` - معمل الأجنة
- [ ] `TransferPlanner.tsx` - تخطيط النقل
- [ ] `OutcomeRecorder.tsx` - تسجيل النتائج

### 2.3 إعادة بناء IvfJourney.tsx
- [ ] دمج المكونات الجديدة
- [ ] استخدام الخدمات الجديدة
- [ ] تحسين واجهة المستخدم

---

## الخطوة 3: الاختبار

### 3.1 اختبار قاعدة البيانات
- [ ] إنشاء دورة تجريبية
- [ ] إضافة بيانات لكل مرحلة
- [ ] التحقق من العلاقات

### 3.2 اختبار Frontend
- [ ] اختبار كل مكون على حدة
- [ ] اختبار التكامل
- [ ] اختبار تجربة المستخدم

### 3.3 اختبار شامل
- [ ] سيناريو كامل من البداية للنهاية
- [ ] اختبار الأداء
- [ ] اختبار الأمان (RLS)

---

## الملفات الجاهزة

✅ [`IVF_JOURNEY_SCHEMA.sql`](file:///d:/GitHub/New%20folder/GIT-nile-ivf---ob_gyn-center-1-/IVF_JOURNEY_SCHEMA.sql)
✅ [`services/ivfCycleService.ts`](file:///d:/GitHub/New%20folder/GIT-nile-ivf---ob_gyn-center-1-/services/ivfCycleService.ts)

## الملفات القادمة

⏳ `components/ivf/CycleTimeline.tsx`
⏳ `components/ivf/CycleDashboard.tsx`
⏳ `components/ivf/AssessmentForm.tsx`
⏳ ... والمزيد
