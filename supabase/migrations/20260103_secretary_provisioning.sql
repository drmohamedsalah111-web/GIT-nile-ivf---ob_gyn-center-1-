-- ============================================================================
-- 🔐 SECRETARY PROVISIONING SCHEMA
-- Super Admin can create secretary accounts and link them to clinics
-- ============================================================================

-- ============================================================================
-- 1️⃣ Add must_change_password column to doctors table
-- (We use doctors table since that's where user profiles are stored)
-- ============================================================================

ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.doctors.must_change_password IS 
  'If true, user must change password on next login (used for provisioned accounts)';

-- ============================================================================
-- 2️⃣ Create clinic_members table (links users to clinics)
-- This allows secretaries to be linked to specific doctors/clinics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'secretary' CHECK (role IN ('secretary', 'nurse', 'receptionist', 'admin')),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate memberships
    UNIQUE(user_id, clinic_id)
);

COMMENT ON TABLE public.clinic_members IS 'Links staff members (secretaries, nurses) to clinics/doctors';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_clinic_members_user_id ON public.clinic_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_clinic_id ON public.clinic_members(clinic_id);

-- ============================================================================
-- 3️⃣ RLS Policies for clinic_members
-- ============================================================================

ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

-- Super Admin can do anything
CREATE POLICY "Super admin full access on clinic_members" ON public.clinic_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() OR email = auth.email()
        )
    );

-- Doctors can view their own clinic members
CREATE POLICY "Doctors can view their clinic members" ON public.clinic_members
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON public.clinic_members
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================================================
-- 4️⃣ Policy for users to update their own must_change_password flag
-- ============================================================================

-- Allow users to update their own record (specifically the password flag)
CREATE POLICY "Users can update own must_change_password" ON public.doctors
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5️⃣ Function to create secretary (called by Edge Function with service_role)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_secretary_profile(
    p_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_clinic_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doctor_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Create doctor profile for the secretary
    INSERT INTO public.doctors (
        user_id,
        email,
        name,
        user_role,
        secretary_doctor_id,
        must_change_password
    ) VALUES (
        p_user_id,
        p_email,
        p_name,
        'secretary',
        p_clinic_id,
        true
    )
    RETURNING id INTO v_doctor_id;
    
    -- 2. Create clinic membership
    INSERT INTO public.clinic_members (
        user_id,
        clinic_id,
        role,
        is_active
    ) VALUES (
        p_user_id,
        p_clinic_id,
        'secretary',
        true
    );
    
    -- 3. Return result
    v_result := jsonb_build_object(
        'success', true,
        'doctor_id', v_doctor_id,
        'message', 'Secretary profile created successfully'
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_secretary_profile TO service_role;

-- ============================================================================
-- 6️⃣ Helpful view for Super Admin
-- ============================================================================

CREATE OR REPLACE VIEW public.v_all_staff AS
SELECT 
    d.id,
    d.user_id,
    d.name,
    d.email,
    d.phone,
    d.user_role,
    d.must_change_password,
    d.created_at,
    -- For secretaries, get the doctor they work for
    CASE 
        WHEN d.user_role = 'secretary' THEN doc.name
        ELSE NULL
    END as works_for_doctor,
    CASE 
        WHEN d.user_role = 'secretary' THEN doc.clinic_name
        ELSE d.clinic_name
    END as clinic_name
FROM public.doctors d
LEFT JOIN public.doctors doc ON d.secretary_doctor_id = doc.id
ORDER BY d.created_at DESC;

COMMENT ON VIEW public.v_all_staff IS 'All staff members (doctors and secretaries) with their clinic info';

-- ============================================================================
-- ✅ DONE
-- ============================================================================
SELECT 'Secretary provisioning schema created successfully!' as status;
