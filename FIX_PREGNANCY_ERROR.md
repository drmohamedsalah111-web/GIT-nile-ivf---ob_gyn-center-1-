# 🚨 حل مشكلة "Could not find the 'thromboprophylaxis_needed' column"

## المشكلة
الكود يحاول حفظ بيانات الحمل في عمود `thromboprophylaxis_needed`، لكن العمود في قاعدة البيانات اسمه `thromboprophylaxis` (أو غير موجود).

## ✅ الحل (خطوة واحدة)

### 1️⃣ شغل ملف [FIX_PREGNANCY_COLUMNS.sql](FIX_PREGNANCY_COLUMNS.sql)

1. افتح Supabase SQL Editor:
   ```
   https://app.supabase.com/project/purknrqalbkajufqfiqu/sql/new
   ```

2. انسخ محتوى ملف **`FIX_PREGNANCY_COLUMNS.sql`**

3. الصقه في SQL Editor واضغط **Run**

4. **Refresh المتصفح** (Ctrl+Shift+R)

---

## 🔍 ماذا يفعل هذا الملف؟
- يغير اسم العمود من `thromboprophylaxis` إلى `thromboprophylaxis_needed` ليطابق الكود
- يضيف أعمدة `aspirin_prescribed` و `progesterone_support` إذا كانت ناقصة

بعد هذه الخطوة، ستختفي رسالة الخطأ وسيتم حفظ ملف الحمل بنجاح. ✅
