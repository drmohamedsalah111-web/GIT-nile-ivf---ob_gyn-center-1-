# 💰 Smart Hybrid Billing System

Complete financial management system for Ob/Gyn & IVF clinics.

## 🚀 Quick Start

### 1. Database Setup
```sql
-- Run in Supabase SQL Editor
-- File: FINANCIAL_SYSTEM_SCHEMA.sql
```

### 2. Import Components
```tsx
import {
  ServicesManager,
  QuickInvoiceModal,
  CaseBillingTracker,
  DailyIncomeReport,
  useServices,
  useDailyRevenue,
  financialService,
} from './modules/finance';
```

### 3. Usage Examples

#### Settings Page (Service Catalog)
```tsx
<ServicesManager clinicId={user.id} />
```

#### Reception (Point of Sale)
```tsx
<QuickInvoiceModal
  clinicId={clinicId}
  doctorId={doctorId}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

#### Patient Profile (IVF Installments)
```tsx
<CaseBillingTracker
  patientId={patient.id}
  clinicId={clinicId}
  doctorId={doctorId}
/>
```

#### Dashboard (Analytics)
```tsx
<DailyIncomeReport clinicId={user.id} />
```

## 📦 What's Included

### Database Tables (6)
- ✅ `services` - Service catalog with pricing
- ✅ `packages` - IVF treatment bundles
- ✅ `financial_cases` - Long-term payment ledger
- ✅ `installments` - Payment schedule
- ✅ `invoices` - Master receipt record (ALL payments)
- ✅ `invoice_items` - Invoice line items

### React Components (4)
- ✅ `ServicesManager` - Service catalog with inline editing
- ✅ `QuickInvoiceModal` - 3-step invoice creation
- ✅ `CaseBillingTracker` - IVF installment tracker
- ✅ `DailyIncomeReport` - Analytics with Recharts

### Services Layer
- ✅ `financialService.ts` - Complete CRUD operations
- ✅ TypeScript interfaces for all entities
- ✅ Multi-tenancy support (clinic_id)
- ✅ RLS policies enabled

### Custom Hooks (9)
- `useServices` - Service catalog management
- `usePackages` - Package management
- `usePatientCases` - Patient financial cases
- `useCaseInstallments` - Installment tracking
- `useInvoices` - Invoice history
- `useDailyRevenue` - Daily revenue summary
- `useOverdueInstallments` - Overdue payments
- `useOpenCases` - Active IVF cases
- `useInvoiceDetails` - Single invoice details

## 🎯 Key Features

### 1. Hybrid Logic ✨
Both simple services AND IVF installments generate invoices → Single source of truth for daily cash box.

### 2. Inline Editing 🖊️
Click any price in ServicesManager to edit instantly (Excel-like).

### 3. Variable Pricing 💡
Override service prices per patient (e.g., VIP discount).

### 4. Progress Tracking 📊
Real-time progress bar shows IVF payment completion percentage.

### 5. Multi-Payment Methods 💳
Cash, Visa, Bank Transfer, Insurance.

### 6. Auto-Calculation 🔢
Installments automatically update case `paid_amount` via SQL triggers.

### 7. CSV Export 📥
One-click export for accounting software.

### 8. Bulk Price Update 📈
Apply inflation percentage to ALL services at once.

## 📊 Sample Workflow

### Receptionist Creates Invoice
1. Patient arrives → Search "أحمد محمد"
2. Add services:
   - Consultation (300 ج.م)
   - Ultrasound 4D (500 ج.م)
3. Apply 50 ج.م discount
4. Select "Cash" → Checkout
5. Invoice printed ✅

### IVF Patient Pays Installment
1. Open patient profile
2. View CaseBillingTracker tab
3. Find "Embryo Transfer - 8,000 ج.م"
4. Click "Pay" → Select "Visa"
5. Progress bar updates: 60% → 83% ✅

### Doctor Views Daily Report
1. Open DailyIncomeReport
2. Select date: 2025-12-26
3. View revenue cards:
   - Total: 58,000 ج.م
   - Services: 23,000 ج.م
   - Installments: 35,000 ج.م
4. Export CSV for accountant ✅

## 🔧 Dependencies

```json
{
  "recharts": "^2.10.0",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.294.0",
  "@supabase/supabase-js": "^2.38.0"
}
```

Install:
```bash
npm install recharts react-hot-toast lucide-react
```

## 📚 Documentation

Full implementation guide: `FINANCIAL_SYSTEM_IMPLEMENTATION_GUIDE.md`

Includes:
- Step-by-step setup
- Business logic explanation
- Testing scenarios
- Troubleshooting
- API reference
- Success checklist

## 🎉 Success Criteria

✅ Can create service invoices
✅ Can pay IVF installments
✅ Daily report shows correct revenue
✅ Pie chart renders
✅ CSV export works
✅ Inline price editing functional
✅ Multi-tenancy verified
✅ RLS policies working

## 📞 Support

Check troubleshooting section in implementation guide or review Supabase logs.

---

**Built for Nile IVF & Ob/Gyn Center** 🏥
