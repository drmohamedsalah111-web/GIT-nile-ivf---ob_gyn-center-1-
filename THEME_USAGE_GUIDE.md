# 🎨 دليل استخدام نظام الثيمات

## ❌ الطريقة القديمة (خطأ)
```tsx
<div className="bg-white text-gray-900 border-gray-200">
  <button className="bg-teal-600 hover:bg-teal-700">
    اضغط
  </button>
</div>
```

## ✅ الطريقة الجديدة (صحيح)
```tsx
<div className="bg-background text-textMain border-borderColor">
  <button className="bg-brand hover:bg-brandHover">
    اضغط
  </button>
</div>
```

---

## جدول الألوان المتاحة

| الاستخدام | Class Name | CSS Variable |
|----------|-----------|--------------|
| **خلفية رئيسية** | `bg-background` | `var(--bg-primary)` |
| **خلفية ثانوية** | `bg-surface` | `var(--bg-secondary)` |
| **خلفية ثالثة** | `bg-surfaceTertiary` | `var(--bg-tertiary)` |
| **نص رئيسي** | `text-textMain` | `var(--text-main)` |
| **نص ثانوي** | `text-textSecondary` | `var(--text-secondary)` |
| **نص باهت** | `text-textMuted` | `var(--text-muted)` |
| **لون العلامة التجارية** | `bg-brand` | `var(--brand-color)` |
| **hover العلامة** | `hover:bg-brandHover` | `var(--brand-hover)` |
| **حدود** | `border-borderColor` | `var(--border-color)` |
| **نجاح** | `text-success` | `var(--success-color)` |
| **خطأ** | `text-error` | `var(--error-color)` |
| **تحذير** | `text-warning` | `var(--warning-color)` |

---

## أمثلة عملية

### 1. Card Component
```tsx
<div className="bg-surface rounded-xl p-6 border border-borderColor shadow-lg">
  <h3 className="text-xl font-bold text-textMain mb-2">عنوان</h3>
  <p className="text-textSecondary">وصف النص هنا</p>
</div>
```

### 2. Button Primary
```tsx
<button className="px-4 py-2 bg-brand hover:bg-brandHover text-white rounded-lg transition-colors">
  حفظ
</button>
```

### 3. Button Secondary
```tsx
<button className="px-4 py-2 bg-surface hover:bg-surfaceTertiary text-textMain border border-borderColor rounded-lg transition-colors">
  إلغاء
</button>
```

### 4. Input Field
```tsx
<input 
  type="text"
  className="w-full px-4 py-2 bg-background text-textMain border border-borderColor rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
  placeholder="أدخل النص"
/>
```

### 5. Alert Success
```tsx
<div className="bg-surface border-l-4 border-success p-4 rounded-lg">
  <p className="text-success font-semibold">تم الحفظ بنجاح!</p>
</div>
```

### 6. Alert Error
```tsx
<div className="bg-surface border-l-4 border-error p-4 rounded-lg">
  <p className="text-error font-semibold">حدث خطأ!</p>
</div>
```

### 7. Modal/Overlay
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl border border-borderColor">
    <h2 className="text-2xl font-bold text-textMain mb-4">عنوان Modal</h2>
    <p className="text-textSecondary mb-6">محتوى النص</p>
    <button className="w-full bg-brand hover:bg-brandHover text-white py-2 rounded-lg">
      تأكيد
    </button>
  </div>
</div>
```

### 8. Navigation Menu
```tsx
<nav className="bg-background border-b border-borderColor">
  <ul className="flex gap-4 p-4">
    <li>
      <a href="#" className="text-textMain hover:text-brand transition-colors">
        الرئيسية
      </a>
    </li>
    <li>
      <a href="#" className="text-textMuted hover:text-brand transition-colors">
        المرضى
      </a>
    </li>
  </ul>
</nav>
```

### 9. Table
```tsx
<table className="w-full">
  <thead className="bg-surface border-b border-borderColor">
    <tr>
      <th className="px-4 py-3 text-right text-textMain font-semibold">الاسم</th>
      <th className="px-4 py-3 text-right text-textMain font-semibold">الهاتف</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-borderColor hover:bg-surface transition-colors">
      <td className="px-4 py-3 text-textMain">محمد</td>
      <td className="px-4 py-3 text-textSecondary">01234567890</td>
    </tr>
  </tbody>
</table>
```

### 10. Badge/Chip
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand/10 text-brand border border-brand/20">
  نشط
</span>
```

---

## ⚡ Transitions
لتفعيل انتقالات سلسة بين الثيمات، أضف:

```tsx
className="transition-colors duration-300"
```

مثال:
```tsx
<div className="bg-background text-textMain transition-colors duration-300">
  {/* المحتوى */}
</div>
```

---

## 🔍 البحث والاستبدال

استخدم Find & Replace في VS Code:

### Replace bg-white
```
Find: bg-white
Replace: bg-background
```

### Replace text-gray-900
```
Find: text-gray-900
Replace: text-textMain
```

### Replace text-gray-600
```
Find: text-gray-600
Replace: text-textSecondary
```

### Replace border-gray-200
```
Find: border-gray-200
Replace: border-borderColor
```

---

## ✅ تم تحديثها
- [x] `styles.css` - CSS Variables
- [x] `tailwind.config.js` - Tailwind colors
- [x] `ThemeContext.tsx` - Context provider
- [x] `ThemeSwitcher.tsx` - UI component
- [x] `App.tsx` - Root wrapper + backgrounds
- [x] `Sidebar.tsx` - Navigation colors

## ⏳ تحتاج تحديث
- [ ] `Dashboard.tsx`
- [ ] `Settings.tsx`
- [ ] `PatientRecord.tsx`
- [ ] `ReceptionDashboard.tsx`
- [ ] Modal components
- [ ] Form components

---

## 🎯 الخلاصة
- **استخدم دائماً** CSS variable classes: `bg-background`, `text-textMain`, etc.
- **تجنب** hardcoded colors: `bg-white`, `text-gray-900`, etc.
- **أضف** `transition-colors` للانتقالات السلسة
- **تأكد** من استخدام `border-borderColor` للحدود
