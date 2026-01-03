// ============================================================================
// ⚡ CREATE SECRETARY - Supabase Edge Function
// Creates a new secretary account and links to a clinic
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateSecretaryRequest {
  email: string;
  password: string;
  fullName: string;
  clinicId: string;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1️⃣ Validate request method
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // 2️⃣ Parse request body
    const body: CreateSecretaryRequest = await req.json();
    const { email, password, fullName, clinicId, phone } = body;

    // Validate required fields
    if (!email || !password || !fullName || !clinicId) {
      throw new Error("Missing required fields: email, password, fullName, clinicId");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate password length
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // 3️⃣ Initialize Supabase Admin Client with SERVICE_ROLE key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseServiceKey) {
      throw new Error("Service role key not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4️⃣ Verify the calling user is a Super Admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      throw new Error("Invalid authentication token");
    }

    // Check if caller is Super Admin
    const { data: adminCheck } = await supabaseAdmin
      .from("admins")
      .select("id")
      .or(`user_id.eq.${callingUser.id},email.eq.${callingUser.email}`)
      .single();

    if (!adminCheck) {
      throw new Error("Unauthorized: Only Super Admins can create secretaries");
    }

    // 5️⃣ Verify the clinic exists
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("doctors")
      .select("id, name, clinic_name")
      .eq("id", clinicId)
      .eq("user_role", "doctor")
      .single();

    if (clinicError || !clinic) {
      throw new Error(`Clinic not found with ID: ${clinicId}`);
    }

    // 6️⃣ Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("doctors")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error(`Email already registered: ${email}`);
    }

    // 7️⃣ Create the user account using Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: "secretary",
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("User creation returned no user object");
    }

    // 8️⃣ Create the secretary profile using our DB function
    const { data: profileResult, error: profileError } = await supabaseAdmin
      .rpc("create_secretary_profile", {
        p_user_id: newUser.user.id,
        p_email: email,
        p_name: fullName,
        p_clinic_id: clinicId,
      });

    if (profileError) {
      // Rollback: Delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    if (!profileResult?.success) {
      // Rollback: Delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(profileResult?.error || "Failed to create secretary profile");
    }

    // 9️⃣ Update phone if provided
    if (phone) {
      await supabaseAdmin
        .from("doctors")
        .update({ phone })
        .eq("user_id", newUser.user.id);
    }

    // 🔟 Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Secretary created successfully",
        data: {
          userId: newUser.user.id,
          email: email,
          fullName: fullName,
          clinicId: clinicId,
          clinicName: clinic.clinic_name || clinic.name,
          mustChangePassword: true,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating secretary:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
