-- 🔍 تشخيص مشكلة الفواتير المفقودة
-- Doctor ID from console: dd67a83e-0105-4099-bb56-138b88b18f49

-- 1️⃣ أولاً: هل توجد فواتير أصلاً في الجداول؟
SELECT 'invoices' as table_name, COUNT(*) as total_count FROM invoices
UNION ALL
SELECT 'pos_invoices' as table_name, COUNT(*) as total_count FROM pos_invoices;

-- 2️⃣ ما هي الـ clinic_ids الموجودة في جدول الفواتير؟
SELECT DISTINCT clinic_id, COUNT(*) as invoice_count 
FROM invoices 
GROUP BY clinic_id;

-- 3️⃣ ما هي الـ clinic_ids الموجودة في pos_invoices؟
SELECT DISTINCT clinic_id, COUNT(*) as invoice_count 
FROM pos_invoices 
GROUP BY clinic_id;

-- 4️⃣ هل هذا الـ Doctor موجود في جدول doctors؟
SELECT id, name, email, clinic_name 
FROM doctors 
WHERE id = 'dd67a83e-0105-4099-bb56-138b88b18f49';

-- 5️⃣ ما هي الـ statuses الموجودة في الفواتير؟
SELECT DISTINCT status, COUNT(*) as count 
FROM invoices 
GROUP BY status;

SELECT DISTINCT status, COUNT(*) as count 
FROM pos_invoices 
GROUP BY status;

-- 6️⃣ آخر 10 فواتير في النظام (بغض النظر عن الـ clinic_id)
SELECT id, invoice_number, clinic_id, total_amount, status, created_at 
FROM invoices 
ORDER BY created_at DESC 
LIMIT 10;

SELECT id, invoice_number, clinic_id, total_amount, status, created_at 
FROM pos_invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- 7️⃣ إذا كانت الفواتير موجودة لكن بـ clinic_id مختلف، نحتاج نعرف الـ ID الصحيح
-- هل الفواتير مرتبطة بـ user_id بدلاً من clinic_id؟
SELECT 
    i.id,
    i.clinic_id,
    i.total_amount,
    i.status,
    d.id as doctor_id,
    d.name as doctor_name
FROM invoices i
LEFT JOIN doctors d ON i.clinic_id = d.id
LIMIT 10;
