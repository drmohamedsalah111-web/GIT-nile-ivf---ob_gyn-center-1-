-- ================================================
-- CREATE INVOICE_ITEMS TABLE
-- ================================================
-- جدول تفاصيل عناصر الفاتورة
-- ================================================

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invoice_items IS 'تفاصيل عناصر الفواتير';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can create invoice items" ON invoice_items;

CREATE POLICY "Users can view their invoice items"
    ON invoice_items FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE clinic_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create invoice items"
    ON invoice_items FOR INSERT
    WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE clinic_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

-- Verify
SELECT 
    '✅ invoice_items table created successfully' as status,
    COUNT(*) as row_count
FROM invoice_items;

-- ================================================
-- ADD MISSING COLUMNS TO INVOICES TABLE
-- ================================================

-- Add invoice_number if missing
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;

-- Add invoice_type if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'invoice_type'
    ) THEN
        ALTER TABLE invoices ADD COLUMN invoice_type TEXT DEFAULT 'Service' 
            CHECK (invoice_type IN ('Service', 'Package', 'Installment', 'Other'));
        RAISE NOTICE '✅ Added invoice_type column';
    END IF;
END $$;

-- Add created_by if missing (to track which secretary created it)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES doctors(id);

-- Create index on invoice_number
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);

-- ================================================
-- SUMMARY
-- ================================================
-- ✅ invoice_items table created
-- ✅ RLS policies enabled
-- ✅ Missing columns added to invoices table
-- ✅ Indexes created for performance
-- ================================================
