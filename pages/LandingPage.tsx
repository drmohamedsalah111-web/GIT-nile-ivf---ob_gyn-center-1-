import React, { useEffect, useState } from 'react';
import {
  Heart, Shield, Users, Calendar, FileText, TrendingUp,
  CheckCircle, ArrowRight, Star, Zap, Award, Lock, Facebook, MessageCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LandingPageProps {
  onLogin: () => void;
  onAdminLogin: () => void;
}

interface ContentData {
  hero?: any;
  features?: any;
  pricing?: any;
  cta?: any;
  footer?: any;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onAdminLogin }) => {
  const [content, setContent] = useState<ContentData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from('landing_page_content')
        .select('*');

      if (data) {
        const contentMap: any = {};
        data.forEach(item => {
          contentMap[item.section] = item.content;
        });
        setContent(contentMap);
      }
    } catch (error) {
      console.log('Using default content');
    } finally {
      setLoading(false);
    }
  };

  // Default content fallback
  const heroContent = content.hero || {
    title: 'إدارة احترافية',
    subtitle: 'لعيادات الخصوبة',
    description: 'نظام متكامل لإدارة عيادات الحقن المجهري وأمراض النساء والتوليد.'
  };

  const pricingContent = content.pricing || {
    title: 'خطط أسعار مرنة',
    subtitle: 'ابدأ مجاناً لمدة 14 يوم',
    plans: [
      { name: 'الخطة الأساسية', price: 4999, features: ['حتى 50 مريض', 'مستخدم واحد', '1 جيجا تخزين', 'دعم فني أساسي'] },
      { name: 'الخطة المتقدمة', price: 9999, features: ['حتى 200 مريض', '3 مستخدمين', '5 جيجا تخزين', 'دعم فني متقدم 24/7', 'تقارير متقدمة'] },
      { name: 'الخطة الاحترافية', price: 19999, features: ['مرضى غير محدودين', 'مستخدمين غير محدودين', 'تخزين غير محدود', 'دعم VIP مخصص', 'تدريب شخصي', 'تخصيص كامل'] }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 font-[Tajawal]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  نايل IVF
                </h1>
                <p className="text-xs text-gray-600">نظام إدارة عيادات الخصوبة</p>
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={onLogin}
                className="px-6 py-2.5 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                تسجيل الدخول
              </button>
              <a
                href="/register"
                className="px-8 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                سجّل مجاناً
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-right space-y-6">
              <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
                ⚡ النظام الأكثر تطوراً في الشرق الأوسط
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  إدارة احترافية
                </span>
                <br />
                <span className="text-gray-800">لعيادات الخصوبة</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                نظام متكامل لإدارة عيادات الحقن المجهري وأمراض النساء والتوليد.
                تتبع دقيق، تقارير شاملة، وتجربة مستخدم استثنائية.
              </p>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={onLogin}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  <span>ابدأ تجربتك المجانية</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:border-teal-500 hover:text-teal-600 transition-all">
                  شاهد العرض التوضيحي
                </button>
              </div>

              <div className="flex items-center gap-8 pt-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">بدون بطاقة ائتمانية</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">إعداد في 5 دقائق</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">دعم فني 24/7</span>
                </div>
              </div>
            </div>

            {/* Image/Illustration */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-teal-100 to-blue-100 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl">
                      <Calendar className="w-8 h-8 text-teal-600" />
                      <div className="text-right flex-1">
                        <div className="font-bold text-gray-800">15 موعد جديد</div>
                        <div className="text-sm text-gray-500">اليوم</div>
                      </div>
                      <div className="text-2xl font-bold text-teal-600">✓</div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <Users className="w-8 h-8 text-purple-600" />
                      <div className="text-right flex-1">
                        <div className="font-bold text-gray-800">127 مريضة نشطة</div>
                        <div className="text-sm text-gray-500">هذا الشهر</div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">↑</div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                      <div className="text-right flex-1">
                        <div className="font-bold text-gray-800">معدل نجاح 87%</div>
                        <div className="text-sm text-gray-500">دورات IVF</div>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">🎯</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 animate-bounce">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <div className="text-right">
                    <div className="font-bold text-gray-800">4.9/5</div>
                    <div className="text-xs text-gray-500">تقييم العملاء</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-500" />
                  <div className="text-right">
                    <div className="font-bold text-gray-800">100% آمن</div>
                    <div className="text-xs text-gray-500">ISO 27001</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              لماذا يختارنا أكثر من <span className="text-teal-600">500 طبيب</span>؟
            </h2>
            <p className="text-xl text-gray-600">
              مميزات متقدمة تجعل إدارة عيادتك أسهل وأكثر كفاءة
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-right">إدارة المواعيد الذكية</h3>
              <p className="text-gray-600 text-right leading-relaxed">
                نظام حجز متطور مع تذكيرات تلقائية وإدارة قوائم الانتظار
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-right">سجلات طبية متكاملة</h3>
              <p className="text-gray-600 text-right leading-relaxed">
                تتبع دقيق لكل دورة IVF من البداية حتى النتيجة النهائية
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-right">تقارير وإحصائيات</h3>
              <p className="text-gray-600 text-right leading-relaxed">
                لوحات تحكم تفاعلية مع رسوم بيانية ومؤشرات أداء فورية
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-right">أمان عالي المستوى</h3>
              <p className="text-gray-600 text-right leading-relaxed">
                تشفير كامل للبيانات ونسخ احتياطي تلقائي كل ساعة
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-right">إدارة الفريق</h3>
              <p className="text-gray-600 text-right leading-relaxed">
                صلاحيات مخصصة لكل عضو في الفريق مع تتبع النشاطات
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-right">سرعة فائقة</h3>
              <p className="text-gray-600 text-right leading-relaxed">
                تحميل فوري للصفحات وأداء ممتاز حتى مع آلاف السجلات
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {pricingContent.title}
            </h2>
            <p className="text-xl text-gray-600">
              {pricingContent.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingContent.plans && pricingContent.plans.map((plan: any, index: number) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow ${index === 1 ? 'ring-2 ring-teal-500 md:scale-105' : ''
                  }`}
              >
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-800 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ الأكثر شعبية
                  </div>
                )}
                <div className="text-right">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-end gap-2 mb-6">
                    <span className={index === 1 ? 'text-teal-100' : 'text-gray-500'}>/شهرياً</span>
                    <span className={`text-5xl font-bold ${index === 1 ? 'text-teal-600' : 'text-teal-600'}`}>
                      ج.م&nbsp;{plan.price?.toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <ul className="space-y-4 mb-8 text-right">
                    {plan.features && plan.features.map((feature: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-3 justify-end">
                        <span className={index === 1 ? 'text-gray-700' : 'text-gray-600'}>{feature}</span>
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${index === 1 ? 'text-yellow-400' : 'text-green-500'
                          }`} />
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onLogin}
                    className={`w-full py-3 rounded-xl font-bold transition-colors ${index === 1
                        ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:shadow-lg'
                        : 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50'
                      }`}
                  >
                    ابدأ التجربة المجانية
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-blue-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            جاهز للبدء؟
          </h2>
          <p className="text-xl text-teal-50 mb-8">
            انضم إلى مئات الأطباء الذين يثقون في نايل IVF
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center px-10 py-4 bg-white text-teal-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              ابدأ التجربة المجانية الآن
            </a>
            <button className="px-10 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
              تحدث مع فريق المبيعات
            </button>
          </div>
          <p className="text-teal-100 mt-6 text-sm">
            ✓ تجربة مجانية 14 يوم   ✓ بدون بطاقة ائتمانية   ✓ إلغاء في أي وقت
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-right mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">المنتج</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-400 transition-colors">المميزات</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">الأسعار</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">الأمان</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">الشركة</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-400 transition-colors">من نحن</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">فريق العمل</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">الوظائف</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">الدعم</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-400 transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">تواصل معنا</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">الأسئلة الشائعة</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">قانوني</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-400 transition-colors">الخصوصية</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">الشروط</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">الترخيص</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold">نايل IVF</span>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-center">
                جميع الحقوق محفوظة © 2026 نايل IVF. نظام متكامل لإدارة الخصوبة.<br />
                <span className="inline-block mt-3 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg font-bold border border-green-600/30">
                  برمجة و تطوير د محمد صلاح جبر
                </span>
              </p>

              <div className="flex items-center gap-6 mt-2">
                <a href="https://www.facebook.com/profile.php?id=100000785193419" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                  <Facebook size={24} />
                </a>
                <a href="https://wa.me/201003418068" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">
                  <MessageCircle size={24} />
                </a>
                <div className="p-1 bg-white rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://wa.me/201003418068')}`}
                    alt="Support QR"
                    className="w-[40px] h-[40px]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onAdminLogin}
              className="flex items-center gap-2 text-gray-500 hover:text-teal-400 transition-colors text-sm"
            >
              <Shield className="w-4 h-4" />
              <span>دخول الأدمن</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
