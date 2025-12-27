import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Edit2, Plus, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface LandingContentEditorProps {
  onBack: () => void;
}

const LandingContentEditor: React.FC<LandingContentEditorProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'pricing' | 'cta' | 'footer'>('hero');
  const [content, setContent] = useState<any>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const contentMap: any = {};
      data?.forEach(item => {
        contentMap[item.section] = item.content;
      });
      
      setContent(contentMap);
    } catch (err: any) {
      toast.error('فشل تحميل المحتوى: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .upsert({
          section: activeSection,
          content: content[activeSection],
          is_active: true
        }, { onConflict: 'section' });
      
      if (error) throw error;
      
      toast.success('✅ تم حفظ التغييرات بنجاح');
    } catch (err: any) {
      toast.error('فشل الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (path: string, value: any) => {
    const keys = path.split('.');
    const newContent = { ...content };
    
    let current = newContent[activeSection];
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setContent(newContent);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Tajawal]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
              >
                ← رجوع
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إدارة محتوى صفحة الهبوط</h1>
                <p className="text-sm text-gray-500">تحكم كامل في محتوى الصفحة الرئيسية</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchContent}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تحديث</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Sections */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">الأقسام</h3>
              <div className="space-y-2">
                {[
                  { id: 'hero', label: 'القسم الرئيسي (Hero)', icon: '🚀' },
                  { id: 'features', label: 'المميزات', icon: '⚡' },
                  { id: 'pricing', label: 'الأسعار', icon: '💰' },
                  { id: 'cta', label: 'الدعوة لاتخاذ إجراء', icon: '🎯' },
                  { id: 'footer', label: 'الفوتر', icon: '📋' }
                ].map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Hero Section */}
              {activeSection === 'hero' && content.hero && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🚀 تحرير القسم الرئيسي</h2>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الشارة (Badge)</label>
                    <input
                      type="text"
                      value={content.hero.badge || ''}
                      onChange={(e) => updateContent('badge', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الرئيسي</label>
                    <input
                      type="text"
                      value={content.hero.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 text-2xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الفرعي</label>
                    <input
                      type="text"
                      value={content.hero.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 text-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                    <textarea
                      value={content.hero.description || ''}
                      onChange={(e) => updateContent('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">زر الإجراء الأساسي</label>
                      <input
                        type="text"
                        value={content.hero.cta_primary || ''}
                        onChange={(e) => updateContent('cta_primary', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">زر الإجراء الثانوي</label>
                      <input
                        type="text"
                        value={content.hero.cta_secondary || ''}
                        onChange={(e) => updateContent('cta_secondary', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المميزات (3 نقاط)</label>
                    {content.hero.features?.map((feature: string, index: number) => (
                      <input
                        key={index}
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...content.hero.features];
                          newFeatures[index] = e.target.value;
                          updateContent('features', newFeatures);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 mb-2"
                        placeholder={`ميزة ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              {activeSection === 'pricing' && content.pricing && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">💰 تحرير خطط الأسعار</h2>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">عنوان القسم</label>
                    <input
                      type="text"
                      value={content.pricing.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 text-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الفرعي</label>
                    <input
                      type="text"
                      value={content.pricing.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-bold text-gray-800 mb-4">الخطط (3 خطط)</h3>
                    <div className="space-y-6">
                      {content.pricing.plans?.map((plan: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-700">الخطة {index + 1}</h4>
                            {plan.highlighted && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⭐ مميزة</span>}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">اسم الخطة</label>
                              <input
                                type="text"
                                value={plan.name}
                                onChange={(e) => {
                                  const newPlans = [...content.pricing.plans];
                                  newPlans[index].name = e.target.value;
                                  updateContent('plans', newPlans);
                                }}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">السعر</label>
                              <input
                                type="number"
                                value={plan.price}
                                onChange={(e) => {
                                  const newPlans = [...content.pricing.plans];
                                  newPlans[index].price = parseInt(e.target.value);
                                  updateContent('plans', newPlans);
                                }}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-xs font-bold text-gray-600 mb-1">المميزات (واحدة في كل سطر)</label>
                            <textarea
                              value={plan.features?.join('\n')}
                              onChange={(e) => {
                                const newPlans = [...content.pricing.plans];
                                newPlans[index].features = e.target.value.split('\n');
                                updateContent('plans', newPlans);
                              }}
                              rows={4}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Section */}
              {activeSection === 'cta' && content.cta && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 الدعوة لاتخاذ إجراء (CTA)</h2>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
                    <input
                      type="text"
                      value={content.cta.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 text-2xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الفرعي</label>
                    <input
                      type="text"
                      value={content.cta.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">زر الإجراء الأساسي</label>
                      <input
                        type="text"
                        value={content.cta.cta_primary || ''}
                        onChange={(e) => updateContent('cta_primary', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">زر الإجراء الثانوي</label>
                      <input
                        type="text"
                        value={content.cta.cta_secondary || ''}
                        onChange={(e) => updateContent('cta_secondary', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Other sections can be added similarly */}
              {activeSection === 'features' && (
                <div className="text-center py-12 text-gray-500">
                  <Edit2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>قسم المميزات - قريباً</p>
                  <p className="text-sm mt-2">يمكنك تعديل المميزات من قاعدة البيانات مباشرة حالياً</p>
                </div>
              )}

              {activeSection === 'footer' && (
                <div className="text-center py-12 text-gray-500">
                  <Edit2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>قسم الفوتر - قريباً</p>
                  <p className="text-sm mt-2">يمكنك تعديل الفوتر من قاعدة البيانات مباشرة حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingContentEditor;
