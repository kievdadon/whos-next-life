import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MARKETPLACE-PAYMENT] ${step}${detailsStr}`);
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

    const { orderType, orderId, totalAmount, businessId, driverId } = await req.json();
    logStep("Request data received", { orderType, orderId, totalAmount, businessId, driverId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get business or driver Connect account
    let connectAccountId = null;
    let commissionRate = 0.15; // 15% default commission

    if (orderType === 'product' && businessId) {
      const { data: business } = await supabaseClient
        .from('business_applications')
        .select('stripe_connect_account_id, commission_rate')
        .eq('id', businessId)
        .single();
      
      connectAccountId = business?.stripe_connect_account_id;
      if (business?.commission_rate) commissionRate = business.commission_rate;
    } else if (orderType === 'delivery' && driverId) {
      const { data: driver } = await supabaseClient
        .from('driver_applications')
        .select('stripe_connect_account_id')
        .eq('id', driverId)
        .single();
      
      connectAccountId = driver?.stripe_connect_account_id;
    }

    if (!connectAccountId) {
      throw new Error("No Connect account found for this business/driver");
    }

    logStep("Connect account found", { connectAccountId, commissionRate });

    const commissionAmount = Math.round(totalAmount * commissionRate);
    const payoutAmount = totalAmount - commissionAmount;

    logStep("Payment breakdown", { totalAmount, commissionAmount, payoutAmount });

    // Check if a Stripe customer already exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session with marketplace payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: orderType === 'product' ? 'Product Order' : 'Delivery Service',
              description: `Order #${orderId}`,
            },
            unit_amount: totalAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: commissionAmount,
        transfer_data: {
          destination: connectAccountId,
        },
      },
      success_url: `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/marketplace`,
      metadata: {
        order_type: orderType,
        order_id: orderId,
        business_id: businessId || '',
        driver_id: driverId || '',
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update order with payment information
    const tableName = orderType === 'product' ? 'orders' : 'delivery_orders';
    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({
        stripe_session_id: session.id,
        commission_rate: commissionRate,
        commission_amount: commissionAmount / 100, // Convert back to dollars
        payout_amount: payoutAmount / 100, // Convert back to dollars
        payment_status: 'pending',
      })
      .eq('id', orderId);

    if (updateError) {
      logStep("Error updating order", { error: updateError });
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url,
      commissionAmount: commissionAmount / 100,
      payoutAmount: payoutAmount / 100
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-marketplace-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});