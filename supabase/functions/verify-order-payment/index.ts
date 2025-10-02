import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Payment verification function started");
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log("✅ User authenticated:", user.id);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("💳 Stripe session status:", session.payment_status);

    // Update order status based on payment status
    let orderStatus = "pending";
    let paymentStatus = "pending";

    if (session.payment_status === "paid") {
      paymentStatus = "paid";
      orderStatus = "confirmed";
    } else if (session.payment_status === "unpaid") {
      paymentStatus = "failed";
      orderStatus = "cancelled";
    }

    // Update order in database
    const { data: orderData, error: updateError } = await supabaseClient
      .from("delivery_orders")
      .update({
        payment_status: paymentStatus,
        order_status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", sessionId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating order:", updateError);
      throw new Error("Failed to update order status");
    }

    console.log("✅ Order status updated:", orderData.id, orderStatus);

    return new Response(JSON.stringify({
      success: true,
      order: orderData,
      paymentStatus: session.payment_status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in payment verification:", error);
    
    // Return generic error message to client
    const errorMessage = error instanceof Error && error.message.includes('Authentication')
      ? error.message
      : "Payment verification failed. Please try again.";
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes('Authentication') ? 401 : 500,
    });
  }
});