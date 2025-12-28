-- Fix for missing columns in appointments table
-- This script adds the columns required by secretary_queue_view

-- 1. Create payment_status enum if not exists
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'partially_paid', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add missing columns to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending', -- Using text to avoid enum complexities if type exists differently, or cast to enum if preferred. Let's stick to strict migration style but safe.
ADD COLUMN IF NOT EXISTS checked_in_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS amount_required numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2) DEFAULT 0;

-- If you want strictly the enum type:
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending';
-- But seeing as I don't know if the type creation succeeded, I'll assume text or try safe alter.

-- Let's try to match the migration strictly to avoid type mismatches in future
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE appointments ADD COLUMN payment_status payment_status_enum DEFAULT 'pending';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN undefined_object THEN 
            -- Fallback if enum doesn't exist (should be caught by step 1, but just in case)
            ALTER TABLE appointments ADD COLUMN payment_status text DEFAULT 'pending';
    END;
END $$;

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
