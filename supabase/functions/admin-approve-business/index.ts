import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-APPROVE-BUSINESS] ${step}${detailsStr}`);
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

    logStep("User authenticated", { userId: user.id });

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (adminError || !adminCheck) {
      throw new Error("Unauthorized: Admin access required");
    }

    logStep("Admin access verified");

    const { businessId, action } = await req.json();
    
    if (!businessId || !['approve', 'reject'].includes(action)) {
      throw new Error("Invalid request: businessId and action (approve/reject) required");
    }

    logStep("Request validated", { businessId, action });

    // Update business application status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updatedBusiness, error: updateError } = await supabaseClient
      .from('business_applications')
      .update(updateData)
      .eq('id', businessId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`Failed to update business: ${updateError.message}`);
    }

    logStep("Business status updated", { 
      businessId, 
      newStatus: updatedBusiness.status,
      approvedAt: updatedBusiness.approved_at 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      business: updatedBusiness,
      message: `Business ${action}d successfully`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});