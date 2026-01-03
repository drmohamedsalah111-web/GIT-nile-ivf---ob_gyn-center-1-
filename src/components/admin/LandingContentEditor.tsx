// ============================================================================
// 🎨 LANDING PAGE CONTENT EDITOR - محرر محتوى صفحة الهبوط
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Save, RefreshCw, Eye, Plus, Trash2, ArrowLeft,
  Sparkles, Target, DollarSign, MessageCircle
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

interface ContentEditorProps {
  onBack: () => void;
}

const LandingContentEditor: React.FC<ContentEditorProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'pricing' | 'cta'>('hero');
  const [content, setContent] = useState<any>({
    hero: {},
    features: {},
    pricing: {},
    cta: {}
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('landing_content')
        .select('section, content');

      if (error) throw error;

      const contentMap: any = {};
      data?.forEach(item => {
        contentMap[item.section] = item.content;
      });

      setContent(contentMap);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('فشل تحميل المحتوى');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('landing_content')
        .upsert({
          section: activeSection,
          content: content[activeSection],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'section'
        });

      if (error) throw error;
      
      toast.success('✅ تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('فشل حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setContent((prev: any) => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        [field]: value
      }
    }));
  };

  const addFeature = () => {
    const features = content.features?.items || [];
    setContent((prev: any) => ({
      ...prev,
      features: {
        ...prev.features,
        items: [
          ...features,
          {
            icon: '✨',
            title: 'ميزة جديدة',
            description: 'وصف الميزة هنا'
          }
        ]
      }
    }));
  };

  const removeFeature = (index: number) => {
    const features = [...(content.features?.items || [])];
    features.splice(index, 1);
    setContent((prev: any) => ({
      ...prev,
      features: {
        ...prev.features,
        items: features
      }
    }));
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const features = [...(content.features?.items || [])];
    features[index] = { ...features[index], [field]: value };
    setContent((prev: any) => ({
      ...prev,
      features: {
        ...prev.features,
        items: features
      }
    }));
  };

  const renderHeroEditor = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          العنوان الرئيسي
        </label>
        <input
          type="text"
          value={content.hero?.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="نظام متكامل لإدارة عيادات..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          العنوان الفرعي
        </label>
        <textarea
          value={content.hero?.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="أدر عيادتك بكفاءة..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          نص الزر (Call to Action)
        </label>
        <input
          type="text"
          value={content.hero?.cta_text || ''}
          onChange={(e) => updateField('cta_text', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="ابدأ تجربتك المجانية"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          النقاط الرئيسية (سطر في كل صندوق)
        </label>
        {(content.hero?.features || []).map((feature: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={feature}
              onChange={(e) => {
                const newFeatures = [...(content.hero?.features || [])];
                newFeatures[index] = e.target.value;
                updateField('features', newFeatures);
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              onClick={() => {
                const newFeatures = content.hero?.features.filter((_: any, i: number) => i !== index);
                updateField('features', newFeatures);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newFeatures = [...(content.hero?.features || []), '✓ ميزة جديدة'];
            updateField('features', newFeatures);
          }}
          className="mt-2 flex items-center gap-2 text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          إضافة نقطة
        </button>
      </div>
    </div>
  );

  const renderFeaturesEditor = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          عنوان القسم
        </label>
        <input
          type="text"
          value={content.features?.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="مميزات البرنامج"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          الوصف
        </label>
        <input
          type="text"
          value={content.features?.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="كل ما تحتاجه لإدارة عيادتك..."
        />
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">المميزات</h3>
          <button
            onClick={addFeature}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة ميزة
          </button>
        </div>

        <div className="space-y-4">
          {(content.features?.items || []).map((feature: any, index: number) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input
                  type="text"
                  value={feature.icon}
                  onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                  className="w-16 px-3 py-2 text-center text-2xl border border-gray-200 rounded-lg"
                  placeholder="🎯"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold"
                    placeholder="عنوان الميزة"
                  />
                  <textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="وصف الميزة"
                  />
                </div>
                <button
                  onClick={() => removeFeature(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCTAEditor = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          العنوان
        </label>
        <input
          type="text"
          value={content.cta?.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="جاهز لتحويل عيادتك رقمياً؟"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          النص الفرعي
        </label>
        <textarea
          value={content.cta?.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="ابدأ تجربتك المجانية..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          نص الزر
        </label>
        <input
          type="text"
          value={content.cta?.button_text || ''}
          onChange={(e) => updateField('button_text', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="ابدأ الآن مجاناً"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          نص ثانوي
        </label>
        <input
          type="text"
          value={content.cta?.secondary_text || ''}
          onChange={(e) => updateField('secondary_text', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="أو تواصل معنا..."
        />
      </div>
    </div>
  );

  const sections = [
    { id: 'hero', name: 'القسم الرئيسي', icon: Sparkles },
    { id: 'features', name: 'المميزات', icon: Target },
    { id: 'cta', name: 'دعوة للعمل', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-800">إدارة محتوى صفحة الهبوط</h1>
                <p className="text-gray-500 mt-1">تحكم كامل في محتوى الصفحة الرئيسية</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadContent}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-700 mb-3">الأقسام</h3>
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === section.id
                          ? 'bg-purple-50 text-purple-700 font-bold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {section.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="col-span-9">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">جاري التحميل...</p>
                </div>
              ) : (
                <>
                  {activeSection === 'hero' && renderHeroEditor()}
                  {activeSection === 'features' && renderFeaturesEditor()}
                  {activeSection === 'cta' && renderCTAEditor()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingContentEditor;
