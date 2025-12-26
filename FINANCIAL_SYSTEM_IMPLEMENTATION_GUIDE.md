# 🏥 Smart Hybrid Billing System - Implementation Guide
## Complete Financial Module for Ob/Gyn & IVF Clinic

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Setup](#database-setup)
3. [Backend Integration](#backend-integration)
4. [Frontend Components](#frontend-components)
5. [Usage Examples](#usage-examples)
6. [Business Logic](#business-logic)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

### Purpose
A comprehensive financial management system that handles:
- **Fee-for-Service**: One-time payments (consultations, procedures, lab tests)
- **Long-term Cases**: IVF packages with installment tracking

### Key Features
✅ Service catalog with inline price editing
✅ Quick invoice modal (Point of Sale)
✅ IVF installment payment tracker
✅ Daily revenue analytics with charts
✅ Multi-tenancy (clinic_id filtering)
✅ RLS (Row Level Security) enabled
✅ Real-time payment tracking
✅ CSV export for reports

---

## 🗄️ Database Setup

### Step 1: Run SQL Migration

Execute the complete schema file:

```sql
-- Located at: FINANCIAL_SYSTEM_SCHEMA.sql
-- Run in Supabase SQL Editor
```

This creates:
- ✅ `services` table (1,000+ services supported)
- ✅ `packages` table (IVF bundles)
- ✅ `financial_cases` table (IVF payment ledger)
- ✅ `installments` table (payment schedule)
- ✅ `invoices` table (master receipt record)
- ✅ `invoice_items` table (line items)

### Step 2: Verify Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('services', 'packages', 'financial_cases', 'installments', 'invoices', 'invoice_items');
```

Expected: 6 tables returned.

### Step 3: Insert Sample Data (Optional)

Sample services and packages are included at the end of `FINANCIAL_SYSTEM_SCHEMA.sql`.

To customize:
```sql
INSERT INTO public.services (clinic_id, name, category, price) VALUES
    ('YOUR_DOCTOR_ID', 'Custom Service', 'Procedure', 500.00);
```

---

## 🔌 Backend Integration

### Services Layer

All financial operations are handled by `financialService.ts`:

```typescript
import financialService from './services/financialService';

// Get all services
const services = await financialService.services.getServices(clinicId);

// Create invoice
const invoice = await financialService.invoices.createServiceInvoice(
  clinicId,
  patientId,
  doctorId,
  items,
  'Cash',
  discount
);

// Get daily revenue
const revenue = await financialService.invoices.getDailyRevenue(clinicId, '2025-12-26');
```

### Custom Hooks

Use React hooks for state management:

```typescript
import { useServices, useDailyRevenue, usePatientCases } from './hooks/useFinancial';

// In your component
const { services, loading, refresh } = useServices(clinicId);
const { summary } = useDailyRevenue(clinicId, selectedDate);
const { cases } = usePatientCases(patientId);
```

---

## 🎨 Frontend Components

### 1. ServicesManager (Settings Page)

**Location**: `src/modules/finance/ServicesManager.tsx`

**Usage**:
```tsx
import { ServicesManager } from './modules/finance/ServicesManager';

<ServicesManager clinicId={user.id} />
```

**Features**:
- Data table with search and category filter
- Inline price editing (click on price to edit)
- Bulk price update (inflation adjustment)
- Add/Edit/Delete services
- Toggle active status

**Screenshot**:
```
┌─────────────────────────────────────────────┐
│ Service Name    │ Category │ Price  │ Active │
├─────────────────────────────────────────────┤
│ Consultation    │ Clinic   │ 300 ج.م │   ✓   │
│ 4D Ultrasound   │ Procedure│ 500 ج.م │   ✓   │
│ Beta HCG Test   │ Lab      │ 150 ج.م │   ✓   │
└─────────────────────────────────────────────┘
```

---

### 2. QuickInvoiceModal (Reception)

**Location**: `src/modules/finance/QuickInvoiceModal.tsx`

**Usage**:
```tsx
import { QuickInvoiceModal } from './modules/finance/QuickInvoiceModal';

const [showInvoice, setShowInvoice] = useState(false);

<QuickInvoiceModal
  clinicId={clinicId}
  doctorId={doctorId}
  isOpen={showInvoice}
  onClose={() => setShowInvoice(false)}
  onSuccess={() => {
    toast.success('Invoice created!');
    refreshData();
  }}
/>
```

**Workflow**:
1. **Step 1**: Search and select patient (autocomplete by name/phone)
2. **Step 2**: Add services to cart (quantity/price editable)
3. **Step 3**: Choose payment method (Cash/Visa/Transfer) and checkout

**Key Features**:
- Real-time patient search
- Shopping cart interface
- Price override allowed (with visual warning)
- Discount support
- Multiple payment methods

---

### 3. CaseBillingTracker (Patient Profile)

**Location**: `src/modules/finance/CaseBillingTracker.tsx`

**Usage**:
```tsx
import { CaseBillingTracker } from './modules/finance/CaseBillingTracker';

// Inside PatientProfile.tsx
<CaseBillingTracker
  patientId={patient.id}
  clinicId={clinicId}
  doctorId={doctorId}
/>
```

**Features**:
- Progress bar (Paid vs Total)
- Installments list with status badges:
  - ✅ **Paid** (green)
  - ⏰ **Due Today** (amber)
  - ❌ **Overdue** (red)
  - 📅 **Upcoming** (blue)
- One-click payment modal
- Auto-updates financial case when installment paid

**Visual Example**:
```
┌──────────────────────────────────────────────┐
│ ICSI Package - 35,000 ج.م                    │
│ ████████████░░░░░░░░░░░░░░░░░░  60% Complete │
│ Paid: 21,000 ج.م │ Remaining: 14,000 ج.م    │
├──────────────────────────────────────────────┤
│ ✅ Initial Payment       │ 10,000 ج.م │ Paid │
│ ✅ Medications          │  5,000 ج.م │ Paid │
│ ✅ Egg Retrieval        │  6,000 ج.م │ Paid │
│ ⏰ Embryo Transfer      │  8,000 ج.م │ Pay  │
│ 📅 Follow-up Visit      │  6,000 ج.م │ Later│
└──────────────────────────────────────────────┘
```

---

### 4. DailyIncomeReport (Dashboard)

**Location**: `src/modules/finance/DailyIncomeReport.tsx`

**Usage**:
```tsx
import { DailyIncomeReport } from './modules/finance/DailyIncomeReport';

<DailyIncomeReport clinicId={user.id} />
```

**Features**:
- 4 Revenue Cards:
  - Total Revenue (teal gradient)
  - Service Revenue (blue)
  - Installment Revenue (green)
  - Invoice Count (purple)
- Pie Chart (Recharts): Revenue breakdown by type
- Payment Methods Summary (Cash vs Cards)
- Latest 10 Transactions Table
- Date picker to view historical data
- CSV Export button

**Charts Included**:
```typescript
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const pieData = [
  { name: 'خدمات', value: 15000, color: '#0891B2' },
  { name: 'أقساط IVF', value: 8000, color: '#10B981' },
  { name: 'باقات', value: 35000, color: '#F59E0B' },
];
```

---

## 💼 Business Logic

### 1. Hybrid Invoice System

**Rule**: Every payment MUST generate an invoice, regardless of type.

**Why?** 
- Daily cash box reconciliation requires a single source of truth
- Receptionist needs to see ALL transactions in one report

**Implementation**:
```typescript
// Service payment
await invoicesAPI.createServiceInvoice(clinicId, patientId, doctorId, items, 'Cash', 0);

// Installment payment (also creates invoice)
await invoicesAPI.createInstallmentInvoice(clinicId, patientId, doctorId, caseId, installmentId, amount, 'Visa');
```

---

### 2. Multi-Tenancy

All queries filter by `clinic_id`:

```sql
-- RLS Policy Example
CREATE POLICY "Users can view their clinic invoices"
    ON public.invoices FOR SELECT
    USING (clinic_id = auth.uid() OR clinic_id IN (
        SELECT doctor_id FROM public.clinic_staff WHERE user_id = auth.uid()
    ));
```

**Ensures**:
- Doctor A cannot see Doctor B's data
- Staff can only access their assigned clinic

---

### 3. Variable Pricing

**Scenario**: A service costs 500 ج.م normally, but doctor wants to charge 400 ج.م for a specific patient.

**Solution**: Price override in QuickInvoiceModal:
```typescript
// Cart item allows price modification
const handleUpdatePrice = (serviceId: string, price: number) => {
  setCart(cart.map(item =>
    item.service.id === serviceId
      ? { ...item, price, total: price * item.quantity }
      : item
  ));
};
```

Visual warning: "⚠️ Price Modified" appears when price differs from catalog.

---

### 4. Installment Auto-Calculation

When an installment is paid:
1. Mark installment as `is_paid = true`
2. Trigger updates `financial_cases.paid_amount` automatically (via SQL trigger)
3. Check if `remaining_amount <= 0` → Auto-close case

**SQL Trigger**:
```sql
CREATE TRIGGER trigger_update_case_paid_amount
AFTER UPDATE ON public.installments
FOR EACH ROW
WHEN (OLD.is_paid IS DISTINCT FROM NEW.is_paid)
EXECUTE FUNCTION update_case_paid_amount();
```

---

### 5. Discount Logic

**Validation**:
- Discount cannot exceed subtotal
- Discount is stored separately (not embedded in item prices)

**Formula**:
```typescript
const subtotal = items.reduce((sum, item) => sum + item.total, 0);
const total = subtotal - discount;
```

**Why?** Historical accuracy: If you change a service price later, old invoices remain unchanged.

---

## 🧪 Testing Guide

### Test Scenario 1: Create Service Invoice

1. Open `QuickInvoiceModal`
2. Search for patient "أحمد محمد"
3. Add services:
   - Consultation (300 ج.م) x1
   - Ultrasound 4D (500 ج.م) x1
4. Apply 50 ج.م discount
5. Select payment method: Cash
6. Checkout

**Expected**:
- Invoice created with subtotal 800 ج.م, discount 50 ج.م, total 750 ج.م
- Invoice appears in DailyIncomeReport
- Payment method shows "Cash"

---

### Test Scenario 2: Pay IVF Installment

1. Open Patient Profile for "سارة علي"
2. Navigate to `CaseBillingTracker` tab
3. Find installment "Embryo Transfer - 8,000 ج.م"
4. Click "Pay" button
5. Select payment method: Visa
6. Confirm

**Expected**:
- Installment marked as paid (green badge ✅)
- Progress bar updates: e.g., 60% → 83%
- Invoice created with `invoice_type = 'installment'`
- Financial case `paid_amount` increases by 8,000

---

### Test Scenario 3: Bulk Price Update

1. Go to Settings → Services Manager
2. Click "تحديث جماعي" button
3. Enter inflation rate: 10%
4. Confirm

**Expected**:
- All active service prices increase by 10%
- Consultation: 300 → 330 ج.م
- Ultrasound 4D: 500 → 550 ج.م
- Old invoices remain unchanged (historical prices preserved)

---

### Test Scenario 4: Daily Report Export

1. Open DailyIncomeReport
2. Select date: 2025-12-26
3. Click "تصدير CSV"

**Expected**:
- CSV file downloads: `تقرير-2025-12-26.csv`
- Contains columns: Invoice ID, Patient, Amount, Payment Method, Type, Time
- Opens correctly in Excel (UTF-8 encoding)

---

## 🔧 Troubleshooting

### Issue 1: "RLS policy violation"

**Symptom**: Cannot insert/read data from tables.

**Cause**: User is not authenticated or `clinic_id` mismatch.

**Fix**:
```typescript
// Verify user
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);

// Ensure clinic_id matches
const clinicId = user?.id; // For doctors
// OR
const clinicId = staffData?.doctor_id; // For staff
```

---

### Issue 2: Installment not updating financial case

**Symptom**: Payment is recorded but `paid_amount` doesn't increase.

**Cause**: SQL trigger not firing.

**Fix**:
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_case_paid_amount';

-- Manually re-run trigger creation from FINANCIAL_SYSTEM_SCHEMA.sql
```

---

### Issue 3: Invoice items not appearing

**Symptom**: Invoice created but no line items shown.

**Cause**: `invoice_items` insert failed.

**Fix**:
```typescript
// Check invoice_items table
const { data, error } = await supabase
  .from('invoice_items')
  .select('*')
  .eq('invoice_id', invoiceId);

console.log('Items:', data, 'Error:', error);
```

---

### Issue 4: Pie chart not rendering

**Symptom**: Empty chart in DailyIncomeReport.

**Cause**: Missing `recharts` package or no data for selected date.

**Fix**:
```bash
npm install recharts
```

Check data:
```typescript
console.log('Pie Data:', pieData);
// Should have entries like: [{ name: 'خدمات', value: 15000, color: '#0891B2' }]
```

---

## 📊 Sample Data Structure

### Service Invoice JSON

```json
{
  "id": "uuid-123",
  "clinic_id": "doc-uuid",
  "patient_id": "pat-uuid",
  "doctor_id": "doc-uuid",
  "subtotal": 800.00,
  "discount": 50.00,
  "tax": 0.00,
  "total_amount": 750.00,
  "payment_method": "Cash",
  "invoice_type": "service",
  "status": "Paid",
  "invoice_items": [
    {
      "service_name": "Consultation",
      "quantity": 1,
      "unit_price": 300.00,
      "total_price": 300.00
    },
    {
      "service_name": "Ultrasound 4D",
      "quantity": 1,
      "unit_price": 500.00,
      "total_price": 500.00
    }
  ]
}
```

---

### Financial Case with Installments

```json
{
  "id": "case-uuid",
  "patient_id": "pat-uuid",
  "package_id": "pkg-uuid",
  "total_amount": 35000.00,
  "paid_amount": 21000.00,
  "remaining_amount": 14000.00,
  "status": "Open",
  "installments": [
    {
      "title": "Initial Payment",
      "amount": 10000.00,
      "is_paid": true,
      "paid_at": "2025-12-01T10:00:00Z",
      "payment_method": "Cash"
    },
    {
      "title": "Embryo Transfer",
      "amount": 8000.00,
      "is_paid": false,
      "due_date": "2025-12-26"
    }
  ]
}
```

---

## 🚀 Integration Steps

### Step 1: Import Components in App

```typescript
// In your main App.tsx or routing file
import { ServicesManager } from './modules/finance/ServicesManager';
import { QuickInvoiceModal } from './modules/finance/QuickInvoiceModal';
import { CaseBillingTracker } from './modules/finance/CaseBillingTracker';
import { DailyIncomeReport } from './modules/finance/DailyIncomeReport';
```

---

### Step 2: Add to Settings Page

```tsx
// In Settings.tsx
<Tab name="الخدمات والأسعار">
  <ServicesManager clinicId={user.id} />
</Tab>
```

---

### Step 3: Add to Reception Dashboard

```tsx
// In Reception.tsx
const [showQuickInvoice, setShowQuickInvoice] = useState(false);

<button onClick={() => setShowQuickInvoice(true)}>
  فاتورة سريعة
</button>

<QuickInvoiceModal
  clinicId={clinicId}
  doctorId={doctorId}
  isOpen={showQuickInvoice}
  onClose={() => setShowQuickInvoice(false)}
/>
```

---

### Step 4: Add to Patient Profile

```tsx
// In PatientProfile.tsx
<Tab name="المالية">
  <CaseBillingTracker
    patientId={patient.id}
    clinicId={clinicId}
    doctorId={doctorId}
  />
</Tab>
```

---

### Step 5: Add to Main Dashboard

```tsx
// In Dashboard.tsx
<DailyIncomeReport clinicId={user.id} />
```

---

## 📚 API Reference

### Financial Service API

```typescript
import financialService from './services/financialService';

// Services
await financialService.services.getServices(clinicId);
await financialService.services.createService(serviceData);
await financialService.services.updateService(id, updates);
await financialService.services.bulkUpdatePrices(clinicId, percentage);

// Packages
await financialService.packages.getPackages(clinicId);
await financialService.packages.createPackage(packageData);

// Cases
await financialService.cases.getPatientCases(patientId);
await financialService.cases.createCase(caseData);
await financialService.cases.getOpenCases(clinicId);

// Installments
await financialService.installments.getCaseInstallments(caseId);
await financialService.installments.markAsPaid(installmentId, 'Cash');
await financialService.installments.getOverdueInstallments(clinicId);

// Invoices
await financialService.invoices.createServiceInvoice(...);
await financialService.invoices.createInstallmentInvoice(...);
await financialService.invoices.getInvoices(clinicId, startDate, endDate);
await financialService.invoices.getDailyRevenue(clinicId, date);
```

---

### Hooks API

```typescript
import {
  useServices,
  usePackages,
  usePatientCases,
  useCaseInstallments,
  useInvoices,
  useDailyRevenue,
  useOverdueInstallments,
  useOpenCases,
} from './hooks/useFinancial';

// Usage
const { services, loading, refresh } = useServices(clinicId);
const { cases } = usePatientCases(patientId);
const { installments, markAsPaid } = useCaseInstallments(caseId);
const { summary } = useDailyRevenue(clinicId, date);
const { overdueInstallments, count } = useOverdueInstallments(clinicId);
```

---

## 🎉 Success Checklist

✅ SQL schema deployed to Supabase
✅ RLS policies enabled and tested
✅ Sample services inserted
✅ `financialService.ts` imported correctly
✅ All 4 components render without errors
✅ Custom hooks work in test components
✅ Can create service invoice
✅ Can pay installment
✅ Daily report shows correct data
✅ CSV export works
✅ Pie chart renders (requires `recharts`)
✅ Inline price editing works
✅ Bulk price update tested
✅ Multi-tenancy verified (users see only their data)

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review SQL logs in Supabase Dashboard → Database → Logs
3. Enable verbose logging:
   ```typescript
   console.log('Financial Service Response:', data);
   ```

---

## 🔄 Version History

- **v1.0.0** (2025-12-26): Initial release
  - Complete SQL schema with triggers
  - 4 main React components
  - 9 custom hooks
  - Full TypeScript support
  - Recharts integration

---

## 📝 License

This financial system is part of the Nile IVF & Ob/Gyn Center project.

---

**End of Implementation Guide** 🎯
