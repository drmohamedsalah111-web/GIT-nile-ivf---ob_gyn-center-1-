/**
 * EXAMPLE: How to add Quick Theme Toggle in different locations
 * أمثلة: كيفية إضافة زر التبديل السريع في أماكن مختلفة
 */

import React from 'react';
import { QuickThemeToggle } from './components/theme/QuickThemeToggle';

// ============================================================
// Example 1: في الـ Header
// ============================================================
export const HeaderWithThemeToggle = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-surface border-b border-borderColor">
      <h1 className="text-xl font-bold">نظام العيادة</h1>
      
      {/* زر تبديل سريع في الـ Header */}
      <QuickThemeToggle size="medium" variant="icon" />
    </header>
  );
};

// ============================================================
// Example 2: في Toolbar
// ============================================================
export const ToolbarWithThemeToggle = () => {
  return (
    <div className="flex items-center gap-2 p-2 bg-surface rounded-lg">
      <button className="px-3 py-2 rounded hover:bg-surfaceTertiary">حفظ</button>
      <button className="px-3 py-2 rounded hover:bg-surfaceTertiary">طباعة</button>
      
      {/* فاصل */}
      <div className="w-px h-6 bg-borderColor" />
      
      {/* زر التبديل */}
      <QuickThemeToggle size="small" variant="icon" />
    </div>
  );
};

// ============================================================
// Example 3: زر عائم (Floating Action Button)
// ============================================================
export const FloatingThemeToggle = () => {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <QuickThemeToggle 
        size="large" 
        variant="icon" 
        className="shadow-2xl ring-2 ring-brand/20"
      />
    </div>
  );
};

// ============================================================
// Example 4: في قائمة الإعدادات السريعة
// ============================================================
export const QuickSettingsMenu = () => {
  return (
    <div className="w-64 bg-surface rounded-xl shadow-lg p-3 space-y-2">
      <div className="text-xs font-black text-textMuted uppercase mb-3">
        إعدادات سريعة
      </div>
      
      {/* زر كامل مع وصف */}
      <QuickThemeToggle variant="full" />
      
      <button className="w-full px-4 py-3 rounded-lg hover:bg-surfaceTertiary text-right">
        الإشعارات
      </button>
      <button className="w-full px-4 py-3 rounded-lg hover:bg-surfaceTertiary text-right">
        اللغة
      </button>
    </div>
  );
};

// ============================================================
// Example 5: في Dashboard Card
// ============================================================
export const DashboardCardWithToggle = () => {
  return (
    <div className="bg-surface rounded-xl border border-borderColor p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">الإحصائيات</h3>
        <QuickThemeToggle size="small" variant="icon" />
      </div>
      
      <div className="space-y-3">
        {/* محتوى الكارد */}
        <p>عدد المرضى: 125</p>
        <p>المواعيد اليوم: 8</p>
      </div>
    </div>
  );
};

// ============================================================
// Example 6: في Navigation Bar للموبايل
// ============================================================
export const MobileNavWithToggle = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-surface border-b border-borderColor p-3 flex items-center justify-between z-50">
      <button className="p-2">
        <span className="text-2xl">☰</span>
      </button>
      
      <h1 className="text-sm font-bold">نظام العيادة</h1>
      
      {/* زر التبديل */}
      <QuickThemeToggle size="small" variant="icon" />
    </div>
  );
};

// ============================================================
// Example 7: في Settings Page مع Options
// ============================================================
export const AdvancedSettingsSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">مظهر التطبيق</h2>
        
        {/* خيار 1: تبديل سريع Light/Dark */}
        <div className="bg-surface rounded-xl p-4 mb-4">
          <label className="block text-sm font-bold mb-3">تبديل سريع</label>
          <QuickThemeToggle variant="text" />
        </div>
        
        {/* خيار 2: اختيار متقدم */}
        <div className="bg-surface rounded-xl p-4">
          <label className="block text-sm font-bold mb-3">اختيار متقدم</label>
          <p className="text-xs text-textMuted mb-3">
            اختر من بين 5 ثيمات مختلفة
          </p>
          {/* هنا يمكن إضافة ThemeSwitcher الكامل */}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Example 8: في User Profile Dropdown
// ============================================================
export const UserProfileDropdown = () => {
  return (
    <div className="w-64 bg-surface rounded-xl shadow-2xl p-3">
      {/* بيانات المستخدم */}
      <div className="flex items-center gap-3 p-3 mb-3 border-b border-borderColor">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
          <span className="text-brand font-bold">د</span>
        </div>
        <div>
          <div className="font-bold text-sm">د. أحمد محمد</div>
          <div className="text-xs text-textMuted">طبيب نساء وتوليد</div>
        </div>
      </div>
      
      {/* القائمة */}
      <div className="space-y-1">
        <button className="w-full px-3 py-2 rounded-lg hover:bg-surfaceTertiary text-right text-sm">
          الملف الشخصي
        </button>
        <button className="w-full px-3 py-2 rounded-lg hover:bg-surfaceTertiary text-right text-sm">
          الإعدادات
        </button>
        
        {/* فاصل */}
        <div className="my-2 border-t border-borderColor" />
        
        {/* تبديل الثيم */}
        <div className="px-2 py-1">
          <QuickThemeToggle variant="full" />
        </div>
        
        {/* فاصل */}
        <div className="my-2 border-t border-borderColor" />
        
        <button className="w-full px-3 py-2 rounded-lg hover:bg-red-500/5 text-red-500 text-right text-sm">
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Example 9: استخدام في أي مكان مخصص
// ============================================================
export const CustomUsageExample = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">استخدام مخصص</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* حجم صغير */}
        <div className="bg-surface p-4 rounded-lg text-center">
          <p className="text-xs mb-3">Small Size</p>
          <QuickThemeToggle size="small" variant="icon" />
        </div>
        
        {/* حجم متوسط */}
        <div className="bg-surface p-4 rounded-lg text-center">
          <p className="text-xs mb-3">Medium Size</p>
          <QuickThemeToggle size="medium" variant="icon" />
        </div>
        
        {/* حجم كبير */}
        <div className="bg-surface p-4 rounded-lg text-center">
          <p className="text-xs mb-3">Large Size</p>
          <QuickThemeToggle size="large" variant="icon" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// USAGE NOTES:
// ============================================================
/**
 * Props Available:
 * 
 * size: 'small' | 'medium' | 'large'
 *   - small: 8x8 (32px)
 *   - medium: 10x10 (40px) 
 *   - large: 12x12 (48px)
 * 
 * variant: 'icon' | 'text' | 'full'
 *   - icon: أيقونة فقط
 *   - text: أيقونة + نص
 *   - full: أيقونة + نص + وصف
 * 
 * className: string (optional)
 *   - أي classes إضافية من Tailwind
 * 
 * الوظيفة:
 * - يبدل بين Light (clinical-pure) و Dark (midnight-pro)
 * - حفظ تلقائي في localStorage
 * - انتقالات سلسة
 * - يدعم RTL
 */

export default {
  HeaderWithThemeToggle,
  ToolbarWithThemeToggle,
  FloatingThemeToggle,
  QuickSettingsMenu,
  DashboardCardWithToggle,
  MobileNavWithToggle,
  AdvancedSettingsSection,
  UserProfileDropdown,
  CustomUsageExample
};
