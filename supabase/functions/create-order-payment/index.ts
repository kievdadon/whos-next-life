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
      totals 
    } = await req.json();

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
      apiVersion: "2023-10-16",
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : deliveryInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/order-checkout`,
      payment_intent_data: {
        metadata: {
          store_name: storeInfo.name,
          customer_name: deliveryInfo.name,
          delivery_address: deliveryInfo.address,
        },
      },
    });

    // Calculate estimated delivery time (30-45 minutes from now)
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

    // Create order in database
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
        stripe_session_id: session.id,
        estimated_delivery_time: estimatedDeliveryTime.toISOString(),
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