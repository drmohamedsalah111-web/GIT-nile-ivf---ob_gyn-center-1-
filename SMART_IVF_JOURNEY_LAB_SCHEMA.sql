-- ============================================================================
-- SMART IVF JOURNEY - EXTENDED STAGES (OPU, LAB, TRANSFER)
-- ============================================================================

-- 1. OPU (Oocyte Pick-Up) Records
CREATE TABLE IF NOT EXISTS smart_opu_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  opu_date DATE NOT NULL DEFAULT CURRENT_DATE,
  oocytes_retrieved INTEGER NOT NULL DEFAULT 0,
  
  -- Maturity details
  mii_count INTEGER DEFAULT 0,
  mi_count INTEGER DEFAULT 0,
  gv_count INTEGER DEFAULT 0,
  atretic_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Embryo Lab Follow-up
CREATE TABLE IF NOT EXISTS smart_embryo_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE,
  
  embryo_number INTEGER NOT NULL,
  fertilization_status TEXT CHECK (status IN ('fertilized', 'failed', 'abnormal')),
  
  -- Individual Status
  status TEXT NOT NULL DEFAULT 'developing' CHECK (
    status IN ('developing', 'frozen', 'transferred', 'arrested', 'discarded')
  ),
  
  grade TEXT, -- e.g., 'Grade A', '4AA'
  day_reached INTEGER DEFAULT 0, -- Day 3, Day 5, etc.
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(cycle_id, embryo_number)
);

-- 3. Transfer Preparation
CREATE TABLE IF NOT EXISTS smart_transfer_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES smart_ivf_cycles(id) ON DELETE CASCADE UNIQUE,
  
  prep_start_date DATE,
  planned_transfer_date DATE,
  
  protocol_type TEXT, -- e.g., 'Natural', 'HRT'
  endometrium_thickness DECIMAL(4,2),
  
  medications JSONB DEFAULT '[]', -- List of medications for prep
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE smart_opu_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_embryo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_transfer_prep ENABLE ROW LEVEL SECURITY;

-- Basic policies (following smart_ivf_cycles pattern)
CREATE POLICY "Users can manage their own OPU records" ON smart_opu_records
  FOR ALL USING (true); -- In a real app, this would check doctor/patient ID

CREATE POLICY "Users can manage their own embryo records" ON smart_embryo_records
  FOR ALL USING (true);

CREATE POLICY "Users can manage their own transfer prep" ON smart_transfer_prep
  FOR ALL USING (true);
