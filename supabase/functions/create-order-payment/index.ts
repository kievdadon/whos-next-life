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
    console.log("🚀 Order payment function started");
    
    const { 
      deliveryInfo, 
      cartItems, 
      storeInfo, 
      totals,
      wellnessDiscount = false
    } = await req.json();
    
    console.log("🩺 Wellness discount applied:", wellnessDiscount);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!deliveryInfo.email || !emailRegex.test(deliveryInfo.email)) {
      console.error("❌ Invalid email format:", deliveryInfo.email);
      return new Response(JSON.stringify({ 
        error: "Invalid email address format" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role for secure operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user if authenticated (optional for guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    console.log("👤 User authenticated:", !!user);

    // Get business Stripe Connect account if business_id is provided
    let businessConnectAccount = null;
    if (storeInfo.businessId) {
      const { data: businessData, error: businessError } = await supabaseClient
        .from('business_applications')
        .select('stripe_connect_account_id, business_name')
        .eq('id', storeInfo.businessId)
        .single();

      if (!businessError && businessData?.stripe_connect_account_id) {
        businessConnectAccount = businessData.stripe_connect_account_id;
        console.log("🏢 Business Stripe Connect account found:", businessConnectAccount);
      } else {
        console.log("⚠️ No Stripe Connect account for business, payment goes to platform");
      }
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY not found");
      return new Response(JSON.stringify({ 
        error: "Payment system configuration error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27",
    });

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.name} - ${storeInfo.name}`,
          description: item.description,
          // Only include images if they are valid URLs (not emojis)
          ...(item.image && item.image.startsWith('http') ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee
    if (totals.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Fee",
          },
          unit_amount: Math.round(totals.deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // Add tax
    if (totals.tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tax",
          },
          unit_amount: Math.round(totals.tax * 100),
        },
        quantity: 1,
      });
    }

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ 
      email: deliveryInfo.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Calculate platform commission on order (default 15%, wellness discount reduces to 10%)
    const commissionRate = wellnessDiscount ? 0.10 : 0.15;
    const commissionAmount = totals.subtotal * commissionRate;
    const payoutAmount = totals.subtotal - commissionAmount;
    
    console.log(`💰 Commission: ${(commissionRate * 100)}% ($${commissionAmount.toFixed(2)}), Payout to business: $${payoutAmount.toFixed(2)}`);

    // Create Stripe checkout session with Connect payment splitting
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : deliveryInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/delivery`,
      payment_intent_data: {
        metadata: {
          store_name: storeInfo.name,
          customer_name: deliveryInfo.name,
          delivery_address: deliveryInfo.address,
        },
      },
    };

    // If business has Connect account, split payment automatically
    if (businessConnectAccount) {
      // Application fee is the platform commission (in cents)
      const applicationFeeAmount = Math.round(commissionAmount * 100);
      
      sessionConfig.payment_intent_data.application_fee_amount = applicationFeeAmount;
      sessionConfig.payment_intent_data.transfer_data = {
        destination: businessConnectAccount,
      };
      
      console.log(`💳 Stripe Connect payment split: Platform fee $${commissionAmount.toFixed(2)}, Business receives $${payoutAmount.toFixed(2)}`);
    } else {
      console.log("💵 Payment to platform account (no Connect split)");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Calculate estimated delivery time (30-45 minutes from now)
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

    // Calculate driver earnings and commission
    const driverEarning = totals.deliveryFee * 0.8;
    const companyCommission = totals.deliveryFee * 0.2;

    // Create order in database with status "pending" so drivers can see it
    const { data: orderData, error: orderError } = await supabaseClient
      .from("delivery_orders")
      .insert({
        customer_id: user?.id || null,
        customer_email: deliveryInfo.email,
        customer_name: deliveryInfo.name,
        customer_phone: deliveryInfo.phone,
        store_name: storeInfo.name,
        delivery_address: deliveryInfo.address,
        customer_address: deliveryInfo.address,
        restaurant_address: storeInfo?.address || storeInfo?.name || "N/A",
        cart_items: cartItems,
        subtotal: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        tax: totals.tax,
        total_amount: totals.total,
        payment_status: "pending",
        order_status: "pending",
        status: "pending", // Available for drivers to claim
        stripe_session_id: session.id,
        estimated_delivery_time: estimatedDeliveryTime.toISOString(),
        driver_earning: driverEarning,
        company_commission: companyCommission,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        payout_amount: payoutAmount,
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("✅ Order created successfully:", orderData.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      orderId: orderData.id,
      estimatedDeliveryTime: estimatedDeliveryTime.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in order payment function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});