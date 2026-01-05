/**
 * دليل استخدام مكونات التنقل
 * Navigation Components Usage Guide
 */

import React from 'react';
import { NavigationButtons, NavigationButtonsMobile } from './components/common/NavigationButtons';
import { PageHeader } from './components/layout/PageHeader';
import { Users, Heart, Baby } from 'lucide-react';

/**
 * ========================================
 * 1. استخدام أزرار التنقل المستقلة
 * Using Standalone Navigation Buttons
 * ========================================
 */

// في أي صفحة أو مكون - For Desktop
const MyPageDesktop = () => {
  return (
    <div className="p-4">
      {/* أزرار التنقل في أعلى الصفحة */}
      <div className="mb-4">
        <NavigationButtons 
          showHome={true}           // إظهار زر الرئيسية
          homeRoute="/"             // مسار الصفحة الرئيسية
        />
      </div>
      
      <h1>محتوى الصفحة</h1>
    </div>
  );
};

// في أي صفحة أو مكون - For Mobile
const MyPageMobile = () => {
  return (
    <div className="p-4">
      {/* أزرار التنقل المصغرة للهواتف */}
      <div className="mb-4">
        <NavigationButtonsMobile 
          showHome={true}
          homeRoute="/"
        />
      </div>
      
      <h1>محتوى الصفحة</h1>
    </div>
  );
};

/**
 * ========================================
 * 2. استخدام PageHeader مع التنقل المدمج
 * Using PageHeader with Integrated Navigation
 * ========================================
 */

// صفحة المرضى - Patients Page Example
const PatientsPage = () => {
  return (
    <div>
      <PageHeader
        title="سجلات المرضى"
        subtitle="عرض وإدارة ملفات المرضى"
        icon={<Users size={24} />}
        showNavigation={true}        // إظهار أزرار التنقل
        homeRoute="/"               // مسار الرئيسية
        actions={
          // أزرار إضافية في رأس الصفحة
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            إضافة مريض جديد
          </button>
        }
      />
      
      <div className="p-4">
        {/* محتوى الصفحة */}
      </div>
    </div>
  );
};

// صفحة الحمل - Obstetrics Page Example
const ObstetricsPage = () => {
  return (
    <div>
      <PageHeader
        title="متابعة الحمل"
        subtitle="Antenatal Care"
        icon={<Heart size={24} />}
        showNavigation={true}
        homeRoute="/"
      />
      
      <div className="p-4">
        {/* محتوى متابعة الحمل */}
      </div>
    </div>
  );
};

// صفحة مركز الخصوبة - IVF Center Example
const IVFPage = () => {
  return (
    <div>
      <PageHeader
        title="مركز الخصوبة"
        subtitle="IVF & Fertility Treatment"
        icon={<Baby size={24} />}
        showNavigation={true}
        homeRoute="/"
        actions={
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
              دورة جديدة
            </button>
            <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
              التقارير
            </button>
          </div>
        }
      />
      
      <div className="p-4">
        {/* محتوى مركز الخصوبة */}
      </div>
    </div>
  );
};

/**
 * ========================================
 * 3. التخصيص المتقدم
 * Advanced Customization
 * ========================================
 */

// مثال: أزرار التنقل مع تخصيص مخصص
const CustomNavigationExample = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-white shadow-md">
      {/* شعار العيادة */}
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-10 h-10" />
        <span className="font-bold">عيادة النيل</span>
      </div>
      
      {/* أزرار التنقل في المنتصف */}
      <NavigationButtons 
        showHome={true}
        homeRoute="/dashboard"
        className="mx-auto"  // تخصيص الموقع
      />
      
      {/* قائمة المستخدم */}
      <div className="flex items-center gap-2">
        <span>د. أحمد محمد</span>
        <button className="p-2 rounded-full bg-gray-100">
          <Users size={20} />
        </button>
      </div>
    </div>
  );
};

/**
 * ========================================
 * 4. مثال متكامل للتطبيق
 * Complete Application Example
 * ========================================
 */

const CompleteAppExample = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر الرئيسي مع التنقل */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">نظام العيادة الشامل</h1>
              <NavigationButtons showHome={true} homeRoute="/" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">د. أحمد محمد</span>
              <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">
                خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto p-4">
        {/* استخدام PageHeader في الصفحات الداخلية */}
        <PageHeader
          title="لوحة التحكم"
          subtitle="نظرة عامة على نشاط العيادة"
          icon={<Users size={24} />}
          showNavigation={false}  // إخفاء التنقل لأنه موجود في الهيدر
        />
        
        <div className="mt-6">
          {/* محتوى الصفحة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-2">المرضى اليوم</h3>
              <p className="text-3xl font-bold text-blue-600">24</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-2">المواعيد</h3>
              <p className="text-3xl font-bold text-green-600">18</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-2">الإيرادات</h3>
              <p className="text-3xl font-bold text-purple-600">15,000</p>
            </div>
          </div>
        </div>
      </main>

      {/* القائمة السفلية للموبايل */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 shadow-lg">
        <NavigationButtonsMobile showHome={true} homeRoute="/" />
      </div>
    </div>
  );
};

/**
 * ========================================
 * 5. الخصائص المتاحة (Props)
 * Available Properties
 * ========================================
 */

/**
 * NavigationButtons & NavigationButtonsMobile Props:
 * 
 * @param {string} className - CSS classes إضافية
 * @param {boolean} showHome - إظهار زر الرئيسية (default: true)
 * @param {string} homeRoute - مسار الصفحة الرئيسية (default: '/')
 */

/**
 * PageHeader Props:
 * 
 * @param {string} title - عنوان الصفحة (مطلوب)
 * @param {string} subtitle - عنوان فرعي (اختياري)
 * @param {ReactNode} icon - أيقونة (اختياري)
 * @param {ReactNode} actions - أزرار إضافية (اختياري)
 * @param {boolean} showNavigation - إظهار أزرار التنقل (default: true)
 * @param {string} homeRoute - مسار الرئيسية (default: '/')
 */

/**
 * ========================================
 * 6. ملاحظات التصميم
 * Design Notes
 * ========================================
 */

/**
 * - الأزرار متجاوبة مع الوضع الليلي/النهاري (Dark/Light Mode)
 * - تأثيرات حركية سلسة وأنيقة
 * - دعم كامل للأجهزة المحمولة
 * - تعطيل تلقائي للأزرار عند عدم إمكانية التنقل
 * - تصميم متناسق مع باقي مكونات التطبيق
 * - دعم RTL (من اليمين لليسار) للغة العربية
 */

export {
  MyPageDesktop,
  MyPageMobile,
  PatientsPage,
  ObstetricsPage,
  IVFPage,
  CustomNavigationExample,
  CompleteAppExample
};
