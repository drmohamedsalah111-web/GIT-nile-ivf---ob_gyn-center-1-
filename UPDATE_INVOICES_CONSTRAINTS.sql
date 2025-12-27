-- ============================================================================
-- تحديث constraints جدول الفواتير (Update Invoices Constraints)
-- ============================================================================
-- هذا السكريبت يحدّث الـ check constraints لتتوافق مع التطبيق
-- ملاحظة: التطبيق يستخدم PascalCase مثل 'Service', 'Installment'
-- ============================================================================

-- ============================================================================
-- 1. حذف الـ constraints القديمة
-- ============================================================================
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- ============================================================================
-- 2. إضافة الـ constraints الجديدة (تقبل كلا الحالتين)
-- ============================================================================

-- نوع الفاتورة (يقبل uppercase و lowercase)
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_type_check 
  CHECK (invoice_type IN ('service', 'package', 'installment', 'other', 'Service', 'Package', 'Installment', 'Other'));

-- طريقة الدفع (يقبل uppercase و lowercase)
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check 
  CHECK (payment_method IN ('cash', 'visa', 'bank_transfer', 'insurance', 'deferred', 'Cash', 'Visa', 'Bank Transfer', 'Insurance', 'Deferred'));

-- الحالة (يقبل uppercase و lowercase)
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'paid', 'cancelled', 'refunded', 'Draft', 'Paid', 'Cancelled', 'Refunded'));

-- ============================================================================
-- 3. تحديث القيم الافتراضية
-- ============================================================================
ALTER TABLE invoices ALTER COLUMN invoice_type SET DEFAULT 'service';
ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'paid';

-- ============================================================================
-- التحقق من النجاح
-- ============================================================================
SELECT 
  '✅ تم تحديث constraints جدول الفواتير بنجاح' as status,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE 'invoices_%_check'
ORDER BY constraint_name;
