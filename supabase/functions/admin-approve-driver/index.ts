import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-APPROVE-DRIVER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has admin role
    const { data: adminRole, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !adminRole) {
      logStep("Access denied - user is not admin", { userId: user.id });
      return new Response(JSON.stringify({ error: "Unauthorized - admin access required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Input validation
    const body = await req.json();
    
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { applicationId, action } = body;

    // Validate applicationId (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!applicationId || typeof applicationId !== 'string' || !uuidRegex.test(applicationId)) {
      return new Response(
        JSON.stringify({ error: 'Valid applicationId (UUID) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    if (!action || (action !== 'approve' && action !== 'reject')) {
      return new Response(
        JSON.stringify({ error: 'Action must be "approve" or "reject"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Processing driver application", { applicationId, action });

    // Update driver application status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updatedApplication, error: updateError } = await supabaseClient
      .from('driver_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select('*')
      .single();

    if (updateError) {
      logStep("Error updating application", { error: updateError });
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    logStep("Successfully updated driver application", { 
      applicationId, 
      action, 
      driverName: updatedApplication.full_name 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      application: updatedApplication,
      message: `Driver application ${action}d successfully`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-approve-driver", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});