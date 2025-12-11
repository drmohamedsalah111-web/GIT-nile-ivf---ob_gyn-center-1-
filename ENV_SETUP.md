# إعداد متغيرات البيئة

## ملف .env

قم بإنشاء ملف `.env` في المجلد الرئيسي للمشروع وأضف المتغيرات التالية:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# PowerSync Configuration
VITE_POWERSYNC_URL=https://6938cd7948645822f36663c8.powersync.journeyapps.com
```

## كيفية الحصول على القيم:

### Supabase:
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **Settings** > **API**
4. انسخ:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### PowerSync:
1. اذهب إلى [PowerSync Dashboard](https://app.powersync.com)
2. اختر instance الخاص بك
3. اذهب إلى **Settings** > **Instance URL**
4. انسخ الرابط → `VITE_POWERSYNC_URL`

## ملاحظات مهمة:

- ⚠️ **لا ترفع ملف `.env` إلى Git** - يحتوي على معلومات حساسة
- ✅ بعد إضافة المتغيرات، **أعد تشغيل سيرفر التطوير** (`npm run dev`)
- ✅ يمكنك التحقق من حالة الاتصال في **Settings > حالة الاتصال**

