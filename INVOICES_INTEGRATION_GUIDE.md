/**
 * INTEGRATION_GUIDE.md
 * دليل دمج نظام الفواتير في لوحة السكرتيرة
 */

# 🔗 دليل الدمج السريع

## الخطوة 1: تشغيل SQL Script

في Supabase SQL Editor، نفذ:
```sql
-- نفذ ملف: CREATE_INVOICE_ITEMS_TABLE.sql
```

---

## الخطوة 2: استيراد المكونات

في أول ملف `SecretaryDashboard.tsx`:

```tsx
import { InvoicesManagementPage } from '../components/invoices';
```

---

## الخطوة 3: تحديث State

أضف 'invoices' للـ activeView:

```tsx
const [activeView, setActiveView] = useState<
  'dashboard' | 'calendar' | 'patients' | 'waiting' | 'invoices'
>('dashboard');
```

---

## الخطوة 4: إضافة زر في القائمة الجانبية

بعد زر "المرضى":

```tsx
{/* زر الفواتير */}
<button
  onClick={() => setActiveView('invoices')}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
    activeView === 'invoices'
      ? 'bg-purple-100 text-purple-700 font-semibold'
      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
  }`}
>
  <Receipt className="w-5 h-5" />
  <span className="font-medium">الفواتير</span>
  <span className="mr-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
    جديد
  </span>
</button>
```

---

## الخطوة 5: إضافة المحتوى

في قسم المحتوى الرئيسي:

```tsx
{/* Invoices View */}
{activeView === 'invoices' && (
  <InvoicesManagementPage
    secretaryId={secretary.id}
    doctorId={secretary.secretary_doctor_id}
    secretaryName={secretary.name}
  />
)}
```

---

## الخطوة 6: استيراد أيقونة Receipt

في أول الملف مع الأيقونات الأخرى:

```tsx
import {
  Calendar,
  Users,
  Clock,
  Plus,
  Search,
  Phone,
  User,
  History,
  ChevronDown,
  LogOut,
  Bell,
  Settings,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  Receipt  // <-- أضف هذه
} from 'lucide-react';
```

---

## 🎯 الكود الكامل للدمج

### في SecretaryDashboard.tsx:

```tsx
// ============================================
// 1. IMPORTS
// ============================================
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Plus,
  Search,
  Phone,
  User,
  History,
  ChevronDown,
  LogOut,
  Bell,
  Settings,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  Receipt  // ← جديد
} from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { appointmentsService } from '../services/appointmentsService';
import { visitsService } from '../services/visitsService';
import { InvoicesManagementPage } from '../components/invoices';  // ← جديد
import toast from 'react-hot-toast';

// ============================================
// 2. STATE
// ============================================
const SecretaryDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<
    'dashboard' | 'calendar' | 'patients' | 'waiting' | 'invoices'  // ← جديد
  >('dashboard');
  
  const [secretary, setSecretary] = useState<any>(null);
  // ... باقي الـ state

  // ============================================
  // 3. SIDEBAR - القائمة الجانبية
  // ============================================
  {/* في القائمة الجانبية */}
  <nav className="space-y-2">
    {/* Dashboard */}
    <button
      onClick={() => setActiveView('dashboard')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === 'dashboard'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'text-gray-600 hover:bg-purple-50'
      }`}
    >
      <FileText className="w-5 h-5" />
      <span className="font-medium">لوحة التحكم</span>
    </button>

    {/* Patients */}
    <button
      onClick={() => setActiveView('patients')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === 'patients'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'text-gray-600 hover:bg-purple-50'
      }`}
    >
      <Users className="w-5 h-5" />
      <span className="font-medium">المرضى</span>
    </button>

    {/* ← جديد: Invoices */}
    <button
      onClick={() => setActiveView('invoices')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === 'invoices'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
      }`}
    >
      <Receipt className="w-5 h-5" />
      <span className="font-medium">الفواتير</span>
      <span className="mr-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
        جديد
      </span>
    </button>

    {/* Waiting Queue */}
    <button
      onClick={() => setActiveView('waiting')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === 'waiting'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'text-gray-600 hover:bg-purple-50'
      }`}
    >
      <Clock className="w-5 h-5" />
      <span className="font-medium">قائمة الانتظار</span>
    </button>
  </nav>

  // ============================================
  // 4. MAIN CONTENT - المحتوى الرئيسي
  // ============================================
  <div className="lg:col-span-9 space-y-6">
    {/* Dashboard View */}
    {activeView === 'dashboard' && (
      <>
        {/* Stats and content */}
      </>
    )}

    {/* Patients View */}
    {activeView === 'patients' && (
      <>
        {/* Patients content */}
      </>
    )}

    {/* ← جديد: Invoices View */}
    {activeView === 'invoices' && (
      <InvoicesManagementPage
        secretaryId={secretary.id}
        doctorId={secretary.secretary_doctor_id}
        secretaryName={secretary.name}
      />
    )}

    {/* Waiting Queue View */}
    {activeView === 'waiting' && (
      <>
        {/* Waiting queue content */}
      </>
    )}
  </div>
};

export default SecretaryDashboard;
```

---

## ✅ التحقق من النجاح

بعد الدمج، يجب أن:

1. ✅ يظهر زر "الفواتير" في القائمة الجانبية
2. ✅ عند الضغط عليه، تظهر صفحة الفواتير
3. ✅ يمكن إنشاء فاتورة جديدة
4. ✅ تظهر الإحصائيات في الأعلى
5. ✅ يمكن البحث والفلترة
6. ✅ يمكن طباعة الفواتير

---

## 🐛 استكشاف الأخطاء

### الخطأ: "Module not found"
**الحل:**
```bash
# تأكد من وجود الملفات في المكان الصحيح
components/invoices/SmartInvoiceForm.tsx
components/invoices/InvoicesManagementPage.tsx
components/invoices/index.ts
```

### الخطأ: "Table invoice_items does not exist"
**الحل:**
```sql
-- نفذ في Supabase:
CREATE_INVOICE_ITEMS_TABLE.sql
```

### الخطأ: RLS Policy Error
**الحل:**
```sql
-- تأكد من تنفيذ جميع الـ RLS Policies في SQL Script
```

---

## 🎉 الانتهاء!

الآن نظام الفواتير الذكي جاهز ومدمج بالكامل! 🚀

**الخصائص:**
- ✅ واجهة سهلة وسريعة
- ✅ اختصارات لوحة مفاتيح
- ✅ حفظ تلقائي
- ✅ تحقق من الأخطاء
- ✅ طباعة احترافية
- ✅ تقارير فورية

**استمتع بالاستخدام!** 💜
