import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { accountType, businessData } = await req.json();
    logStep("Request data received", { accountType, businessData });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual", // Can be updated based on business type
      individual: {
        email: user.email,
        first_name: businessData.contact_name?.split(' ')[0] || 'Business',
        last_name: businessData.contact_name?.split(' ')[1] || 'Owner',
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    logStep("Stripe Connect account created", { accountId: account.id });

    // Update the appropriate table with Stripe Connect account ID
    const tableName = accountType === 'business' ? 'business_applications' : 'driver_applications';
    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({ 
        stripe_connect_account_id: account.id,
        routing_number: businessData.routing_number,
        account_number: businessData.account_number,
        account_holder_name: businessData.account_holder_name
      })
      .eq('email', user.email);

    if (updateError) {
      logStep("Error updating database", { error: updateError });
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/business-dashboard?refresh=true`,
      return_url: `${req.headers.get("origin")}/business-dashboard?setup=complete`,
      type: "account_onboarding",
    });

    logStep("Account link created", { url: accountLink.url });

    return new Response(JSON.stringify({ 
      accountId: account.id, 
      onboardingUrl: accountLink.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-connect-account", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});