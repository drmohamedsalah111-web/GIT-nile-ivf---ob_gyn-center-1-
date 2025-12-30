-- Test query to verify revenue by category data
-- Run this to see if the dashboard will get real data

-- 1. Check if we have invoices
SELECT 
    COUNT(*) as total_invoices,
    SUM(total_amount) as total_revenue,
    clinic_id
FROM invoices
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY clinic_id;

-- 2. Check if we have invoice_items
SELECT 
    COUNT(*) as total_items,
    SUM(total_price) as total_amount
FROM invoice_items
WHERE invoice_id IN (
    SELECT id FROM invoices 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
);

-- 3. Check services with categories
SELECT 
    category,
    COUNT(*) as service_count
FROM services
WHERE is_active = true
GROUP BY category
ORDER BY service_count DESC;

-- 4. Check invoice items with service names
SELECT 
    ii.service_name,
    SUM(ii.total_price) as total_revenue,
    COUNT(*) as count
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ii.service_name
ORDER BY total_revenue DESC
LIMIT 10;

