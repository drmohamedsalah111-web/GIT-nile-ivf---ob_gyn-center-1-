import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create a client to verify the user's JWT
    // We use the ANON key (or just the incoming token) to create a client 
    // that respects the user's auth state.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Create a regular client to check if the token is valid
    const verificationClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Get the user from the token. If this fails, the token is invalid/expired.
    const { data: { user }, error: authError } = await verificationClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse and Validate input
    const { name, phone, age, doctor_id, user_id, husband_name, history } = await req.json()

    if (!name || !phone) {
      throw new Error('Name and Phone are required')
    }

    // 3. Perform the privileged insert using Service Role Key
    // This bypasses RLS, which is what we want for this specific operation
    // that was failing due to complex RLS/Foreign Key rules for receptionists.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await adminClient
      .from('patients')
      .insert([
        {
          name,
          phone,
          age,
          doctor_id,
          husband_name,
          history,
          user_id: user_id || user.id, // Use passed user_id or the authenticated user's ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Insert Error:', error)
      throw error
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
