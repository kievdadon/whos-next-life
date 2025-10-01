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
    console.log("🚀 create-order-payment-intent started");

    const {
      deliveryInfo,
      cartItems,
      storeInfo,
      totals,
    } = await req.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!deliveryInfo?.email || !emailRegex.test(deliveryInfo.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Optional auth (guest checkout allowed)
    let user = null as any;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePublicKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    if (!stripeSecretKey || !stripePublicKey) {
      console.error("❌ Missing Stripe keys");
      return new Response(
        JSON.stringify({ error: "Payment system configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Ensure customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: deliveryInfo.email, limit: 1 });
    if (customers.data.length > 0) customerId = customers.data[0].id;
    if (!customerId) {
      const created = await stripe.customers.create({
        email: deliveryInfo.email,
        name: deliveryInfo.name,
        address: undefined,
        phone: deliveryInfo.phone,
      });
      customerId = created.id;
    }

    // Create PaymentIntent for total amount
    const amount = Math.round((totals?.total ?? 0) * 100);
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: deliveryInfo.email,
      metadata: {
        store_name: storeInfo?.name ?? "",
        customer_name: deliveryInfo.name,
        delivery_address: deliveryInfo.address,
      },
    });

    // Estimated delivery time ≈ 35 minutes
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

    // Compute earnings split from delivery fee (80% driver / 20% company)
    const deliveryFeeNum = Number(totals?.deliveryFee ?? 0);
    const driverEarning = Math.max(0, Math.round(deliveryFeeNum * 0.8 * 100) / 100);
    const companyCommission = Math.max(0, Math.round((deliveryFeeNum - driverEarning) * 100) / 100);

    // Record order
    const { data: order, error: orderError } = await supabase
      .from("delivery_orders")
      .insert({
        customer_id: user?.id || null,
        customer_email: deliveryInfo.email,
        customer_name: deliveryInfo.name,
        customer_phone: deliveryInfo.phone,
        store_name: storeInfo?.name ?? null,
        delivery_address: deliveryInfo.address,
        customer_address: deliveryInfo.address,
        restaurant_address: storeInfo?.address || storeInfo?.name || "N/A",
        cart_items: cartItems,
        subtotal: totals?.subtotal ?? null,
        delivery_fee: deliveryFeeNum,
        driver_earning: driverEarning,
        company_commission: companyCommission,
        tax: totals?.tax ?? null,
        total_amount: totals?.total ?? null,
        payment_status: "pending",
        order_status: "pending",
        stripe_session_id: paymentIntent.id, // reuse column to store PI id
        estimated_delivery_time: estimatedDeliveryTime.toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        publishableKey: stripePublicKey,
        orderId: order.id,
        estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("❌ Error in create-order-payment-intent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
