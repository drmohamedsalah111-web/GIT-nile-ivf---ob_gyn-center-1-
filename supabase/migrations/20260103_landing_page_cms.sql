-- ============================================================================
-- 🎨 LANDING PAGE CMS - نظام إدارة محتوى صفحة الهبوط
-- ============================================================================

-- 1️⃣ Create landing_content table
CREATE TABLE IF NOT EXISTS public.landing_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section VARCHAR(50) NOT NULL UNIQUE, -- 'hero', 'features', 'pricing', 'cta', 'footer'
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2️⃣ Insert default content
INSERT INTO landing_content (section, content) VALUES

-- Hero Section
('hero', '{
  "title": "نظام متكامل لإدارة عيادات النساء والتوليد والحقن المجهري",
  "subtitle": "أدر عيادتك بكفاءة واحترافية مع نظام ذكي شامل",
  "cta_text": "ابدأ تجربتك المجانية",
  "features": [
    "✓ إدارة مواعيد ذكية",
    "✓ ملفات إلكترونية شاملة",
    "✓ نظام حقن مجهري متقدم",
    "✓ تقارير وإحصائيات تفصيلية"
  ]
}'::jsonb),

-- Features Section
('features', '{
  "title": "مميزات البرنامج",
  "subtitle": "كل ما تحتاجه لإدارة عيادتك في مكان واحد",
  "items": [
    {
      "icon": "📅",
      "title": "إدارة المواعيد",
      "description": "نظام مواعيد ذكي مع تنبيهات تلقائية عبر الواتساب والإيميل"
    },
    {
      "icon": "🏥",
      "title": "الملف الطبي الإلكتروني",
      "description": "ملفات طبية شاملة مع صور وتحاليل ومتابعة كاملة"
    },
    {
      "icon": "🧬",
      "title": "نظام الحقن المجهري",
      "description": "إدارة متكاملة لدورات الحقن المجهري وفق بروتوكولات ESHRE"
    },
    {
      "icon": "💊",
      "title": "الروشتة الذكية",
      "description": "كتابة روشتات إلكترونية بسهولة مع قاعدة أدوية شاملة"
    },
    {
      "icon": "🔬",
      "title": "المعمل والأشعة",
      "description": "طلب تحاليل وأشعة ومتابعة النتائج"
    },
    {
      "icon": "📊",
      "title": "التقارير والإحصائيات",
      "description": "تقارير تفصيلية عن أداء العيادة والإيرادات"
    },
    {
      "icon": "💰",
      "title": "النظام المالي",
      "description": "إدارة الفواتير والمدفوعات والمتأخرات"
    },
    {
      "icon": "👥",
      "title": "إدارة الفريق",
      "description": "صلاحيات متعددة للسكرتيرة والفريق الطبي"
    }
  ]
}'::jsonb),

-- Pricing Section
('pricing', '{
  "title": "باقات الاشتراك",
  "subtitle": "اختر الباقة المناسبة لحجم عيادتك",
  "show_plans": true
}'::jsonb),

-- CTA Section
('cta', '{
  "title": "جاهز لتحويل عيادتك رقمياً؟",
  "subtitle": "ابدأ تجربتك المجانية الآن بدون الحاجة لبطاقة ائتمان",
  "button_text": "ابدأ الآن مجاناً",
  "secondary_text": "أو تواصل معنا للحصول على عرض توضيحي"
}'::jsonb),

-- Footer Section
('footer', '{
  "company_name": "د. محمد صلاح - مركز النيل للحقن المجهري",
  "tagline": "نظام متكامل لإدارة عيادات النساء والتوليد",
  "contact": {
    "phone": "01234567890",
    "email": "info@nilecenter.com",
    "address": "القاهرة، مصر"
  },
  "social": {
    "facebook": "https://facebook.com/nilecenter",
    "instagram": "https://instagram.com/nilecenter",
    "youtube": "https://youtube.com/nilecenter"
  },
  "copyright": "© 2026 Nile IVF Center. All rights reserved."
}'::jsonb)

ON CONFLICT (section) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- 3️⃣ Disable RLS (Super Admin only edits this)
ALTER TABLE public.landing_content DISABLE ROW LEVEL SECURITY;

-- 4️⃣ Grant permissions
GRANT SELECT ON public.landing_content TO anon;
GRANT ALL ON public.landing_content TO authenticated;

-- 5️⃣ Verify
SELECT '✅ Landing Content Created' as status, section, jsonb_pretty(content) as preview 
FROM landing_content 
ORDER BY section;
