// 🛠️ سكربت فحص الصلاحيات - انسخ هذا الكود وضعه في كونسول المتصفح (F12 -> Console)
// 🛠️ Role Check Script - Copy and paste this into Browser Console

(async () => {
    console.clear();
    console.log('%c🔍 جاري فحص الصلاحيات...', 'color: #00bcd4; font-size: 16px; font-weight: bold;');

    // 1. Check Supabase Client
    // Note: We assume 'supabase' might be available globally if exposed, 
    // but usually in React apps it's not. 
    // However, we can try to fetch the session from LocalStorage.
    
    const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!sbKey) {
        console.error('❌ لم يتم العثور على جلسة تسجيل دخول. يرجى تسجيل الدخول أولاً.');
        return;
    }

    const session = JSON.parse(localStorage.getItem(sbKey));
    const user = session.user;
    const token = session.access_token;

    console.log('👤 User ID:', user.id);
    console.log('📧 Email:', user.email);

    // 2. Try to fetch role using REST API (simulating what the app does)
    console.log('%c📡 تجربة جلب الدور من الجدول مباشرة...', 'color: orange');
    
    const projectUrl = import.meta.env?.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL_HERE"; // User might need to fill this if not in context
    // Actually, we can't easily access env vars from console unless exposed.
    // Let's try to use the fetch API directly with the token.
    
    // We need the project URL. Usually it's in the local storage key or we can guess/ask.
    // But wait, if the user is in the app, they can maybe access the `authService` if we attached it to window?
    // No, we didn't.

    // Let's just give them instructions to check the Network tab.
    console.log(`
    ⚠️ لا يمكن الفحص المباشر من الكونسول لأن كائن supabase غير متاح عالمياً.
    
    يرجى اتباع الخطوات التالية:
    1. اذهب إلى تبويب "Network" في أدوات المطور.
    2. اكتب "rpc" أو "doctors" في مربع البحث (Filter).
    3. قم بتحديث الصفحة.
    4. انظر إلى الطلبات التي تظهر باللون الأحمر (فشل).
    
    إذا رأيت فشل في "get_my_role" (404 أو 500):
    => يعني أنك لم تشغل سكربت SQL المرفق (FINAL_FIX_ROLES.sql).
    
    إذا رأيت فشل في "doctors" (403 Forbidden):
    => يعني أن سياسات الأمان (RLS) تمنع القراءة، ويجب تشغيل السكربت أيضاً.
    
    إذا نجح الطلب ولكن العائد هو "doctor":
    => يعني أن البيانات في الجدول تقول أنك طبيب. استخدم سكربت FORCE_SECRETARY_ROLE.sql لتغيير ذلك.
    `);

})();
