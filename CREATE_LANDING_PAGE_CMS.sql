-- ============================================
-- 📄 نظام إدارة محتوى صفحة الهبوط (Landing Page CMS)
-- ============================================

-- 1️⃣ جدول محتوى صفحة الهبوط
CREATE TABLE IF NOT EXISTS landing_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE, -- hero, features, pricing, cta, footer
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2️⃣ RLS Policies
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read landing content" ON landing_page_content;
CREATE POLICY "Anyone can read landing content"
  ON landing_page_content FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage landing content" ON landing_page_content;
CREATE POLICY "Admins can manage landing content"
  ON landing_page_content FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3️⃣ Function لتحديث المحتوى
CREATE OR REPLACE FUNCTION update_landing_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS landing_content_updated_at ON landing_page_content;
CREATE TRIGGER landing_content_updated_at
  BEFORE UPDATE ON landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_content_timestamp();

-- 4️⃣ إدراج المحتوى الافتراضي

-- Hero Section
INSERT INTO landing_page_content (section, content) VALUES (
  'hero',
  '{
    "title": "إدارة احترافية",
    "subtitle": "لعيادات الخصوبة",
    "description": "نظام متكامل لإدارة عيادات الحقن المجهري وأمراض النساء والتوليد. تتبع دقيق، تقارير شاملة، وتجربة مستخدم استثنائية.",
    "badge": "⚡ النظام الأكثر تطوراً في الشرق الأوسط",
    "cta_primary": "ابدأ تجربتك المجانية",
    "cta_secondary": "شاهد العرض التوضيحي",
    "features": [
      "بدون بطاقة ائتمانية",
      "إعداد في 5 دقائق",
      "دعم فني 24/7"
    ]
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content;

-- Features Section
INSERT INTO landing_page_content (section, content) VALUES (
  'features',
  '{
    "title": "لماذا يختارنا أكثر من",
    "count": "500 طبيب",
    "subtitle": "مميزات متقدمة تجعل إدارة عيادتك أسهل وأكثر كفاءة",
    "items": [
      {
        "icon": "Calendar",
        "title": "إدارة المواعيد الذكية",
        "description": "نظام حجز متطور مع تذكيرات تلقائية وإدارة قوائم الانتظار",
        "gradient": "from-teal-50 to-blue-50",
        "iconGradient": "from-teal-500 to-blue-600"
      },
      {
        "icon": "FileText",
        "title": "سجلات طبية متكاملة",
        "description": "تتبع دقيق لكل دورة IVF من البداية حتى النتيجة النهائية",
        "gradient": "from-purple-50 to-pink-50",
        "iconGradient": "from-purple-500 to-pink-600"
      },
      {
        "icon": "TrendingUp",
        "title": "تقارير وإحصائيات",
        "description": "لوحات تحكم تفاعلية مع رسوم بيانية ومؤشرات أداء فورية",
        "gradient": "from-orange-50 to-red-50",
        "iconGradient": "from-orange-500 to-red-600"
      },
      {
        "icon": "Shield",
        "title": "أمان عالي المستوى",
        "description": "تشفير كامل للبيانات ونسخ احتياطي تلقائي كل ساعة",
        "gradient": "from-green-50 to-teal-50",
        "iconGradient": "from-green-500 to-teal-600"
      },
      {
        "icon": "Users",
        "title": "إدارة الفريق",
        "description": "صلاحيات مخصصة لكل عضو في الفريق مع تتبع النشاطات",
        "gradient": "from-blue-50 to-indigo-50",
        "iconGradient": "from-blue-500 to-indigo-600"
      },
      {
        "icon": "Zap",
        "title": "سرعة فائقة",
        "description": "تحميل فوري للصفحات وأداء ممتاز حتى مع آلاف السجلات",
        "gradient": "from-yellow-50 to-orange-50",
        "iconGradient": "from-yellow-500 to-orange-600"
      }
    ]
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content;

-- Pricing Section
INSERT INTO landing_page_content (section, content) VALUES (
  'pricing',
  '{
    "title": "خطط أسعار مرنة تناسب احتياجاتك",
    "subtitle": "ابدأ مجاناً لمدة 14 يوم، بدون بطاقة ائتمانية",
    "plans": [
      {
        "name": "الخطة الأساسية",
        "price": 4999,
        "currency": "₪",
        "period": "/شهرياً",
        "features": [
          "حتى 50 مريض",
          "مستخدم واحد",
          "1 جيجا تخزين",
          "دعم فني أساسي"
        ],
        "cta": "ابدأ التجربة المجانية",
        "highlighted": false
      },
      {
        "name": "الخطة المتقدمة",
        "price": 9999,
        "currency": "₪",
        "period": "/شهرياً",
        "badge": "⭐ الأكثر شعبية",
        "features": [
          "حتى 200 مريض",
          "3 مستخدمين",
          "5 جيجا تخزين",
          "دعم فني متقدم 24/7",
          "تقارير متقدمة"
        ],
        "cta": "ابدأ التجربة المجانية",
        "highlighted": true
      },
      {
        "name": "الخطة الاحترافية",
        "price": 19999,
        "currency": "₪",
        "period": "/شهرياً",
        "features": [
          "مرضى غير محدودين",
          "مستخدمين غير محدودين",
          "تخزين غير محدود",
          "دعم VIP مخصص",
          "تدريب شخصي",
          "تخصيص كامل"
        ],
        "cta": "تواصل معنا",
        "highlighted": false
      }
    ]
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content;

-- CTA Section
INSERT INTO landing_page_content (section, content) VALUES (
  'cta',
  '{
    "title": "جاهز لتحويل عيادتك إلى مستوى جديد؟",
    "subtitle": "انضم إلى مئات الأطباء الذين يثقون في نايل IVF",
    "cta_primary": "ابدأ التجربة المجانية الآن",
    "cta_secondary": "تحدث مع فريق المبيعات",
    "features": [
      "تجربة مجانية 14 يوم",
      "بدون بطاقة ائتمانية",
      "إلغاء في أي وقت"
    ]
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content;

-- Footer Section
INSERT INTO landing_page_content (section, content) VALUES (
  'footer',
  '{
    "copyright": "© 2025 نايل IVF. جميع الحقوق محفوظة.",
    "sections": [
      {
        "title": "المنتج",
        "links": [
          {"text": "المميزات", "url": "#features"},
          {"text": "الأسعار", "url": "#pricing"},
          {"text": "الأمان", "url": "#security"}
        ]
      },
      {
        "title": "الشركة",
        "links": [
          {"text": "من نحن", "url": "#about"},
          {"text": "فريق العمل", "url": "#team"},
          {"text": "الوظائف", "url": "#careers"}
        ]
      },
      {
        "title": "الدعم",
        "links": [
          {"text": "مركز المساعدة", "url": "#help"},
          {"text": "تواصل معنا", "url": "#contact"},
          {"text": "الأسئلة الشائعة", "url": "#faq"}
        ]
      },
      {
        "title": "قانوني",
        "links": [
          {"text": "الخصوصية", "url": "#privacy"},
          {"text": "الشروط", "url": "#terms"},
          {"text": "الترخيص", "url": "#license"}
        ]
      }
    ]
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content;

-- ✅ تم! الآن يمكن للأدمن تعديل محتوى صفحة الهبوط

-- للتحقق من البيانات:
SELECT 
  section as القسم,
  jsonb_pretty(content) as المحتوى,
  updated_at as آخر_تحديث
FROM landing_page_content
ORDER BY section;
